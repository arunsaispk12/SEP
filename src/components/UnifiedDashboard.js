// src/components/UnifiedDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEngineerContext } from '../context/EngineerContext';
import supabaseService from '../services/supabaseService';
import { getWeekStart } from './dashboard/dashboardUtils';
import DashboardKPIBar from './dashboard/DashboardKPIBar';
import TeamStatusPanel from './dashboard/TeamStatusPanel';
import CasesPanel from './dashboard/CasesPanel';
import PendingApprovalsPanel from './dashboard/PendingApprovalsPanel';
import QuickAssignModal from './dashboard/QuickAssignModal';
import WeeklyGantt from './dashboard/WeeklyGantt';
import CaseDetailPanel from './dashboard/CaseDetailPanel';
import SkeletonPanel from './dashboard/SkeletonPanel';

const BG = 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)';

export default function UnifiedDashboard() {
  const { user, profile } = useAuth();
  const { engineers, cases, schedules, leaves, loading, updateCase, updateLeave } = useEngineerContext();

  const [activeFilter, setActiveFilter] = useState('total');
  const [selectedCase, setSelectedCase] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [quickAssignCase, setQuickAssignCase] = useState(null);

  // Load pending leaves directly (context only loads approved)
  useEffect(() => {
    supabaseService.getLeavesByStatus('pending')
      .then(setPendingLeaves)
      .catch(() => setPendingLeaves([]));
  }, []);

  // KPI counts
  const today = new Date(); today.setHours(0,0,0,0);
  const in7days = new Date(today); in7days.setDate(today.getDate() + 7);

  const counts = useMemo(() => ({
    total:      cases.length,
    upcoming:   cases.filter(c => c.scheduled_start && new Date(c.scheduled_start) >= today && new Date(c.scheduled_start) <= in7days && !['completed','cancelled'].includes(c.status)).length,
    unassigned: cases.filter(c => !c.assigned_engineer_id && !['completed','cancelled'].includes(c.status)).length,
    available:  engineers.filter(e => e.is_available).length,
  }), [cases, engineers]);

  const upcomingCases = useMemo(() =>
    cases.filter(c => c.scheduled_start && new Date(c.scheduled_start) >= today && new Date(c.scheduled_start) <= in7days && !['completed','cancelled'].includes(c.status))
      .sort((a,b) => new Date(a.scheduled_start) - new Date(b.scheduled_start)),
  [cases]);

  const unassignedCases = useMemo(() =>
    cases.filter(c => !c.assigned_engineer_id && !['completed','cancelled'].includes(c.status)),
  [cases]);

  const unconfirmedCases = useMemo(() =>
    cases.filter(c => c.status === 'assigned'),
  [cases]);

  // Handlers
  // NOTE: updateLeave/updateCase in context already show their own toasts.
  // Do NOT add extra toast.success() calls here — it would fire two toasts per action.

  const handleApproveLeave = async (leaveId) => {
    await updateLeave(leaveId, { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() });
    setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
  };

  const handleRejectLeave = async (leaveId) => {
    await updateLeave(leaveId, { status: 'rejected', approved_by: user.id, approved_at: new Date().toISOString() });
    setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
  };

  const handleConfirmCase = async (caseId) => {
    await updateCase(caseId, { status: 'in_progress' });
  };

  const handleQuickAssignSave = async ({ caseId, assigned_engineer_id, scheduled_start, status }) => {
    await updateCase(caseId, { assigned_engineer_id, scheduled_start, status });
    setQuickAssignCase(null);
  };

  const handleUpdateStatus = async (caseId, newStatus) => {
    await updateCase(caseId, { status: newStatus });
    setSelectedCase(null);
  };

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[1,2,3,4].map(i => <SkeletonPanel key={i} height={56} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 8 }}>
          <SkeletonPanel height={180} />
          <SkeletonPanel height={180} />
          <SkeletonPanel height={180} />
        </div>
        <SkeletonPanel height={200} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: BG, minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {/* Row 1: KPI Filter Cards */}
      <DashboardKPIBar counts={counts} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Row 2: Command Center */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 10 }}>
        <TeamStatusPanel engineers={engineers} schedules={schedules} currentUserId={user?.id} activeFilter={activeFilter} />
        <CasesPanel
          upcomingCases={upcomingCases}
          unassignedCases={unassignedCases}
          engineers={engineers}
          activeFilter={activeFilter}
          onQuickAssign={setQuickAssignCase}
        />
        <PendingApprovalsPanel
          pendingLeaves={pendingLeaves}
          unconfirmedCases={unconfirmedCases}
          engineers={engineers}
          onApproveLeave={handleApproveLeave}
          onRejectLeave={handleRejectLeave}
          onConfirmCase={handleConfirmCase}
          onReassignCase={setQuickAssignCase}
        />
      </div>

      {/* Row 3: Gantt + Case Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 10 }}>
        <WeeklyGantt
          engineers={engineers}
          schedules={schedules}
          cases={cases}
          leaves={leaves}
          weekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          onBarClick={setSelectedCase}
          activeFilter={activeFilter}
        />
        <CaseDetailPanel
          selectedCase={selectedCase}
          engineers={engineers}
          onClose={() => setSelectedCase(null)}
          onUpdateStatus={handleUpdateStatus}
          isAdmin={profile?.role === 'admin'}
        />
      </div>

      {/* Quick-assign modal */}
      {quickAssignCase && (
        <QuickAssignModal
          caseToAssign={quickAssignCase}
          engineers={engineers}
          onSave={handleQuickAssignSave}
          onClose={() => setQuickAssignCase(null)}
        />
      )}
    </motion.div>
  );
}
