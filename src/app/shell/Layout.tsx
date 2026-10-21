import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ConvertibleNav, NavPosition } from './ConvertibleNav';
import { Footer } from './Footer';
import { FloatingSupport } from './FloatingSupport';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

export function Layout() {
  const location = useLocation();
  const { t } = useLanguage();

  // Position state: 'top' | 'left' | 'right' | 'bottom'. Default 'top'
  const [navPosition, setNavPosition] = useState<NavPosition>(() => {
    const saved = localStorage.getItem('3ddx-cp-nav-position') as NavPosition;
    return (saved === 'left' || saved === 'top' || saved === 'right' || saved === 'bottom') ? saved : 'top';
  });

  // Collapsed state: collapsed by default when in sidebar mode!
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Dragging state for 4-way drop zones
  const [isDraggingNav, setIsDraggingNav] = useState(false);
  const [hoveredDropZone, setHoveredDropZone] = useState<NavPosition | null>(null);

  // Switch position and persist
  const handlePositionChange = (newPos: NavPosition) => {
    setNavPosition(newPos);
    localStorage.setItem('3ddx-cp-nav-position', newPos);
    if (newPos === 'left' || newPos === 'right') {
      // Default to collapsed when converted to sidebar!
      setSidebarCollapsed(true);
    }
  };

  // Listen to hand drag hover events
  useEffect(() => {
    const handleZone = (e: any) => {
      setHoveredDropZone(e.detail);
    };
    window.addEventListener('nav-hover-zone', handleZone);
    return () => window.removeEventListener('nav-hover-zone', handleZone);
  }, []);

  // Drop zone events
  const handleDragOverZone = (e: React.DragEvent, zone: NavPosition) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredDropZone(zone);
  };

  const handleDropOnZone = (e: React.DragEvent, zone: NavPosition) => {
    e.preventDefault();
    setIsDraggingNav(false);
    setHoveredDropZone(null);
    handlePositionChange(zone);
  };

  const isVertical = navPosition === 'left' || navPosition === 'right';

  return (
    <div className={`relative flex min-h-screen w-full bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden ${
      isVertical ? 'flex-row' : 'flex-col'
    }`}>

      {/* 1. Convertible Navigation (Top / Left / Right / Bottom) */}
      <ConvertibleNav
        position={navPosition}
        onChangePosition={handlePositionChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isDraggingNav={isDraggingNav}
        setIsDraggingNav={setIsDraggingNav}
      />

      {/* 2. Interactive 4-Way Drop Target Zones (Visible when dragging the handle) */}
      <AnimatePresence>
        {isDraggingNav && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            
            {/* TOP DROP ZONE */}
            <div
              onClick={() => handlePositionChange('top')}
              onDragOver={(e) => handleDragOverZone(e, 'top')}
              onDragLeave={() => setHoveredDropZone(null)}
              onDrop={(e) => handleDropOnZone(e, 'top')}
              className={`pointer-events-auto absolute top-0 left-0 right-0 h-24 flex items-center justify-center border-b-4 border-dashed transition-all cursor-pointer ${
                hoveredDropZone === 'top'
                  ? 'bg-sky-500/30 border-sky-400 backdrop-blur-md'
                  : 'bg-slate-950/80 border-sky-500/60 backdrop-blur-xs'
              }`}
            >
              <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider">
                <ArrowUp size={20} className="text-sky-400 animate-bounce" />
                <span>Drop or Click Here to Dock as Top Navbar</span>
              </div>
            </div>

            {/* BOTTOM DROP ZONE */}
            <div
              onClick={() => handlePositionChange('bottom')}
              onDragOver={(e) => handleDragOverZone(e, 'bottom')}
              onDragLeave={() => setHoveredDropZone(null)}
              onDrop={(e) => handleDropOnZone(e, 'bottom')}
              className={`pointer-events-auto absolute bottom-0 left-0 right-0 h-24 flex items-center justify-center border-t-4 border-dashed transition-all cursor-pointer ${
                hoveredDropZone === 'bottom'
                  ? 'bg-orange-500/30 border-orange-400 backdrop-blur-md'
                  : 'bg-slate-950/80 border-orange-500/60 backdrop-blur-xs'
              }`}
            >
              <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider">
                <ArrowDown size={20} className="text-orange-400 animate-bounce" />
                <span>Drop or Click Here to Dock as Bottom Taskbar</span>
              </div>
            </div>

            {/* LEFT DROP ZONE */}
            <div
              onClick={() => handlePositionChange('left')}
              onDragOver={(e) => handleDragOverZone(e, 'left')}
              onDragLeave={() => setHoveredDropZone(null)}
              onDrop={(e) => handleDropOnZone(e, 'left')}
              className={`pointer-events-auto absolute top-24 bottom-24 left-0 w-36 flex flex-col items-center justify-center border-r-4 border-dashed transition-all cursor-pointer ${
                hoveredDropZone === 'left'
                  ? 'bg-sky-500/30 border-sky-400 backdrop-blur-md'
                  : 'bg-slate-950/80 border-sky-500/60 backdrop-blur-xs'
              }`}
            >
              <div className="flex flex-col items-center text-center gap-2 text-white font-black text-xs uppercase tracking-wider p-2">
                <ArrowLeft size={22} className="text-sky-400 animate-bounce" />
                <span>Dock Left Sidebar (Collapsed)</span>
              </div>
            </div>

            {/* RIGHT DROP ZONE */}
            <div
              onClick={() => handlePositionChange('right')}
              onDragOver={(e) => handleDragOverZone(e, 'right')}
              onDragLeave={() => setHoveredDropZone(null)}
              onDrop={(e) => handleDropOnZone(e, 'right')}
              className={`pointer-events-auto absolute top-24 bottom-24 right-0 w-36 flex flex-col items-center justify-center border-l-4 border-dashed transition-all cursor-pointer ${
                hoveredDropZone === 'right'
                  ? 'bg-orange-500/30 border-orange-400 backdrop-blur-md'
                  : 'bg-slate-950/80 border-orange-500/60 backdrop-blur-xs'
              }`}
            >
              <div className="flex flex-col items-center text-center gap-2 text-white font-black text-xs uppercase tracking-wider p-2">
                <ArrowRight size={22} className="text-orange-400 animate-bounce" />
                <span>Dock Right Sidebar (Collapsed)</span>
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Container - Optimized for 22" (1920x1080) Screens & Responsive */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Content Outlet - Full wide width without horizontal scroll */}
        <main className={`flex-1 w-full overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6 custom-scrollbar ${navPosition === 'bottom' ? 'pb-28' : ''}`}>
          <div className="w-full max-w-[1920px] mx-auto min-w-0">
            <Outlet />
          </div>
        </main>
        {/* Footer with dynamic version, branding, and links */}
        <Footer />
      </div>

      {/* 4. Non-intrusive Floating Support FAB & Modal (Bottom-Right) */}
      <FloatingSupport />

    </div>
  );
}
