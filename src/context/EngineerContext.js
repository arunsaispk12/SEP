import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import supabaseService from '../services/supabaseService';
import { isSupabaseConfigured, supabase } from '../config/supabase';
import { getMiddlewareManager } from '../middlewares';
import { useAuth } from './AuthContext';

const EngineerContext = createContext();
const DATA_CACHE_KEY = 'sep-engineer-data-cache';

const initialState = {
  engineers: [
    {
      id: 1,
      name: 'Kavin',
      location: 'Hyderabad',
      currentLocation: 'Hyderabad',
      is_available: true,
      travel_start_time: null
    },
    {
      id: 2,
      name: 'Arun',
      location: 'Bangalore',
      currentLocation: 'Bangalore',
      is_available: true,
      travel_start_time: null
    },
    {
      id: 3,
      name: 'Gokul',
      location: 'Coimbatore',
      currentLocation: 'Coimbatore',
      is_available: true,
      travel_start_time: null
    },
    {
      id: 4,
      name: 'Kathir',
      location: 'Chennai',
      currentLocation: 'Chennai',
      is_available: true,
      travel_start_time: null
    }
  ],
  cases: [],
  schedules: [],
  leaves: [],
  locations: ['Hyderabad Office', 'Bangalore Office', 'Coimbatore Office', 'Chennai Office'],
  locationObjects: [],
  clients: [],
  googleCalendarConnected: false,
  loading: false,
  error: null,
  automationConfig: null,
};

function engineerReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null
      };

    case 'ADD_CASE':
      return {
        ...state,
        cases: [...state.cases, action.payload]
      };

    case 'UPDATE_CASE':
      return {
        ...state,
        cases: state.cases.map(case_ =>
          case_.id === action.payload.id ? { ...case_, ...action.payload } : case_
        )
      };

    case 'DELETE_CASE':
      return { ...state, cases: state.cases.filter(c => c.id !== action.payload) };

    case 'UPDATE_ENGINEER':
      return {
        ...state,
        engineers: state.engineers.map(engineer =>
          engineer.id === action.payload.id ? { ...engineer, ...action.payload.updates } : engineer
        )
      };

    case 'ADD_ENGINEER':
      return {
        ...state,
        engineers: [...state.engineers, action.payload]
      };

    case 'DELETE_ENGINEER':
      return {
        ...state,
        engineers: state.engineers.filter(engineer => engineer.id !== action.payload)
      };

    case 'ADD_SCHEDULE':
      return {
        ...state,
        schedules: [...state.schedules, action.payload]
      };

    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(schedule =>
          schedule.id === action.payload.id ? { ...schedule, ...action.payload } : schedule
        )
      };

    case 'DELETE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter(schedule => schedule.id !== action.payload.id)
      };

    case 'LOAD_LEAVES':
      return {
        ...state,
        leaves: action.payload
      };

    case 'ADD_LEAVE':
      return {
        ...state,
        leaves: [...state.leaves, action.payload]
      };

    case 'UPDATE_LEAVE':
      return {
        ...state,
        leaves: state.leaves.map(leave => leave.id === action.payload.id ? { ...leave, ...action.payload } : leave)
      };

    case 'DELETE_LEAVE':
      return {
        ...state,
        leaves: state.leaves.filter(leave => leave.id !== action.payload.id)
      };

    case 'ADD_CLIENT':
      return {
        ...state,
        clients: [...state.clients, action.payload]
      };

    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id ? { ...client, ...action.payload.updates } : client
        )
      };

    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload)
      };

    case 'SET_GOOGLE_CALENDAR_CONNECTED':
      return {
        ...state,
        googleCalendarConnected: action.payload
      };

    case 'SET_AUTOMATION_CONFIG':
      return { ...state, automationConfig: action.payload };

    default:
      return state;
  }
}

