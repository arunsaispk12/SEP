/**
 * useMiddleware Hook
 * React hook for using middleware manager in components
 */

import { useMemo, useCallback } from 'react';
import { getMiddlewareManager } from '../middlewares';

/**
 * Hook to access middleware manager
 */
export function useMiddleware() {
  const middlewareManager = useMemo(() => getMiddlewareManager(), []);

  return useMemo(() => ({
    // Direct access to middlewares
    logging: middlewareManager.get('logging'),
    auth: middlewareManager.get('auth'),
    error: middlewareManager.get('error'),

    // Execution methods
    execute: (action, context) => middlewareManager.execute(action, context),
    executeSync: (action, context) => middlewareManager.executeSync(action, context),

    // Utility methods
    get: (name) => middlewareManager.get(name),
    logUserAction: (action, details = {}) => {
      const logger = middlewareManager.get('logging');
      const user = middlewareManager.get('auth')?.getUser();
      logger?.logUserAction(action, { ...details, userId: user?.id });
    },

    logApiCall: (method, url, status, context = {}) => {
      const logger = middlewareManager.get('logging');
      if (status >= 400) {
        logger?.logApiResponse(method, url, status, null, context);
      } else {
        logger?.logApiRequest(method, url, null, context);
      }
    },

    handleError: async (error, context = {}) => {
      const errorHandler = middlewareManager.get('error');
      return await errorHandler?.handleError(error, context);
    },

    // Auth helpers
    isAuthenticated: () => middlewareManager.get('auth')?.isAuthenticated(),
    getCurrentUser: () => middlewareManager.get('auth')?.getUser(),
    logout: () => middlewareManager.get('auth')?.logout()
  }), [middlewareManager]);
}

/**
 * Hook for logging component lifecycle events
 */
export function useMiddlewareLogger(componentName) {
  const { logging } = useMiddleware();

  const logMount = useCallback(() => {
    logging?.debug(`Component mounted: ${componentName}`);
  }, [logging, componentName]);

  const logUnmount = useCallback(() => {
    logging?.debug(`Component unmounted: ${componentName}`);
  }, [logging, componentName]);

  const logRender = useCallback(() => {
    logging?.debug(`Component rendered: ${componentName}`);
  }, [logging, componentName]);

  const logAction = useCallback((action, details = {}) => {
    logging?.logUserAction(`ComponentAction: ${componentName}.${action}`, details);
  }, [logging, componentName]);

  return {
    logMount,
    logUnmount,
    logRender,
    logAction
  };
}

/**
 * Hook for error boundary with middleware
 */
export function useErrorBoundary() {
  const { error: errorHandler, logging } = useMiddleware();

  const handleError = useCallback(async (error, errorInfo) => {
    logging?.error('Component error boundary caught error', error, {
      componentStack: errorInfo?.componentStack,
      errorBoundary: true
    });

    return await errorHandler?.handleError(error, {
      errorBoundary: true,
      componentStack: errorInfo?.componentStack
    });
  }, [errorHandler, logging]);

  return { handleError };
}

export default useMiddleware;