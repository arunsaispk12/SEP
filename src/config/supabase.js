import { createClient } from '@supabase/supabase-js';

// Environment variables with validation
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Using fallback mode.');
}

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'your-supabase-project-url' && 
           supabaseAnonKey !== 'your-supabase-anon-key');
};

// Create Supabase client with enhanced configuration
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'service-engineer-planner-auth'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  ENGINEERS: 'engineers',
  CASES: 'cases',
  SCHEDULES: 'schedules',
  LOCATIONS: 'locations',
  LEAVES: 'leaves',
  USER_SESSIONS: 'user_sessions',
  GOOGLE_CALENDAR_TOKENS: 'google_calendar_tokens',
  NOTIFICATIONS: 'notifications',
  CLIENTS: 'clients'
};

// Authentication helper functions
export const authHelpers = {
  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  // Sign in with email and password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Reset password
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
  },

  // Update password
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  },

  // Update user profile
  async updateProfile(updates) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    return { data, error };
  }
};

// Real-time subscription helpers
export const realtimeHelpers = {
  // Subscribe to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Subscribe to table changes
  subscribeToTable(table, callback) {
    return supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();
  }
};

// Error handling utilities
export const errorHandler = {
  parseError(error) {
    if (this.isNetworkError(error)) {
      return 'Unable to reach the sign-in service. Please check your internet connection or network access and try again.';
    }

    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  },

  isAuthError(error) {
    return error?.message?.includes('auth') || 
           error?.message?.includes('session') ||
           error?.message?.includes('token');
  },

  isNetworkError(error) {
    const message = error?.message?.toLowerCase?.() || '';
    return message.includes('network') ||
           message.includes('fetch') ||
           message.includes('failed to fetch') ||
           message.includes('networkerror') ||
           error?.code === 'NETWORK_ERROR' ||
           error?.name === 'TypeError' ||
           error?.cause?.code === 'ERR_INTERNET_DISCONNECTED' ||
           error?.cause?.message?.includes?.('ERR_INTERNET_DISCONNECTED') ||
           error?.code === 'NETWORK_ERROR';
  }
};
