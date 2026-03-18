// src/components/EngineerDashboard.js
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import { getWeekStart } from './dashboard/dashboardUtils';
import ActiveCaseHero from './dashboard/ActiveCaseHero';
import MyWeekTimeline from './dashboard/MyWeekTimeline';
import MyStatusControls from './dashboard/MyStatusControls';
import TeamStatusPanel from './dashboard/TeamStatusPanel';
import SkeletonPanel from './dashboard/SkeletonPanel';

const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';

// NOTE: EngineerDashboard receives onGoToCases from App.js to support "Go to Case" navigation.
// In App.js, pass it as: <EngineerDashboard onGoToCases={() => setActiveTab('cases')} />

export default function EngineerDashboard({ onGoToCases }) {
  const { profile } = useAuth();
  const { engineers, cases, schedules, locationObjects, loading, updateCase, updateEngineer } = useEngineerContext();

  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());

  // Current engineer record
  const currentEngineer = engineers.find(e => e.id === profile?.id) || null;
  const engineerIndex = engineers.indexOf(currentEngineer);

  // Active case: in_progress first, then assigned today
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const tomorrow = useMemo(() => { const d = new Date(today); d.setDate(today.getDate() + 1); return d; }, [today]);

  const activeCase = useMemo(() => {
    const myCases = cases.filter(c => c.assigned_engineer_id === profile?.id);
    const inProgress = myCases.filter(c => c.status === 'in_progress')
      .sort((a,b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
    if (inProgress.length > 0) return inProgress[0];
    const assignedToday = myCases.filter(c =>
      c.status === 'assigned' && c.scheduled_start &&
      new Date(c.scheduled_start) >= today && new Date(c.scheduled_start) < tomorrow
    ).sort((a,b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
    return assignedToday[0] || null;
  }, [cases, profile?.id, today, tomorrow]);

  // NOTE: updateCase/updateEngineer in context already show their own toasts.
  // Do NOT add extra toast.success() calls here — it would fire two toasts per action.

  const handleUpdateCase = async (caseId, updates) => {
    await updateCase(caseId, updates);
  };

  const handleUpdateEngineer = async (id, updates) => {
    await updateEngineer(id, updates);
  };

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SkeletonPanel height={80} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
          <SkeletonPanel height={240} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonPanel height={110} />
            <SkeletonPanel height={120} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: BG, minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {/* Row 1: Hero Active Case */}
      <ActiveCaseHero activeCase={activeCase} onUpdateCase={handleUpdateCase} />

      {/* Row 2: Week schedule (left) + Status controls + Team (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
        <MyWeekTimeline
          schedules={schedules}
          cases={cases}
          engineerId={profile?.id}
          weekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          onGoToCase={onGoToCases}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MyStatusControls
            engineer={currentEngineer}
            engineerIndex={engineerIndex >= 0 ? engineerIndex : 0}
            schedules={schedules}
            locationObjects={locationObjects}
            onUpdateEngineer={handleUpdateEngineer}
          />
          <div style={{ flex: 1 }}>
            <TeamStatusPanel
              engineers={engineers}
              schedules={schedules}
              currentUserId={profile?.id}
              activeFilter={null}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
