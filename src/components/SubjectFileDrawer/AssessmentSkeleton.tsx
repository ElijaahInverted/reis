/**
 * Assessment List Loading Skeleton
 * 
 * Matches the visual structure of AssessmentTab items.
 */

export function AssessmentSkeleton() {
    return (
        <div className="flex flex-col h-full bg-base-100">
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-base-200">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                            {/* Test Name Stub */}
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="skeleton h-5 w-1/2 rounded bg-base-300"></div>
                                <div className="skeleton h-3 w-1/3 rounded bg-base-300"></div>
                            </div>

                            {/* Score Stub */}
                            <div className="text-right flex-shrink-0 min-w-[80px]">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="skeleton h-5 w-12 rounded bg-base-300"></div>
                                </div>
                            </div>

                            {/* Success Rate Stub */}
                            <div className="flex-shrink-0 min-w-[50px] text-right">
                                <div className="skeleton h-5 w-10 rounded-full bg-base-300 ml-auto"></div>
                            </div>

                            {/* Link Stub */}
                            <div className="flex-shrink-0 w-8 text-right">
                                <div className="skeleton w-6 h-6 rounded bg-base-300 ml-auto"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
