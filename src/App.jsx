
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ControlPanel } from './components/ControlPanel';
import { GenerationPanel } from './components/GenerationPanel';
import { ResultPanel } from './components/ResultPanel';
import { performChange } from './lib/iching';

function App() {
  const { t, i18n } = useTranslation();
  // Game State
  const [gameState, setGameState] = useState({
    lines: [],          // Array of 0-6 numbers
    currentStalks: 49,  // Starts at 49 (after Taiji removed)
    changeCount: 0,     // 0, 1, 2
    history: []         // Log of steps for debug/display
  });
  const [isStarted, setIsStarted] = useState(false);
  const [question, setQuestion] = useState("");

  const { lines, currentStalks, changeCount, history } = gameState;

  // Handlers
  const handleSplit = (ratio) => {
    setGameState(prev => {
      if (prev.lines.length >= 6) return prev;

      // Perform one change
      const result = performChange(prev.currentStalks, ratio);

      // Update state
      const nextStalks = result.remaining;
      const nextChangeCount = prev.changeCount + 1;

      if (nextChangeCount === 3) {
        // Line Complete!
        const lineValue = nextStalks / 4;
        return {
          lines: [...prev.lines, lineValue],
          currentStalks: 49,
          changeCount: 0,
          history: [...prev.history, result]
        };
      } else {
        // Continue to next change
        return {
          ...prev,
          currentStalks: nextStalks,
          changeCount: nextChangeCount,
          history: [...prev.history, result]
        };
      }
    });
  };

  const handleReset = () => {
    setGameState({
      lines: [],
      currentStalks: 49,
      changeCount: 0,
      history: []
    });
    setIsStarted(false);
    setQuestion("");
  };

  return (
    <div className="min-h-screen bg-stone-100 p-4 font-sans text-stone-900 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-4 flex justify-between items-center px-2">
        <h1 className="text-2xl font-sans font-bold text-stone-800 tracking-wide">
          {t("app.title")} <span className="text-stone-500 font-sans font-normal text-sm ml-2">{t("app.subtitle")}</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-xs text-stone-500 font-mono hidden">
            {/* Moved to ControlPanel */}
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
      {!isStarted ? (
        <main className="w-full flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-stone-800 mb-4">{t("app.askQuestion", "請問您想占卜什麼？")}</h2>
            <div className="mb-6">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("app.questionPlaceholder", "例如：明天的面試會順利嗎？")}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-inner text-stone-700"
                autoFocus
              />
            </div>
            <button
              onClick={() => setIsStarted(true)}
              className="w-full py-3 bg-amber-700 text-white rounded-lg font-bold text-lg hover:bg-amber-600 transition shadow-md"
            >
              {t("app.startDivination", "開始起卦")}
            </button>
          </div>
        </main>
      ) : (
        <main className="w-full max-w-6xl flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:h-[calc(100vh-6rem)] lg:min-h-0 pb-8 lg:pb-0">

          {/* Left Column (Desktop) / Top (Mobile): Control Panel */}
          <div className="h-[50vh] min-h-[400px] shrink-0 lg:h-full order-1 lg:min-h-0">
            <ControlPanel
              stalksCount={currentStalks}
              lines={lines}
              changeCount={changeCount}
              onSplit={handleSplit}
              onReset={handleReset}
            />
          </div>

          {/* Right Column (Desktop) / Bottom (Mobile) */}
          <div className="flex flex-col gap-4 order-2 shrink-0 lg:h-full lg:min-h-0">

            {/* Top Right: Generation Panel */}
            <div className={lines.length === 6 ? "shrink-0" : "shrink-0 lg:flex-1 lg:min-h-[240px]"}>
              <GenerationPanel
                lines={lines}
                currentChange={changeCount}
                currentStalks={currentStalks}
              />
            </div>

            {/* Bottom Right: Result Panel */}
            <div className="flex-1 shrink-0 lg:min-h-0">
              <ResultPanel lines={lines} question={question} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
