import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Product Data Model
export interface Product {
  id: number;
  itemName: string;
  itemDesc: string;
  itemPrice: number;
  itemImage: string;
  itemStock?: number;
}

// DynamoDB Types
export interface DynamoDBScanResult {
  Items?: Product[];
  Count?: number;
  ScannedCount?: number;
}

// Lambda Handler Types
export type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

// API Error Types
export interface ApiError {
  error: string;
  message: string;
  code?: string;
}

// DynamoDB Configuration
export interface DynamoDBConfig {
  region: string;
  tableName: string;
}