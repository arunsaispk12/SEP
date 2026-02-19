/**
 * Authentication Middleware
 * Handles authentication checks and user session management
 */

class AuthMiddleware {
  constructor(options = {}) {
    this.requiredRoles = options.requiredRoles || [];
    this.redirectOnFail = options.redirectOnFail || '/login';
    this.publicRoutes = options.publicRoutes || ['/login', '/signup'];
    this.tokenRefreshThreshold = options.tokenRefreshThreshold || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if current route is public
   */
  isPublicRoute(pathname) {
    return this.publicRoutes.some(route =>
      pathname === route || pathname.startsWith(`${route}/`)
    );
  }

  /**
   * Get stored authentication token
   */
  getToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  /**
   * Get stored user data
   */
  getUser() {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Store authentication data
   */
  setAuthData(token, user, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('authToken', token);
    storage.setItem('user', JSON.stringify(user));

    // Clear from other storage
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem('authToken');
    otherStorage.removeItem('user');
  }

  /**
   * Clear authentication data
   */
  clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Invalid token format:', error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Check if user has required role
   */
  hasRequiredRole(user) {
    if (!user || !this.requiredRoles.length) {
      return true;
    }

    return this.requiredRoles.includes(user.role);
  }

  /**
   * Check if token needs refresh
   */
  needsTokenRefresh() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = (payload.exp - currentTime) * 1000;

      return timeUntilExpiry < this.tokenRefreshThreshold;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate request access
   */
  validateAccess(pathname, user = null) {
    // Allow public routes
    if (this.isPublicRoute(pathname)) {
      return { allowed: true };
    }

    // Check authentication
    if (!this.isAuthenticated()) {
      return {
        allowed: false,
        reason: 'not_authenticated',
        redirect: this.redirectOnFail
      };
    }

    // Get user if not provided
    const currentUser = user || this.getUser();

    // Check role-based access
    if (!this.hasRequiredRole(currentUser)) {
      return {
        allowed: false,
        reason: 'insufficient_permissions',
        requiredRoles: this.requiredRoles,
        userRole: currentUser?.role
      };
    }

    return { allowed: true, user: currentUser };
  }

  /**
   * Create authentication guard middleware
   */
  createAuthGuard() {
    const auth = this;

    return (next) => async (action) => {
      const pathname = window.location.pathname;

      // Validate access for route changes
      if (action.type === 'NAVIGATE' || action.type === 'LOCATION_CHANGE') {
        const validation = auth.validateAccess(pathname);

        if (!validation.allowed) {
          // Redirect to login or show error
          if (validation.reason === 'not_authenticated') {
            window.location.href = validation.redirect;
            return;
          } else {
            throw new Error(`Access denied: ${validation.reason}`);
          }
        }
      }

      // Check token refresh for API actions
      if (action.type && action.type.includes('API_')) {
        if (auth.needsTokenRefresh()) {
          try {
            // Trigger token refresh (this would need to be implemented)
            console.log('Token refresh needed');
            // await auth.refreshToken();
          } catch (error) {
            console.error('Token refresh failed:', error);
            auth.clearAuthData();
            window.location.href = auth.redirectOnFail;
            return;
          }
        }
      }

      return next(action);
    };
  }

  /**
   * Create API request interceptor middleware
   */
  createApiInterceptor() {
    const auth = this;

    return (next) => async (action) => {
      // Add auth headers to API requests
      if (action.type && action.type.includes('API_REQUEST')) {
        const token = auth.getToken();

        if (token) {
          action.headers = {
            ...action.headers,
            'Authorization': `Bearer ${token}`
          };
        }
      }

      const result = await next(action);

      // Handle 401 responses
      if (result && result.status === 401) {
        console.warn('Received 401 response, clearing auth data');
        auth.clearAuthData();
        window.location.href = auth.redirectOnFail;
      }

      return result;
    };
  }

  /**
   * Login helper
   */
  async login(credentials, remember = false) {
    try {
      // This would typically make an API call
      // For now, simulate login
      const response = await this.simulateLogin(credentials);

      if (response.success) {
        this.setAuthData(response.token, response.user, remember);
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout helper
   */
  logout() {
    this.clearAuthData();
    window.location.href = this.redirectOnFail;
  }

  /**
   * Simulate login (replace with actual API call)
   */
  async simulateLogin(credentials) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation
    if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
      return {
        success: true,
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 1,
          email: credentials.email,
          role: 'admin',
          name: 'Admin User'
        }
      };
    }

    return {
      success: false,
      error: 'Invalid credentials'
    };
  }
}

export default AuthMiddleware;