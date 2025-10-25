#!/bin/bash

# Complete Deployment Script for AWS AppConfig Feature Flags Application
# This script orchestrates the entire deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v aws >/dev/null 2>&1 || missing_tools+=("aws-cli")
    command -v sam >/dev/null 2>&1 || missing_tools+=("sam-cli")
    command -v node >/dev/null 2>&1 || missing_tools+=("node.js")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install the missing tools:"
        echo "- AWS CLI: https://aws.amazon.com/cli/"
        echo "- SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
        echo "- Node.js: https://nodejs.org/"
        echo "- jq: https://stedolan.github.io/jq/"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials not configured. Please run 'aws configure'"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_warning "Node.js version $NODE_VERSION detected. Recommended: 18 or higher"
    fi
    
    print_success "All prerequisites met"
}

# Function to setup AppConfig
setup_appconfig() {
    print_step "Setting up AWS AppConfig..."
    
    if [ ! -f "./deploy-setup.sh" ]; then
        print_error "deploy-setup.sh not found in current directory"
        exit 1
    fi
    
    ./deploy-setup.sh --skip-db
    
    if [ ! -f "appconfig-ids.txt" ]; then
        print_error "AppConfig setup failed - appconfig-ids.txt not created"
        exit 1
    fi
    
    print_success "AppConfig setup completed"
}

# Function to prepare backend
prepare_backend() {
    print_step "Preparing backend..."
    
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found"
        exit 1
    fi
    
    cd backend
    
    print_status "Installing backend dependencies..."
    npm install
    
    print_status "Running TypeScript compilation..."
    npm run build
    
    print_status "Running backend tests..."
    npm test
    
    cd ..
    print_success "Backend preparation completed"
}

# Function to update SAM config
update_sam_config() {
    print_step "Updating SAM configuration..."
    
    if [ ! -f "appconfig-ids.txt" ]; then
        print_error "appconfig-ids.txt not found. Run AppConfig setup first."
        exit 1
    fi
    
    # Load AppConfig IDs
    APP_ID=$(grep "AppConfigApplication" appconfig-ids.txt | cut -d'"' -f2)
    ENV_ID=$(grep "AppConfigEnvironment" appconfig-ids.txt | cut -d'"' -f2)
    PROFILE_ID=$(grep "AppConfigConfigurationProfile" appconfig-ids.txt | cut -d'"' -f2)
    
    cd backend
    
    # Check if samconfig.toml exists
    if [ ! -f "samconfig.toml" ]; then
        if [ -f "samconfig.toml.template" ]; then
            cp samconfig.toml.template samconfig.toml
            print_status "Created samconfig.toml from template"
        else
            print_warning "No samconfig.toml found. SAM will use guided deployment."
            cd ..
            return 0
        fi
    fi
    
    # Update samconfig.toml with AppConfig IDs
    if grep -q "AppConfigApplication" samconfig.toml; then
        sed -i.bak "s/AppConfigApplication = .*/AppConfigApplication = \"$APP_ID\"/" samconfig.toml
        sed -i.bak "s/AppConfigEnvironment = .*/AppConfigEnvironment = \"$ENV_ID\"/" samconfig.toml
        sed -i.bak "s/AppConfigConfigurationProfile = .*/AppConfigConfigurationProfile = \"$PROFILE_ID\"/" samconfig.toml
        rm -f samconfig.toml.bak
        print_success "Updated samconfig.toml with AppConfig IDs"
    else
        print_warning "samconfig.toml doesn't contain AppConfig parameters. Manual update may be needed."
    fi
    
    cd ..
}

