import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../hooks/useTranslation';

const RATINGS = [1, 2, 3, 4, 5] as const;

export function NpsBanner() {
    const { feedbackEligible, feedbackDismissed, submitNps, dismissFeedback } = useAppStore();
    const { t } = useTranslation();

    if (!feedbackEligible || feedbackDismissed) return null;

    return (
        <div className="alert alert-info shadow-sm mx-4 mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{t('feedback.npsQuestion')}</span>
            <div className="flex items-center gap-1">
                {RATINGS.map((rating) => (
                    <button
                        key={rating}
                        type="button"
                        className="btn btn-sm btn-ghost btn-circle text-lg"
                        onClick={() => { submitNps(rating); toast.success(t('feedback.npsThank')); }}
                    >
                        {rating}
                    </button>
                ))}
                <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-circle ml-2"
                    onClick={dismissFeedback}
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
