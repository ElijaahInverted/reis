import type { RegisteredExam } from '../../types/exams';
import { formatShortDate, getExamUrgency } from '../../utils/timelineUtils';

interface ExamCardProps {
    exam: RegisteredExam & { successRate?: number };
    isFirst: boolean;
    isLast: boolean;
    isHighRisk: boolean; // Keep for compatibility but don't use
    onOpenFiles?: () => void;
}

export function ExamCard({ exam, isFirst, isLast, onOpenFiles }: ExamCardProps) {
    const urgency = getExamUrgency(exam.date);

    return (
                <li>
            {!isFirst && <hr className={`${urgency.bgColor}`} />}
            
            <div 
                className={`timeline-start timeline-box shadow-sm border-l-4 ${urgency.borderColor} bg-base-100 cursor-pointer hover:bg-base-200/50 transition-colors active:scale-95`}
                onClick={onOpenFiles}
            >
                <div className="flex flex-col gap-0.5 py-0.5 px-1">
                    <div className={`font-bold text-sm ${urgency.textColor} whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]`} title={exam.name}>
                        {exam.name}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] uppercase font-medium text-base-content/50">
                            {formatShortDate(exam.date)} • {exam.time}
                        </div>
                        {urgency.daysUntil <= 4 && (
                            <span className={`text-[10px] font-bold ${urgency.textColor}`}>
                                {urgency.daysUntil <= 0 ? 'DNES' : `${urgency.daysUntil}D`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="timeline-middle">
                <div className={`w-2.5 h-2.5 rounded-full ${urgency.bgColor} ${urgency.pulse ? 'animate-pulse' : ''}`} />
            </div>

            {!isLast && <hr className={`${urgency.bgColor}`} />}
        </li>
    );
}
