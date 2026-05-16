import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getHexagramKey } from '../lib/iching';

import ichingDataZh from '../data/iching_reference.json';
import ichingDataEn from '../data/iching_reference_en.json';

const ASPECTS = [
    ['事業', 'career'],
    ['感情', 'love'],
    ['健康', 'health'],
    ['財運', 'wealth'],
];

function getMovingLinePositions(lines, interpretation, fallback) {
    const sourceLines = Array.isArray(interpretation?.lines) ? interpretation.lines : [];
    const movingLines = [];

    for (let i = 5; i >= 0; i--) {
        if (lines[i] === 6 || lines[i] === 9) {
            movingLines.push(sourceLines[i]?.position || fallback(i + 1));
        }
    }

    return movingLines;
}

export function ResultPanel({ lines, question }) {
    const { t, i18n } = useTranslation();
    const [interpretation, setInterpretation] = useState(null);
    const [aiResult, setAiResult] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const aiRequestRef = useRef(null);
    const hexKey = getHexagramKey(lines);

    useEffect(() => {
        aiRequestRef.current?.abort();
        setIsAiLoading(false);

        const ichingData = i18n.language === 'en' ? (ichingDataEn && Object.keys(ichingDataEn).length > 0 ? ichingDataEn : ichingDataZh) : ichingDataZh;
        if (lines.length === 6) {
            const data = ichingData[hexKey];
            setInterpretation(data || null);
            setAiResult('');
        } else {
            setInterpretation(null);
            setAiResult('');
        }
    }, [lines, hexKey, i18n.language]);

    useEffect(() => {
        return () => aiRequestRef.current?.abort();
    }, []);

    const handleGenerateAI = async () => {
        if (!interpretation) return;
        
        aiRequestRef.current?.abort();
        const controller = new AbortController();
        aiRequestRef.current = controller;

        setIsAiLoading(true);
        setAiResult('');
        
        try {
            const hexName = t(`hexagrams.${hexKey}`);
            const movingLines = getMovingLinePositions(lines, interpretation, (line) => t('result.lineFallback', { line }));
            const movingStr = movingLines.length > 0 ? movingLines.join('、') : t('result.noMovingLines');
            let prompt = '';
            if (i18n.language === 'en') {
                const reqQ = question ? `the question "${question}"` : 'this hexagram';
                prompt = `You are an I Ching expert. Regarding ${reqQ}, the original hexagram is "${hexName}", and the moving lines are "${movingStr}". Please provide a brief, professional, and specific I Ching interpretation and advice in English.`;
            } else {
                const reqQ = question ? `問題：「${question}」` : '這個卦象';
                prompt = `你在這裡是易經專家。針對${reqQ}，本卦為「${hexName}」，變爻為「${movingStr}」，請給出一段簡短、專業且具體的易經解析與建議。`;
            }
            
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
                signal: controller.signal
            });
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            const aiText = typeof data.text === 'string' ? data.text : '';
            if (!aiText) {
                throw new Error(t('result.emptyAiResponse'));
            }
            setAiResult(aiText);
            

        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error("AI Generation Error:", error);
            setAiResult(t('result.errorFetching', { error: error.message || error }));
        } finally {
            if (aiRequestRef.current === controller) {
                aiRequestRef.current = null;
                setIsAiLoading(false);
            }
        }
    };

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
                        {t("result.questionAsked")}
                    </span>
                    <p className="text-stone-800 font-medium text-lg">{question}</p>
                </div>
            )}

            {interpretation && (
                <div className="mb-4 p-4 bg-stone-100/50 rounded-lg border border-stone-200/60">
                    <span className="text-stone-500 text-sm font-bold block mb-1">
                        {t("result.hexagramResult")}
                    </span>
                    <p className="text-stone-800 font-medium text-lg mb-1">
                        <span className="text-stone-500 text-base font-normal mr-2">{t("result.originalHexagram")}</span>
                        {t(`hexagrams.${hexKey}`)}
                    </p>
                    <p className="text-stone-800 font-medium text-lg">
                        <span className="text-stone-500 text-base font-normal mr-2">{t("result.movingLines")}</span>
                        {(() => {
                            const moving = getMovingLinePositions(lines, interpretation, (line) => t('result.lineFallback', { line }));
                            return moving.length > 0 ? moving.join('、') : t("result.noMovingLines");
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
                            {t("result.analysisOptions")}
                        </span>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {(() => {
                                const hexName = t(`hexagrams.${hexKey}`);
                                const movingLines = getMovingLinePositions(lines, interpretation, (line) => t('result.lineFallback', { line }));
                                const movingStr = movingLines.length > 0 ? movingLines.join('、') : t('result.noMovingLines');
                                const reqQuestion = question ? ` ${t('result.questionAsked')}：「${question}」` : '';
                                const searchQuery = `${t('app.title')} ${hexName} ${t('result.movingLines')} ${movingStr}${reqQuestion} AI 解析`;
                                const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&udm=50`;
                                
                                return (
                                    <a 
                                        href={googleSearchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white/80 border border-amber-300 text-amber-800 rounded-lg font-medium hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        {t("result.searchGoogle")}
                                    </a>
                                );
                            })()}

                            <button 
                                onClick={handleGenerateAI}
                                disabled={isAiLoading || !!aiResult}
                                className="px-4 py-2 bg-white/80 border border-amber-300 text-amber-800 rounded-lg font-medium hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAiLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t("result.analyzing")}
                                    </>
                                ) : aiResult ? (
                                    <>
                                        <svg className="w-4 h-4 mr-1 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        {t("result.analysisComplete")}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-1 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        {t("result.aiAnalysis")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    {aiResult && (
                        <div className="mt-4 p-4 bg-white/90 rounded-lg border border-amber-200/50 text-amber-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap shadow-inner prose prose-amber">
                            {aiResult}
                        </div>
                    )}
                </div>
            )}

            {interpretation ? (
                <div className="mt-4 space-y-6">
                    <div>
                        <h4 className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2">{t("result.keywords")}</h4>
                        <p className="text-stone-700">{interpretation.keywords}</p>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2">{t("result.coreMeaning")}</h4>
                        <p className="text-stone-700">{interpretation.coreMeaning}</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2">{t("result.aspectHints")}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ASPECTS.map(([aspect, aspectKey]) => {
                                const aspectText = interpretation.aspects?.[aspect];
                                return aspectText ? (
                                    <div key={aspect} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                                        <h5 className="font-bold text-stone-700 mb-1">{t(`result.${aspectKey}`)}</h5>
                                        <p className="text-stone-600 text-sm">{aspectText}</p>
                                    </div>
                                ) : null
                            })}
                        </div>
                    </div>

                    {/* Removed transformationTip section */}

                    {Array.isArray(interpretation.lines) && interpretation.lines.length > 0 && (
                        <div>
                            <h4 className="font-bold text-stone-800 border-b border-stone-200 pb-1 mb-2">{t("result.lineAnalysis")}</h4>
                            <div className="space-y-3">
                                {interpretation.lines.map((lineData, i) => {
                                    // lines is an array from App.jsx, bottom to top.
                                    // i=0 is bottom line (初爻), i=5 is top line (上爻)
                                    // 6 and 9 are moving lines
                                    
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
