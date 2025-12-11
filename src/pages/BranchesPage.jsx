import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BranchForm from '../components/BranchForm';
import Dashboard from '../components/Dashboard';
import { ToastContainer, useToast } from '../components/Toast';
import branchesData from '../data/branches.json';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'branchPlanningData_v2'; // New key for new data structure

// Helper to merge static JSON data with saved local state (completion status, actuals)
const initializeBranches = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let savedMap = {};

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Create a map for quick lookup by ID
            parsed.forEach(b => {
                savedMap[b.id] = b;
            });
        } catch (e) {
            console.error("Failed to load saved data", e);
        }
    }

    // Merge static data with saved state
    return branchesData.flatList.map(staticBranch => {
        const savedBranch = savedMap[staticBranch.id];
        return {
            ...staticBranch,
            // Persist user-generated fields if they exist
            isCompleted: savedBranch?.isCompleted || false,
            formData: savedBranch?.formData || null, // This will be the "Actuals"
            timeSpent: savedBranch?.timeSpent || 0,
            submittedAt: savedBranch?.submittedAt || null
        };
    });
};

function BranchesPage() {
    const [branches, setBranches] = useState(initializeBranches);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [showDashboard, setShowDashboard] = useState(false);
    const { toasts, addToast, removeToast } = useToast();
    const { user } = useAuth(); // Get current user
    const location = useLocation();

    // Check for initial branch from navigation state
    useEffect(() => {
        if (location.state?.initialBranchId && branches.length > 0) {
            const branchToSelect = branches.find(b => b.id === location.state.initialBranchId);
            if (branchToSelect) {
                setSelectedBranch(branchToSelect);
                setShowDashboard(false);
                // Clear state to prevent re-selection on refresh if desired, 
                // but actually React Router clear state on refresh usually.
                // We'll leave it simple for now.
            }
        }
    }, [location.state, branches]);

    // Filter branches based on user role
    const filteredBranches = useMemo(() => {
        if (!user) return [];
        if (user.role === 'Corporate') return branches;
        return branches.filter(b => b.dmName === user.name);
    }, [branches, user]);

    // Save to localStorage whenever branches change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
    }, [branches]);

    const handleSelectBranch = (branch) => {
        // Ensure we select the branch from the current state (to get latest status)
        const currentBranch = branches.find(b => b.id === branch.id);
        setSelectedBranch(currentBranch);
        setShowDashboard(false);
    };


    const handleSubmit = (branchId, formData, timeSpent, isEdit = false) => {
        setBranches(prev => {
            const updated = prev.map(branch =>
                branch.id === branchId
                    ? {
                        ...branch,
                        isCompleted: true,
                        formData, // These will be the ACTUAL Achievement numbers
                        timeSpent,
                        submittedAt: new Date().toISOString()
                    }
                    : branch
            );

            // Find next uncompleted branch (only if not editing)
            if (!isEdit) {
                // Find index in the flat list
                const currentIndex = updated.findIndex(b => b.id === branchId);

                // Logic to find next: simply next in list, or search?
                // Given the list is sorted by Excel order, next in list makes sense.
                const nextBranch = updated.slice(currentIndex + 1).find(b => !b.isCompleted)
                    || updated.slice(0, currentIndex).find(b => !b.isCompleted);

                // Auto-select next branch
                setTimeout(() => {
                    if (nextBranch) {
                        setSelectedBranch(updated.find(b => b.id === nextBranch.id));
                    } else {
                        setSelectedBranch(null);
                    }
                }, 100);
            } else {
                // If editing, update the selected branch state
                setTimeout(() => {
                    setSelectedBranch(updated.find(b => b.id === branchId));
                }, 100);
            }

            return updated;
        });
    };

    const handleDeleteBranch = (branchId) => {
        setBranches(prev =>
            prev.map(branch =>
                branch.id === branchId
                    ? { ...branch, isCompleted: false, formData: null, timeSpent: 0, submittedAt: null }
                    : branch
            )
        );
    };

    const handleTimerUpdate = (branchId, time) => {
        setBranches(prev =>
            prev.map(branch =>
                branch.id === branchId
                    ? { ...branch, timeSpent: time }
                    : branch
            )
        );
    };

    const allCompleted = branches.every(b => b.isCompleted);

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <Sidebar
                branches={filteredBranches}
                selectedBranch={selectedBranch}
                onSelectBranch={handleSelectBranch}
                onNavigateDashboard={() => setShowDashboard(true)}
            />

            <main className="flex-1 transition-all duration-300">
                {showDashboard ? (
                    <Dashboard
                        branches={filteredBranches}
                        user={user}
                        onDeleteBranch={handleDeleteBranch}
                        onBack={() => setShowDashboard(false)}
                        showToast={addToast}
                    />
                ) : (
                    <BranchForm
                        selectedBranch={selectedBranch}
                        onSubmit={handleSubmit}
                        onTimerUpdate={handleTimerUpdate}
                        allCompleted={allCompleted}
                        showToast={addToast}
                    />
                )}
            </main>
        </div>
    );
}

export default BranchesPage;

