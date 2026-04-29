"use client";

import ArcReactor from "@/components/ArcReactor";
import MemoryPressureGraph, {
    BottomHUD,
    TopHUD
} from "@/components/HUD";
import ResponseFrame from "@/components/ResponseFrame";
import {
    AGENT_NAME,
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
    const { isThinking, isSpeaking, askLumos, response, setResponse, speak } =
        useChat();

    // ⚛️ Memory Graph 歷史數據管理
    const [history, setHistory] = useState<{ value: number }[]>(
        new Array(40).fill({ value: 0 })
    );

    useEffect(() => {
        if (sysData.memory) {
            setHistory((prev) => [
                ...prev.slice(1),
                { value: sysData.memory!.percent },
            ]);
        }
    }, [sysData.memory]);

    // ⚛️ 唯一指令入口
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
        if (typeof window !== "undefined") {
            window.speechSynthesis.cancel();
        }
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

    const showOverlay = useMemo((): boolean => {
        const hasValidResponse = !!(
            response && ![WAKE_RESPONSE, STANDBY_RESPONSE].includes(response)
        );
        return (hasValidResponse && !isPreWaking && isActive) || isSpeaking;
    }, [isSpeaking, response, isActive, isPreWaking]);

    return (
        <main
            className={`min-h-screen bg-[#020508] ${THEME.primary} font-mono overflow-hidden relative select-none`}
            onClick={() => !hasInteracted && setHasInteracted(true)}
        >
            {!hasInteracted && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl">
                    <div className="text-center p-16 border border-cyan-500/20 rounded-full animate-pulse cursor-pointer">
                        <p
                            className={`${THEME.primary} tracking-[1.5em] font-black text-[10px] uppercase`}
                        >
                            INITIALIZE NEURAL LINK
                        </p>
                    </div>
                </div>
            )}

            <div
                className={`transition-all duration-1000 ease-in-out ${
                    showOverlay
                        ? "opacity-50 scale-98 brightness-90 blur-[0.5px]"
                        : "opacity-100 scale-100 brightness-100 blur-none"
                }`}
            >
                <TopHUD data={sysData} agentName={AGENT_NAME} />

                <div className="absolute bottom-10 left-10 z-50 w-64">
                    <MemoryPressureGraph data={history} />
                </div>

                <div className="flex items-center justify-center min-h-screen">
                    <ArcReactor
                        isOnline={sysData.isOnline}
                        isActive={isActive}
                        isSpeaking={isSpeaking}
                        isThinking={isThinking}
                        isPreWaking={isPreWaking}
                    />
                </div>
                <BottomHUD ping={sysData.ping} />
            </div>

            <ResponseFrame
                show={showOverlay}
                response={response}
                transcript={transcript}
            />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] z-40 bg-[length:100%_4px]" />
        </main>
    );
}
