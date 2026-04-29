"use client";

import { BASE_COLOR, THEME } from "@/helpers/constant";
import {
    Activity,
    BatteryCharging,
    BatteryFull,
    BatteryLow,
    BatteryMedium,
    Cpu,
    Globe,
    LucideIcon,
    ShieldCheck,
    Thermometer,
    Wifi,
    WifiOff,
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";

// ⚛️ 輔助 Function：處理全域斷線色
const getStatusColor = (isOffline: boolean, defaultClass: string) =>
    isOffline ? "text-red-500" : defaultClass;

function Skeleton({ width = "w-12" }: { width?: string }) {
    return (
        <span
            className={`inline-block h-2 ${width} bg-${BASE_COLOR}-900/30 animate-pulse rounded-sm relative overflow-hidden`}
        >
            <span
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${THEME.shimmer} to-transparent animate-[shimmer_1.5s_infinite]`}
            />
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

    const getBatteryIcon = (): LucideIcon => {
        if (isCharging) return BatteryCharging;
        if (pct >= 70) return BatteryFull;
        if (pct >= 30) return BatteryMedium;
        return BatteryLow;
    };

    const getStyles = () => {
        const thresholds = [
            { limit: 80, color: "text-green-500" },
            { limit: 30, color: "text-yellow-400" },
            { limit: 0, color: "text-red-500" },
        ];
        const colorClass =
            thresholds.find((t) => pct >= t.limit)?.color || "text-red-500";
        const animationClass = isCharging
            ? "animate-pulse"
            : pct < 20
            ? "animate-bounce"
            : "";

        return `${colorClass} ${animationClass}`.trim();
    };

    const SelectedIcon = getBatteryIcon();

    return (
        <div className="flex items-center gap-1.5">
            <span className={`${getStyles().split(" ")[0]} font-bold`}>
                {pct}%
            </span>
            <SelectedIcon
                className={`w-4 h-4 ${getStyles()}`}
                strokeWidth={1.5}
            />
        </div>
    );
}

export const SideTelemetry = ({ data }: { data: any }) => {
    const isOffline = !data.isOnline;
    const load = data?.memory?.percent || 0;

    // 如果 Offline，強制條 Bar 變灰/紅，數值變紅
    const activeColor = isOffline
        ? "#ef4444"
        : load > 85
        ? "#ff4444"
        : load > 60
        ? "#ffcc00"
        : THEME.hex;

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 flex items-center gap-6 z-50 pointer-events-none font-mono">
            <div className="flex flex-col gap-10 text-right">
                <div className="space-y-1">
                    <p
                        className={`text-[10px] ${THEME.muted} uppercase tracking-[0.3em]`}
                    >
                        Neural Pressure
                    </p>
                    <div className="flex flex-col items-end">
                        <span
                            className="text-xs font-black transition-colors duration-500"
                            style={{ color: activeColor }}
                        >
                            {isOffline
                                ? "LINK_SEVERED"
                                : `LOAD_LEVEL: ${load}%`}
                        </span>
                        <span className={`text-[9px] ${THEME.muted} uppercase`}>
                            {data?.memory?.used} / {data?.memory?.total}
                        </span>
                    </div>
                </div>
                <div className="space-y-1">
                    <p
                        className={`text-[10px] ${THEME.muted} uppercase tracking-[0.3em]`}
                    >
                        GPU Cluster
                    </p>
                    <span
                        className={`text-[10px] ${getStatusColor(
                            isOffline,
                            THEME.primary
                        )} font-bold tracking-widest`}
                    >
                        {isOffline ? "CLUSTER_IDLE" : "M-SERIES_ACTIVE"}
                    </span>
                </div>
            </div>
            <div
                className={`h-80 w-12 flex flex-col items-end justify-between py-2 relative border-r ${THEME.border}`}
            >
                <div className="absolute right-0 bottom-0 w-[1px] bg-white/5 h-full" />
                <div
                    className="absolute right-0 bottom-0 w-[4px] transition-all duration-[800ms] ease-out origin-bottom"
                    style={{
                        height: isOffline ? "2%" : `${load}%`,
                        backgroundColor: activeColor,
                        boxShadow: `0 0 20px ${activeColor}`,
                    }}
                />
                {[...Array(11)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-[1px] transition-colors duration-500 ${
                            !isOffline && load > (10 - i) * 10
                                ? "bg-white/60"
                                : "bg-white/10"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export function TopHUD({ data, agentName }: { data: any; agentName: string }) {
    const isOffline = !data.isOnline || data.error;
    const statusColor = getStatusColor(isOffline, THEME.primary);

    return (
        <div
            className={`fixed top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none`}
        >
            <div className="text-[10px] tracking-[0.2em] space-y-2">
                <div
                    className={`flex items-center gap-2 font-bold ${statusColor}`}
                >
                    <Cpu className="w-3.5 h-3.5" strokeWidth={2} />
                    <p>
                        {agentName}_CORE //{" "}
                        {data.isOnline ? "STABLE" : "OFFLINE"}
                    </p>
                </div>
                <div className={`flex items-center gap-2 ${statusColor}`}>
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
                <div className={`flex items-center gap-2 ${statusColor}`}>
                    <Globe className="w-3 h-3" strokeWidth={1.5} />
                    <p>LOCATION: {data.city || <Skeleton width="w-16" />}</p>
                </div>
            </div>
            <div className="text-[10px] tracking-[0.2em] text-right space-y-2">
                <div
                    className={`flex items-center justify-end gap-2 ${statusColor}`}
                >
                    <p>SYSTEM_SECURED</p>
                    <ShieldCheck className={`w-3 h-3`} strokeWidth={2} />
                </div>
                <div
                    className={`flex items-center justify-end gap-2 ${statusColor}`}
                >
                    <p>
                        UPLINK_STATUS:{" "}
                        <span>{data.isOnline ? "ACTIVE" : "SEVERED"}</span>
                    </p>
                    <Activity
                        className={`w-3 h-3 ${
                            !isOffline ? "animate-pulse" : "opacity-20"
                        }`}
                        strokeWidth={1.5}
                    />
                </div>
                <div className="flex justify-end items-center gap-2">
                    <span className={statusColor}>POWER:</span>
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
    const statusColor = getStatusColor(isOffline, THEME.primary);

    return (
        <div
            className={`fixed bottom-6 right-6 flex items-end gap-4 z-50 pointer-events-none text-[10px] tracking-[0.2em] ${THEME.muted}`}
        >
            <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                    <span>SIGNAL_STRENGTH</span>
                    {isOffline ? (
                        <WifiOff className="w-3 h-3 text-red-500" />
                    ) : (
                        <Wifi className={`w-3 h-3 ${THEME.primary}`} />
                    )}
                </div>
                <div className="flex items-center justify-end gap-2">
                    <span>LATENCY:</span>
                    <span className={statusColor}>
                        {ping && ping !== "ERR" ? `${ping}MS` : "DISCONNECTED"}
                    </span>
                </div>
            </div>
            <div
                className={`w-10 h-10 border ${
                    isOffline ? "border-red-500/50" : THEME.borderStrong
                } flex items-center justify-center relative`}
            >
                {!isOffline && (
                    <div
                        className={`w-[1px] h-6 ${THEME.bg} animate-[bounce_2s_infinite]`}
                        style={{ boxShadow: `0 0 8px ${THEME.hex}` }}
                    />
                )}
                {isOffline && (
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
                )}
            </div>
        </div>
    );
}

export default function MemoryPressureGraph({
    data,
}: {
    data: { value: number }[];
}) {
    const latestValue = data[data.length - 1]?.value || 0;
    // Memory Graph 雖然係 Local 數據，但 Offline 時我哋可以將佢變灰，代表系統進入 Standby
    const themeColor =
        latestValue > 80 ? "#ef4444" : latestValue > 45 ? "#f59e0b" : THEME.hex;

    return (
        <div className={`w-full h-24 bg-transparent p-2`}>
            <div className="flex justify-between items-center mb-1">
                <span
                    className={`text-[9px] font-bold ${THEME.muted} uppercase tracking-widest`}
                >
                    Memory Pressure
                </span>
                <span
                    className="text-[10px] font-mono"
                    style={{ color: themeColor }}
                >
                    {latestValue}%
                </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient
                            id="colorMem"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor={themeColor}
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="95%"
                                stopColor={themeColor}
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        vertical={false}
                        stroke="#ffffff"
                        opacity={0.05}
                    />
                    <XAxis hide />
                    <YAxis domain={[0, 100]} hide />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={themeColor}
                        strokeWidth={1.5}
                        fill="url(#colorMem)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
