import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/tokens';

const KPICard = memo(({ title, value, target, percent, labelClass }) => {
    if (!tokens || !tokens.colors) return null; // Defensive check
    return (
        <div
            className={`rounded-2xl border relative overflow-hidden group ${tokens.colors.neutral.bg} ${tokens.colors.neutral.border} ${tokens.spacing.cardPadding}`}
            title={`${title}: ${value} achieved out of ${target} target`}
        >
            <div className="flex justify-between items-end mb-1 relative z-10">
                <span className={tokens.typography.label}>{title}</span>
                <span className={`text-sm font-bold ${labelClass}`}>
                    {percent.toFixed(0)}%
                </span>
            </div>

            <div className="flex items-baseline gap-1 relative z-10">
                <span className={`${tokens.typography.value} ${tokens.colors.neutral.textMain}`}>
                    {value}
                </span>
                <span className={`${tokens.colors.neutral.textLight} text-sm font-medium`}>
                    / {target}
                </span>
            </div>

            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-slate-200 w-full">
                <div
                    className={`h-full ${percent >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
        </div>
    );
});

KPICard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    target: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    percent: PropTypes.number.isRequired,
    labelClass: PropTypes.string,
};

KPICard.displayName = 'KPICard';

export default KPICard;
