# Architecture Guidelines

## Tổng quan kiến trúc

Dự án sử dụng kiến trúc **Component-Based Architecture** với **Next.js App Router**, được thiết kế để:
- Dễ bảo trì và mở rộng
- Tái sử dụng code cao
- Performance tối ưu
- Developer experience tốt

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                   │
├─────────────────────────────────────────────────────────────┤
│  Pages (App Router)  │  Components  │  Layouts  │  UI Kit   │
├─────────────────────────────────────────────────────────────┤
│                        Business Logic Layer                 │
├─────────────────────────────────────────────────────────────┤
│  Hooks  │  Services  │  Utils  │  Context  │  State Mgmt  │
├─────────────────────────────────────────────────────────────┤
│                        Data Layer                           │
├─────────────────────────────────────────────────────────────┤
│  API Routes  │  Database  │  External APIs  │  Cache       │
└─────────────────────────────────────────────────────────────┘
```

## Cấu trúc thư mục chi tiết

```
blog-backend/
├── src/
│   ├── main.ts                  # Bootstrap file (NestFactory.create); adapted for Lambda handler
│   ├── app.module.ts            # Root module importing sub-modules (no AuthModule)
│   ├── common/                  # Shared utilities, filters, interceptors
│   │   ├── filters/             # Global exception filters (e.g., http-exception.filter.ts)
│   │   ├── dtos/                # Shared DTOs (e.g., pagination.dto.ts)
│   │   └── utils/               # Helpers (e.g., uuid-generator.ts, logger.util.ts)
│   ├── config/                  # Configuration module
│   │   └── config.module.ts     # @nestjs/config setup for env vars (AWS_REGION, S3_BUCKET, DB_TABLE, etc.)
│   ├── blog/                    # Core blog module (implements API endpoints)
│   │   ├── blog.module.ts       # Imports controllers, services, Prisma
│   │   ├── controllers/         # API controllers
│   │   │   └── blog.controller.ts  # Defines endpoints (POST /blogs, PATCH /blogs/:id, etc.; no auth guards)
│   │   ├── services/            # Business logic
│   │   │   ├── blog.service.ts  # Core logic for CRUD, status changes, integrates Prisma and S3
│   │   │   ├── dynamo.service.ts # Optional wrapper for direct DynamoDB SDK (if Prisma fallback)
│   │   │   └── s3.service.ts    # Handles S3 uploads/downloads (e.g., MDX files, media)
│   │   ├── dtos/                # Data Transfer Objects
│   │   │   ├── create-blog.dto.ts
│   │   │   ├── update-blog.dto.ts
│   │   │   └── blog-status.dto.ts
│   │   ├── entities/            # Prisma entities or interfaces
│   │   │   └── blog.entity.ts   # TypeScript interface for blog post (mirrors DynamoDB schema)
│   │   └── __tests__/           # Unit tests
│   │       ├── blog.controller.spec.ts
│   │       └── blog.service.spec.ts
│   └── prisma/                  # Prisma configuration (for DynamoDB)
│       ├── schema.prisma        # Prisma schema file (defines BlogPosts model)
│       └── prisma.service.ts    # Injectable Prisma client service (e.g., provides PrismaClient instance)
├── scripts/                     # Serverless and deployment scripts
│   ├── deploy.sh                # Bash script to run 'serverless deploy' with env setup
│   ├── local-invoke.ts          # Script to invoke Lambda locally (using serverless-offline)
│   ├── build-lambda.ts          # Custom build script for packaging NestJS for Lambda (e.g., using esbuild for optimization)
│   └── test-handler.ts          # Optional test script for Lambda handler (simulates events)
├── test/                        # E2E tests
│   └── app.e2e-spec.ts          # Example E2E test (focus on blog APIs)
├── .env                         # Environment variables (git ignored; e.g., AWS_ACCESS_KEY_ID)
├── .eslintrc.js                 # ESLint config
├── .prettierrc                  # Prettier config
├── nest-cli.json                # Nest CLI config
├── package.json                 # Dependencies (nest, prisma, aws-sdk, serverless, etc.)
├── tsconfig.json                # TypeScript config
├── tsconfig.build.json          # Build config (optimized for Lambda)
├── serverless.yml               # Serverless Framework config: defines functions, IAM roles, API Gateway, environment vars
├── README.md                    # Project documentation (setup, deployment instructions)
└── .gitignore                   # Git ignore file (ignores node_modules, dist, .serverless, etc.)
```

## Design Patterns

### 1. Repository Pattern
```typescript
// services/userService.ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: CreateUserDto): Promise<User>;
  update(id: string, user: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

class UserService implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  }

  async findAll(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return response.data;
  }

  // ... other methods
}
```

### 2. Factory Pattern
```typescript
// lib/factories/componentFactory.ts
interface ComponentConfig {
  type: 'button' | 'input' | 'modal';
  props: Record<string, any>;
}

