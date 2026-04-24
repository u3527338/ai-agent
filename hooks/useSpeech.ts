"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech(
    wakeWord: string,
    shutDownWord: string,
    onWake: () => void,
    onShutDown: () => void
) {
    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const recognitionRef = useRef<any>(null);
    const callbacksRef = useRef({ onWake, onShutDown });

    useEffect(() => {
        callbacksRef.current = { onWake, onShutDown };
    }, [onWake, onShutDown]);

    const resetTranscript = useCallback(() => setTranscript(""), []);

    const initRecognition = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition || recognitionRef.current) return;

        const rec = new SpeechRecognition();
        rec.continuous = false; 
        rec.interimResults = true;
        rec.lang = "en-GB";

        rec.onresult = (event: any) => {
            const current = event.results[event.results.length - 1];
            const text = current[0].transcript.toLowerCase().trim();

            if (current.isFinal) {
                const isWake = text.includes(wakeWord.toLowerCase());
                const isShutdown = /system\s?shutdown|system\s?shut\s?down/.test(text);

                if (isWake) {
                    setIsActive(true);
                    callbacksRef.current.onWake();
                    resetTranscript();
                    return;
                }

                if (isShutdown) {
                    setIsActive(false);
                    callbacksRef.current.onShutDown();
                    resetTranscript();
                    return;
                }

                setIsActive((active) => {
                    if (active && text.length > 1) setTranscript(text);
                    return active;
                });
            }
        };

        rec.onstart = () => setIsListening(true);
        rec.onend = () => {
            setIsListening(false);
            if (recognitionRef.current) {
                setTimeout(() => {
                    try { recognitionRef.current.start(); } catch (e) {}
                }, 100);
            }
        };

        recognitionRef.current = rec;
        rec.start();
    }, [wakeWord, shutDownWord, resetTranscript]);

    useEffect(() => {
        initRecognition();
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [initRecognition]);

    return { transcript, isListening, isActive, setIsActive, resetTranscript };
}