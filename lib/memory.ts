import { ChromaClient, EmbeddingFunction } from "chromadb";

class OllamaEmbedder implements EmbeddingFunction {
    async generate(texts: string[]): Promise<number[][]> {
        try {
            const responses = await Promise.all(
                texts.map(async (text) => {
                    const res = await fetch(
                        "http://localhost:11434/api/embeddings",
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
            return [];
        }
    }
}

const client = new ChromaClient();
const embedder = new OllamaEmbedder();
const COLLECTION_NAME = "lumos_memory";

export async function storeMemory(text: string, metadata: any = {}) {
    try {
        const collection = await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embedder,
        });

        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toLocaleTimeString("zh-HK", { hour12: false });
        const stampedText = `[Date: ${dateStr} Time: ${timeStr}] ${text}`;

        await collection.add({
            ids: [
                `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            ],
            documents: [stampedText],
            metadatas: [
                {
                    ...metadata,
                    timestamp: Date.now(),
                    date: dateStr,
                },
            ],
        });
    } catch (error) {
        console.error(error);
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
            nResults: 5,
        });

        return results.documents[0].join("\n");
    } catch {
        return "";
    }
}

export async function getAllMemories() {
    try {
        const collection = await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embedder,
        });
        return await collection.get();
    } catch {
        return null;
    }
}