class ComponentFactory {
  static create(config: ComponentConfig) {
    switch (config.type) {
      case 'button':
        return <Button {...config.props} />;
      case 'input':
        return <Input {...config.props} />;
      case 'modal':
        return <Modal {...config.props} />;
      default:
        throw new Error(`Unknown component type: ${config.type}`);
    }
  }
}
```

### 3. Observer Pattern
```typescript
// lib/events/eventBus.ts
type EventCallback = (data: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventBus();
```

### 4. Strategy Pattern
```typescript
// lib/strategies/validationStrategy.ts
interface ValidationStrategy {
  validate(value: any): boolean;
  getErrorMessage(): string;
}

class EmailValidationStrategy implements ValidationStrategy {
  validate(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  getErrorMessage(): string {
    return 'Please enter a valid email address';
  }
}

class PasswordValidationStrategy implements ValidationStrategy {
  validate(value: string): boolean {
    return value.length >= 8;
  }

  getErrorMessage(): string {
    return 'Password must be at least 8 characters long';
  }
}

class Validator {
  private strategy: ValidationStrategy;

  constructor(strategy: ValidationStrategy) {
    this.strategy = strategy;
  }

  validate(value: any): { isValid: boolean; error?: string } {
    const isValid = this.strategy.validate(value);
    return {
      isValid,
      error: isValid ? undefined : this.strategy.getErrorMessage()
    };
  }
}
```

## State Management

### 1. Context API Pattern
```typescript
// store/authContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 2. Custom Hooks Pattern
```typescript
// hooks/useApi.ts
interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const useApi = <T>(
  url: string,
  options: UseApiOptions<T> = {}
) => {
  const [data, setData] = useState<T | undefined>(options.initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<T>(url);
      setData(response.data);
      options.onSuccess?.(response.data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};
```

## Data Flow

### 1. Unidirectional Data Flow
```
User Action → Component → Hook/Service → API → State Update → UI Update
```

### 2. Component Communication
```typescript
// Parent to Child: Props
<ChildComponent data={data} onAction={handleAction} />

// Child to Parent: Callbacks
const ChildComponent = ({ onAction }: { onAction: (data: any) => void }) => {
  const handleClick = () => {
    onAction(someData);
  };
  return <button onClick={handleClick}>Click me</button>;
};

// Sibling to Sibling: Context/State Management
const ParentComponent = () => {
  const [sharedState, setSharedState] = useState(initialState);
  
  return (
    <SharedContext.Provider value={{ sharedState, setSharedState }}>
      <SiblingA />
      <SiblingB />
    </SharedContext.Provider>
  );
};
```

## Performance Architecture

### 1. Code Splitting
```typescript
// Lazy loading components
const LazyDashboard = lazy(() => import('@/components/Dashboard'));
const LazyProfile = lazy(() => import('@/components/Profile'));

// Route-based code splitting
const DashboardPage = lazy(() => import('@/app/dashboard/page'));
const ProfilePage = lazy(() => import('@/app/profile/page'));
```

### 2. Caching Strategy
```typescript
// lib/cache/cacheManager.ts
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}
```

### 3. Memoization Strategy
```typescript
// utils/memoization.ts
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};
```

## Security Architecture

### 1. Input Validation
```typescript
// lib/validations/schemas.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old')
});

export const validateUser = (data: unknown) => {
  return userSchema.safeParse(data);
};
```

### 2. Authentication Middleware
```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';

export function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify token logic
  const isValid = verifyToken(token);
  
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  return NextResponse.next();
}
```

## Testing Architecture

### 1. Test Structure
```
__tests__/
├── components/
│   ├── Button.test.tsx
│   └── UserCard.test.tsx
├── hooks/
│   ├── useAuth.test.ts
│   └── useApi.test.ts
├── services/
│   ├── authService.test.ts
│   └── userService.test.ts
├── utils/
│   ├── helpers.test.ts
│   └── validations.test.ts
└── __mocks__/
    ├── api.ts
    └── localStorage.ts
```

### 2. Test Utilities
```typescript
// __tests__/utils/testUtils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/store/authContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Deployment Architecture

### 1. Environment Configuration
```typescript
// lib/config/environment.ts
interface EnvironmentConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    enableAnalytics: boolean;
    enableDebugMode: boolean;
  };
}

export const config: EnvironmentConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  environment: process.env.NODE_ENV as EnvironmentConfig['environment'],
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableDebugMode: process.env.NODE_ENV === 'development'
  }
};
```

### 2. Build Optimization
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['example.com'],
  },
  webpack: (config: any) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
    return config;
  },
};
```
