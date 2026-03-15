
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getHexagramKey } from '../lib/iching';

import ichingData from '../data/iching_reference.json';

export function ResultPanel({ lines }) {
    const { t } = useTranslation();
    const [interpretation, setInterpretation] = useState(null);
    const hexKey = getHexagramKey(lines);

    useEffect(() => {
        if (lines.length === 6) {
            const data = ichingData[hexKey];
            setInterpretation(data);
        } else {
            setInterpretation(null);
        }
    }, [lines, hexKey]);

    if (lines.length < 6) {
        return (
            <div className="h-full bg-stone-50 p-6 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400">
                <p>{t("result.empty")}</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-stone-50 p-6 rounded-xl border border-stone-200 overflow-y-auto">
            <h3 className="text-2xl font-sans font-bold text-stone-900 mb-2">{t(`hexagrams.${hexKey}`)}</h3>

            {interpretation ? (
                <div className="mt-4 space-y-6">
                    <div>
                        <h4 className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2">卦辭關鍵字</h4>
                        <p className="text-stone-700">{interpretation.keywords}</p>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2">核心意涵</h4>
                        <p className="text-stone-700">{interpretation.coreMeaning}</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2">各面向提示</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['事業', '感情', '健康', '財運'].map(aspect => (
                                interpretation.aspects[aspect] ? (
                                    <div key={aspect} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                                        <h5 className="font-bold text-stone-700 mb-1">{aspect}</h5>
                                        <p className="text-stone-600 text-sm">{interpretation.aspects[aspect]}</p>
                                    </div>
                                ) : null
                            ))}
                        </div>
                    </div>

                    {/* Removed transformationTip section */}

                    {interpretation.lines && interpretation.lines.length > 0 && (
                        <div>
                            <h4 className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2">六爻解析</h4>
                            <div className="space-y-3">
                                {interpretation.lines.map((lineData, i) => {
                                    // lines is an array from App.jsx, bottom to top.
                                    // i=0 is bottom line (初爻), i=5 is top line (上爻)
                                    // 6 and 9 are moving lines
                                    const isMoving = lines[i] === 6 || lines[i] === 9;
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className="p-3 bg-white rounded-lg border border-stone-200 transition-all opacity-70 hover:opacity-100"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-stone-700">{lineData.position}</span>
                                            </div>
                                            <p className="font-sans font-medium mb-1 text-stone-700">{lineData.text}</p>
                                            <p className="text-sm text-stone-600 leading-relaxed">{lineData.meaning}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3 mt-4 animate-pulse">
                    <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                    <div className="h-4 bg-stone-200 rounded w-full"></div>
                    <div className="h-4 bg-stone-200 rounded w-5/6"></div>
                    <div className="h-20 bg-stone-200 rounded w-full mt-2"></div>
                </div>
            )}
        </div>
    );
}
