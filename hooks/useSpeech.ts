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

    // --- 核心同步狀態 ---
    const isActiveRef = useRef(false);
    const isPreWakingRef = useRef(false);
    const lastWakeTimeRef = useRef<number>(0);

    const recognitionRef = useRef<any>(null);
    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const preWakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbacksRef = useRef({ onWake, onShutDown });

    const hasWakeWord = (cmd: string) => {
        const regex = new RegExp(`${WAKE_WORD}`, "i");
        return regex.test(cmd);
    };

    useEffect(() => {
        callbacksRef.current = { onWake, onShutDown };
    }, [onWake, onShutDown]);

    const forceReset = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
        }
        setTranscript("");
    }, []);

    const clearAllTimeouts = useCallback(() => {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        if (preWakeTimeoutRef.current) clearTimeout(preWakeTimeoutRef.current);
    }, []);

    const commitState = useCallback(
        (active: boolean, preWake: boolean, command?: string) => {
            clearAllTimeouts();
            const wasAlreadyAwake = isActiveRef.current;

            isActiveRef.current = active;
            isPreWakingRef.current = preWake;

            setIsActive(active);
            setIsPreWaking(preWake);

            if (active && !preWake) {
                callbacksRef.current.onWake(wasAlreadyAwake, command);
                forceReset();
            }
        },
        [clearAllTimeouts, forceReset]
    );

    const getCleanCommand = useCallback((text: string, trigger: string) => {
        const regex = new RegExp(`^.*${trigger}\\s*`, "i");
        return text.replace(regex, "").trim();
    }, []);

    const processFinalText = useCallback(
        (fullText: string, isFinal: boolean) => {
            const text = fullText.toLowerCase().trim();
            const wakeW = wakeWord.toLowerCase();
            const shutW = shutDownWord.toLowerCase();
            const now = Date.now();

            console.log(
                `[SPEECH] Text: "${text}" | State: ${
                    isPreWakingRef.current ? "ORANGE" : "BLUE"
                } | Final: ${isFinal}`
            );

            if (text === shutW && isActiveRef.current) {
                commitState(false, false);
                callbacksRef.current.onShutDown();
                return;
            }

            // 💡 橘色狀態：處理指令（更嚴格的攔截門檻）
            if (isPreWakingRef.current) {
                const command = getCleanCommand(text, wakeW);
                if (command.length > 0) {
                    // 只有在定稿 (isFinal) 或句子長到很有把握 (10) 時才提交
                    if (isFinal || command.length > 10) {
                        commitState(true, false, command);
                        return;
                    }
                }
            }

            // 💡 藍色狀態：喚醒
            if (hasWakeWord(text)) {
                const immediateCommand = getCleanCommand(text, wakeW);

                // 只有連著說的指令夠長 (>6) 才會直接執行，否則進入橘色等待
                if (immediateCommand.length > 6) {
                    commitState(true, false, immediateCommand);
                    return;
                }

                if (!isActiveRef.current) {
                    lastWakeTimeRef.current = now;
                    commitState(true, false);
                } else if (
                    !isPreWakingRef.current &&
                    now - lastWakeTimeRef.current > 600
                ) {
                    commitState(true, true);
                    preWakeTimeoutRef.current = setTimeout(() => {
                        commitState(true, false);
                    }, 5000);
                }
                return;
            }
        },
        [wakeWord, shutDownWord, commitState, getCleanCommand]
    );

    const initRecognition = useCallback(() => {
        if (typeof window === "undefined") return;
        const SR =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        if (!SR || recognitionRef.current) return;

        const rec = new SR();
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
            if (!currentText) return;

            if (speechTimeoutRef.current)
                clearTimeout(speechTimeoutRef.current);

            // 💡 核心優化：動態延遲控制
            let delay = 300;
            if (isPreWakingRef.current) {
                // 如果在聽指令模式，給予極大耐心 (1秒)，防止長句斷裂
                delay = isFinalResult ? 400 : 1000;
            } else {
                // 喚醒模式下追求快，減少堆疊文字
                delay = isFinalResult ? 100 : 300;
            }

            speechTimeoutRef.current = setTimeout(() => {
                processFinalText(currentText, isFinalResult);
                setTranscript(currentText);
            }, delay);
        };

        rec.onstart = () => setIsListening(true);
        rec.onerror = (e: any) => {
            if (e.error === "aborted") return;
            setIsListening(false);
        };

        rec.onend = () => {
            setIsListening(false);
            if (recognitionRef.current) {
                setTimeout(() => {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {}
                }, 300);
            }
        };

        recognitionRef.current = rec;
        try {
            rec.start();
        } catch (e) {}
    }, [processFinalText]);

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
