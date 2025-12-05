import { useState, useEffect, useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useSchedule, useExams } from '../hooks/data';
import { timeToMinutes } from '../utils/calendarUtils';
import { parseDate } from '../utils/dateHelpers';
import { SectionHeader } from './atoms';
import type { BlockLesson } from '../types/calendarTypes';

export function DashboardWidgets() {
    // Use data from storage (stale-while-revalidate)
    const { schedule } = useSchedule();
    const { exams: examSubjects } = useExams();

    const [currentClass, setCurrentClass] = useState<BlockLesson | null>(null);
    const [nextClass, setNextClass] = useState<BlockLesson | null>(null);
    const [minutesUntil, setMinutesUntil] = useState<number | null>(null);

    // Process schedule data to find current/next class
    useEffect(() => {
        if (!schedule || schedule.length === 0) return;

        const now = new Date();
        const currentDayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Sort by date and time
        const sortedSchedule = [...schedule].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });

        let foundCurrent: BlockLesson | null = null;
        let foundNext: BlockLesson | null = null;

        for (const lesson of sortedSchedule) {
            const start = timeToMinutes(lesson.startTime);
            const end = timeToMinutes(lesson.endTime);

            if (lesson.date === currentDayStr) {
                if (currentMinutes >= start && currentMinutes <= end) {
                    foundCurrent = lesson;
                    break;
                }
                if (start > currentMinutes && !foundNext) {
                    foundNext = lesson;
                    break;
                }
            } else if (lesson.date > currentDayStr && !foundNext) {
                foundNext = lesson;
                break;
            }
        }

        setCurrentClass(foundCurrent);
        setNextClass(foundNext);

        if (foundNext && foundNext.date === currentDayStr) {
            const start = timeToMinutes(foundNext.startTime);
            setMinutesUntil(start - currentMinutes);
        } else {
            setMinutesUntil(null);
        }
    }, [schedule]);

    // Process exam data to get upcoming exams
    const upcomingExams = useMemo(() => {
        if (!examSubjects || examSubjects.length === 0) return [];

        const now = new Date();
        const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const exams: any[] = [];

        examSubjects.forEach(subject => {
            subject.sections.forEach(section => {
                if (section.status === 'registered' && section.registeredTerm) {
                    const cleanSubjectName = subject.name.replace(/ZS\s+\d{4}\/\d{4}\s+-\s+\w+(\s+-\s+)?/, '').trim();
                    const cleanSectionName = section.name.charAt(0).toUpperCase() + section.name.slice(1);

                    exams.push({
                        title: cleanSubjectName ? `${cleanSubjectName} - ${cleanSectionName}` : cleanSectionName,
                        start: parseDate(section.registeredTerm.date, section.registeredTerm.time),
                        location: section.registeredTerm.room || 'Unknown'
                    });
                }
            });
        });

        return exams
            .filter(exam => exam.start >= now && exam.start <= twoWeeksFromNow)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [examSubjects]);

    const getDayName = (dateStr: string) => {
        // dateStr is YYYYMMDD
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        const date = new Date(year, month, day);
        const dayIndex = date.getDay();
        // DAY_NAMES is {0: "Ne", 1: "Po", ...}
        // We want full names or at least consistent with DAY_NAMES
        const days = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
        return days[dayIndex];
    };

    const formatCountdown = (minutes: number) => {
        if (minutes <= 60) return `${minutes} min`;
        if (minutes <= 120) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return `${h}h ${m}min`;
        }
        return `${Math.floor(minutes / 60)}h`;
    };

    // Show nothing until we have some data to display

    // Determine what to display in the first widget
    const displayClass = currentClass || nextClass;
    const isCurrent = !!currentClass;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Next/Current Class Widget */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">

                <div>
                    <SectionHeader>
                        {isCurrent ? 'Teďka jsi na:' : 'Následující hodina'}
                    </SectionHeader>
                    {displayClass ? (
                        <>
                            <div className="text-2xl font-bold text-gray-900 line-clamp-1" title={displayClass.courseName}>
                                {displayClass.courseName}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-gray-600">
                                <span className={`font-medium px-2 py-0.5 rounded text-sm ${isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                                    {isCurrent ? 'Právě probíhá' : (
                                        minutesUntil !== null ? `Začíná za ${formatCountdown(minutesUntil)}` : `${getDayName(displayClass.date)} • ${displayClass.startTime}`
                                    )}
                                </span>
                                <span className="text-sm text-gray-400">•</span>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    <MapPin size={14} />
                                    {displayClass.roomStructured.name}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-xl font-medium text-gray-400 mt-2">
                            Žádná další výuka tento týden 🎉
                        </div>
                    )}
                </div>

                {displayClass && (
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">
                            {displayClass.teachers[0]?.shortName}
                        </span>
                        {/* Could add a "Show details" button here later */}
                    </div>
                )}
            </div>

            {/* Exam Radar Widget */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">

                <div>
                    <SectionHeader>Exam Radar (14 dní)</SectionHeader>
                    {upcomingExams.length > 0 ? (
                        <>
                            <div className="mt-4 space-y-3">
                                {upcomingExams.slice(0, 2).map((exam: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 bg-red-50/50 p-2 rounded-lg border border-red-100">
                                        <div className="bg-white p-1.5 rounded shadow-sm text-center min-w-[40px]">
                                            <div className="text-[10px] font-bold text-red-500 uppercase">
                                                {new Date(exam.start).toLocaleDateString('cs-CZ', { weekday: 'short' })}
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 leading-none">
                                                {new Date(exam.start).getDate()}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 truncate">{exam.title}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(exam.start).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                                                <span className="mx-1">•</span>
                                                <MapPin size={10} />
                                                {exam.location}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {upcomingExams.length > 2 && (
                                    <div className="text-xs text-center text-gray-400 font-medium">
                                        + {upcomingExams.length - 2} další
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-start mt-2">
                            <div className="text-xl font-medium text-gray-900">Čistý štít!</div>
                            <div className="text-sm text-gray-500 mt-1">Žádné zkoušky v dohledu.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
