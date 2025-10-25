#!/bin/bash

# AWS AppConfig Feature Flags Deployment Setup Script
# This script sets up AWS AppConfig and populates DynamoDB with sample data

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="FeatureFlagsApp"
ENV_NAME="Production"
CONFIG_PROFILE_NAME="FeatureFlags"
REGION=${AWS_DEFAULT_REGION:-us-east-1}

# Function to print colored output
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

# Function to check if AWS CLI is configured
check_aws_cli() {
    print_status "Checking AWS CLI configuration..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI is configured"
}

# Function to create AppConfig application
create_appconfig_application() {
    print_status "Creating AppConfig Application: $APP_NAME"
    
    # Check if application already exists
    APP_ID=$(aws appconfig list-applications --query "Items[?Name=='$APP_NAME'].Id" --output text 2>/dev/null || echo "")
    
    if [ -n "$APP_ID" ]; then
        print_warning "AppConfig Application '$APP_NAME' already exists with ID: $APP_ID"
    else
        APP_ID=$(aws appconfig create-application \
            --name "$APP_NAME" \
            --description "Feature flags for TypeScript application" \
            --query "Id" --output text)
        print_success "Created AppConfig Application with ID: $APP_ID"
    fi
    
    echo "APP_ID=$APP_ID"
}

# Function to create AppConfig environment
create_appconfig_environment() {
    local app_id=$1
    print_status "Creating AppConfig Environment: $ENV_NAME"
    
    # Check if environment already exists
    ENV_ID=$(aws appconfig list-environments \
        --application-id "$app_id" \
        --query "Items[?Name=='$ENV_NAME'].Id" --output text 2>/dev/null || echo "")
    
    if [ -n "$ENV_ID" ]; then
        print_warning "AppConfig Environment '$ENV_NAME' already exists with ID: $ENV_ID"
    else
        ENV_ID=$(aws appconfig create-environment \
            --application-id "$app_id" \
            --name "$ENV_NAME" \
            --description "Production environment for feature flags" \
            --query "Id" --output text)
        print_success "Created AppConfig Environment with ID: $ENV_ID"
    fi
    
    echo "ENV_ID=$ENV_ID"
}

# Function to create AppConfig configuration profile
create_appconfig_profile() {
    local app_id=$1
    print_status "Creating AppConfig Configuration Profile: $CONFIG_PROFILE_NAME"
    
    # Check if configuration profile already exists
    PROFILE_ID=$(aws appconfig list-configuration-profiles \
        --application-id "$app_id" \
        --query "Items[?Name=='$CONFIG_PROFILE_NAME'].Id" --output text 2>/dev/null || echo "")
    
    if [ -n "$PROFILE_ID" ]; then
        print_warning "AppConfig Configuration Profile '$CONFIG_PROFILE_NAME' already exists with ID: $PROFILE_ID"
    else
        PROFILE_ID=$(aws appconfig create-configuration-profile \
            --application-id "$app_id" \
            --name "$CONFIG_PROFILE_NAME" \
            --location-uri "hosted" \
            --type "AWS.AppConfig.FeatureFlags" \
            --query "Id" --output text)
        print_success "Created AppConfig Configuration Profile with ID: $PROFILE_ID"
    fi
    
    echo "PROFILE_ID=$PROFILE_ID"
}

# Function to create feature flags configuration
create_feature_flags_config() {
    print_status "Creating feature flags configuration file..."
    
    cat > feature-flags.json << 'EOF'
{
  "flags": {
    "show_stock": {
      "name": "Show Stock Information"
    },
    "mobile_payment": {
      "name": "Mobile Payment Support"
    },
    "new_ui": {
      "name": "New UI Design"
    },
    "premium_features": {
      "name": "Premium Features"
    }
  },
  "values": {
    "show_stock": {
      "enabled": true
    },
    "mobile_payment": {
      "enabled": true
    },
    "new_ui": {
      "enabled": false
    },
    "premium_features": {
      "enabled": true
    }
  },
  "version": "1"
}
EOF
    
    print_success "Created feature-flags.json"
}

