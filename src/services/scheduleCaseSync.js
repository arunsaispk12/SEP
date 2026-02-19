import supabaseService from './supabaseService';

class ScheduleCaseSyncService {
  constructor() {
    this.isSupabaseConfigured = () => {
      return process.env.REACT_APP_SUPABASE_URL && 
             process.env.REACT_APP_SUPABASE_ANON_KEY &&
             process.env.REACT_APP_SUPABASE_URL !== 'your-supabase-url' &&
             process.env.REACT_APP_SUPABASE_ANON_KEY !== 'your-supabase-anon-key';
    };
  }

  // Sync a case with its corresponding schedule
  async syncCaseWithSchedule(caseId, scheduleData) {
    try {
      if (!this.isSupabaseConfigured()) {
        console.log('Supabase not configured, using localStorage sync');
        return this.syncWithLocalStorage(caseId, scheduleData);
      }

      // Get the case details
      const { data: caseData, error: caseError } = await supabaseService.supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) {
        console.error('Error fetching case:', caseError);
        return { success: false, error: caseError };
      }

      // Create or update schedule entry
      const scheduleEntry = {
        case_id: caseId,
        engineer_id: caseData.engineer_id,
        location_id: caseData.location_id,
        title: `Case: ${caseData.title}`,
        description: caseData.description,
        start_time: scheduleData.start_time || caseData.scheduled_date,
        end_time: scheduleData.end_time || this.calculateEndTime(caseData.scheduled_date, caseData.estimated_duration),
        status: this.mapCaseStatusToScheduleStatus(caseData.status),
        priority: this.mapCasePriorityToSchedulePriority(caseData.priority),
        case_reference: caseData.case_number,
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if schedule already exists for this case
      const { data: existingSchedule } = await supabaseService.supabase
        .from('schedules')
        .select('id')
        .eq('case_id', caseId)
        .single();

      let result;
      if (existingSchedule) {
        // Update existing schedule
        result = await supabaseService.supabase
          .from('schedules')
          .update(scheduleEntry)
          .eq('case_id', caseId)
          .select();
      } else {
        // Create new schedule
        result = await supabaseService.supabase
          .from('schedules')
          .insert(scheduleEntry)
          .select();
      }

      if (result.error) {
        console.error('Error syncing case with schedule:', result.error);
        return { success: false, error: result.error };
      }

      console.log('Case successfully synced with schedule');
      return { success: true, data: result.data };

    } catch (error) {
      console.error('Error in syncCaseWithSchedule:', error);
      return { success: false, error };
    }
  }

  // Sync a schedule with its corresponding case
  async syncScheduleWithCase(scheduleId, caseData) {
    try {
      if (!this.isSupabaseConfigured()) {
        console.log('Supabase not configured, using localStorage sync');
        return this.syncWithLocalStorage(scheduleId, caseData, 'schedule');
      }

      // Get the schedule details
      const { data: scheduleData, error: scheduleError } = await supabaseService.supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (scheduleError) {
        console.error('Error fetching schedule:', scheduleError);
        return { success: false, error: scheduleError };
      }

      // Update case with schedule information
      const caseUpdate = {
        scheduled_date: scheduleData.start_time,
        estimated_duration: this.calculateDuration(scheduleData.start_time, scheduleData.end_time),
        status: this.mapScheduleStatusToCaseStatus(scheduleData.status),
        priority: this.mapSchedulePriorityToCasePriority(scheduleData.priority),
        updated_at: new Date().toISOString()
      };

      const result = await supabaseService.supabase
        .from('cases')
        .update(caseUpdate)
        .eq('id', scheduleData.case_id)
        .select();

      if (result.error) {
        console.error('Error syncing schedule with case:', result.error);
        return { success: false, error: result.error };
      }

      console.log('Schedule successfully synced with case');
      return { success: true, data: result.data };

    } catch (error) {
      console.error('Error in syncScheduleWithCase:', error);
      return { success: false, error };
    }
  }

