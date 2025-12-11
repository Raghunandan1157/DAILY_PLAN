import { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Download, ChevronLeft, Trash2, LayoutDashboard } from 'lucide-react';
import OverviewSidebar from './OverviewSidebar';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler);

// Helper to get nested value
const getTargetValue = (obj, path) => {
    if (!obj || !path) return 0;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || 0;
};

function Dashboard({ branches, user, onDeleteBranch, onBack, showToast }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const completedBranches = branches.filter(b => b.isCompleted);
    const pendingBranches = branches.filter(b => !b.isCompleted);

    // Calculate Aggregates
    const aggregates = branches.reduce((acc, branch) => {
        // Disbursement Targets
        acc.target.disbursement += getTargetValue(branch.targets, 'disbursement.sanctionPending.amount') +
            getTargetValue(branch.targets, 'disbursement.iglFig.amount') +
            getTargetValue(branch.targets, 'disbursement.il.amount');

        // Collection Targets (Sum of all collection plans?)
        // Let's pick a key metric, e.g., Total Collection Plan
        acc.target.collection += getTargetValue(branch.targets, 'collection.ftod.collection') +
            getTargetValue(branch.targets, 'collection.pnpa.collection');

        // Actuals
        if (branch.formData) {
            acc.actual.disbursement += (Number(branch.formData.sanctionPendingAmtActual) || 0) +
                (Number(branch.formData.iglFigAmtActual) || 0) +
                (Number(branch.formData.ilAmtActual) || 0);

            acc.actual.collection += (Number(branch.formData.ftodCollActual) || 0) +
                (Number(branch.formData.pnpaCollActual) || 0);
        }
        return acc;
    }, {
        target: { disbursement: 0, collection: 0 },
        actual: { disbursement: 0, collection: 0 }
    });

    // Chart Data
    const barData = {
        labels: ['Disbursement Amount', 'Collection Amount'],
        datasets: [
            {
                label: 'Target',
                data: [aggregates.target.disbursement, aggregates.target.collection],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            },
            {
                label: 'Achievement',
                data: [aggregates.actual.disbursement, aggregates.actual.collection],
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
            }
        ]
    };

    const pieData = {
        labels: ['Completed', 'Pending'],
        datasets: [{
            data: [completedBranches.length, pendingBranches.length],
            backgroundColor: ['#10b981', '#cbd5e1'],
            borderColor: ['#047857', '#94a3b8'],
            borderWidth: 1,
        }]
    };

    const handleExportCSV = () => {
        if (branches.length === 0) return;

        const headers = [
            'Branch', 'Region', 'District', 'Status',
            'Target Disb Amt', 'Actual Disb Amt',
            'Target Coll Amt', 'Actual Coll Amt'
        ];

        const rows = branches.map(b => {
            const targetDisb = getTargetValue(b.targets, 'disbursement.sanctionPending.amount') +
                getTargetValue(b.targets, 'disbursement.iglFig.amount') +
                getTargetValue(b.targets, 'disbursement.il.amount');

            const actualDisb = (Number(b.formData?.sanctionPendingAmtActual) || 0) +
                (Number(b.formData?.iglFigAmtActual) || 0) +
                (Number(b.formData?.ilAmtActual) || 0);

            const targetColl = getTargetValue(b.targets, 'collection.ftod.collection') +
                getTargetValue(b.targets, 'collection.pnpa.collection');

            const actualColl = (Number(b.formData?.ftodCollActual) || 0) +
                (Number(b.formData?.pnpaCollActual) || 0);

            return [
                b.name, b.region, b.district, b.isCompleted ? 'Completed' : 'Pending',
                targetDisb, actualDisb, targetColl, actualColl
            ].join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `branch_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="flex-1 min-h-screen bg-slate-50 p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {user?.role === 'Corporate' ? 'Corporate Dashboard' : 'My Dashboard'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {user?.role === 'Corporate'
                            ? 'Real-time performance consolidation'
                            : `Overview for ${user?.name || 'District Manager'}`}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm">
                        <LayoutDashboard className="w-4 h-4" /> Overview
                    </button>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors shadow-lg shadow-slate-900/20">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Branches</p>
                    <p className="text-3xl font-bold text-slate-900">{branches.length}</p>
                    <div className="mt-2 text-xs text-green-600 font-medium">{completedBranches.length} completed</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Target (Disb)</p>
                    <p className="text-3xl font-bold text-blue-600">₹{(aggregates.target.disbursement / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-slate-400 mt-1">Planned Disbursement</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Achievement (Disb)</p>
                    <p className="text-3xl font-bold text-green-600">₹{(aggregates.actual.disbursement / 100000).toFixed(1)}L</p>
                    <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${(aggregates.actual.disbursement / aggregates.target.disbursement * 100) || 0}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Achievement (Coll)</p>
                    <p className="text-3xl font-bold text-indigo-600">₹{(aggregates.actual.collection / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-slate-400 mt-1">Target: ₹{(aggregates.target.collection / 100000).toFixed(1)}L</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
                    <h3 className="font-bold text-slate-800 mb-6">Target vs Achievement Analysis</h3>
                    <div className="h-64">
                        <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Submission Status</h3>
                    <div className="h-64">
                        <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Branch Performance Report</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Branch</th>
                                <th className="px-6 py-3 font-semibold">Region</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold text-right">Target (Disb)</th>
                                <th className="px-6 py-3 font-semibold text-right">Actual (Disb)</th>
                                <th className="px-6 py-3 font-semibold text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {branches.map((branch) => {
                                const targetDisb = getTargetValue(branch.targets, 'disbursement.sanctionPending.amount') + getTargetValue(branch.targets, 'disbursement.iglFig.amount');
                                const actualDisb = (Number(branch.formData?.sanctionPendingAmtActual) || 0) + (Number(branch.formData?.iglFigAmtActual) || 0);

                                return (
                                    <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{branch.name}</td>
                                        <td className="px-6 py-4 text-slate-500">{branch.region}</td>
                                        <td className="px-6 py-4">
                                            {branch.isCompleted ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-600">
                                            {targetDisb.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                            {actualDisb > 0 ? actualDisb.toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {branch.isCompleted && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Reset data for ${branch.name}?`)) onDeleteBranch(branch.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <OverviewSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                branches={branches}
            />
        </div>
    );
}

export default Dashboard;
