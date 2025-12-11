import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import branchesData from '../data/branches.json';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckCircle2, AlertCircle, TrendingUp, ChevronRight, Store, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'branchPlanningData_v2';

function DMDashboard() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'corporate'

    // Load Data
    const myBranches = useMemo(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        let savedMap = {};
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                parsed.forEach(b => savedMap[b.id] = b);
            } catch (e) {
                console.error("Data parse error", e);
            }
        }

        const all = branchesData.flatList.flat();
        // Filter for DM
        const dmBranches = user?.role === 'Corporate'
            ? all
            : all.filter(b => b.dmName === user?.name);

        return dmBranches.map(b => ({
            ...b,
            ...savedMap[b.id], // Merge saved state
            progress: savedMap[b.id]?.isCompleted ? 100 : 0
        }));
    }, [user]);

    // Stats
    const stats = useMemo(() => {
        const total = myBranches.length;
        const completed = myBranches.filter(b => b.progress === 100).length;
        const pending = total - completed;
        return { total, completed, pending };
    }, [myBranches]);

    const handleBranchClick = (branchId) => {
        // Navigate to the details view (we might need to adjust routing to accept an ID or pass state)
        // For now, let's assume we go to /branches with state or a query param
        // But the user asked for "Tap a card -> branch details load instantly"
        // We'll navigate to /branches and maybe the Page needs to handle 'auto-select'
        navigate('/branches', { state: { initialBranchId: branchId } });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100">

            {/* Gentle Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                            Welcome, <span className="text-indigo-600">{user?.name || 'District Manager'}</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Here is how your district is performing today.</p>
                    </div>

                    {/* Role/View Toggle (simplified) */}
                    <div className="flex gap-3">
                        {user?.role === 'Corporate' && (
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full border border-indigo-100">
                                Corporate View
                            </span>
                        )}
                        <button onClick={() => navigate('/login')} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">

                {/* Two Big Actions / Key Views */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* My Branches Card */}
                    <div
                        className={`group cursor-pointer rounded-2xl p-8 transition-all duration-300 border-2 ${viewMode === 'summary' ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100' : 'bg-white border-transparent hover:border-slate-200 shadow-sm'}`}
                        onClick={() => setViewMode('summary')}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${viewMode === 'summary' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'}`}>
                                <Store className="w-8 h-8" />
                            </div>
                            {viewMode === 'summary' && <div className="h-3 w-3 bg-indigo-500 rounded-full animate-pulse" />}
                        </div>
                        <h2 className="text-xl font-semibold mb-2">My Branches</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            {stats.pending > 0
                                ? `You have ${stats.pending} branches pending review.`
                                : "All branches audited. Good job!"}
                        </p>
                    </div>

                    {/* Overall Dashboard Card */}
                    <div
                        className="group cursor-pointer bg-white rounded-2xl p-8 border-2 border-transparent hover:border-slate-200 shadow-sm transition-all duration-300"
                        onClick={() => navigate('/branches')}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Overall Perspective</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            View high-level performance metrics across all regions and districts.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                {viewMode === 'summary' && (
                    <div className="animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-slate-700">Branch Performance</h3>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                {stats.completed} / {stats.total} Maintained
                            </span>
                        </div>

                        {/* Branch Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myBranches.map(branch => (
                                <div
                                    key={branch.id}
                                    onClick={() => handleBranchClick(branch.id)}
                                    className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                                {branch.name}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                                                {branch.district}
                                            </p>
                                        </div>
                                        {branch.progress === 100
                                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                        }
                                    </div>

                                    {/* Mini Progress Bar */}
                                    <div className="mt-6 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${branch.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${branch.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">{branch.progress}%</span>
                                    </div>

                                    {/* Hover Hint */}
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>

                        {myBranches.length === 0 && (
                            <div className="text-center py-20 text-slate-400">
                                <p>No branches assigned to this account.</p>
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}

export default DMDashboard;
