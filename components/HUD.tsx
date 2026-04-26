"use client";

import {
    Activity,
    Battery,
    BatteryCharging,
    Cpu,
    Globe,
    ShieldCheck,
    Thermometer,
    Wifi,
    WifiOff,
} from "lucide-react";

function Skeleton({ width = "w-12" }: { width?: string }) {
    return (
        <span
            className={`inline-block h-2 ${width} bg-cyan-900/30 animate-pulse rounded-sm relative overflow-hidden`}
        >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-[shimmer_1.5s_infinite]" />
        </span>
    );
}

function BatteryStatus({
    level,
    isCharging,
}: {
    level: string | null;
    isCharging: boolean | null;
}) {
    if (level === null) return <Skeleton width="w-10" />;
    const pct = parseInt(level);
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">{pct}%</span>
            <div className="relative">
                {isCharging ? (
                    <BatteryCharging
                        className="w-4 h-4 text-yellow-400 animate-pulse"
                        strokeWidth={1.5}
                    />
                ) : (
                    <Battery
                        className={`w-4 h-4 ${
                            pct < 20
                                ? "text-red-500 animate-bounce"
                                : "text-cyan-500/80"
                        }`}
                        strokeWidth={1.5}
                    />
                )}
            </div>
        </div>
    );
}

