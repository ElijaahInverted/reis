/**
 * ExamPanel Header Component
 */

import { X } from 'lucide-react';

interface ExamPanelHeaderProps {
    onClose: () => void;
}

export function ExamPanelHeader({ onClose }: ExamPanelHeaderProps) {
    return (
        <div className="flex items-center justify-end px-4 py-2 border-b border-base-200 bg-base-100">
            <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                <X size={18} />
            </button>
        </div>
    );
}

/**
 * Auto-booking Banner Component
 */
interface AutoBookingBannerProps {
    isActive: boolean;
    onCancel: () => void;
}

export function AutoBookingBanner({ isActive, onCancel }: AutoBookingBannerProps) {
    if (!isActive) return null;

    return (
        <div className="flex items-center gap-3 px-6 py-2 bg-warning/10 border-b border-warning/20">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-sm text-warning font-medium">
                Auto-rezervace aktivní. Nezavírejte tuto stránku!
            </span>
            <button
                onClick={onCancel}
                className="btn btn-ghost btn-xs ml-auto"
            >
                Zrušit
            </button>
        </div>
    );
}
