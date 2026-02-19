/**
 * Middleware Manager
 * Orchestrates multiple middlewares and provides a unified interface
 */

import React from 'react';
import LoggingMiddleware from './loggingMiddleware';
import AuthMiddleware from './authMiddleware';
import ErrorMiddleware from './errorMiddleware';

class MiddlewareManager {
  constructor(config = {}) {
    this.config = {
      environment: config.environment || 'development',
      enableLogging: config.enableLogging !== false,
      enableAuth: config.enableAuth !== false,
      enableErrorHandling: config.enableErrorHandling !== false,
      ...config
    };

    this.middlewares = new Map();
    this.middlewareStack = [];
    this.initialized = false;
  }

  /**
   * Initialize all configured middlewares
   */
  initialize() {
    if (this.initialized) return;

    // Initialize logging middleware
    if (this.config.enableLogging) {
      this.middlewares.set('logging', new LoggingMiddleware({
        level: this.config.logging?.level || 'info',
        includeTimestamp: this.config.logging?.includeTimestamp,
        includeUser: this.config.logging?.includeUser,
        maxLogLength: this.config.logging?.maxLogLength
      }));
    }

    // Initialize auth middleware
    if (this.config.enableAuth) {
      this.middlewares.set('auth', new AuthMiddleware({
        requiredRoles: this.config.auth?.requiredRoles || [],
        redirectOnFail: this.config.auth?.redirectOnFail || '/login',
        publicRoutes: this.config.auth?.publicRoutes || ['/login', '/signup'],
        tokenRefreshThreshold: this.config.auth?.tokenRefreshThreshold
      }));
    }

    // Initialize error middleware
    if (this.config.enableErrorHandling) {
      this.middlewares.set('error', new ErrorMiddleware({
        reportErrors: this.config.error?.reportErrors,
        showUserMessages: this.config.error?.showUserMessages,
        retryAttempts: this.config.error?.retryAttempts,
        retryDelay: this.config.error?.retryDelay,
        errorReportingUrl: this.config.error?.errorReportingUrl,
        environment: this.config.environment
      }));
    }

    // Build middleware stack
    this.buildMiddlewareStack();

    // Make middlewares globally available
    this.attachToGlobal();

    this.initialized = true;

    if (this.config.enableLogging) {
      this.get('logging').info('Middleware manager initialized', {
        config: this.config,
        activeMiddlewares: Array.from(this.middlewares.keys())
      });
    }
  }

  /**
   * Build the middleware execution stack
   */
  buildMiddlewareStack() {
    this.middlewareStack = [];

    // Add auth guard first (for access control)
    if (this.middlewares.has('auth')) {
      this.middlewareStack.push(this.middlewares.get('auth').createAuthGuard());
    }

    // Add error boundary
    if (this.middlewares.has('error')) {
      this.middlewareStack.push(this.middlewares.get('error').createErrorBoundary());
    }

    // Add API error interceptor
    if (this.middlewares.has('error')) {
      this.middlewareStack.push(this.middlewares.get('error').createApiErrorInterceptor());
    }

    // Add API auth interceptor
    if (this.middlewares.has('auth')) {
      this.middlewareStack.push(this.middlewares.get('auth').createApiInterceptor());
    }

    // Add logging middleware last (to log everything)
    if (this.middlewares.has('logging')) {
      this.middlewareStack.push(this.middlewares.get('logging').createMiddleware());
    }
  }

  /**
   * Get a specific middleware instance
   */
  get(name) {
    return this.middlewares.get(name);
  }

  /**
   * Add a custom middleware
   */
  addMiddleware(name, middleware, options = {}) {
    if (typeof middleware === 'function') {
      this.middlewares.set(name, {
        createMiddleware: () => middleware,
        ...options
      });
    } else if (middleware.createMiddleware) {
      this.middlewares.set(name, middleware);
    } else {
      throw new Error(`Invalid middleware: ${name}`);
    }

    this.buildMiddlewareStack();
  }

  /**
   * Remove a middleware
   */
  removeMiddleware(name) {
    this.middlewares.delete(name);
    this.buildMiddlewareStack();
  }

  /**
   * Execute middleware stack
   */
  async execute(action, context = {}) {
    if (!this.initialized) {
      throw new Error('Middleware manager not initialized');
    }

    // Create execution chain
    let chain = (action) => action;

    // Compose middlewares (right to left)
    for (let i = this.middlewareStack.length - 1; i >= 0; i--) {
      const middleware = this.middlewareStack[i];
      const next = chain;
      chain = (action) => middleware(() => next(action))(action);
    }

    // Execute with context
    return await chain(action);
  }

  /**
   * Execute middleware stack synchronously
   */
  executeSync(action, context = {}) {
    if (!this.initialized) {
      throw new Error('Middleware manager not initialized');
    }

    // For sync execution, we'll use a simplified approach
    for (const middleware of this.middlewareStack) {
      if (middleware.sync) {
        action = middleware.sync(action, context);
      }
    }

    return action;
  }

  /**
   * Attach middlewares to global scope for easy access
   */
  attachToGlobal() {
    if (typeof window !== 'undefined') {
      window.middlewareManager = this;

      // Attach individual middlewares
      this.middlewares.forEach((middleware, name) => {
        window[`${name}Middleware`] = middleware;
      });
    }

    if (typeof global !== 'undefined') {
      global.middlewareManager = this;

      this.middlewares.forEach((middleware, name) => {
        global[`${name}Middleware`] = middleware;
      });
    }
  }

  /**
   * Create a higher-order component wrapper
   */
  createHOCWrapper() {
    return (WrappedComponent) => {
      return (props) => {
        // Inject middleware manager into props
        return <WrappedComponent {...props} middlewareManager={this} />;
      };
    };
  }

  /**
   * Create a hook for using middlewares
   */
  createHook() {
    return () => {
      if (!this.initialized) {
        throw new Error('Middleware manager not initialized. Call initialize() first.');
      }

      return {
        execute: (action, context) => this.execute(action, context),
        executeSync: (action, context) => this.executeSync(action, context),
        get: (name) => this.get(name),
        logging: this.get('logging'),
        auth: this.get('auth'),
        error: this.get('error')
      };
    };
  }

  /**
   * Create a context provider wrapper
   */
  createProviderWrapper() {
    const MiddlewareContext = React.createContext(this);

    return {
      Provider: ({ children, config }) => {
        const manager = React.useMemo(() => {
          const mgr = new MiddlewareManager(config);
          mgr.initialize();
          return mgr;
        }, [config]);

        return (
          <MiddlewareContext.Provider value={manager}>
            {children}
          </MiddlewareContext.Provider>
        );
      },
      useMiddleware: () => React.useContext(MiddlewareContext)
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.middlewares.clear();
    this.middlewareStack = [];
    this.initialized = false;

    // Remove from global scope
    if (typeof window !== 'undefined') {
      delete window.middlewareManager;
      delete window.loggingMiddleware;
      delete window.authMiddleware;
      delete window.errorMiddleware;
    }

    if (typeof global !== 'undefined') {
      delete global.middlewareManager;
      delete global.loggingMiddleware;
      delete global.authMiddleware;
      delete global.errorMiddleware;
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration (requires reinitialization)
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.initialized = false;
    this.initialize();
  }
}

// Create singleton instance
let defaultInstance = null;

export const getMiddlewareManager = (config = {}) => {
  if (!defaultInstance) {
    defaultInstance = new MiddlewareManager(config);
  }
  return defaultInstance;
};

export default MiddlewareManager;