# Function to upload and deploy feature flags
deploy_feature_flags() {
    local app_id=$1
    local env_id=$2
    local profile_id=$3
    
    print_status "Uploading feature flags configuration..."
    
    # Create a temporary file for the output
    TEMP_OUTPUT="/tmp/appconfig-version-$$.json"
    
    VERSION_NUMBER=$(aws appconfig create-hosted-configuration-version \
        --application-id "$app_id" \
        --configuration-profile-id "$profile_id" \
        --content-type "application/json" \
        --content file://feature-flags.json \
        --cli-binary-format raw-in-base64-out \
        "$TEMP_OUTPUT" \
        --query "VersionNumber" --output text)
    
    # Clean up temporary file
    rm -f "$TEMP_OUTPUT"
    
    print_success "Created configuration version: $VERSION_NUMBER"
    
    print_status "Deploying feature flags configuration..."
    
    DEPLOYMENT_ID=$(aws appconfig start-deployment \
        --application-id "$app_id" \
        --environment-id "$env_id" \
        --deployment-strategy-id "AppConfig.AllAtOnce" \
        --configuration-profile-id "$profile_id" \
        --configuration-version "$VERSION_NUMBER" \
        --description "Initial deployment of feature flags" \
        --query "DeploymentNumber" --output text)
    
    print_success "Started deployment with ID: $DEPLOYMENT_ID"
    
    # Wait for deployment to complete
    print_status "Waiting for deployment to complete..."
    aws appconfig get-deployment \
        --application-id "$app_id" \
        --environment-id "$env_id" \
        --deployment-number "$DEPLOYMENT_ID" \
        --query "State" --output text > /dev/null
    
    print_success "Feature flags deployed successfully!"
}

# Function to populate DynamoDB with sample data
populate_dynamodb() {
    print_status "Checking for DynamoDB table..."
    
    # Try to find the table created by SAM
    TABLE_NAME=$(aws dynamodb list-tables --query "TableNames[?contains(@, 'DynamoDBTable')]" --output text 2>/dev/null || echo "")
    
    if [ -z "$TABLE_NAME" ]; then
        print_warning "DynamoDB table not found. Please deploy the SAM application first."
        print_warning "After SAM deployment, run this script again or manually set TABLE_NAME environment variable."
        return 0
    fi
    
    print_success "Found DynamoDB table: $TABLE_NAME"
    print_status "Populating DynamoDB with sample products..."
    
    # Sample products data with correct image names
    declare -a products=(
        '{"id": {"N": "1"}, "itemName": {"S": "MacBook Pro"}, "itemDesc": {"S": "Apple MacBook Pro 16-inch with M3 chip"}, "itemPrice": {"N": "2499.99"}, "itemImage": {"S": "one.png"}, "itemStock": {"N": "15"}}'
        '{"id": {"N": "2"}, "itemName": {"S": "Wireless Mouse"}, "itemDesc": {"S": "Logitech MX Master 3 Wireless Mouse"}, "itemPrice": {"N": "99.99"}, "itemImage": {"S": "two.png"}, "itemStock": {"N": "50"}}'
        '{"id": {"N": "3"}, "itemName": {"S": "Mechanical Keyboard"}, "itemDesc": {"S": "Keychron K2 Wireless Mechanical Keyboard"}, "itemPrice": {"N": "89.99"}, "itemImage": {"S": "three.png"}, "itemStock": {"N": "25"}}'
        '{"id": {"N": "4"}, "itemName": {"S": "USB-C Hub"}, "itemDesc": {"S": "Anker 7-in-1 USB-C Hub with 4K HDMI"}, "itemPrice": {"N": "49.99"}, "itemImage": {"S": "four.png"}, "itemStock": {"N": "100"}}'
        '{"id": {"N": "5"}, "itemName": {"S": "Wireless Headphones"}, "itemDesc": {"S": "Sony WH-1000XM5 Noise Canceling Headphones"}, "itemPrice": {"N": "399.99"}, "itemImage": {"S": "five.png"}, "itemStock": {"N": "30"}}'
        '{"id": {"N": "6"}, "itemName": {"S": "External Monitor"}, "itemDesc": {"S": "Dell UltraSharp 27-inch 4K USB-C Monitor"}, "itemPrice": {"N": "599.99"}, "itemImage": {"S": "six.png"}, "itemStock": {"N": "8"}}'
    )
    
    for product in "${products[@]}"; do
        product_name=$(echo "$product" | jq -r '.itemName.S')
        
        # Check if product already exists
        existing_item=$(aws dynamodb get-item \
            --table-name "$TABLE_NAME" \
            --key "$(echo "$product" | jq '{id: .id}')" \
            --query "Item" --output text 2>/dev/null || echo "None")
        
        if [ "$existing_item" != "None" ]; then
            print_warning "Product '$product_name' already exists, skipping..."
        else
            aws dynamodb put-item \
                --table-name "$TABLE_NAME" \
                --item "$product" > /dev/null
            print_success "Added product: $product_name"
        fi
    done
    
    print_success "DynamoDB population completed!"
}

