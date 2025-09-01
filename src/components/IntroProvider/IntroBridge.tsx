// src/components/IntroProvider/IntroBridge.tsx
import React, { useContext, useEffect } from 'react';
import { IntroContext, IntroStepType } from './IntroProvider';

// Ez a komponens figyeli a requestAction-t, és például lekezeli a PREPARE_UI lépést
export const IntroBridge: React.FC<{ onPrepareUi?: () => void }> = ({ onPrepareUi }) => {
  const context = useContext(IntroContext);

  useEffect(() => {
    if (!context?.requestAction) return;
    if (context.requestAction.type === IntroStepType.PREPARE_UI) {
      // Itt lehet meghívni egy külső reset/prepare függvényt, pl. panelek csukása, Home tab aktiválása
      if (onPrepareUi) onPrepareUi();
      // A vezérlő (useIntroController) majd nextStep()-et hív, ha kész
    }
    // További lépések, pl. highlight, pointer, később bővíthetők
  }, [context?.requestAction, onPrepareUi]);

  return null;
};
