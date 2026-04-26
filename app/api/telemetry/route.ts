import { NextResponse } from "next/server";
import si from "systeminformation";

export async function GET() {
    try {
        // 1. 同步獲取記憶體同顯卡數據
        const [mem, graphics] = await Promise.all([si.mem(), si.graphics()]);

        // 2. 計算「負載百分比」
        // 使用 active (真正被進程佔用嘅 RAM) 而唔係 free
        // 喺 MacBook Air，active 增加代表 Ollama 正在加載模型
        const realPressure = mem.total - mem.available;
        const loadPercent = Math.round((realPressure / mem.total) * 100);

        return NextResponse.json({
            memory: {
                used: `${(realPressure / 1024 / 1024 / 1024).toFixed(1)}GB`,
                total: `${(mem.total / 1024 / 1024 / 1024).toFixed(1)}GB`,
                percent: loadPercent, // 這次它只會隨壓力上升
            },
            gpu: {
                model: graphics.controllers[0]?.model || "Apple M-Series",
                load: graphics.controllers[0]?.utilizationGpu || 0,
            },
        });
    } catch (e) {
        console.error("Telemetry API Error:", e);
        return NextResponse.json(
            { error: "Failed to probe hardware" },
            { status: 500 }
        );
    }
}
