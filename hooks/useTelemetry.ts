"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

export function useTelemetry() {
    const [sysData, setSysData] = useState<{
        temp: string | null;
        loc: string | null;
        ping: string | null;
        city: string | null;
        battery: string | null;
        isCharging: boolean | null;
        memory: { used: number; total: number; percent: number } | null;
        error: boolean;
        isOnline: boolean;
    }>({
        temp: null,
        loc: null,
        ping: null,
        city: null,
        battery: null,
        isCharging: null,
        memory: null,
        error: false,
        isOnline: true,
    });

    const fetchSpecs = useCallback(async () => {
        const cachedData = localStorage.getItem("lumos_telemetry_cache");
        const now = Date.now();

        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (now - parsed.timestamp < 600000) {
                setSysData((prev) => ({
                    ...prev,
                    ...parsed.data,
                    error: false,
                }));
                return;
            }
        }

        try {
            const ipRes = await axios.get("https://ipapi.co/json/");
            const {
                latitude: lat,
                longitude: lon,
                city: cityName,
            } = ipRes.data;

            const weatherRes = await axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );

            const freshData = {
                temp: Math.round(
                    weatherRes.data.current_weather.temperature
                ).toString(),
                loc: `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`,
                city: cityName.toUpperCase(),
            };

            setSysData((prev) => ({ ...prev, ...freshData, error: false }));
            localStorage.setItem(
                "lumos_telemetry_cache",
                JSON.stringify({ timestamp: now, data: freshData })
            );
        } catch (e) {
            setSysData((prev) => ({ ...prev, error: true }));
        }
    }, []);

    const measureHardware = useCallback(() => {
        const mem = (performance as any).memory;
        if (mem) {
            const used = Math.round(mem.usedJSHeapSize / 1024 / 1024);
            const total = Math.round(mem.jsHeapSizeLimit / 1024 / 1024);
            setSysData((p) => ({
                ...p,
                memory: {
                    used,
                    total,
                    percent: Math.round((used / total) * 100),
                },
            }));
        }
    }, []);

    const measurePing = useCallback(() => {
        const start = Date.now();
        fetch("/favicon.ico", { mode: "no-cors", cache: "no-store" })
            .then(() =>
                setSysData((p) => ({
                    ...p,
                    ping: (Date.now() - start).toString(),
                    isOnline: true,
                }))
            )
            .catch(() =>
                setSysData((p) => ({ ...p, ping: "ERR", isOnline: false }))
            );
    }, []);

    useEffect(() => {
        fetchSpecs();
        measurePing();
        measureHardware();

        const pingInterval = setInterval(measurePing, 5000);
        const hwInterval = setInterval(measureHardware, 1000); // 1秒一次，對應 Graph 滾動

        if (
            typeof navigator !== "undefined" &&
            "getBattery" in (navigator as any)
        ) {
            (navigator as any).getBattery().then((battery: any) => {
                const up = () =>
                    setSysData((p) => ({
                        ...p,
                        battery: Math.round(battery.level * 100).toString(),
                        isCharging: battery.charging,
                    }));
                up();
                battery.addEventListener("levelchange", up);
                battery.addEventListener("chargingchange", up);
            });
        }

        return () => {
            clearInterval(pingInterval);
            clearInterval(hwInterval);
        };
    }, [fetchSpecs, measurePing, measureHardware]);

    return { sysData };
}
