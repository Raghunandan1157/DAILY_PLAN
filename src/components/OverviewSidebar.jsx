import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, Store, MapPin, TrendingUp, Building2, Trophy, AlertTriangle, Info, LineChart } from 'lucide-react';
import TrendView from './TrendView';

const getTargetValue = (obj, path) => {
    if (!obj || !path) return 0;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || 0;
};

const calculateMetrics = (branchesList) => {
    return branchesList.reduce((acc, branch) => {
        // Targets
        const targetDisb = getTargetValue(branch.targets, 'disbursement.sanctionPending.amount') +
            getTargetValue(branch.targets, 'disbursement.iglFig.amount') +
            getTargetValue(branch.targets, 'disbursement.il.amount');

        const targetColl = getTargetValue(branch.targets, 'collection.ftod.collection') +
            getTargetValue(branch.targets, 'collection.pnpa.collection');

        // Actuals
        const actualDisb = (Number(branch.formData?.sanctionPendingAmtActual) || 0) +
            (Number(branch.formData?.iglFigAmtActual) || 0) +
            (Number(branch.formData?.ilAmtActual) || 0);

        const actualColl = (Number(branch.formData?.ftodCollActual) || 0) +
            (Number(branch.formData?.pnpaCollActual) || 0);

        // NPA
        const npaTarget = getTargetValue(branch.targets, 'collection.npa.closure');
        const npaActual = Number(branch.formData?.npaClosureActual) || 0;
        const activationTarget = getTargetValue(branch.targets, 'collection.npa.activation');
        const activationActual = Number(branch.formData?.npaActivationActual) || 0;
        // High risk (PNPA)
        const pnpaTarget = getTargetValue(branch.targets, 'collection.pnpa.accounts');
        const pnpaActual = Number(branch.formData?.pnpaAccActual) || 0;


        return {
            targetDisbursement: acc.targetDisbursement + targetDisb,
            targetCollection: acc.targetCollection + targetColl,
            actualDisbursement: acc.actualDisbursement + actualDisb,
            actualCollection: acc.actualCollection + actualColl,

            npaTarget: acc.npaTarget + npaTarget,
            npaActual: acc.npaActual + npaActual,
            activationTarget: acc.activationTarget + activationTarget,
            activationActual: acc.activationActual + activationActual,
            pnpaTarget: acc.pnpaTarget + pnpaTarget,
            pnpaActual: acc.pnpaActual + pnpaActual,

            activeCount: acc.activeCount + (branch.isCompleted ? 1 : 0),
            totalCount: acc.totalCount + 1
        };
    }, {
        targetDisbursement: 0,
        targetCollection: 0,
        actualDisbursement: 0,
        actualCollection: 0,
        npaTarget: 0,
        npaActual: 0,
        activationTarget: 0,
        activationActual: 0,
        pnpaTarget: 0,
        pnpaActual: 0,
        activeCount: 0,
        totalCount: 0
    });
};