# Function to deploy backend
deploy_backend() {
    print_step "Deploying backend with SAM..."
    
    cd backend
    
    print_status "Building SAM application..."
    sam build
    
    print_status "Deploying SAM application..."
    if [ -f "samconfig.toml" ] && grep -q "guided = false" samconfig.toml; then
        sam deploy
    else
        print_warning "Running guided deployment. Please follow the prompts."
        sam deploy --guided
    fi
    
    # Get API Gateway URL
    API_URL=$(sam list stack-outputs --stack-name $(grep stack_name samconfig.toml | cut -d'"' -f2 2>/dev/null || echo "appconfig-feature-flags") --output json | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue' 2>/dev/null || echo "")
    
    if [ -n "$API_URL" ]; then
        echo "API_URL=$API_URL" > ../api-url.txt
        print_success "Backend deployed successfully. API URL: $API_URL"
    else
        print_warning "Could not retrieve API Gateway URL. Check SAM outputs manually."
    fi
    
    cd ..
}

# Function to populate DynamoDB
populate_database() {
    print_step "Populating DynamoDB with sample data..."
    
    ./deploy-setup.sh --populate-db-only
    
    print_success "Database population completed"
}

# Function to prepare frontend
prepare_frontend() {
    print_step "Preparing frontend..."
    
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found"
        exit 1
    fi
    
    cd frontend
    
    print_status "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    
    # Configure API endpoint
    if [ -f "../api-url.txt" ]; then
        API_URL=$(grep "API_URL=" ../api-url.txt | cut -d'=' -f2)
        if [ -n "$API_URL" ]; then
            print_status "Configuring API endpoint: $API_URL"
            
            if [ -f "src/config.json.template" ]; then
                cp src/config.json.template src/config.json
                # Update API endpoint in config.json
                if command -v jq >/dev/null 2>&1; then
                    jq --arg url "$API_URL" '.API_ENDPOINT = $url' src/config.json > src/config.json.tmp && mv src/config.json.tmp src/config.json
                else
                    sed -i.bak "s|\"API_ENDPOINT\": \".*\"|\"API_ENDPOINT\": \"$API_URL\"|" src/config.json
                    rm -f src/config.json.bak
                fi
                print_success "Updated frontend configuration"
            else
                print_warning "config.json.template not found. Please configure src/config.json manually."
            fi
        fi
    else
        print_warning "API URL not found. Please configure src/config.json manually after backend deployment."
    fi
    
    print_status "Running TypeScript type checking..."
    npm run type-check
    
    print_status "Building frontend..."
    npm run build
    
    cd ..
    print_success "Frontend preparation completed"
}

# Function to show deployment summary
show_summary() {
    print_step "Deployment Summary"
    echo ""
    
    if [ -f "appconfig-ids.txt" ]; then
        echo -e "${GREEN}✅ AWS AppConfig:${NC}"
        cat appconfig-ids.txt | grep -E "(AppConfigApplication|AppConfigEnvironment|AppConfigConfigurationProfile)" | sed 's/^/  /'
        echo ""
    fi
    
    if [ -f "api-url.txt" ]; then
        echo -e "${GREEN}✅ Backend API:${NC}"
        cat api-url.txt | sed 's/^/  /'
        echo ""
    fi
    
    if [ -d "frontend/build" ]; then
        echo -e "${GREEN}✅ Frontend Build:${NC}"
        echo "  Build files ready in frontend/build/"
        echo ""
    fi
    
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Test your API endpoints:"
    if [ -f "api-url.txt" ]; then
        API_URL=$(grep "API_URL=" api-url.txt | cut -d'=' -f2)
        echo "   curl $API_URL/flags"
        echo "   curl $API_URL/products"
    else
        echo "   curl <YOUR_API_URL>/flags"
        echo "   curl <YOUR_API_URL>/products"
    fi
    echo ""
    echo "2. Deploy frontend to hosting service:"
    echo "   - AWS S3 + CloudFront"
    echo "   - AWS Amplify"
    echo "   - Vercel, Netlify, etc."
    echo ""
    echo "3. Update feature flags:"
    echo "   ./update-feature-flags.sh get     # View current flags"
    echo "   ./update-feature-flags.sh create  # Create example updates"
    echo "   ./update-feature-flags.sh deploy  # Deploy updates"
    echo ""
    
    if [ -f "frontend/build/index.html" ]; then
        echo "4. Test frontend locally:"
        echo "   cd frontend && npx serve -s build"
        echo ""
    fi
}

# Function to cleanup temporary files
cleanup() {
    print_status "Cleaning up temporary files..."
    rm -f feature-flags.json current-flags.json
    print_success "Cleanup completed"
}

# Main function
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║     AWS AppConfig Feature Flags - Complete Deployment       ║"
    echo "║                    TypeScript Version                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Parse arguments
    SKIP_APPCONFIG=false
    SKIP_BACKEND=false
    SKIP_FRONTEND=false
    SKIP_DB=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-appconfig)
                SKIP_APPCONFIG=true
                shift
                ;;
            --skip-backend)
                SKIP_BACKEND=true
                shift
                ;;
            --skip-frontend)
                SKIP_FRONTEND=true
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --backend-only)
                SKIP_FRONTEND=true
                shift
                ;;
            --frontend-only)
                SKIP_APPCONFIG=true
                SKIP_BACKEND=true
                SKIP_DB=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-appconfig     Skip AppConfig setup"
                echo "  --skip-backend       Skip backend deployment"
                echo "  --skip-frontend      Skip frontend build"
                echo "  --skip-db           Skip database population"
                echo "  --backend-only      Deploy only backend (skip frontend)"
                echo "  --frontend-only     Build only frontend (skip backend/AppConfig)"
                echo "  --help, -h          Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                           # Full deployment"
                echo "  $0 --backend-only           # Deploy backend only"
                echo "  $0 --frontend-only          # Build frontend only"
                echo "  $0 --skip-db                # Deploy without populating database"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Trap to cleanup on exit
    trap cleanup EXIT
    
    check_prerequisites
    
    if [ "$SKIP_APPCONFIG" = false ]; then
        setup_appconfig
    fi
    
    if [ "$SKIP_BACKEND" = false ]; then
        prepare_backend
        update_sam_config
        deploy_backend
        
        if [ "$SKIP_DB" = false ]; then
            populate_database
        fi
    fi
    
    if [ "$SKIP_FRONTEND" = false ]; then
        prepare_frontend
    fi
    
    show_summary
    
    print_success "🎉 Deployment completed successfully!"
}

# Run main function with all arguments
main "$@"