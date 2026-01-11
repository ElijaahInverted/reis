import { useState, useEffect, useRef } from 'react';
import { X, Library, CheckCircle2, User as UserIcon, Users, Landmark, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DayPicker } from 'react-day-picker';
import { cs } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import { ReservationService } from '../../services/ReservationService';
import { ROOM_OPTIONS, type RoomType, type ReservationData } from '../../types/reservation';
import { getUserParams } from '../../utils/userParams';
import { useTheme } from '../../hooks/useTheme';

interface ReservationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CALENDARS = {
  individual: "https://calendar.google.com/calendar/embed?src=cgep47jilraobra3t2m16279oo@group.calendar.google.com&color=%23e4d354&src=1t2eo5oc0r9pt6ooanj9126q2o@group.calendar.google.com&color=%23f28f43&ctz=Europe%2FPrague&mode=WEEK",
  team: "https://calendar.google.com/calendar/embed?src=rezervovatstudovnu@gmail.com&color=%2351b886&src=4roddbq6jbp26v53l91cuvljf4@group.calendar.google.com&color=%234285f4&ctz=Europe%2FPrague&mode=WEEK",
};

const ROOM_COLORS: Record<string, string> = {
  'individuální studovna 1': '#e4d354',
  'individuální studovna 2': '#f28f43',
  'týmová studovna 1 (10 os.)': '#4285f4', // Blue
  'týmová studovna 2 (6 os.)': '#51b886',  // Green
  'seminární místnost (10 a více os.)': '#51b886'
};

