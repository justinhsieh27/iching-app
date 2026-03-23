
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getHexagramKey } from '../lib/iching';

import ichingData from '../data/iching_reference.json';

export function ResultPanel({ lines, question }) {
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

            {question && (
                <div className="mb-4 p-4 bg-stone-100/50 rounded-lg border border-stone-200/60">
                    <span className="text-stone-500 text-sm font-bold block mb-1">
                        {t("result.questionAsked", "所問之事")}
                    </span>
                    <p className="text-stone-800 font-medium text-lg">{question}</p>
                </div>
            )}

            {interpretation && (
                <div className="mb-4 p-4 bg-stone-100/50 rounded-lg border border-stone-200/60">
                    <span className="text-stone-500 text-sm font-bold block mb-1">
                        {t("result.hexagramResult", "卦象")}
                    </span>
                    <p className="text-stone-800 font-medium text-lg mb-1">
                        <span className="text-stone-500 text-base font-normal mr-2">本卦</span>
                        {t(`hexagrams.${hexKey}`)}
                    </p>
                    <p className="text-stone-800 font-medium text-lg">
                        <span className="text-stone-500 text-base font-normal mr-2">變爻</span>
                        {(() => {
                            const moving = [];
                            for (let i = 5; i >= 0; i--) {
                                if (lines[i] === 6 || lines[i] === 9) {
                                    moving.push(interpretation.lines[i].position);
                                }
                            }
                            return moving.length > 0 ? moving.join('、') : '無（以本卦卦辭為主）';
                        })()}
                    </p>
                </div>
            )}

            {interpretation && (
                <div className="mb-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200/50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <span className="text-amber-800 font-bold flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            AI 解析
                        </span>
                        
                        {(() => {
                            const hexName = t(`hexagrams.${hexKey}`);
                            const movingLines = [];
                            for (let i = 5; i >= 0; i--) {
                                if (lines[i] === 6 || lines[i] === 9) {
                                    movingLines.push(interpretation.lines[i].position);
                                }
                            }
                            const movingStr = movingLines.length > 0 ? movingLines.join('、') : '無變爻';
                            const reqQuestion = question ? ` 問題：「${question}」` : '';
                            const searchQuery = `易經 ${hexName} 變爻 ${movingStr}${reqQuestion} AI 解析`;
                            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&udm=50`;
                            
                            return (
                                <a 
                                    href={googleSearchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-white/80 border border-amber-300 text-amber-800 rounded-lg font-medium hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    透過 Google 搜尋 AI 解析
                                </a>
                            );
                        })()}
                    </div>
                </div>
            )}

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
