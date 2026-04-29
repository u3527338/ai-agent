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
        console.log({check})
        if (check) {
            setTimeout(() => setHasInteracted(true), 1000);
        }
    }, []);

    const { isThinking, isSpeaking, askLumos, response, setResponse, speak } =
        useChat();

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
            {/* ⚛️ 修正 3：外層容器確保有顏色和佈局 */}
            <div
                className={`absolute inset-0 flex flex-col ${
                    THEME?.primary || "text-cyan-400"
                } font-mono`}
            >
                {/* 你的原創球體組件 */}
                <div className="pointer-events-auto z-10">
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

                {/* 初始化遮罩 (只有非 Electron 或未交互時顯示) */}
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

            {/* 透明視窗專用的拖動條 */}
            <div
                className="fixed top-0 left-0 w-full h-8 z-[9999]"
                style={{ WebkitAppRegion: "drag" } as any}
            />
        </main>
    );
}