export function ReservationDrawer({ isOpen, onClose }: ReservationDrawerProps) {
  const { isDark } = useTheme();
  const [roomType, setRoomType] = useState<RoomType>('individual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  
  const [formData, setFormData] = useState<Omit<ReservationData, 'roomName'> & { fullName: string }>({
    date: format(new Date(), 'dd.MM.yyyy'),
    timeFrom: '9:00',
    timeTo: '11:00',
    name: '',
    uisId: '',
    email: '',
    fullName: ''
  });
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  // Parsed date for DayPicker
  const selectedDay = parse(formData.date, 'dd.MM.yyyy', new Date());

  // Auto-fill user data and set smart defaults
  useEffect(() => {
    if (isOpen) {
      getUserParams().then(params => {
        if (params) {
          setFormData(prev => ({
            ...prev,
            uisId: params.studentId,
            email: `${params.username}@mendelu.cz`,
            name: params.fullName || prev.name,
            fullName: params.fullName || ''
          }));
        }
      });

      // Smart Defaults for Time
      const now = new Date();
      let h = now.getHours();
      let m = now.getMinutes() < 30 ? '30' : '00';
      if (now.getMinutes() >= 30) h += 1;
      
      // Clamp to library hours (7:00 - 19:00)
      if (h < 7) h = 7;
      if (h > 18) h = 18;

      const timeFrom = `${h}:${m}`;
      const endH = m === '30' ? h + 1 : h + 1;
      const endM = m === '30' ? '30' : '00';
      const timeTo = `${endH}:${endM}`;

      setFormData(prev => ({
        ...prev,
        timeFrom,
        timeTo
      }));

      // Set default room for type
      setSelectedRoom(ROOM_OPTIONS[roomType][0]);
    }
  }, [isOpen, roomType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) {
      toast.error('Vyberte prosím studovnu');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await ReservationService.submitReservation({
        ...formData,
        roomName: selectedRoom
      });

      if (result.success) {
        toast.success('Rezervace byla odeslána!', {
          description: 'Rezervace bude potvrzena emailem.'
        });
        onClose();
      } else {
        toast.error('Chyba při odesílání', {
          description: result.error
        });
      }
    } catch (err) {
      toast.error('Něco se nepovedlo');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-stretch p-4 isolate">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/15 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="w-full flex justify-end items-start h-full pt-10 pb-10 relative z-10 pointer-events-none">
        {/* Drawer */}
        <div 
          role="dialog"
          aria-modal="true"
          className="w-[850px] bg-base-100 shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-base-300 font-inter h-full animate-in slide-in-from-right duration-300 pointer-events-auto"
        >
          {/* Header */}
          <div className="bg-base-200/50 px-6 py-4 flex items-center justify-between border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Rezervace studoven</h2>
                <p className="text-xs text-base-content/60">Knihovna MENDELU</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-base-300 rounded-lg transition-colors text-base-content/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar / Form */}
            <div className="w-80 border-r border-base-300 flex flex-col bg-base-100 overflow-y-auto">
              <div className="p-5 flex-1 space-y-5">
                {/* Type Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-base-content/50">Typ studovny</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRoomType('individual')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        roomType === 'individual' 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-base-300 hover:border-base-content/20 bg-base-100 text-base-content/50'
                      }`}
                    >
                      <UserIcon className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">Individuální</span>
                    </button>
                    <button
                      onClick={() => setRoomType('team')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        roomType === 'team' 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-base-300 hover:border-base-content/20 bg-base-100 text-base-content/50'
                      }`}
                    >
                      <Users className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">Týmová</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-base-content/70 flex items-center gap-1.5 ml-1">
                      <Landmark className="w-3.5 h-3.5" /> Konkrétní místnost
                    </label>
                    <div className="space-y-2">
                      <select 
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="select select-bordered select-sm w-full bg-base-100 font-semibold text-base-content text-xs"
                      >
                        {ROOM_OPTIONS[roomType].map(room => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                        {roomType === 'team' && (
                           <option value="seminární místnost (10 a více os.)">seminární místnost (10+)</option>
                        )}
                      </select>

                      {/* Legend area */}
                      <div className="flex flex-wrap gap-2 px-1">
                        {ROOM_OPTIONS[roomType].map(room => (
                          <div key={room} className="flex items-center gap-1.5">
                            <div 
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-black/10"
                              style={{ backgroundColor: ROOM_COLORS[room] }}
                            />
                            <span className="text-[10px] font-medium text-base-content/60">
                              {room.split('studovna ')[1]?.split(' (')[0] || '10+'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Custom Premium Date Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-base-content/70 ml-1">Datum</label>
                    <details className="dropdown w-full" ref={dropdownRef}>
                      <summary className="btn btn-bordered btn-sm w-full justify-between bg-base-100 font-medium hover:border-primary/50 text-xs h-9">
                        <span className="flex items-center gap-2.5">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          {formData.date}
                        </span>
                      </summary>
                      <div className="dropdown-content z-20 mt-1 bg-base-100 p-0 shadow-2xl rounded-2xl border border-base-300 w-fit min-w-[280px]">
                        <DayPicker
                          mode="single"
                          selected={selectedDay}
                          onSelect={(day) => {
                            if (day) {
                              setFormData(prev => ({ ...prev, date: format(day, 'dd.MM.yyyy') }));
                              dropdownRef.current?.removeAttribute('open');
                            }
                          }}
                          locale={cs}
                          className="calendar rdp-custom p-3"
                          showOutsideDays
                        />
                      </div>
                    </details>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-base-content/70 ml-1">Od</label>
                      <select 
                        value={formData.timeFrom}
                        onChange={e => setFormData(prev => ({ ...prev, timeFrom: e.target.value }))}
                        className="select select-bordered select-sm w-full bg-base-100 text-base-content text-xs"
                      >
                        {Array.from({ length: 24 }).map((_, i) => {
                          const h = 7 + Math.floor(i / 2);
                          const m = i % 2 === 0 ? '00' : '30';
                          if (h >= 19) return null;
                          return <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-base-content/70 ml-1">Do</label>
                      <select 
                        value={formData.timeTo}
                        onChange={e => setFormData(prev => ({ ...prev, timeTo: e.target.value }))}
                        className="select select-bordered select-sm w-full bg-base-100 text-base-content text-xs"
                      >
                        {Array.from({ length: 25 }).map((_, i) => {
                          const h = 7 + Math.floor((i + 1) / 2);
                          const m = (i + 1) % 2 === 0 ? '00' : '30';
                          if (h > 19) return null;
                          return <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Stealth Identity - Hidden personal info confirmation */}
                  <div className="pt-2">
                    <div className="px-3 py-2.5 bg-base-200/50 rounded-lg border border-base-300/50 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-success/70 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-base-content/70 truncate leading-tight">Identita potvrzena</p>
                        <p className="text-[11px] text-base-content/50 truncate font-medium mt-0.5">{formData.fullName} ({formData.uisId})</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="p-4 bg-base-200/30 border-t border-base-300 mt-auto">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn btn-primary w-full gap-2 shadow-md shadow-primary/20 h-10 text-sm font-bold"
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-md"></span>
                  ) : (
                    'Rezervovat'
                  )}
                </button>
                <p className="text-[10px] text-center mt-3 text-base-content/40 leading-tight">
                  Potvrzení přijde na e-mail.
                </p>
              </div>
            </div>

            {/* Calendar View */}
            <div className={`flex-1 ${isDark ? 'bg-base-100' : 'bg-white'} relative overflow-hidden transition-colors duration-300`}>
              <iframe 
                src={CALENDARS[roomType === 'individual' ? 'individual' : 'team']}
                style={{ 
                  border: 0,
                  filter: isDark ? 'invert(90%) hue-rotate(180deg) brightness(1.2) contrast(0.9)' : 'none',
                  transition: 'filter 0.3s ease'
                }}
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no"
                title="Dostupnost studoven"
              />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        /* Fix for react-day-picker v9 grid layout in DaisyUI 5 */
        .rdp-root {
          --rdp-accent-color: var(--p);
          --rdp-accent-text-color: var(--pc);
          margin: 0;
        }
        .rdp-months {
          display: block !important;
        }
        .rdp-month_grid {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.5rem;
        }
        .rdp-weekdays {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid var(--base-300);
          margin-bottom: 0.25rem;
        }
        .rdp-weekday {
          width: 2rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--base-content);
          opacity: 0.4;
        }
        .rdp-weeks {
          display: block;
        }
        .rdp-week {
          display: flex;
          justify-content: space-between;
        }
        .rdp-day {
          width: 2.2rem;
          height: 2.2rem;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rdp-day_button {
          width: 1.8rem;
          height: 1.8rem;
          border-radius: 0.5rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.8rem;
          color: var(--base-content);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .rdp-day_button:hover {
          background: var(--base-300);
        }
        .rdp-selected .rdp-day_button {
          background: var(--p) !important;
          color: var(--pc) !important;
          font-weight: 700;
        }
        .rdp-outside {
          opacity: 0.2;
        }
        .rdp-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .rdp-nav button {
          background: var(--base-300);
          border: none;
          border-radius: 0.4rem;
          padding: 0.25rem;
          cursor: pointer;
          color: var(--base-content);
        }
        .rdp-month_caption {
          text-align: center;
          font-weight: 700;
          text-transform: capitalize;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .rdp-chevron {
          fill: currentColor;
          width: 1rem;
          height: 1rem;
        }
      `}</style>
    </div>
  );
}
