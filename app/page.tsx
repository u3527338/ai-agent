"use client";

import ElectronBall from "@/components/ElectronBall";
import NeuralInterface from "@/components/NeuralInterface";
import {
    SHUTDOWN_RESPONSE,
    STANDBY_RESPONSE,
    THEME,
    WAKE_RESPONSE,
} from "@/helpers/constant";
import { getShutdownWord, getWakeWord } from "@/helpers/function";
import { useChat } from "@/hooks/useChat";
import { useSpeech } from "@/hooks/useSpeech";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Home() {
    const { sysData } = useTelemetry();
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        const check =
            typeof window !== "undefined" &&
            (!!(window as any).ipcRenderer ||
                navigator.userAgent.includes("Lumos-Electron"));
        setIsElectron(check);
    }, []);

    const { isThinking, isSpeaking, askLumos, response, setResponse, speak } =
        useChat();

    // ⚛️ 指令入口 (保持不變)
    const handleWake = useCallback(
        (isAlreadyAwake: boolean, command?: string) => {
            if (command && command.length > 1) {
                askLumos(command);
            } else {
                const msg = isAlreadyAwake ? STANDBY_RESPONSE : WAKE_RESPONSE;
                setResponse(msg);
                speak(msg);
            }
        },
        [speak, setResponse, askLumos]
    );

    const handleShutDown = useCallback(() => {
        if (typeof window !== "undefined") window.speechSynthesis.cancel();
        const msg = SHUTDOWN_RESPONSE;
        setResponse(msg);
        speak(msg);
    }, [speak, setResponse]);

    const { transcript, isActive, isPreWaking } = useSpeech(
        getWakeWord,
        getShutdownWord,
        handleWake,
        handleShutDown
    );

    // ⚛️ 狀態判定
    const isExpanded = useMemo(() => {
        if (!isElectron) return true;
        return isHovered;
    }, [isElectron, isHovered]);

    const showOverlay = useMemo(() => {
        const hasValidResponse = !!(
            response && ![WAKE_RESPONSE, STANDBY_RESPONSE].includes(response)
        );
        return (hasValidResponse && !isPreWaking && isActive) || isSpeaking;
    }, [isSpeaking, response, isActive, isPreWaking]);

    return (
        <main
            className="min-h-screen w-full relative overflow-hidden select-none pointer-events-none bg-transparent"
            style={{ color: "inherit" }}
        >
            {/* 1. 建立一個專門負責「視覺樣式」的容器層 */}
            <div
                className={`absolute inset-0 flex flex-col ${THEME.primary} font-mono`}
            >
                {/* 1. 處理 Electron 專屬的物理層 (感應與狀態球) */}
                <ElectronBall
                    isElectron={isElectron}
                    isExpanded={isExpanded}
                    onHoverChange={setIsHovered}
                    state={{
                        isOnline: sysData.isOnline,
                        isSpeaking,
                        isThinking,
                        isPreWaking,
                        isActive,
                    }}
                />

                {/* 2. 處理初始化遮罩 */}
                {!hasInteracted && (
                    <div
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl pointer-events-auto cursor-pointer"
                        onClick={() => setHasInteracted(true)}
                    >
                        <div className="text-center p-16 border border-cyan-500/20 rounded-full animate-pulse">
                            <p
                                className={`${THEME.primary} tracking-[1.5em] font-black text-[10px] uppercase`}
                            >
                                INITIALIZE NEURAL LINK
                            </p>
                        </div>
                    </div>
                )}

                {/* 3. 處理 HUD 內容與動畫 */}
                <NeuralInterface
                    isExpanded={isExpanded}
                    isElectron={isElectron}
                    sysData={sysData}
                    showOverlay={showOverlay}
                    isActive={isActive}
                    isSpeaking={isSpeaking}
                    isThinking={isThinking}
                    isPreWaking={isPreWaking}
                    response={response}
                    transcript={transcript}
                />
            </div>
        </main>
    );
}
