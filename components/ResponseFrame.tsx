"use client";

interface ResponseOverlayProps {
    show: boolean;
    systemStatus: string;
    response: string;
    isThinking: boolean;
    transcript: string;
}

export default function ResponseFrame({
    show,
    systemStatus,
    response,
    isThinking,
    transcript,
}: ResponseOverlayProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-40 px-6 pointer-events-none">
            {/* ⚛️ 高通透、極簡邊框設計 */}
            <div className="w-full max-w-2xl bg-cyan-950/5 backdrop-blur-[2px] border-y border-cyan-500/20 p-8 relative pointer-events-auto animate-in fade-in zoom-in-95 duration-500">
                {/* 頂部發光掃描線 */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.5)]" />

                {/* HEADER: 系統狀態與數據 */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-2 w-2">
                            <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    isThinking ? "bg-red-400" : "bg-cyan-400"
                                }`}
                            ></span>
                            <span
                                className={`relative inline-flex rounded-full h-2 w-2 ${
                                    isThinking ? "bg-red-500" : "bg-cyan-500"
                                }`}
                            ></span>
                        </span>
                        <span className="text-[10px] tracking-[0.5em] text-cyan-400 font-bold uppercase drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]">
                            {systemStatus}
                        </span>
                    </div>
                    <div className="text-[8px] text-cyan-500/40 font-mono flex gap-4">
                        <span className="animate-pulse">STREAMING_ACTIVE</span>
                        <span className="hidden md:inline">
                            ENCRYPT: AES-GCM
                        </span>
                    </div>
                </div>

                {/* TEXT CONTENT: 自發光文字 */}
                <div className="relative">
                    <p className="text-lg md:text-xl text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] font-light leading-relaxed tracking-wide text-center">
                        {response}
                        {isThinking && (
                            <span className="inline-block w-1.5 h-5 ml-2 bg-cyan-400 animate-pulse align-middle" />
                        )}
                    </p>
                </div>

                {/* INPUT LOG: 底部浮動標籤 */}
                {transcript && !isThinking && (
                    <div className="mt-6 flex justify-center">
                        <div className="px-4 py-0.5 border border-cyan-500/20 rounded-sm bg-cyan-500/5 backdrop-blur-md">
                            <span className="text-[9px] text-cyan-400/50 italic tracking-widest">
                                CMD_LOG: {transcript.toUpperCase()}
                            </span>
                        </div>
                    </div>
                )}

                {/* 裝飾性側邊支架 */}
                <div className="absolute -left-1 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
                <div className="absolute -right-1 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
            </div>
        </div>
    );
}
