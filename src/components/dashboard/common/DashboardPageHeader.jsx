import React from 'react';

/**
 * Standard Page Header for all Dashboard views with semantic Indigo Tech classes.
 */
export function DashboardPageHeader({
  badge,
  badgeType = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'slate'
  badgeColor,
  badgeIcon: BadgeIcon,
  statusBadge,
  title,
  description,
  subtitle,
  actions,
  children, // Action buttons or tabs
  className = ''
}) {
  const resolvedBadgeType = badgeColor || badgeType;
  const resolvedDescription = description || subtitle;
  const resolvedActions = children || actions;

  const badgeStyles = {
    indigo: 'bg-primary/10 text-primary border-primary/25',
    emerald: 'bg-success/15 text-success border-success/30',
    amber: 'bg-warning/15 text-warning border-warning/30',
    slate: 'bg-surface text-text-secondary border-border'
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 ${className}`}>
      <div className="space-y-1.5">
        {(badge || statusBadge) && (
          <div className="flex items-center gap-2 flex-wrap">
            {badge && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyles[resolvedBadgeType] || badgeStyles.indigo}`}>
                {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
                {badge}
              </span>
            )}
            {statusBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                {statusBadge}
              </span>
            )}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
          {title}
        </h1>
        {resolvedDescription && (
          <p className="text-xs sm:text-sm text-text-secondary font-medium max-w-2xl">
            {resolvedDescription}
          </p>
        )}
      </div>

      {resolvedActions && (
        <div className="flex items-center gap-2.5 flex-wrap sm:shrink-0">
          {resolvedActions}
        </div>
      )}
    </div>
  );
}

export default DashboardPageHeader;
