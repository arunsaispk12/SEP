// src/components/MiniCalendar.jsx
import React, { useState, useMemo } from 'react';
import moment from 'moment';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Returns array of { day: number|null, date: Date|null, isCurrentMonth: boolean }
function buildCalendarGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];

  // Leading cells from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, date: new Date(year, month - 1, prevDays - i), isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Trailing cells to complete last row (always fill to multiple of 7)
  let trail = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: trail, date: new Date(year, month + 1, trail), isCurrentMonth: false });
    trail++;
  }
  return cells;
}

export default function MiniCalendar({ currentDate, onDateClick, currentView }) {
  const today = useMemo(() => moment().startOf('day'), []);

  // Mini cal month can be navigated independently
  const [miniMonth, setMiniMonth] = useState(() => moment(currentDate).startOf('month'));

  const cells = useMemo(
    () => buildCalendarGrid(miniMonth.year(), miniMonth.month()),
    [miniMonth]
  );

  const weekStart = useMemo(() => moment(currentDate).startOf('week'), [currentDate]);
  const weekEnd = useMemo(() => moment(currentDate).endOf('week'), [currentDate]);

  function getClassNames(cell) {
    const classes = ['mini-cal-day'];
    if (!cell.isCurrentMonth) classes.push('off-month');
    const d = moment(cell.date).startOf('day');
    if (d.isSame(today)) classes.push('today');
    else if (currentView === 'day' && d.isSame(moment(currentDate).startOf('day'))) classes.push('active-day');
    return classes.join(' ');
  }

  function isInSelectedWeek(cell) {
    if (currentView !== 'week') return false;
    const d = moment(cell.date).startOf('day');
    return d.isSameOrAfter(weekStart) && d.isSameOrBefore(weekEnd);
  }

  // Group cells into rows of 7 for week highlight
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div className="mini-cal">
      {/* Header */}
      <div className="mini-cal-header">
        <span className="mini-cal-month">{miniMonth.format('MMMM YYYY')}</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="mini-cal-nav" onClick={() => setMiniMonth(m => m.clone().subtract(1, 'month'))}>‹</button>
          <button className="mini-cal-nav" onClick={() => setMiniMonth(m => m.clone().add(1, 'month'))}>›</button>
        </div>
      </div>

      {/* Days of week */}
      <div className="mini-cal-grid">
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={i} className="mini-cal-dow">{d}</div>
        ))}
      </div>

      {/* Date rows */}
      {rows.map((row, ri) => {
        const rowInWeek = row.some(c => isInSelectedWeek(c));
        return (
          <div
            key={ri}
            className={`mini-cal-grid${rowInWeek ? ' mini-cal-week-highlight' : ''}`}
            style={{ borderRadius: 4 }}
          >
            {row.map((cell, ci) => (
              <div
                key={ci}
                className={getClassNames(cell)}
                onClick={() => {
                  onDateClick(cell.date);
                  // Sync mini cal if clicking off-month date
                  if (!cell.isCurrentMonth) {
                    setMiniMonth(moment(cell.date).startOf('month'));
                  }
                }}
              >
                {cell.day}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
