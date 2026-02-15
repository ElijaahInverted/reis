import { useTranslation } from '../../../hooks/useTranslation';

interface BalanceSectionProps {
  onTopUp?: () => void;
}

export function BalanceSection({ onTopUp }: BalanceSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 mt-2 -mx-0.5">
      <span className="text-xs font-semibold opacity-50 shrink-0">ISIC</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTopUp?.();
        }}
        className="btn btn-primary btn-sm h-8 min-h-0 px-4 rounded-xl font-bold border-none transition-all active:scale-95 shadow-md text-xs"
      >
        {t('settings.topUp')}
      </button>
    </div>
  );
}
