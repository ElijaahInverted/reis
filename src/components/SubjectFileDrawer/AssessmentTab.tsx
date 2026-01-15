
import { useEffect, useState, useMemo } from 'react';
import { ExternalLink, Trophy } from 'lucide-react';
import { getAssessmentsForSubject } from '../../utils/apiUtils';
import type { Assessment } from '../../types/documents';

interface AssessmentTabProps {
    courseCode: string;
}

export function AssessmentTab({ courseCode }: AssessmentTabProps) {
    const [assessments, setAssessments] = useState<Assessment[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const data = getAssessmentsForSubject(courseCode);
        setAssessments(data);
        setLoading(false);
    }, [courseCode]);

    // Derived state for sorted assessments
    const sortedAssessments = useMemo(() => {
        if (!assessments) return [];

        // Sort by date descending (newest first)
        // Date format is "DD. MM. YYYY HH:mm"
        return [...assessments].sort((a, b) => {
            const parseDate = (d: string) => {
                const parts = d.split(/[. :]/).filter(Boolean);
                if (parts.length < 5) return 0;
                // new Date(year, monthIndex, day, hour, minute)
                return new Date(
                    parseInt(parts[2]), 
                    parseInt(parts[1]) - 1, 
                    parseInt(parts[0]), 
                    parseInt(parts[3]), 
                    parseInt(parts[4])
                ).getTime();
            };
            return parseDate(b.submittedDate) - parseDate(a.submittedDate);
        });
    }, [assessments]);

    if (loading) return <div className="p-6 text-center text-base-content/50">Načítám...</div>;

    if (!assessments || assessments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-base-content/40">
                <Trophy className="w-12 h-12 opacity-20 mb-3" />
                <p className="text-sm">Zatím žádné hodnocení</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-base-100">
            {/* Assessment List */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-base-200">
                    {sortedAssessments.map((test, i) => (
                        <div 
                            key={i} 
                            className="px-4 py-3 hover:bg-base-200/30 transition-colors flex items-center gap-3"
                        >
                            {/* Test Name - Main column */}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-base-content truncate" title={test.name}>
                                    {test.name}
                                </div>
                                <div className="text-sm text-base-content/50 mt-0.5">
                                    {test.submittedDate}
                                    {test.teacher && <span className="ml-2">• {test.teacher}</span>}
                                </div>
                            </div>

                            {/* Score - Neutral Colors */}
                            <div className="text-right flex-shrink-0 min-w-[80px]">
                                <div className="font-mono font-semibold text-base-content">
                                    {test.score.toFixed(2).replace('.', ',')}
                                    <span className="text-base-content/40 text-sm font-normal"> / {test.maxScore}</span>
                                </div>
                            </div>

                            {/* Success Rate - Neutral Badge */}
                            <div className="flex-shrink-0 min-w-[50px] text-right">
                                <span className="badge badge-sm badge-ghost opacity-70">
                                    {Math.round(test.successRate)}%
                                </span>
                            </div>

                            {/* Link - Highlighted in Green (Primary) */}
                            <div className="flex-shrink-0 w-8 text-right">
                                {test.detailUrl ? (
                                    <a 
                                        href={`https://is.mendelu.cz/auth/student/list.pl${test.detailUrl}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary-focus transition-colors p-1 rounded hover:bg-primary/10 inline-block"
                                        title="Otevřít v IS"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                ) : (
                                    <span className="text-base-content/10 p-1 inline-block">
                                        <ExternalLink size={16} />
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
