"use client";
import { lumosLang, WAKE_RESPONSE } from "@/helpers/constant";
import { useCallback, useRef, useState } from "react";

export function useChat() {
    const [response, setResponse] = useState(WAKE_RESPONSE);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isBusyRef = useRef(false);
    const speechQueue = useRef<string[]>([]);

    const speak = useCallback((text: string) => {
        if (!text || typeof window === "undefined") return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lumosLang;
        utterance.rate = 1.1;

        utterance.onstart = () => {
            setIsSpeaking(true);
            isBusyRef.current = true;
        };

        utterance.onend = () => {
            if (speechQueue.current.length > 0) {
                const nextPart = speechQueue.current.shift();
                if (nextPart) {
                    // ⚛️ 關鍵修正：递归調用 speak 以確保每一段都有 onend 監聽
                    speak(nextPart);
                }
            } else {
                setIsSpeaking(false);
                isBusyRef.current = false;
            }
        };

        // ⚛️ 增加 Error 處理防止死鎖
        utterance.onerror = () => {
            setIsSpeaking(false);
            isBusyRef.current = false;
            speechQueue.current = [];
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    const askLumos = async (text: string) => {
        if (!text || isBusyRef.current) return;

        isBusyRef.current = true;
        setIsThinking(true);
        setResponse("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });

            if (!res.body) throw new Error();

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
                setResponse(fullReply);

                if (/[。！？.!?;]/.test(sentenceBuffer)) {
                    const toSpeak = sentenceBuffer.trim();
                    if (toSpeak.length > 1) {
                        // ⚛️ 檢查是否正在說話，如果是則排隊
                        if (!window.speechSynthesis.speaking) {
                            speak(toSpeak);
                        } else {
                            speechQueue.current.push(toSpeak);
                        }
                    }
                    sentenceBuffer = "";
                }
            }

            if (sentenceBuffer.trim()) {
                if (!window.speechSynthesis.speaking) {
                    speak(sentenceBuffer.trim());
                } else {
                    speechQueue.current.push(sentenceBuffer.trim());
                }
            }
        } catch (error) {
            setResponse("Neural link abnormally.");
            isBusyRef.current = false;
        } finally {
            setIsThinking(false);
            // 注意：isBusyRef 會在最後一句 speak 的 onend 中釋放
        }
    };

    return { response, setResponse, isThinking, isSpeaking, askLumos, speak };
}
