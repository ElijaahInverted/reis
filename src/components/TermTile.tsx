/**
 * TermTile - Individual exam term selection tile.
 * 
 * Shows date, time, room, capacity with single-click registration.
 * Uses DaisyUI components per @daisy-enforcer.
 */

import { ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import type { ExamTerm } from '../types/exams';

interface TermTileProps {
    term: ExamTerm;
    onSelect: () => void;
    isProcessing?: boolean;
}

/**
 * Parse capacity string to get occupied/total numbers.
 */
function parseCapacity(capacity?: string): { occupied: number; total: number; percent: number } | null {
    if (!capacity) return null;
    const [occupied, total] = capacity.split('/').map(Number);
    if (isNaN(occupied) || isNaN(total) || total === 0) return null;
    return { occupied, total, percent: Math.min(100, (occupied / total) * 100) };
}

/**
 * Get day of week from DD.MM.YYYY string.
 */
function getDayOfWeek(dateStr: string): string {
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    return ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'][date.getDay()];
}

export function TermTile({ term, onSelect, isProcessing = false }: TermTileProps) {
    const capacity = parseCapacity(term.capacity);
    const isFull = term.full || (capacity && capacity.occupied >= capacity.total);
    
    console.debug('[TermTile] Rendering term:', {
        id: term.id,
        date: term.date,
        time: term.time,
        capacity: term.capacity,
        full: term.full,
        room: term.room
    });

    return (
        <button
            onClick={() => {
                if (!isFull && !isProcessing) {
                    console.debug('[TermTile] Selected term:', term.id);
                    onSelect();
                }
            }}
            disabled={isFull || isProcessing}
            className={`
                flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left
                ${isFull 
                    ? 'bg-base-200 border-base-300 opacity-60 cursor-not-allowed' 
                    : 'bg-base-100 border-base-300 hover:border-primary hover:shadow-sm cursor-pointer'
                }
            `}
        >
            {/* Date & Time */}
            <div className="flex flex-col min-w-[80px]">
                <span className={`font-semibold ${isFull ? 'text-base-content/50 line-through' : 'text-base-content'}`}>
                    {term.date.split('.').slice(0, 2).join('.')}
                </span>
                <span className="text-xs text-base-content/60">
                    {getDayOfWeek(term.date)}
                </span>
            </div>
            
            {/* Time */}
            <div className="flex items-center gap-1 min-w-[60px]">
                <Clock size={12} className="text-base-content/40" />
                <span className={`text-sm ${isFull ? 'text-base-content/50' : 'text-base-content/70'}`}>
                    {term.time}
                </span>
            </div>
            
            {/* Room */}
            {term.room && (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    <MapPin size={12} className="text-base-content/40 shrink-0" />
                    <span className={`text-sm truncate ${isFull ? 'text-base-content/50' : 'text-base-content/70'}`}>
                        {term.room}
                    </span>
                </div>
            )}
            
            {/* Capacity */}
            {capacity && (
                <div className="flex items-center gap-2 min-w-[90px]">
                    <Users size={12} className="text-base-content/40" />
                    <div className="flex items-center gap-1.5">
                        <progress
                            className={`progress w-12 h-1.5 ${
                                isFull ? 'progress-error' : 'progress-primary'
                            }`}
                            value={capacity.percent}
                            max="100"
                        />
                        <span className={`text-xs ${isFull ? 'text-error font-medium' : 'text-base-content/50'}`}>
                            {isFull ? 'PLNÝ' : `${capacity.occupied}/${capacity.total}`}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Action indicator */}
            <div className="shrink-0 ml-auto">
                {isProcessing ? (
                    <span className="loading loading-spinner loading-xs text-primary"></span>
                ) : isFull ? (
                    <span className="text-base-content/30 text-lg">✕</span>
                ) : (
                    <ChevronRight size={16} className="text-primary" />
                )}
            </div>
        </button>
    );
}
