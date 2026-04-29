"use client";

import { THEME } from "@/helpers/constant";
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
            className={`inline-block h-2 ${width} bg-cyan-900/30 animate-pulse rounded-sm relative overflow-hidden`}
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
        <div className="absolute bottom-10 left-10 z-50 w-64">
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
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={100}
                >
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
        </div>
    );
}
