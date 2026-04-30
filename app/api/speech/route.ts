import { NextResponse } from "next/server";

// 儲存所有連接中的客戶端
let subscribers: ((data: string) => void)[] = [];

/**
 * 1. POST: 接收從 Python 傳來的語音文字
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text)
            return NextResponse.json({ error: "No text" }, { status: 400 });

        console.log("🎤 Python POST 成功:", text);
        subscribers.forEach((send) => send(text));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

/**
 * 2. GET: 改進後的 SSE 長連接
 */
export async function GET() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // 發送初次握手數據，確保連線建立成功
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ init: true })}\n\n`)
            );

            const send = (text: string) => {
                try {
                    const message = `data: ${JSON.stringify({ text })}\n\n`;
                    controller.enqueue(encoder.encode(message));
                } catch (e) {
                    console.error("❌ 推送數據失敗:", e);
                }
            };

            subscribers.push(send);

            // 每 15 秒發送一個心跳 (Keep-alive)，防止瀏覽器自動斷線
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": heartbeat\n\n"));
                } catch (e) {}
            }, 15000);

            // 這裡很重要：當連線中斷時清理
            // 但在 Next.js Serverless 環境下，取消機制較複雜
        },
        cancel() {
            // 清理行為 (視開發環境而定)
            subscribers = [];
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
