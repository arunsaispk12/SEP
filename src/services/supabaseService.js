import { supabase, TABLES } from '../config/supabase';

class SupabaseService {
  // Profile operations
  async getProfile(userId) {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async completeInviteProfile({ name, phone }) {
    const { data: { user } } = await supabase.auth.getUser();

    const profileUpdates = { name, phone, is_active: true, is_approved: true, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(profileUpdates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;

    // Sync to engineers table
    const engineerUpdates = { is_active: true, is_approved: true };
    if (name) engineerUpdates.name = name;
    if (phone) engineerUpdates.phone = phone;
    await supabase.from(TABLES.ENGINEERS).update(engineerUpdates).eq('id', user.id);

    return data;
  }

  async createProfile(profile) {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Engineers
  async getEngineers() {
    const { data, error } = await supabase
      .from(TABLES.ENGINEERS)
      .select(`
        *,
        location:location_id(name),
        current_location:current_location_id(name)
      `)
      .order('name');

    if (error) throw error;
    return data;
  }

  async getEngineerById(id) {
    const { data, error } = await supabase
      .from(TABLES.ENGINEERS)
      .select(`
        *,
        location:location_id(name),
        current_location:current_location_id(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateEngineer(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.ENGINEERS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Sync writable fields to profiles to keep both tables consistent
    const profileUpdates = {};
    const syncFields = ['name', 'role', 'phone', 'location_id', 'laser_type', 'serial_number', 'tracker_status'];
    syncFields.forEach(f => { if (updates[f] !== undefined) profileUpdates[f] = updates[f]; });
    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      await supabase.from('profiles').update(profileUpdates).eq('id', id);
    }

    return data;
  }

  async createEngineer(engineer) {
    const { data, error } = await supabase
      .from(TABLES.ENGINEERS)
      .insert(engineer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteEngineer(id) {
    const { error } = await supabase
      .from(TABLES.ENGINEERS)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Cases
  async getCases() {
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .select(`
        *,
        location:location_id(name),
        assigned_engineer:assigned_engineer_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getCaseById(id) {
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .select(`
        *,
        location:location_id(name),
        assigned_engineer:assigned_engineer_id(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createCase(caseData) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .insert({ ...caseData, created_by: user?.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCase(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCase(id) {
    const { error } = await supabase
      .from(TABLES.CASES)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getCasesByEngineer(engineerId) {
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .select(`
        *,
        location:location_id(name),
        assigned_engineer:assigned_engineer_id(name)
      `)
      .eq('assigned_engineer_id', engineerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getCasesByStatus(status) {
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .select(`
        *,
        location:location_id(name),
        assigned_engineer:assigned_engineer_id(name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getCasesByPriority(priority) {
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .select(`
        *,
        location:location_id(name),
        assigned_engineer:assigned_engineer_id(name)
      `)
      .eq('priority', priority)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Schedules
  async getSchedules() {
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .select(`
        *,
        engineer:engineer_id(name),
        location:location_id(name),
        case:case_id(title, priority, status)
      `)
      .order('start_time');

    if (error) throw error;
    return data;
  }

  async getScheduleById(id) {
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .select(`
        *,
        engineer:engineer_id(name),
        location:location_id(name),
        case:case_id(title, priority, status)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createSchedule(scheduleData) {
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .insert(scheduleData)
      .select()
      .single();

    if (error) throw error;

    // Create notification for the assigned engineer (non-critical — don't let failure roll back schedule)
    if (scheduleData.engineer_id) {
      this.createNotification({
        user_id: scheduleData.engineer_id,
        title: 'New Schedule Assigned',
        message: `You have been assigned a new schedule: ${scheduleData.title}`,
        type: 'info',
        related_id: data.id,
        related_type: 'schedule'
      }).catch(err => console.warn('Notification failed (non-critical):', err));
    }

    return data;
  }

  async updateSchedule(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSchedule(id) {
    const { error } = await supabase
      .from(TABLES.SCHEDULES)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getSchedulesByEngineer(engineerId) {
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .select(`
        *,
        engineer:engineer_id(name),
        location:location_id(name),
        case:case_id(title, priority, status)
      `)
      .eq('engineer_id', engineerId)
      .order('start_time');

    if (error) throw error;
    return data;
  }

  async getSchedulesByDateRange(startDate, endDate) {
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .select(`
        *,
        engineer:engineer_id(name),
        location:location_id(name),
        case:case_id(title, priority, status)
      `)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time');

    if (error) throw error;
    return data;
  }

  async getSchedulesByStatus(status) {
    const { data, error } = await supabase
      .from(TABLES.SCHEDULES)
      .select(`
        *,
        engineer:engineer_id(name),
        location:location_id(name),
        case:case_id(title, priority, status)
      `)
      .eq('status', status)
      .order('start_time');

    if (error) throw error;
    return data;
  }

  // Locations
  async getLocations() {
    const { data, error } = await supabase
      .from(TABLES.LOCATIONS)
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  async getLocationById(id) {
    const { data, error } = await supabase
      .from(TABLES.LOCATIONS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createLocation(location) {
    const { data, error } = await supabase
      .from(TABLES.LOCATIONS)
      .insert(location)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLocation(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.LOCATIONS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLocation(id) {
    const { error } = await supabase
      .from(TABLES.LOCATIONS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // User Sessions
  async createUserSession(sessionData) {
    const { data, error } = await supabase
      .from(TABLES.USER_SESSIONS)
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserSession(sessionToken) {
    const { data, error } = await supabase
      .from(TABLES.USER_SESSIONS)
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserSession(sessionToken, updates) {
    const { data, error } = await supabase
      .from(TABLES.USER_SESSIONS)
      .update({ ...updates, last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteExpiredSessions() {
    const { error } = await supabase
      .from(TABLES.USER_SESSIONS)
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;
  }

  // Google Calendar Tokens
  async saveGoogleToken(userId, tokenData) {
    const { data, error } = await supabase
      .from(TABLES.GOOGLE_CALENDAR_TOKENS)
      .upsert({
        user_id: userId,
        ...tokenData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGoogleToken(userId) {
    const { data, error } = await supabase
      .from(TABLES.GOOGLE_CALENDAR_TOKENS)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGoogleToken(userId) {
    const { error } = await supabase
      .from(TABLES.GOOGLE_CALENDAR_TOKENS)
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Real-time subscriptions
  subscribeToEngineers(callback) {
    return supabase
      .channel('engineers-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.ENGINEERS },
        callback
      )
      .subscribe();
  }

  // Leaves
  async getLeaves() {
    const { data, error } = await supabase
      .from(TABLES.LEAVES)
      .select(`
        *,
        engineer:engineer_id(name),
        approver:approved_by(name)
      `)
      .order('start_date');

    if (error) throw error;
    return data;
  }

  async getLeavesByEngineer(engineerId) {
    const { data, error } = await supabase
      .from(TABLES.LEAVES)
      .select(`
        *,
        engineer:engineer_id(name),
        approver:approved_by(name)
      `)
      .eq('engineer_id', engineerId)
      .order('start_date');

    if (error) throw error;
    return data;
  }

  async getLeaveById(id) {
    const { data, error } = await supabase
      .from(TABLES.LEAVES)
      .select(`
        *,
        engineer:engineer_id(name),
        approver:approved_by(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getLeavesOverlappingRange(startDate, endDate, engineerId) {
    let query = supabase
      .from(TABLES.LEAVES)
      .select(`
        *,
        engineer:engineer_id(name),
        approver:approved_by(name)
      `)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .eq('status', 'approved');

    if (engineerId) {
      query = query.eq('engineer_id', engineerId);
    }

    const { data, error } = await query.order('start_date');
    if (error) throw error;
    return data;
  }

  async getLeavesByStatus(status) {
    const { data, error } = await supabase
      .from(TABLES.LEAVES)
      .select(`
        *,
        engineer:engineer_id(name),
        approver:approved_by(name)
      `)
      .eq('status', status)
      .order('start_date');

    if (error) throw error;
    return data;
  }

  async createLeave(leaveData) {
    const { data, error } = await supabase
      .from(TABLES.LEAVES)
      .insert(leaveData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLeave(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.LEAVES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLeave(id) {
    const { error } = await supabase
      .from(TABLES.LEAVES)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Approve leave (manager only)
  async approveLeave(id, approverId) {
    const { data, error } = await supabase
      .from(TABLES.LEAVES)
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async rejectLeave(id, approverId) {
    const { data, error } = await supabase
      .from(TABLES.LEAVES)
      .update({
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  subscribeToCases(callback) {
    return supabase
      .channel('cases-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.CASES },
        callback
      )
      .subscribe();
  }

  subscribeToSchedules(callback) {
    return supabase
      .channel('schedules-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.SCHEDULES },
        callback
      )
      .subscribe();
  }
  subscribeToLeaves(callback) {
    return supabase
      .channel('leaves-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: TABLES.LEAVES },
        callback
      )
      .subscribe();
  }

  subscribeToLocations(callback) {
    return supabase
      .channel('locations-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: TABLES.LOCATIONS },
        callback
      )
      .subscribe();
  }

  subscribeToProfiles(callback) {
    return supabase
      .channel('profiles-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: TABLES.PROFILES },
        callback
      )
      .subscribe();
  }

  // Bulk operations and analytics
  async getDashboardStats() {
    const [
      { count: totalEngineers },
      { count: activeCases },
      { count: pendingLeaves },
      { count: todaySchedules }
    ] = await Promise.all([
      supabase.from(TABLES.ENGINEERS).select('*', { count: 'exact', head: true }),
      supabase.from(TABLES.CASES).select('*', { count: 'exact', head: true }).in('status', ['open', 'assigned', 'in_progress']),
      supabase.from(TABLES.LEAVES).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from(TABLES.SCHEDULES).select('*', { count: 'exact', head: true })
        .gte('start_time', new Date().toISOString().split('T')[0])
        .lt('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    ]);

    return {
      totalEngineers,
      activeCases,
      pendingLeaves,
      todaySchedules
    };
  }

  // Notifications
  async createNotification(notificationData) {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert(notificationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNotifications(userId) {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getUnreadNotifications(userId) {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async markNotificationAsRead(id) {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markAllNotificationsAsRead(userId) {
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  async deleteNotification(id) {
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  subscribeToNotifications(callback) {
    return supabase
      .channel('notifications-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: TABLES.NOTIFICATIONS },
        callback
      )
      .subscribe();
  }

  async getCasesByPriorityStats() {
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .select('priority')
      .in('status', ['open', 'assigned', 'in_progress']);

    if (error) throw error;

    return data.reduce((acc, curr) => {
      acc[curr.priority] = (acc[curr.priority] || 0) + 1;
      return acc;
    }, {});
  }

  async getEngineerWorkload() {
    const { data, error } = await supabase
      .from(TABLES.CASES)
      .select(`
        assigned_engineer_id,
        status,
        priority
      `)
      .in('status', ['assigned', 'in_progress']);

    if (error) throw error;

    return data.reduce((acc, curr) => {
      const engineerId = curr.assigned_engineer_id;
      if (!acc[engineerId]) {
        acc[engineerId] = { total: 0, urgent: 0, high: 0, medium: 0, low: 0 };
      }
      acc[engineerId].total++;
      acc[engineerId][curr.priority]++;
      return acc;
    }, {});
  }

  // Client operations
  async getClients() {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  }

  async createClient(clientData) {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .insert(clientData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateClient(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteClient(id) {
    const { error } = await supabase
      .from(TABLES.CLIENTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}

const supabaseService = new SupabaseService();
export default supabaseService;
