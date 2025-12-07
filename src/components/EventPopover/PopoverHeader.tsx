/**
 * PopoverHeader - Header with course code, room, teacher, and close button.
 */

import { X, MapPin, User, ExternalLink } from 'lucide-react';

interface PopoverHeaderProps {
    courseCode: string;
    room: string;
    teacherName?: string;
    teacherId?: string;
    onClose: () => void;
}

export function PopoverHeader({ courseCode, room, teacherName, teacherId, onClose }: PopoverHeaderProps) {
    // Room link only for Q building rooms
    const isQBuilding = room.startsWith('Q');
    const mapUrl = `https://mm.mendelu.cz/mapwidget/embed?placeName=${room}`;
    const teacherUrl = teacherId ? `https://is.mendelu.cz/auth/lide/clovek.pl?id=${teacherId}` : undefined;

    return (
        <div className="p-3 border-b border-slate-200 rounded-t-xl bg-white flex flex-col gap-2">
            {/* Top Row: Title + Close */}
            <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{courseCode}</span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors -mr-1"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Metadata Rows */}
            <div className="flex flex-col gap-0.5 -mx-1">
                {/* Room Row */}
                <button
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left w-full transition-all group ${isQBuilding
                        ? 'cursor-pointer hover:bg-slate-50 hover:text-primary'
                        : 'cursor-default'
                        }`}
                    onClick={isQBuilding ? () => window.open(mapUrl, '_blank') : undefined}
                    disabled={!isQBuilding}
                >
                    <MapPin size={14} className={`flex-shrink-0 transition-colors ${isQBuilding ? 'text-slate-400 group-hover:text-primary' : 'text-slate-300'}`} />
                    <span className={`text-xs font-medium truncate ${isQBuilding ? 'text-slate-600 group-hover:text-primary-hover' : 'text-slate-500'}`}>
                        {room}
                    </span>
                    {isQBuilding && <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />}
                </button>

                {/* Teacher Row */}
                {teacherName && (
                    teacherUrl ? (
                        <a
                            href={teacherUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 hover:text-primary transition-all w-full group"
                        >
                            <User size={14} className="flex-shrink-0 text-slate-400 group-hover:text-primary transition-colors" />
                            <span className="text-xs font-medium text-slate-600 group-hover:text-primary-hover truncate">
                                {teacherName}
                            </span>
                            <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </a>
                    ) : (
                        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md w-full cursor-default">
                            <User size={14} className="flex-shrink-0 text-slate-300" />
                            <span className="text-xs text-slate-500 truncate">{teacherName}</span>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
