import React from 'react';
import {
  ArrowRight,
  Play,
  Cpu,
  Shield,
  Sparkles,
  Database,
  CheckCircle2,
  Globe,
  ExternalLink,
  FolderGit2,
  Linkedin,
} from 'lucide-react';
import { Button } from '../common/Button';

interface HeroSectionProps {
  onBuildTwin: () => void;
  onTryDemo: () => void;
  onLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBuildTwin,
  onTryDemo,
  onLogin,
}) => {
  return (
    <section id="hero" className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 w-fit">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Foundation Stage Active
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-100 dark:text-slate-100 light:text-slate-900 mb-6">
              Your AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Student Career
              </span>{' '}
              <br />
              Readiness OS
            </h1>

            <p className="text-base sm:text-lg text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed max-w-xl mb-8">
              Construct your professional digital replica. Analyze living skills, visualize verifiable project proofs, and leverage AI career intelligence to secure high-growth opportunities.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                id="hero-build-twin-btn"
                type="button"
                onClick={onBuildTwin}
                className="px-6 sm:px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base rounded-lg shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                Build Your Student Twin
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-try-demo-btn"
                type="button"
                onClick={onTryDemo}
                className="px-6 sm:px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm sm:text-base rounded-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-blue-400 fill-blue-400" />
                Try Demo
              </button>

              <button
                id="hero-login-btn"
                type="button"
                onClick={onLogin}
                className="px-5 py-3.5 text-slate-400 hover:text-white font-medium text-sm transition-colors cursor-pointer"
              >
                Log In →
              </button>
            </div>

            {/* Quick Metrics Ticker */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 sm:gap-10 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Fake Metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Supabase Secure Auth</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Indian Rupee (₹) Pricing</span>
              </div>
            </div>
          </div>

          {/* Right Column: High Density Digital Twin Telemetry Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full max-w-md bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-slate-200 rounded-2xl p-6 shadow-2xl z-10 text-left">
              {/* Profile Header */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-white/10 dark:border-white/10 light:border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                    VS
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center gap-2">
                      Sri charan Vangala
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        DEMO
                      </span>
                    </h3>
                    <p className="text-xs text-blue-400 font-medium">AI/ML Engineer • 2nd Year B.Tech</p>
                    <p className="text-[11px] text-slate-500">Marwadi University</p>
                  </div>
                </div>
              </div>

              {/* Demo External Profiles & Portfolio */}
              <div className="mb-5 space-y-2">
                <a
                  id="hero-demo-portfolio-link"
                  href="https://vangala-sricharan-portfolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs text-blue-300 hover:text-blue-200 transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Globe className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Demo Portfolio</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-bold">
                    <span>View Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    id="hero-demo-github-link"
                    href="https://github.com/Vangala-sricharan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-medium truncate">
                      <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">GitHub Profile</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </a>

                  <a
                    id="hero-demo-linkedin-link"
                    href="https://www.linkedin.com/in/sri-charan-vangala-a7453b384/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-medium truncate">
                      <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate">LinkedIn Profile</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </a>
                </div>
              </div>

              <div className="space-y-5">
                {/* Readiness Gauge */}
                <div>
                  <div className="flex justify-between text-xs mb-2 uppercase font-bold tracking-tight">
                    <span className="text-slate-400">Career Readiness Score</span>
                    <span className="text-blue-400 font-mono">84%</span>
                  </div>
                  <div className="h-2 bg-white/10 dark:bg-white/10 light:bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 w-[84%] rounded-full"></div>
                  </div>
                </div>

                {/* High Density Metric Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 dark:bg-white/5 light:bg-slate-50 border border-white/5 dark:border-white/5 light:border-slate-200 rounded-xl">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">
                      Skills Verified
                    </p>
                    <p className="text-2xl font-mono font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      12
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 dark:bg-white/5 light:bg-slate-50 border border-white/5 dark:border-white/5 light:border-slate-200 rounded-xl">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">
                      Project Index
                    </p>
                    <p className="text-2xl font-mono font-bold text-emerald-400 font-mono">
                      A+
                    </p>
                  </div>
                </div>

                {/* AI Insight Box */}
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <h4 className="text-[11px] font-bold text-blue-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    AI Career Insight
                  </h4>
                  <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-normal italic">
                    "Profile exhibits strong foundation in Neural Networks & PyTorch. Recommendation: Target Q3 internship focusing on specialized LLM architectures."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

