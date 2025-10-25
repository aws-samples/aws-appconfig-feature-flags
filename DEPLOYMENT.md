# Deployment Guide

This guide provides step-by-step instructions for deploying the TypeScript AWS AppConfig Feature Flags application.

## 📋 Prerequisites

### Required Tools
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate permissions
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js 22.x](https://nodejs.org/) or later
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### AWS Permissions
Your AWS credentials need the following permissions:
- CloudFormation (create/update/delete stacks)
- Lambda (create/update functions and layers)
- API Gateway (create/update APIs)
- DynamoDB (create/update tables)
- IAM (create/update roles and policies)
- S3 (create/update buckets for SAM artifacts)
- AppConfig (read configuration data)

## 🏗 Infrastructure Setup

### 1. AWS AppConfig Setup

First, set up AWS AppConfig resources:

```bash
# Create AppConfig Application
aws appconfig create-application \
    --name "FeatureFlagsApp" \
    --description "Feature flags for TypeScript application"

# Create Environment
aws appconfig create-environment \
    --application-id <APPLICATION_ID> \
    --name "Production" \
    --description "Production environment"

# Create Configuration Profile
aws appconfig create-configuration-profile \
    --application-id <APPLICATION_ID> \
    --name "FeatureFlags" \
    --location-uri "hosted" \
    --type "AWS.AppConfig.FeatureFlags"
```

### 2. Create Initial Feature Flags

Create a feature flags configuration:

```json
{
  "flags": {
    "show_stock": {
      "enabled": true
    },
    "new_ui": {
      "enabled": false
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
        }
      },
      "defaultVariant": "basic"
    }
  },
  "values": {
    "show_stock": {
      "enabled": true
    },
    "new_ui": {
      "enabled": false
    },
    "premium_features": {
      "enabled": true,
      "variant": "basic"
    }
  },
  "version": "1"
}
```

Upload this configuration:

```bash
aws appconfig create-hosted-configuration-version \
    --application-id <APPLICATION_ID> \
    --configuration-profile-id <CONFIGURATION_PROFILE_ID> \
    --content-type "application/json" \
    --content file://feature-flags.json
```

### 3. Deploy Configuration

```bash
aws appconfig start-deployment \
    --application-id <APPLICATION_ID> \
    --environment-id <ENVIRONMENT_ID> \
    --deployment-strategy-id "AppConfig.AllAtOnce" \
    --configuration-profile-id <CONFIGURATION_PROFILE_ID> \
    --configuration-version <VERSION_NUMBER>
```

## 🚀 Backend Deployment

### 1. Prepare Backend

```bash
cd backend

# Install dependencies
npm install

# Run TypeScript compilation
npm run build

# Run tests (optional but recommended)
npm test
```

### 2. Configure SAM

Copy and configure the SAM configuration:

```bash
cp samconfig.toml.template samconfig.toml
```

Edit `samconfig.toml` with your values:
- `AppConfigApplication`: Your AppConfig Application ID
- `AppConfigEnvironment`: Your AppConfig Environment ID  
- `AppConfigConfigurationProfile`: Your Configuration Profile ID
- `ClientDomains`: Allowed CORS domains (use `*` for development)

### 3. Deploy with SAM

```bash
# Build the SAM application
sam build

# Deploy (first time - guided)
sam deploy --guided

# Or deploy with existing configuration
sam deploy
```

### 4. Verify Backend Deployment

After deployment, test the endpoints:

```bash
# Get the API Gateway URL from SAM output
export API_URL="https://your-api-id.execute-api.region.amazonaws.com/Prod"

# Test feature flags endpoint
curl $API_URL/flags

# Test products endpoint  
curl $API_URL/products
```

## 🌐 Frontend Deployment

### 1. Prepare Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint
cp src/config.json.template src/config.json
```

Edit `src/config.json`:
```json
{
  "API_ENDPOINT": "https://your-api-id.execute-api.region.amazonaws.com/Prod",
  "ITEM_CACHE": 10000,
  "FLAG_CACHE": 5000
}
```

### 2. Build Frontend

```bash
# Run TypeScript type checking
npm run type-check

# Run tests (optional but recommended)
npm test

# Build for production
npm run build
```

### 3. Deploy Frontend

#### Option A: AWS S3 + CloudFront

```bash
# Create S3 bucket
aws s3 mb s3://your-app-bucket-name

# Enable static website hosting
aws s3 website s3://your-app-bucket-name \
    --index-document index.html \
    --error-document error.html

# Upload build files
aws s3 sync build/ s3://your-app-bucket-name --delete

# Set public read permissions
aws s3api put-bucket-policy \
    --bucket your-app-bucket-name \
    --policy file://bucket-policy.json
```

#### Option B: AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## 🗄 Database Setup

### 1. Populate DynamoDB

Create sample products in DynamoDB:

```bash
# Get table name from SAM output
export TABLE_NAME="your-stack-name-DynamoDBTable-XXXXX"

# Add sample products
aws dynamodb put-item \
    --table-name $TABLE_NAME \
    --item '{
        "id": {"N": "1"},
        "itemName": {"S": "Laptop"},
        "itemDesc": {"S": "High-performance laptop"},
        "itemPrice": {"N": "999.99"},
        "itemImage": {"S": "laptop.jpg"},
        "itemStock": {"N": "10"}
    }'