const HeaderTab = ({ active, label, onClick, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${active
            ? 'bg-indigo-600 text-white shadow-md'
            : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

const SectionHeader = ({ title, icon: Icon, color = "indigo" }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 pb-2 border-b border-slate-100">
        <Icon className={`w-4 h-4 text-${color}-600`} />
        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{title}</h4>
    </div>
);

export default function OverviewSidebar({ isOpen, onClose, branches }) {
    const [expandedRegions, setExpandedRegions] = useState({});
    const [expandedDistricts, setExpandedDistricts] = useState({});
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'graph'

    const groupedData = useMemo(() => {
        const regions = {};

        branches.forEach(branch => {
            const regionName = branch.region || 'Unassigned';
            const districtName = branch.district || 'Unassigned';

            if (!regions[regionName]) {
                regions[regionName] = {
                    name: regionName,
                    districts: {},
                    branches: [],
                    metrics: null
                };
            }

            if (!regions[regionName].districts[districtName]) {
                regions[regionName].districts[districtName] = {
                    name: districtName,
                    branches: [],
                    metrics: null
                };
            }

            regions[regionName].branches.push(branch);
            regions[regionName].districts[districtName].branches.push(branch);
        });

        // Calculate metrics
        Object.values(regions).forEach(region => {
            region.metrics = calculateMetrics(region.branches);

            Object.values(region.districts).forEach(district => {
                district.metrics = calculateMetrics(district.branches);
            });
        });

        // Sort regions alphabetically
        return Object.values(regions).sort((a, b) => a.name.localeCompare(b.name));
    }, [branches]);

    const toggleRegion = (regionName) => {
        setExpandedRegions(prev => ({ ...prev, [regionName]: !prev[regionName] }));
    };

    const toggleDistrict = (districtName) => {
        setExpandedDistricts(prev => ({ ...prev, [districtName]: !prev[districtName] }));
    };

    const formatCurrency = (val) => {
        // Format as Lacs if > 100000
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        return `₹${val.toLocaleString()}`;
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 overflow-hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header with Tabs */}
                <div className="bg-white border-b border-slate-100 flex flex-col pt-4">
                    <div className="px-6 flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            Overview
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-6 gap-6">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'list'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            List View
                        </button>
                        <button
                            onClick={() => setActiveTab('graph')}
                            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'graph'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Graph View
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 relative">

                    {/* Graph View */}
                    {activeTab === 'graph' && <GraphView branches={branches} />}

                    {/* List View */}
                    {activeTab === 'list' && (
                        <>
                            {/* Overall Summary Card */}
                            <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg shadow-indigo-200 mb-4 bg-gradient-to-br from-indigo-600 to-indigo-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-indigo-200" />
                                        Corporate Summary
                                    </h3>
                                    <span className="text-xs bg-indigo-500/50 px-2 py-1 rounded-full text-indigo-100 border border-indigo-400/30">
                                        {branches.length} Branches
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold mb-1">Total Disbursal</p>
                                        <p className="text-3xl font-bold">
                                            {formatCurrency(calculateMetrics(branches).actualDisbursement)}
                                        </p>
                                        <div className="w-full bg-indigo-900/30 h-1 mt-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-300"
                                                style={{ width: `${Math.min((calculateMetrics(branches).actualDisbursement / (calculateMetrics(branches).targetDisbursement || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-indigo-200 mt-1">
                                            Target: {formatCurrency(calculateMetrics(branches).targetDisbursement)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold mb-1">Total Collection</p>
                                        <p className="text-3xl font-bold">
                                            {formatCurrency(calculateMetrics(branches).actualCollection)}
                                        </p>
                                        <p className="text-xs text-indigo-200 mt-1">
                                            Target: {formatCurrency(calculateMetrics(branches).targetCollection)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {groupedData.map(region => (
                                    <div key={region.name} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        {/* Region Header */}
                                        <button
                                            onClick={() => toggleRegion(region.name)}
                                            className="w-full px-4 py-3 bg-white flex items-center justify-between hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${expandedRegions[region.name] ? 'bg-indigo-100' : 'bg-slate-100'} transition-colors`}>
                                                    <MapPin className={`w-4 h-4 ${expandedRegions[region.name] ? 'text-indigo-600' : 'text-slate-500'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold text-slate-800 text-sm">{region.name}</p>
                                                    <p className="text-[10px] text-slate-500">{Object.keys(region.districts).length} Districts • {region.metrics.activeCount}/{region.metrics.totalCount} Updated</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{formatCurrency(region.metrics.actualDisbursement)}</p>
                                                </div>
                                                {expandedRegions[region.name] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                            </div>
                                        </button>

                                        {/* Districts List */}
                                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedRegions[region.name] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-2">
                                                {Object.values(region.districts).map(district => (
                                                    <div key={district.name} className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                                                        {/* District Header */}
                                                        <button
                                                            onClick={() => toggleDistrict(district.name)}
                                                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {expandedDistricts[district.name] ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                                                                <p className="text-sm font-medium text-slate-700">{district.name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs font-semibold text-slate-600">{formatCurrency(district.metrics.actualDisbursement)}</span>
                                                            </div>
                                                        </button>

                                                        {/* Branches List */}
                                                        {expandedDistricts[district.name] && (
                                                            <div className="bg-slate-50 pl-8 pr-3 py-2 space-y-2 border-t border-slate-100">
                                                                {district.branches.map(branch => {
                                                                    const branchTargetDisb = getTargetValue(branch.targets, 'disbursement.sanctionPending.amount') +
                                                                        getTargetValue(branch.targets, 'disbursement.iglFig.amount') +
                                                                        getTargetValue(branch.targets, 'disbursement.il.amount');

                                                                    const branchActualDisb = (Number(branch.formData?.sanctionPendingAmtActual) || 0) +
                                                                        (Number(branch.formData?.iglFigAmtActual) || 0) +
                                                                        (Number(branch.formData?.ilAmtActual) || 0);

                                                                    const branchTargetColl = getTargetValue(branch.targets, 'collection.ftod.collection') +
                                                                        getTargetValue(branch.targets, 'collection.pnpa.collection');

                                                                    const branchActualColl = (Number(branch.formData?.ftodCollActual) || 0) +
                                                                        (Number(branch.formData?.pnpaCollActual) || 0);

                                                                    return (
                                                                        <div key={branch.id} className="bg-white p-3 rounded border border-slate-200 shadow-sm relative overflow-hidden">
                                                                            <div className={`absolute top-0 left-0 w-1 h-full ${branch.isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} />

                                                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                                                <h4 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                                                                                    <Store className="w-3 h-3 text-slate-400" />
                                                                                    {branch.name}
                                                                                </h4>
                                                                                {branch.isCompleted && (
                                                                                    <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100">Done</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2 text-[10px] pl-2">
                                                                                <div>
                                                                                    <p className="text-slate-400 mb-0.5 uppercase tracking-wide">Disbursement</p>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-semibold text-slate-700 text-xs">{formatCurrency(branchActualDisb)}</span>
                                                                                        <span className="text-slate-400">Target: {formatCurrency(branchTargetDisb)}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-slate-400 mb-0.5 uppercase tracking-wide">Collection</p>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-semibold text-slate-700 text-xs">{formatCurrency(branchActualColl)}</span>
                                                                                        <span className="text-slate-400">Target: {formatCurrency(branchTargetColl)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
