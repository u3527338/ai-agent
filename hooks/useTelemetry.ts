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
        memory: { used: string; total: string; percent: number } | null;
        gpu: { model: string; load: number } | null;
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
        gpu: null,
        error: false,
        isOnline: true,
    });

    // ⚛️ 新增：獲取硬體監控數據
    const fetchHardware = useCallback(async () => {
        try {
            const res = await fetch("/api/telemetry");
            const data = await res.json();
            if (!data.error) {
                setSysData((prev) => ({
                    ...prev,
                    memory: data.memory,
                    gpu: data.gpu,
                }));
            }
        } catch (e) {
            console.error("Hardware telemetry offline");
        }
    }, []);

    // 🌍 你原本的天氣/定位邏輯
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
            const fallback = await axios.get("https://ipapi.co/json/");
            const {
                latitude: lat,
                longitude: lon,
                city: cityName,
            } = fallback.data;

            const weatherRes = await axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );

            const freshData = {
                temp: Math.round(
                    weatherRes.data.current_weather.temperature
                ).toString(),
                loc: `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`,
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

        // 🔋 電池監控
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

        // ⏱️ 設定輪詢
        // const hwInterval = setInterval(fetchHardware, 3000); // 3秒更新一次硬體
        const pingInterval = setInterval(measurePing, 5000);

        return () => {
            // clearInterval(hwInterval);
            clearInterval(pingInterval);
        };
    }, [fetchSpecs, fetchHardware, measurePing]);

    return { sysData };
}
