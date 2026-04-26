import { ChromaClient, EmbeddingFunction } from "chromadb";

// 1. Ollama 嵌入類：負責將文字轉化為向量數據
class OllamaEmbedder implements EmbeddingFunction {
    async generate(texts: string[]): Promise<number[][]> {
        // 如果只有一條 text (Query)，直接行，唔好 parallel
        const embeddings = [];
        for (const text of texts) {
            const res = await fetch(
                `${process.env.OLLAMA_URL}/embeddings`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "nomic-embed-text",
                        prompt: text,
                    }),
                }
            );
            const json = await res.json();
            embeddings.push(json.embedding);
        }
        return embeddings;
    }
}

const client = new ChromaClient();
const embedder = new OllamaEmbedder();
const COLLECTION_NAME = "lumos_knowledge_base";

/**
 * ⚛️ 根據查詢檢索記憶 (RAG)
 * @param limit 限制檢索數量以提速，預設為 8
 */
export async function getMemory(query: string, limit: number = 8) {
    try {
        const collection = await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embedder,
        });

        const results = await collection.query({
            queryTexts: [query],
            nResults: limit,
        });

        if (!results.documents[0].length) return "";

        // 結合 Metadata 的時間戳進行排序，確保最新的資訊在前
        const memoriesWithTime = results.documents[0].map((doc, i) => ({
            text: doc,
            timestamp: (results.metadatas[0][i] as any)?.timestamp || 0,
        }));

        return memoriesWithTime
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((m) => m.text)
            .join("\n");
    } catch (e) {
        console.error("🧠 [BRAIN] Retrieval failed:", e);
        return "";
    }
}

/**
 * ⚛️ 將訊息提煉成原子事實並儲存
 */
export async function commitToBrain(rawMessage: string) {
    try {
        const facts = await extractAtomicFacts(rawMessage);
        if (facts.length === 0) return;

        for (const fact of facts) {
            await storeMemory(fact, { source: "extracted_fact" });
        }
    } catch (e) {
        console.error("🧠 [BRAIN] Commit failed:", e);
    }
}

/**
 * ⚛️ 核心底層儲存邏輯
 */
export async function storeMemory(text: string, metadata: any = {}) {
    try {
        const collection = await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embedder,
        });

        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toLocaleTimeString("zh-HK", { hour12: false });

        // 加上時間標籤方便 LLM 理解時效性
        const stampedText = `[Date: ${dateStr} Time: ${timeStr}] ${text}`;

        await collection.add({
            ids: [
                `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            ],
            documents: [stampedText],
            metadatas: [{ ...metadata, timestamp: Date.now(), date: dateStr }],
        });
        console.log(`🧠 [BRAIN] Fact Stored: ${text}`);
    } catch (error) {
        console.error("❌ [BRAIN] Store Error:", error);
    }
}

/**
 * ⚛️ 使用 Qwen 模型進行事實提煉 (JSON 模式)
 */
export async function extractAtomicFacts(
    userMessage: string
): Promise<string[]> {
    try {
        const response = await fetch(`${process.env.OLLAMA_URL}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "qwen2.5:3b",
                format: "json", // ⚛️ 關鍵：確保輸出為 JSON 格式加速解析
                prompt: `
                    Extract atomic facts from this input as LUMOS (AI assistant) for Sir (User).
                    Focus on identity, preferences, technical stacks, and corrected information.
                    Return ONLY JSON: {"facts": ["Fact 1", "Fact 2"]}

                    Input: "${userMessage}"
                `,
                stream: false, // 提煉不需要 Stream，直接攞 JSON
                options: { temperature: 0, num_predict: 200 },
            }),
        });

        const data = await response.json();
        const parsed = JSON.parse(data.response);
        const rawFacts: string[] = parsed.facts || [];

        return rawFacts.filter(
            (fact) => fact.length > 5 && !/[?？]/.test(fact)
        );
    } catch (e) {
        console.error("🧠 [BRAIN] Extraction Error:", e);
        return [];
    }
}

/**
 * ⚛️ 記憶清洗
 */
export async function resetBrain() {
    try {
        await client.deleteCollection({ name: COLLECTION_NAME });
        await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embedder,
        });
        console.log("🧹 [BRAIN] Memory Purged.");
    } catch (error) {
        console.error("❌ [BRAIN] Purge failed:", error);
    }
}
