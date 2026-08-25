import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

export const DEMO_PROFILE: UserProfile = {
  id: 'demo-creator-showcase',
  email: 'vangalasricharan7@gmail.com',
  fullName: 'Vangala Sricharan',
  plan: 'pro',
  university: 'Marwadi University',
  program: 'B.Tech Computer Science & Engineering (AI/ML)',
  year: '2nd Year',
  careerGoal: 'AI/ML Engineer',
  createdAt: new Date().toISOString(),
  isDemo: true,
};

interface DemoContextType {
  isDemoMode: boolean;
  demoProfile: UserProfile;
  enterDemo: () => void;
  exitDemo: () => void;
  updateDemoProfile: (data: Partial<UserProfile>) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return sessionStorage.getItem('sdt_demo_mode') === 'true';
  });
  const [demoProfile, setDemoProfile] = useState<UserProfile>(DEMO_PROFILE);

  useEffect(() => {
    if (isDemoMode) {
      sessionStorage.setItem('sdt_demo_mode', 'true');
    } else {
      sessionStorage.removeItem('sdt_demo_mode');
    }
  }, [isDemoMode]);

  const enterDemo = () => {
    setIsDemoMode(true);
  };

  const exitDemo = () => {
    setIsDemoMode(false);
  };

  const updateDemoProfile = (data: Partial<UserProfile>) => {
    setDemoProfile((prev) => ({ ...prev, ...data }));
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoProfile,
        enterDemo,
        exitDemo,
        updateDemoProfile,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
