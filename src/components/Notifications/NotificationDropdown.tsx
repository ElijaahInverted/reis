import { Bell, X } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { trackNotificationClick } from '../../services/spolky';
import { useTranslation } from '../../hooks/useTranslation';
import type { SpolekNotification } from '../../services/spolky';
import { StudyJamSuggestions } from '../StudyJams/StudyJamSuggestions';
import { useAppStore } from '../../store/useAppStore';
import { MENDELU_LOGO_PATH } from '../../constants/icons';

interface NotificationDropdownProps {
  notifications: SpolekNotification[];
  loading: boolean;
  onClose: () => void;
  onVisible: (id: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

export function NotificationDropdown({ notifications, loading, onClose, onVisible, dropdownRef }: NotificationDropdownProps) {
  const { t } = useTranslation();
  return (
    <div ref={dropdownRef} className="absolute right-0 top-12 z-50 w-96 bg-base-100 border border-base-300 rounded-lg shadow-xl max-h-[320px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
        <h3 className="font-semibold text-lg text-base-content">{t('notifications.title')}</h3>
        <button onClick={onClose} className="p-1 hover:bg-base-300 rounded"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <button 
          onClick={() => {
            useAppStore.getState().setIsStudyJamOpen(true);
            onClose();
          }}
          className="w-full p-4 hover:bg-base-200 transition-colors text-left flex items-center gap-3 border-b border-base-300"
        >
          <div className="flex-shrink-0">
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-black/5">
                 <img src={MENDELU_LOGO_PATH} alt="reIS" className="w-[1.6rem] h-[1.6rem] object-contain ml-0.5" />
             </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-sm text-base-content line-clamp-1 flex-1">Zvládl jsi algo levou zadní?</div>
              <div className="text-sm text-base-content flex-shrink-0 opacity-60">Dnes</div>
            </div>
          </div>
        </button>
        <StudyJamSuggestions />
        {(loading && !notifications.length) ? <div className="p-4 text-center text-base-content/60">{t('notifications.loading')}</div> :
         !notifications.length ? <div className="p-8 text-center text-base-content/60"><Bell size={48} className="mx-auto mb-2 opacity-40" /><p>{t('notifications.empty')}</p></div> :
          <div className="divide-y divide-base-300">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onVisible={() => onVisible(n.id)}
                onClick={() => {
                  if (!n.associationId?.startsWith('academic_')) trackNotificationClick(n.id);
                  if (n.link) window.open(n.link, '_blank');
                  onClose();
                }} />
            ))}
          </div>
        }
      </div>
    </div>
  );
}
