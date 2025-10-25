// Product Types
export interface Product {
  id: number;
  itemName: string;
  itemDesc: string;
  itemPrice: number;
  itemImage: string;
  itemStock?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

// Feature Flag Types
export interface FeatureFlag {
  enabled: boolean;
  variants?: Record<string, unknown>;
}

export interface FeatureFlagConfig {
  [flagName: string]: FeatureFlag;
}

export interface MultiVariantFlag extends FeatureFlag {
  variants: {
    [variantName: string]: {
      enabled: boolean;
      value: unknown;
    };
  };
  defaultVariant: string;
}

// API Response Types
export interface ApiResponse<T> {
  statusCode: number;
  body: T;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}

// Context Types
export interface AppContextType {
  products: Product[];
  cart: CartItem[];
  featureFlags: FeatureFlagConfig;
  loading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loadProducts: () => Promise<void>;
  loadFeatureFlags: () => Promise<void>;
  getTotalItemsInCart: () => number;
}

// Component Props Types
export interface ProductItemProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export interface FeatureComponentProps {
  flagName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface CheckoutBannerProps {
  total: number;
  itemCount: number;
}

export interface CheckoutSummaryProps {
  cart: CartItem[];
  total: number;
}

export interface CheckoutPaymentProps {
  total: number;
  onPlaceOrder: () => void;
}

export interface ItemTableProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

export interface TopMenuProps {
  cartItemCount: number;
}

// Service Types
export interface ApiService {
  getProducts(): Promise<Product[]>;
  getFeatureFlags(): Promise<FeatureFlagConfig>;
}

export interface FeatureFlagService {
  isEnabled(flagName: string): boolean;
  getVariant(flagName: string, context?: Record<string, unknown>): unknown;
  evaluateFlag(flagName: string, userContext?: UserContext): FeatureFlag;
}

export interface UserContext {
  userId?: string;
  region?: string;
  userAgent?: string;
  customAttributes?: Record<string, unknown>;
}

// Currency Service Types
export interface CurrencyService {
  formatPrice(price: number): string;
  getCurrencySymbol(): string;
}