import { useState, useEffect, useRef } from 'react';
import {
    Clock,
    Save,
    Send,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Calculator,
    Target
} from 'lucide-react';

// Organized groups for the form
const FORM_SECTIONS = [
    {
        id: 'disbursement',
        title: 'Disbursement Targets',
        color: 'blue',
        fields: [
            {
                label: 'Sanction Pending',
                subLabel: 'Accounts',
                key: 'sanctionPendingAccActual',
                targetKey: 'disbursement.sanctionPending.accounts',
                type: 'number'
            },
            {
                label: 'Sanction Pending',
                subLabel: 'Amount',
                key: 'sanctionPendingAmtActual',
                targetKey: 'disbursement.sanctionPending.amount',
                type: 'number'
            },
            {
                label: 'IGL & FIG',
                subLabel: 'Accounts',
                key: 'iglFigAccActual',
                targetKey: 'disbursement.iglFig.accounts',
                type: 'number'
            },
            {
                label: 'IGL & FIG',
                subLabel: 'Amount',
                key: 'iglFigAmtActual',
                targetKey: 'disbursement.iglFig.amount',
                type: 'number'
            },
            {
                label: 'IL',
                subLabel: 'Accounts',
                key: 'ilAccActual',
                targetKey: 'disbursement.il.accounts',
                type: 'number'
            },
            {
                label: 'IL',
                subLabel: 'Amount',
                key: 'ilAmtActual',
                targetKey: 'disbursement.il.amount',
                type: 'number'
            },
            {
                label: 'KYC Sourcing',
                key: 'kycSourcingActual',
                targetKey: 'disbursement.kycSourcing',
                type: 'number'
            },
        ]
    },
    {
        id: 'collection',
        title: 'Collection (1-30 DPD)',
        color: 'indigo',
        fields: [
            {
                label: 'Nov Slipped Accounts',
                key: 'novSlippedActual',
                targetKey: 'collection.oneToThirtyDpd.novSlippedAccounts',
                type: 'number'
            },
            {
                label: '1 EMI Collection',
                key: 'emi1Actual',
                targetKey: 'collection.oneToThirtyDpd.emi1',
                type: 'number'
            },
            {
                label: '2 EMI Collection',
                key: 'emi2Actual',
                targetKey: 'collection.oneToThirtyDpd.emi2',
                type: 'number'
            },
        ]
    },
    {
        id: 'ftod',
        title: 'FTOD Plan',
        color: 'cyan',
        fields: [
            {
                label: 'FTOD Accounts',
                key: 'ftodAccActual',
                targetKey: 'collection.ftod.accounts',
                type: 'number'
            },
            {
                label: 'FTOD Collection',
                key: 'ftodCollActual',
                targetKey: 'collection.ftod.collection',
                type: 'number'
            },
        ]
    },
    {
        id: 'npa',
        title: 'NPA & PNPA',
        color: 'rose',
        fields: [
            {
                label: 'PNPA Accounts',
                key: 'pnpaAccActual',
                targetKey: 'collection.pnpa.accounts',
                type: 'number'
            },
            {
                label: 'PNPA Collection',
                key: 'pnpaCollActual',
                targetKey: 'collection.pnpa.collection',
                type: 'number'
            },
            {
                label: 'NPA KYC',
                key: 'npaKycActual',
                targetKey: 'collection.npa.kyc',
                type: 'number'
            },
            {
                label: 'NPA Activation',
                key: 'npaActivationActual',
                targetKey: 'collection.npa.activation',
                type: 'number'
            },
            {
                label: 'NPA Closure',
                key: 'npaClosureActual',
                targetKey: 'collection.npa.closure',
                type: 'number'
            },
        ]
    }
];

const DRAFT_KEY = 'branchFormDraft_v2';

// Helper to get nested value from targetKey string
const getTargetValue = (obj, path) => {
    if (!obj || !path) return 0;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || 0;
};

