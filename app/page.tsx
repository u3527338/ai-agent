"use client";

import ArcReactor from "@/components/ArcReactor";
import { BottomHUD, SideTelemetry, TopHUD } from "@/components/HUD";
import ResponseFrame from "@/components/ResponseFrame";
import {
    AGENT_NAME,
    SHUTDOWN_RESPONSE,
    STANDBY_RESPONSE,
    WAKE_RESPONSE,
} from "@/helpers/constant";
import { getShutdownWord, getWakeWord } from "@/helpers/function";
import { useChat } from "@/hooks/useChat";
import { useSpeech } from "@/hooks/useSpeech";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useCallback, useMemo, useState } from "react";

export default function Home() {
    const { sysData } = useTelemetry();
    const [hasInteracted, setHasInteracted] = useState(false);
    const { isThinking, isSpeaking, askLumos, response, setResponse, speak } =
        useChat();

    // ⚛️ 唯一指令入口
    const handleWake = useCallback(
        (isAlreadyAwake: boolean, command?: string) => {
            if (command && command.length > 1) {
                // 只有包含 Lumos 嘅指令先會嚟到呢度
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

    const { transcript, isActive, isPreWaking, resetTranscript } = useSpeech(
        getWakeWord,
        getShutdownWord,
        handleWake,
        handleShutDown
    );

    // ⚛️ 移除咗原本自動 askLumos(transcript) 嘅 useEffect
    // 依家 transcript 只用嚟喺 ResponseFrame 顯示你講緊乜，唔會自動發送指令

    const showOverlay = useMemo((): boolean => {
        const hasValidResponse = !!(
            response && ![WAKE_RESPONSE, STANDBY_RESPONSE].includes(response)
        );
        return (isSpeaking || (hasValidResponse && !isPreWaking)) && isActive;
    }, [isThinking, isSpeaking, response, isActive, isPreWaking]);

    const systemStatus = useMemo(() => {
        if (isThinking) return "ANALYSING";
        if (isSpeaking) return "TRANSMITTING";
        if (isPreWaking) return "SYNCING";
        if (isActive) return "LISTENING";
        return "STANDBY";
    }, [isThinking, isSpeaking, isActive, isPreWaking]);

    return (
        <main
            className="min-h-screen bg-[#020508] text-cyan-500 font-mono overflow-hidden relative select-none"
            onClick={() => !hasInteracted && setHasInteracted(true)}
        >
            {!hasInteracted && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl">
                    <div className="text-center p-16 border border-cyan-500/20 rounded-full animate-pulse cursor-pointer">
                        <p className="text-cyan-400 tracking-[1.5em] font-black text-[10px] uppercase">
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
                <SideTelemetry data={sysData} />
                <div className="flex items-center justify-center min-h-screen">
                    <ArcReactor
                        isListening={isActive || isPreWaking}
                        isThinking={isThinking}
                        isPreWaking={isPreWaking}
                    />
                </div>
                <BottomHUD ping={sysData.ping} />
            </div>

            <ResponseFrame
                show={showOverlay}
                systemStatus={systemStatus}
                response={response}
                isThinking={isThinking}
                transcript={transcript}
            />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] z-40 bg-[length:100%_4px]" />
        </main>
    );
}
