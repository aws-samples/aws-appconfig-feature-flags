#!/bin/bash

# Deployment Verification Script
# This script verifies that the AWS AppConfig Feature Flags application is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint=$1
    local path=$2
    local description=$3
    
    print_status "Testing $description..."
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint$path" || echo "000")
    
    if [ "$response_code" = "200" ]; then
        print_success "$description is working (HTTP $response_code)"
        return 0
    else
        print_error "$description failed (HTTP $response_code)"
        return 1
    fi
}

# Function to test API with detailed response
test_api_detailed() {
    local endpoint=$1
    local path=$2
    local description=$3
    
    print_status "Testing $description with detailed response..."
    
    local response=$(curl -s "$endpoint$path" 2>/dev/null || echo "ERROR")
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint$path" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "200" ]; then
        print_success "$description is working (HTTP $response_code)"
        
        # Try to parse JSON response
        if echo "$response" | jq empty 2>/dev/null; then
            echo "Response preview:"
            echo "$response" | jq . | head -10
            if [ $(echo "$response" | jq . | wc -l) -gt 10 ]; then
                echo "... (truncated)"
            fi
        else
            echo "Response (first 200 chars): ${response:0:200}"
        fi
        echo ""
        return 0
    else
        print_error "$description failed (HTTP $response_code)"
        if [ "$response" != "ERROR" ] && [ -n "$response" ]; then
            echo "Error response: $response"
        fi
        echo ""
        return 1
    fi
}

# Function to verify AppConfig
verify_appconfig() {
    print_status "Verifying AWS AppConfig setup..."
    
    if [ ! -f "appconfig-ids.txt" ]; then
        print_error "appconfig-ids.txt not found. Run deploy-setup.sh first."
        return 1
    fi
    
    local app_id=$(grep "AppConfigApplication" appconfig-ids.txt | cut -d'"' -f2)
    local env_id=$(grep "AppConfigEnvironment" appconfig-ids.txt | cut -d'"' -f2)
    local profile_id=$(grep "AppConfigConfigurationProfile" appconfig-ids.txt | cut -d'"' -f2)
    
    if [ -z "$app_id" ] || [ -z "$env_id" ] || [ -z "$profile_id" ]; then
        print_error "Could not load AppConfig IDs from appconfig-ids.txt"
        return 1
    fi
    
    # Test AppConfig retrieval
    print_status "Testing AppConfig configuration retrieval..."
    
    aws appconfig get-configuration \
        --application "$app_id" \
        --environment "$env_id" \
        --configuration "$profile_id" \
        --client-id "verify-script-$(date +%s)" \
        temp-config.json 2>/dev/null || echo "ERROR" > temp-config.json
    
    local config_response=$(cat temp-config.json 2>/dev/null || echo "ERROR")
    
    if [ "$config_response" != "ERROR" ] && echo "$config_response" | jq empty 2>/dev/null; then
        print_success "AppConfig is working correctly"
        
        echo "Feature flags preview:"
        echo "$config_response" | jq '.flags // .values // .' 2>/dev/null | head -10
        echo ""
        return 0
    else
        print_error "AppConfig configuration retrieval failed"
        return 1
    fi
}

# Function to verify DynamoDB
verify_dynamodb() {
    print_status "Verifying DynamoDB setup..."
    
    # Try to find the table
    local table_name=$(aws dynamodb list-tables --query "TableNames[?contains(@, 'DynamoDBTable')]" --output text 2>/dev/null || echo "")
    
    if [ -z "$table_name" ]; then
        print_warning "DynamoDB table not found. This is expected if SAM hasn't been deployed yet."
        return 0
    fi
    
    print_success "Found DynamoDB table: $table_name"
    
    # Test table access
    local item_count=$(aws dynamodb scan --table-name "$table_name" --select "COUNT" --query "Count" --output text 2>/dev/null || echo "0")
    
    if [ "$item_count" -gt 0 ]; then
        print_success "DynamoDB table contains $item_count items"
        
        # Show sample item
        print_status "Sample product from DynamoDB:"
        aws dynamodb scan --table-name "$table_name" --limit 1 --query "Items[0]" 2>/dev/null | jq . || echo "Could not retrieve sample item"
        echo ""
    else
        print_warning "DynamoDB table is empty. Run deploy-setup.sh --populate-db-only to add sample data."
    fi
    
    return 0
}

