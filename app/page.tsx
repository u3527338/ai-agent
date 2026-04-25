"use client";

import ArcReactor from "@/components/ArcReactor";
import { BottomHUD, SideTelemetry, TopHUD } from "@/components/HUD";
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
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Home() {
    const { sysData } = useTelemetry();
    const [hasInteracted, setHasInteracted] = useState(false);
    const { isThinking, isSpeaking, askLumos, setResponse, speak } = useChat();

    const handleWake = useCallback(
        (isAwake: boolean) => {
            const msg = isAwake ? STANDBY_RESPONSE : WAKE_RESPONSE;
            setResponse(msg);
            speak(msg);
        },
        [speak, setResponse]
    );

    const handleShutDown = useCallback(() => {
        const msg = SHUTDOWN_RESPONSE;
        setResponse(msg);
        speak(msg);
    }, [speak, setResponse]);

    const { transcript, isActive, resetTranscript } = useSpeech(
        getWakeWord,
        getShutdownWord,
        handleWake,
        handleShutDown
    );

    useEffect(() => {
        // ⚛️ FIREWALL: If LUMOS is thinking or speaking, plug his ears.
        if (isThinking || isSpeaking) {
            if (transcript !== "") {
                resetTranscript();
            }
            return;
        }

        // ⚛️ EXECUTION: Process valid human speech only
        if (isActive && transcript.trim().length > 0) {
            const query = transcript;
            if (query.startsWith(getWakeWord)) {
                const parts = query.split(getWakeWord);
                const actualCommand = parts[parts.length - 1].trim();

                if (actualCommand.length > 0) {
                    console.log("⚛️ Executing command:", actualCommand);
                    resetTranscript();
                    askLumos(actualCommand);
                } else {
                    resetTranscript();
                }
            }
        }
    }, [
        transcript,
        isActive,
        isThinking,
        isSpeaking,
        askLumos,
        resetTranscript,
    ]);

    const systemStatus = useMemo(() => {
        if (isThinking) return "ANALYSING";
        if (isSpeaking) return "TRANSMITTING";
        if (isActive) return "LISTENING";
        return "STANDBY";
    }, [isThinking, isSpeaking, isActive]);

    return (
        <main
            className="min-h-screen bg-[#020508] text-cyan-500 font-mono overflow-hidden relative p-8"
            onClick={() => !hasInteracted && setHasInteracted(true)}
        >
            {!hasInteracted && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
                    <div className="text-center p-12 border border-cyan-500/20 rounded-full animate-pulse cursor-pointer">
                        <p className="text-cyan-400 tracking-[1em] font-black text-[10px] uppercase">
                            INITIALIZE NEURAL LINK
                        </p>
                    </div>
                </div>
            )}

            <TopHUD data={sysData} agentName={AGENT_NAME} />
            <SideTelemetry />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                <ArcReactor isListening={isActive} isThinking={isThinking} />

                <div className="mt-20 w-full max-w-2xl text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div
                            className={`w-2 h-2 rounded-full ${
                                isThinking
                                    ? "bg-red-500 animate-ping"
                                    : "bg-cyan-500 shadow-[0_0_8px_cyan]"
                            }`}
                        />
                        <span className="text-[10px] tracking-[0.5em] text-cyan-400 opacity-60 uppercase">
                            {systemStatus}
                        </span>
                    </div>

                    <div className="h-16 flex items-center justify-center">
                        {isActive &&
                            !isThinking &&
                            !isSpeaking &&
                            transcript && (
                                <p className="text-sm text-cyan-400/70 italic tracking-widest animate-pulse">
                                    {`> ${transcript}`}
                                </p>
                            )}
                    </div>
                </div>
            </div>

            <BottomHUD ping={sysData.ping} />
        </main>
    );
}
