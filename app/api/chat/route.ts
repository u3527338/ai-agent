import { getEnrichedPrompt } from "@/helpers/function";
import { commitToBrain, getMemory } from "@/lib/memory";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let messages =
            body.messages ||
            (body.message ? [{ role: "user", content: body.message }] : []);
        const lastUserMessage = messages[messages.length - 1]?.content || "";

        // 1. 🔍 高速檢索：將 nResults 降至 5，減少 LLM 讀取 Context 的負擔
        const longTermContext = (await Promise.race([
            getMemory(lastUserMessage, 5),
            new Promise((resolve) => setTimeout(() => resolve(""), 2000)), // 2秒攞唔到就放棄
        ])) as string;

        const shortTermContext = messages
            .slice(-5, -1)
            .map(
                (m: any) =>
                    `${m.role === "user" ? "Sir" : "LUMOS"}: ${m.content}`
            )
            .join("\n");

        const enrichedPrompt = getEnrichedPrompt({
            longTermContext,
            shortTermContext,
        });

        // 2. 🚀 發起對話請求
        const ollamaRes = await fetch(`${process.env.OLLAMA_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3.2:3b",
                messages: [
                    { role: "system", content: enrichedPrompt },
                    ...messages.slice(-3),
                ],
                stream: true,
                options: { temperature: 0.6 },
            }),
        });

        const stream = new ReadableStream({
            async start(controller) {
                const reader = ollamaRes.body?.getReader();
                let fullReply = "";
                const decoder = new TextDecoder();
                if (!reader) return;

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        // ⚛️ 優化解析：Ollama 的 Stream 每行都是一個完整的 JSON
                        const lines = chunk.split("\n");

                        for (const line of lines) {
                            if (!line.trim()) continue;
                            try {
                                const json = JSON.parse(line);
                                if (json.message?.content) {
                                    const content = json.message.content;
                                    fullReply += content;
                                    // ⚡ 立即推送給前端，不要有任何延遲
                                    controller.enqueue(
                                        new TextEncoder().encode(content)
                                    );
                                }
                            } catch (e) {
                                // 忽略殘缺的 JSON 塊
                            }
                        }
                    }
                } finally {
                    controller.close();

                    // 🧠 【核心優化】異步儲存：唔好等儲存完先 Response
                    // 使用立即執行函數 (IIFE) 喺 Background 處理
                    setImmediate(async () => {
                        try {
                            await commitToBrain(`User: ${lastUserMessage}`);
                            if (fullReply)
                                await commitToBrain(`LUMOS: ${fullReply}`);
                        } catch (e) {
                            console.error("Brain Storage Error:", e);
                        }
                    });
                }
            },
        });

        return new Response(stream);
    } catch (error) {
        console.error("Neural Error:", error);
        return new Response("Neural links offline, Sir.", { status: 500 });
    }
}
