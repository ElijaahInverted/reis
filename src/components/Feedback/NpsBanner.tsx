import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../hooks/useTranslation';

const RATINGS = [1, 2, 3, 4, 5] as const;

export function NpsBanner() {
    const { feedbackEligible, feedbackDismissed, submitNps, dismissFeedback } = useAppStore();
    const { t } = useTranslation();

    if (!feedbackEligible || feedbackDismissed) return null;

    return (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2.5 mx-4 mt-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-primary">{t('feedback.npsQuestion')}</span>
            <div className="flex items-center gap-1">
                {RATINGS.map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        className="btn btn-xs btn-ghost text-base-content/70 hover:text-primary hover:bg-primary/10"
                        onClick={() => { submitNps(rating); toast.success(t('feedback.npsThank')); }}
                    >
                        {rating}
                    </button>
                ))}
                <button
                    type="button"
                    className="btn btn-xs btn-ghost opacity-50 hover:opacity-100 ml-1"
                    onClick={dismissFeedback}
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