aws dynamodb put-item \
    --table-name $TABLE_NAME \
    --item '{
        "id": {"N": "2"},
        "itemName": {"S": "Mouse"},
        "itemDesc": {"S": "Wireless mouse"},
        "itemPrice": {"N": "29.99"},
        "itemImage": {"S": "mouse.jpg"},
        "itemStock": {"N": "50"}
    }'
```

## 🔧 Configuration Management

### Environment Variables

Backend Lambda functions use these environment variables:
- `APPCONFIG_APPLICATION`: AppConfig Application ID
- `APPCONFIG_ENVIRONMENT`: AppConfig Environment ID
- `APPCONFIG_CONFIGURATION`: AppConfig Configuration Profile ID
- `PRODUCT_TABLE`: DynamoDB table name
- `AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS`: Polling interval (default: 45)

### Feature Flag Updates

To update feature flags:

1. Create new configuration version:
```bash
aws appconfig create-hosted-configuration-version \
    --application-id <APPLICATION_ID> \
    --configuration-profile-id <CONFIGURATION_PROFILE_ID> \
    --content-type "application/json" \
    --content file://updated-flags.json
```

2. Deploy the new version:
```bash
aws appconfig start-deployment \
    --application-id <APPLICATION_ID> \
    --environment-id <ENVIRONMENT_ID> \
    --deployment-strategy-id "AppConfig.AllAtOnce" \
    --configuration-profile-id <CONFIGURATION_PROFILE_ID> \
    --configuration-version <NEW_VERSION_NUMBER>
```

## 📊 Monitoring and Logging

### CloudWatch Logs

Monitor application logs:
```bash
# Backend logs
aws logs tail /aws/lambda/your-function-name --follow

# View specific log group
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/"
```

### CloudWatch Metrics

Key metrics to monitor:
- Lambda function duration and errors
- API Gateway request count and latency
- DynamoDB read/write capacity
- AppConfig retrieval success rate

### Alarms

Set up CloudWatch alarms for:
```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
    --alarm-name "Lambda-Errors" \
    --alarm-description "Lambda function errors" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold

# API Gateway 5xx errors
aws cloudwatch put-metric-alarm \
    --alarm-name "API-5xx-Errors" \
    --alarm-description "API Gateway 5xx errors" \
    --metric-name 5XXError \
    --namespace AWS/ApiGateway \
    --statistic Sum \
    --period 300 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy TypeScript App

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Build TypeScript
        run: |
          cd backend
          npm run build
      
      - name: Deploy with SAM
        run: |
          cd backend
          sam build
          sam deploy --no-confirm-changeset

  deploy-frontend:
    needs: deploy-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false
      
      - name: Build
        run: |
          cd frontend
          npm run build
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/build/ s3://${{ secrets.S3_BUCKET }} --delete
```

## 🚨 Troubleshooting

### Common Issues

1. **TypeScript compilation errors**
   ```bash
   # Check TypeScript configuration
   cd backend && npm run type-check
   cd frontend && npm run type-check
   ```

2. **SAM deployment failures**
   ```bash
   # Check SAM logs
   sam logs -n YourFunctionName --tail
   
   # Validate template
   sam validate
   ```

3. **AppConfig connection issues**
   ```bash
   # Test AppConfig connectivity
   aws appconfig get-configuration \
       --application <APP_ID> \
       --environment <ENV_ID> \
       --configuration <CONFIG_ID> \
       --client-id test-client
   ```

4. **CORS issues**
   - Verify `ClientDomains` parameter in SAM template
   - Check API Gateway CORS configuration
   - Ensure frontend URL is allowed

### Debug Mode

Enable debug logging:

Backend:
```bash
export FASTMCP_LOG_LEVEL=DEBUG
```

Frontend:
```bash
export REACT_APP_DEBUG=true
```

## 🔐 Security Considerations

### IAM Policies
- Use least privilege principle
- Separate roles for different environments
- Regular policy reviews

### API Security
- Enable API Gateway throttling
- Use API keys for production
- Monitor for unusual traffic patterns

### Data Protection
- Enable encryption at rest for DynamoDB
- Use HTTPS for all communications
- Implement proper input validation

## 📈 Performance Optimization

### Backend
- Monitor Lambda cold starts
- Optimize bundle sizes
- Use provisioned concurrency if needed

### Frontend
- Enable CloudFront caching
- Optimize bundle splitting
- Monitor Core Web Vitals

### AppConfig
- Tune polling intervals
- Monitor cache hit rates
- Use deployment strategies for gradual rollouts

## 🔗 Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS AppConfig Documentation](https://docs.aws.amazon.com/appconfig/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)