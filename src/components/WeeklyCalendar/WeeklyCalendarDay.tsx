import { useMemo, useState, useEffect, useRef } from 'react';
import { CalendarEventCard } from '../CalendarEventCard';
import { organizeLessons, getEventStyle, DAYS } from './utils';
import type { BlockLesson } from '../../types/calendarTypes';
import { useAppStore } from '../../store/useAppStore';

interface WeeklyCalendarDayProps {
    dayIndex: number;
    lessons: BlockLesson[];
    holiday: string | null;
    isToday: boolean;
    showSkeleton: boolean;
    onEventClick: (lesson: BlockLesson) => void;
    language: string; // Current UI language
}

export function WeeklyCalendarDay({
    dayIndex, lessons, holiday, isToday, showSkeleton, onEventClick, language
}: WeeklyCalendarDayProps) {
    const { lessons: organizedLessons } = useMemo(() => organizeLessons(lessons), [lessons]);
    const isSelectingTime = useAppStore(s => s.isSelectingTime);
    const pendingTimeSelection = useAppStore(s => s.pendingTimeSelection);
    const setPendingTimeSelection = useAppStore(s => s.setPendingTimeSelection);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragStartMins, setDragStartMins] = useState<number | null>(null);
    const [dragCurrentMins, setDragCurrentMins] = useState<number | null>(null);

    const getMinutesFromY = (clientY: number) => {
        if (!containerRef.current) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        // Clamp Y to the container boundaries
        const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
        const percentage = y / rect.height;
        
        const totalMinutes = 13 * 60; // 7:00 to 20:00
        const rawMinutes = percentage * totalMinutes;
        
        // Snap to nearest 15 mins
        return Math.round(rawMinutes / 15) * 15;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0 || !isSelectingTime || holiday || showSkeleton) return;
        
        // Use composed paths to check if we clicked on an event card when not intended
        // But for time selection, we allow dragging over events like GCal does.
        e.preventDefault();
        
        // Clear globally stored selection when starting a new drag
        setPendingTimeSelection(null);
        
        const mins = getMinutesFromY(e.clientY);
        setDragStartMins(mins);
        setDragCurrentMins(mins);
    };

    useEffect(() => {
        if (dragStartMins === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            setDragCurrentMins(getMinutesFromY(e.clientY));
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            if (dragCurrentMins !== null) {
                const start = Math.min(dragStartMins, dragCurrentMins);
                let end = Math.max(dragStartMins, dragCurrentMins);
                
                // Ensure a minimum of 15 min block if clicked without dragging
                if (start === end) end += 60; // default 1h if just click
                
                const formatTime = (totalMins: number) => {
                    const h = 7 + Math.floor(totalMins / 60);
                    const m = totalMins % 60;
                    return `${h}:${m.toString().padStart(2, '0')}`;
                };
                
                const dayName = DAYS[dayIndex]?.short || '';
                const timeString = `${dayName} ${formatTime(start)} - ${formatTime(end)}`;
                
                // Store pending selection globally instead of dispatching immediately
                setPendingTimeSelection({
                    dayIndex,
                    startMins: start,
                    endMins: end,
                    formattedTime: timeString
                });
            }
            setDragStartMins(null);
            setDragCurrentMins(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragStartMins, dragCurrentMins, dayIndex, isSelectingTime, setPendingTimeSelection]);

    // Calculate ghost box styles based on active drag OR completed pending selection
    let selectionStyle = {};
    let isActiveSelection = false;
    let renderStart = 0;
    let renderEnd = 0;

    if (dragStartMins !== null && dragCurrentMins !== null) {
        isActiveSelection = true;
        renderStart = Math.min(dragStartMins, dragCurrentMins);
        renderEnd = Math.max(dragStartMins, dragCurrentMins);
        if (renderStart === renderEnd) renderEnd += 15; // Visual minimum during drag
    } else if (pendingTimeSelection && pendingTimeSelection.dayIndex === dayIndex) {
        isActiveSelection = true;
        renderStart = pendingTimeSelection.startMins;
        renderEnd = pendingTimeSelection.endMins;
    }

    if (isActiveSelection) {
        const totalMinutes = 13 * 60;
        const topPercent = (renderStart / totalMinutes) * 100;
        const heightPercent = ((renderEnd - renderStart) / totalMinutes) * 100;
        
        selectionStyle = {
            top: `${topPercent}%`,
            height: `${heightPercent}%`,
        };
    }

    return (
        <div 
            ref={containerRef}
            className={`flex-1 relative ${isToday ? 'bg-current-day' : ''} ${isSelectingTime ? 'cursor-crosshair' : ''}`}
            onMouseDown={handleMouseDown}
        >
            {/* The drag ghost block */}
            {isActiveSelection && (
                <div 
                    className="absolute left-1 right-1 bg-primary/20 border-2 border-primary z-30 rounded-md pointer-events-none shadow-sm backdrop-blur-[1px]"
                    style={selectionStyle}
                >
                    <div className="text-[10px] sm:text-xs font-bold text-primary p-1 bg-white/60 dark:bg-black/40 rounded-t-sm w-max backdrop-blur-md">
                        {(() => {
                            const f = (m: number) => `${7 + Math.floor(m / 60)}:${(m % 60).toString().padStart(2, '0')}`;
                            return `${f(renderStart)} - ${f(renderEnd)}`;
                        })()}
                    </div>
                </div>
            )}

            {holiday && (
                <div className="absolute inset-0 flex items-center justify-center bg-error/10 z-20">
                    <div className="flex flex-col items-center text-center p-4">
                        <span className="text-3xl mb-2">🇨🇿</span>
                        <h3 className="text-lg font-bold text-error">{holiday}</h3>
                        <span className="text-sm text-error/80 font-medium uppercase tracking-wider mt-1">Státní svátek</span>
                    </div>
                </div>
            )}

            {!holiday && showSkeleton && (
                <>
                    {[
                        { top: '7%', height: '15%' }, { top: '30%', height: '12%' }, { top: '50%', height: '11%' }
                    ].map((pos, i) => (
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
                            // Ensure events don't block dragging
                            pointerEvents: isSelectingTime ? 'none' : 'auto'
                        }}
                    >
                        <CalendarEventCard lesson={lesson} onClick={() => {
                            if (!isSelectingTime) onEventClick(lesson);
                        }} language={language} />
                    </div>
                );
            })}
        </div>
    );
}
