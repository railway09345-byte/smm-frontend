import React, { useState, useEffect } from 'react';
import { api, getFullMediaUrl } from '../../../services/api';
import { useToast } from '../../common/Toast';
import { EditPostModal } from '../EditPostModal';
import { SpotlightCard } from '../../common/SpotlightCard';
import { PostMediaThumbnail } from '../../common/PostMediaThumbnail';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  DEFAULT_TIMEZONE,
  parseUtcToLocalParts,
  combineLocalToUtcIso,
  getUtcInstantDescription
} from '../../../utils/datetime';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Filter, 
  Edit3, 
  ExternalLink, 
  X,
  Sparkles
} from 'lucide-react';

export function ContentCalendarView({ onNavigate, isEmbedded = false }) {
  const { showToast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month' | 'week' | 'day'
  const [platformFilter, setPlatformFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [events, setEvents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected post for modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEditPostId, setSelectedEditPostId] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Fetch events from backend with active date window
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (platformFilter !== 'all') params.platform = platformFilter;
      if (collectionFilter) params.collection_id = parseInt(collectionFilter, 10);

      // Compute date boundaries
      const yr = currentDate.getFullYear();
      const mo = currentDate.getMonth();

      if (viewType === 'month') {
        const start = new Date(yr, mo - 1, 20);
        const end = new Date(yr, mo + 1, 15);
        params.start_date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        params.end_date = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      } else if (viewType === 'week') {
        const dayOfWeek = currentDate.getDay();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        params.start_date = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
        params.end_date = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;
      } else {
        const dStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        params.start_date = dStr;
        params.end_date = dStr;
      }

      const [eventsData, colsData] = await Promise.all([
        api.scheduler.getCalendarEvents(params),
        api.collections.list()
      ]);

      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setCollections(Array.isArray(colsData) ? colsData : []);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      showToast('Error loading calendar events: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [platformFilter, collectionFilter, currentDate, viewType]);

  // Calendar Date Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December' ];

  const prevPeriod = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewType === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewType === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const todayPeriod = () => {
    setCurrentDate(new Date());
  };

  const openEventModal = (ev) => {
    setSelectedEvent(ev);
    if (ev.start) {
      const tz = ev.timezone || ev.raw_post?.timezone || DEFAULT_TIMEZONE;
      const parts = parseUtcToLocalParts(ev.start, tz);
      setNewDate(parts.date);
      setNewTime(parts.time);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !newDate || !newTime) return;
    const tz = selectedEvent.timezone || selectedEvent.raw_post?.timezone || DEFAULT_TIMEZONE;
    const instant = getUtcInstantDescription(newDate, newTime, tz);
    if (instant.isInPast) {
      showToast('Scheduled time cannot be in the past.', 'error');
      return;
    }

    setRescheduling(true);
    try {
      await api.scheduler.reschedulePost(selectedEvent.id, instant.utcIso, tz);
      showToast('Post rescheduled successfully!', 'success');
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      showToast('Failed to reschedule: ' + err.message, 'error');
    } finally {
      setRescheduling(false);
    }
  };

  // Generate Month Grid Days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  // Prev month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false
    });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  // Next month padding to complete 35 or 42 cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  // Generate Week Days (Sun - Sat)
  const currentDayOfWeek = currentDate.getDay();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDayOfWeek);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(d);
  }

  const getEventsForDate = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const cellDateStr = `${yr}-${mo}-${da}`;

    return events.filter((ev) => {
      if (!ev.start) return false;
      const evTz = ev.timezone || ev.raw_post?.timezone || DEFAULT_TIMEZONE;
      const parts = parseUtcToLocalParts(ev.start, evTz);
      return parts.date === cellDateStr;
    });
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'published':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'scheduled':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'failed':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  const getPlatformIcon = (plat) => {
    const p = (plat || '').toLowerCase();
    if (p.includes('insta')) return '📸';
    if (p.includes('face')) return '👥';
    if (p.includes('you')) return '▶️';
    return '🌐';
  };

  return (
    <div className="space-y-6">
      {/* Header (when standalone) */}
      {!isEmbedded && (
        <DashboardPageHeader
          badge="Omnichannel Schedule" badgeColor="indigo" title="Content Calendar" subtitle={`Interactive timeline displaying all scheduled, published, and queued posts across platforms in your configured timezone (${DEFAULT_TIMEZONE}).`}
          actions={
            <button
              id="calendar-create-post-btn" onClick={() => onNavigate && onNavigate('content-studio')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs transition-all flex items-center gap-2" >
              <Plus className="w-4 h-4" />
              <span>Schedule New Post</span>
            </button>
          }
        />
      )}

      {/* Toolbar */}
      <SpotlightCard className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-bg p-1 rounded-xl border border-border">
              <button
                id="calendar-prev-btn" onClick={prevPeriod}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-white transition-all" title="Previous period" >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="calendar-today-btn" onClick={todayPeriod}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-text-secondary hover:bg-white transition-all" >
                Today
              </button>
              <button
                id="calendar-next-btn" onClick={nextPeriod}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-white transition-all" title="Next period" >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-text tracking-tight">
              {viewType === 'month' && `${monthNames[month]} ${year}`}
              {viewType === 'week' && `Week of ${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}, ${weekStart.getFullYear()}`}
              {viewType === 'day' && `${currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
            </h2>
          </div>

          {/* Filters & View Mode */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Platform filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-medium text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary" >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
            </select>

            {/* Collection filter */}
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-medium text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary" >
              <option value="">All Collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* View mode toggle */}
            <div className="flex items-center p-1 bg-bg rounded-xl border border-border">
              {['month', 'week', 'day'].map((vt) => (
                <button
                  key={vt}
                  id={`calendar-view-${vt}-btn`}
                  onClick={() => setViewType(vt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    viewType === vt
                      ? 'bg-white text-text shadow-sm' : 'text-text-secondary hover:text-text' }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SpotlightCard>

      {loading && (
        <div className="text-center py-2 text-xs font-medium text-text-muted flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Refreshing schedule events...</span>
        </div>
      )}

      {/* VIEW 1: MONTH VIEW GRID */}
      {viewType === 'month' && (
        <SpotlightCard id="calendar-grid" className="p-0 overflow-hidden">
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <div className="min-w-[680px] md:min-w-0">
              {/* Days Header */}
              <div className="grid grid-cols-7 bg-surface border-b border-border text-center font-bold text-xs text-text-secondary py-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Days Cells */}
              <div className="grid grid-cols-7 divide-x divide-slate-100">
                {calendarDays.map((cell, idx) => {
                  const isToday = cell.date.toDateString() === new Date().toDateString();
                  const dayEvents = getEventsForDate(cell.date);

                  return (
                    <div
                      key={idx}
                      className={`min-h-[125px] border-b border-border p-2.5 flex flex-col gap-1.5 transition-colors ${
                        !cell.isCurrentMonth
                          ? 'bg-surface text-text-muted' : isToday
                          ? 'bg-primary/10' : 'bg-white/60 hover:bg-surface' }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-primary text-primary-on' : cell.isCurrentMonth
                              ? 'text-text' : 'text-text-muted' }`}
                        >
                          {cell.date.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-semibold text-text-muted">
                            {dayEvents.length} post{dayEvents.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Event Pills */}
                      <div className="flex flex-col gap-1 flex-1 overflow-y-auto max-h-[140px]">
                        {dayEvents.map((ev) => {
                          const style = getStatusColor(ev.status);
                          const tz = ev.timezone || ev.raw_post?.timezone || DEFAULT_TIMEZONE;
                          const parts = parseUtcToLocalParts(ev.start, tz);

                          return (
                            <div
                              key={ev.id}
                              id={`calendar-event-${ev.id}`}
                              onClick={() => openEventModal(ev)}
                              className="px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 cursor-pointer truncate hover:brightness-95 transition-all shadow-xs" style={{
                                background: style.bg,
                                color: style.text,
                                borderColor: style.border
                              }}
                              title={`${ev.title} (${ev.platform} at ${parts.timeFormatted})`}
                            >
                              <span className="shrink-0">{getPlatformIcon(ev.platform)}</span>
                              <span className="font-bold text-[10px]">{parts.timeFormatted}</span>
                              <span className="truncate">{ev.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* VIEW 2: WEEK VIEW */}
      {viewType === 'week' && (
        <SpotlightCard id="calendar-week-grid" className="p-0 overflow-hidden">
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <div className="min-w-[680px] md:min-w-0">
              {/* Week Header */}
              <div className="grid grid-cols-7 bg-surface border-b border-border divide-x divide-slate-100">
                {weekDays.map((d, idx) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  const dayEvents = getEventsForDate(d);
                  return (
                    <div key={idx} className="p-3 text-center">
                      <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-xl font-extrabold mt-0.5 ${isToday ? 'text-primary' : 'text-text'}`}>
                        {d.getDate()}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {dayEvents.length} post{dayEvents.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Week Columns */}
              <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[380px]">
                {weekDays.map((d, idx) => {
                  const dayEvents = getEventsForDate(d);
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 flex flex-col gap-2 ${isToday ? 'bg-primary/10' : 'bg-white/60'}`}
                    >
                      {dayEvents.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-text-muted">
                          No posts
                        </div>
                      ) : (
                        dayEvents.map((ev) => {
                          const style = getStatusColor(ev.status);
                          const tz = ev.timezone || ev.raw_post?.timezone || DEFAULT_TIMEZONE;
                          const parts = parseUtcToLocalParts(ev.start, tz);

                          return (
                            <div
                              key={ev.id}
                              id={`calendar-week-event-${ev.id}`}
                              onClick={() => openEventModal(ev)}
                              className="border rounded-xl p-2.5 cursor-pointer flex flex-col gap-1.5 hover:shadow-sm transition-all" style={{
                                background: style.bg,
                                borderColor: style.border
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold" style={{ color: style.text }}>
                                  {getPlatformIcon(ev.platform)} {parts.timeFormatted}
                                </span>
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white" style={{ color: style.text }}>
                                  {ev.status}
                                </span>
                              </div>
                              {ev.media_url && (
                                <PostMediaThumbnail url={ev.media_url} title={ev.title} className="w-full h-14 rounded-lg" />
                              )}
                              <div className="text-xs font-semibold text-text truncate">
                                {ev.title}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* VIEW 3: DAY VIEW */}
      {viewType === 'day' && (
        <SpotlightCard id="calendar-day-grid" className="p-6">
          {(() => {
            const dayEvents = getEventsForDate(currentDate);
            return (
              <div>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-border flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-bold text-text">
                      Agenda for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {dayEvents.length} post{dayEvents.length === 1 ? '' : 's'} scheduled for this date.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate && onNavigate('content-studio')}
                    className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-surface text-text-secondary text-xs font-semibold transition-colors" >
                    + Schedule Post for Today
                  </button>
                </div>

                {dayEvents.length === 0 ? (
                  <div className="text-center py-16 text-text-muted">
                    <CalendarIcon className="w-10 h-10 text-text-muted mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-text mb-1">No Posts Scheduled</h4>
                    <p className="text-xs text-text-muted mb-4">There are no publications lined up for this day.</p>
                    <button
                      onClick={() => onNavigate && onNavigate('content-studio')}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-semibold shadow-md shadow-xs" >
                      Create Scheduled Post
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map((ev) => {
                      const style = getStatusColor(ev.status);
                      const tz = ev.timezone || ev.raw_post?.timezone || DEFAULT_TIMEZONE;
                      const parts = parseUtcToLocalParts(ev.start, tz);

                      return (
                        <div
                          key={ev.id}
                          id={`calendar-day-event-${ev.id}`}
                          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white/70 hover:bg-white transition-all shadow-xs" >
                          {ev.media_url ? (
                            <PostMediaThumbnail url={ev.media_url} title={ev.title} className="w-16 h-16 rounded-xl" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-surface border border-border text-warning flex items-center justify-center text-xl shrink-0">
                              {getPlatformIcon(ev.platform)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: style.bg, color: style.text }}
                              >
                                {ev.status}
                              </span>
                              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{parts.timeFormatted} ({tz})</span>
                              </span>
                              <span className="text-xs text-text-muted">
                                • {getPlatformIcon(ev.platform)} <span className="capitalize">{ev.platform}</span> ({ev.account_name || 'Account'})
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-text truncate mb-1">
                              {ev.title}
                            </h4>
                            {ev.caption && (
                              <p className="text-xs text-text-muted truncate">
                                {ev.caption}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              className="px-3 py-1.5 rounded-xl border border-border hover:bg-surface text-text-secondary text-xs font-medium" onClick={() => openEventModal(ev)}
                            >
                              Reschedule
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-semibold shadow-sm" onClick={() => {
                                setSelectedEvent(null);
                                setSelectedEditPostId(ev.id);
                              }}
                            >
                              Edit Post
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </SpotlightCard>
      )}

      {/* POST DETAILS & RESCHEDULE MODAL */}
      {selectedEvent && (
        <div id="calendar-event-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-base font-bold text-text">Calendar Post #{selectedEvent.id}</h3>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setSelectedEvent(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 mb-5">
              {selectedEvent.media_url && (
                <PostMediaThumbnail url={selectedEvent.media_url} title={selectedEvent.title} className="w-20 h-20 rounded-xl" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-text truncate mb-1">
                  {selectedEvent.title}
                </h4>
                <div className="text-xs text-text-muted">
                  Platform: <strong className="text-text-secondary capitalize">{selectedEvent.platform}</strong> ({selectedEvent.account_name || 'Channel'})
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  Status: <strong className="text-text-secondary capitalize">{selectedEvent.status}</strong>
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  Timezone: <strong className="text-text-secondary">{selectedEvent.timezone || DEFAULT_TIMEZONE}</strong>
                </div>
              </div>
            </div>

            {/* Reschedule Box */}
            <form onSubmit={handleReschedule} className="bg-surface p-4 rounded-xl border border-border mb-5">
              <div className="text-xs font-bold text-text mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Reschedule Post Slot</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Date</label>
                  <input
                    id="reschedule-modal-date" type="date" required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Time (24h)</label>
                  <input
                    id="reschedule-modal-time" type="time" required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" />
                </div>
              </div>
              <button
                id="reschedule-modal-submit-btn" type="submit" disabled={rescheduling}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs disabled:opacity-50 transition-all" >
                {rescheduling ? 'Rescheduling...' : 'Update Schedule Slot'}
              </button>
            </form>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                id="calendar-edit-full-post-btn" className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-surface text-text-secondary text-xs font-semibold transition-colors" onClick={() => {
                  const evId = selectedEvent.id;
                  setSelectedEvent(null);
                  setSelectedEditPostId(evId);
                }}
              >
                Edit Full Post
              </button>
              <button
                className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-surface text-text-secondary text-xs font-semibold transition-colors" onClick={() => {
                  setSelectedEvent(null);
                  if (onNavigate) onNavigate('scheduled-posts');
                }}
              >
                Go to Posts List
              </button>
              <button
                className="px-4 py-1.5 rounded-xl bg-surface hover:bg-surface-selected border border-border text-text text-xs font-semibold transition-all cursor-pointer" onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RICH EDIT POST MODAL */}
      {selectedEditPostId && (
        <EditPostModal
          postId={selectedEditPostId}
          onClose={() => setSelectedEditPostId(null)}
          onSaved={() => {
            setSelectedEditPostId(null);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
