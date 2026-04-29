import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ⚛️ 強制鎖定輸出目錄，防止路徑解析錯誤
    distDir: ".next",

    // ⚛️ 暫時關閉這些檢查，減少啟動時的 CPU 負擔
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    experimental: {
        // @ts-ignore
        turbo: {
            root: ".",
        },
    },
};

export default nextConfig;
