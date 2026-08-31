import React, { useEffect, useRef } from 'react';
import { Store } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { getBranches, setSelectedBranch } from '../features/branches/branchSlice';

interface BranchFilterProps {
    label?: string;
}

const BranchFilter: React.FC<BranchFilterProps> = ({ label = "Филиал:" }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { branches, selectedBranch } = useSelector((state: RootState) => state.branches);

    const isAdminUser = user?.role === 'superadmin' || user?.isAdmin === true || (user?.isAdmin as any) === 'true';
    const branchList: any[] = Array.isArray(branches) ? branches : [];
    const selectRef = useRef<HTMLSelectElement>(null);

    // Load the list wherever the filter is shown, so a page reload keeps the
    // saved branch selectable instead of falling back to an empty dropdown.
    useEffect(() => {
        if (isAdminUser && branchList.length === 0) {
            dispatch(getBranches());
        }
    }, [dispatch, isAdminUser, branchList.length]);

    // Drop a saved branch that no longer exists (deleted or renamed away).
    useEffect(() => {
        if (selectedBranch && branchList.length > 0 && !branchList.some((b: any) => b._id === selectedBranch)) {
            dispatch(setSelectedBranch(''));
        }
    }, [dispatch, selectedBranch, branchList]);

    // Options arrive after the first render, and the browser does not re-apply
    // the selection on its own once they do.
    useEffect(() => {
        if (selectRef.current && selectRef.current.value !== selectedBranch) {
            selectRef.current.value = selectedBranch;
        }
    }, [branchList, selectedBranch]);

    // Only show filter for superadmins/admins
    if (!isAdminUser) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <Store size={18} />
            </div>
            <div className="flex flex-col">
                {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{label}</span>}
                <select
                    ref={selectRef}
                    value={selectedBranch}
                    onChange={(e) => dispatch(setSelectedBranch(e.target.value))}
                    className="bg-transparent text-sm font-bold text-slate-700 outline-none pr-8 cursor-pointer ring-0 focus:ring-0 border-none p-0"
                >
                    <option value="">Все филиалы</option>
                    {branchList.map((b: any) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default BranchFilter;