  // Sync all cases with their schedules
  async syncAllCasesWithSchedules() {
    try {
      if (!this.isSupabaseConfigured()) {
        console.log('Supabase not configured, skipping sync');
        return { success: false, error: 'Supabase not configured' };
      }

      // Get all cases
      const { data: cases, error: casesError } = await supabaseService.supabase
        .from('cases')
        .select('*');

      if (casesError) {
        console.error('Error fetching cases:', casesError);
        return { success: false, error: casesError };
      }

      const syncResults = [];
      for (const caseItem of cases) {
        const result = await this.syncCaseWithSchedule(caseItem.id, {});
        syncResults.push({ caseId: caseItem.id, result });
      }

      const successCount = syncResults.filter(r => r.result.success).length;
      console.log(`Synced ${successCount}/${cases.length} cases with schedules`);

      return { 
        success: true, 
        data: { 
          totalCases: cases.length, 
          syncedCases: successCount,
          results: syncResults 
        } 
      };

    } catch (error) {
      console.error('Error in syncAllCasesWithSchedules:', error);
      return { success: false, error };
    }
  }

  // Sync all schedules with their cases
  async syncAllSchedulesWithCases() {
    try {
      if (!this.isSupabaseConfigured()) {
        console.log('Supabase not configured, skipping sync');
        return { success: false, error: 'Supabase not configured' };
      }

      // Get all schedules that have case_id
      const { data: schedules, error: schedulesError } = await supabaseService.supabase
        .from('schedules')
        .select('*')
        .not('case_id', 'is', null);

      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError);
        return { success: false, error: schedulesError };
      }

      const syncResults = [];
      for (const schedule of schedules) {
        const result = await this.syncScheduleWithCase(schedule.id, {});
        syncResults.push({ scheduleId: schedule.id, result });
      }

      const successCount = syncResults.filter(r => r.result.success).length;
      console.log(`Synced ${successCount}/${schedules.length} schedules with cases`);

      return { 
        success: true, 
        data: { 
          totalSchedules: schedules.length, 
          syncedSchedules: successCount,
          results: syncResults 
        } 
      };

    } catch (error) {
      console.error('Error in syncAllSchedulesWithCases:', error);
      return { success: false, error };
    }
  }

  // Full bidirectional sync
  async performFullSync() {
    try {
      console.log('Starting full sync between cases and schedules...');
      
      const caseSyncResult = await this.syncAllCasesWithSchedules();
      const scheduleSyncResult = await this.syncAllSchedulesWithCases();

      return {
        success: caseSyncResult.success && scheduleSyncResult.success,
        data: {
          caseSync: caseSyncResult,
          scheduleSync: scheduleSyncResult
        }
      };

    } catch (error) {
      console.error('Error in performFullSync:', error);
      return { success: false, error };
    }
  }

  // Helper methods for localStorage sync
  syncWithLocalStorage(id, data, type = 'case') {
    try {
      const cases = JSON.parse(localStorage.getItem('engineerCases') || '[]');
      const schedules = JSON.parse(localStorage.getItem('engineerSchedules') || '[]');

      if (type === 'case') {
        // Find and update case
        const caseIndex = cases.findIndex(c => c.id === id);
        if (caseIndex !== -1) {
          cases[caseIndex] = { ...cases[caseIndex], ...data };
          localStorage.setItem('engineerCases', JSON.stringify(cases));
        }
      } else {
        // Find and update schedule
        const scheduleIndex = schedules.findIndex(s => s.id === id);
        if (scheduleIndex !== -1) {
          schedules[scheduleIndex] = { ...schedules[scheduleIndex], ...data };
          localStorage.setItem('engineerSchedules', JSON.stringify(schedules));
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in localStorage sync:', error);
      return { success: false, error };
    }
  }

  // Utility methods
  calculateEndTime(startTime, duration) {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (duration * 60 * 60 * 1000)); // duration in hours
    return end.toISOString();
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60 * 60)); // duration in hours
  }

  mapCaseStatusToScheduleStatus(caseStatus) {
    const statusMap = {
      'open': 'scheduled',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'on_hold': 'pending'
    };
    return statusMap[caseStatus] || 'scheduled';
  }

  mapScheduleStatusToCaseStatus(scheduleStatus) {
    const statusMap = {
      'scheduled': 'open',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'pending': 'on_hold'
    };
    return statusMap[scheduleStatus] || 'open';
  }

  mapCasePriorityToSchedulePriority(casePriority) {
    const priorityMap = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
    };
    return priorityMap[casePriority] || 'medium';
  }

  mapSchedulePriorityToCasePriority(schedulePriority) {
    const priorityMap = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
    };
    return priorityMap[schedulePriority] || 'medium';
  }
}

// Export singleton instance
const scheduleCaseSyncService = new ScheduleCaseSyncService();
export default scheduleCaseSyncService;
