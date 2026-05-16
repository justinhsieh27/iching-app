
import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export function ControlPanel({
    stalksCount,
    lines,
    changeCount,
    onSplit,
    onReset
}) {
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const [hoverX, setHoverX] = useState(null);

    // Determine if user can interact (split)
    // We allow split if we are in a state that expects a split.
    // The parent will manage the step logic. 
    // For visuals: 1 stalk (Taiji) + stalksCount (active)

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setHoverX(Math.max(0, Math.min(x, rect.width)));
    };

    const handleClick = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        if (width <= 0 || lines.length >= 6) return;
        // ratio 0..1
        const x = hoverX ?? width / 2;
        const ratio = Math.max(0.02, Math.min(0.98, x / width));
        onSplit(ratio);
    };

    const safeStalksCount = Number.isFinite(stalksCount) ? Math.max(0, Math.floor(stalksCount)) : 0;
    const activeStalks = Array.from({ length: safeStalksCount });

    return (
        <div className="flex flex-col h-full bg-stone-100 p-6 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-stone-800 text-stone-50 rounded-lg hover:bg-stone-700 transition flex items-center gap-2 text-sm font-medium"
                >
                    {t("control.reset")}
                </button>
            </div>

            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-sans font-bold text-stone-800">
                        {lines.length < 6 
                            ? t("app.status", { line: lines.length + 1, change: changeCount + 1 })
                            : t("app.complete")
                        }
                    </h2>
                    <p className="text-stone-600 text-sm mt-1">
                        {stalksCount === 49 ? t("control.descFirst") : t("control.descRemaining", { count: stalksCount })}
                    </p>
                    <p className="text-stone-500 text-xs mt-2 italic">
                        {t("control.instruction")}
                    </p>
                </div>
            </div>

            {/* Visualization Area */}
            <div
                className="flex-1 flex items-center justify-center relative select-none cursor-pointer group"
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
            >
                {/* Taiji Stalk (Always there, maybe separated) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-1 bg-amber-700/30 rounded-full" title="Taiji (The One)"></div>

                {/* Active Stalks Pile */}
                <div className="flex items-end justify-center gap-1 h-64 w-full px-8">
                    {activeStalks.map((_, i) => (
                        <div
                            key={i}
                            className={clsx(
                                "w-1.5 bg-amber-700 rounded-full transition-all duration-300 ease-out shadow-sm",
                                "group-hover:bg-amber-600",
                                // Simple height variation for organic look
                                i % 3 === 0 ? "h-48" : i % 2 === 0 ? "h-56" : "h-52"
                            )}
                            style={{
                                // React to hoverSplit if checking
                                // This is a simple visual, maybe we shift them slightly
                            }}
                        />
                    ))}
                </div>

                {/* Hover Indicator (Virtual Hand) */}
                {hoverX !== null && (
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-stone-900/20 border-l border-dashed border-stone-800 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"
                        style={{ left: hoverX }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 left-2 bg-stone-800 text-white text-xs px-2 py-1 rounded">
                            {t("control.splitHere")}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
