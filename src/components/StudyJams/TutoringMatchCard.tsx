import { useState } from 'react';
import { CheckSquare, Square, ExternalLink, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function TutoringMatchCard() {
    const match = useAppStore(s => s.studyJamMatch);
    const dismissStudyJamMatch = useAppStore(s => s.dismissStudyJamMatch);
    const setIsStudyJamOpen = useAppStore(s => s.setIsStudyJamOpen);

    const [checklist, setChecklist] = useState([false, false]);

    if (!match) return null;

    const isTutee = match.myRole === 'tutee';
    const teamsUrl = 'https://teams.microsoft.com';

    // Data is prefetched in the slice; fall back to raw ID while still loading
    const displayName = match.resolvedName ?? match.otherPartyStudentId;
    const teamsHandle = match.teamsHandle;

    const checklistItems = isTutee
        ? ['Napsal/a jsem tutorovi na Teams', 'Potvrdili jsme čas schůzky']
        : ['Odpověděl/a jsem tuteovi na Teams', 'Potvrdili jsme čas schůzky'];

    const toggle = (i: number) => setChecklist(prev => prev.map((v, idx) => idx === i ? !v : v));

    return (
        <div className="bg-success/10 border border-success/30 rounded-lg px-3 py-2.5 mb-2">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-success mb-0.5">
                        {isTutee ? 'Tutor nalezen' : 'Tutee přiřazen'} — {match.courseName}
                    </p>
                    <p className="text-sm font-medium truncate">
                        {displayName}
                        {teamsHandle && (
                            <span className="font-normal text-base-content/50"> • {teamsHandle}</span>
                        )}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <a
                            href={teamsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-xs btn-success gap-1"
                        >
                            <ExternalLink size={11} />
                            Napsat na Teams
                        </a>
                    </div>
                    <div className="mt-2 space-y-1">
                        {checklistItems.map((label, i) => (
                            <button
                                key={i}
                                onClick={() => toggle(i)}
                                className="flex items-center gap-1.5 text-xs text-base-content/70 hover:text-base-content w-full text-left"
                            >
                                {checklist[i]
                                    ? <CheckSquare size={13} className="text-success shrink-0" />
                                    : <Square size={13} className="shrink-0" />}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={dismissStudyJamMatch} className="opacity-50 hover:opacity-100 shrink-0 mt-0.5">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
