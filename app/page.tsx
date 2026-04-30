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
        if (check) {
            setTimeout(() => setHasInteracted(true), 1000);
        }
    }, []);

    const {
        isThinking,
        isSpeaking,
        askLumos,
        response,
        setResponse,
        speak,
        stopSpeaking,
    } = useChat();

    /**
     * 核心邏輯：處理從 useSpeech 傳來的所有狀態變更
     */
    const handleWake = useCallback(
        (
            active: boolean,
            command?: string,
            isFirstWake?: boolean,
            isShuttingDown?: boolean
        ) => {
            // 1. 關機邏輯 (Active -> Inactive)
            if (isShuttingDown) {
                stopSpeaking();
                setResponse(SHUTDOWN_RESPONSE);
                speak(SHUTDOWN_RESPONSE);
                return;
            }

            // 2. 初次喚醒邏輯 (Inactive -> Active / Gray -> Blue)
            if (isFirstWake) {
                setResponse(WAKE_RESPONSE);
                speak(WAKE_RESPONSE);
                return;
            }

            // 3. 橘色待命超時邏輯 (Orange -> Blue)
            if (command === "__PREWAKE_TIMEOUT__") {
                setResponse(STANDBY_RESPONSE);
                speak(STANDBY_RESPONSE);
                return;
            }

            // 4. 正式接收指令 (Orange -> Active)
            if (command && command.length > 1) {
                askLumos(command);
            }
        },
        [speak, setResponse, askLumos, stopSpeaking]
    );

    const handleShutDown = useCallback(() => {
        setResponse("");
    }, [setResponse]);

    const { transcript, isActive, isPreWaking } = useSpeech(
        getWakeWord,
        getShutdownWord,
        handleWake,
        handleShutDown
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
        <main className="min-h-screen w-full relative overflow-hidden select-none bg-black">
            <div
                className={`absolute inset-0 flex flex-col ${
                    THEME?.primary || "text-cyan-400"
                } font-mono`}
            >
                {/* ⚛️ Lumos 核心球體 */}
                <div className="pointer-events-auto z-10">
                    <ElectronBall
                        isElectron={isElectron}
                        isExpanded={isExpanded}
                        onHoverChange={setIsHovered}
                        state={{
                            isOnline: sysData.isOnline,
                            isSpeaking,
                            isThinking,
                            isPreWaking, // 橘色燈號
                            isActive, // 藍色/灰色狀態
                        }}
                    />
                </div>

                {/* 初始化遮罩 */}
                {!hasInteracted && (
                    <div
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl pointer-events-auto cursor-pointer"
                        onClick={() => setHasInteracted(true)}
                    >
                        <div className="text-center p-16 border border-cyan-500/20 rounded-full">
                            <p className="animate-pulse tracking-[1.5em] text-[10px] uppercase text-cyan-500">
                                INITIALIZE NEURAL LINK
                            </p>
                        </div>
                    </div>
                )}

                {/* 你的原創 HUD 組件 */}
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

            {/* Electron 拖拽條 */}
            <div
                className="fixed top-0 left-0 w-full h-8 z-[9999]"
                style={{ WebkitAppRegion: "drag" } as any}
            />
        </main>
    );
}
