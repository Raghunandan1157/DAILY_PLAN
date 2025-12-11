import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    ChevronDown,
    ChevronRight,
    Search,
    LayoutDashboard,
    Building2,
    CheckCircle2,
    CircleDashed,
    LogOut
} from 'lucide-react';

export default function Sidebar({ branches, selectedBranch, onSelectBranch, onNavigateDashboard }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState({}); // { "RegionName": true, "Region-District": true }
    const { logout } = useAuth();

    const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

    // Group the flat `branches` list by Region -> District
    const hierarchy = useMemo(() => {
        const tree = {};
        if (!branches) return tree;

        branches.forEach(branch => {
            const region = branch.region || 'Unassigned';
            const district = branch.district || 'General';

            if (!tree[region]) tree[region] = {};
            if (!tree[region][district]) tree[region][district] = [];

            tree[region][district].push(branch);
        });

        // Filter if search is active
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            const filteredTree = {};

            Object.keys(tree).forEach(region => {
                let hasRegionMatch = region.toLowerCase().includes(lowerQ);
                const matchingDistricts = {};

                Object.keys(tree[region]).forEach(district => {
                    let hasDistrictMatch = district.toLowerCase().includes(lowerQ);
                    const matchingBranches = tree[region][district].filter(b =>
                        b.name.toLowerCase().includes(lowerQ)
                    );

                    if (hasRegionMatch || hasDistrictMatch || matchingBranches.length > 0) {
                        matchingDistricts[district] = matchingBranches.length > 0
                            ? matchingBranches
                            : (hasDistrictMatch ? tree[region][district] : []);
                    }
                });

                if (Object.keys(matchingDistricts).length > 0) {
                    filteredTree[region] = matchingDistricts;
                }
            });
            return filteredTree;
        }

        return tree;
    }, [branches, searchQuery]);

    // Auto-expand if searching
    useMemo(() => {
        if (searchQuery) {
            const newExpanded = {};
            Object.keys(hierarchy).forEach(r => {
                newExpanded[r] = true;
                Object.keys(hierarchy[r]).forEach(d => {
                    newExpanded[`${r}-${d}`] = true;
                });
            });
            setExpanded(newExpanded);
        }
    }, [hierarchy, searchQuery]);

    // Calculate completion
    const completedCount = branches?.filter(b => b.isCompleted).length || 0;
    const totalCount = branches?.length || 0;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <aside className="w-80 h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl relative overflow-hidden">

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* Header */}
            <div className="p-6 bg-slate-950/50 backdrop-blur-sm z-10 border-b border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">Branch Planner</h2>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-medium uppercase tracking-wider">
                            Corporate
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Total Progress</span>
                        <span className="text-indigo-400">{percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="p-4 bg-slate-900 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {Object.keys(hierarchy).length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-medium">No results found</p>
                        <p className="text-slate-600 text-sm mt-1">Try adjusting your search query</p>
                    </div>
                ) : (
                    Object.keys(hierarchy).sort().map(region => (
                        <div key={region} className="mb-2">
                            <button
                                onClick={() => toggle(region)}
                                className="w-full flex items-center gap-2 p-2 hover:bg-slate-800/50 rounded-lg transition-colors group text-left"
                            >
                                {expanded[region] ? (
                                    <ChevronDown className="w-4 h-4 text-indigo-400" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                                )}
                                <span className="font-semibold text-slate-300 group-hover:text-white text-sm">{region}</span>
                            </button>

                            {expanded[region] && (
                                <div className="ml-2 pl-2 border-l border-slate-800 mt-1 space-y-1">
                                    {Object.keys(hierarchy[region]).sort().map(district => (
                                        <div key={`${region}-${district}`}>
                                            <button
                                                onClick={() => toggle(`${region}-${district}`)}
                                                className="w-full flex items-center gap-2 p-2 hover:bg-slate-800/30 rounded-lg transition-colors group text-left"
                                            >
                                                {expanded[`${region}-${district}`] ? (
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                                ) : (
                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                                )}
                                                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200">{district} District</span>
                                            </button>

                                            {expanded[`${region}-${district}`] && (
                                                <div className="ml-4 space-y-0.5 mt-0.5">
                                                    {hierarchy[region][district].map(branch => (
                                                        <button
                                                            key={branch.id}
                                                            onClick={() => onSelectBranch(branch)}
                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all group ${selectedBranch?.id === branch.id
                                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                                                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                                }`}
                                                        >
                                                            <span className="truncate flex-1 text-left">{branch.name}</span>
                                                            {branch.isCompleted ? (
                                                                <CheckCircle2 className="w-4 h-4 text-green-400 ml-2 flex-shrink-0" />
                                                            ) : (
                                                                <CircleDashed className={`w-3.5 h-3.5 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-50 ${selectedBranch?.id === branch.id ? 'text-indigo-200 opacity-50' : ''}`} />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* dashboard footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950">
                <button
                    onClick={onNavigateDashboard}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] group"
                >
                    <LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>View Dashboard</span>
                </button>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors group"
                >
                    <LogOut className="w-4 h-4 group-hover:text-white transition-colors" />
                    <span>Sign Out</span>
                </button>
            </div>

        </aside>
    );
}
