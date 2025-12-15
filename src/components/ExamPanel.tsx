/**
 * ExamPanel - Full-size exam registration panel.
 * 
 * Replaces ExamDrawer with a calendar-sized view:
 * - ExamTimeline header showing registered exams with gaps
 * - Status tabs for filtering (Přihlášen | Volné | Otevírá se)
 * - Subject chip filters
 * - Enhanced table rows with capacity progress bars
 * 
 * Uses DaisyUI components per @daisy-enforcer requirements.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, Calendar, Clock, MapPin } from 'lucide-react';
import { useExams } from '../hooks/data';
import { fetchExamData, registerExam, unregisterExam } from '../api/exams';
import { ExamTimeline } from './ExamTimeline';
import { TermTile } from './TermTile';
import { StorageService } from '../services/storage';
import type { ExamSubject, ExamSection, ExamFilterState, ExamTerm } from '../types/exams';

interface ExamPanelProps {
    onClose: () => void;
}

const FILTER_STORAGE_KEY = 'exam_panel_filters';

/**
 * Get day of week abbreviation from date string.
 */
function getDayOfWeek(dateString: string): string {
    const [day, month, year] = dateString.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return days[date.getDay()];
}

/**
 * Parse capacity string (e.g., "18/20") to percentage.
 */
function capacityToPercent(capacity?: string): number {
    if (!capacity) return 0;
    const [occupied, total] = capacity.split('/').map(Number);
    if (isNaN(occupied) || isNaN(total) || total === 0) return 0;
    return Math.min(100, (occupied / total) * 100);
}

