import React, { createContext, useState, useCallback, useContext } from 'react';

// Guided Tour lépéstípusok
export enum IntroStepType {
  NONE = 'none',
  PREPARE_UI = 'prepare_ui', // ÚJ: UI alaphelyzetbe állítása
  HIGHLIGHT = 'highlight',
  POINTER = 'pointer',
  CLICK = 'click',
  CUSTOM = 'custom',
}

// Egy Guided Tour akció (javaslat)
export interface IntroAction {
  type: IntroStepType;
  targetId?: string;
  pointer?: { x: number; y: number };
  message?: string;
}

interface IntroContextType {
  isIntroActive: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  requestAction: IntroAction | null;
  setRequestAction: (action: IntroAction | null) => void;
  startIntro: () => void;
  endIntro: () => void;
  nextStep: () => void;
}

export const IntroContext = createContext<IntroContextType | undefined>(undefined);

export const IntroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [requestAction, setRequestAction] = useState<IntroAction | null>(null);

  const startIntro = useCallback(() => {
    setIsIntroActive(true);
    setCurrentStep(0);
  }, []);

  const endIntro = useCallback(() => {
    setIsIntroActive(false);
    setCurrentStep(0);
    setRequestAction(null);
    localStorage.setItem('show_intro_on_startup', 'false');
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const value = {
    isIntroActive,
    currentStep,
    setCurrentStep,
    requestAction,
    setRequestAction,
    startIntro,
    endIntro,
    nextStep,
  };
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
};

export const useIntro = () => {
  const context = useContext(IntroContext);
  if (context === undefined) {
    throw new Error('useIntro must be used within an IntroProvider');
  }
  return context;
};
