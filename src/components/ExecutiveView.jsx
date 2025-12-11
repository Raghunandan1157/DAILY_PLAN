import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    LogOut,
    RefreshCw
} from 'lucide-react';
import { useExecutiveData } from '../hooks/useExecutiveData';
import KPICard from './executive/KPICard';
import TrafficLightStatus from './executive/TrafficLightStatus';
import DeepDiveButton from './executive/DeepDiveButton';
import { tokens } from '../styles/tokens';

function ExecutiveView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: dashboardData, loading, error, refresh } = useExecutiveData();

    console.log('ExecutiveView Render:', { loading, error, user, hasData: !!dashboardData });

    // 2. Health Logic - Memoized
    const status = useMemo(() => {
        if (!dashboardData) return null;
        const score = dashboardData.healthScore;
        if (score >= 90) return { color: 'emerald', icon: CheckCircle2, label: 'Excellent', message: 'On track to exceed targets.' };
        if (score >= 70) return { color: 'amber', icon: AlertTriangle, label: 'At Risk', message: 'Needs attention in some areas.' };
        return { color: 'rose', icon: XCircle, label: 'Behind', message: 'Immediate action required.' };
    }, [dashboardData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-6">
                {/* Skeleton for Header */}
                <div className="w-full max-w-lg flex justify-between items-center mb-8">
                    <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                    <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
                </div>

                {/* Skeleton for Traffic Light */}
                <div className="w-32 h-32 rounded-full bg-slate-100 animate-pulse mb-6"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2 animate-pulse mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse mb-12"></div>

                {/* Skeleton for Cards */}
                <div className="w-full max-w-lg space-y-4">
                    <div className="h-32 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse"></div>
                    <div className="h-32 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-500">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                    We couldn't load your dashboard data. Please check your connection and try again.
                </p>
                <button
                    onClick={refresh}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }

    if (!dashboardData || !status) return null; // Should not happen if not loading/error

    return (
        <div className={`min-h-screen bg-white flex flex-col font-sans ${tokens.colors.neutral.textMain}`}>
            {/* Minimal Header */}
            <header className="px-6 py-6 flex justify-between items-center border-b border-slate-100">
                <div>
                    <h1 className={tokens.typography.h1}>Executive Summary</h1>
                    <p className={`${tokens.colors.neutral.textMuted} text-sm`}>Hello, {user?.name || 'Manager'}</p>
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 rounded-full"
                    title="Logout"
                    aria-label="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className={`flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full ${tokens.animation.fadeIn}`}>

                {/* 1. Main Traffic Light Indicator */}
                <TrafficLightStatus status={status} />

                {/* 2. Key Metrics Grid */}
                <div className={`grid grid-cols-1 w-full ${tokens.spacing.gap} mb-12 sm:grid-cols-2 lg:grid-cols-1`}>
                    <KPICard
                        title="Disbursement"
                        value={`${(dashboardData.totalActualDisb / 100000).toFixed(1)}L`}
                        target={`${(dashboardData.totalTargetDisb / 100000).toFixed(1)}L`}
                        percent={dashboardData.disbPercent}
                        labelClass={dashboardData.disbPercent >= 90 ? tokens.colors.success.main : tokens.colors.warning.main}
                    />

                    <KPICard
                        title="Collection (FTOD)"
                        value={`${(dashboardData.totalActualColl / 100000).toFixed(1)}L`}
                        target={`${(dashboardData.totalTargetColl / 100000).toFixed(1)}L`}
                        percent={dashboardData.collPercent}
                        labelClass={dashboardData.collPercent >= 90 ? tokens.colors.success.main : tokens.colors.warning.main}
                    />
                </div>

                {/* 3. Deep Dive Button */}
                <DeepDiveButton
                    onClick={() => navigate('/dashboard')}
                    label="View Detailed Report"
                />

                <p className={`mt-6 text-xs ${tokens.colors.neutral.textLight} font-medium text-center`}>
                    {dashboardData.branchesCompleted} of {dashboardData.branchesTotal} branches have submitted data.
                </p>

            </main>
        </div>
    );
}

export default ExecutiveView;
