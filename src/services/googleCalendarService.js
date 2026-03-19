import { supabase, TABLES } from '../config/supabase';

class GoogleCalendarService {
  constructor() {
    this.clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    this.apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
    this.scopes = 'https://www.googleapis.com/auth/calendar';
    this.gapi = null;
    this.isInitialized = false;
  }

  // Initialize Google API
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Load Google API script
      await this.loadGapiScript();
      
      // Initialize GAPI
      await new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.apiKey,
              clientId: this.clientId,
              discoveryDocs: [this.discoveryDoc],
              scope: this.scopes
            });
            
            this.gapi = window.gapi;
            this.isInitialized = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error);
      return false;
    }
  }

  // Load Google API script
  loadGapiScript() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.gapi?.auth2?.getAuthInstance()?.isSignedIn?.get() || false;
  }

  // Sign in to Google
  async signIn() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      // Save tokens to database
      await this.saveTokens(user);
      
      return {
        success: true,
        user: user.getBasicProfile(),
        accessToken: user.getAuthResponse().access_token
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign out from Google
  async signOut() {
    try {
      if (!this.isInitialized) return;

      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      
      // Remove tokens from database
      await this.removeTokens();
      
      return { success: true };
    } catch (error) {
      console.error('Google sign-out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Save tokens to database
  async saveTokens(user) {
    try {
      const authResponse = user.getAuthResponse();
      
      // Get current user from Supabase
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No authenticated user');

      const tokenData = {
        user_id: currentUser.id,
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
        token_type: 'Bearer',
        expires_at: new Date(Date.now() + authResponse.expires_in * 1000).toISOString(),
        scope: [this.scopes]
      };

      // Check if token already exists
      const { data: existingToken } = await supabase
        .from(TABLES.GOOGLE_CALENDAR_TOKENS)
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (existingToken) {
        // Update existing token
        await supabase
          .from(TABLES.GOOGLE_CALENDAR_TOKENS)
          .update(tokenData)
          .eq('user_id', currentUser.id);
      } else {
        // Insert new token
        await supabase
          .from(TABLES.GOOGLE_CALENDAR_TOKENS)
          .insert(tokenData);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to save tokens:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove tokens from database
  async removeTokens() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return { success: true };

      await supabase
        .from(TABLES.GOOGLE_CALENDAR_TOKENS)
        .delete()
        .eq('user_id', currentUser.id);

      return { success: true };
    } catch (error) {
      console.error('Failed to remove tokens:', error);
      return { success: false, error: error.message };
    }
  }

  // Get stored tokens
  async getStoredTokens() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return null;

      const { data: tokens } = await supabase
        .from(TABLES.GOOGLE_CALENDAR_TOKENS)
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      return tokens;
    } catch (error) {
      console.error('Failed to get stored tokens:', error);
      return null;
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens?.refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      // Update tokens in database
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase
          .from(TABLES.GOOGLE_CALENDAR_TOKENS)
          .update({
            access_token: data.access_token,
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
          })
          .eq('user_id', currentUser.id);
      }

      return { success: true, accessToken: data.access_token };
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return { success: false, error: error.message };
    }
  }

  // Get valid access token
  async getValidAccessToken() {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens) return null;

      // Check if token is expired
      if (new Date(tokens.expires_at) <= new Date()) {
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          return refreshResult.accessToken;
        }
        return null;
      }

      return tokens.access_token;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  // Create calendar event
  async createEvent(eventData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      // Set the access token
      this.gapi.client.setToken({ access_token: accessToken });

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'Asia/Kolkata'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'Asia/Kolkata'
        },
        attendees: eventData.attendees || [],
        location: eventData.location || '',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return {
        success: true,
        event: response.result
      };
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update calendar event
  async updateEvent(eventId, eventData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      this.gapi.client.setToken({ access_token: accessToken });

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'Asia/Kolkata'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'Asia/Kolkata'
        },
        attendees: eventData.attendees || [],
        location: eventData.location || ''
      };

      const response = await this.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return {
        success: true,
        event: response.result
      };
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete calendar event
  async deleteEvent(eventId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      this.gapi.client.setToken({ access_token: accessToken });

      await this.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get calendar events
  async getEvents(timeMin, timeMax, maxResults = 100) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      this.gapi.client.setToken({ access_token: accessToken });

      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return {
        success: true,
        events: response.result.items || []
      };
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return {
        success: false,
        error: error.message,
        events: []
      };
    }
  }

  // Sync schedule to Google Calendar
  async syncScheduleToCalendar(schedule) {
    try {
      const eventData = {
        title: schedule.title,
        description: schedule.description || '',
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        location: schedule.location?.name || '',
        timeZone: 'Asia/Kolkata',
        attendees: []
      };

      const result = await this.createEvent(eventData);
      
      if (result.success) {
        // Update schedule with Google Calendar event ID
        await supabase
          .from(TABLES.SCHEDULES)
          .update({ 
            google_calendar_event_id: result.event.id,
            synced_to_calendar: true
          })
          .eq('id', schedule.id);
      }

      return result;
    } catch (error) {
      console.error('Failed to sync schedule to calendar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sync case to Google Calendar
  async syncCaseToCalendar(caseData) {
    try {
      const eventData = {
        title: `Case: ${caseData.title}`,
        description: `Priority: ${caseData.priority}\nStatus: ${caseData.status}\n\n${caseData.description || ''}`,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        location: caseData.location?.name || '',
        timeZone: 'Asia/Kolkata',
        attendees: []
      };

      const result = await this.createEvent(eventData);
      
      if (result.success) {
        // Update case with Google Calendar event ID
        await supabase
          .from(TABLES.CASES)
          .update({ 
            google_calendar_event_id: result.event.id,
            synced_to_calendar: true
          })
          .eq('id', caseData.id);
      }

      return result;
    } catch (error) {
      console.error('Failed to sync case to calendar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if Google Calendar is enabled
  isEnabled() {
    return !!(this.clientId && this.apiKey);
  }
}

const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;
