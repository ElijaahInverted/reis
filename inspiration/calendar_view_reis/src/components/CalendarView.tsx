import { CalendarEvent } from "./CalendarEvent";

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  day: number; // 0-4 for Mon-Fri
  organizer?: string;
  tentative?: boolean;
  type?: "lecture" | "exercise" | "other";
  location?: string;
}

const events: Event[] = [
  // Monday
  {
    id: "1",
    title: "EBC-AP Architektura počítačů (př.)",
    startTime: "9:00",
    endTime: "10:50",
    day: 0,
    type: "lecture",
    location: "Q04",
  },
  {
    id: "2",
    title: "EBC-TZI Teoretické základy informatiky (cv.)",
    startTime: "11:00",
    endTime: "12:50",
    day: 0,
    type: "exercise",
    location: "Q03",
  },
  {
    id: "3",
    title: "EBC-ALG Algoritmizace (cv.)",
    startTime: "15:00",
    endTime: "16:50",
    day: 0,
    type: "exercise",
    location: "Q25",
  },
  // Tuesday
  {
    id: "4",
    title: "EBC-TZI Teoretické základy informatiky (př.)",
    startTime: "13:00",
    endTime: "14:50",
    day: 1,
    type: "lecture",
    location: "Q12",
  },
  {
    id: "5",
    title: "EBC-ZOO Základy objektového návrhu (př.)",
    startTime: "15:00",
    endTime: "16:50",
    day: 1,
    type: "lecture",
    location: "Q07",
  },
  // Wednesday
  {
    id: "6",
    title: "EBC-ZOO Základy objektového návrhu (cv.)",
    startTime: "9:00",
    endTime: "10:50",
    day: 2,
    type: "exercise",
    location: "Q18",
  },
  {
    id: "7",
    title: "EBC-KOM Komunikace (cv.)",
    startTime: "11:00",
    endTime: "11:50",
    day: 2,
    type: "exercise",
    location: "Q03",
  },
  // Thursday
  {
    id: "9",
    title: "EBC-ALG Algoritmizace (př.)",
    startTime: "11:00",
    endTime: "12:50",
    day: 3,
    type: "lecture",
    location: "Q13",
  },
];

const days = [
  { date: 1, dayName: "Po", fullName: "Pondělí" },
  { date: 2, dayName: "Út", fullName: "Úterý" },
  { date: 3, dayName: "St", fullName: "Středa" },
  { date: 4, dayName: "Čt", fullName: "Čtvrtek" },
  { date: 5, dayName: "Pá", fullName: "Pátek" },
];

const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const HOUR_HEIGHT = 60; // pixels per hour
const TOTAL_HOURS = 14; // 7:00 to 20:00 (inclusive)
const CALENDAR_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

// Convert time string to pixels from top (7:00)
function timeToPixels(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const hoursFrom7 = hours - 7;
  return hoursFrom7 * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
}

// Calculate position in pixels based on time
function getEventStyle(startTime: string, endTime: string) {
  const topPixels = timeToPixels(startTime);
  const bottomPixels = timeToPixels(endTime);
  const heightPixels = bottomPixels - topPixels;

  return {
    top: `${topPixels}px`,
    height: `${heightPixels}px`,
  };
}

export function CalendarView() {
  return (
    <div className="flex h-screen overflow-hidden flex-col">
      {/* Day headers - sticky */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0 h-[60px]">
        {/* Empty space for time column */}
        <div className="w-12 border-r border-gray-200 bg-gray-50"></div>
        
        {days.map((day, index) => (
          <div
            key={index}
            className="flex-1 p-2 text-center border-r border-gray-200 last:border-r-0"
          >
            <div className="flex flex-col items-center">
              <div className="text-gray-900">{day.date}</div>
              <div className="text-xs text-gray-600">{day.fullName}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable calendar body */}
      <div className="flex-1 overflow-auto">
        <div className="flex" style={{ height: `${CALENDAR_HEIGHT}px` }}>
          {/* Time column */}
          <div className="w-12 flex-shrink-0 border-r border-gray-200 bg-gray-50 relative">
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="absolute left-0 right-0 text-xs text-gray-600 text-right pr-1"
                style={{
                  top: `${index * HOUR_HEIGHT}px`,
                  height: `${HOUR_HEIGHT}px`,
                }}
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 relative flex">
            {/* Grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="flex-1 border-r border-gray-200 last:border-r-0"
                >
                  {hours.map((_, hourIndex) => (
                    <div
                      key={hourIndex}
                      className="border-b border-gray-100"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    ></div>
                  ))}
                </div>
              ))}
            </div>

            {/* Day columns with events */}
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="flex-1 relative">
                {events
                  .filter((event) => event.day === dayIndex)
                  .map((event) => {
                    const style = getEventStyle(event.startTime, event.endTime);
                    return (
                      <CalendarEvent
                        key={event.id}
                        title={event.title}
                        startTime={event.startTime}
                        endTime={event.endTime}
                        style={style}
                        organizer={event.organizer}
                        tentative={event.tentative}
                        type={event.type}
                        location={event.location}
                      />
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}