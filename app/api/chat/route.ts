import { tacticalPrompt } from "@/helpers/constant";
import { getMemory, storeMemory } from "@/lib/memory";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let messages =
            body.messages ||
            (body.message ? [{ role: "user", content: body.message }] : []);
        const lastUserMessage = messages[messages.length - 1]?.content || "";
        const isLocal = process.env.NODE_ENV === "development";

        const longTermContextPromise = getMemory(lastUserMessage);
        const shortTermContext = messages
            .slice(-5, -1)
            .map(
                (m: any) =>
                    `${m.role === "user" ? "Sir" : "LUMOS"}: ${m.content}`
            )
            .join("\n");

        const longTermContext = await longTermContextPromise;

        const enrichedPrompt = `
        ${tacticalPrompt}
        [ARCHIVE]: ${longTermContext || "None"}
        [RECENT]: ${shortTermContext || "None"}
        `;

        if (isLocal) {
            const ollamaRes = await fetch("http://localhost:11434/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama3.2:3b",
                    messages: [
                        { role: "system", content: enrichedPrompt },
                        ...messages.slice(-3),
                    ],
                    stream: true,
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
                        storeMemory(
                            `Sir: ${lastUserMessage}\nLUMOS: ${fullReply}`
                        ).catch(() => {});
                    } finally {
                        controller.close();
                    }
                },
            });

            return new Response(stream);
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(
            `${enrichedPrompt}\nSir: ${lastUserMessage}`
        );
        const aiReply = result.response.text();

        storeMemory(`Sir: ${lastUserMessage}\nLUMOS: ${aiReply}`).catch(
            () => {}
        );
        return new Response(aiReply);
    } catch (error) {
        return new Response("Neural links offline.", { status: 500 });
    }
}
