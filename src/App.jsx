
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ControlPanel } from './components/ControlPanel';
import { GenerationPanel } from './components/GenerationPanel';
import { ResultPanel } from './components/ResultPanel';
import { performChange } from './lib/iching';

function App() {
  const { t, i18n } = useTranslation();
  // Game State
  const [lines, setLines] = useState([]); // Array of 0-6 numbers
  const [currentStalks, setCurrentStalks] = useState(49); // Starts at 49 (after Taiji removed)
  const [changeCount, setChangeCount] = useState(0); // 0, 1, 2
  const [history, setHistory] = useState([]); // Log of steps for debug/display

  // Handlers
  const handleSplit = (ratio) => {
    if (lines.length >= 6) return;

    // Perform one change
    const result = performChange(currentStalks, ratio);

    // Update state
    const nextStalks = result.remaining;
    const nextChangeCount = changeCount + 1;

    setHistory(prev => [...prev, result]);

    if (nextChangeCount === 3) {
      // Line Complete!
      const lineValue = nextStalks / 4;
      setLines(prev => [...prev, lineValue]);

      // Reset for next line (start with 49 again)
      setCurrentStalks(49);
      setChangeCount(0);
    } else {
      // Continue to next change
      setCurrentStalks(nextStalks);
      setChangeCount(nextChangeCount);
    }
  };

  const handleReset = () => {
    setLines([]);
    setCurrentStalks(49);
    setChangeCount(0);
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-stone-100 p-4 font-sans text-stone-900 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-4 flex justify-between items-center px-2">
        <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-wide">
          {t("app.title")} <span className="text-stone-500 font-sans font-normal text-sm ml-2">{t("app.subtitle")}</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-xs text-stone-500 font-mono">
            {lines.length < 6
              ? t("app.status", { line: lines.length + 1, change: changeCount + 1 })
              : t("app.complete")}
          </div>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh-TW' : 'en')}
            className="text-xs font-semibold px-2 py-1 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 transition"
          >
            {i18n.language === 'en' ? '繁體中文' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="w-full max-w-6xl flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-6rem)]">

        {/* Left Column (Desktop) / Top (Mobile): Control Panel */}
        <div className="h-[50vh] lg:h-full order-1">
          <ControlPanel
            stalksCount={currentStalks}
            onSplit={handleSplit}
            onReset={handleReset}
          />
        </div>

        {/* Right Column (Desktop) / Bottom (Mobile) */}
        <div className="h-full flex flex-col gap-4 order-2">

          {/* Top Right: Generation Panel */}
          <div className="flex-1 min-h-[300px]">
            <GenerationPanel
              lines={lines}
              currentChange={changeCount}
              currentStalks={currentStalks}
            />
          </div>

          {/* Bottom Right: Result Panel */}
          <div className="flex-1 min-h-[200px]">
            <ResultPanel lines={lines} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
