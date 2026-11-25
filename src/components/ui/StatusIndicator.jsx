import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Clock, RefreshCw, Activity } from 'lucide-react';

/**
 * StatusIndicator — React Bits Component
 * Clean, subtle enterprise status indicators for:
 * - 'running' / 'generating' (pulsing beacon + optional spin)
 * - 'queued' / 'pending' (amber/champagne clock)
 * - 'completed' / 'published' (emerald check with soft glow)
 * - 'failed' / 'rejected' (coral warning badge)
 * - 'active' (live radar beacon)
 */
export function StatusIndicator({
  status = 'active',
  label,
  size = 'md', // 'sm' | 'md' | 'lg'
  showIcon = true,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();

  const normalized = String(status).toLowerCase();

  const configs = {
    running: {
      color: 'text-warning dark:text-accent',
      bg: 'bg-warning/15 border-warning/30',
      dot: 'bg-warning',
      ring: 'rgba(245, 158, 11, 0.4)',
      icon: RefreshCw,
      spin: true,
      defaultLabel: 'Running',
    },
    generating: {
      color: 'text-warning dark:text-accent',
      bg: 'bg-warning/15 border-warning/30',
      dot: 'bg-warning',
      ring: 'rgba(245, 158, 11, 0.4)',
      icon: RefreshCw,
      spin: true,
      defaultLabel: 'Generating AI Content',
    },
    queued: {
      color: 'text-primary',
      bg: 'bg-primary-soft border-primary/20',
      dot: 'bg-primary',
      ring: 'rgba(54, 185, 135, 0.4)',
      icon: Clock,
      spin: false,
      defaultLabel: 'Queued',
    },
    completed: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      dot: 'bg-emerald-500',
      ring: 'rgba(16, 185, 129, 0.4)',
      icon: CheckCircle2,
      spin: false,
      defaultLabel: 'Completed',
    },
    published: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      dot: 'bg-emerald-500',
      ring: 'rgba(16, 185, 129, 0.4)',
      icon: CheckCircle2,
      spin: false,
      defaultLabel: 'Published',
    },
    failed: {
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/15 border-rose-500/30',
      dot: 'bg-rose-500',
      ring: 'rgba(239, 68, 68, 0.4)',
      icon: AlertTriangle,
      spin: false,
      defaultLabel: 'Failed',
    },
    rejected: {
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/15 border-rose-500/30',
      dot: 'bg-rose-500',
      ring: 'rgba(239, 68, 68, 0.4)',
      icon: AlertTriangle,
      spin: false,
      defaultLabel: 'Rejected',
    },
    active: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      dot: 'bg-emerald-500',
      ring: 'rgba(16, 185, 129, 0.4)',
      icon: Activity,
      spin: false,
      defaultLabel: 'Active Engine',
    },
    paused: {
      color: 'text-text-muted dark:text-text-muted',
      bg: 'bg-slate-500/15 border-border',
      dot: 'bg-slate-400',
      ring: 'transparent',
      icon: Clock,
      spin: false,
      defaultLabel: 'Paused',
    },
  };

  const cfg = configs[normalized] || configs.active;
  const displayText = label || cfg.defaultLabel;
  const IconComponent = cfg.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${cfg.bg} ${cfg.color} ${sizeClasses} ${className} transition-colors select-none`}
    >
      {/* Beacon Dot */}
      <span className="relative flex h-2 w-2 items-center justify-center">
        {!shouldReduceMotion && (normalized === 'running' || normalized === 'generating' || normalized === 'active') && (
          <motion.span
            animate={{
              scale: [1, 2.2, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute inline-flex h-full w-full rounded-full ${cfg.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
      </span>

      {showIcon && IconComponent && (
        <IconComponent
          className={`w-3.5 h-3.5 shrink-0 ${cfg.spin && !shouldReduceMotion ? 'animate-spin' : ''}`}
        />
      )}

      <span>{displayText}</span>
    </span>
  );
}

export default StatusIndicator;
