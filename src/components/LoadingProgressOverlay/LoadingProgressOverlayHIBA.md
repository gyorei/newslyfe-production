🎯 Mi történik valójában?
Az ugrást nem a timestamp() vagy az új log tartalom okozza, hanem:

A TerminalTypewriterStream komponens valószínűleg folyamatosan lefelé görgeti a logArea-t (pl. .scrollTop = scrollHeight minden új karakter után).

Amikor az animáció befejeződik, és átváltunk "complete" fázisra, a logArea tartalma (vagy stílusa) változik:

vagy új pre blokk kerül be,

vagy más DOM-struktúra,

vagy megszűnik az auto-scroll,

Ezáltal a scroll-top újrapozicionálódik, és vizuálisan "visszaugrik" a tetejére vagy hirtelen "megáll".

✅ Megoldás: görgetés finom kézben tartása
🧠 Cél:
A TerminalTypewriterStream alatt scroll automatikusan kövesse az írást.

De ha "complete" fázisra váltunk, akkor a scroll ne ugráljon → ne írjuk felül kézzel.

A görgetés legyen smooth és stabil, ne triggereljen DOM-újrapozicionálást.

🔧 1. Használj scrollIntoView helyett requestAnimationFrame-es görgetést
A TerminalTypewriterStream.tsx komponensben (ha nálad van scrollolás), javaslom ezt a mintát:

tsx
Másolás
Szerkesztés
useEffect(() => {
  const scroll = () => {
    const el = containerRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  scroll();
}, [currentLineIndex]); // vagy [visibleLines.length]
Ez biztosítja, hogy a görgetés lágy legyen, és ne triggerezzen reflow-ot hirtelen.

🔧 2. complete fázisnál NE görgess újra
A LoadingProgressOverlay.tsx-ben ezt tedd biztossá:

tsx
Másolás
Szerkesztés
{animationPhase.phase !== "cursor" && (
  <div className={styles.logArea} ref={logRef}>
    <TerminalTypewriterStream
      lines={allLines}
      speed={2}
      delay={0}
      className={styles.systemMessage}
      onComplete={() => setAnimationPhase({ phase: "complete" })}
    />
    {animationPhase.phase === "complete" && <BlinkingCursor show char="▌" />}
  </div>
)}
Így ugyanaz a DOM marad, és a React nem dobja el a div-et → scroll pozíció megmarad.

💡 Alternatíva: scroll-behavior: smooth
A CSS-ben beállíthatod:

css
Másolás
Szerkesztés
.logArea {
  scroll-behavior: smooth;
}
Ez vizuálisan tompítja az esetleges ugrást.

✅ Összegzés
Helyzet	Javaslat
Automatikus scroll okoz ugrást	requestAnimationFrame-es scrollTop
complete fázisnál új DOM jön létre → ugrik	Ugyanaz a div, csak belső tartalom frissüljön
Scroll-pozíció megőrzése	Ne töröld a ref, ne cserélj key-t, ne cserélj pre blokkot

Ha megmutatod a TerminalTypewriterStream.tsx kódot, szívesen rá is nézek célzottan! Ott történik a scrollolás valószínűleg.