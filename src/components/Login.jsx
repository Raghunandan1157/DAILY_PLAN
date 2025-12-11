import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import branchesData from '../data/branches.json';
import { Building2, UserCircle2, ChevronRight, LayoutDashboard, Lock } from 'lucide-react';

function Login() {
    const [selectedRole, setSelectedRole] = useState('DM'); // 'DM' or 'Corporate'
    const [selectedDM, setSelectedDM] = useState('');
    const [searchName, setSearchName] = useState(''); // New search state
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Extract unique DM names from the flat list
    const dms = useMemo(() => {
        const uniqueDMs = [...new Set(branchesData.flatList.map(b => b.dmName))].filter(Boolean).sort();
        return uniqueDMs;
    }, []);

    // Filtered DMs based on search
    const filteredDMs = useMemo(() => {
        if (!searchName) return dms;
        return dms.filter(name => name.toLowerCase().includes(searchName.toLowerCase()));
    }, [dms, searchName]);

    const from = location.state?.from?.pathname || '/executive';

    const handleLogin = (e) => {
        e.preventDefault();

        if (selectedRole === 'Corporate') {
            login({ name: 'Corporate Admin', role: 'Corporate' });
            navigate(from, { replace: true });
        } else if (selectedDM) {
            login({ name: selectedDM, role: 'DM' });
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans selection:bg-indigo-500/30">

            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] opacity-40"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] opacity-40"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-6">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-6 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-400">Sign in to access your branch dashboard</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

                    {/* Role Switcher */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/50 rounded-xl mb-6 border border-white/5">
                        <button
                            onClick={() => setSelectedRole('DM')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${selectedRole === 'DM'
                                ? 'bg-slate-700 text-white shadow-sm ring-1 ring-white/10'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                        >
                            <UserCircle2 className="w-4 h-4" />
                            District Manager
                        </button>
                        <button
                            onClick={() => setSelectedRole('Corporate')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${selectedRole === 'Corporate'
                                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/10'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Corporate View
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {selectedRole === 'DM' && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Select District Manager</label>

                                {/* Search Input */}
                                <input
                                    type="text"
                                    placeholder="Search Name..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    className="w-full mb-2 bg-slate-800/50 border border-slate-700 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-slate-500 text-sm"
                                />

                                <div className="relative group">
                                    <select
                                        value={selectedDM}
                                        onChange={(e) => setSelectedDM(e.target.value)}
                                        required
                                        className="w-full appearance-none bg-slate-800/50 border border-slate-700 text-white py-3.5 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all hover:bg-slate-800 cursor-pointer"
                                    >
                                        <option value="" disabled>Choose your name...</option>
                                        {filteredDMs.map(dm => (
                                            <option key={dm} value={dm}>{dm}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-slate-400 transition-colors">
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedRole === 'Corporate' && (
                            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm flex gap-3 items-start">
                                <Lock className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-400" />
                                <p>You are accessing the <strong>Global Corporate Dashboard</strong>. This view provides full visibility across all regions and branches.</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={selectedRole === 'DM' && !selectedDM}
                            className={`w-full py-4 px-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group ${selectedRole === 'DM' && !selectedDM
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25 active:scale-[0.98]'
                                }`}
                        >
                            <span>{selectedRole === 'Corporate' ? 'View Overall Dashboard' : 'Login to Dashboard'}</span>
                            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${(!selectedRole === 'DM' || selectedDM) ? 'group-hover:translate-x-1' : ''}`} />
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <p className="text-xs text-slate-500">© 2025 Corporate Planning Module • Secure Access</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
