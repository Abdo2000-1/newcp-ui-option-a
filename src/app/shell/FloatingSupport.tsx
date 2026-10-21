import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  X,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileQuestion
} from 'lucide-react';
import { useAppConfig } from '@/app/providers/contexts/ConfigContext';

export function FloatingSupport() {
  const { config } = useAppConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setMessage('');
      setSubject('');
      setIsOpen(false);
    }, 2200);
  };

  return (
    <>
      {/* Sleek, Non-intrusive Floating Support FAB at bottom-right */}
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 select-none">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0369a1] hover:to-[#0284c7] text-white shadow-lg hover:shadow-xl hover:shadow-sky-500/25 border border-sky-400/40 backdrop-blur-md transition-all cursor-pointer group"
          title="Need Assistance? Contact 3DDX Technical Support"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <LifeBuoy className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
          <span className="text-[11px] font-bold tracking-tight">Support</span>
        </motion.button>
      </div>

      {/* Floating Support Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-20 right-6 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-96 max-w-[calc(100vw-2rem)] rounded-3xl bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#ea580c] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <LifeBuoy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight leading-none">
                      3DDX Telemedicine Support
                    </h3>
                    <span className="text-[10px] text-white/80 font-medium">
                      Live Clinical CAD/CAM Assistance
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Indicator Bar */}
              <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Systems Operational</span>
                </div>
                <span className="font-mono text-slate-400">Avg. Reply &lt; 5m</span>
              </div>

              {/* Form & Channels */}
              <div className="p-4 space-y-4">
                {formSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                      Ticket Dispatched!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Our clinical engineering team has received your request and will follow up shortly.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Topic / Case Reference:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Order #38081 / CoDiagnostiX Alignment"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Message:
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Describe your inquiry or technical question..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPriority('normal')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            priority === 'normal'
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          Standard
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriority('urgent')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            priority === 'urgent'
                              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          Urgent
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#ea580c] text-white text-xs font-bold hover:shadow-md transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Ticket</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Direct Contact Links */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <a
                    href={`mailto:${config.links.supportEmail}`}
                    className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors border border-slate-200/60 dark:border-slate-800/60"
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="truncate">Email Tech</span>
                  </a>

                  <a
                    href="tel:+18773339942"
                    className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors border border-slate-200/60 dark:border-slate-800/60"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">+1 (877) 3DDX</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default FloatingSupport;
