
interface TimelineGapProps {
    days: number;
    nextExamRate?: number;
}

export function TimelineGap({ days }: TimelineGapProps) {
    // Color coding based on gap size
    const getColorClass = (days: number) => {
        if (days < 2) return 'text-error';
        if (days <= 4) return 'text-warning';
        return 'text-success';
    };

    const textColor = getColorClass(days);

    return (
        <li>
            <hr className="bg-base-300" />
            <div className="timeline-middle">
                <div className="flex flex-col items-center">
                    <span className={`text-base font-medium ${textColor}`}>
                        {days}d
                    </span>
                </div>
            </div>
            <hr className="bg-base-300" />
        </li>
    );
}
