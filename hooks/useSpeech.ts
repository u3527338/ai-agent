"use client";

import { masterLang } from "@/helpers/constant";
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

    useEffect(() => {
        callbacksRef.current = { onWake, onShutDown };
    }, [onWake, onShutDown]);

    const resetTranscript = useCallback(() => setTranscript(""), []);

    const forceReset = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const processFinalText = useCallback(
        (fullText: string) => {
            const text = fullText.toLowerCase().trim();
            const wakeW = wakeWord.toLowerCase();
            const shutW = shutDownWord.toLowerCase();

            // 1. 橘色預備期攔截 (必須係喊完 Lumos 之後嘅 5 秒內)
            if (isPreWaking) {
                if (preWakeTimeoutRef.current)
                    clearTimeout(preWakeTimeoutRef.current);

                const regex = new RegExp(`.*${wakeW}\\s*`, "i");
                const command = text.replace(regex, "").trim();

                if (command.length > 0) {
                    setIsPreWaking(false);
                    isActiveRef.current = true;
                    setIsActive(true);
                    callbacksRef.current.onWake(true, command);
                    resetTranscript();
                    forceReset();
                    return;
                }
            }

            // 2. 喚醒詞偵測 (只有包含 Lumos 嘅說話先會處理)
            if (text.includes(wakeW)) {
                const wasAlreadyAwake = isActiveRef.current;
                const regex = new RegExp(`.*${wakeW}\\s*`, "i");
                const command = text.replace(regex, "").trim();

                if (command.length > 1) {
                    // 「Lumos + 指令」
                    if (preWakeTimeoutRef.current)
                        clearTimeout(preWakeTimeoutRef.current);
                    setIsPreWaking(false);
                    isActiveRef.current = true;
                    setIsActive(true);
                    callbacksRef.current.onWake(wasAlreadyAwake, command);
                    resetTranscript();
                    forceReset();
                } else if (!isPreWaking) {
                    // 單純 "Lumos"
                    setIsPreWaking(true);
                    if (preWakeTimeoutRef.current)
                        clearTimeout(preWakeTimeoutRef.current);

                    preWakeTimeoutRef.current = setTimeout(() => {
                        setIsPreWaking(false);
                        isActiveRef.current = true;
                        setIsActive(true);
                        callbacksRef.current.onWake(wasAlreadyAwake);
                        resetTranscript();
                        forceReset();
                    }, 5000);
                }
                return;
            }

            // 3. 關機偵測
            if (text.includes(shutW) && isActiveRef.current) {
                isActiveRef.current = false;
                setIsActive(false);
                forceReset();
                callbacksRef.current.onShutDown();
                resetTranscript();
                return;
            }

            // ⚛️ 關鍵修正：移除咗原本會將所有 text 塞入 setTranscript 嘅邏輯
            // 依家只有當說話包含 wakeWord 或者處於橘色預備期，先會觸發指令
            resetTranscript();
        },
        [wakeWord, shutDownWord, resetTranscript, isPreWaking, forceReset]
    );

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
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                interimTranscript += event.results[i][0].transcript;
            }
            const currentText = interimTranscript.toLowerCase().trim();

            if (speechTimeoutRef.current)
                clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = setTimeout(() => {
                if (currentText.length > 0) {
                    processFinalText(currentText);
                }
            }, 400);
        };

        rec.onstart = () => setIsListening(true);
        rec.onend = () => {
            setIsListening(false);
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
    }, [wakeWord, processFinalText]);

    useEffect(() => {
        initRecognition();
        return () => {
            if (speechTimeoutRef.current)
                clearTimeout(speechTimeoutRef.current);
            if (preWakeTimeoutRef.current)
                clearTimeout(preWakeTimeoutRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [initRecognition]);

    return {
        transcript,
        isListening,
        isActive,
        isPreWaking,
        setIsActive,
        resetTranscript,
    };
}
