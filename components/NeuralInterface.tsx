"use client";

import ArcReactor from "@/components/ArcReactor";
import MemoryPressureGraph, { BottomHUD, TopHUD } from "@/components/HUD";
import ResponseFrame from "@/components/ResponseFrame";
import { AGENT_NAME } from "@/helpers/constant";
import { useEffect, useState } from "react";

export default function NeuralInterface({
    isExpanded,
    isElectron,
    sysData,
    showOverlay,
    isActive,
    isSpeaking,
    isThinking,
    isPreWaking,
    response,
    transcript,
}: any) {
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

    return (
        <div
            className={`transition-all duration-700 ease-in-out w-full h-full ${
                isExpanded
                    ? "opacity-100 scale-100 blur-none"
                    : "opacity-0 scale-95 blur-xl pointer-events-none"
            }`}
        >
            {!isElectron && (
                <div className="absolute inset-0 bg-[#020508] -z-10" />
            )}

            <div
                className={`transition-all duration-1000 ${
                    showOverlay
                        ? "opacity-50 brightness-50 blur-[1px]"
                        : "opacity-100"
                }`}
            >
                <TopHUD data={sysData} agentName={AGENT_NAME} />

                <MemoryPressureGraph data={history} />

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
        </div>
    );
}
