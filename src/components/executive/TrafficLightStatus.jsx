import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/tokens';

const TrafficLightStatus = memo(({ status }) => {
    const { color, icon: Icon, label, message } = status;
    const colorKey = color === 'emerald' ? 'success' : color === 'amber' ? 'warning' : 'danger';
    if (!tokens || !tokens.colors) return null;
    const theme = tokens.colors[colorKey];

    // Note: Tailwind classes need to be complete strings typically.
    // Since we used dynamic strings in tokens (like 'bg-emerald-100'), we can use them directly.
    // However, the ring/shadow classes in original tokens were generic keys, let's just map them or use the token directly if it matches.
    // Re-evaluating tokens assumption: The original code used dynamic template strings "bg-${color}-100".
    // I will use the explicit classes from tokens to ensure purge works (if configured) or just cleanliness.

    return (
        <div className={`text-center mb-12 cursor-default ${tokens.animation.hover}`}>
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 shadow-2xl ring-8 ${theme.light} ${theme.shadow} ${theme.ring}`}>
                <Icon className={`w-16 h-16 ${theme.main}`} />
            </div>
            <h2 className={`${tokens.typography.h2} ${theme.main} mb-2`}>
                {label}
            </h2>
            <p className={`${tokens.colors.neutral.textMuted} font-medium`}>
                {message}
            </p>
        </div>
    );
});

TrafficLightStatus.propTypes = {
    status: PropTypes.shape({
        color: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        label: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
    }).isRequired,
};

TrafficLightStatus.displayName = 'TrafficLightStatus';

export default TrafficLightStatus;
