#!/bin/bash

# AWS AppConfig Feature Flags Update Script
# This script helps update feature flags after initial deployment

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

# Function to load AppConfig IDs from file
load_config() {
    if [ ! -f "appconfig-ids.txt" ]; then
        print_error "appconfig-ids.txt not found. Please run deploy-setup.sh first."
        exit 1
    fi
    
    APP_ID=$(grep "AppConfigApplication" appconfig-ids.txt | cut -d'"' -f2)
    ENV_ID=$(grep "AppConfigEnvironment" appconfig-ids.txt | cut -d'"' -f2)
    PROFILE_ID=$(grep "AppConfigConfigurationProfile" appconfig-ids.txt | cut -d'"' -f2)
    
    if [ -z "$APP_ID" ] || [ -z "$ENV_ID" ] || [ -z "$PROFILE_ID" ]; then
        print_error "Could not load AppConfig IDs from appconfig-ids.txt"
        exit 1
    fi
    
    print_success "Loaded AppConfig configuration"
}

# Function to get current feature flags
get_current_flags() {
    print_status "Retrieving current feature flags..."
    
    aws appconfig get-configuration \
        --application "$APP_ID" \
        --environment "$ENV_ID" \
        --configuration "$PROFILE_ID" \
        --client-id "update-script-$(date +%s)" \
        current-flags.json
    
    if [ -f "current-flags.json" ]; then
        print_success "Current flags saved to current-flags.json"
        echo ""
        echo -e "${BLUE}Current Feature Flags:${NC}"
        cat current-flags.json | jq '.flags // .values // .' 2>/dev/null || cat current-flags.json
        echo ""
    else
        print_warning "Could not retrieve current flags"
    fi
}

# Function to create example updated flags
create_example_flags() {
    print_status "Creating example updated feature flags..."
    
    cat > updated-flags.json << 'EOF'
{
  "flags": {
    "show_stock": {
      "enabled": true
    },
    "mobile_payment": {
      "enabled": true
    },
    "new_ui": {
      "enabled": true
    },
    "premium_features": {
      "enabled": true,
      "variants": {
        "basic": {
          "enabled": true,
          "value": "basic"
        },
        "premium": {
          "enabled": true,
          "value": "premium"
        },
        "enterprise": {
          "enabled": true,
          "value": "enterprise"
        }
      },
      "defaultVariant": "basic"
    },
    "dark_mode": {
      "enabled": false
    },
    "beta_features": {
      "enabled": false
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
      "enabled": true
    },
    "premium_features": {
      "enabled": true,
      "variant": "basic"
    },
    "dark_mode": {
      "enabled": false
    },
    "beta_features": {
      "enabled": false
    }
  },
  "version": "2"
}
EOF
    
    print_success "Example updated flags created in updated-flags.json"
    print_warning "Please edit updated-flags.json with your desired changes before deploying"
}

# Function to deploy updated flags
deploy_updated_flags() {
    local flags_file=${1:-updated-flags.json}
    
    if [ ! -f "$flags_file" ]; then
        print_error "Flags file '$flags_file' not found"
        exit 1
    fi
    
    print_status "Validating JSON format..."
    if ! jq empty "$flags_file" 2>/dev/null; then
        print_error "Invalid JSON format in $flags_file"
        exit 1
    fi
    
    print_success "JSON format is valid"
    
    print_status "Uploading updated feature flags..."
    
    VERSION_NUMBER=$(aws appconfig create-hosted-configuration-version \
        --application-id "$APP_ID" \
        --configuration-profile-id "$PROFILE_ID" \
        --content-type "application/json" \
        --content "fileb://$flags_file" \
        --query "VersionNumber" --output text)
    
    print_success "Created configuration version: $VERSION_NUMBER"
    
    print_status "Deploying updated feature flags..."
    
    DEPLOYMENT_ID=$(aws appconfig start-deployment \
        --application-id "$APP_ID" \
        --environment-id "$ENV_ID" \
        --deployment-strategy-id "AppConfig.AllAtOnce" \
        --configuration-profile-id "$PROFILE_ID" \
        --configuration-version "$VERSION_NUMBER" \
        --description "Updated feature flags - $(date)" \
        --query "DeploymentNumber" --output text)
    
    print_success "Started deployment with ID: $DEPLOYMENT_ID"
    
    print_status "Waiting for deployment to complete..."
    
    # Wait for deployment
    while true; do
        STATE=$(aws appconfig get-deployment \
            --application-id "$APP_ID" \
            --environment-id "$ENV_ID" \
            --deployment-number "$DEPLOYMENT_ID" \
            --query "State" --output text)
        
        case $STATE in
            "COMPLETE")
                print_success "Deployment completed successfully!"
                break
                ;;
            "ROLLED_BACK")
                print_error "Deployment was rolled back!"
                exit 1
                ;;
            "BAKING"|"DEPLOYING")
                echo -n "."
                sleep 5
                ;;
            *)
                print_warning "Deployment state: $STATE"
                sleep 5
                ;;
        esac
    done
    
    echo ""
    print_success "Feature flags updated successfully!"
}

