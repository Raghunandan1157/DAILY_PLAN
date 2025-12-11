import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import branchesData from '../data/branches.json';

const STORAGE_KEY = 'branchPlanningData_v2';

// Helper to safely get nested numbers
const get = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj) || 0;

export function useExecutiveData() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const dashboardData = useMemo(() => {
        try {
            // Load Saved Actuals
            const saved = localStorage.getItem(STORAGE_KEY);
            let savedMap = {};
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    parsed.forEach(b => savedMap[b.id] = b.formData || {});
                } catch (e) {
                    console.error("Data parse error", e);
                    // Don't throw here, just proceed with empty map
                }
            }

            // Filter Branches
            if (!branchesData || !branchesData.flatList) {
                console.warn("Branches data missing or malformed", branchesData);
                throw new Error("Branches data not available");
            }

            const all = Array.isArray(branchesData.flatList) ? branchesData.flatList.flat() : [];

            // Safe user check
            const myBranches = (user?.role === 'Corporate')
                ? all
                : all.filter(b => b.dmName?.trim().toLowerCase() === user?.name?.trim().toLowerCase());

            // Aggregate Totals
            let totalTargetDisb = 0;
            let totalActualDisb = 0;
            let totalTargetColl = 0;
            let totalActualColl = 0;
            let branchesCompleted = 0;

            myBranches.forEach(branch => {
                const actuals = savedMap[branch.id] || {};
                const isCompleted = !!savedMap[branch.id];

                if (isCompleted) branchesCompleted++;

                // Disbursement
                const t_igl = get(branch.targets, 'disbursement.iglFig.amount');
                const t_il = get(branch.targets, 'disbursement.il.amount');
                totalTargetDisb += (t_igl + t_il);

                const a_igl = Number(actuals.iglFigAmtActual || 0);
                const a_il = Number(actuals.ilAmtActual || 0);
                totalActualDisb += (a_igl + a_il);

                // Collection
                const t_ftod = get(branch.targets, 'collection.ftod.collection');
                const a_ftod = Number(actuals.ftodCollActual || 0);
                totalTargetColl += t_ftod;
                totalActualColl += a_ftod;
            });

            // Calculations
            const disbPercent = totalTargetDisb > 0 ? (totalActualDisb / totalTargetDisb) * 100 : 0;
            const collPercent = totalTargetColl > 0 ? (totalActualColl / totalTargetColl) * 100 : 0;
            const healthScore = (disbPercent + collPercent) / 2;

            return {
                totalTargetDisb,
                totalActualDisb,
                disbPercent,
                totalTargetColl,
                totalActualColl,
                collPercent,
                branchesTotal: myBranches.length,
                branchesCompleted,
                healthScore
            };
        } catch (err) {
            console.error("Aggregation Error", err);
            setError(err);
            return null;
        }
    }, [user, refreshTrigger]);

    useEffect(() => {
        // Simulate a small network delay for "loading" feel or async initialization
        const timer = setTimeout(() => {
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [refreshTrigger]);

    const refresh = () => {
        setLoading(true);
        setError(null);
        setRefreshTrigger(prev => prev + 1);
    };

    return {
        data: dashboardData,
        loading,
        error,
        refresh
    };
}
