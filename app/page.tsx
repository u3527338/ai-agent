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
                /Electron/i.test(navigator.userAgent));
        setIsElectron(check);
        if (check) setHasInteracted(true);
    }, []);

    // 🚀 當滑鼠移入/移出球體時，通知 Electron 恢復或取消穿透
    useEffect(() => {
        if (isElectron && (window as any).ipcRenderer) {
            (window as any).ipcRenderer.send("set-ignore-mouse", !isHovered);
        }
    }, [isHovered, isElectron]);

    const {
        isThinking,
        isSpeaking,
        askLumos,
        response,
        setResponse,
        speak,
        stopSpeaking,
    } = useChat();

    const handleWake = useCallback(
        (
            active: boolean,
            command?: string,
            isFirstWake?: boolean,
            isShuttingDown?: boolean
        ) => {
            if (isShuttingDown) {
                stopSpeaking();
                setResponse(SHUTDOWN_RESPONSE);
                speak(SHUTDOWN_RESPONSE);
                return;
            }
            if (isFirstWake) {
                setResponse(WAKE_RESPONSE);
                speak(WAKE_RESPONSE);
                return;
            }
            if (command === "__PREWAKE_TIMEOUT__") {
                setResponse(STANDBY_RESPONSE);
                speak(STANDBY_RESPONSE);
                return;
            }
            if (command && command.length > 1) askLumos(command);
        },
        [speak, setResponse, askLumos, stopSpeaking]
    );

    const { transcript, isActive, isPreWaking } = useSpeech(
        getWakeWord,
        getShutdownWord,
        handleWake,
        () => setResponse("")
    );

    const isExpanded = useMemo(
        () => (!isElectron ? true : isHovered),
        [isElectron, isHovered]
    );

    const showOverlay = useMemo(() => {
        const hasValidResponse = !!(
            response && ![WAKE_RESPONSE, STANDBY_RESPONSE].includes(response)
        );
        return (hasValidResponse && !isPreWaking && isActive) || isSpeaking;
    }, [isSpeaking, response, isActive, isPreWaking]);

    return (
        /* ✨ 關鍵 1: 動態背景。Electron 下全透明，Browser 下全黑 */
        <main
            className={`min-h-screen w-full relative overflow-hidden select-none ${
                isElectron ? "bg-transparent" : "bg-black"
            }`}
        >
            {/* ⚛️ Lumos 核心球體 (右上角固定) */}
            <div
                className="absolute top-5 right-5 z-50 pointer-events-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={
                    { WebkitAppRegion: isHovered ? "drag" : "no-drag" } as any
                }
            >
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
            </div>

            {/* ✨ 關鍵 2: 科技感 HUD - 僅在非 Electron 或 Hover 時顯示 */}
            <div
                className={`transition-opacity duration-500 ${
                    isElectron && !isHovered && !isSpeaking
                        ? "opacity-0"
                        : "opacity-100"
                }`}
            >
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

            {/* 初始化遮罩 (僅在 Browser 顯示) */}
            {!hasInteracted && !isElectron && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl pointer-events-auto"
                    onClick={() => setHasInteracted(true)}
                >
                    <div className="text-center p-16 border border-cyan-500/20 rounded-full">
                        <p className="animate-pulse tracking-[1.5em] text-[10px] uppercase text-cyan-500">
                            INITIALIZE NEURAL LINK
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}
