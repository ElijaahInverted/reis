import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { SearchBar } from './components/SearchBar'
import { SchoolCalendar } from './components/SchoolCalendar'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getSmartWeekRange } from './utils/calendarUtils'
import { ExamDrawer } from './components/ExamDrawer'
import { PortalContext } from './components/ui/portal-context'
import { syncService } from './services/sync'

function App() {
  const [currentDate, setCurrentDate] = useState(() => {
    const { start } = getSmartWeekRange();
    return start;
  });

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const { start } = getSmartWeekRange();
    setCurrentDate(start);
  };

  const getDateRangeLabel = () => {
    // Show date range like "3.12. - 9.12." or "28.12. - 3.1." if spanning months
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(currentDate.getDate() + 6);

    const startDay = currentDate.getDate();
    const startMonth = currentDate.getMonth() + 1;
    const endDay = weekEnd.getDate();
    const endMonth = weekEnd.getMonth() + 1;
    const year = weekEnd.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay}. - ${endDay}.${startMonth}. ${year}`;
    } else {
      return `${startDay}.${startMonth}. - ${endDay}.${startMonth === 12 && endMonth === 1 ? endMonth + '.' + (year) : endMonth + '.'} ${year}`;
    }
  };

  const [isExamDrawerOpen, setIsExamDrawerOpen] = useState(false);
  const portalContainerRef = useRef<HTMLDivElement>(null);

  // Start background data sync on app mount
  useEffect(() => {
    syncService.start();
    return () => syncService.stop();
  }, []);

  return (
    <PortalContext.Provider value={portalContainerRef.current}>
      <div className="flex min-h-screen bg-slate-50 font-sans text-gray-900" ref={portalContainerRef}>
        <Sidebar onOpenExamDrawer={() => setIsExamDrawerOpen(true)} />
        <main className="flex-1 ml-0 md:ml-20 transition-all duration-300">
          <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-gray-200 px-8 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              {/* Navigation Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button onClick={handlePrevWeek} className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-600 hover:text-primary">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={handleNextWeek} className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-600 hover:text-primary">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <button
                  onClick={handleToday}
                  className="btn btn-primary btn-sm"
                >
                  Dnes
                </button>
                <span className="text-lg font-semibold text-gray-800 min-w-[150px]">{getDateRangeLabel()}</span>
              </div>

              <div className="flex-1 max-w-2xl">
                <SearchBar onOpenExamDrawer={() => setIsExamDrawerOpen(true)} />
              </div>
            </div>
          </div>

          <div className="p-4 max-w-8xl mx-auto">

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <SchoolCalendar
                key={currentDate.toISOString()}
                initialDate={currentDate}
                onEmptyWeek={(direction) => {
                  if (direction === 'next') {
                    handleNextWeek();
                  } else {
                    handlePrevWeek();
                  }
                }}
              />
            </div>
          </div>
        </main>

        <ExamDrawer isOpen={isExamDrawerOpen} onClose={() => setIsExamDrawerOpen(false)} />
      </div>
    </PortalContext.Provider>
  )
}

export default App