function BranchForm({ selectedBranch, onSubmit, onTimerUpdate, allCompleted, showToast }) {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [timer, setTimer] = useState(0);
    const [hasDraft, setHasDraft] = useState(false);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const formContainerRef = useRef(null);

    // Initialize/Reset
    useEffect(() => {
        if (selectedBranch) {
            const draftKey = `${DRAFT_KEY}_${selectedBranch.id}`;
            const savedDraft = localStorage.getItem(draftKey);
            let initialData = {};

            if (selectedBranch.formData) {
                // Load submitted data
                initialData = { ...selectedBranch.formData };
                setIsEditMode(false);
            } else if (savedDraft) {
                try {
                    initialData = JSON.parse(savedDraft);
                    setHasDraft(true);
                } catch {
                    initialData = {};
                }
            }

            setFormData(initialData);
            setTimer(selectedBranch.timeSpent || 0);
            startTimeRef.current = Date.now() - (selectedBranch.timeSpent || 0) * 1000;

            if (!selectedBranch.isCompleted || isEditMode) {
                startTimer();
            }

            // Scroll to top
            if (formContainerRef.current) formContainerRef.current.scrollTop = 0;
        }

        return () => stopTimer();
    }, [selectedBranch?.id, isEditMode]);

    const startTimer = () => {
        stopTimer();
        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setTimer(elapsed);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    // Auto-save draft
    useEffect(() => {
        if (selectedBranch && !selectedBranch.isCompleted) {
            const hasData = Object.keys(formData).length > 0;
            if (hasData) {
                localStorage.setItem(`${DRAFT_KEY}_${selectedBranch.id}`, JSON.stringify(formData));
            }
        }
    }, [formData, selectedBranch]);

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        stopTimer();

        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));

        // Clear draft
        localStorage.removeItem(`${DRAFT_KEY}_${selectedBranch.id}`);
        setHasDraft(false);

        onSubmit(selectedBranch.id, formData, timer, isEditMode);
        setIsSubmitting(false);
        setIsEditMode(false);
        showToast?.('Update saved successfully', 'success');
    };

    const handleEdit = () => {
        setIsEditMode(true);
        // Sync timer start to preserve accumulated time
        startTimeRef.current = Date.now() - timer * 1000;
        startTimer();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (allCompleted && !selectedBranch) {
        return (
            <div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="text-center max-w-lg bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">All Branches Completed!</h1>
                    <p className="text-slate-500 mb-6">
                        Great job! You have submitted plans for all branches.
                    </p>
                </div>
            </div>
        );
    }

    if (!selectedBranch) {
        return (
            <div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="text-center text-slate-400">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <h2 className="text-xl font-semibold text-slate-600">Select a Branch</h2>
                    <p>Choose a branch from the sidebar to view details</p>
                </div>
            </div>
        );
    }

    const isDisabled = selectedBranch.isCompleted && !isEditMode;

    return (
        <div ref={formContainerRef} className="flex-1 h-screen overflow-y-auto bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
            <div className="max-w-5xl mx-auto p-8 pb-32">

                {/* Header */}
                <div className="flex items-start justify-between mb-8 sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm py-4 border-b border-slate-200">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-slate-900">{selectedBranch.name}</h1>
                            {selectedBranch.isCompleted && !isEditMode && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                    Submitted
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <span className="font-medium text-slate-700">Region:</span> {selectedBranch.region}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="flex items-center gap-1">
                                <span className="font-medium text-slate-700">District:</span> {selectedBranch.district}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="flex items-center gap-1">
                                <span className="font-medium text-slate-700">DM:</span> {selectedBranch.dmName}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                            <Clock className={`w-4 h-4 ${timer > 300 ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className="font-mono font-bold text-slate-700 text-lg">{formatTime(timer)}</span>
                        </div>

                        {isDisabled && (
                            <button
                                onClick={handleEdit}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                            >
                                Edit Plan
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {FORM_SECTIONS.map((section) => (
                        <div key={section.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className={`px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${section.color}-100`}>
                                    <Calculator className={`w-4 h-4 text-${section.color}-600`} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">{section.title}</h3>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                {section.fields.map((field) => {
                                    const targetValue = getTargetValue(selectedBranch.targets, field.targetKey);

                                    return (
                                        <div key={field.key} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-sm font-semibold text-slate-700">
                                                        {field.label}
                                                        {field.subLabel && <span className="text-slate-400 font-normal ml-1">({field.subLabel})</span>}
                                                    </label>
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                        Target: {targetValue.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type={field.type}
                                                        value={formData[field.key] || ''}
                                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                        disabled={isDisabled}
                                                        placeholder="Enter achievement..."
                                                        className="w-full pl-3 pr-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:bg-slate-50 disabled:text-slate-500 placeholder:text-slate-300"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-end pt-4 pb-20">
                        {!isDisabled && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{isEditMode ? 'Update Plan' : 'Submit Plan'}</span>
                                        <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default BranchForm;