export function ExamPanel({ onClose }: ExamPanelProps) {
    // Get stored exam data from hook
    const { exams: storedExams, isLoaded } = useExams();
    
    // Local state for exams (allows updates after registration)
    const [exams, setExams] = useState<ExamSubject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Sync stored exams to local state
    useEffect(() => {
        console.debug('[ExamPanel] Data sync effect. storedExams:', storedExams?.length, 'isLoaded:', isLoaded);
        if (storedExams && storedExams.length > 0) {
            console.debug('[ExamPanel] Loading exams from storage:', storedExams.length, 'subjects');
            storedExams.forEach(s => {
                console.debug('[ExamPanel]   Subject:', s.code, 'sections:', s.sections.map(sec => ({
                    name: sec.name,
                    status: sec.status,
                    hasRegisteredTerm: !!sec.registeredTerm,
                    terms: sec.terms.length
                })));
            });
            setExams(storedExams);
            setIsLoading(false);
        } else if (isLoaded) {
            console.debug('[ExamPanel] Storage loaded but no exams found');
            setIsLoading(false);
        }
    }, [storedExams, isLoaded]);
    
    // Filter state with localStorage persistence
    const [statusFilter, setStatusFilter] = useState<'registered' | 'available' | 'opening'>(() => {
        const stored = StorageService.get<ExamFilterState>(FILTER_STORAGE_KEY);
        return stored?.statusFilter ?? 'available';
    });
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
        const stored = StorageService.get<ExamFilterState>(FILTER_STORAGE_KEY);
        return stored?.selectedSubjects ?? [];
    });
    
    // Persist filter state
    useEffect(() => {
        StorageService.set(FILTER_STORAGE_KEY, { statusFilter, selectedSubjects });
    }, [statusFilter, selectedSubjects]);
    
    // Expandable section state (replaces popup)
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
    
    const [processingSectionId, setProcessingSectionId] = useState<string | null>(null);
    
    // Confirmation modal state
    const [pendingRegistration, setPendingRegistration] = useState<{
        section: ExamSection;
        term: ExamTerm;
    } | null>(null);
    const confirmModalRef = useRef<HTMLDialogElement>(null);
    
    // Auto-booking state
    const [autoBookingTermId, setAutoBookingTermId] = useState<string | null>(null);
    
    // Escape key handler
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (expandedSectionId) {
                    setExpandedSectionId(null);
                } else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose, expandedSectionId]);
    
    // Get unique subject codes for chip filters
    const subjectCodes = useMemo(() => 
        [...new Set(exams.map(e => e.code))].sort(),
    [exams]);
    
    // Filter exams based on current filters
    const filteredSections = useMemo(() => {
        console.debug('[ExamPanel] Filtering exams. statusFilter:', statusFilter, 'selectedSubjects:', selectedSubjects);
        console.debug('[ExamPanel] Total subjects:', exams.length);
        
        const results: Array<{ subject: ExamSubject; section: ExamSection }> = [];
        
        exams.forEach(subject => {
            // Subject filter
            if (selectedSubjects.length > 0 && !selectedSubjects.includes(subject.code)) {
                console.debug('[ExamPanel] Skipping subject (not in filter):', subject.code);
                return;
            }
            
            subject.sections.forEach(section => {
                console.debug('[ExamPanel] Processing section:', {
                    subject: subject.code,
                    section: section.name,
                    status: section.status,
                    hasRegisteredTerm: !!section.registeredTerm,
                    termsCount: section.terms.length
                });
                
                // Check if any term has future registration start
                const hasFutureOpening = section.terms.some(term => {
                    if (!term.registrationStart) return false;
                    try {
                        const [datePart, timePart] = term.registrationStart.split(' ');
                        const [day, month, year] = datePart.split('.').map(Number);
                        const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
                        const regStart = new Date(year, month - 1, day, hours, minutes);
                        return regStart > new Date();
                    } catch {
                        return false;
                    }
                });
                
                // Status filter logic
                if (statusFilter === 'registered') {
                    // Only show sections where user is already registered
                    if (section.status !== 'registered') {
                        console.debug('[ExamPanel] Filtered out (not registered):', section.name);
                        return;
                    }
                } else if (statusFilter === 'available') {
                    // Show non-registered sections with terms that are open NOW (not future)
                    if (section.status === 'registered') {
                        console.debug('[ExamPanel] Filtered out (already registered):', section.name);
                        return;
                    }
                    // Only show if has terms that can be registered now
                    const hasAvailableTerms = section.terms.some(term => {
                        if (!term.registrationStart) return true; // No start date = available
                        try {
                            const [datePart, timePart] = term.registrationStart.split(' ');
                            const [day, month, year] = datePart.split('.').map(Number);
                            const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
                            const regStart = new Date(year, month - 1, day, hours, minutes);
                            return regStart <= new Date(); // Already open
                        } catch {
                            return true;
                        }
                    });
                    if (!hasAvailableTerms) {
                        console.debug('[ExamPanel] Filtered out (no available terms now):', section.name);
                        return;
                    }
                } else if (statusFilter === 'opening') {
                    // Only show sections with terms that open in the FUTURE
                    if (section.status === 'registered') {
                        console.debug('[ExamPanel] Filtered out (already registered):', section.name);
                        return;
                    }
                    if (!hasFutureOpening) {
                        console.debug('[ExamPanel] Filtered out (no future opening):', section.name);
                        return;
                    }
                }
                
                console.debug('[ExamPanel] ✓ Section passed filter:', section.name);
                results.push({ subject, section });
            });
        });
        
        console.debug('[ExamPanel] Filter result:', results.length, 'sections');
        return results;
    }, [exams, statusFilter, selectedSubjects]);
    
    // Registration handler
    const handleRegister = async (section: ExamSection, termId: string) => {
        setProcessingSectionId(section.id);
        
        try {
            // If already registered, unregister first
            if (section.status === 'registered' && section.registeredTerm?.id) {
                const successUnreg = await unregisterExam(section.registeredTerm.id);
                if (!successUnreg) {
                    alert("Nepodařilo se odhlásit z předchozího termínu.");
                    setProcessingSectionId(null);
                    return;
                }
            }
            
            // Register for new term
            const successReg = await registerExam(termId);
            if (successReg) {
                console.debug('[ExamPanel] Registration successful, refreshing data');
                const data = await fetchExamData();
                setExams(data);
                setExpandedSectionId(null); // Collapse after registration
            } else {
                alert("Registrace selhala. Termín může být plný.");
            }
        } catch (err) {
            console.error(err);
            alert("Nastala chyba.");
        } finally {
            setProcessingSectionId(null);
        }
    };
    
    const toggleExpand = (sectionId: string) => {
        console.debug('[ExamPanel] Toggle expand:', sectionId);
        setExpandedSectionId(prev => prev === sectionId ? null : sectionId);
    };
    
    const toggleSubjectFilter = (code: string) => {
        setSelectedSubjects(prev => 
            prev.includes(code) 
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };
    
    const clearAllFilters = () => {
        setSelectedSubjects([]);
    };

    return (
        <>
            <div className="flex flex-col h-full bg-base-100 rounded-lg border border-base-300 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-100">
                    <h2 className="text-xl font-semibold text-base-content">Zápisy na zkoušky</h2>
                    <div className="flex items-center gap-2">
                        <a
                            href="https://is.mendelu.cz/auth/student/terminy_seznam.pl?lang=cz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm gap-1"
                        >
                            <ExternalLink size={14} />
                            IS MENDELU
                        </a>
                        <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                            <X size={18} />
                        </button>
                    </div>
                </div>
                
                {/* Auto-booking Banner */}
                {autoBookingTermId && (
                    <div className="flex items-center gap-3 px-6 py-2 bg-warning/10 border-b border-warning/20">
                        <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                        <span className="text-sm text-warning font-medium">
                            Auto-rezervace aktivní. Nezavírejte tuto stránku!
                        </span>
                        <button
                            onClick={() => setAutoBookingTermId(null)}
                            className="btn btn-ghost btn-xs ml-auto"
                        >
                            Zrušit
                        </button>
                    </div>
                )}
                
                {/* Timeline Header */}
                <div className="px-6 py-3 border-b border-base-200">
                    <ExamTimeline exams={exams} />
                </div>
                
                {/* Filter Bar */}
                <div className="px-6 py-3 border-b border-base-200 space-y-3">
                    {/* Status Tabs */}
                    <div className="tabs tabs-boxed bg-base-200 p-1">
                        <button
                            className={`tab ${statusFilter === 'registered' ? 'tab-active' : ''}`}
                            onClick={() => setStatusFilter('registered')}
                        >
                            ✓ Přihlášen
                        </button>
                        <button
                            className={`tab ${statusFilter === 'available' ? 'tab-active' : ''}`}
                            onClick={() => setStatusFilter('available')}
                        >
                            📅 Volné
                        </button>
                        <button
                            className={`tab ${statusFilter === 'opening' ? 'tab-active' : ''}`}
                            onClick={() => setStatusFilter('opening')}
                        >
                            ⏳ Otevírá se
                        </button>
                    </div>
                    
                    {/* Subject Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-base-content/60">Předmět:</span>
                        {subjectCodes.map(code => (
                            <button
                                key={code}
                                onClick={() => toggleSubjectFilter(code)}
                                className={`badge ${
                                    selectedSubjects.includes(code)
                                        ? 'badge-primary'
                                        : 'badge-outline'
                                } cursor-pointer hover:opacity-80`}
                            >
                                {code}
                            </button>
                        ))}
                        {selectedSubjects.length > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-base-content/50 hover:text-base-content underline"
                            >
                                Vymazat filtry
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Content - Exam List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32 text-base-content/50">
                            <span className="loading loading-spinner loading-md mr-2"></span>
                            Načítání zkoušek...
                        </div>
                    ) : filteredSections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-base-content/50">
                            <span className="text-4xl mb-2">📭</span>
                            <span>Žádné zkoušky pro vybrané filtry</span>
                        </div>
                    ) : (
                        filteredSections.map(({ subject, section }) => {
                            const isProcessing = processingSectionId === section.id;
                            const isRegistered = section.status === 'registered';
                            
                            return (
                                <div
                                    key={section.id}
                                    className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="card-body p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: Subject + Section Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="badge badge-primary badge-sm font-semibold">
                                                        {subject.code}
                                                    </span>
                                                    <span className="text-sm font-medium text-base-content truncate">
                                                        {section.name}
                                                    </span>
                                                    {isRegistered && (
                                                        <span className="badge badge-success badge-sm">Přihlášen</span>
                                                    )}
                                                </div>
                                                
                                                {/* Registered Term Details */}
                                                {isRegistered && section.registeredTerm && (
                                                    <div className="text-sm text-base-content/70">
                                                        📅 {section.registeredTerm.date} ({getDayOfWeek(section.registeredTerm.date)})
                                                        {' '}⏰ {section.registeredTerm.time}
                                                        {section.registeredTerm.room && ` 📍 ${section.registeredTerm.room}`}
                                                    </div>
                                                )}
                                                
                                                {/* Available Terms Summary - only when collapsed */}
                                                {!isRegistered && section.terms.length > 0 && expandedSectionId !== section.id && (
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-xs text-base-content/50">
                                                            {section.terms.length} termín{section.terms.length > 1 ? 'ů' : ''}
                                                        </span>
                                                        {section.terms.slice(0, 3).map(term => (
                                                            <div key={term.id} className="flex items-center gap-1">
                                                                <span className="text-xs text-base-content/70">
                                                                    {term.date.split('.').slice(0, 2).join('.')}
                                                                </span>
                                                                {term.capacity && (
                                                                    <progress
                                                                        className={`progress w-12 h-1.5 ${
                                                                            term.full ? 'progress-error' : 'progress-primary'
                                                                        }`}
                                                                        value={capacityToPercent(term.capacity)}
                                                                        max="100"
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Right: Expand/Collapse Button */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => toggleExpand(section.id)}
                                                    disabled={isProcessing}
                                                    className={`btn btn-sm gap-1 ${
                                                        expandedSectionId === section.id
                                                            ? 'btn-ghost'
                                                            : isRegistered
                                                                ? 'btn-outline btn-error'
                                                                : 'btn-primary'
                                                    }`}
                                                >
                                                    {isProcessing ? (
                                                        <span className="loading loading-spinner loading-xs"></span>
                                                    ) : expandedSectionId === section.id ? (
                                                        <>Zavřít <ChevronUp size={14} /></>
                                                    ) : isRegistered ? (
                                                        <>Změnit <ChevronDown size={14} /></>
                                                    ) : (
                                                        <>Vybrat <ChevronDown size={14} /></>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Expanded: Inline Term Tiles */}
                                        {expandedSectionId === section.id && section.terms.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-base-200">
                                                <div className="text-xs text-base-content/50 mb-2">
                                                    Vyberte termín (kliknutím se přihlásíte):
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {section.terms.map(term => (
                                                        <TermTile
                                                            key={term.id}
                                                            term={term}
                                                            onSelect={() => {
                                                                console.debug('[ExamPanel] === MODAL OPEN SEQUENCE START ===');
                                                                console.debug('[ExamPanel] Term clicked:', term.id);
                                                                console.debug('[ExamPanel] Modal ref exists:', !!confirmModalRef.current);
                                                                console.debug('[ExamPanel] Modal open state before:', confirmModalRef.current?.open);
                                                                console.debug('[ExamPanel] pendingRegistration before:', pendingRegistration);
                                                                
                                                                setPendingRegistration({ section, term });
                                                                confirmModalRef.current?.showModal();
                                                                
                                                                console.debug('[ExamPanel] Modal open state after showModal:', confirmModalRef.current?.open);
                                                                console.debug('[ExamPanel] === MODAL OPEN SEQUENCE END ===');
                                                            }}
                                                            isProcessing={isProcessing}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            {/* Confirmation Modal */}
            <dialog 
                ref={confirmModalRef} 
                className="modal"
                // NOTE: We don't use onClose because it fires before the close animation
                // finishes, causing the content to disappear while modal is still visible.
                // pendingRegistration is set fresh each time the modal opens.
            >
                <div className="modal-box" onClick={(e) => {
                    console.debug('[ExamPanel] Modal-box clicked, stopping propagation');
                    e.stopPropagation();
                }}>
                    <h3 className="font-bold text-lg mb-4">Potvrdit registraci</h3>
                    {pendingRegistration && (
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-base-content">
                                <Calendar size={16} className="text-primary" />
                                <span className="font-medium">
                                    {pendingRegistration.term.date} ({getDayOfWeek(pendingRegistration.term.date)})
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-base-content/70">
                                <Clock size={16} className="text-base-content/50" />
                                <span>{pendingRegistration.term.time}</span>
                            </div>
                            {pendingRegistration.term.room && (
                                <div className="flex items-center gap-2 text-base-content/70">
                                    <MapPin size={16} className="text-base-content/50" />
                                    <span>{pendingRegistration.term.room}</span>
                                </div>
                            )}
                            {pendingRegistration.term.capacity && (
                                <div className="text-sm text-base-content/50 mt-2">
                                    Kapacita: {pendingRegistration.term.capacity}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="modal-action">
                        <button 
                            className="btn btn-ghost"
                            onClick={() => {
                                console.debug('[ExamPanel] === ZRUŠIT BUTTON CLICKED ===');
                                console.debug('[ExamPanel] Modal open state before close():', confirmModalRef.current?.open);
                                confirmModalRef.current?.close();
                                console.debug('[ExamPanel] Modal open state after close():', confirmModalRef.current?.open);
                            }}
                        >
                            Zrušit
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={processingSectionId !== null}
                            onClick={async () => {
                                if (pendingRegistration) {
                                    console.debug('[ExamPanel] === PŘIHLÁSIT BUTTON CLICKED ===');
                                    const { section, term } = pendingRegistration;
                                    console.debug('[ExamPanel] Registering term:', term.id);
                                    confirmModalRef.current?.close();
                                    await handleRegister(section, term.id);
                                }
                            }}
                        >
                            {processingSectionId ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                'Přihlásit'
                            )}
                        </button>
                    </div>
                </div>
                {/* Backdrop - closes modal when clicked */}
                <div 
                    className="modal-backdrop"
                    onClick={(e) => {
                        console.debug('[ExamPanel] === BACKDROP CLICKED ===');
                        console.debug('[ExamPanel] Event target:', e.target);
                        console.debug('[ExamPanel] Event currentTarget:', e.currentTarget);
                        console.debug('[ExamPanel] Modal open state before close():', confirmModalRef.current?.open);
                        confirmModalRef.current?.close();
                        console.debug('[ExamPanel] Modal open state after close():', confirmModalRef.current?.open);
                    }}
                />
            </dialog>
        </>
    );
}
