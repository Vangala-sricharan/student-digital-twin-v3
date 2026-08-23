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
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return sessionStorage.getItem('sdt_demo_mode') === 'true';
  });

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

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoProfile: DEMO_PROFILE,
        enterDemo,
        exitDemo,
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