export function EngineerProvider({ children }) {
  const [state, dispatch] = useReducer(engineerReducer, initialState);
  const { loading: authLoading, isAuthenticated, user } = useAuth();
  const loadRequestRef = useRef(0);
  const hydratedUserRef = useRef(null);

  // Get middleware manager
  const middlewareManager = getMiddlewareManager();

  const restoreCachedData = useCallback((userId) => {
    try {
      const raw = localStorage.getItem(DATA_CACHE_KEY);
      if (!raw) return false;

      const parsed = JSON.parse(raw);
      if (!parsed?.userId || parsed.userId !== userId || !parsed.payload) {
        return false;
      }

      dispatch({ type: 'LOAD_DATA', payload: parsed.payload });
      return true;
    } catch (error) {
      console.warn('Failed to restore cached engineer data:', error);
      return false;
    }
  }, []);

  const cacheLoadedData = useCallback((userId, payload) => {
    if (!userId) return;

    try {
      localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
        userId,
        payload,
        cachedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to cache engineer data:', error);
    }
  }, []);

  const loadData = useCallback(async ({ background = false } = {}) => {
    const logger = middlewareManager.get('logging');
    const errorHandler = middlewareManager.get('error');
    const requestId = ++loadRequestRef.current;

    if (logger) {
      logger.info('EngineerContext.loadData called', { background, requestId });
    } else {
      console.warn('Logger middleware not available');
    }

    try {
      if (!background) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }

      if (logger) {
        logger.debug('Starting engineer data load', { background, requestId });
      }

      if (isSupabaseConfigured()) {
        console.log('Supabase is configured, fetching data from Supabase...');
        // Use Supabase — race against a 20s timeout to prevent infinite loading on cold start
        const fetchTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Data fetch timed out — Supabase may be waking up')), 20000)
        );
        const [engineers, cases, schedules, locations, leaves, clients] = await Promise.race([
          Promise.all([
            supabaseService.getEngineers(),
            supabaseService.getCases(),
            supabaseService.getSchedules(),
            supabaseService.getLocations(),
            supabaseService.getLeavesOverlappingRange('1900-01-01', '2999-12-31'),
            supabaseService.getClients()
          ]),
          fetchTimeout
        ]);

        if (logger) {
          logger.info('Supabase data fetched', {
            engineersCount: engineers?.length || 0,
            casesCount: cases?.length || 0,
            schedulesCount: schedules?.length || 0,
            locationsCount: locations?.length || 0,
            leavesCount: leaves?.length || 0,
            clientsCount: clients?.length || 0
          });
        }

        const payload = {
          engineers: engineers.map(engineer => ({
            ...engineer,
            location: engineer.location?.name || 'Unknown',
            currentLocation: engineer.current_location?.name || 'Unknown'
          })),
          cases: cases.map(case_ => ({
            ...case_,
            location: case_.location?.name || 'Unknown',
            assignedEngineer: case_.assigned_engineer?.name || null
          })),
          schedules: schedules.map(schedule => ({
            ...schedule,
            location: schedule.location?.name || 'Unknown',
            engineer: schedule.engineer?.name || 'Unknown',
            start: schedule.start_time,
            end: schedule.end_time
          })),
          leaves,
          clients,
          locationObjects: locations,
          locations: locations.map(location => location.name)
        };

        if (logger) {
          logger.debug('Dispatching LOAD_DATA with payload', {
            engineersCount: payload.engineers?.length || 0,
            casesCount: payload.cases?.length || 0,
            schedulesCount: payload.schedules?.length || 0,
            locationsCount: payload.locations?.length || 0,
            leavesCount: payload.leaves?.length || 0
          });
        }

        if (requestId !== loadRequestRef.current) {
          if (logger) {
            logger.debug('Ignoring stale engineer data response', {
              requestId,
              latestRequestId: loadRequestRef.current
            });
          }
          return;
        }

        dispatch({
          type: 'LOAD_DATA',
          payload
        });
        cacheLoadedData(user?.id, payload);
      } else {
        if (logger) {
          logger.info('Supabase not configured, using localStorage fallback');
        }
        // Use localStorage fallback
        const savedData = localStorage.getItem('engineerPlannerData');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            logger.info('Loaded data from localStorage', {
              engineersCount: parsedData.engineers?.length || 0,
              casesCount: parsedData.cases?.length || 0,
              schedulesCount: parsedData.schedules?.length || 0
            });

            if (requestId !== loadRequestRef.current) {
              return;
            }

            dispatch({ type: 'LOAD_DATA', payload: parsedData });
          } catch (error) {
            if (logger) {
              logger.error('Error loading saved data', error);
            }
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          if (logger) {
            logger.debug('No saved data in localStorage, setting loading to false');
          }
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    } catch (error) {
      if (errorHandler) {
        await errorHandler.handleError(error, {
          operation: 'loadData',
          context: 'EngineerContext'
        });
      } else {
        console.error('Error in loadData:', error);
      }
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast.error('Failed to load data from database');
    }
  }, [cacheLoadedData, middlewareManager, user?.id]);

  const addLeave = useCallback(async (leaveData) => {
    try {
      if (isSupabaseConfigured()) {
        const newLeave = await supabaseService.createLeave(leaveData);
        dispatch({ type: 'ADD_LEAVE', payload: newLeave });
      } else {
        const newLeave = {
          id: Date.now(),
          ...leaveData,
          status: 'approved',
          created_at: new Date().toISOString()
        };
        dispatch({ type: 'ADD_LEAVE', payload: newLeave });
      }
      toast.success('Leave applied');
    } catch (error) {
      console.error('Error adding leave:', error);
      toast.error('Failed to apply leave');
    }
  }, []);

  const updateLeave = useCallback(async (leaveId, updates) => {
    try {
      if (isSupabaseConfigured()) {
        const updatedLeave = await supabaseService.updateLeave(leaveId, updates);
        dispatch({ type: 'UPDATE_LEAVE', payload: updatedLeave });
      } else {
        dispatch({ type: 'UPDATE_LEAVE', payload: { id: leaveId, ...updates } });
      }
      toast.success('Leave updated');
    } catch (error) {
      console.error('Error updating leave:', error);
      toast.error('Failed to update leave');
    }
  }, []);

  const deleteLeave = useCallback(async (leaveId) => {
    try {
      if (isSupabaseConfigured()) {
        await supabaseService.deleteLeave(leaveId);
      }
      dispatch({ type: 'DELETE_LEAVE', payload: { id: leaveId } });
      toast.success('Leave cancelled');
    } catch (error) {
      console.error('Error deleting leave:', error);
      toast.error('Failed to cancel leave');
    }
  }, []);

  const isEngineerOnLeave = useCallback((rangeOrDate, engineerId) => {
    const rangeStart = new Date(rangeOrDate.start || rangeOrDate);
    const rangeEnd = new Date(rangeOrDate.end || rangeOrDate);
    rangeStart.setHours(0,0,0,0);
    rangeEnd.setHours(23,59,59,999);
    return state.leaves.some(l =>
      l.engineer_id === engineerId && l.status === 'approved' &&
      new Date(l.start_date) <= rangeEnd && new Date(l.end_date) >= rangeStart
    );
  }, [state.leaves]);

  const addClient = useCallback(async (clientData) => {
    try {
      if (isSupabaseConfigured()) {
        const client = await supabaseService.createClient(clientData);
        dispatch({ type: 'ADD_CLIENT', payload: client });
        return client;
      } else {
        const mockClient = { ...clientData, id: Math.random() };
        dispatch({ type: 'ADD_CLIENT', payload: mockClient });
        return mockClient;
      }
    } catch (error) {
      console.error('Add client error:', error);
      throw error;
    }
  }, []);

  const updateClient = useCallback(async (id, updates) => {
    try {
      if (isSupabaseConfigured()) {
        const client = await supabaseService.updateClient(id, updates);
        dispatch({ type: 'UPDATE_CLIENT', payload: { id, updates: client } });
        return client;
      } else {
        dispatch({ type: 'UPDATE_CLIENT', payload: { id, updates } });
      }
    } catch (error) {
      console.error('Update client error:', error);
      throw error;
    }
  }, []);

  const deleteClient = useCallback(async (id) => {
    try {
      if (isSupabaseConfigured()) {
        await supabaseService.deleteClient(id);
      }
      dispatch({ type: 'DELETE_CLIENT', payload: id });
    } catch (error) {
      console.error('Delete client error:', error);
      throw error;
    }
  }, []);

  const addCase = useCallback(async (caseData) => {
    try {
      if (isSupabaseConfigured()) {
        const newCase = await supabaseService.createCase({
          ...caseData,
          status: caseData.status || 'open'
        });
        dispatch({ type: 'ADD_CASE', payload: newCase });
      } else {
        // Use localStorage fallback
        const newCase = {
          id: Date.now(),
          ...caseData,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        dispatch({ type: 'ADD_CASE', payload: newCase });
      }
      toast.success('Case added successfully');
    } catch (error) {
      console.error('Error adding case:', error);
      toast.error('Failed to add case');
    }
  }, []);

  const updateCase = useCallback(async (caseId, updates) => {
    try {
      if (isSupabaseConfigured()) {
        const updatedCase = await supabaseService.updateCase(caseId, updates);
        dispatch({ type: 'UPDATE_CASE', payload: updatedCase });
      } else {
        // Use localStorage fallback
        dispatch({ type: 'UPDATE_CASE', payload: { id: caseId, ...updates } });
      }
      toast.success('Case updated successfully');
    } catch (error) {
      console.error('Error updating case:', error);
      toast.error('Failed to update case');
    }
  }, []);

  const deleteCase = useCallback(async (caseId) => {
    try {
      if (isSupabaseConfigured()) {
        await supabaseService.deleteCase(caseId);
      }
      dispatch({ type: 'DELETE_CASE', payload: caseId });
      toast.success('Case deleted');
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Failed to delete case');
    }
  }, []);

  const addSchedule = useCallback(async (scheduleData) => {
    try {
      if (isSupabaseConfigured()) {
        const newSchedule = await supabaseService.createSchedule(scheduleData);
        dispatch({ type: 'ADD_SCHEDULE', payload: newSchedule });
      } else {
        // Use localStorage fallback
        const newSchedule = {
          id: Date.now(),
          ...scheduleData,
          created_at: new Date().toISOString()
        };
        dispatch({ type: 'ADD_SCHEDULE', payload: newSchedule });
      }
      toast.success('Schedule added successfully');
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
    }
  }, []);

  const updateSchedule = useCallback(async (scheduleId, updates) => {
    try {
      if (isSupabaseConfigured()) {
        const updatedSchedule = await supabaseService.updateSchedule(scheduleId, updates);
        dispatch({ type: 'UPDATE_SCHEDULE', payload: updatedSchedule });
      } else {
        // Use localStorage fallback
        dispatch({ type: 'UPDATE_SCHEDULE', payload: { id: scheduleId, ...updates } });
      }
      toast.success('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  }, []);

  const deleteSchedule = useCallback(async (scheduleId) => {
    try {
      if (isSupabaseConfigured()) {
        await supabaseService.deleteSchedule(scheduleId);
      }
      dispatch({ type: 'DELETE_SCHEDULE', payload: { id: scheduleId } });
      toast.success('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  }, []);

  const setGoogleCalendarConnected = useCallback((connected) => {
    dispatch({ type: 'SET_GOOGLE_CALENDAR_CONNECTED', payload: connected });
  }, []);

  // Wait for auth to settle before loading shared dashboard data on refresh.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      loadData();
      return;
    }

    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      dispatch({ type: 'SET_LOADING', payload: false });
      hydratedUserRef.current = null;
      return;
    }

    if (hydratedUserRef.current !== user.id) {
      const restored = restoreCachedData(user.id);
      hydratedUserRef.current = user.id;
      loadData({ background: restored });
    }
  }, [authLoading, isAuthenticated, loadData, restoreCachedData, user?.id]);

  // Re-load data when the auth token is refreshed (SIGNED_IN fires after Supabase cold start).
  // This retries the fetch that may have timed out while the project was waking up.
  useEffect(() => {
    if (!isSupabaseConfigured() || authLoading || !isAuthenticated) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadData({ background: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [authLoading, isAuthenticated, loadData]);

  // Save data to localStorage when not using Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      localStorage.setItem('engineerPlannerData', JSON.stringify(state));
    }
  }, [state]);

  const getEngineerById = useCallback((id) => {
    return state.engineers.find(engineer => engineer.id === id);
  }, [state.engineers]);

  const getCasesByEngineer = useCallback((engineerId) => {
    return state.cases.filter(case_ => case_.assigned_engineer_id === engineerId);
  }, [state.cases]);

  const getAvailableEngineers = useCallback(() => {
    return state.engineers.filter(engineer => engineer.is_available);
  }, [state.engineers]);

  const getEngineersByLocation = useCallback((location) => {
    return state.engineers.filter(engineer =>
      engineer.currentLocation === location || engineer.location === location
    );
  }, [state.engineers]);

  // User Management Functions
  const addEngineer = useCallback(async (engineerData) => {
    try {
      if (isSupabaseConfigured()) {
        const engineer = await supabaseService.createEngineer(engineerData);
        dispatch({ type: 'ADD_ENGINEER', payload: engineer });
        toast.success('Engineer added successfully');
        return engineer;
      } else {
        const newEngineer = {
          ...engineerData,
          id: Date.now(),
          created_at: new Date().toISOString()
        };
        dispatch({ type: 'ADD_ENGINEER', payload: newEngineer });
        toast.success('Engineer added successfully');
        return newEngineer;
      }
    } catch (error) {
      toast.error('Failed to add engineer');
      console.error('Add engineer error:', error);
      throw error;
    }
  }, []);

  const updateEngineer = useCallback(async (id, updates) => {
    try {
      if (isSupabaseConfigured()) {
        const data = await supabaseService.updateEngineer(id, updates);
        dispatch({ type: 'UPDATE_ENGINEER', payload: { id, updates: data } });
        toast.success('Profile updated successfully');
        return data;
      } else {
        dispatch({ type: 'UPDATE_ENGINEER', payload: { id, updates } });
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Update profile error:', error);
      throw error;
    }
  }, []);

  const approveUser = useCallback(async (id) => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('profiles')
          .update({ is_approved: true })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;

        await supabase.from('engineers').update({ is_approved: true }).eq('id', id);

        dispatch({ type: 'UPDATE_ENGINEER', payload: { id, updates: data } });
      } else {
        dispatch({ type: 'UPDATE_ENGINEER', payload: { id, updates: { is_approved: true } } });
      }
      toast.success('User approved successfully!');
    } catch (error) {
      console.error('Approve user error:', error);
      toast.error(error?.message || 'Failed to approve user');
    }
  }, []);

  const deleteEngineer = useCallback(async (id) => {
    try {
      if (isSupabaseConfigured()) {
        await supabaseService.deleteEngineer(id);
        dispatch({ type: 'DELETE_ENGINEER', payload: id });
        toast.success('Engineer deleted successfully');
      } else {
        dispatch({ type: 'DELETE_ENGINEER', payload: id });
        toast.success('Engineer deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete engineer');
      console.error('Delete engineer error:', error);
      throw error;
    }
  }, []);

  const checkLocationConflict = useCallback((engineerId, date, location) => {
    // Requirements: Engineer cannot handle cases at different locations on the same day.
    const targetDate = new Date(date).toDateString();
    
    // Check existing cases for this engineer on the same day
    const sameDayCases = state.cases.filter(c =>
      c.assigned_engineer_id === engineerId &&
      new Date(c.scheduled_start || c.created_at).toDateString() === targetDate
    );

    const conflictingCase = sameDayCases.find(c => c.location !== location);
    if (conflictingCase) {
      return {
        hasConflict: true,
        message: `Engineer already assigned to ${conflictingCase.location} on this day.`,
        conflictingCase
      };
    }

    return { hasConflict: false };
  }, [state.cases]);

  const checkScheduleOverlap = useCallback((engineerId, startTime, endTime, currentCaseId = null) => {
    // Requirements: Allow multiple case assignment but highlight with warning.
    const start = new Date(startTime);
    const end = new Date(endTime);

    const overlappingCases = state.cases.filter(c => {
      if (c.id === currentCaseId || c.assigned_engineer_id !== engineerId) return false;
      
      // Using scheduled_start/end if available, otherwise fallback to created_at
      const cStart = new Date(c.scheduled_start || c.created_at);
      const cEnd = new Date(c.scheduled_end || new Date(cStart).setHours(cStart.getHours() + 2));
      
      return (start < cEnd && end > cStart);
    });

    if (overlappingCases.length > 0) {
      return {
        hasOverlap: true,
        message: `Engineer has ${overlappingCases.length} other case(s) during this time.`,
        overlappingCases
      };
    }

    return { hasOverlap: false };
  }, [state.cases]);

  const loadAutomationConfig = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('automation_config')
        .select('*')
        .eq('id', 1)
        .single();
      if (!error && data) {
        dispatch({ type: 'SET_AUTOMATION_CONFIG', payload: data });
      }
    } catch (err) {
      console.error('Failed to load automation config:', err);
    }
  }, []);

  const saveAutomationConfig = useCallback(async (updates) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('automation_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    dispatch({ type: 'SET_AUTOMATION_CONFIG', payload: data });
    return data;
  }, []);

  const value = useMemo(() => ({
    ...state,
    locationObjects: state.locationObjects || [],
    addCase,
    updateCase,
    deleteCase,
    updateEngineer,
    addEngineer,
    deleteEngineer,
    addClient,
    updateClient,
    deleteClient,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    // Leaves
    addLeave,
    updateLeave,
    deleteLeave,
    isEngineerOnLeave,
    // Approval
    approveUser,
    // Validation
    checkLocationConflict,
    checkScheduleOverlap,
    setGoogleCalendarConnected,
    getEngineerById,
    getCasesByEngineer,
    getAvailableEngineers,
    getEngineersByLocation,
    loadData,
    automationConfig: state.automationConfig,
    loadAutomationConfig,
    saveAutomationConfig,
  }), [state, addCase, updateCase, deleteCase, updateEngineer, addEngineer, deleteEngineer, addClient, updateClient, deleteClient, addSchedule, updateSchedule, deleteSchedule, addLeave, updateLeave, deleteLeave, isEngineerOnLeave, approveUser, checkLocationConflict, checkScheduleOverlap, setGoogleCalendarConnected, getEngineerById, getCasesByEngineer, getAvailableEngineers, getEngineersByLocation, loadData, loadAutomationConfig, saveAutomationConfig]);

  return (
    <EngineerContext.Provider value={value}>
      {children}
    </EngineerContext.Provider>
  );
}

export function useEngineerContext() {
  const context = useContext(EngineerContext);
  if (!context) {
    throw new Error('useEngineerContext must be used within an EngineerProvider');
  }
  return context;
}
