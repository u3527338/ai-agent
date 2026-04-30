"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lumos 語音控制核心 Hook
 * 實現 Inactive (Gray) -> Active (Blue) -> Pre-waking (Orange) 的狀態切換
 * 具備「長指令強制靜音鎖」，防止長句子被超時回應中斷
 */
export function useSpeech(
    wakeWord: string,
    shutDownWord: string,
    onWake: (
        active: boolean,
        command?: string,
        isFirstWake?: boolean,
        isShuttingDown?: boolean
    ) => void,
    onShutDown: () => void
) {
    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isPreWaking, setIsPreWaking] = useState(false);

    const isActiveRef = useRef(false);
    const isPreWakingRef = useRef(false);
    const isProcessingRef = useRef(false); // ✨ 強制靜音鎖：防止長句子處理時觸發超時
    const preWakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbacksRef = useRef({ onWake, onShutDown });

    // 同步 Callback 引用，避免 useEffect 閉包問題
    useEffect(() => {
        callbacksRef.current = { onWake, onShutDown };
    }, [onWake, onShutDown]);

    /**
     * 物理清除所有計時器
     */
    const clearAllTimeouts = useCallback(() => {
        if (preWakeTimeoutRef.current) {
            clearTimeout(preWakeTimeoutRef.current);
            preWakeTimeoutRef.current = null;
        }
    }, []);

    /**
     * 核心狀態變更函數
     */
    const commitState = useCallback(
        (
            active: boolean,
            preWake: boolean,
            command?: string,
            isFirstWake?: boolean,
            isShuttingDown?: boolean
        ) => {
            // 執行任何狀態變更前，先物理性殺死所有倒數計時
            clearAllTimeouts();

            isActiveRef.current = active;
            isPreWakingRef.current = preWake;

            setIsActive(active);
            setIsPreWaking(preWake);

            // 執行 UI 回調
            callbacksRef.current.onWake(
                active,
                command,
                isFirstWake,
                isShuttingDown
            );

            if (isShuttingDown) {
                setTimeout(() => callbacksRef.current.onShutDown(), 2000);
            }
        },
        [clearAllTimeouts]
    );

    /**
     * 設置橘色模式的待命超時計時
     */
    const setupPreWakeTimeout = useCallback(
        (ms: number = 5000) => {
            clearAllTimeouts();

            // 如果偵測到指令正在處理中，絕對不允許啟動超時計時
            if (isProcessingRef.current) return;

            preWakeTimeoutRef.current = setTimeout(() => {
                // 最後檢查：只有在橘色模式且「沒有」正在處理指令時才執行
                if (isPreWakingRef.current && !isProcessingRef.current) {
                    console.log(
                        "⏳ [Lumos] Pre-wake timeout reached. Sending standby response."
                    );
                    callbacksRef.current.onWake(true, "__PREWAKE_TIMEOUT__");
                    setIsPreWaking(false);
                    isPreWakingRef.current = false;
                }
            }, ms);
        },
        [clearAllTimeouts]
    );

    /**
     * 處理來自 Python 的文字流
     */
    const processIncomingText = useCallback(
        (fullText: string) => {
            const text = fullText.toLowerCase().trim();
            if (!text) return;

            const wakeW = wakeWord.toLowerCase();
            const shutW = shutDownWord.toLowerCase();

            // 🛑 1. 關機邏輯 (優先級最高)
            if (isActiveRef.current && text.includes(shutW)) {
                commitState(false, false, undefined, false, true);
                return;
            }

            // 🟠 2. 橘色模式 (Pre-waking) 下的攔截邏輯
            if (isPreWakingRef.current) {
                // A. 如果只是重複收到喚醒字，視為「續約」，重設 5 秒等待
                if (text === wakeW) {
                    setupPreWakeTimeout(5000);
                    return;
                }

                // B. ✨【核心修正】偵測到實質指令 (長句子或短句)
                // 立即鎖死，物理性攔截任何即將觸發的超時回應
                isProcessingRef.current = true;
                clearAllTimeouts();

                // 執行正式指令並回歸藍色模式
                commitState(true, false, text);

                // 指令發出後 1.5 秒解鎖，確保狀態完全切換
                setTimeout(() => {
                    isProcessingRef.current = false;
                }, 1500);
                return;
            }

            // 🌑 3. Stage 1: 灰色 -> 藍色 (初次喚醒)
            if (!isActiveRef.current && text.includes(wakeW)) {
                commitState(true, false, undefined, true);
                return;
            }

            // 🔵 4. Stage 2: 藍色 -> 橘色 (二次喚醒，準備聽令)
            if (
                isActiveRef.current &&
                !isPreWakingRef.current &&
                text.includes(wakeW)
            ) {
                commitState(true, true);
                // 給予 7 秒的寬裕時間應對 Python 處理長句子的 STT 延遲
                setupPreWakeTimeout(7000);
            }
        },
        [
            wakeWord,
            shutDownWord,
            commitState,
            clearAllTimeouts,
            setupPreWakeTimeout,
        ]
    );

    /**
     * 連接 Python 語音橋樑 (SSE)
     */
    useEffect(() => {
        let sse: EventSource;
        let retryTimeout: NodeJS.Timeout;

        const connect = () => {
            console.log("🔗 Connecting to Lumos Voice Bridge (SSE)...");
            sse = new EventSource("/api/speech");

            sse.onopen = () => {
                setIsListening(true);
                console.log("✅ Voice Bridge Connected");
            };

            sse.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.text) {
                        console.log("🎙️ Incoming Voice Data:", data.text);
                        setTranscript(data.text);
                        processIncomingText(data.text);
                    }
                } catch (e) {
                    console.error("Failed to parse speech data", e);
                }
            };

            sse.onerror = () => {
                setIsListening(false);
                sse.close();
                console.warn("⚠️ Voice Bridge Disconnected. Retrying in 3s...");
                retryTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (sse) sse.close();
            if (retryTimeout) clearTimeout(retryTimeout);
            clearAllTimeouts();
        };
    }, [processIncomingText, clearAllTimeouts]);

    return {
        transcript,
        isListening,
        isActive,
        isPreWaking,
        setIsActive,
        resetTranscript: () => setTranscript(""),
    };
}