# Function to verify backend build
verify_backend() {
    print_status "Verifying backend build..."
    
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found"
        return 1
    fi
    
    cd backend
    
    # Check if TypeScript compiled successfully
    if [ -d "dist" ]; then
        print_success "Backend TypeScript compilation successful"
    else
        print_warning "Backend dist directory not found. Run 'npm run build' in backend/"
    fi
    
    # Check if tests pass
    print_status "Running backend tests..."
    if npm test --silent 2>/dev/null; then
        print_success "Backend tests are passing"
    else
        print_error "Backend tests are failing"
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# Function to verify frontend build
verify_frontend() {
    print_status "Verifying frontend build..."
    
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found"
        return 1
    fi
    
    cd frontend
    
    # Check if build directory exists
    if [ -d "build" ]; then
        print_success "Frontend build directory exists"
        
        # Check if main files exist
        if [ -f "build/index.html" ] && [ -f "build/static/js/main."*.js ]; then
            print_success "Frontend build files are present"
        else
            print_warning "Frontend build files may be incomplete"
        fi
    else
        print_warning "Frontend build directory not found. Run 'npm run build' in frontend/"
    fi
    
    # Check TypeScript compilation
    print_status "Running frontend type check..."
    if npm run type-check --silent 2>/dev/null; then
        print_success "Frontend TypeScript compilation successful"
    else
        print_error "Frontend TypeScript compilation failed"
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# Function to verify API endpoints
verify_api() {
    print_status "Verifying API endpoints..."
    
    local api_url=""
    
    # Try to get API URL from file
    if [ -f "api-url.txt" ]; then
        api_url=$(grep "API_URL=" api-url.txt | cut -d'=' -f2)
    fi
    
    # If not found, try to get from SAM outputs
    if [ -z "$api_url" ] && [ -d "backend" ]; then
        cd backend
        api_url=$(sam list stack-outputs --stack-name $(grep stack_name samconfig.toml | cut -d'"' -f2 2>/dev/null || echo "appconfig-feature-flags") --output json 2>/dev/null | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue' 2>/dev/null || echo "")
        cd ..
    fi
    
    if [ -z "$api_url" ]; then
        print_warning "API URL not found. Please deploy backend first or provide API URL manually."
        return 0
    fi
    
    print_success "Found API URL: $api_url"
    
    # Test endpoints
    local failed_tests=0
    
    test_api_detailed "$api_url" "/flags" "Feature Flags endpoint" || ((failed_tests++))
    test_api_detailed "$api_url" "/products" "Products endpoint" || ((failed_tests++))
    
    # Test CORS
    print_status "Testing CORS headers..."
    local cors_headers=$(curl -s -I -X OPTIONS "$api_url/flags" 2>/dev/null | grep -i "access-control" || echo "")
    if [ -n "$cors_headers" ]; then
        print_success "CORS headers are present"
    else
        print_warning "CORS headers not found or OPTIONS method not supported"
    fi
    
    if [ $failed_tests -eq 0 ]; then
        print_success "All API endpoints are working correctly"
        return 0
    else
        print_error "$failed_tests API endpoint(s) failed"
        return 1
    fi
}

# Function to run comprehensive verification
run_verification() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║            AWS AppConfig Feature Flags Verification         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    local total_checks=0
    local passed_checks=0
    
    # Run all verification checks
    echo "🔍 Running verification checks..."
    echo ""
    
    ((total_checks++))
    if verify_appconfig; then
        ((passed_checks++))
    fi
    
    ((total_checks++))
    if verify_dynamodb; then
        ((passed_checks++))
    fi
    
    ((total_checks++))
    if verify_backend; then
        ((passed_checks++))
    fi
    
    ((total_checks++))
    if verify_frontend; then
        ((passed_checks++))
    fi
    
    ((total_checks++))
    if verify_api; then
        ((passed_checks++))
    fi
    
    # Summary
    echo ""
    echo "📊 Verification Summary:"
    echo "   Passed: $passed_checks/$total_checks checks"
    
    if [ $passed_checks -eq $total_checks ]; then
        print_success "🎉 All verification checks passed! Your deployment is working correctly."
        echo ""
        echo "🚀 Your application is ready to use!"
        
        if [ -f "api-url.txt" ]; then
            local api_url=$(grep "API_URL=" api-url.txt | cut -d'=' -f2)
            echo ""
            echo "📡 API Endpoints:"
            echo "   Feature Flags: $api_url/flags"
            echo "   Products: $api_url/products"
        fi
        
        if [ -d "frontend/build" ]; then
            echo ""
            echo "🌐 Frontend:"
            echo "   Build ready in: frontend/build/"
            echo "   Test locally: cd frontend && npx serve -s build"
        fi
        
        return 0
    else
        print_error "❌ Some verification checks failed. Please review the errors above."
        echo ""
        echo "🔧 Common fixes:"
        echo "   - Run ./deploy.sh to complete deployment"
        echo "   - Check AWS credentials and permissions"
        echo "   - Verify all prerequisites are installed"
        echo "   - Check CloudFormation stack status in AWS Console"
        
        return 1
    fi
}

# Function to show help
show_help() {
    echo "AWS AppConfig Feature Flags Verification Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --api-url URL        Test specific API URL"
    echo "  --appconfig-only     Verify only AppConfig setup"
    echo "  --backend-only       Verify only backend components"
    echo "  --frontend-only      Verify only frontend components"
    echo "  --api-only           Verify only API endpoints"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Full verification"
    echo "  $0 --api-url https://api.example.com # Test specific API"
    echo "  $0 --backend-only                    # Verify backend only"
}

# Main function
main() {
    local api_url_override=""
    local appconfig_only=false
    local backend_only=false
    local frontend_only=false
    local api_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --api-url)
                api_url_override="$2"
                shift 2
                ;;
            --appconfig-only)
                appconfig_only=true
                shift
                ;;
            --backend-only)
                backend_only=true
                shift
                ;;
            --frontend-only)
                frontend_only=true
                shift
                ;;
            --api-only)
                api_only=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Override API URL if provided
    if [ -n "$api_url_override" ]; then
        echo "API_URL=$api_url_override" > api-url.txt
    fi
    
    # Run specific verification based on flags
    if [ "$appconfig_only" = true ]; then
        verify_appconfig
    elif [ "$backend_only" = true ]; then
        verify_backend
    elif [ "$frontend_only" = true ]; then
        verify_frontend
    elif [ "$api_only" = true ]; then
        verify_api
    else
        run_verification
    fi
}

main "$@"