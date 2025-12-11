import React, { useState, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Filter } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const GraphView = ({ branches }) => {
    const [selectedRegion, setSelectedRegion] = useState('All');
    const [selectedDistrict, setSelectedDistrict] = useState('All');
    const [selectedBranch, setSelectedBranch] = useState('All');

    // Extract unique regions and districts
    const regions = useMemo(() => ['All', ...new Set(branches.map(b => b.region))], [branches]);

    const districts = useMemo(() => {
        if (selectedRegion === 'All') return ['All', ...new Set(branches.map(b => b.district))];
        return ['All', ...new Set(branches.filter(b => b.region === selectedRegion).map(b => b.district))];
    }, [branches, selectedRegion]);

    const filteredBranchesList = useMemo(() => {
        let filtered = branches;
        if (selectedRegion !== 'All') {
            filtered = filtered.filter(b => b.region === selectedRegion);
        }
        if (selectedDistrict !== 'All') {
            filtered = filtered.filter(b => b.district === selectedDistrict);
        }
        if (selectedBranch !== 'All') {
            filtered = filtered.filter(b => b.name === selectedBranch);
        }
        return filtered;
    }, [branches, selectedRegion, selectedDistrict, selectedBranch]);

    const availableBranches = useMemo(() => {
        let filtered = branches;
        if (selectedRegion !== 'All') filtered = filtered.filter(b => b.region === selectedRegion);
        if (selectedDistrict !== 'All') filtered = filtered.filter(b => b.district === selectedDistrict);
        return ['All', ...filtered.map(b => b.name)];
    }, [branches, selectedRegion, selectedDistrict]);

    // --- Chart Data Preparation ---

    const getTargetValue = (obj, path) => {
        if (!obj || !path) return 0;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj) || 0;
    };

    // 1. Region-wise Bar Graph (Targets vs Achievement)
    const regionChartData = useMemo(() => {
        const regionData = {};

        // Use all branches or filtered branches? 
        // "Region-wise" usually implies comparison across regions. 
        // Even if filtered, showing context is good. But let's respect the filter to zoom in?
        // Let's show data based on current filter scope. 
        // IF All Regions selected -> Show All Regions.
        // IF Specific Region selected -> Show that Region (single bar group) or breakdown?
        // Let's stick to showing the regions relevant to the current view.
        // Actually, for a "Bar Graph of Regions", if I select Region A, showing only A is boring.
        // But the requirement says "graphs must update automatically based on selected...".
        // Let's compute for the *filteredBranchesList* but grouped by Region.

        filteredBranchesList.forEach(branch => {
            const region = branch.region || 'Unassigned';
            if (!regionData[region]) {
                regionData[region] = { target: 0, actual: 0 };
            }

            // Disbursement Target
            const target = getTargetValue(branch.targets, 'disbursement.sanctionPending.amount') +
                getTargetValue(branch.targets, 'disbursement.iglFig.amount') +
                getTargetValue(branch.targets, 'disbursement.il.amount');

            // Disbursement Actual
            const actual = (Number(branch.formData?.sanctionPendingAmtActual) || 0) +
                (Number(branch.formData?.iglFigAmtActual) || 0) +
                (Number(branch.formData?.ilAmtActual) || 0);

            regionData[region].target += target;
            regionData[region].actual += actual;
        });

        const labels = Object.keys(regionData).sort();
        return {
            labels,
            datasets: [
                {
                    label: 'Target (Disb)',
                    data: labels.map(r => regionData[r].target),
                    backgroundColor: 'rgba(99, 102, 241, 0.5)', // Indigo
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Achievement (Disb)',
                    data: labels.map(r => regionData[r].actual),
                    backgroundColor: 'rgba(34, 197, 94, 0.5)', // Green
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [filteredBranchesList]);

    // 2. District-wise Line Graph (Collection %)
    const districtChartData = useMemo(() => {
        const districtData = {};

        filteredBranchesList.forEach(branch => {
            const district = branch.district || 'Unassigned';
            if (!districtData[district]) {
                districtData[district] = { targetColl: 0, actualColl: 0 };
            }

            // Collection Target
            const target = getTargetValue(branch.targets, 'collection.ftod.collection') +
                getTargetValue(branch.targets, 'collection.pnpa.collection');

            // Collection Actual
            const actual = (Number(branch.formData?.ftodCollActual) || 0) +
                (Number(branch.formData?.pnpaCollActual) || 0);

            districtData[district].targetColl += target;
            districtData[district].actualColl += actual;
        });

        const labels = Object.keys(districtData).sort();
        const percentages = labels.map(d => {
            const { targetColl, actualColl } = districtData[d];
            return targetColl > 0 ? (actualColl / targetColl) * 100 : 0;
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Collection %',
                    data: percentages,
                    borderColor: 'rgb(249, 115, 22)', // Orange
                    backgroundColor: 'rgba(249, 115, 22, 0.5)',
                    tension: 0.3, // Smooth curve
                    fill: true,
                },
            ],
        };
    }, [filteredBranchesList]);

    // 3. Branch-wise Donut Chart (Activation, Closure, Slipped)
    const donutChartData = useMemo(() => {
        let activation = 0;
        let closure = 0;
        let slipped = 0;

        filteredBranchesList.forEach(branch => {
            // Activation & Closure (from NPA section)
            activation += Number(branch.formData?.npaActivationActual) || 0;
            closure += Number(branch.formData?.npaClosureActual) || 0;

            // Slipped Accounts (from Collection section)
            slipped += Number(branch.formData?.novSlippedActual) || 0;
        });

        return {
            labels: ['Activation', 'Closure', 'Slipped Accts'],
            datasets: [
                {
                    data: [activation, closure, slipped],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.6)', // Blue
                        'rgba(16, 185, 129, 0.6)', // Green
                        'rgba(239, 68, 68, 0.6)',  // Red
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    }, [filteredBranchesList]);

    // Reset child filters when parent changes
    const handleRegionChange = (e) => {
        setSelectedRegion(e.target.value);
        setSelectedDistrict('All');
        setSelectedBranch('All');
    };

    const handleDistrictChange = (e) => {
        setSelectedDistrict(e.target.value);
        setSelectedBranch('All');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
                    <Filter className="w-4 h-4" />
                    Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                        value={selectedRegion}
                        onChange={handleRegionChange}
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                        <option value="All">All Regions</option>
                        {regions.filter(r => r !== 'All').map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>

                    <select
                        value={selectedDistrict}
                        onChange={handleDistrictChange}
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                        <option value="All">All Districts</option>
                        {districts.filter(d => d !== 'All').map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                        <option value="All">All Branches</option>
                        {availableBranches.filter(b => b !== 'All').map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 gap-6">

                {/* Region Bar Graph */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                        Region-wise Performance
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">Target vs Achv</span>
                    </h3>
                    <div className="h-64">
                        <Bar
                            data={regionChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: (val) => val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* District Line Graph */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                        District Collection Trends
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-full">Collection %</span>
                    </h3>
                    <div className="h-64">
                        <Line
                            data={districtChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        ticks: {
                                            callback: (val) => `${val}%`
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Branch Donut Chart */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                        Operational Metrics
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{selectedBranch !== 'All' ? selectedBranch : 'Aggregate'}</span>
                    </h3>
                    <div className="h-64 flex justify-center">
                        <Doughnut
                            data={donutChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: '60%',
                                plugins: {
                                    legend: {
                                        position: 'bottom'
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GraphView;
