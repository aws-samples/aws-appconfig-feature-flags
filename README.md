# AWS AppConfig Feature Flags - TypeScript Edition

A modern, TypeScript-based implementation of AWS AppConfig Feature Flags with React frontend and AWS Lambda backend.

## 🚀 Features

- **TypeScript**: Full TypeScript implementation with strict type checking
- **Modern React 18**: Latest React patterns with hooks and functional components
- **AWS SDK v3**: Modular AWS SDK with improved performance and TypeScript support
- **AWS Lambda Powertools**: Structured logging and parameter management
- **Multi-variant Feature Flags**: Support for A/B testing and gradual rollouts
- **Comprehensive Error Handling**: Robust error boundaries and fallback mechanisms
- **Comprehensive Testing**: Unit tests for both frontend and backend

## 🏗 Architecture

### Frontend (React 18 + TypeScript)
- React 18.3+ with TypeScript 5.9+
- Modern hooks and functional components
- Type-safe feature flag interfaces
- Error boundaries and comprehensive error handling
- AWS Amplify for API integration

### Backend (AWS Lambda + TypeScript)
- Node.js 22.x runtime
- AWS SDK v3 with modular imports
- AWS Lambda Powertools for observability
- AppConfig Agent Lambda extension for optimized caching
- Strongly typed Lambda handlers and utilities

### Infrastructure
- AWS SAM for infrastructure as code
- AWS AppConfig for feature flag management
- DynamoDB for product data
- API Gateway for REST endpoints

## 📋 Prerequisites

- Node.js 22.x or later
- AWS CLI configured
- AWS SAM CLI
- TypeScript 5.9+

## 🛠 Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Deploy using SAM:
   ```bash
   sam build
   sam deploy --guided
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the configuration:
   ```bash
   cp src/config.json.template src/config.json
   # Edit src/config.json with your API Gateway URL
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 TypeScript Configuration

### Backend TypeScript Config
- Target: ES2023
- Module: CommonJS
- Strict mode enabled
- Full type checking with no implicit any

### Frontend TypeScript Config
- Target: ES2023
- JSX: react-jsx (React 18 transform)
- Strict mode enabled
- DOM and ES2023 libraries

## 🎛 Feature Flags

### Basic Feature Flags
```typescript
interface FeatureFlag {
  enabled: boolean;
  description?: string;
}
```

### Multi-variant Feature Flags
```typescript
interface MultiVariantFlag extends FeatureFlag {
  variants: {
    [variantName: string]: {
      enabled: boolean;
      value: unknown;
      weight?: number;
    };
  };
  defaultVariant: string;
  rules?: VariantRule[];
}
```

### Usage in React Components
```typescript
import { useFeatureFlag } from './hooks/useFeatureFlag';

const MyComponent: React.FC = () => {
  const { isEnabled, variant } = useFeatureFlag('my-feature');
  
  if (!isEnabled) {
    return <div>Feature not available</div>;
  }
  
  return <div>Feature content: {String(variant)}</div>;
};
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm run build:watch  # Watch mode compilation
npm run type-check   # Type checking only
npm run lint         # ESLint
```

### Frontend Development
```bash
cd frontend
npm start           # Development server
npm run type-check  # Type checking only
npm run lint        # ESLint
```

## 📦 Build and Deployment

### Backend Build
```bash
cd backend
npm run build
sam build
sam deploy
```

### Frontend Build
```bash
cd frontend
npm run build
```

## 🔍 Monitoring and Logging

The application uses AWS Lambda Powertools for:
- Structured logging with correlation IDs
- Parameter management with caching
- Error tracking and monitoring

Logs are available in CloudWatch with structured JSON format.

## 🚨 Error Handling

### Backend Error Handling
- Custom error classes for different scenarios
- Structured error responses with correlation IDs
- Fallback mechanisms for AppConfig failures

### Frontend Error Handling
- React Error Boundaries for component errors
- Comprehensive API error handling
- User-friendly error messages with retry options

## 🔐 Security

- IAM policies with least privilege access
- CORS configuration for API endpoints
- Input validation and sanitization
- Secure environment variable handling

## 📊 Performance

- AWS AppConfig Agent extension for optimized caching
- Modular AWS SDK imports for reduced bundle size
- React 18 concurrent features
- TypeScript compilation optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT-0 License - see the original AWS sample for details.

## 🆘 Troubleshooting

### Common Issues

1. **TypeScript compilation errors**: Ensure all dependencies are installed and TypeScript version is 5.9+
2. **AppConfig connection issues**: Verify environment variables and IAM permissions
3. **React build errors**: Check that all imports use proper TypeScript syntax

### Debug Mode

Enable debug logging by setting environment variables:
```bash
# Backend
export FASTMCP_LOG_LEVEL=DEBUG

# Frontend
export REACT_APP_DEBUG=true
```

## 📚 Additional Resources

- [AWS AppConfig Documentation](https://docs.aws.amazon.com/appconfig/)
- [AWS Lambda Powertools TypeScript](https://docs.powertools.aws.dev/lambda/typescript/)
- [React 18 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)