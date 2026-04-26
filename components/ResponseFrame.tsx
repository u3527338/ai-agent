"use client";

import { AGENT_NAME } from "@/helpers/constant";

interface ResponseOverlayProps {
    show: boolean;
    response: string;
    transcript?: string;
    metadata?: string; // 接收父組件傳入的任何真實數據 (如位置或時間)
}

export default function ResponseFrame({
    show,
    response,
    transcript,
    metadata,
}: ResponseOverlayProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-40 px-6 pointer-events-none font-mono">
            {/* ⚛️ 極簡 UI：僅保留頂部發光線條與高通透背景 */}
            <div className="w-full max-w-2xl bg-slate-950/5 backdrop-blur-[2px] border-t border-cyan-500/20 p-8 relative pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* 頂部裝飾：一個極窄的中心發光條 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                {/* HEADER: 僅保留必要的標示 */}
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                        <span className="text-[10px] font-bold text-white/80 tracking-[0.3em] uppercase">
                            {AGENT_NAME}
                        </span>
                    </div>

                    {metadata && (
                        <div className="text-[9px] text-cyan-500/40 tracking-tighter">
                            {metadata}
                        </div>
                    )}
                </div>

                {/* TEXT CONTENT: 核心回應文字 */}
                <div className="relative py-2 flex items-center justify-center">
                    <p className="text-xl md:text-2xl text-white font-extralight tracking-tight leading-snug text-center">
                        {response}
                    </p>
                </div>

                {/* FOOTER: 極淡的指令紀錄 */}
                {transcript && (
                    <div className="mt-8 flex justify-center opacity-20">
                        <span className="text-[8px] text-white italic tracking-widest uppercase border-x border-white/10 px-6">
                            {transcript}
                        </span>
                    </div>
                )}

                {/* 極簡角標 */}
                <div className="absolute bottom-0 left-0 w-1 h-1 bg-white/5" />
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/5" />
            </div>
        </div>
    );
}
