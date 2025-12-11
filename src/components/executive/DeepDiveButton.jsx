import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { ArrowRight } from 'lucide-react';

const DeepDiveButton = memo(({ onClick, label }) => {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-200 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            aria-label={label}
        >
            <span>{label}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
    );
});

DeepDiveButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
};

DeepDiveButton.displayName = 'DeepDiveButton';

export default DeepDiveButton;
