import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Minus, MapPin, Building2, Store } from 'lucide-react';
import trendsData from '../data/trends.json';

// Helper for formatting
const formatCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
};

const GrowthIndicator = ({ current, previous }) => {
    if (!previous) return <Minus className="w-4 h-4 text-slate-400" />;

    const diff = current - previous;
    const percentage = previous ? ((diff / previous) * 100).toFixed(1) : 0;

    if (diff > 0) return (
        <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{percentage}%</span>
        </div>
    );
    if (diff < 0) return (
        <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
            <TrendingDown className="w-3 h-3" />
            <span>{percentage}%</span>
        </div>
    );
    return <Minus className="w-3 h-3 text-slate-400" />;
};

export default function TrendView() {
    // Sort regions by performance (Growth)
    const sortedRegions = useMemo(() => {
        return [...trendsData.regions].sort((a, b) => {
            const growthA = a.current.collection - a.previous.collection;
            const growthB = b.current.collection - b.previous.collection;
            return growthB - growthA;
        });
    }, []);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            y: { beginAtZero: true, grid: { display: false } },
            x: { grid: { display: false } }
        }
    };

    return (
        <div className="space-y-6">

            {/* Region Wise Comparison */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Region-wise Growth (Collection)
                </h3>
                <div className="grid gap-3">
                    {sortedRegions.map(region => (
                        <div key={region.name} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-800">{region.name}</p>
                                <p className="text-xs text-slate-500">
                                    Last Mo: {formatCurrency(region.previous.collection)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">{formatCurrency(region.current.collection)}</p>
                                <GrowthIndicator current={region.current.collection} previous={region.previous.collection} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* District Wise Comparison (One Chart for top districts) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    District Performance (Top 5)
                </h3>
                <div className="h-48">
                    <Bar
                        data={{
                            labels: trendsData.districts.slice(0, 5).map(d => d.name),
                            datasets: [
                                {
                                    label: 'Current Month',
                                    data: trendsData.districts.slice(0, 5).map(d => d.current.collection),
                                    backgroundColor: '#4f46e5',
                                    borderRadius: 4
                                },
                                {
                                    label: 'Last Month',
                                    data: trendsData.districts.slice(0, 5).map(d => d.previous.collection),
                                    backgroundColor: '#e2e8f0',
                                    borderRadius: 4
                                }
                            ]
                        }}
                        options={chartOptions}
                    />
                </div>
            </div>

            {/* Branch Wise Trend Cards */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-indigo-600" />
                    Branch Trends
                </h3>
                {trendsData.branches.slice(0, 20).map(branch => ( // Limit to 20 for performance
                    <div key={branch.name + branch.district} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-sm text-slate-800">{branch.name}</h4>
                                <p className="text-[10px] text-slate-500">{branch.district} • {branch.region}</p>
                            </div>
                            <GrowthIndicator current={branch.current.collection} previous={branch.previous.collection} />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 p-1.5 rounded">
                                <span className="text-slate-400 block text-[9px]">Collection</span>
                                <span className="font-medium text-slate-700">{formatCurrency(branch.current.collection)}</span>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded">
                                <span className="text-slate-400 block text-[9px]">Last Mo</span>
                                <span className="font-medium text-slate-700">{formatCurrency(branch.previous.collection)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
