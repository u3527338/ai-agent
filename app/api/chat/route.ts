import { tacticalPrompt } from "@/helpers/constant";
import { commitToBrain, getMemory } from "@/lib/memory"; // 確保 export 了 commitToBrain

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let messages =
            body.messages ||
            (body.message ? [{ role: "user", content: body.message }] : []);
        const lastUserMessage = messages[messages.length - 1]?.content || "";

        // 1. 🔍 檢索：喺腦入面搵返相關嘅事實
        const longTermContext = await getMemory(lastUserMessage);

        // 短期記憶：維持對話連貫性
        const shortTermContext = messages
            .slice(-5, -1)
            .map(
                (m: any) =>
                    `${m.role === "user" ? "Sir" : "LUMOS"}: ${m.content}`
            )
            .join("\n");

        // 2. 🧠 指令注入：三文治式 Prompt，確保廣東話同人格優先
        const enrichedPrompt = `
            [SYSTEM_PROTOCOL]
            ${tacticalPrompt}
            - You are bilingual. Sir may ask in Cantonese, but your facts are stored in English.
            - ALWAYS cross-reference the [ARCHIVE_CONTEXT] regardless of the language used in the query.

            [ARCHIVE_CONTEXT] (Your source of truth)
            ${longTermContext || "No specific long-term records."}

            [RECENT_HISTORY]
            ${shortTermContext || "Initial contact."}
            
            [TASK]
            Answer Sir's latest message. If the answer is in ARCHIVE_CONTEXT, you MUST use it, even if the language of the query is different.
        `;

        const ollamaRes = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3.2:3b",
                messages: [
                    { role: "system", content: enrichedPrompt },
                    ...messages.slice(-3), // 俾埋最近 3 句 raw message 增加流暢度
                ],
                stream: true,
                options: { temperature: 0.6 }, // 稍微降低隨機性
            }),
        });

        const stream = new ReadableStream({
            async start(controller) {
                const reader = ollamaRes.body?.getReader();
                let fullReply = "";
                if (!reader) return;

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = new TextDecoder().decode(value);
                        const lines = chunk.split("\n");

                        for (const line of lines) {
                            if (!line.trim()) continue;
                            const json = JSON.parse(line);
                            if (json.message?.content) {
                                const content = json.message.content;
                                fullReply += content;
                                controller.enqueue(
                                    new TextEncoder().encode(content)
                                );
                            }
                        }
                    }

                    // 🚀 核心進化：唔好就咁儲 RAW，係要儲提煉後嘅事實
                    // 唔好 await，覆完 Sir 先喺 background 慢慢諗
                    commitToBrain(`User: ${lastUserMessage}`).catch(() => {});

                    if (fullReply) {
                        // 可選：如果你想連 AI 講過嘅事實都記埋
                        commitToBrain(`LUMOS told Sir: ${fullReply}`).catch(
                            () => {}
                        );
                    }
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream);
    } catch (error) {
        console.error("Neural Error:", error);
        return new Response(
            "Neural links offline, Sir. System reboot required.",
            { status: 500 }
        );
    }
}
