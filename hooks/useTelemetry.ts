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
        error: boolean;
        isOnline: boolean;
    }>({
        temp: null,
        loc: null,
        ping: null,
        city: null,
        battery: null,
        isCharging: null,
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

        const getPosition = (): Promise<GeolocationPosition> =>
            new Promise((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                })
            );

        try {
            let lat,
                lon,
                cityName = "UNKNOWN";

            try {
                const pos = await getPosition();
                lat = pos.coords.latitude;
                lon = pos.coords.longitude;

                const geoRes = await axios.get(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
                );
                const addr = geoRes.data.address;
                cityName =
                    addr.commercial ||
                    addr.suburb ||
                    addr.region ||
                    addr.town ||
                    addr.city ||
                    "HK";
            } catch (geoError) {
                const fallback = await axios.get("https://ipapi.co/json/");
                lat = fallback.data.latitude;
                lon = fallback.data.longitude;
                cityName = fallback.data.city;
            }

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
            .then(() => {
                setSysData((prev) => ({
                    ...prev,
                    ping: (Date.now() - start).toString(),
                    isOnline: true,
                }));
            })
            .catch(() => {
                setSysData((prev) => ({
                    ...prev,
                    ping: "ERR",
                    isOnline: false,
                }));
            });
    }, []);

    const monitorPower = useCallback(() => {
        if (typeof navigator !== "undefined" && "getBattery" in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                const update = () => {
                    setSysData((prev) => ({
                        ...prev,
                        battery: Math.round(battery.level * 100).toString(),
                        isCharging: battery.charging,
                    }));
                };
                update();
                battery.addEventListener("levelchange", update);
                battery.addEventListener("chargingchange", update);
            });
        }
    }, []);

    useEffect(() => {
        fetchSpecs();
        monitorPower();

        measurePing();
        const pingInterval = setInterval(measurePing, 5000);

        const handleOnline = () =>
            setSysData((p) => ({ ...p, isOnline: true }));
        const handleOffline = () =>
            setSysData((p) => ({ ...p, isOnline: false }));

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            clearInterval(pingInterval);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [fetchSpecs, monitorPower, measurePing]);

    return { sysData };
}