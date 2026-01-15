import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Moon, MessageSquarePlus, Info } from 'lucide-react';
import { useState } from 'react';
import { useOutlookSync } from '../../hooks/data';
import { useTheme } from '../../hooks/useTheme';

interface ProfilePopupProps {
  isOpen: boolean;
  onOpenFeedback?: () => void;
}

export function ProfilePopup({ isOpen, onOpenFeedback }: ProfilePopupProps) {
  const { isEnabled: outlookSyncEnabled, isLoading: outlookSyncLoading, toggle: toggleOutlookSync } = useOutlookSync();
  const { isDark, isLoading: themeLoading, toggle: toggleTheme } = useTheme();
  const [showSyncInfo, setShowSyncInfo] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute left-14 bottom-0 w-72 bg-base-100 rounded-xl shadow-popover-heavy border border-base-300 p-3 z-50"
        >
          <div className="px-1 py-1 border-b border-base-200 mb-3">
            <h3 className="font-semibold text-base-content">Nastavení</h3>
          </div>
          
          {/* Feedback Button */}
          {onOpenFeedback && (
            <button 
              onClick={onOpenFeedback}
              className="w-full flex items-center gap-3 px-1 py-2 text-left hover:bg-base-200 rounded-lg transition-colors mb-2"
            >
              <div className="flex items-center gap-2 flex-1">
                 <MessageSquarePlus className="w-4 h-4 text-primary shrink-0" />
                 <span className="text-xs font-medium text-base-content">Nahlásit chybu / Nápad</span>
              </div>
            </button>
          )}

          {/* Outlook Sync Toggle */}
          <div 
            className="flex items-center justify-between gap-3 px-1 py-2 rounded-lg transition-colors hover:bg-base-200 cursor-pointer"
            onClick={() => !outlookSyncLoading && toggleOutlookSync()}
          >
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-base-content/50 shrink-0" />
              <span className="text-xs text-base-content/70">Synchronizace rozvrhu do Outlooku</span>
            </div>
            
            {/* Info Icon with Tooltip */}
            <div className="relative flex items-center gap-2">
              <div 
                className="relative"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setShowSyncInfo(true)}
                onMouseLeave={() => setShowSyncInfo(false)}
              >
                <Info className="w-3.5 h-3.5 text-base-content/40 cursor-help hover:text-primary transition-colors" />
                
                <AnimatePresence>
                  {showSyncInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-2 w-64 bg-base-200 text-base-content rounded-lg shadow-lg border border-base-300 p-3 z-[100] pointer-events-none"
                    >
                      <p className="text-xs leading-relaxed">
                        Synchronizuje rozvrh a termíny zkoušek do Outlooku. Všechno pak uvidíš přímo v kalendáři.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm pointer-events-none" 
                checked={outlookSyncEnabled ?? false}
                disabled={outlookSyncLoading || outlookSyncEnabled === null}
                readOnly
              />
            </div>
          </div>

          {/* Dark Theme Toggle */}
          <label className="flex items-center justify-between gap-3 px-1 py-2 cursor-pointer hover:bg-base-200 rounded-lg transition-colors">
            <div className="flex items-center gap-2 flex-1">
              <Moon className="w-4 h-4 text-base-content/50 shrink-0" />
              <span className="text-xs text-base-content/70">Tmavý režim</span>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={isDark}
              disabled={themeLoading}
              onChange={() => toggleTheme()}
            />
          </label>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
