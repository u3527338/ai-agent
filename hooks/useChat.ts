"use client";

import { lumosLang, WAKE_RESPONSE } from "@/helpers/constant";
import { useCallback, useRef, useState } from "react";

export function useChat() {
    const [response, setResponse] = useState(WAKE_RESPONSE);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isBusyRef = useRef(false);
    const speechQueue = useRef<string[]>([]);

    // ⚛️ 關鍵：在 window 上掛載引用，防止 Electron GC 回收導致 onend 消失
    const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    /**
     * 停止當前所有語音輸出並清空隊列
     */
    const stopSpeaking = useCallback(() => {
        if (typeof window !== "undefined") {
            window.speechSynthesis.cancel();
            speechQueue.current = [];
            setIsSpeaking(false);
            isBusyRef.current = false;
            activeUtteranceRef.current = null;
        }
    }, []);

    /**
     * 語音合成輸出函數 (TTS)
     */
    const speak = useCallback((text: string) => {
        if (!text || typeof window === "undefined") return;

        // 如果當前正在講話，加入隊列
        if (window.speechSynthesis.speaking) {
            speechQueue.current.push(text);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lumosLang;
        utterance.rate = 1.1;

        // 保護引用避免被 Electron 回收
        activeUtteranceRef.current = utterance;
        (window as any)._lastUtterance = utterance;

        utterance.onstart = () => {
            setIsSpeaking(true);
            isBusyRef.current = true;
        };

        utterance.onend = () => {
            activeUtteranceRef.current = null;
            if (speechQueue.current.length > 0) {
                const nextPart = speechQueue.current.shift();
                if (nextPart) setTimeout(() => speak(nextPart), 50);
            } else {
                setIsSpeaking(false);
                isBusyRef.current = false;
            }
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            isBusyRef.current = false;
            speechQueue.current = [];
            activeUtteranceRef.current = null;
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    /**
     * 與 AI 溝通的核心邏輯
     */
    const askLumos = async (text: string) => {
        // 如果新指令進來時正在說話，立刻中斷舊的語音 (打斷機制)
        if (window.speechSynthesis.speaking) {
            stopSpeaking();
        }

        if (!text) return;

        isBusyRef.current = true;
        setIsThinking(true);
        setResponse("");
        speechQueue.current = [];

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });

            if (!res.body) throw new Error("Stream connection failed.");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullReply = "";
            let sentenceBuffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                fullReply += chunk;
                sentenceBuffer += chunk;

                // 更新 UI 上的文字回覆
                setResponse(fullReply);

                // 遇到標點符號即提取句子進行語音合成 (TTS)
                if (/[。！？.!?;]/.test(sentenceBuffer)) {
                    const toSpeak = sentenceBuffer.trim();
                    if (toSpeak.length > 1) {
                        speak(toSpeak);
                    }
                    sentenceBuffer = "";
                }
            }

            // 處理剩餘的碎片文字
            if (sentenceBuffer.trim()) {
                speak(sentenceBuffer.trim());
            }
        } catch (error) {
            console.error("AI Link Error:", error);
            setResponse("Neural link abnormally.");
            isBusyRef.current = false;
        } finally {
            setIsThinking(false);
            // 注意：isBusyRef 的最終釋放通常由 speak 的 onend 負責，
            // 這裡確保即使沒有觸發語音，忙碌狀態也會解除。
            if (!window.speechSynthesis.speaking) {
                isBusyRef.current = false;
            }
        }
    };

    return {
        response,
        setResponse,
        isThinking,
        isSpeaking,
        askLumos,
        speak,
        stopSpeaking,
    };
}
