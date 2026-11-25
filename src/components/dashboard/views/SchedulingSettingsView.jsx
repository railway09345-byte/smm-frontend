import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../common/Toast';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  Sliders,
  Play,
  Pause,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Repeat,
  Layers,
  X,
  CheckCircle2,
  AlertCircle,
  Ban
} from 'lucide-react';

const RECURRENCE_TYPES = [
  { id: 'hourly', label: 'Every N Hours (within window)', example: 'Every 2 hours between 9 AM and 7 PM' },
  { id: 'daily', label: 'Every Day (at start time)', example: 'Every day at 9:00 AM' },
  { id: 'every_n_days', label: 'Every N Days (e.g. Every 2 days)', example: 'Every 2 days at 9:00 AM' },
  { id: 'weekdays', label: 'Monday to Friday', example: 'Weekdays at 9:00 AM' },
  { id: 'custom_weekly', label: 'Selected Weekdays', example: 'Mon, Wed, Fri only' }
];

const WEEKDAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' }
];

const SELECTION_STRATEGIES = [
  { id: 'order', label: 'Collection Order (First to Last)' },
  { id: 'oldest_first', label: 'Oldest Not-Yet-Published First' },
  { id: 'newest_first', label: 'Newest Media Item First' },
  { id: 'random', label: 'Configured Random Rotation' }
];

const EXHAUSTION_POLICIES = [
  { id: 'pause', label: 'Pause rule & notify admin' },
  { id: 'skip', label: 'Skip slot and check next time' },
  { id: 'wait', label: 'Wait until new media is added to collection' }
];

