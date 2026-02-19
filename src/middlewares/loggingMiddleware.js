/**
 * Logging Middleware
 * Provides centralized logging functionality for the application
 */

class LoggingMiddleware {
  constructor(options = {}) {
    this.level = options.level || 'info'; // debug, info, warn, error
    this.includeTimestamp = options.includeTimestamp !== false;
    this.includeUser = options.includeUser !== false;
    this.maxLogLength = options.maxLogLength || 1000;
  }

  /**
   * Log levels hierarchy
   */
  static LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /**
   * Check if current level should log the given level
   */
  shouldLog(level) {
    return LoggingMiddleware.LEVELS[level] >= LoggingMiddleware.LEVELS[this.level];
  }

  /**
   * Format log message with metadata
   */
  formatMessage(level, message, context = {}) {
    const timestamp = this.includeTimestamp ? `[${new Date().toISOString()}]` : '';
    const userInfo = this.includeUser && context.user ? `[User: ${context.user.id || 'unknown'}]` : '';
    const levelTag = `[${level.toUpperCase()}]`;

    let formattedMessage = `${timestamp} ${userInfo} ${levelTag} ${message}`;

    // Truncate if too long
    if (formattedMessage.length > this.maxLogLength) {
      formattedMessage = formattedMessage.substring(0, this.maxLogLength - 3) + '...';
    }

    return formattedMessage;
  }

  /**
   * Log debug messages
   */
  debug(message, context = {}) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log info messages
   */
  info(message, context = {}) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log warning messages
   */
  warn(message, context = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  /**
   * Log error messages
   */
  error(message, error = null, context = {}) {
    if (this.shouldLog('error')) {
      const errorInfo = error ? `\nError: ${error.message || error}\nStack: ${error.stack || 'No stack trace'}` : '';
      console.error(this.formatMessage('error', `${message}${errorInfo}`, context));
    }
  }

  /**
   * Log API requests
   */
  logApiRequest(method, url, data = null, context = {}) {
    this.info(`API ${method} ${url}`, {
      ...context,
      api: { method, url, data }
    });
  }

  /**
   * Log API responses
   */
  logApiResponse(method, url, status, response = null, context = {}) {
    const level = status >= 400 ? 'warn' : 'info';
    this[level](`API ${method} ${url} - ${status}`, {
      ...context,
      api: { method, url, status, response }
    });
  }

  /**
   * Log user actions
   */
  logUserAction(action, details = {}, context = {}) {
    this.info(`User Action: ${action}`, {
      ...context,
      userAction: { action, ...details }
    });
  }

  /**
   * Log state changes
   */
  logStateChange(component, prevState, newState, context = {}) {
    this.debug(`State Change: ${component}`, {
      ...context,
      stateChange: { component, prevState, newState }
    });
  }

  /**
   * Create a middleware function for function composition
   */
  createMiddleware() {
    const logger = this;
    return (next) => (action) => {
      logger.debug(`Action dispatched: ${action.type || 'unknown'}`, {
        action: action
      });

      try {
        const result = next(action);
        logger.debug(`Action completed: ${action.type || 'unknown'}`);
        return result;
      } catch (error) {
        logger.error(`Action failed: ${action.type || 'unknown'}`, error, {
          action: action
        });
        throw error;
      }
    };
  }
}

export default LoggingMiddleware;