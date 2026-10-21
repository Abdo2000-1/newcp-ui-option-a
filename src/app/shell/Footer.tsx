import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ExternalLink
} from 'lucide-react';
import { useAppConfig } from '@/app/providers/contexts/ConfigContext';

export function Footer() {
  const { config } = useAppConfig();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-sky-100/90 dark:bg-[#0a1b32]/92 backdrop-blur-md border-t border-sky-300/60 dark:border-sky-800/60 shadow-xs mt-auto py-5 px-4 sm:px-6 lg:px-8 text-xs select-none">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand, Logo & Left Section */}
        <div className="flex flex-wrap items-center gap-3">
          <NavLink to="/dashboard" className="flex items-center gap-2 group" title="3D Diagnostix Cloud ERP">
            <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white tracking-tighter text-sm">
              <span className="text-base font-black">3D</span>
              <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">Diagnostix</span>
              <span className="text-[10px] text-slate-400 font-mono">.COM</span>
            </div>
          </NavLink>
        </div>

        {/* Center: Legal & Help Links + Copyright */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-5 text-slate-600 dark:text-slate-400 font-medium text-xs">
            <a
              href={config.links.documentationUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              FAQ
            </a>
            <a
              href={config.links.termsOfServiceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Terms
            </a>
            <a
              href={config.links.privacyPolicyUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Privacy
            </a>
            <a
              href={`mailto:${config.links.supportEmail}`}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Contact
            </a>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
            Copyright © {currentYear} -3D Diagnostix,Inc. - All Rights Reserved
          </div>
        </div>

        {/* Right: Circular Social Media Icons Matching Image 4 (Offset for Floating Support FAB) */}
        <div className="flex items-center gap-2 pr-12 md:pr-14">
          {/* Facebook */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:border-sky-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-600 hover:border-red-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          {/* X (formerly Twitter) */}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-pink-600 hover:border-pink-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
