
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getHexagramKey } from '../lib/iching';

export function ResultPanel({ lines }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [interpretation, setInterpretation] = useState(null);
    const hexKey = getHexagramKey(lines);

    useEffect(() => {
        if (lines.length === 6) {
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
                const hexName = t(`hexagrams.${hexKey}`);
                setInterpretation(`
          ${hexName}
          
          ${t("result.judgmentTitle")}
          Great success. Perseverance furthers.
          
          ${t("result.imageTitle")}
          The movement of heaven is full of power. Thus the superior man makes himself strong and untiring.
          
          ${t("result.mockNotice")}
        `);
                setLoading(false);
            }, 1500);
        } else {
            setInterpretation(null);
        }
    }, [lines, hexKey, t]);

    if (lines.length < 6) {
        return (
            <div className="h-full bg-stone-50 p-6 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400">
                <p>{t("result.empty")}</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-stone-50 p-6 rounded-xl border border-stone-200 overflow-y-auto">
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">{t(`hexagrams.${hexKey}`)}</h3>

            {loading ? (
                <div className="flex flex-col gap-3 mt-4 animate-pulse">
                    <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                    <div className="h-4 bg-stone-200 rounded w-full"></div>
                    <div className="h-4 bg-stone-200 rounded w-5/6"></div>
                    <div className="h-20 bg-stone-200 rounded w-full mt-2"></div>
                </div>
            ) : (
                <div className="prose prose-stone mt-4 leading-relaxed whitespace-pre-line">
                    {interpretation}
                </div>
            )}
        </div>
    );
}
