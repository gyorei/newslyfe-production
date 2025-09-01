import { useEffect, useContext } from 'react';
import { IntroContext, IntroStepType } from './IntroProvider';

// Guided Tour lépések: csak az alaphelyzetbe állítás (PREPARE_UI)
const tourSteps = [
  {
    type: IntroStepType.PREPARE_UI,
    message: 'Az alkalmazás alaphelyzetbe állítása az intróhoz...'
  }
  // További lépések később bővíthetők
];

export const useIntroController = () => {
  const context = useContext(IntroContext);
  if (!context) {
    throw new Error('useIntroController must be used within an IntroProvider');
  }
  const { isIntroActive, currentStep, setRequestAction, endIntro, startIntro } = context;

  // FŐ SZABÁLY: Első indításkor kötelező intró, utána csak explicit kérésre!
  useEffect(() => {
    const introShownOnce = localStorage.getItem('intro_shown_once');
    const shouldShowIntro = localStorage.getItem('show_intro_on_startup') === 'true';

    if (!introShownOnce) {
      // Első indítás: intró indul, flag beállítása
      startIntro();
      localStorage.setItem('intro_shown_once', 'true');
      localStorage.setItem('show_intro_on_startup', 'false');
    } else if (shouldShowIntro) {
      // Csak explicit kérésre indul újra
      startIntro();
      localStorage.setItem('show_intro_on_startup', 'false');
    }
  }, [startIntro]);

  useEffect(() => {
    if (!isIntroActive) return;
    if (currentStep < tourSteps.length) {
      setRequestAction(tourSteps[currentStep]);
    } else {
      setRequestAction(null);
      endIntro();
    }
  }, [isIntroActive, currentStep, setRequestAction, endIntro]);
};
