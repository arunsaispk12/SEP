/**
 * Middleware Configuration
 * Centralized configuration for all middlewares
 */

const middlewareConfig = {
  // Environment settings
  environment: process.env.NODE_ENV || 'development',

  // Global middleware settings
  enableLogging: true,
  enableAuth: true,
  enableErrorHandling: true,

  // Logging middleware configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    includeTimestamp: true,
    includeUser: true,
    maxLogLength: 1000
  },

  // Authentication middleware configuration
  auth: {
    requiredRoles: [], // Can be overridden per route/component
    redirectOnFail: '/login',
    publicRoutes: ['/login', '/signup', '/'],
    tokenRefreshThreshold: 5 * 60 * 1000 // 5 minutes
  },

  // Error handling middleware configuration
  error: {
    reportErrors: process.env.NODE_ENV === 'production',
    showUserMessages: true,
    retryAttempts: 3,
    retryDelay: 1000,
    errorReportingUrl: process.env.REACT_APP_ERROR_REPORTING_URL || null
  }
};

// Environment-specific overrides
if (middlewareConfig.environment === 'production') {
  middlewareConfig.logging.level = 'error';
  middlewareConfig.error.reportErrors = true;
} else if (middlewareConfig.environment === 'test') {
  middlewareConfig.enableLogging = false;
  middlewareConfig.enableAuth = false;
  middlewareConfig.enableErrorHandling = false;
}

export default middlewareConfig;

// Named exports for specific configurations
export const getLoggingConfig = () => middlewareConfig.logging;
export const getAuthConfig = () => middlewareConfig.auth;
export const getErrorConfig = () => middlewareConfig.error;
export const isProduction = () => middlewareConfig.environment === 'production';
export const isDevelopment = () => middlewareConfig.environment === 'development';
export const isTest = () => middlewareConfig.environment === 'test';