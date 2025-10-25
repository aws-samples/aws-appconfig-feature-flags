import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Lambda Handler Types
export type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

// API Response Types
export interface SuccessResponse {
  statusCode: 200;
  headers: {
    'Content-Type': 'application/json';
    'Access-Control-Allow-Origin': string;
  };
  body: string; // JSON.stringify(T)
}

export interface ErrorResponse {
  statusCode: 400 | 404 | 500;
  headers: {
    'Content-Type': 'application/json';
    'Access-Control-Allow-Origin': string;
  };
  body: string; // JSON.stringify({ error: string, message: string })
}

export type ApiResponse = SuccessResponse | ErrorResponse;

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}