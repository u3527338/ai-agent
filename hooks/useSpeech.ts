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
    const isPreWakingRef = useRef(false);
    const lastWakeTimeRef = useRef<number>(0);

    const recognitionRef = useRef<any>(null);
    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const preWakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbacksRef = useRef({ onWake, onShutDown });

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

            if (text === shutW && isActiveRef.current) {
                commitState(false, false);
                callbacksRef.current.onShutDown();
                return;
            }

            if (isPreWakingRef.current) {
                const command = getCleanCommand(text, wakeW);
                if (command.length > 0 && (isFinal || command.length > 10)) {
                    commitState(true, false, command);
                    return;
                }
            }

            if (text.includes(wakeW)) {
                const immediateCommand = getCleanCommand(text, wakeW);
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
                    preWakeTimeoutRef.current = setTimeout(
                        () => commitState(true, false),
                        5000
                    );
                }
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
            const delay = isPreWakingRef.current
                ? isFinalResult
                    ? 400
                    : 1000
                : isFinalResult
                ? 100
                : 300;

            speechTimeoutRef.current = setTimeout(() => {
                processFinalText(currentText, isFinalResult);
                setTranscript(currentText);
            }, delay);
        };

        rec.onstart = () => setIsListening(true);
        rec.onerror = () => setIsListening(false);
        rec.onend = () => {
            setIsListening(false);
            // ⚛️ Electron 重啟機制
            if (recognitionRef.current) {
                setTimeout(() => {
                    try {
                        rec.start();
                    } catch (e) {}
                }, 300);
            }
        };

        recognitionRef.current = rec;
        try {
            rec.start();
        } catch (e) {}
    }, [processFinalText, masterLang]);

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
