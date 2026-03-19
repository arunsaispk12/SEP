import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase, authHelpers, realtimeHelpers, errorHandler, isSupabaseConfigured } from '../config/supabase';

const AuthContext = createContext();

const initialState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  session: null,
  sessionExpiry: null,
  lastActivity: null,
  loginAttempts: 0,
  isLocked: false
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile,
        session: action.payload.session,
        isAuthenticated: true,
        loading: false,
        error: null,
        sessionExpiry: action.payload.session?.expires_at ? new Date(action.payload.session.expires_at * 1000) : null,
        lastActivity: new Date(),
        loginAttempts: 0,
        isLocked: false
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
        loginAttempts: state.loginAttempts + 1,
        isLocked: state.loginAttempts >= 4
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        sessionExpiry: null,
        lastActivity: null,
        loginAttempts: 0,
        isLocked: false
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: new Date()
      };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: { ...state.profile, ...action.payload }
      };

    case 'SET_LOCKED':
      return {
        ...state,
        isLocked: action.payload
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          // Use Supabase authentication
          const { session, error } = await authHelpers.getCurrentSession();

          if (error) {
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
          }

          if (session?.user) {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              // If profile doesn't exist, user needs to complete registration
              dispatch({ type: 'SET_LOADING', payload: false });
              return;
            }

            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: session.user,
                profile: profile,
                session
              }
            });
          } else {
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data: { subscription } } = realtimeHelpers.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { 
              user: session.user, 
              profile, 
              session 
            } 
          });
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'LOGOUT' });
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Session management - disabled for now
  useEffect(() => {
    // Temporarily disabled automatic logout
    // if (state.isAuthenticated && state.sessionExpiry) {
    //   const interval = setInterval(() => {
    //     const now = new Date();
    //     if (now > state.sessionExpiry) {
    //       console.log('Session expired, logging out');
    //       logout();
    //     }
    //   }, 30000); // Check every 30 seconds

    //   return () => clearInterval(interval);
    // }
  }, [state.isAuthenticated, state.sessionExpiry]);

  // Lockout management
  useEffect(() => {
    if (state.isLocked) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_LOCKED', payload: false });
        dispatch({ type: 'CLEAR_ERROR' });
      }, 300000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, [state.isLocked]);

  const login = async (email, password) => {
    try {
      if (state.isLocked) {
        toast.error('Account temporarily locked. Please try again later.');
        return false;
      }

      dispatch({ type: 'LOGIN_START' });

      if (isSupabaseConfigured()) {
        // Use Supabase authentication
        const { data, error } = await authHelpers.signIn(email, password);

        if (error) {
          const errorMessage = errorHandler.parseError(error);
          dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
          // Don't show toast error here since LoginPage will show the error message
          return false;
        }

        if (data?.user) {
          // Get user profile; if missing, create a minimal one once
          let profile = null;
          try {
            const profileResp = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();
            profile = profileResp.data || null;
          } catch (err) {
            console.warn('Error fetching profile:', err?.message);
          }

          if (!profile) {
            // Attempt to create a minimal profile; ignore errors
            try {
              const minimal = {
                id: data.user.id,
                name: data.user.user_metadata?.name || data.user.email,
                email: data.user.email,
                role: data.user.user_metadata?.role || 'engineer',
                is_admin: data.user.user_metadata?.is_admin || false,
                is_approved: data.user.user_metadata?.role === 'admin', // Admins auto-approved
                location_id: 1,
                phone: '',
                bio: '',
                skills: [],
                certifications: [],
                experience_years: 0,
                avatar: '👤',
                is_available: true,
                is_active: true
              };
              const { data: inserted } = await supabase
                .from('profiles')
                .insert(minimal)
                .select()
                .single();
              profile = inserted || minimal;
            } catch (createErr) {
              console.warn('Profile missing and could not be created; proceeding with minimal profile:', createErr?.message);
              profile = {
                id: data.user.id,
                name: data.user.user_metadata?.name || data.user.email,
                email: data.user.email,
                role: data.user.user_metadata?.role || 'engineer',
                is_admin: data.user.user_metadata?.is_admin || false,
                is_approved: false
              };
            }
          }

          if (!profile.is_approved) {
            await authHelpers.signOut();
            dispatch({ type: 'LOGIN_FAILURE', payload: 'Your account is pending approval from an administrator.' });
            toast.error('Your account is pending approval from an administrator.');
            return false;
          }

          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { 
              user: data.user, 
              profile, 
              session: data.session 
            } 
          });
          toast.success(`Welcome back, ${profile?.name || data.user.email}!`);
          return true;
        }
      }
    } catch (error) {
      const errorMessage = errorHandler.parseError(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await authHelpers.signOut();
      }

      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (isSupabaseConfigured() && state.user) {
        // Update profile in Supabase
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', state.user.id)
          .select()
          .single();

        if (error) {
          toast.error('Failed to update profile');
          return false;
        }

        dispatch({ type: 'UPDATE_PROFILE', payload: data });
        toast.success('Profile updated successfully');
        return true;
      } else if (state.user) {
        // Fallback to localStorage
        const updatedUser = { ...state.user, ...updates };
        localStorage.setItem('engineerUser', JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_PROFILE', payload: updates });
        toast.success('Profile updated successfully');
        return true;
      }
    } catch (error) {
      toast.error('Failed to update profile');
      return false;
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      if (!isSupabaseConfigured()) {
        toast.error('Please configure Supabase credentials first');
        return false;
      }

      dispatch({ type: 'LOGIN_START' });

      // First, try to create the profile BEFORE auth signup
      // This ensures the profile exists when Supabase tries to create the user
      try {
        const profileInsertData = {
          id: '00000000-0000-0000-0000-000000000000', // Temporary ID, will be updated
          name: userData.name || email,
          email: email,
          role: userData.role || 'engineer',
          is_admin: userData.is_admin || false,
          location_id: userData.location_id || 1,
          phone: userData.phone || '',
          bio: userData.bio || '',
          skills: userData.skills || [],
          certifications: userData.certifications || [],
          experience_years: userData.experience_years || 0,
          avatar: userData.avatar || '👤',
          is_available: true,
          is_active: true
        };

        // Insert with a temporary constraint check bypass
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileInsertData)
          .select()
          .single();

        if (profileError) {
          // Profile pre-creation failed (expected)
        } else {
          // Profile pre-created successfully
        }
      } catch (preCreateError) {
        // Profile pre-creation failed (expected)
      }

      const { data, error } = await authHelpers.signUp(email, password, userData);

      if (error) {
        const errorMessage = errorHandler.parseError(error);
        dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
        toast.error(errorMessage);
        return false;
      }

      if (data?.user) {
        // Ensure profile exists and is properly linked
        try {
          const profileInsertData = {
            id: data.user.id,
            name: userData.name || email,
            email: email,
            role: userData.role || 'engineer',
            is_admin: userData.is_admin || false,
            location_id: userData.location_id || 1,
            phone: userData.phone || '',
            bio: userData.bio || '',
            skills: userData.skills || [],
            certifications: userData.certifications || [],
            experience_years: userData.experience_years || 0,
            avatar: userData.avatar || '👤',
            is_available: true,
            is_active: true
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileInsertData, { onConflict: 'id' })
            .select()
            .single();

          if (profileError) {
            // Try a simple insert without upsert
            try {
              const { error: simpleError } = await supabase
                .from('profiles')
                .insert(profileInsertData)
                .select()
                .single();

              if (simpleError) {
                // Simple profile insert also failed
              }
            } catch (simpleError) {
              // All profile creation attempts failed
            }
          }
        } catch (profileError) {
          // Profile operations failed
        }

        // If email confirmation is disabled, automatically sign in the user
        if (data.user.email_confirmed_at) {
          // Get the final profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: data.user,
              profile: profile || {
                id: data.user.id,
                name: userData.name || email,
                email: email,
                role: userData.role || 'engineer',
                is_admin: userData.is_admin || false
              },
              session: data.session
            }
          });
          toast.success('Account created and signed in successfully!');
          return true;
        } else {
          // User needs to confirm email
          toast.success('Account created! Please check your email to verify your account.');
          dispatch({ type: 'SET_LOADING', payload: false });
          return true;
        }
      }
    } catch (error) {
      const errorMessage = errorHandler.parseError(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      toast.error('Registration failed. Please try again.');
      return false;
    }
  };

  const resetPassword = async (email) => {
    try {
      if (!isSupabaseConfigured()) {
        toast.error('Password reset not available in demo mode');
        return false;
      }

      const { error } = await authHelpers.resetPassword(email);
      
      if (error) {
        toast.error(errorHandler.parseError(error));
        return false;
      }

      toast.success('Password reset email sent!');
      return true;
    } catch (error) {
      toast.error('Failed to send password reset email');
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!isSupabaseConfigured()) {
        toast.error('Password change not available in demo mode');
        return false;
      }

      // Verify current password by re-authenticating
      if (currentPassword && state.user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: state.user.email,
          password: currentPassword
        });
        if (signInError) {
          toast.error('Current password is incorrect');
          return false;
        }
      }

      const { error } = await authHelpers.updatePassword(newPassword);

      if (error) {
        toast.error(errorHandler.parseError(error));
        return false;
      }

      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      toast.error('Failed to change password');
      return false;
    }
  };

  const updateActivity = () => {
    dispatch({ type: 'UPDATE_ACTIVITY' });
  };

  const value = {
    ...state,
    login,
    logout,
    signUp,
    resetPassword,
    changePassword,
    updateProfile,
    updateActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
