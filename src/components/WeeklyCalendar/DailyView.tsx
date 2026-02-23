import { useState, useRef, useMemo } from 'react';
import { CalendarEventCard } from '../CalendarEventCard';
import { SubjectFileDrawer } from '../SubjectFileDrawer';
import { HOURS, getEventStyle, organizeLessons } from './utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useHintStatus } from '../../hooks/ui/useHintStatus';
import type { BlockLesson, DateInfo } from '../../types/calendarTypes';

const TOTAL_HOURS = 13;
const SWIPE_THRESHOLD = 50;

interface DailyViewProps {
  weekDates: DateInfo[];
  lessonsByDay: BlockLesson[][];
  holidaysByDay: (string | null)[];
  todayIndex: number;
  showSkeleton: boolean;
  language: string;
}

export function DailyView({ weekDates, lessonsByDay, holidaysByDay, todayIndex, showSkeleton, language }: DailyViewProps) {
  const { t } = useTranslation();
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const defaultDay = todayIndex >= 0 && todayIndex < 5 ? todayIndex : 0;
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selected, setSelected] = useState<BlockLesson | null>(null);
  const { isSeen, markSeen } = useHintStatus('calendar_event_click');

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && selectedDay < 4) setSelectedDay(selectedDay + 1);
      if (dx > 0 && selectedDay > 0) setSelectedDay(selectedDay - 1);
    }
  };

  const lessons = lessonsByDay[selectedDay] || [];
  const holiday = holidaysByDay[selectedDay];
  const { lessons: organizedLessons } = useMemo(() => organizeLessons(lessons), [lessons]);

  const handleEventClick = (lesson: BlockLesson) => {
    setSelected(lesson);
    if (!isSeen) markSeen();
  };

  return (
    <div className="flex h-full overflow-hidden flex-col font-inter bg-base-100">
      {/* Day picker tabs */}
      <div className="flex border-b border-base-300 bg-base-100 flex-shrink-0 h-[48px]">
        {[0, 1, 2, 3, 4].map((i) => {
          const dateInfo = weekDates[i];
          const isToday = i === todayIndex;
          const isActive = i === selectedDay;
          const dayHoliday = holidaysByDay[i];
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex-1 py-1 px-1 text-center transition-colors
                ${isActive ? 'bg-primary/10 border-b-2 border-primary' : ''}
                ${isToday && !isActive ? 'bg-current-day-header' : ''}`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className={`text-lg font-semibold leading-tight ${dayHoliday ? 'text-error' : isActive ? 'text-primary' : isToday ? 'text-current-day' : 'text-base-content'}`}>
                  {dateInfo?.day}
                </div>
                <div className={`text-[11px] leading-tight ${dayHoliday ? 'text-error' : 'text-base-content/70'}`}>
                  {t(`days.${dayKeys[i]}`)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Swipeable day content */}
      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex h-full min-h-[780px]">
          {/* Time gutter */}
          <div className="w-12 flex-shrink-0 border-r border-base-300 bg-base-200 relative">
            {HOURS.map((hour, i) => (
              <div key={hour} className="absolute left-0 right-0 text-xs text-base-content/80 text-right pr-1"
                   style={{ top: `${(i / TOTAL_HOURS) * 100}%`, height: `${100 / TOTAL_HOURS}%` }}>
                {hour}
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div className="flex-1 relative">
            {/* Grid lines */}
            {HOURS.map((hour, i) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-base-300"
                   style={{ top: `${(i / TOTAL_HOURS) * 100}%` }} />
            ))}

            {holiday && (
              <div className="absolute inset-0 flex items-center justify-center bg-error/10 z-20">
                <div className="flex flex-col items-center text-center p-4">
                  <span className="text-3xl mb-2">🇨🇿</span>
                  <h3 className="text-lg font-bold text-error">{holiday}</h3>
                </div>
              </div>
            )}

            {!holiday && showSkeleton && (
              <>
                {[{ top: '7%', height: '15%' }, { top: '30%', height: '12%' }, { top: '50%', height: '11%' }].map((pos, i) => (
                  <div key={i} className="absolute w-[94%] left-[3%] rounded-lg skeleton bg-base-300" style={pos} />
                ))}
              </>
            )}

            {!holiday && !showSkeleton && organizedLessons.map((lesson) => {
              const style = getEventStyle(lesson.startTime, lesson.endTime);
              const cols = lesson.maxColumns || 1;
              return (
                <div
                  key={lesson.id}
                  className="absolute"
                  style={{
                    ...style,
                    left: `${(lesson.row / cols) * 100}%`,
                    width: `${100 / cols}%`,
                  }}
                >
                  <CalendarEventCard lesson={lesson} onClick={() => handleEventClick(lesson)} language={language} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SubjectFileDrawer lesson={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