# Function to show deployment history
show_deployment_history() {
    print_status "Deployment History:"
    echo ""
    
    aws appconfig list-deployments \
        --application-id "$APP_ID" \
        --environment-id "$ENV_ID" \
        --query "Items[*].[DeploymentNumber,State,Description,StartedAt]" \
        --output table
}

# Function to rollback to previous version
rollback_deployment() {
    print_status "Getting deployment history..."
    
    # Get the last successful deployment
    LAST_DEPLOYMENT=$(aws appconfig list-deployments \
        --application-id "$APP_ID" \
        --environment-id "$ENV_ID" \
        --query "Items[?State=='COMPLETE'] | [0].DeploymentNumber" \
        --output text)
    
    if [ "$LAST_DEPLOYMENT" = "None" ] || [ -z "$LAST_DEPLOYMENT" ]; then
        print_error "No successful deployments found to rollback to"
        exit 1
    fi
    
    print_warning "This will rollback to deployment #$LAST_DEPLOYMENT"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Rollback cancelled"
        exit 0
    fi
    
    # Stop current deployment if any
    print_status "Stopping current deployment..."
    aws appconfig stop-deployment \
        --application-id "$APP_ID" \
        --environment-id "$ENV_ID" \
        --deployment-number "$LAST_DEPLOYMENT" 2>/dev/null || true
    
    print_success "Rollback initiated"
}

# Function to validate feature flags format
validate_flags() {
    local flags_file=${1:-updated-flags.json}
    
    if [ ! -f "$flags_file" ]; then
        print_error "Flags file '$flags_file' not found"
        exit 1
    fi
    
    print_status "Validating feature flags format..."
    
    # Check JSON format
    if ! jq empty "$flags_file" 2>/dev/null; then
        print_error "Invalid JSON format"
        exit 1
    fi
    
    # Check required structure
    if ! jq -e '.flags' "$flags_file" >/dev/null 2>&1; then
        print_warning "Missing 'flags' section"
    fi
    
    if ! jq -e '.values' "$flags_file" >/dev/null 2>&1; then
        print_warning "Missing 'values' section"
    fi
    
    # Validate each flag has required properties
    jq -r '.flags | keys[]' "$flags_file" 2>/dev/null | while read -r flag; do
        if ! jq -e ".flags.$flag.enabled" "$flags_file" >/dev/null 2>&1; then
            print_warning "Flag '$flag' missing 'enabled' property"
        fi
    done
    
    print_success "Feature flags format validation completed"
}

# Main function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║            AWS AppConfig Feature Flags Updater              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    case ${1:-""} in
        "get"|"current")
            load_config
            get_current_flags
            ;;
        "create"|"example")
            create_example_flags
            ;;
        "deploy")
            load_config
            deploy_updated_flags "${2:-updated-flags.json}"
            ;;
        "validate")
            validate_flags "${2:-updated-flags.json}"
            ;;
        "history")
            load_config
            show_deployment_history
            ;;
        "rollback")
            load_config
            rollback_deployment
            ;;
        "help"|"--help"|"-h"|"")
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  get|current              Get current feature flags"
            echo "  create|example           Create example updated flags file"
            echo "  deploy [file]            Deploy feature flags (default: updated-flags.json)"
            echo "  validate [file]          Validate feature flags format"
            echo "  history                  Show deployment history"
            echo "  rollback                 Rollback to previous deployment"
            echo "  help                     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 get                   # Get current flags"
            echo "  $0 create                # Create example updated-flags.json"
            echo "  $0 validate              # Validate updated-flags.json"
            echo "  $0 deploy                # Deploy updated-flags.json"
            echo "  $0 deploy my-flags.json  # Deploy custom flags file"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

main "$@"