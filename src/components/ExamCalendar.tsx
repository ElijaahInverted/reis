import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ExamSubject } from './ExamDrawer';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    getWeek,
    isToday
} from 'date-fns';
import { cs } from 'date-fns/locale';

interface ExamCalendarProps {
    exams: ExamSubject[];
    onDateClick?: (date: Date) => void;
    highlightedDates?: Date[];
    viewDate?: Date | null;
    hoveredDate?: Date | null;
    fullDates?: Date[];
}

export function ExamCalendar({ exams, onDateClick, highlightedDates, viewDate, hoveredDate, fullDates }: ExamCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Sync view with external viewDate prop (e.g. from hover)
    useEffect(() => {
        if (viewDate) {
            setCurrentDate(viewDate);
        }
    }, [viewDate]);

    // Auto-navigate to the first highlighted date when they change
    useEffect(() => {
        if (highlightedDates && highlightedDates.length > 0) {
            setCurrentDate(highlightedDates[0]);
        }
    }, [highlightedDates]);

    // Auto-navigate to the first highlighted date when they change
    useEffect(() => {
        if (highlightedDates && highlightedDates.length > 0) {
            setCurrentDate(highlightedDates[0]);
        }
    }, [highlightedDates]);

    // Extract registered exam dates
    const examDates = useMemo(() => {
        const dates: Date[] = [];
        exams.forEach(subject => {
            subject.sections.forEach(section => {
                if (section.status === 'registered' && section.registeredTerm?.date) {
                    const [day, month, year] = section.registeredTerm.date.split('.').map(Number);
                    dates.push(new Date(year, month - 1, day));
                }
            });
        });
        return dates;
    }, [exams]);

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const weeks = useMemo(() => {
        const weeksArray = [];
        for (let i = 0; i < days.length; i += 7) {
            weeksArray.push(days.slice(i, i + 7));
        }
        return weeksArray;
    }, [days]);

    const weekNumbers = useMemo(() => {
        return weeks.map(week => getWeek(week[0], { weekStartsOn: 1 }));
    }, [weeks]);

    const daysOfWeek = ['po', 'út', 'st', 'čt', 'pá', 'so', 'ne'];

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <div className="inline-flex bg-white rounded-lg shadow-lg overflow-hidden font-sans select-none">
            {/* Week Numbers Sidebar */}
            <div className="flex flex-col bg-[#F0F4F9] border-r border-gray-100">
                {/* Empty space for header alignment */}
                <div className="h-[56px]"></div>
                {/* Empty space for days of week row */}
                <div className="h-[24px] mb-1"></div>
                {/* Week numbers aligned with calendar rows */}
                <div className="flex flex-col gap-0">
                    {weekNumbers.map((weekNum, index) => (
                        <div
                            key={index}
                            className="w-[32px] h-[32px] flex items-center justify-center text-[10px] text-[#5F6368] font-medium"
                        >
                            {weekNum}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Calendar Area */}
            <div className="flex flex-col bg-white p-4">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3 pl-1">
                    <h2 className="text-[16px] font-normal text-[#1F1F1F] capitalize">
                        {format(currentDate, 'LLLL yyyy', { locale: cs })}
                    </h2>
                    <div className="flex gap-0">
                        <button
                            onClick={prevMonth}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-[#444746]"
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-[#444746]"
                            aria-label="Next month"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Days of Week Row */}
                <div className="grid grid-cols-7 gap-0 mb-1">
                    {daysOfWeek.map((day, index) => (
                        <div
                            key={index}
                            className="w-[32px] h-[24px] flex items-center justify-center text-[11px] font-medium text-[#5F6368] uppercase"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Date Grid */}
                <div className="flex flex-col gap-0">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 gap-0">
                            {week.map((day) => {
                                const isExamDay = examDates.some(examDate => isSameDay(examDate, day));
                                const isHighlightedDate = highlightedDates?.some(d => isSameDay(d, day));
                                const isFullDate = fullDates?.some(d => isSameDay(d, day));
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isTodayDate = isToday(day);
                                const isHovered = hoveredDate && isSameDay(day, hoveredDate);

                                return (
                                    <div
                                        key={day.toString()}
                                        onMouseDown={(e) => e.preventDefault()} // Prevent focus loss/dropdown close
                                        onClick={() => !isFullDate && onDateClick?.(day)}
                                        className={`w-[32px] h-[32px] flex items-center justify-center relative group ${isFullDate ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className={`
                                            w-[20px] h-[20px] flex items-center justify-center rounded-full transition-all
                                            ${isCurrentMonth ? 'text-[#1F1F1F]' : 'text-[#9AA0A6]'}
                                            ${isTodayDate
                                                ? 'bg-[#0b57d0] text-white font-bold hover:bg-[#0b57d0]'
                                                : isHighlightedDate
                                                    ? 'bg-[#79be15] text-white font-bold hover:bg-[#79be15]'
                                                    : isFullDate
                                                        ? 'bg-gray-200 text-gray-400 font-medium' // Full date style
                                                        : 'group-hover:bg-gray-100'
                                            }
                                            ${(isExamDay || isHighlightedDate) && !isTodayDate ? 'font-bold' : ''}
                                            text-[12px] font-medium
                                            ${isHovered ? 'ring-2 ring-[#0b57d0] z-10' : ''}
                                            ${isHighlightedDate && !isHovered ? 'group-hover:ring-2 group-hover:ring-[#0b57d0]' : ''}
                                        `}>
                                            {format(day, 'd')}
                                        </div>
                                        {isExamDay && !isTodayDate && (
                                            <div className="absolute bottom-[3px] w-[18px] h-[2px] bg-[#ea4335] rounded-[1px]"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
