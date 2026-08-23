/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Code2,
  FolderGit2,
  Award,
  Target,
  BarChart3,
} from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DemoProvider, useDemo } from './contexts/DemoContext';
import { StudentTwinProvider } from './contexts/StudentTwinContext';
import { NavTab, UserProfile } from './types';

// Layout
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Landing Sections
import { HeroSection } from './components/landing/HeroSection';
import { WhatIsSection } from './components/landing/WhatIsSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { CoreBenefitsSection } from './components/landing/CoreBenefitsSection';
import { AiIntelligencePreview } from './components/landing/AiIntelligencePreview';
import { ProfilePreview } from './components/landing/ProfilePreview';
import { ReadinessPreview } from './components/landing/ReadinessPreview';
import { PricingPreview } from './components/landing/PricingPreview';
import { FounderSection } from './components/landing/FounderSection';
import { ContactSection } from './components/landing/ContactSection';

// Auth Components
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';

// Demo Components
import { DemoBanner } from './components/demo/DemoBanner';
import { DemoShowcase } from './components/demo/DemoShowcase';

// Dashboard Components
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { Sidebar } from './components/dashboard/Sidebar';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { ProfileFoundation } from './components/dashboard/ProfileFoundation';
import { StudentProfilesManager } from './components/dashboard/StudentProfilesManager';
import { SkillsManager } from './components/dashboard/SkillsManager';
import { ProjectsManager } from './components/dashboard/ProjectsManager';
import { AchievementsManager } from './components/dashboard/AchievementsManager';
import { CareerGoalsManager } from './components/dashboard/CareerGoalsManager';
import { AiCareerAssistant } from './components/dashboard/AiCareerAssistant';
import { ProjectAnalyzer } from './components/dashboard/ProjectAnalyzer';
import { GitHubReadiness } from './components/dashboard/GitHubReadiness';
import { LinkedInReadiness } from './components/dashboard/LinkedInReadiness';
import { ResumeBuilder } from './components/dashboard/ResumeBuilder';
import { ResumeAnalyzer } from './components/dashboard/ResumeAnalyzer';
import { SyllabusAnalyzer } from './components/dashboard/SyllabusAnalyzer';
import { CareerRoadmap } from './components/dashboard/CareerRoadmap';
import { InternshipReadiness } from './components/dashboard/InternshipReadiness';
import { CareerSimulator } from './components/dashboard/CareerSimulator';
import { SettingsView } from './components/dashboard/SettingsView';
import { SubscriptionView } from './components/dashboard/SubscriptionView';
import { PartPlaceholder } from './components/dashboard/PartPlaceholder';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainAppContent: React.FC = () => {
  const { user, profile, isAuthenticated, isLoading: isAuthLoading, signOut } = useAuth();
  const { isDemoMode, enterDemo, exitDemo, demoProfile } = useDemo();

  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center text-[var(--text-primary)]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-xs font-mono text-[var(--text-muted)]">
          Initializing Student Digital Twin OS...
        </p>
      </div>
    );
  }

  // Handle Demo Mode View
  if (isDemoMode) {
    const demoUserProfile: UserProfile = {
      id: demoProfile.id,
      email: 'founder@studenttwin.demo',
      fullName: demoProfile.fullName,
      university: demoProfile.university,
      program: demoProfile.program,
      year: demoProfile.year,
      careerGoal: demoProfile.careerGoal,
      plan: 'pro',
      createdAt: new Date().toISOString(),
    };

    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors flex flex-col">
        <DemoBanner onCreateAccount={() => { exitDemo(); setCurrentView('signup'); }} />
        <DashboardHeader
          userProfile={demoUserProfile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={exitDemo}
          isDemo
        />

        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={exitDemo}
            isDemo
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <DashboardHome
                  userProfile={demoUserProfile}
                  onNavigate={setActiveTab}
                  isDemo
                />
                <DemoShowcase />
              </div>
            )}
            {activeTab === 'profile' && (
              <ProfileFoundation userProfile={demoUserProfile} isDemo />
            )}
            {activeTab === 'students' && (
              <StudentProfilesManager isDemo />
            )}
            {activeTab === 'skills' && (
              <SkillsManager isDemo />
            )}
            {activeTab === 'projects' && (
              <ProjectsManager isDemo />
            )}
            {activeTab === 'achievements' && (
              <AchievementsManager isDemo />
            )}
            {activeTab === 'career-goals' && (
              <CareerGoalsManager isDemo />
            )}
            {activeTab === 'assistant' && (
              <ErrorBoundary featureName="AI Career Assistant">
                <AiCareerAssistant isDemo />
              </ErrorBoundary>
            )}
            {activeTab === 'project-analyzer' && (
              <ProjectAnalyzer isDemo />
            )}
            {activeTab === 'github-readiness' && (
              <ErrorBoundary featureName="GitHub Readiness">
                <GitHubReadiness isDemo />
              </ErrorBoundary>
            )}
            {activeTab === 'linkedin-readiness' && (
              <LinkedInReadiness isDemo />
            )}
            {activeTab === 'resume-builder' && (
              <ResumeBuilder isDemo />
            )}
            {activeTab === 'resume-analyzer' && (
              <ResumeAnalyzer isDemo />
            )}
            {activeTab === 'syllabus-analyzer' && (
              <SyllabusAnalyzer isDemo />
            )}
            {activeTab === 'career-roadmap' && (
              <CareerRoadmap isDemo />
            )}
            {activeTab === 'internship-readiness' && (
              <InternshipReadiness isDemo />
            )}
            {(activeTab === 'career-simulator' || activeTab === 'analytics') && (
              <CareerSimulator isDemo />
            )}
            {activeTab === 'subscription' && (
              <SubscriptionView userProfile={demoUserProfile} isDemo />
            )}
            {activeTab === 'settings' && (
              <SettingsView userProfile={demoUserProfile} onLogout={exitDemo} isDemo />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Handle Authenticated User Dashboard
  if (isAuthenticated && user) {
    const userProfile: UserProfile = profile || {
      id: user.id,
      email: user.email || 'student@university.edu',
      fullName: user.user_metadata?.full_name || 'Student User',
      university: '',
      degree: '',
      branch: '',
      program: '',
      year: '',
      careerGoal: '',
      targetRole: '',
      plan: 'free',
      createdAt: user.created_at || new Date().toISOString(),
    };

    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors flex flex-col">
        <DashboardHeader
          userProfile={userProfile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={signOut}
        />

        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={signOut}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <DashboardHome
                userProfile={userProfile}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileFoundation userProfile={userProfile} />
            )}
            {activeTab === 'students' && (
              <StudentProfilesManager />
            )}
            {activeTab === 'skills' && (
              <SkillsManager />
            )}
            {activeTab === 'projects' && (
              <ProjectsManager />
            )}
            {activeTab === 'achievements' && (
              <AchievementsManager />
            )}
            {activeTab === 'career-goals' && (
              <CareerGoalsManager />
            )}
            {activeTab === 'assistant' && (
              <ErrorBoundary featureName="AI Career Assistant">
                <AiCareerAssistant />
              </ErrorBoundary>
            )}
            {activeTab === 'project-analyzer' && (
              <ProjectAnalyzer />
            )}
            {activeTab === 'github-readiness' && (
              <ErrorBoundary featureName="GitHub Readiness">
                <GitHubReadiness />
              </ErrorBoundary>
            )}
            {activeTab === 'linkedin-readiness' && (
              <LinkedInReadiness />
            )}
            {activeTab === 'resume-builder' && (
              <ResumeBuilder />
            )}
            {activeTab === 'resume-analyzer' && (
              <ResumeAnalyzer />
            )}
            {activeTab === 'syllabus-analyzer' && (
              <SyllabusAnalyzer />
            )}
            {activeTab === 'career-roadmap' && (
              <CareerRoadmap />
            )}
            {activeTab === 'internship-readiness' && (
              <InternshipReadiness />
            )}
            {(activeTab === 'career-simulator' || activeTab === 'analytics') && (
              <CareerSimulator />
            )}
            {activeTab === 'subscription' && (
              <SubscriptionView userProfile={userProfile} />
            )}
            {activeTab === 'settings' && (
              <SettingsView userProfile={userProfile} onLogout={signOut} />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Handle Full-Screen Login View
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex items-center justify-center p-4">
        <LoginForm
          onSwitchToSignup={() => setCurrentView('signup')}
          onForgotPassword={() => setIsForgotPasswordOpen(true)}
          onBackToHome={() => setCurrentView('landing')}
        />
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      </div>
    );
  }

  // Handle Full-Screen Signup View
  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex items-center justify-center p-4">
        <SignupForm
          onSwitchToLogin={() => setCurrentView('login')}
          onBackToHome={() => setCurrentView('landing')}
        />
      </div>
    );
  }

  // Public Landing Page
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      <Navbar
        onLoginClick={() => setCurrentView('login')}
        onSignupClick={() => setCurrentView('signup')}
        onTryDemoClick={enterDemo}
      />

      <main>
        <HeroSection
          onBuildTwin={() => setCurrentView('signup')}
          onTryDemo={enterDemo}
          onLogin={() => setCurrentView('login')}
        />
        <WhatIsSection />
        <HowItWorksSection />
        <CoreBenefitsSection />
        <AiIntelligencePreview />
        <ProfilePreview />
        <ReadinessPreview />
        <PricingPreview
          onSelectPlan={() => setCurrentView('signup')}
          onTryDemo={enterDemo}
        />
        <FounderSection />
        <ContactSection />
      </main>

      <Footer
        onLoginClick={() => setCurrentView('login')}
        onSignupClick={() => setCurrentView('signup')}
        onTryDemoClick={enterDemo}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <StudentTwinProvider>
            <MainAppContent />
          </StudentTwinProvider>
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
