import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff, Wifi, RefreshCw, X } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

/**
 * OfflineBanner — shown at the top of the screen whenever the device loses
 * connectivity.  Also displays a brief "Back online" confirmation when the
 * connection is restored.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline) {
      setShowRestored(true);
      const t = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  const showOffline  = !isOnline && !dismissed;
  const showOnline   = isOnline && showRestored;

  return (
    <AnimatePresence>
      {showOffline && (
        <motion.div
          key="offline"
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-between gap-3
                     bg-rose-600 text-white px-4 py-3 shadow-lg"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="flex-shrink-0" />
            <span className="text-sm font-semibold">You're offline</span>
            <span className="text-xs text-rose-200 hidden sm:inline">
              Browsing cached content. Live data unavailable.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30
                         rounded-lg px-3 py-1.5 transition-colors font-medium"
            >
              <RefreshCw size={12} /> Retry
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="p-1 hover:bg-white/20 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {showOnline && (
        <motion.div
          key="online"
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2
                     bg-emerald-600 text-white px-4 py-3 shadow-lg"
          role="status"
        >
          <Wifi size={16} />
          <span className="text-sm font-semibold">Back online</span>
          <span className="text-xs text-emerald-200">Refreshing content…</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
