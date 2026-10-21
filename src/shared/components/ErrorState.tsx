import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Terminal, ChevronDown, ChevronUp, ShieldAlert, WifiOff } from 'lucide-react';
import { Button } from './Button';
import { sound } from '@/shared/utils/sound';

interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  fullHeight?: boolean;
}

export function ErrorState({ 
  title = 'Service Synchronization Interrupted',
  message = 'Unable to establish secure handshake with the Dental CAD PACS cloud server. Please verify your connection or retry.',
  code = 'ERR_CAD_SYNC_503',
  onRetry,
  fullHeight = false
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = () => {
    sound.playPop();
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      if (onRetry) onRetry();
    }, 650);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-6 text-center select-none ${fullHeight ? 'min-h-[420px]' : 'py-16'}`}
    >
      {/* Icon with Rose Glow */}
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-rose-500/20 dark:bg-rose-500/30 rounded-3xl blur-2xl transform scale-150 pointer-events-none" />
        
        <div className="relative w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shadow-lg shadow-rose-950/20 text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-10 h-10 stroke-[1.8]" />
        </div>
      </div>

      {/* Error Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-2">
        <WifiOff size={12} />
        <span>{code}</span>
      </div>

      {/* Main Copy */}
      <div className="max-w-md space-y-1.5 mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button 
            variant="primary" 
            size="md" 
            onClick={handleRetry} 
            disabled={retrying}
            className="!bg-rose-600 hover:!bg-rose-700 text-white shadow-md shadow-rose-600/25 cursor-pointer"
            icon={<RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />}
          >
            {retrying ? 'Re-establishing Connection...' : 'Try Again'}
          </Button>
        )}

        <Button
          variant="outline"
          size="md"
          onClick={() => { sound.playClick(); setShowDetails(!showDetails); }}
          className="cursor-pointer text-xs"
          icon={showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        >
          {showDetails ? 'Hide Diagnostics' : 'Inspect Diagnostic Trace'}
        </Button>
      </div>

      {/* Diagnostic Details Accordion */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 max-w-lg w-full text-left overflow-hidden"
          >
            <div className="p-3.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 font-mono text-[11px] space-y-1.5 shadow-lg">
              <div className="flex items-center justify-between text-slate-500 pb-1.5 border-b border-slate-800 text-[10px]">
                <span className="flex items-center gap-1.5"><Terminal size={12} className="text-rose-400" /> STACKTRACE TELEMETRY</span>
                <span>NODE: EU-CENTRAL-01</span>
              </div>
              <div className="text-rose-400">Error: SocketTimeoutException: Gateway timeout after 15000ms</div>
              <div className="text-slate-400">  at DentalCloudGateway.syncOrders (cluster.ts:89:14)</div>
              <div className="text-slate-400">  at WebhookDispatcher.dispatch (bus.ts:241:19)</div>
              <div className="text-cyan-400 pt-1">Suggested fix: Verify CORS credentials and upstream DICOM PACS proxy.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
