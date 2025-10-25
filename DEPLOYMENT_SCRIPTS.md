# Deployment Scripts Guide

This directory contains automated deployment scripts for the AWS AppConfig Feature Flags TypeScript application.

## 📁 Scripts Overview

### 🚀 `deploy.sh` - Main Deployment Script
Complete orchestration script that handles the entire deployment process.

```bash
# Full deployment (recommended for first-time setup)
./deploy.sh

# Deploy only backend
./deploy.sh --backend-only

# Build only frontend
./deploy.sh --frontend-only

# Skip database population
./deploy.sh --skip-db
```

**What it does:**
1. ✅ Checks prerequisites (AWS CLI, SAM CLI, Node.js, etc.)
2. ✅ Sets up AWS AppConfig (application, environment, configuration profile)
3. ✅ Prepares and tests backend code
4. ✅ Deploys backend with SAM
5. ✅ Populates DynamoDB with sample data
6. ✅ Builds frontend with correct API configuration
7. ✅ Provides deployment summary and next steps

### ⚙️ `deploy-setup.sh` - AppConfig & Database Setup
Handles AWS AppConfig setup and DynamoDB population.

```bash
# Full setup (AppConfig + DynamoDB)
./deploy-setup.sh

# Only populate DynamoDB (after SAM deployment)
./deploy-setup.sh --populate-db-only

# Setup AppConfig only (skip DynamoDB)
./deploy-setup.sh --skip-db
```

**What it does:**
1. ✅ Creates AppConfig Application, Environment, and Configuration Profile
2. ✅ Uploads initial feature flags configuration
3. ✅ Deploys feature flags to AppConfig
4. ✅ Populates DynamoDB with sample products
5. ✅ Saves configuration IDs for SAM deployment

### 🔄 `update-feature-flags.sh` - Feature Flags Management
Manages feature flags after initial deployment.

```bash
# Get current feature flags
./update-feature-flags.sh get

# Create example updated flags file
./update-feature-flags.sh create

# Validate flags file format
./update-feature-flags.sh validate

# Deploy updated flags
./update-feature-flags.sh deploy

# View deployment history
./update-feature-flags.sh history

# Rollback to previous version
./update-feature-flags.sh rollback
```

## 🛠 Prerequisites

Before running any scripts, ensure you have:

