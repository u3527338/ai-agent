import { ChromaClient, EmbeddingFunction } from "chromadb";

// 1. 你的自定義 Ollama 嵌入類
class OllamaEmbedder implements EmbeddingFunction {
    async generate(texts: string[]): Promise<number[][]> {
        try {
            const responses = await Promise.all(
                texts.map(async (text) => {
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
                    if (!res.ok) throw new Error();
                    return res.json();
                })
            );
            return responses.map((r) => r.embedding);
        } catch (error) {
            console.error("❌ Embedding Error:", error);
            return [];
        }
    }
}

const client = new ChromaClient();
const embedder = new OllamaEmbedder();
const COLLECTION_NAME = "lumos_knowledge_base";

/**
 * ⚛️ 核心進化：提取事實再儲存
 */
export async function commitToBrain(rawMessage: string) {
    // A. 先叫細模型提煉事實
    const facts = await extractAtomicFacts(rawMessage);
    if (facts.length === 0) return;

    // B. 逐條事實儲存，帶上時間標籤
    for (const fact of facts) {
        await storeMemory(fact, { source: "extracted_fact" });
    }
}

/**
 * ⚛️ 根據你的架構優化後的 storeMemory
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

        // 加上 Time Stamp 等 Lumos 知呢件係咪「陳年舊事」
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
        console.error("❌ Brain Store Error:", error);
    }
}

/**
 * ⚛️ 提煉事實的 Prompt 邏輯
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
                format: "json",
                prompt: `
                    [SYSTEM]
                    You are a professional Intelligence Officer (LUMOS). Extract "Valuable Atomic Facts" from this bilingual conversation.

                    [FACT PHILOSOPHY]
                    1. PERSISTENCE: Focus on long-term identity, technical stacks, and preferences.
                    2. CONCRETE ENTITIES: Always map User to "Sir" and AI to "LUMOS".
                    3. BILINGUAL ALIGNMENT: Convert Cantonese intent to clear English declarative facts.
                    
                    [CORE DIRECTIVE: THE CORRECTION RULE]
                    - If Sir corrects a previous statement (e.g., "Actually I am 28", "I changed my mind"), you MUST extract this as a definitive update.
                    - Use explicit language for updates: "Sir updated his [attribute] to [value]" or "Sir is now [value], replacing previous information."
                    - This helps the system resolve conflicts later.

                    [STRICT FILTERING]
                    - DISCARD: Questions, uncertainty ("maybe", "not sure"), and standard greetings.
                    - DISCARD: Meta-talk about AI limits or internal processing.
                    - Format: Return ONLY JSON {"facts": ["Fact 1", "Fact 2"]}.

                    [REFERENCE EXAMPLES]
                    Input: "User: Actually I am 28, not 29."
                    Output: {"facts": ["Sir updated his age to 28 years old", "Sir is 28 years old (corrected from 29)"]}

                    Input: "User: 我決定唔用 Tailwind 喇，改用 UnoCSS。"
                    Output: {"facts": ["Sir changed his CSS framework preference to UnoCSS", "Sir no longer uses Tailwind CSS"]}

                    [CURRENT TASK]
                    Input: "${userMessage}"
                    Output:
                `,
                stream: false,
                options: {
                    temperature: 0,
                    seed: 42,
                    num_predict: 250,
                    stop: ["\n", "Input:"],
                },
            }),
        });

        const data = await response.json();
        const parsed = JSON.parse(data.response);
        const rawFacts: string[] = parsed.facts || [];

        // 🚀 智慧品質門檻：不依賴 Hardcode 關鍵字，只做結構性檢查
        return rawFacts.filter((fact) => {
            const f = fact.toLowerCase();
            return (
                f.length > 8 && // 確保有足夠資訊量
                (f.includes("sir") || f.includes("lumos")) && // 必須有明確主語
                !/[?？]/.test(f) && // 絕不儲存問句
                !/\b(unknown|not\s+stated|don't\s+know)\b/.test(f) // 排除明確的「唔知」
            );
        });
    } catch (e) {
        console.error("🧠 [BRAIN] Extraction Failed:", e);
        return [];
    }
}

export async function getMemory(query: string) {
    try {
        const collection = await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embedder,
        });

        const results = await collection.query({
            queryTexts: [query],
            nResults: 20,
        });

        // 🚀 核心修改：將 Documents 同 Metadatas 結合並排序
        if (!results.documents[0].length) return "";

        const memoriesWithTime = results.documents[0].map((doc, i) => ({
            text: doc,
            // 攞返儲存時入去嘅 timestamp，如果冇就當 0
            timestamp: (results.metadatas[0][i] as any)?.timestamp || 0,
        }));

        // 按時間倒序排列 (最新嘅 Fact 排最前)
        const sortedMemories = memoriesWithTime
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((m) => m.text)
            .join("\n");

        return sortedMemories;
    } catch (e) {
        console.error("🧠 [BRAIN] Retrieval failed:", e);
        return "";
    }
}

/**
 * ⚛️ 記憶清洗協議：徹底刪除當前 Collection 並重建
 */
export async function resetBrain() {
    try {
        // 1. 搵返個 Collection
        const collection = await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embedder,
        });

        // 2. 執行刪除 (傳入一個 empty condition 或者直接 delete collection)
        // ChromaDB 建議直接 delete collection 再 getOrCreate 一次最乾淨
        await client.deleteCollection({ name: COLLECTION_NAME });

        console.log(
            "🧹 [BRAIN] Memory DB has been purged, Sir. Ready for a clean start."
        );

        // 3. 重新建立一個空白嘅
        await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embedder,
        });
    } catch (error) {
        console.error("❌ [BRAIN] Purge failed:", error);
    }
}
