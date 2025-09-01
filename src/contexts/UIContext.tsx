import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIState {
  showCategoryBar: boolean; // ✅ JAVÍTÁS: false → boolean
  showSourceIcons: boolean; // ✅ JAVÍTÁS: false → boolean
}

interface UIContextType {
  uiState: UIState;
  toggleCategoryBar: () => void;
  toggleSourceIcons: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [uiState, setUIState] = useState<UIState>({
    showCategoryBar: false, // ✅ JAVÍTÁS: true → false (alapértelmezett KI)
    showSourceIcons: false, // ✅ JAVÍTÁS: true → false (alapértelmezett KI)
  });

  const toggleCategoryBar = () => {
    setUIState((prev) => ({
      ...prev,
      showCategoryBar: !prev.showCategoryBar,
    }));
    console.log('Kategória sáv állapot változott:', !uiState.showCategoryBar);
  };

  const toggleSourceIcons = () => {
    setUIState((prev) => ({
      ...prev,
      showSourceIcons: !prev.showSourceIcons,
    }));
    console.log('Forrás ikonok állapot változott:', !uiState.showSourceIcons);
  };

  return (
    <UIContext.Provider
      value={{
        uiState,
        toggleCategoryBar,
        toggleSourceIcons,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
