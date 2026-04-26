"use client";

import { masterLang, WAKE_WORD } from "@/helpers/constant";
import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech(
    wakeWord: string,
    shutDownWord: string,
    onWake: (isAwake: boolean, command?: string) => void,
    onShutDown: () => void
) {
    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isPreWaking, setIsPreWaking] = useState(false);

    const isActiveRef = useRef(false);
    const recognitionRef = useRef<any>(null);
    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const preWakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbacksRef = useRef({ onWake, onShutDown });

    const isPrewake = (cmd: string) => {
        const regex = new RegExp(`^${WAKE_WORD}$`, "i");
        return regex.test(cmd);
    };

    // 確保 Callback 永遠係最新
    useEffect(() => {
        callbacksRef.current = { onWake, onShutDown };
    }, [onWake, onShutDown]);

    // --- 🛠️ 提取公共行為 (Common Behaviors) ---

    // 強制重置識別器並清空 Buffer
    const forceReset = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Speech stop error:", e);
            }
        }
        setTranscript("");
    }, []);

    // 清理所有計時器
    const clearAllTimeouts = useCallback(() => {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        if (preWakeTimeoutRef.current) clearTimeout(preWakeTimeoutRef.current);
    }, []);

    // 統一提交狀態切換
    const commitState = useCallback(
        (active: boolean, preWake: boolean, command?: string) => {
            clearAllTimeouts();
            const wasAlreadyAwake = isActiveRef.current;
            console.log({ preWake });
            setIsPreWaking(preWake);
            setIsActive(active);
            isActiveRef.current = active;

            // 只有喺確定要執行動作（非橘色等待期）時，先觸發回調同重置
            if (active && !preWake) {
                callbacksRef.current.onWake(wasAlreadyAwake, command);
                forceReset();
            }
        },
        [clearAllTimeouts, forceReset]
    );

    // 提取指令內容
    const getCleanCommand = useCallback((text: string, trigger: string) => {
        const regex = new RegExp(`.*${trigger}\\s*`, "i");
        return text.replace(regex, "").trim();
    }, []);

    // --- 🧠 核心處理邏輯 ---

    const processFinalText = useCallback(
        (fullText: string) => {
            const text = fullText.toLowerCase().trim();
            const wakeW = wakeWord.toLowerCase();
            const shutW = shutDownWord.toLowerCase();
            console.log({ text, wakeW, shutW });
            // 1. 關機優先
            if (text === shutW && isActiveRef.current) {
                clearAllTimeouts();
                isActiveRef.current = false;
                setIsActive(false);
                setIsPreWaking(false);
                callbacksRef.current.onShutDown();
                forceReset();
                return;
            }

            // 2. 橘色預備期攔截 (isPreWaking)
            if (isPreWaking) {
                const command = isPrewake(text)
                    ? getCleanCommand(text, wakeW)
                    : text;
                if (command.length > 0) {
                    commitState(true, false, command);
                    return;
                }
            }

            // 3. 喚醒詞偵測 (Lumos)
            if (isPrewake(text)) {
                if (!isActiveRef.current) {
                    // --- 初次喚醒 (Lumos -> Wake) ---
                    commitState(true, false);
                } else {
                    // --- 已喚醒後 (Lumos -> Prewake) ---
                    console.log(2);
                    setIsPreWaking(true);
                    clearAllTimeouts();

                    // 3 秒超時自動轉返藍色並講 Standby
                    preWakeTimeoutRef.current = setTimeout(() => {
                        commitState(true, false);
                    }, 3000);
                }
                return;
            }

            // 4. 無匹配則清空
            setTranscript("");
        },
        [
            wakeWord,
            shutDownWord,
            isPreWaking,
            commitState,
            getCleanCommand,
            forceReset,
            clearAllTimeouts,
        ]
    );

    // --- 🎙️ Speech Recognition 初始化 ---

    const initRecognition = useCallback(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition || recognitionRef.current) return;

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = masterLang;

        rec.onresult = (event: any) => {
            let interim = "";
            let isFinalResult = false;

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                interim += event.results[i][0].transcript;
                if (event.results[i].isFinal) isFinalResult = true;
            }
            const currentText = interim.toLowerCase().trim();

            // 視覺即時反饋
            if (isFinalResult && isPrewake(currentText) && !isPreWaking) {
                if (isActiveRef.current) {
                    console.log(3);
                    setIsPreWaking(true);
                }
            }

            if (speechTimeoutRef.current)
                clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = setTimeout(() => {
                if (currentText.length > 0) processFinalText(currentText);
            }, 400);
        };

        rec.onstart = () => setIsListening(true);
        rec.onerror = () => setIsListening(false);
        rec.onend = () => {
            setIsListening(false);
            // 自動重啟以保持監聽
            if (recognitionRef.current) {
                setTimeout(() => {
                    try {
                        recognitionRef.current?.start();
                    } catch (e) {}
                }, 100);
            }
        };

        recognitionRef.current = rec;
        rec.start();
    }, [wakeWord, processFinalText, isPreWaking]);

    useEffect(() => {
        initRecognition();
        return () => {
            clearAllTimeouts();
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [initRecognition, clearAllTimeouts]);

    return {
        transcript,
        isListening,
        isActive,
        isPreWaking,
        setIsActive,
        resetTranscript: forceReset,
    };
}
