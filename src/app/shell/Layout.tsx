import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ConvertibleNav, NavPosition } from './ConvertibleNav';
import { Footer } from './Footer';
import { FloatingSupport } from './FloatingSupport';
import { GlobalBreadcrumbs } from './GlobalBreadcrumbs';
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

  // Collapsed state: open by default when in sidebar mode (Requirement 6: Keep default sidebar open)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dragging state for 4-way drop zones
  const [isDraggingNav, setIsDraggingNav] = useState(false);
  const [hoveredDropZone, setHoveredDropZone] = useState<NavPosition | null>(null);

  // Switch position and persist
  const handlePositionChange = (newPos: NavPosition) => {
    setNavPosition(newPos);
    localStorage.setItem('3ddx-cp-nav-position', newPos);
    if (newPos === 'left' || newPos === 'right') {
      // Keep open by default when docked to sidebar
      setSidebarCollapsed(false);
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
                  ? 'bg-indigo-500/30 border-indigo-400 backdrop-blur-md'
                  : 'bg-slate-950/80 border-indigo-500/60 backdrop-blur-xs'
              }`}
            >
              <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider">
                <ArrowDown size={20} className="text-indigo-400 animate-bounce" />
                <span>Drop or Click Here to Dock as Bottom Taskbar</span>
              </div>
            </div>

            {/* LEFT DROP ZONE */}
            <div
              onClick={() => handlePositionChange('left')}
              onDragOver={(e) => handleDragOverZone(e, 'left')}
              onDragLeave={() => setHoveredDropZone(null)}
              onDrop={(e) => handleDropOnZone(e, 'left')}
              className={`pointer-events-auto absolute top-0 bottom-0 left-0 w-28 flex items-center justify-center border-r-4 border-dashed transition-all cursor-pointer ${
                hoveredDropZone === 'left'
                  ? 'bg-cyan-500/30 border-cyan-400 backdrop-blur-md'
                  : 'bg-slate-950/80 border-cyan-500/60 backdrop-blur-xs'
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-white font-black text-xs uppercase tracking-wider text-center p-2">
                <ArrowLeft size={20} className="text-cyan-400 animate-bounce" />
                <span>Dock Left Sidebar (Open)</span>
              </div>
            </div>

            {/* RIGHT DROP ZONE */}
            <div
              onClick={() => handlePositionChange('right')}
              onDragOver={(e) => handleDragOverZone(e, 'right')}
              onDragLeave={() => setHoveredDropZone(null)}
              onDrop={(e) => handleDropOnZone(e, 'right')}
              className={`pointer-events-auto absolute top-0 bottom-0 right-0 w-28 flex items-center justify-center border-l-4 border-dashed transition-all cursor-pointer ${
                hoveredDropZone === 'right'
                  ? 'bg-purple-500/30 border-purple-400 backdrop-blur-md'
                  : 'bg-slate-950/80 border-purple-500/60 backdrop-blur-xs'
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-white font-black text-xs uppercase tracking-wider text-center p-2">
                <ArrowRight size={20} className="text-purple-400 animate-bounce" />
                <span>Dock Right Sidebar (Open)</span>
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Container - Responsive Scroll Flow with Footer Accessibility */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen overflow-x-hidden overflow-y-auto custom-scrollbar">
        {/* Content Outlet - Full wide width without horizontal scroll */}
        <main className="flex-1 w-full p-3 sm:p-5 lg:p-6">
          <div className="w-full max-w-[1920px] mx-auto min-w-0">
            <GlobalBreadcrumbs />
            <Outlet />
          </div>
        </main>
        {/* Footer with dynamic version, branding, and links */}
        <Footer navPosition={navPosition} />
        {/* Dedicated bottom clearance spacer when docked at bottom (Tier 1 56px + Tier 2 44px + 8px margin) */}
        {navPosition === 'bottom' && (
          <div
            data-testid="bottom-dock-spacer"
            className="h-[108px] w-full shrink-0 select-none pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      {/* 4. Non-intrusive Floating Support FAB & Modal (Bottom-Right, offset when dock is bottom) */}
      <FloatingSupport navPosition={navPosition} />

    </div>
  );
}
