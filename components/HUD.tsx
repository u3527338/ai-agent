"use client";

import { motion } from "framer-motion";
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

export function SideTelemetry() {
    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 space-y-2 z-50 md:block border-l border-cyan-500/20 pl-2">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ width: [10, 50, 20], opacity: [0.2, 0.5, 0.2] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1,
                    }}
                    className="h-[4px] bg-cyan-500"
                />
            ))}
        </div>
    );
}

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
