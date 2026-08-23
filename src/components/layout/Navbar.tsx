import React, { useState } from 'react';
import { Menu, X, Play, LogIn, UserPlus } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { Button } from '../common/Button';

interface NavbarProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onTryDemoClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
  onSignupClick,
  onTryDemoClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#050505]/90 dark:bg-[#050505]/90 light:bg-white/90 border-b border-white/10 dark:border-white/10 light:border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              SDT
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight uppercase text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center">
                Student Digital Twin
                <span className="text-blue-500 text-xs align-top ml-1.5 font-medium lowercase">
                  v3.1
                </span>
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400 dark:text-slate-400 light:text-slate-600">
            <button
              type="button"
              onClick={() => scrollToSection('what-is')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('benefits')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Benefits
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Pricing (₹)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={onTryDemoClick}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-blue-400" /> Try Demo
            </button>
          </nav>

          {/* Action buttons & Theme Toggle */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle id="public-navbar-theme-toggle" />

            <button
              id="navbar-login-btn"
              type="button"
              onClick={onLoginClick}
              className="text-sm px-3.5 py-1.5 text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
            >
              Log In
            </button>

            <Button
              id="navbar-signup-btn"
              variant="white"
              size="sm"
              onClick={onSignupClick}
              className="font-semibold"
            >
              Sign Up
            </Button>
          </div>

          {/* Mobile hamburger & theme toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle id="mobile-navbar-theme-toggle" />
            <button
              id="mobile-nav-toggle-btn"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-white/10 bg-[#050505]/95 dark:bg-[#050505]/95 light:bg-white/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('what-is')}
              className="text-left px-3 py-2 rounded-lg text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/5"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="text-left px-3 py-2 rounded-lg text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/5"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('benefits')}
              className="text-left px-3 py-2 rounded-lg text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/5"
            >
              Benefits
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="text-left px-3 py-2 rounded-lg text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/5"
            >
              Pricing (₹)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-left px-3 py-2 rounded-lg text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/5"
            >
              About / Founder
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-left px-3 py-2 rounded-lg text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-white/5"
            >
              Contact Us
            </button>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <Button
              id="mobile-drawer-try-demo-btn"
              variant="secondary"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onTryDemoClick();
              }}
              leftIcon={<Play className="w-4 h-4 text-blue-400 fill-blue-400" />}
              className="w-full"
            >
              Try Demo Showcase
            </Button>
            <Button
              id="mobile-drawer-login-btn"
              variant="outline"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onLoginClick();
              }}
              className="w-full"
            >
              Log In
            </Button>
            <Button
              id="mobile-drawer-signup-btn"
              variant="white"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onSignupClick();
              }}
              className="w-full"
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

