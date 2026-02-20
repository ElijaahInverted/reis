import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, CheckCircle2, Loader2, Send, Sparkle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/useAppStore';

interface StudyJamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'pitch' | 'tutor-form' | 'success';

export function StudyJamModal({ isOpen, onClose }: StudyJamModalProps) {
  const [state, setState] = useState<ModalState>('pitch');
  const [when, setWhen] = useState('');
  const [where, setWhere] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  
  const isSelectingTime = useAppStore(s => s.isSelectingTime);
  const setIsSelectingTime = useAppStore(s => s.setIsSelectingTime);

  const handleClose = () => {
    onClose();
    setIsSelectingTime(false);
    setTimeout(() => setState('pitch'), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setState('success');
  };
  
  // Listen for chosen time from calendar via a custom event or a store prop.
  // We'll use a custom event dispatched from the calendar click for simplicity.
  useEffect(() => {
     const handleTimeSelected = (e: CustomEvent<string>) => {
         setWhen(e.detail);
         setIsSelectingTime(false);
     };
     
     window.addEventListener('studyjam-time-selected', handleTimeSelected as EventListener);
     return () => window.removeEventListener('studyjam-time-selected', handleTimeSelected as EventListener);
  }, [setIsSelectingTime]);

  return (
    <AnimatePresence>
      {isOpen && !isSelectingTime && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-[480px] bg-[#1c2128] rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
              <h3 className="font-semibold text-lg text-white">
                reIS doučování
              </h3>
              <button 
                onClick={handleClose}
                className="btn btn-sm btn-ghost btn-circle text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              <AnimatePresence mode="wait">
                {state === 'pitch' && (
                  <motion.div
                    key="pitch"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col text-left space-y-6"
                  >
                    <div className="space-y-4 text-[14px] text-gray-300 leading-relaxed">
                      <p>Nechceš některého z prváků zachránit před jistou zkázou?</p>
                      
                      <ul className="list-disc pl-5 space-y-2 marker:text-gray-500">
                        <li><strong>65% studentů</strong> nedalo algo v minulém semestru</li>
                        <li>vysvětlování látky zvyšuje tvoje udržení znalostí o <strong>72%</strong></li>
                        <li>stačí <strong>jedna hodina</strong></li>
                      </ul>
                      
                      <p>
                        Když vám to oběma sedne, můžete se domluvit na další.
                      </p>
                    </div>

                    <button 
                      onClick={() => setState('tutor-form')}
                      className="btn btn-primary w-full text-white font-bold h-12 rounded-xl border-none mt-2"
                    >
                      Jdu do toho!
                    </button>
                  </motion.div>
                )}

                {state === 'tutor-form' && (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="space-y-5">
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-gray-400 flex items-center gap-2 font-medium">
                            <MapPin className="w-4 h-4" /> Kde se bude konat: 
                          </span>
                        </label>
                        <p className="text-xs text-white/50 mb-2 px-1">zarezervuj si studovnu nebo napiš místo na univerzitě</p>
                        <input 
                          type="text" 
                          placeholder="Např. cafeteria PEFky" 
                          className="input input-bordered w-full bg-[#0d1117] border-white/10 focus:border-primary text-white"
                          value={where}
                          onChange={(e) => setWhere(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>

                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-gray-400 flex items-center gap-2 font-medium">
                            <Calendar className="w-4 h-4" /> Kdy:
                          </span>
                        </label>
                        <button 
                          type="button"
                          onClick={() => setIsSelectingTime(true)}
                          className="w-full text-left px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white/50 hover:border-primary/50 transition-colors"
                        >
                          {when || "Vyber v kalendáři u konk. čas"}
                        </button>
                      </div>

                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-gray-400 flex items-center gap-2 font-medium">
                            <Sparkle className="w-4 h-4" /> Co sebou?
                          </span>
                        </label>
                        <p className="text-xs text-white/50 px-1">Pokud student/ka doučko přijme, dá ti vědět, na co se zaměřit</p>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary w-full text-white font-bold h-14 mt-4 rounded-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Odesílám...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Potvrdit dostupnost
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {state === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center space-y-6 py-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Super, díky!</h2>
                      <p className="text-gray-400">
                        Tvoje dostupnost byla uložena. Jakmile najdeme tutea, dáme ti vědět!
                      </p>
                    </div>
                    <button 
                      onClick={handleClose}
                      className="btn btn-ghost w-full text-white border-white/10"
                    >
                      Zavřít
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