### Required Tools
- [AWS CLI](https://aws.amazon.com/cli/) v2.x configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) v1.x
- [Node.js](https://nodejs.org/) v18+ (v22+ recommended)
- [jq](https://stedolan.github.io/jq/) for JSON processing

### AWS Permissions
Your AWS credentials need permissions for:
- CloudFormation (create/update/delete stacks)
- Lambda (create/update functions and layers)
- API Gateway (create/update APIs)
- DynamoDB (create/update tables)
- IAM (create/update roles and policies)
- S3 (create/update buckets for SAM artifacts)
- AppConfig (create/update applications, environments, configurations)

### Installation Commands
```bash
# macOS (using Homebrew)
brew install awscli sam-cli node jq

# Ubuntu/Debian
sudo apt update
sudo apt install awscli nodejs npm jq
pip install aws-sam-cli

# Configure AWS CLI
aws configure
```

## 🚀 Quick Start

### 1. First-Time Deployment
```bash
# Clone and navigate to project
git clone <repository-url>
cd aws-appconfig-feature-flags

# Run complete deployment
./deploy.sh
```

### 2. Backend-Only Deployment
```bash
# If you only need to deploy backend changes
./deploy.sh --backend-only
```

### 3. Update Feature Flags
```bash
# Get current flags
./update-feature-flags.sh get

# Create and edit updated flags
./update-feature-flags.sh create
# Edit updated-flags.json with your changes

# Deploy updates
./update-feature-flags.sh deploy
```

## 📋 Deployment Workflow

### Complete Deployment Process

1. **Prerequisites Check**
   - Validates required tools installation
   - Checks AWS credentials configuration
   - Verifies Node.js version

2. **AppConfig Setup**
   - Creates AppConfig Application: "FeatureFlagsApp"
   - Creates Environment: "Production"
   - Creates Configuration Profile: "FeatureFlags"
   - Uploads initial feature flags configuration
   - Saves configuration IDs to `appconfig-ids.txt`

3. **Backend Preparation**
   - Installs npm dependencies
   - Runs TypeScript compilation (`npm run build`)
   - Executes test suite (`npm test`)

4. **SAM Configuration**
   - Updates `samconfig.toml` with AppConfig IDs
   - Configures deployment parameters

5. **Backend Deployment**
   - Builds SAM application (`sam build`)
   - Deploys to AWS (`sam deploy`)
   - Extracts API Gateway URL

6. **Database Population**
   - Populates DynamoDB with sample products
   - Handles existing data gracefully

7. **Frontend Build**
   - Installs npm dependencies
   - Configures API endpoint in `config.json`
   - Runs TypeScript type checking
   - Builds production bundle

## 📁 Generated Files

After running the scripts, you'll find these generated files:

```
├── appconfig-ids.txt          # AppConfig configuration IDs
├── api-url.txt               # API Gateway URL
├── current-flags.json        # Current feature flags (when using update script)
├── updated-flags.json        # Example updated flags (when using update script)
└── frontend/
    ├── src/config.json       # Frontend API configuration
    └── build/                # Production build files
```

## 🔧 Configuration Files

### `appconfig-ids.txt`
Contains AppConfig resource IDs for SAM deployment:
```
AppConfigApplication = "abc123"
AppConfigEnvironment = "def456"
AppConfigConfigurationProfile = "ghi789"
```

### `frontend/src/config.json`
Frontend configuration automatically generated:
```json
{
  "API_ENDPOINT": "https://your-api-id.execute-api.region.amazonaws.com/Prod",
  "ITEM_CACHE": 10000,
  "FLAG_CACHE": 5000
}
```

### Feature Flags Format
```json
{
  "flags": {
    "show_stock": {
      "enabled": true
    },
    "mobile_payment": {
      "enabled": true
    },
    "new_ui": {
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
      "enabled": false
    }
  },
  "version": "1"
}
```

## 🚨 Troubleshooting

### Common Issues

1. **AWS CLI Not Configured**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and region
   ```

2. **SAM CLI Not Found**
   ```bash
   # Install SAM CLI
   pip install aws-sam-cli
   # or
   brew install sam-cli
   ```

3. **Node.js Version Too Old**
   ```bash
   # Install Node.js 18+ or 22+
   nvm install 22
   nvm use 22
   ```

4. **Permission Denied on Scripts**
   ```bash
   chmod +x deploy.sh deploy-setup.sh update-feature-flags.sh
   ```

5. **DynamoDB Table Not Found**
   ```bash
   # Deploy SAM first, then populate database
   ./deploy.sh --skip-db
   ./deploy-setup.sh --populate-db-only
   ```

6. **AppConfig Deployment Stuck**
   ```bash
   # Check deployment status
   ./update-feature-flags.sh history
   
   # If needed, rollback
   ./update-feature-flags.sh rollback
   ```

### Debug Mode

Enable verbose output for troubleshooting:
```bash
# Enable AWS CLI debug output
export AWS_CLI_FILE_ENCODING=UTF-8
export AWS_DEFAULT_OUTPUT=json

# Enable SAM debug output
export SAM_CLI_TELEMETRY=0
```

### Manual Cleanup

If deployment fails and you need to clean up:
```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name appconfig-feature-flags

# Delete AppConfig resources (if needed)
aws appconfig delete-application --application-id <APP_ID>

# Clean up local files
rm -f appconfig-ids.txt api-url.txt current-flags.json updated-flags.json
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy Feature Flags App

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Setup AWS CLI
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Install SAM CLI
        run: pip install aws-sam-cli
      
      - name: Deploy Application
        run: ./deploy.sh
```

## 📚 Additional Resources

- [AWS AppConfig Documentation](https://docs.aws.amazon.com/appconfig/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Main Deployment Guide](./DEPLOYMENT.md)

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review AWS CloudFormation events in the AWS Console
3. Check CloudWatch logs for Lambda functions
4. Validate your AWS permissions
5. Ensure all prerequisites are installed and configured

For script-specific help:
```bash
./deploy.sh --help
./deploy-setup.sh --help
./update-feature-flags.sh --help
```