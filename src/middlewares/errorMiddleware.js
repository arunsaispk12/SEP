/**
 * Error Handling Middleware
 * Provides centralized error handling, reporting, and recovery mechanisms
 */

class ErrorMiddleware {
  constructor(options = {}) {
    this.reportErrors = options.reportErrors !== false;
    this.showUserMessages = options.showUserMessages !== false;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // ms
    this.errorReportingUrl = options.errorReportingUrl || null;
    this.environment = options.environment || 'development';
  }

  /**
   * Error types and their handling strategies
   */
  static ERROR_TYPES = {
    NETWORK: 'network',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    VALIDATION: 'validation',
    SERVER: 'server',
    CLIENT: 'client',
    TIMEOUT: 'timeout'
  };

  /**
   * Categorize error based on properties
   */
  categorizeError(error) {
    if (!error) return ErrorMiddleware.ERROR_TYPES.CLIENT;

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network') ||
        error.message?.includes('fetch')) {
      return ErrorMiddleware.ERROR_TYPES.NETWORK;
    }

    // Authentication errors
    if (error.status === 401 || error.message?.includes('unauthorized') ||
        error.message?.includes('authentication')) {
      return ErrorMiddleware.ERROR_TYPES.AUTHENTICATION;
    }

    // Authorization errors
    if (error.status === 403 || error.message?.includes('forbidden') ||
        error.message?.includes('permission')) {
      return ErrorMiddleware.ERROR_TYPES.AUTHORIZATION;
    }

    // Validation errors
    if (error.status === 400 || error.message?.includes('validation') ||
        error.fields) {
      return ErrorMiddleware.ERROR_TYPES.VALIDATION;
    }

    // Server errors
    if (error.status >= 500 || error.message?.includes('server')) {
      return ErrorMiddleware.ERROR_TYPES.SERVER;
    }

    // Timeout errors
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return ErrorMiddleware.ERROR_TYPES.TIMEOUT;
    }

    return ErrorMiddleware.ERROR_TYPES.CLIENT;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error, errorType) {
    const messages = {
      [ErrorMiddleware.ERROR_TYPES.NETWORK]: 'Network connection error. Please check your internet connection.',
      [ErrorMiddleware.ERROR_TYPES.AUTHENTICATION]: 'Authentication failed. Please log in again.',
      [ErrorMiddleware.ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
      [ErrorMiddleware.ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
      [ErrorMiddleware.ERROR_TYPES.SERVER]: 'Server error. Please try again later.',
      [ErrorMiddleware.ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
      [ErrorMiddleware.ERROR_TYPES.CLIENT]: 'An unexpected error occurred. Please try again.'
    };

    return messages[errorType] || messages[ErrorMiddleware.ERROR_TYPES.CLIENT];
  }

  /**
   * Report error to external service
   */
  async reportError(error, context = {}) {
    if (!this.reportErrors || !this.errorReportingUrl) return;

    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        type: this.categorizeError(error),
        timestamp: new Date().toISOString(),
        environment: this.environment,
        context: {
          ...context,
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: context.userId || 'anonymous'
        }
      };

      await fetch(this.errorReportingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      });
    } catch (reportError) {
      // Don't let error reporting failures crash the app
      console.warn('Failed to report error:', reportError);
    }
  }

  /**
   * Log error with appropriate level
   */
  logError(error, context = {}) {
    const errorType = this.categorizeError(error);
    const logger = context.logger;

    if (logger) {
      logger.error(`Error (${errorType}): ${error.message}`, error, context);
    } else {
      console.error(`[${errorType.toUpperCase()}] ${error.message}`, error, context);
    }
  }

  /**
   * Handle error with appropriate strategy
   */
  async handleError(error, context = {}) {
    const errorType = this.categorizeError(error);

    // Log the error
    this.logError(error, context);

    // Report to external service
    await this.reportError(error, context);

    // Show user message if enabled
    if (this.showUserMessages) {
      this.showErrorMessage(error, errorType);
    }

    // Apply recovery strategy
    return this.applyRecoveryStrategy(error, errorType, context);
  }

  /**
   * Show error message to user
   */
  showErrorMessage(error, errorType) {
    const message = this.getUserMessage(error, errorType);

    // Use toast if available, otherwise alert
    if (window.toast) {
      window.toast.error(message);
    } else if (window.alert) {
      alert(message);
    } else {
      console.warn('No toast or alert available for error display');
    }
  }

  /**
   * Apply recovery strategy based on error type
   */
  applyRecoveryStrategy(error, errorType, context) {
    const { operation, retryCount = 0 } = context;

    switch (errorType) {
      case ErrorMiddleware.ERROR_TYPES.NETWORK:
        return this.handleNetworkError(error, operation, retryCount);

      case ErrorMiddleware.ERROR_TYPES.AUTHENTICATION:
        return this.handleAuthError(error);

      case ErrorMiddleware.ERROR_TYPES.TIMEOUT:
        return this.handleTimeoutError(error, operation, retryCount);

      default:
        return { shouldRetry: false, shouldRedirect: false };
    }
  }

  /**
   * Handle network errors with retry logic
   */
  handleNetworkError(error, operation, retryCount) {
    if (retryCount < this.retryAttempts && operation) {
      return {
        shouldRetry: true,
        delay: this.retryDelay * Math.pow(2, retryCount), // Exponential backoff
        retryCount: retryCount + 1
      };
    }

    return { shouldRetry: false };
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error) {
    // Clear auth data and redirect to login
    if (window.authMiddleware) {
      window.authMiddleware.logout();
    } else {
      // Fallback
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return { shouldRetry: false, shouldRedirect: true, redirectTo: '/login' };
  }

  /**
   * Handle timeout errors with retry
   */
  handleTimeoutError(error, operation, retryCount) {
    if (retryCount < this.retryAttempts && operation) {
      return {
        shouldRetry: true,
        delay: this.retryDelay * Math.pow(2, retryCount),
        retryCount: retryCount + 1
      };
    }

    return { shouldRetry: false };
  }

  /**
   * Create error boundary middleware
   */
  createErrorBoundary() {
    const errorHandler = this;

    return (next) => async (action) => {
      try {
        return await next(action);
      } catch (error) {
        const context = {
          action: action.type || 'unknown',
          timestamp: new Date().toISOString()
        };

        await errorHandler.handleError(error, context);
        throw error; // Re-throw to maintain error propagation
      }
    };
  }

  /**
   * Create API error interceptor
   */
  createApiErrorInterceptor() {
    const errorHandler = this;

    return (next) => async (action) => {
      if (action.type && action.type.includes('API_REQUEST')) {
        try {
          return await next(action);
        } catch (error) {
          const context = {
            operation: action.type,
            url: action.url,
            method: action.method,
            retryCount: action.retryCount || 0
          };

          const recovery = await errorHandler.handleError(error, context);

          if (recovery.shouldRetry) {
            // Retry the action with delay
            setTimeout(() => {
              action.retryCount = recovery.retryCount;
              // Dispatch retry action (this would need a proper dispatch mechanism)
              console.log('Retrying action:', action.type);
            }, recovery.delay);
          }

          throw error;
        }
      }

      return next(action);
    };
  }

  /**
   * Wrap async function with error handling
   */
  async wrapAsync(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      return await this.handleError(error, context);
    }
  }

  /**
   * Create error-safe function wrapper
   */
  createSafeWrapper(context = {}) {
    const errorHandler = this;

    return (fn) => {
      return (...args) => {
        return errorHandler.wrapAsync(() => fn(...args), context);
      };
    };
  }
}

export default ErrorMiddleware;