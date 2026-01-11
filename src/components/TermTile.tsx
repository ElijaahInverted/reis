/**
 * TermTile - Individual exam term selection tile.
 * 
 * Shows date, time, room, capacity with single-click registration.
 * For future-opening terms, shows countdown until registration opens.
 * Uses DaisyUI components per @daisy-enforcer.
 */

import { Clock, MapPin, Users, Timer, CircleCheck, RotateCcw } from 'lucide-react';
import type { ExamTerm } from '../types/exams';
import { getDayOfWeek, formatCountdown } from '../utils/termHelpers';
import { useTermStatus } from '../hooks/ui/useTermStatus';

interface TermTileProps {
    term: ExamTerm;
    onSelect: () => void;
    isProcessing?: boolean;
}

export function TermTile({ term, onSelect, isProcessing = false }: TermTileProps) {
    const {
        capacity,
        isFull,
        isFutureOpening,
        isRegistrationClosed,
        isBlocked,
        msUntilOpen
    } = useTermStatus(term);

    const isDisabled = isFull || isProcessing || isFutureOpening || isRegistrationClosed || isBlocked;

    return (
        <button
            onClick={() => !isDisabled && onSelect()}
            disabled={isDisabled}
            className={`
                flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left
                ${isFutureOpening
                    ? 'bg-warning/5 border-warning/30 cursor-not-allowed'
                    : (isFull || isRegistrationClosed || isBlocked)
                        ? 'bg-base-200 border-base-300 opacity-60 cursor-not-allowed'
                        : 'bg-base-100 border-base-300 hover:border-primary hover:shadow-sm cursor-pointer'
                }
            `}
        >
            {/* Date & Time */}
            <div className="flex flex-col min-w-[80px]">
                <span className={`font-semibold ${isDisabled ? 'text-base-content/50 line-through' : 'text-base-content'}`}>
                    {term.date.split('.').slice(0, 2).join('.')}
                </span>
                <span className="text-xs text-base-content/60">
                    {getDayOfWeek(term.date)}
                </span>
            </div>

            {/* Attempt Type Badge */}
            <AttemptBadge type={term.attemptType} />

            {/* Time */}
            <div className="flex items-center gap-1 min-w-[60px]">
                <Clock size={12} className="text-base-content/40" />
                <span className={`text-sm ${isDisabled ? 'text-base-content/50' : 'text-base-content/70'}`}>
                    {term.time}
                </span>
            </div>

            {/* Room & Future Opening Info */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {term.room && (
                    <>
                        <MapPin size={12} className="text-base-content/40 shrink-0" />
                        <span className={`text-sm truncate ${isDisabled ? 'text-base-content/50' : 'text-base-content/70'}`}>
                            {term.room}
                        </span>
                    </>
                )}
                
                {isFutureOpening && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-warning/80 truncate">
                        {term.room && <span className="text-base-content/20 ml-1">|</span>}
                        <Timer size={12} className="text-warning/60" />
                        <span>Otevírá se za {formatCountdown(msUntilOpen)} ({term.registrationStart})</span>
                    </div>
                )}
            </div>

            {/* Registration Status / Capacity */}
            <TermStatusDisplay 
                term={term}
                isFutureOpening={isFutureOpening}
                isRegistrationClosed={isRegistrationClosed}
                isBlocked={isBlocked}
                isFull={isFull}
                capacity={capacity}
            />

            {/* Action Indicator */}
            <div className="shrink-0 ml-auto">
                {isProcessing ? (
                    <span className="loading loading-spinner loading-sm text-primary"></span>
                ) : isFutureOpening ? (
                    <span className="text-warning text-sm font-medium">⏳</span>
                ) : (isFull || isRegistrationClosed || isBlocked) ? (
                    <span className="text-error/60 text-sm font-medium">✕</span>
                ) : (
                    <span className="btn btn-primary btn-sm">Přihlásit se</span>
                )}
            </div>
        </button>
    );
}

function AttemptBadge({ type }: { type?: ExamTerm['attemptType'] }) {
    if (!type) return null;
    return (
        <div className="flex items-center" title={
            type === 'regular' ? 'Řádný termín' :
                type === 'retake1' ? 'Opravný termín 1' :
                    type === 'retake2' ? 'Opravný termín 2' : 'Opravný termín 3'
        }>
            {type === 'regular' ? (
                <CircleCheck size={14} className="text-success" />
            ) : (
                <div className="flex items-center gap-0.5">
                    <RotateCcw size={12} className="text-warning" />
                    <span className="text-[10px] font-bold text-warning">
                        {type === 'retake1' ? '1' : type === 'retake2' ? '2' : '3'}
                    </span>
                </div>
            )}
        </div>
    );
}

interface StatusDisplayProps {
    term: ExamTerm;
    isFutureOpening: boolean;
    isRegistrationClosed: boolean;
    isBlocked: boolean;
    isFull: boolean;
    capacity: { occupied: number; total: number; percent: number } | null;
}

function TermStatusDisplay({ 
    term, isFutureOpening, isRegistrationClosed, isBlocked, isFull, capacity 
}: StatusDisplayProps) {
    if (isFutureOpening) {
        return null;
    }

    if (term.canRegisterNow !== true && term.registrationStart) {
        return (
            <div className="flex items-center gap-2 min-w-[140px] bg-info/10 px-2 py-1 rounded-md">
                <Clock size={14} className="text-info" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-info/70">Přihlášení od</span>
                    <span className="text-xs font-medium text-info">{term.registrationStart}</span>
                </div>
            </div>
        );
    }

    if (!capacity) return null;

    return (
        <div className="flex items-center gap-2 min-w-[90px]">
            <Users size={12} className="text-base-content/40" />
            <div className="flex items-center gap-1.5">
                <progress 
                    className={`progress w-12 h-1.5 ${(isFull || isRegistrationClosed || isBlocked) ? 'progress-error' : 'progress-primary'}`}
                    value={capacity.percent}
                    max="100"
                />
                <span className={`text-xs ${(isFull || isRegistrationClosed || isBlocked) ? 'text-error font-medium' : 'text-base-content/50'}`}>
                    {isFull ? 'PLNÝ' : (isRegistrationClosed || isBlocked) ? 'UZAVŘENO' : `${capacity.occupied}/${capacity.total}`}
                </span>
            </div>
        </div>
    );
}
