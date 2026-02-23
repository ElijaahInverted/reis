import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { SearchBar } from './SearchBar/index';
import { MobileSearchOverlay } from './SearchBar/MobileSearchOverlay';
import { useTranslation } from '../hooks/useTranslation';
import { NotificationFeed } from './NotificationFeed';

interface AppHeaderProps {
  currentView: string;
  dateRangeLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onOpenSubject?: (courseCode: string, courseName?: string, courseId?: string) => void;
}

export function AppHeader({
  currentView,
  dateRangeLabel,
  onPrevWeek,
  onNextWeek,
  onToday,
  onOpenSubject,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      <div className="flex-shrink-0 z-30 bg-base-200/90 backdrop-blur-md border-b border-base-300 px-4 py-2">
        <div className="flex items-center justify-between gap-2 md:gap-4 w-full">
          {currentView === 'calendar' && (
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className="flex items-center bg-base-300 rounded-lg p-1">
                <button
                  onClick={onPrevWeek}
                  className="p-1 hover:bg-base-100 rounded-md shadow-sm transition-all text-base-content/70 hover:text-primary"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={onNextWeek}
                  className="p-1 hover:bg-base-100 rounded-md shadow-sm transition-all text-base-content/70 hover:text-primary"
                  aria-label="Next week"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <button onClick={onToday} className="btn btn-primary btn-sm border-none shadow-sm">
                {t('common.today')}
              </button>
              <span className="hidden md:inline text-lg font-semibold text-base-content whitespace-nowrap">{dateRangeLabel}</span>
              <span className="md:hidden text-sm font-semibold text-base-content whitespace-nowrap">{dateRangeLabel}</span>
            </div>
          )}

          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <NotificationFeed />

            {/* Mobile: search icon button */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-2 hover:bg-base-300 rounded-lg"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Desktop: inline search bar */}
            <div className="hidden md:block w-full max-w-[480px] min-w-[200px]">
              <SearchBar onOpenSubject={onOpenSubject} />
            </div>
          </div>
        </div>
      </div>

      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        onOpenSubject={onOpenSubject}
      />
    </>
  );
}
