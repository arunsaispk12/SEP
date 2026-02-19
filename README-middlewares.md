# Middleware Implementation Guide

This document describes the custom middleware system implemented for the Planner application.

## Overview

The middleware system provides centralized functionality for:
- **Logging**: Structured logging with different levels and context
- **Authentication**: User authentication, session management, and route protection
- **Error Handling**: Comprehensive error handling with retry logic and user feedback

## Architecture

### Core Components

1. **LoggingMiddleware** (`src/middlewares/loggingMiddleware.js`)
   - Handles all application logging
   - Configurable log levels (debug, info, warn, error)
   - Timestamp and user context inclusion
   - API request/response logging

2. **AuthMiddleware** (`src/middlewares/authMiddleware.js`)
   - JWT token management
   - Route access control
   - Session persistence
   - Authentication guards

3. **ErrorMiddleware** (`src/middlewares/errorMiddleware.js`)
   - Error categorization and handling
   - Automatic retry logic for network errors
   - User-friendly error messages
   - External error reporting

4. **MiddlewareManager** (`src/middlewares/middlewareManager.js`)
   - Orchestrates all middlewares
   - Provides unified interface
   - Manages middleware stack execution

### Configuration

Middleware configuration is centralized in `src/config/middleware.js`:

```javascript
const middlewareConfig = {
  environment: process.env.NODE_ENV || 'development',
  enableLogging: true,
  enableAuth: true,
  enableErrorHandling: true,

  logging: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    includeTimestamp: true,
    includeUser: true,
    maxLogLength: 1000
  },

  auth: {
    requiredRoles: [],
    redirectOnFail: '/login',
    publicRoutes: ['/login', '/signup', '/'],
    tokenRefreshThreshold: 5 * 60 * 1000
  },

  error: {
    reportErrors: process.env.NODE_ENV === 'production',
    showUserMessages: true,
    retryAttempts: 3,
    retryDelay: 1000,
    errorReportingUrl: process.env.REACT_APP_ERROR_REPORTING_URL
  }
};
```

## Usage

### In Components

Use the `useMiddleware` hook for accessing middlewares:

```javascript
import { useMiddleware } from '../hooks/useMiddleware';

function MyComponent() {
  const { logging, auth, error, logUserAction, handleError } = useMiddleware();

  const handleClick = async () => {
    try {
      logUserAction('button_clicked', { buttonId: 'submit' });
      // Your logic here
    } catch (err) {
      await handleError(err, { component: 'MyComponent', action: 'handleClick' });
    }
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### In Contexts

Middlewares are integrated into existing contexts like EngineerContext:

```javascript
// Get middleware instances
const logger = middlewareManager.get('logging');
const errorHandler = middlewareManager.get('error');

// Use them in operations
logger.info('Starting data load');
await errorHandler.wrapAsync(() => loadData());
```

### Direct Usage

Access middlewares globally:

```javascript
// Via window object (available globally)
window.loggingMiddleware.info('Direct logging');

// Via middleware manager
const manager = window.middlewareManager;
manager.get('auth').isAuthenticated();
```

## Middleware Stack

Middlewares are executed in this order:
1. **Auth Guard**: Checks authentication and permissions
2. **Error Boundary**: Catches and handles errors
3. **API Error Interceptor**: Handles API-specific errors
4. **API Auth Interceptor**: Adds auth headers to requests
5. **Logging**: Logs all actions (last to capture everything)

## Error Types and Handling

The error middleware categorizes errors:
- **NETWORK**: Connection issues with retry logic
- **AUTHENTICATION**: Login/session issues → redirect to login
- **AUTHORIZATION**: Permission issues → show error
- **VALIDATION**: Input validation errors
- **SERVER**: 5xx errors
- **TIMEOUT**: Request timeouts with retry
- **CLIENT**: Other errors

## Hooks

### useMiddleware
Main hook for accessing all middlewares.

### useMiddlewareLogger
Component lifecycle logging hook.

### useErrorBoundary
Enhanced error boundary with middleware integration.

## Environment-Specific Behavior

- **Development**: Full logging, detailed error info, mock auth
- **Production**: Warning+ level logging, error reporting, real auth
- **Test**: Minimal logging, disabled auth/error handling

## Best Practices

1. **Use appropriate log levels**: Debug for development, Info for important events, Warn for issues, Error for failures
2. **Include context**: Always provide relevant context in logs and errors
3. **Handle errors gracefully**: Use the error middleware for consistent error handling
4. **Check authentication**: Use auth middleware before protected operations
5. **Log user actions**: Track important user interactions for analytics/debugging

## Extending

To add new middlewares:

1. Create the middleware class in `src/middlewares/`
2. Add it to the MiddlewareManager's initialize method
3. Update the configuration in `src/config/middleware.js`
4. Export from `src/middlewares/index.js`

## Testing

Middlewares can be tested individually or as a system:

```javascript
// Test individual middleware
const logger = new LoggingMiddleware({ level: 'debug' });
logger.info('Test message');

// Test middleware manager
const manager = new MiddlewareManager(config);
manager.initialize();
await manager.execute({ type: 'TEST_ACTION' });
```

## Performance Considerations

- Middlewares add minimal overhead when properly configured
- Logging is optimized for production (higher log levels)
- Error reporting is async and non-blocking
- Auth checks are cached where possible

## Security Notes

- Never log sensitive information (passwords, tokens in full)
- JWT tokens are validated client-side but should be verified server-side
- Error reports don't include sensitive user data
- Public routes are explicitly defined to prevent bypass