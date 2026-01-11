import { useState, useEffect, useRef } from 'react'
import { loggers } from './utils/logger'
import { Sidebar, type AppView } from './components/Sidebar'
import { WeeklyCalendar } from './components/WeeklyCalendar'
import { SubjectFileDrawer } from './components/SubjectFileDrawer'
import { OutlookSyncHint } from './components/OutlookSyncHint'
import { Toaster } from './components/ui/sonner'
import { ExamPanel } from './components/ExamPanel'
import { AppHeader } from './components/AppHeader'
import { ReservationDrawer } from './components/ReservationDrawer'
import type { BlockLesson } from './types/calendarTypes'
import { outlookSyncService } from './services/sync'
import './utils/devFeatures'; // Ensure dev tools are loaded
import { useOutlookSync } from './hooks/data'
import { useMessageBridge } from './hooks/ui/useMessageBridge'
import { useCalendarNavigation } from './hooks/ui/useCalendarNavigation'
import CommandPalette from './components/CommandPalette'
import type { CommandItem } from './types/commands'

function App() {
  // Initialize hooks
  useEffect(() => { outlookSyncService.init(); }, []);
  useMessageBridge();
  
  const {
    currentDate,
    navCount,
    handlePrev,
    handleNext,
    handleToday,
    dateRangeLabel
  } = useCalendarNavigation();

  // View state
  const VIEW_STORAGE_KEY = 'reis_current_view';
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    return (stored === 'exams' ? 'exams' : 'calendar') as AppView;
  });
  
  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, currentView);
  }, [currentView]);
  
  const { isEnabled: outlookSyncEnabled } = useOutlookSync();
  const openSettingsRef = useRef<(() => void) | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<BlockLesson | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  // Command palette items
  const commandItems: CommandItem[] = [
    { 
      id: 'action-calendar',
      type: 'action',
      title: 'Přejít na rozvrh', 
      subtitle: 'Zobrazit týdenní rozvrh',
      action: () => setCurrentView('calendar') 
    },
    { 
      id: 'action-exams',
      type: 'action',
      title: 'Přejít na zkoušky', 
      subtitle: 'Zobrazit nadcházející zkoušky',
      action: () => setCurrentView('exams') 
    },
    { 
      id: 'action-today',
      type: 'action',
      title: 'Přejít na dnešek', 
      subtitle: 'Vrátit se na aktuální datum',
      action: handleToday 
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-base-200 font-sans text-base-content">
      <Toaster position="top-center" />
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenSettingsRef={openSettingsRef}
        onOpenReservation={() => setIsReservationOpen(true)}
      />
      <main className="flex-1 flex flex-col ml-0 md:ml-20 transition-all duration-300 overflow-hidden">
        <AppHeader 
          currentView={currentView}
          dateRangeLabel={dateRangeLabel}
          onPrevWeek={handlePrev}
          onNextWeek={handleNext}
          onToday={handleToday}
          onOpenExams={() => setCurrentView('exams')}
          onSelectResult={(result) => {
            loggers.ui.info('[App] Search result selected:', result.title);
          }}
        />

        <div className="flex-1 pt-3 px-4 pb-1 overflow-hidden flex flex-col">
          <div className="flex-1 bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden">
            {currentView === 'calendar' ? (
              <WeeklyCalendar
                key={currentDate.toISOString()}
                initialDate={currentDate}
                onSelectLesson={setSelectedLesson}
              />
            ) : (
              <ExamPanel 
                onClose={() => setCurrentView('calendar')} 
                onSelectSubject={(subj) => {
                  const shortSubject = subj.code.includes('-') ? subj.code.split('-')[1] : subj.code;
                  setSelectedLesson({
                    courseCode: subj.code,
                    courseName: subj.sectionName ? `${shortSubject} - ${subj.sectionName}` : subj.name,
                    date: subj.date ? subj.date.split('.').map(s => s.trim()).reverse().join('') : '',
                    startTime: subj.time || '',
                    room: subj.room || '',
                    isExam: true,
                    sectionName: subj.sectionName,
                    teachers: [],
                    roomStructured: { name: subj.room || '', id: '' },
                    endTime: '',
                    id: `exam-${subj.code}-${subj.date}`,
                    isSeminar: 'false',
                    isConsultation: 'false',
                    studyId: '',
                    facultyCode: '',
                    isDefaultCampus: 'true',
                    courseId: '',
                    campus: '',
                    periodId: ''
                  } as BlockLesson);
                }}
              />
            )}
          </div>
        </div>
      </main>

      <SubjectFileDrawer
        lesson={selectedLesson}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
      />

      <OutlookSyncHint
        navigationCount={navCount}
        isSyncEnabled={outlookSyncEnabled}
        onSetup={() => openSettingsRef.current?.()}
      />

      <ReservationDrawer
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
      />


      <CommandPalette items={commandItems} />
    </div>
  )
}

export default App