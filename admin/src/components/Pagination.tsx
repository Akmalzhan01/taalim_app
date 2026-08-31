import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    pages: number;
    total: number;
    limit: number;
    onChange: (page: number) => void;
    itemLabel?: string;
    compact?: boolean;
}

// Page numbers around the current one, with gaps collapsed to an ellipsis:
// 1 … 4 5 6 … 39
const buildPages = (page: number, pages: number): (number | 'gap')[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

    const around = [page - 1, page, page + 1].filter(p => p > 1 && p < pages);
    const shown = [1, ...around, pages];

    const result: (number | 'gap')[] = [];
    shown.forEach((p, i) => {
        if (i > 0 && p - (shown[i - 1] as number) > 1) result.push('gap');
        result.push(p);
    });
    return result;
};

const Pagination: React.FC<PaginationProps> = ({ page, pages, total, limit, onChange, itemLabel = 'записей', compact = false }) => {
    if (total === 0) return null;

    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    const buttonBase = 'flex items-center justify-center rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed';
    const size = compact ? 'h-8 min-w-8 px-2' : 'h-9 min-w-9 px-3';

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 ${compact ? 'px-3 py-2' : 'px-6 py-4'} border-t border-slate-100 bg-white`}>
            <p className="text-xs font-medium text-slate-500">
                {from}–{to} из <span className="font-bold text-slate-700">{total}</span> {itemLabel}
            </p>

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onChange(page - 1)}
                    disabled={page <= 1}
                    className={`${buttonBase} ${size} bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300`}
                    aria-label="Предыдущая страница"
                >
                    <ChevronLeft size={16} />
                </button>

                {buildPages(page, pages).map((entry, i) => (
                    entry === 'gap' ? (
                        <span key={`gap-${i}`} className="px-1 text-slate-400 select-none">…</span>
                    ) : (
                        <button
                            key={entry}
                            type="button"
                            onClick={() => onChange(entry)}
                            className={`${buttonBase} ${size} ${entry === page
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                            aria-current={entry === page ? 'page' : undefined}
                        >
                            {entry}
                        </button>
                    )
                ))}

                <button
                    type="button"
                    onClick={() => onChange(page + 1)}
                    disabled={page >= pages}
                    className={`${buttonBase} ${size} bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300`}
                    aria-label="Следующая страница"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
