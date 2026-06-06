import React, { useEffect, useRef, useState, useCallback } from 'react';
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

const drawRoundRect = (ctx, x, y, width, height, radius) => {
    if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, radius);
    } else {
        ctx.rect(x, y, width, height);
    }
};

const drawReport = (ctx, { lines, question, interpretation, hexKey, aiResult, t, i18n }, dryRun) => {
    const width = 750;
    const padding = 50;
    const contentWidth = width - (padding * 2); // 650
    let y = 90; // start y coordinate

    // Helper: draw divider
    const drawDivider = (currentY) => {
        if (!dryRun) {
            ctx.beginPath();
            ctx.moveTo(padding, currentY);
            ctx.lineTo(width - padding, currentY);
            ctx.strokeStyle = '#e8dfd2';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        return currentY + 45;
    };

    // Helper: draw section title
    const drawSectionTitle = (title, currentY) => {
        if (!dryRun) {
            ctx.font = 'bold 32px "Noto Serif TC", "Songti TC", "Georgia", "PMingLiU", serif';
            ctx.fillStyle = '#2b2621';
            
            // Draw a left accent bar
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            drawRoundRect(ctx, padding, currentY - 26, 6, 32, 3);
            ctx.fill();
            
            ctx.fillStyle = '#2b2621';
            ctx.fillText(title, padding + 20, currentY);
        }
        return currentY + 50;
    };

    // Helper: wrap text and return next y
    const drawWrappedText = (text, currentY, fontSize = 16, color = '#2b2621', fontStyle = '', lineHeightMultiplier = 1.6) => {
        ctx.font = `${fontStyle} ${fontSize}px "PingFang SC", "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
        const lineHeight = fontSize * lineHeightMultiplier;
        
        // Split text into paragraphs
        const paragraphs = (text || '').split('\n');
        let tempY = currentY;

        for (let p = 0; p < paragraphs.length; p++) {
            const paragraph = paragraphs[p];
            if (paragraph.trim() === '') {
                tempY += lineHeight * 0.5;
                continue;
            }

            // Word wrap
            const isEnglish = i18n.language === 'en';
            let words = [];
            if (isEnglish) {
                words = paragraph.split(' ');
            } else {
                const matches = paragraph.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9]+|[^\u4e00-\u9fa5a-zA-Z0-9]/g) || [];
                words = matches;
            }

            let line = '';
            for (let n = 0; n < words.length; n++) {
                const word = words[n];
                const testLine = line + (isEnglish && line ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > contentWidth && n > 0) {
                    if (!dryRun) {
                        ctx.fillStyle = color;
                        ctx.fillText(line, padding, tempY);
                    }
                    line = word;
                    tempY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            if (!dryRun) {
                ctx.fillStyle = color;
                ctx.fillText(line, padding, tempY);
            }
            tempY += lineHeight;
        }
        return tempY;
    };

    // --- 1. HEADER ---
    if (!dryRun) {
        ctx.font = 'bold 48px "Noto Serif TC", "Songti TC", "Georgia", "PMingLiU", serif';
        ctx.fillStyle = '#2b2621';
        ctx.textAlign = 'center';
        ctx.fillText(i18n.language === 'en' ? 'I Ching Divination' : '易經占卦報告', width / 2, y);
    }
    y += 60;

    if (!dryRun) {
        ctx.font = 'italic 28px "PingFang SC", "Microsoft JhengHei", "Noto Sans TC", sans-serif';
        ctx.fillStyle = '#8d6e63';
        ctx.textAlign = 'center';
        ctx.fillText(i18n.language === 'en' ? 'The Book of Changes • Divined by Stalks' : '大衍之數 • 順天應時', width / 2, y);
    }
    y += 45;

    // Date
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (!dryRun) {
        ctx.font = '22px "PingFang SC", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#a69b8d';
        ctx.textAlign = 'center';
        ctx.fillText(formattedDate, width / 2, y);
    }
    y += 30;

    y = drawDivider(y);

    // Reset alignment to left for content
    if (!dryRun) {
        ctx.textAlign = 'left';
    }

    // --- 2. QUESTION ---
    if (question) {
        const questionBoxPadding = 30;
        const questionTextSize = 32;
        ctx.font = `bold ${questionTextSize}px "PingFang SC", "Microsoft JhengHei", sans-serif`;
        const testCtx = ctx;

        // We first need to wrap the question text to calculate the box height
        let questionHeight = 0;
        const qParagraphs = question.split('\n');
        const qLineHeight = questionTextSize * 1.6;
        for (let p = 0; p < qParagraphs.length; p++) {
            const paragraph = qParagraphs[p];
            let words = i18n.language === 'en' ? paragraph.split(' ') : (paragraph.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9]+|[^\u4e00-\u9fa5a-zA-Z0-9]/g) || []);
            let line = '';
            for (let n = 0; n < words.length; n++) {
                const word = words[n];
                const testLine = line + (i18n.language === 'en' && line ? ' ' : '') + word;
                const metrics = testCtx.measureText(testLine);
                if (metrics.width > (contentWidth - questionBoxPadding * 2) && n > 0) {
                    questionHeight += qLineHeight;
                    line = word;
                } else {
                    line = testLine;
                }
            }
            questionHeight += qLineHeight;
        }

        const boxHeight = questionHeight + 85; // padding top/bottom and label

        if (!dryRun) {
            // Draw box
            ctx.fillStyle = '#f5efe6';
            ctx.beginPath();
            drawRoundRect(ctx, padding, y, contentWidth, boxHeight, 12);
            ctx.fill();

            // Draw label
            ctx.font = 'bold 22px "PingFang SC", sans-serif';
            ctx.fillStyle = '#8c7e6c';
            ctx.fillText(i18n.language === 'en' ? 'QUESTION ASKED' : '所問之事', padding + questionBoxPadding, y + 40);
        }
        
        // Draw the text
        if (!dryRun) {
            ctx.font = 'bold 32px "PingFang SC", "Microsoft JhengHei", sans-serif';
            ctx.fillStyle = '#2b2621';
            let tempY = y + 85;
            const qParagraphs = question.split('\n');
            for (let p = 0; p < qParagraphs.length; p++) {
                const paragraph = qParagraphs[p];
                let words = i18n.language === 'en' ? paragraph.split(' ') : (paragraph.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9]+|[^\u4e00-\u9fa5a-zA-Z0-9]/g) || []);
                let line = '';
                for (let n = 0; n < words.length; n++) {
                    const word = words[n];
                    const testLine = line + (i18n.language === 'en' && line ? ' ' : '') + word;
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > (contentWidth - questionBoxPadding * 2) && n > 0) {
                        ctx.fillText(line, padding + questionBoxPadding, tempY);
                        line = word;
                        tempY += qLineHeight;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, padding + questionBoxPadding, tempY);
                tempY += qLineHeight;
            }
        }
        
        y += boxHeight + 40;
    }

    // --- 3. HEXAGRAM RESULT ---
    y = drawSectionTitle(i18n.language === 'en' ? 'Divined Hexagram' : '占得卦象', y);

    const hexName = t(`hexagrams.${hexKey}`);
    if (!dryRun) {
        ctx.font = 'bold 32px "PingFang SC", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#2b2621';
        ctx.fillText(`${i18n.language === 'en' ? 'Original Hexagram: ' : '本卦：'}${hexName}`, padding, y);
    }
    y += 45;

    // Moving lines info
    const movingLines = getMovingLinePositions(lines, interpretation, (line) => t('result.lineFallback', { line }));
    const movingStr = movingLines.length > 0 ? movingLines.join('、') : t('result.noMovingLines');
    if (!dryRun) {
        ctx.font = '28px "PingFang SC", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#5e5349';
        ctx.fillText(`${i18n.language === 'en' ? 'Moving Lines: ' : '變爻：'}${movingStr}`, padding, y);
    }
    y += 50;

    // Drawing the 6 lines of the hexagram
    const lineThickness = 18;
    const lineGap = 12;
    const lineLength = 260;
    const startX = (width - lineLength) / 2;
    const hexVisualHeight = (lineThickness * 6) + (lineGap * 5);

    if (!dryRun) {
        // Draw the 6 lines (bottom to top, index 0 is bottom)
        for (let i = 5; i >= 0; i--) {
            const lineVal = lines[i];
            const lineY = y + ((5 - i) * (lineThickness + lineGap));
            const isYang = lineVal === 7 || lineVal === 9;
            const isChanging = lineVal === 6 || lineVal === 9;
            
            // Draw line number
            ctx.font = '22px "PingFang SC", sans-serif';
            ctx.fillStyle = '#a69b8d';
            ctx.textAlign = 'right';
            ctx.fillText(String(i + 1), startX - 25, lineY + 15);
            ctx.textAlign = 'left';

            // Draw line blocks
            ctx.fillStyle = isChanging ? '#8c4f2b' : '#2b2621';
            if (isYang) {
                // Yang line (solid)
                ctx.beginPath();
                drawRoundRect(ctx, startX, lineY, lineLength, lineThickness, 4);
                ctx.fill();
            } else {
                // Yin line (broken)
                const segmentLength = lineLength * 0.42;
                const gap = lineLength * 0.16;
                ctx.beginPath();
                drawRoundRect(ctx, startX, lineY, segmentLength, lineThickness, 4);
                ctx.fill();
                
                ctx.beginPath();
                drawRoundRect(ctx, startX + segmentLength + gap, lineY, segmentLength, lineThickness, 4);
                ctx.fill();
            }

            // Draw changing indicator circle
            if (isChanging) {
                ctx.beginPath();
                ctx.arc(startX + lineLength + 35, lineY + (lineThickness / 2), 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#8c4f2b';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }
    }
    y += hexVisualHeight + 50;

    y = drawDivider(y);

    // --- 4. AI INTERPRETATION ---
    y = drawSectionTitle(i18n.language === 'en' ? 'AI Analysis & Guidance' : 'AI 解析與指引', y);
    y = drawWrappedText(aiResult, y, 28, '#2b2621', '', 1.65);
    y += 20;

    y = drawDivider(y);

    // --- 5. HEXAGRAM JUDGMENT & MEANING ---
    if (interpretation) {
        y = drawSectionTitle(i18n.language === 'en' ? 'Judgment & Core Meaning' : '卦辭與核心意涵', y);
        
        // Keywords
        if (!dryRun) {
            ctx.font = 'bold 26px "PingFang SC", sans-serif';
            ctx.fillStyle = '#8d6e63';
            ctx.fillText(i18n.language === 'en' ? 'Keywords' : '卦辭關鍵字', padding, y);
        }
        y += 35;
        y = drawWrappedText(interpretation.keywords || '', y, 28, '#2b2621', '', 1.6);
        y += 20;

        // Core Meaning
        if (!dryRun) {
            ctx.font = 'bold 26px "PingFang SC", sans-serif';
            ctx.fillStyle = '#8d6e63';
            ctx.fillText(i18n.language === 'en' ? 'Core Meaning' : '核心意涵', padding, y);
        }
        y += 35;
        y = drawWrappedText(interpretation.coreMeaning || '', y, 28, '#2b2621', '', 1.65);
        y += 25;

        // Aspects Hints
        if (interpretation.aspects) {
            if (!dryRun) {
                ctx.font = 'bold 30px "PingFang SC", sans-serif';
                ctx.fillStyle = '#2b2621';
                ctx.fillText(i18n.language === 'en' ? 'Aspect Hints' : '各面向提示', padding, y);
            }
            y += 40;

            const aspectsList = ASPECTS;
            for (let i = 0; i < aspectsList.length; i++) {
                const [aspectName, aspectKey] = aspectsList[i];
                const aspectText = interpretation.aspects[aspectName];
                if (aspectText) {
                    if (!dryRun) {
                        ctx.font = 'bold 26px "PingFang SC", sans-serif';
                        ctx.fillStyle = '#8d6e63';
                        ctx.fillText(t(`result.${aspectKey}`), padding, y);
                    }
                    y += 32;
                    y = drawWrappedText(aspectText, y, 26, '#5e5349', '', 1.55);
                    y += 15;
                }
            }
        }

        y = drawDivider(y);

        // Lines analysis
        if (Array.isArray(interpretation.lines) && interpretation.lines.length > 0) {
            y = drawSectionTitle(i18n.language === 'en' ? 'Detailed Lines Analysis' : '六爻爻辭解析', y);
            
            for (let i = 0; i < interpretation.lines.length; i++) {
                const lineData = interpretation.lines[i];
                // Line position + Text
                if (!dryRun) {
                    ctx.font = 'bold 26px "PingFang SC", sans-serif';
                    ctx.fillStyle = '#2b2621';
                    ctx.fillText(`${lineData.position}：${lineData.text}`, padding, y);
                }
                y += 35;
                
                // Line Meaning
                y = drawWrappedText(lineData.meaning, y, 26, '#5e5349', '', 1.55);
                y += 20;
            }
        }
    }

    // --- 6. FOOTER ---
    y += 20;
    y = drawDivider(y);

    if (!dryRun) {
        ctx.font = 'italic 26px "Noto Serif TC", "Songti TC", "Georgia", "PMingLiU", serif';
        ctx.fillStyle = '#8d6e63';
        ctx.textAlign = 'center';
        ctx.fillText(i18n.language === 'en' ? 'Changes conform to time; sincerity leads to success.' : '天行健，君子以自強不息。地勢坤，君子以厚德載物。', width / 2, y);
    }
    y += 45;

    if (!dryRun) {
        ctx.font = '20px "PingFang SC", sans-serif';
        ctx.fillStyle = '#c0b4a4';
        ctx.textAlign = 'center';
        ctx.fillText(i18n.language === 'en' ? 'Generated by I Ching App' : '由「易經 • 大衍之數」App 生成', width / 2, y);
    }
    y += 30;

    // Draw background and borders if NOT dryRun
    if (!dryRun) {
        // We do this by setting globalCompositeOperation to 'destination-over'
        // which draws the background BEHIND everything else.
        ctx.globalCompositeOperation = 'destination-over';
        
        // Background
        ctx.fillStyle = '#fdfbf7';
        ctx.fillRect(0, 0, width, y + 40);

        // Double Borders
        ctx.strokeStyle = '#d2c2b0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        drawRoundRect(ctx, 24, 24, width - 48, y + 40 - 48, 6);
        ctx.stroke();

        ctx.lineWidth = 4;
        ctx.beginPath();
        drawRoundRect(ctx, 32, 32, width - 64, y + 40 - 64, 6);
        ctx.stroke();

        ctx.globalCompositeOperation = 'source-over'; // reset
    }

    return y + 40; // Total height including margin
};

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

    const handleGenerateAI = useCallback(async () => {
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
    }, [interpretation, lines, hexKey, question, i18n.language, t]);

    useEffect(() => {
        if (interpretation && !aiResult && !isAiLoading) {
            handleGenerateAI();
        }
    }, [interpretation, handleGenerateAI, aiResult, isAiLoading]);

    const handleDownloadImage = () => {
        if (!interpretation || !aiResult) return;

        // Create an off-screen canvas
        const canvas = document.createElement('canvas');
        canvas.width = 750;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Dry run to calculate total height
        const totalHeight = drawReport(ctx, { lines, question, interpretation, hexKey, aiResult, t, i18n }, true);

        // 2. Set the canvas to the computed height
        canvas.height = totalHeight;

        // 3. Render the actual content
        drawReport(ctx, { lines, question, interpretation, hexKey, aiResult, t, i18n }, false);

        // 4. Trigger download
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const hexName = t(`hexagrams.${hexKey}`).split(' ')[0]; // get the first character (e.g. 乾, 坤)
            link.download = `易經占卦_${hexName}_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Failed to generate image:", err);
            alert(t('result.downloadError', "無法生成下載圖檔，請確認您的瀏覽器支援此功能"));
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
                            {t("result.aiAnalysis")}
                        </span>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {isAiLoading && (
                                <button 
                                    disabled
                                    className="px-4 py-2 bg-stone-100 border border-stone-200 text-stone-500 rounded-lg font-medium flex items-center justify-center gap-2 text-sm w-full sm:w-auto cursor-not-allowed"
                                >
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-stone-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t("result.analyzing")}
                                </button>
                            )}

                            {!isAiLoading && aiResult && (
                                <button 
                                    onClick={handleDownloadImage}
                                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white border border-amber-800 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto cursor-pointer shadow-md"
                                >
                                    <svg className="w-4 h-4 mr-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    {t("result.downloadResult")}
                                </button>
                            )}

                            {!isAiLoading && !aiResult && (
                                <button 
                                    onClick={handleGenerateAI}
                                    className="px-4 py-2 bg-white/80 border border-amber-300 text-amber-800 rounded-lg font-medium hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto cursor-pointer"
                                >
                                    <svg className="w-4 h-4 mr-1 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    {t("result.aiAnalysis")}
                                </button>
                            )}
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