export const SideTelemetry = ({ data }: { data: any }) => {
    // 強制轉換為數字，確保 load 係正向增加
    const load = data?.memory?.percent || 0;

    // ⚛️ 能量條顏色邏輯：
    // 0-60%: 青色 (Stable)
    // 60-85%: 黃色 (Stress)
    // 85-100%: 紅色 (Critical)
    const getColor = (p: number) => {
        if (p > 85) return "#ff4444"; // Red
        if (p > 60) return "#ffcc00"; // Yellow
        return "#22d3ee"; // Cyan
    };

    const activeColor = getColor(load);

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 flex items-center gap-6 z-50 pointer-events-none font-mono">
            <div className="flex flex-col gap-10 text-right">
                <div className="space-y-1">
                    <p className="text-[10px] opacity-30 uppercase tracking-[0.3em]">
                        Neural Pressure
                    </p>
                    <div className="flex flex-col items-end">
                        <span
                            className="text-xs font-black transition-colors duration-500"
                            style={{ color: activeColor }}
                        >
                            LOAD_LEVEL: {load}%
                        </span>
                        <span className="text-[9px] opacity-40 uppercase">
                            {data?.memory?.used} / {data?.memory?.total}
                        </span>
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] opacity-30 uppercase tracking-[0.3em]">
                        GPU Cluster
                    </p>
                    <div className="text-right">
                        <span className="text-[10px] text-cyan-400 font-bold tracking-widest">
                            M-SERIES_ACTIVE
                        </span>
                    </div>
                </div>
            </div>

            {/* ⚛️ 垂直壓力計：確保 bottom-0 向上升 */}
            <div className="h-80 w-12 flex flex-col items-end justify-between py-2 relative border-r border-white/5">
                {/* 軌道背景 */}
                <div className="absolute right-0 bottom-0 w-[1px] bg-white/10 h-full" />

                {/* 能量條：思考時 Load 升，呢度就升 */}
                <div
                    className="absolute right-0 bottom-0 w-[4px] transition-all duration-[800ms] ease-out origin-bottom"
                    style={{
                        height: `${load}%`,
                        backgroundColor: activeColor,
                        boxShadow: `0 0 20px ${activeColor}`,
                    }}
                />

                {/* 刻度 */}
                {[...Array(11)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-[1px] transition-colors duration-500 ${
                            load > (10 - i) * 10 ? "bg-white/60" : "bg-white/10"
                        }`}
                    />
                ))}

                {/* 浮動指針：跟隨 Load 向上衝 */}
                <div
                    className="absolute -right-[4px] w-2.5 h-4 transition-all duration-[800ms] ease-out z-20"
                    style={{
                        bottom: `calc(${load}% - 8px)`,
                        backgroundColor: activeColor,
                        boxShadow: `0 0 25px ${activeColor}`,
                        clipPath: "polygon(0% 20%, 100% 50%, 0% 80%)",
                    }}
                />
            </div>
        </div>
    );
};

export function TopHUD({ data, agentName }: { data: any; agentName: string }) {
    const isError = data.error || !data.isOnline;

    return (
        <div
            className={`fixed top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none transition-colors duration-500 ${
                isError ? "text-red-500" : "text-cyan-500/60"
            }`}
        >
            <div className="text-[10px] tracking-[0.2em] space-y-2">
                <div className="flex items-center gap-2">
                    <Cpu
                        className={`w-3.5 h-3.5 ${
                            isError ? "text-red-400" : "text-cyan-400"
                        }`}
                        strokeWidth={2}
                    />
                    <p
                        className={`font-bold ${
                            isError ? "text-red-400" : "text-cyan-400"
                        }`}
                    >
                        {agentName}_CORE //{" "}
                        {data.error
                            ? "SYS_ERR"
                            : data.isOnline
                            ? "STABLE"
                            : "OFFLINE"}
                    </p>
                </div>
                <div className="flex items-center gap-2 opacity-80">
                    <Thermometer className="w-3 h-3" strokeWidth={1.5} />
                    <p>
                        TEMP:{" "}
                        {data.temp ? (
                            `${data.temp}°C`
                        ) : (
                            <Skeleton width="w-6" />
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 opacity-80">
                    <Globe className="w-3 h-3" strokeWidth={1.5} />
                    <p>LOCATION: {data.city || <Skeleton width="w-16" />}</p>
                </div>
            </div>

            <div className="text-[10px] tracking-[0.2em] text-right space-y-2">
                <div className="flex items-center justify-end gap-2">
                    <p>SYSTEM_SECURED</p>
                    <ShieldCheck
                        className="w-3 h-3 text-cyan-400"
                        strokeWidth={2}
                    />
                </div>
                <div className="flex items-center justify-end gap-2">
                    <p>
                        UPLINK_STATUS:{" "}
                        <span
                            className={
                                data.isOnline ? "text-cyan-400" : "text-red-500"
                            }
                        >
                            {data.isOnline ? "ACTIVE" : "SEVERED"}
                        </span>
                    </p>
                    <Activity
                        className={`w-3 h-3 ${
                            data.isOnline ? "animate-pulse" : "opacity-20"
                        }`}
                        strokeWidth={1.5}
                    />
                </div>
                <div className="flex justify-end items-center gap-2">
                    <span>POWER:</span>
                    <BatteryStatus
                        level={data.battery}
                        isCharging={data.isCharging}
                    />
                </div>
            </div>
        </div>
    );
}

export function BottomHUD({ ping }: { ping: string | null }) {
    const isOffline = ping === "ERR" || !ping;
    return (
        <div className="fixed bottom-6 right-6 flex items-end gap-4 z-50 pointer-events-none opacity-40 text-[10px] tracking-[0.2em]">
            <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                    <span>SIGNAL_STRENGTH</span>
                    {isOffline ? (
                        <WifiOff className="w-3 h-3 text-red-500" />
                    ) : (
                        <Wifi className="w-3 h-3" />
                    )}
                </div>
                <div className="flex items-center justify-end gap-2">
                    <span>LATENCY:</span>
                    <span
                        className={`font-bold ${
                            isOffline ? "text-red-500" : ""
                        }`}
                    >
                        {ping && ping !== "ERR" ? `${ping}MS` : "---"}
                    </span>
                </div>
            </div>
            <div className="w-10 h-10 border border-cyan-500/30 flex items-center justify-center relative overflow-hidden">
                {!isOffline && (
                    <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                )}
                <div
                    className={`w-[1px] h-6 ${
                        isOffline
                            ? "bg-red-500"
                            : "bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-[bounce_2s_infinite]"
                    }`}
                />
            </div>
        </div>
    );
}
