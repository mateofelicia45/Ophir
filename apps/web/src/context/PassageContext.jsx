import { createContext, useContext, useMemo, useState } from 'react';

const PassageContext = createContext(null);

export function PassageProvider({ children }) {
  const [passage, setPassage] = useState({
    book: 'Génesis',
    chapter: 1,
    verseStart: 1,
    verseEnd: null,
  });

  const value = useMemo(
    () => ({
      passage,
      setPassage,
      goToReference: (book, chapter, verseStart = null, verseEnd = null) =>
        setPassage({ book, chapter, verseStart, verseEnd }),
    }),
    [passage]
  );

  return <PassageContext.Provider value={value}>{children}</PassageContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function usePassage() {
  const ctx = useContext(PassageContext);
  if (!ctx) throw new Error('usePassage debe usarse dentro de PassageProvider');
  return ctx;
}
