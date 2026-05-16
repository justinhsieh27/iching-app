
import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { OLD_YIN, OLD_YANG, YOUNG_YIN, YOUNG_YANG } from '../lib/iching';

export function GenerationPanel({ lines, currentStalks }) {
    const { t } = useTranslation();
    // Lines are drawn bottom to top.
    // We use flex-col-reverse to render index 0 at the bottom.

    return (
        <div className={clsx("bg-white p-4 rounded-xl shadow-sm flex flex-col items-center border border-stone-200 overflow-hidden relative transition-all", lines.length === 6 ? "h-auto" : "h-full")}>
            <h2 className="text-lg sm:text-xl font-sans font-bold text-stone-800 mb-2 shrink-0">{t("generation.title")}</h2>

            <div className={clsx("flex flex-col-reverse justify-center gap-1 sm:gap-2 w-full max-w-[300px] pl-10 pr-2 py-2", lines.length === 6 ? "h-[240px]" : "flex-1 min-h-0")}>
                {/* Placeholders for 6 lines */}
                {[0, 1, 2, 3, 4, 5].map((index) => {
                    const lineVal = lines[index];

                    return (
                        <div key={index} className="w-full flex-1 max-h-12 min-h-[1.5rem] flex items-center justify-center relative">
                            <span className="absolute -left-8 text-xs text-stone-400 font-mono flex items-center justify-center w-6">
                                {index + 1}
                            </span>

                            {lineVal === undefined ? (
                                // Empty slot
                                <div className="w-full h-full border-2 border-dashed border-stone-100 rounded bg-stone-50/50" />
                            ) : (
                                <LineVisual value={lineVal} />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-2 text-center h-12 shrink-0 flex flex-col justify-center">
                {lines.length < 6 && (
                    <div className="text-stone-500 font-medium text-sm animate-pulse">
                        {t("generation.generating", { line: lines.length + 1 })} <br />
                        <span className="text-xs font-normal opacity-75">
                            {t("generation.stalks", { count: currentStalks })}
                        </span>
                    </div>
                )}
                {lines.length === 6 && (
                    <div className="text-emerald-600 font-bold text-sm sm:text-base">
                        {t("generation.complete")}
                    </div>
                )}
            </div>
        </div>
    );
}

function LineVisual({ value }) {
    // 7, 9 -> Yang (Solid)
    // 6, 8 -> Yin (Broken)
    const isYang = value === YOUNG_YANG || value === OLD_YANG;
    const isChanging = value === OLD_YIN || value === OLD_YANG;

    return (
        <div className="w-full flex items-center justify-center relative group">
            {/* Background/Base Line */}
            <div className={clsx(
                "h-4 w-full flex items-center justify-between",
                // Changing lines get a highlight or distinct color
                isChanging ? "opacity-100" : "opacity-90"
            )}>

                {isYang ? (
                    // Solid Line
                    <div className={clsx(
                        "w-full h-full rounded sm:rounded-md",
                        isChanging ? "bg-amber-600" : "bg-stone-800"
                    )}></div>
                ) : (
                    // Broken Line
                    <>
                        <div className={clsx(
                            "w-[42%] h-full rounded sm:rounded-md",
                            isChanging ? "bg-amber-600" : "bg-stone-800"
                        )}></div>
                        <div className={clsx(
                            "w-[42%] h-full rounded sm:rounded-md",
                            isChanging ? "bg-amber-600" : "bg-stone-800"
                        )}></div>
                    </>
                )}
            </div>

            {/* Changing Indicator (Circle or Cross) */}
            {isChanging && (
                <div className="absolute right-[-2rem] text-amber-600 font-bold text-lg">
                    O
                </div>
            )}
        </div>
    );
}