# Function to save configuration for SAM
save_sam_config() {
    local app_id=$1
    local env_id=$2
    local profile_id=$3
    
    print_status "Saving configuration for SAM deployment..."
    
    cat > appconfig-ids.txt << EOF
# AWS AppConfig Configuration IDs
# Use these values in your samconfig.toml file

AppConfigApplication = "$app_id"
AppConfigEnvironment = "$env_id"
AppConfigConfigurationProfile = "$profile_id"

# Example samconfig.toml parameter overrides:
# parameter_overrides = [
#     "AppConfigApplication=$app_id",
#     "AppConfigEnvironment=$env_id", 
#     "AppConfigConfigurationProfile=$profile_id",
#     "ClientDomains=*"
# ]
EOF
    
    print_success "Configuration saved to appconfig-ids.txt"
    print_status "Please update your samconfig.toml with these values before running 'sam deploy'"
}

# Function to display next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update your samconfig.toml with the AppConfig IDs from appconfig-ids.txt"
    echo "2. Deploy the backend with SAM:"
    echo "   cd backend"
    echo "   sam build"
    echo "   sam deploy"
    echo ""
    echo "3. After SAM deployment, run this script again to populate DynamoDB:"
    echo "   ./deploy-setup.sh --populate-db-only"
    echo ""
    echo "4. Configure and deploy the frontend:"
    echo "   cd frontend"
    echo "   cp src/config.json.template src/config.json"
    echo "   # Update config.json with your API Gateway URL"
    echo "   npm run build"
    echo ""
    echo -e "${YELLOW}Note:${NC} If DynamoDB table was not found, deploy SAM first, then run:"
    echo "TABLE_NAME=your-table-name ./deploy-setup.sh --populate-db-only"
}

# Main execution function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║          AWS AppConfig Feature Flags Setup Script           ║"
    echo "║                     TypeScript Version                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Parse command line arguments
    POPULATE_DB_ONLY=false
    SKIP_DB=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --populate-db-only)
                POPULATE_DB_ONLY=true
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --populate-db-only    Only populate DynamoDB (skip AppConfig setup)"
                echo "  --skip-db            Skip DynamoDB population"
                echo "  --help, -h           Show this help message"
                echo ""
                echo "Environment Variables:"
                echo "  TABLE_NAME           Override DynamoDB table name"
                echo "  AWS_DEFAULT_REGION   Set AWS region (default: us-east-1)"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    check_aws_cli
    
    if [ "$POPULATE_DB_ONLY" = true ]; then
        populate_dynamodb
        print_success "DynamoDB population completed!"
        exit 0
    fi
    
    # AppConfig setup
    APP_ID=$(create_appconfig_application | grep "APP_ID=" | cut -d'=' -f2)
    ENV_ID=$(create_appconfig_environment "$APP_ID" | grep "ENV_ID=" | cut -d'=' -f2)
    PROFILE_ID=$(create_appconfig_profile "$APP_ID" | grep "PROFILE_ID=" | cut -d'=' -f2)
    
    create_feature_flags_config
    deploy_feature_flags "$APP_ID" "$ENV_ID" "$PROFILE_ID"
    
    save_sam_config "$APP_ID" "$ENV_ID" "$PROFILE_ID"
    
    if [ "$SKIP_DB" = false ]; then
        populate_dynamodb
    fi
    
    # Cleanup
    rm -f feature-flags.json
    
    show_next_steps
}

# Run main function with all arguments
main "$@"