import { useState, useMemo, useRef, useEffect } from 'react';
import { EventPopover } from './EventPopover';
import { timeToMinutes } from '../utils/calendarUtils';
import { useSchedule, useExams } from '../hooks/data';
import type { BlockLesson, LessonWithRow, OrganizedLessons, DateInfo } from '../types/calendarTypes';
import { getCzechHoliday } from '../utils/holidays';
import { parseDate } from '../utils/dateHelpers';

const DAYS = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ'];
const ROW_HEIGHT = 125; // px - comfortable height

interface SchoolCalendarProps {
    initialDate?: Date;
    onEmptyWeek?: (direction: 'next' | 'prev') => void; // Callback when week is empty
}

export function SchoolCalendar({ initialDate = new Date(), onEmptyWeek }: SchoolCalendarProps) {
    // Get stored semester data from hooks (stale-while-revalidate)
    const { schedule: storedSchedule } = useSchedule();
    const { exams: storedExams } = useExams();

    const [selected, setSelected] = useState<BlockLesson | null>(null);
    const anchorRef = useRef<HTMLDivElement | null>(null);

    // Calculate the week range for display
    const weekDates = useMemo((): DateInfo[] => {
        const startOfWeek = new Date(initialDate);
        const day = startOfWeek.getDay() || 7;
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const dates: DateInfo[] = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push({
                weekday: DAYS[i],
                day: String(d.getDate()),
                month: String(d.getMonth() + 1),
                year: String(d.getFullYear()),
                full: d.toLocaleDateString('cs-CZ')
            });
        }
        return dates;
    }, [initialDate]);

    // Get the date strings for this week (YYYYMMDD format)
    const weekDateStrings = useMemo(() => {
        return weekDates.map(d =>
            `${d.year}${d.month.padStart(2, '0')}${d.day.padStart(2, '0')}`
        );
    }, [weekDates]);

    // Process exams into BlockLesson format
    const examLessons = useMemo((): BlockLesson[] => {
        if (!storedExams || storedExams.length === 0) return [];

        const allExams: any[] = [];
        storedExams.forEach(subject => {
            subject.sections.forEach((section: any) => {
                if (section.status === 'registered' && section.registeredTerm) {
                    allExams.push({
                        id: section.id,
                        title: `${subject.name} - ${section.name}`,
                        start: parseDate(section.registeredTerm.date, section.registeredTerm.time),
                        location: section.registeredTerm.room || 'Unknown',
                        meta: { teacher: section.registeredTerm.teacher || 'Unknown' }
                    });
                }
            });
        });

        return allExams.map(exam => {
            const dateObj = new Date(exam.start);
            const dateStr = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}`;
            const startTime = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
            const endObj = new Date(dateObj.getTime() + 90 * 60000);
            const endTime = `${String(endObj.getHours()).padStart(2, '0')}:${String(endObj.getMinutes()).padStart(2, '0')}`;

            return {
                id: `exam-${exam.id}-${exam.start}`,
                date: dateStr,
                startTime,
                endTime,
                courseCode: exam.id,
                courseName: exam.title,
                room: exam.location,
                roomStructured: { name: exam.location, id: '' },
                teachers: [{ fullName: exam.meta.teacher, shortName: exam.meta.teacher, id: '' }],
                isExam: true,
                examEvent: exam,
                isConsultation: 'false',
                studyId: '',
                facultyCode: '',
                isDefaultCampus: 'true',
                courseId: '',
                campus: '',
                isSeminar: 'false',
                periodId: ''
            } as BlockLesson;
        });
    }, [storedExams]);

    // Filter stored semester data for this week + add exams
    const scheduleData = useMemo((): BlockLesson[] => {
        let lessons: BlockLesson[] = [];

        // Filter stored schedule for this week's dates
        if (storedSchedule && storedSchedule.length > 0) {
            lessons = storedSchedule.filter(lesson =>
                weekDateStrings.includes(lesson.date)
            );
        }

        // Add exams that fall on this week
        const weekExams = examLessons.filter(exam =>
            weekDateStrings.includes(exam.date)
        );

        return [...lessons, ...weekExams];
    }, [storedSchedule, examLessons, weekDateStrings]);

    // Helper to organize lessons into rows to prevent overlap
    const organizeLessons = (lessons: BlockLesson[]): OrganizedLessons => {
        if (!lessons || lessons.length === 0) return { lessons: [], totalRows: 1 };

        const sortedLessons = [...lessons].sort((a, b) =>
            timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );

        const rows: number[] = [];
        const lessonsWithRows: LessonWithRow[] = [];

        sortedLessons.forEach(lesson => {
            const start = timeToMinutes(lesson.startTime);
            const end = timeToMinutes(lesson.endTime);
            let placed = false;

            for (let i = 0; i < rows.length; i++) {
                if (rows[i] <= start) {
                    rows[i] = end;
                    lessonsWithRows.push({ ...lesson, row: i });
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                rows.push(end);
                lessonsWithRows.push({ ...lesson, row: rows.length - 1 });
            }
        });

        return { lessons: lessonsWithRows, totalRows: rows.length };
    };

    // Check if this week has events - used for auto-skip
    const hasEventsThisWeek = useMemo(() => {
        return scheduleData.length > 0;
    }, [scheduleData]);

    // Dynamic time range - only show hours with events (+1 hour padding)
    const { startHour, endHour } = useMemo(() => {
        if (scheduleData.length === 0) return { startHour: 8, endHour: 17 };
        let min = 23, max = 0;
        scheduleData.forEach(lesson => {
            const start = parseInt(lesson.startTime.split(':')[0]);
            const end = parseInt(lesson.endTime.split(':')[0]) + 1; // +1 to include end hour
            min = Math.min(min, start);
            max = Math.max(max, end);
        });
        return {
            startHour: Math.max(7, min - 1), // 1 hour padding before
            endHour: Math.min(21, max + 1)   // 1 hour padding after
        };
    }, [scheduleData]);

    // Auto-skip empty weeks (e.g., Christmas break)
    useEffect(() => {
        // Only trigger if we have schedule data loaded but no events this week
        if (storedSchedule && storedSchedule.length > 0 && !hasEventsThisWeek && onEmptyWeek) {
            // Small delay to prevent rapid-fire skipping
            const timer = setTimeout(() => {
                onEmptyWeek('next');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [hasEventsThisWeek, onEmptyWeek, storedSchedule]);

    return (
        <div className="w-full h-full flex flex-col font-dm relative">
            {/* Header - Times */}
            <div className="flex border-b border-gray-200 bg-gray-50/50">
                <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50"></div> {/* Corner */}
                <div className="flex-1 flex relative">
                    {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                        const hour = startHour + i;
                        return (
                            <div key={hour} className="flex-1 py-1.5 text-center border-r border-gray-100 last:border-r-0">
                                <span className="text-xs font-medium text-gray-500">{hour}:00</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Calendar Body */}
            <div className="flex-1 overflow-y-auto relative">

                {weekDates.map((dateInfo, dayIndex) => {
                    // Filter lessons for this day
                    const dayLessons = scheduleData.filter(l => {
                        // Assuming l.date is YYYYMMDD
                        const year = l.date.substring(0, 4);
                        const month = l.date.substring(4, 6);
                        const day = l.date.substring(6, 8);
                        return parseInt(year) === parseInt(dateInfo.year) &&
                            parseInt(day) === parseInt(dateInfo.day) &&
                            parseInt(month) === parseInt(dateInfo.month);
                    });

                    // Hide empty days
                    if (dayLessons.length === 0) return null;

                    const { lessons, totalRows } = organizeLessons(dayLessons);
                    const rowHeight = Math.max(ROW_HEIGHT, totalRows * 60); // Dynamic height if many overlaps

                    const isToday = (() => {
                        const today = new Date();
                        return parseInt(dateInfo.day) === today.getDate() &&
                            parseInt(dateInfo.month) === (today.getMonth() + 1) &&
                            today.getFullYear() === new Date().getFullYear();
                    })();

                    // Check for holiday
                    // Construct Date object from dateInfo (assuming current year for now, or better use the actual date from weekDates generation logic if available, but here we reconstruct)
                    const currentYear = new Date().getFullYear(); // Or better, use the year from the week start
                    const checkDate = new Date(currentYear, parseInt(dateInfo.month) - 1, parseInt(dateInfo.day));
                    const holidayName = getCzechHoliday(checkDate);

                    return (
                        <div key={dayIndex} className={`flex border-b last:border-b-0 overflow-hidden min-h-[70px] relative z-10 transition-all ${isToday ? 'bg-primary/5 ring-1 ring-inset ring-primary' : 'bg-white'}`}>
                            {/* Date Column */}
                            <div className={`w-20 flex-shrink-0 border-r flex flex-col items-center justify-center p-2 ${isToday ? 'bg-primary/10 border-primary/30' : 'bg-gray-50 border-gray-200'}`}>
                                <span className={`text-xs font-bold uppercase ${holidayName ? 'text-error' : isToday ? 'text-primary' : 'text-gray-400'}`}>{dateInfo.weekday}</span>
                                <span className={`text-xl font-bold ${holidayName ? 'text-error' : isToday ? 'text-primary' : 'text-gray-800'}`}>{dateInfo.day}/{dateInfo.month}</span>
                            </div>

                            {/* Events Column */}
                            <div className="flex-1 relative bg-transparent" style={{ height: `${rowHeight}px` }}>
                                {holidayName ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-error/10 p-4">
                                        <div className="flex flex-col items-center text-center">
                                            <span className="text-3xl mb-2">🇨🇿</span>
                                            <h3 className="text-lg font-bold text-error">{holidayName}</h3>
                                            <span className="text-sm text-error/80 font-medium uppercase tracking-wider mt-1">Státní svátek</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Row Grid */}
                                        <div className="absolute inset-0 flex pointer-events-none z-0">
                                            {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                                                <div key={i} className="flex-1 border-r border-gray-100 h-full last:border-r-0"></div>
                                            ))}
                                        </div>
                                        {lessons.map((lesson) => {
                                            const startMinutes = timeToMinutes(lesson.startTime);
                                            const endMinutes = timeToMinutes(lesson.endTime);
                                            const dayStartMinutes = startHour * 60;
                                            const dayEndMinutes = endHour * 60;
                                            const totalDayMinutes = dayEndMinutes - dayStartMinutes;

                                            // Calculate position percentages
                                            const leftPercent = ((startMinutes - dayStartMinutes) / totalDayMinutes) * 100;
                                            const widthPercent = ((endMinutes - startMinutes) / totalDayMinutes) * 100;

                                            // Vertical position for overlaps
                                            const topPercent = (lesson.row / totalRows) * 100;
                                            const heightPercent = (1 / totalRows) * 100;

                                            // Determine if the event is very short to adjust layout
                                            const durationMinutes = endMinutes - startMinutes;
                                            const isVeryShort = durationMinutes <= 45;

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    className={`absolute ${lesson.isExam
                                                        ? "bg-[#FEF2F2] border border-gray-200 shadow-sm hover:shadow-md"
                                                        : lesson.isSeminar == "true"
                                                            ? "bg-[#F0F7FF] border border-gray-200 shadow-sm hover:shadow-md"
                                                            : "bg-[#F3FAEA] border border-gray-200 shadow-sm hover:shadow-md"
                                                        } text-left font-dm rounded-lg cursor-pointer transition-all overflow-hidden group`}
                                                    style={{
                                                        left: `${leftPercent}%`,
                                                        width: `${widthPercent}%`,
                                                        top: `${topPercent}%`,
                                                        height: `${heightPercent}%`,
                                                        zIndex: 10 + lesson.row
                                                    }}
                                                    onClick={(e) => {
                                                        anchorRef.current = e.currentTarget as HTMLDivElement;
                                                        setSelected(lesson);
                                                    }}
                                                    title={`${lesson.courseName}\n${lesson.startTime} - ${lesson.endTime}\n${lesson.room}\n${lesson.teachers[0]?.shortName}`}
                                                >
                                                    {/* Colored Strip for Lessons & Exams */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${lesson.isExam ? "bg-[#dc2626]" :
                                                        lesson.isSeminar == "true" ? "bg-[#00548f]" : "bg-[#79be15]"
                                                        }`}></div>

                                                    <div className="flex flex-col h-full justify-between p-2 pl-3">
                                                        <div>
                                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                                <span className={`text-base font-extrabold whitespace-nowrap ${lesson.isExam ? "text-[#991b1b]" : "text-gray-900"}`}>
                                                                    {lesson.courseCode}
                                                                </span>
                                                                <span className="badge badge-sm badge-ghost whitespace-nowrap text-xs font-semibold">
                                                                    {lesson.roomStructured.name}
                                                                </span>
                                                            </div>

                                                            {!isVeryShort && (
                                                                <div className={`text-sm font-medium leading-tight line-clamp-2 ${lesson.isExam ? "text-[#991b1b]" : lesson.isSeminar == "true" ? "text-[#1e3a8a]" : "text-[#365314]"}`}>
                                                                    {lesson.courseName}
                                                                </div>
                                                            )}

                                                            {lesson.isExam && (
                                                                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#991b1b] uppercase tracking-wide">
                                                                    <span>⚠️ {lesson.courseName.toLowerCase().includes('test') ? 'TEST' : 'ZKOUŠKA'}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={`text-xs font-medium ${lesson.isExam ? "text-[#991b1b]/80" : "text-gray-500"}`}>
                                                            {lesson.startTime} - {lesson.endTime}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}


            </div>

            <EventPopover
                lesson={selected}
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                anchorRef={anchorRef}
            />
        </div >
    );
}