export function SchedulingSettingsView({ onNavigate }) {
  const { showToast } = useToast();

  const [rules, setRules] = useState([]);
  const [collections, setCollections] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [slotsModalRule, setSlotsModalRule] = useState(null);
  const [upcomingSlots, setUpcomingSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [socialAccountId, setSocialAccountId] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [maxPostsPerDay, setMaxPostsPerDay] = useState(5);
  const [selectionStrategy, setSelectionStrategy] = useState('order');
  const [onExhaustion, setOnExhaustion] = useState('pause');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesData, colsData, accsData] = await Promise.all([
        api.scheduler.listRules(),
        api.collections.list(),
        api.socialAccounts.list()
      ]);
      setRules(Array.isArray(rulesData) ? rulesData : []);
      setCollections(Array.isArray(colsData) ? colsData : []);
      setAccounts(Array.isArray(accsData) ? accsData : []);
      if (colsData.length > 0 && !collectionId) {
        setCollectionId(colsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
      showToast('Error loading scheduler rules: ' + (err.message || 'Error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleWeekday = (w) => {
    if (selectedWeekdays.includes(w)) {
      setSelectedWeekdays(selectedWeekdays.filter((x) => x !== w));
    } else {
      setSelectedWeekdays([...selectedWeekdays, w]);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Rule name is required', 'error');
      return;
    }
    if (!collectionId) {
      showToast('Please select a media collection for this rule', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        collection_id: parseInt(collectionId, 10),
        social_account_id: socialAccountId ? parseInt(socialAccountId, 10) : null,
        platform,
        recurrence_type: recurrenceType,
        recurrence_interval: parseInt(recurrenceInterval, 10) || 1,
        weekdays: recurrenceType === 'custom_weekly' ? selectedWeekdays : [],
        start_date: startDate || null,
        end_date: endDate || null,
        start_time: startTime,
        end_time: endTime,
        timezone,
        max_posts_per_day: parseInt(maxPostsPerDay, 10) || 5,
        selection_strategy: selectionStrategy,
        on_exhaustion: onExhaustion,
        status: 'active' };

      await api.scheduler.createRule(payload);
      showToast('Recurring schedule rule created and activated!', 'success');
      setCreateModalOpen(false);
      setName('');
      fetchData();
    } catch (err) {
      showToast('Failed to create rule: ' + (err.message || 'Error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async (ruleId) => {
    try {
      await api.scheduler.pauseRule(ruleId);
      showToast('Rule paused.', 'info');
      fetchData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleResume = async (ruleId) => {
    try {
      await api.scheduler.resumeRule(ruleId);
      showToast('Rule resumed and next run calculated!', 'success');
      fetchData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleCancel = async (ruleId) => {
    if (!window.confirm('Cancel this recurring schedule rule?')) return;
    try {
      await api.scheduler.cancelRule(ruleId);
      showToast('Rule cancelled.', 'info');
      fetchData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Permanently delete this schedule rule?')) return;
    try {
      await api.scheduler.deleteRule(ruleId);
      showToast('Rule deleted.', 'success');
      fetchData();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleViewUpcoming = async (rule) => {
    setSlotsModalRule(rule);
    try {
      const data = await api.scheduler.getUpcomingSlots(rule.id, 7);
      setUpcomingSlots(data.upcoming_slots || []);
    } catch (err) {
      setUpcomingSlots([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        badge="Autonomous Delivery" badgeColor="indigo" title="Scheduling Settings & Automation" subtitle="Configure automatic publishing rules, interval frequencies, active posting windows, and media collection rotation policies." actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs transition-all flex items-center gap-2" >
            <Plus className="w-4 h-4" />
            <span>Create Recurring Rule</span>
          </button>
        }
      />

      {/* Rules List */}
      {loading ? (
        <SpotlightCard className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-text-muted">Loading scheduling rules...</p>
        </SpotlightCard>
      ) : rules.length === 0 ? (
        <SpotlightCard className="p-16 text-center border-dashed border-2 border-border">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-text mb-1">No Recurring Rules Configured</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mb-4 leading-relaxed">
            Create an automated rule to schedule posts from a collection at set intervals (e.g. every 2 hours, daily, or every two days) between 9 AM and 7 PM.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-semibold shadow-md shadow-xs inline-flex items-center gap-2" >
            <Plus className="w-4 h-4" />
            <span>Create Your First Rule</span>
          </button>
        </SpotlightCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => {
            const isActive = rule.status === 'active';
            const isPaused = rule.status === 'paused';

            return (
              <SpotlightCard
                key={rule.id}
                className="p-5 flex flex-col justify-between" >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-text mb-1">
                        {rule.name}
                      </h3>
                      <div className="text-xs text-text-muted">
                        Platform: <strong className="text-text-secondary capitalize">{rule.platform}</strong> • Collection: <strong className="text-text-secondary">{rule.collection_name || 'No collection'}</strong>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isActive
                        ? 'bg-bg text-primary border border-border' : isPaused
                        ? 'bg-warning/10 text-warning border border-warning/30' : 'bg-bg text-text-secondary' }`}>
                      {rule.status}
                    </span>
                  </div>

                  {/* Details Card */}
                  <div className="bg-surface rounded-xl p-3 mb-4 text-xs space-y-1.5 border border-border leading-relaxed">
                    <div className="text-text-secondary">
                      <strong>Recurrence:</strong>{' '}
                      {rule.recurrence_type === 'hourly' && `Every ${rule.recurrence_interval} hour(s)`}
                      {rule.recurrence_type === 'daily' && `Every day`}
                      {rule.recurrence_type === 'every_n_days' && `Every ${rule.recurrence_interval} day(s)`}
                      {rule.recurrence_type === 'weekdays' && `Monday - Friday`}
                      {rule.recurrence_type === 'custom_weekly' && `Custom (${(rule.weekdays || []).join(', ')})`}
                    </div>
                    <div className="text-text-secondary">
                      <strong>Window:</strong> {rule.start_time || '09:00'} - {rule.end_time || '19:00'} ({rule.timezone})
                    </div>
                    <div className="text-text-secondary">
                      <strong>Strategy:</strong> {rule.selection_strategy} • <strong>Max/day:</strong> {rule.max_posts_per_day}
                    </div>
                    <div className="text-primary font-semibold pt-1">
                      Next Run: {rule.next_run_at ? new Date(rule.next_run_at).toLocaleString() : 'No upcoming run scheduled'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => handleViewUpcoming(rule)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5" >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View Slots</span>
                  </button>

                  {isActive ? (
                    <button
                      onClick={() => handlePause(rule.id)}
                      className="p-1.5 rounded-xl border border-border hover:bg-warning/10 text-warning transition-colors" title="Pause Rule" >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : isPaused ? (
                    <button
                      onClick={() => handleResume(rule.id)}
                      className="p-1.5 rounded-xl border border-border hover:bg-bg text-primary transition-colors" title="Resume Rule" >
                      <Play className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleCancel(rule.id)}
                    className="p-1.5 rounded-xl border border-border hover:bg-bg text-text-muted transition-colors" title="Cancel Rule" >
                    <Ban className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 rounded-xl border border-border hover:bg-rose-50 text-rose-500 transition-colors" title="Delete Rule" >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {/* CREATE RULE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div>
                <h3 className="text-base font-bold text-text">New Recurring Schedule Rule</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Configure autonomous multi-worker posting from collections
                </p>
              </div>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setCreateModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Rule Name *
                </label>
                <input
                  type="text" required
                  placeholder="e.g. Summer Toy Promotions Hourly Blast, Daily Product Spotlight" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* Collection & Platform */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Media Collection *
                  </label>
                  <select
                    required
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" >
                    <option value="">Select a collection</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.media_count} assets)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Target Platform *
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none capitalize" >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
              </div>

              {/* Recurrence Frequency */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Recurrence Frequency *
                </label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none mb-2" >
                  {RECURRENCE_TYPES.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.label}
                    </option>
                  ))}
                </select>

                {recurrenceType === 'hourly' && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface p-2.5 rounded-xl border border-border">
                    <span>Interval:</span>
                    <input
                      type="number" min={1}
                      max={24}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg border border-border bg-white text-center" />
                    <span>hours between posts</span>
                  </div>
                )}

                {recurrenceType === 'every_n_days' && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface p-2.5 rounded-xl border border-border">
                    <span>Interval:</span>
                    <input
                      type="number" min={2}
                      max={60}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg border border-border bg-white text-center" />
                    <span>days (e.g. 2 for every two days)</span>
                  </div>
                )}

                {recurrenceType === 'custom_weekly' && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {WEEKDAYS.map((w) => {
                      const isSel = selectedWeekdays.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          type="button" onClick={() => toggleWeekday(w.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isSel
                              ? 'bg-primary text-primary-on shadow-xs' : 'bg-white border border-border text-text-secondary hover:bg-surface' }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Publishing Window & Timezone */}
              <div className="bg-surface border border-border rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Active Publishing Window & Timezone</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">Start Time</label>
                    <input
                      type="time" value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">End Time</label>
                    <input
                      type="time" value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Selection Strategy & Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Media Selection Strategy
                  </label>
                  <select
                    value={selectionStrategy}
                    onChange={(e) => setSelectionStrategy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" >
                    {SELECTION_STRATEGIES.map((st) => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Max Posts Per Day
                  </label>
                  <input
                    type="number" min={1}
                    max={50}
                    value={maxPostsPerDay}
                    onChange={(e) => setMaxPostsPerDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" />
                </div>
              </div>

              {/* On Exhaustion */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  When Collection Runs Out of Media:
                </label>
                <select
                  value={onExhaustion}
                  onChange={(e) => setOnExhaustion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none" >
                  {EXHAUSTION_POLICIES.map((ep) => (
                    <option key={ep.id} value={ep.id}>{ep.label}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button" onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg" >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary text-primary-on shadow-md shadow-xs disabled:opacity-50" >
                  {submitting ? 'Creating Rule...' : 'Save & Activate Schedule Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPCOMING SLOTS MODAL */}
      {slotsModalRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-base font-bold text-text">Upcoming Publishing Slots</h3>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setSlotsModalRule(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Next calculated slot times for rule <strong className="text-text">"{slotsModalRule.name}"</strong>:
            </p>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {upcomingSlots.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-muted">
                  No upcoming slots found.
                </div>
              ) : (
                upcomingSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-surface border border-border text-xs flex items-center justify-between" >
                    <span className="font-semibold text-text">Slot #{idx + 1}</span>
                    <span className="font-semibold text-primary">{new Date(slot).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-border">
              <button
                className="px-4 py-1.5 rounded-xl bg-surface hover:bg-surface-selected border border-border text-text text-xs font-semibold cursor-pointer" onClick={() => setSlotsModalRule(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
