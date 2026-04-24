import { ChromaClient } from "chromadb";

/**
 * LUMOS Neural Pruning Script
 * Purpose: Remove noise, short fragments, and duplicate memories.
 */
async function prune() {
    const client = new ChromaClient({
        path: "http://localhost:8000"
    });

    try {
        const collection = await client.getCollection({
            name: "lumos_memory"
        });

        const data = await collection.get();
        const idsToDelete: string[] = [];

        console.log("🛠️ Starting Neural Pruning...");

        if (!data.documents || data.documents.length === 0) {
            console.log("✨ System is optimal. No memories detected.");
            return;
        }

        data.documents.forEach((doc: string | null, i: number) => {
            const id = data.ids[i];
            
            // ⚛️ Type Guard: Handle nulls and ensure string type
            if (!doc) {
                idsToDelete.push(id);
                return;
            }

            // 1. Noise Filter: Remove fragments shorter than 10 characters
            // (e.g., "ok", "hello", "test")
            if (doc.length < 10) {
                console.log(`[Pruned] Noise: "${doc}"`);
                idsToDelete.push(id);
                return;
            }

            // 2. Redundancy Filter: Remove duplicates
            const isDuplicate = data.documents.indexOf(doc) !== i;
            if (isDuplicate) {
                console.log(`[Pruned] Duplicate: "${doc.substring(0, 30)}..."`);
                idsToDelete.push(id);
            }
        });

        // ⚛️ Execution: Bulk delete to save resources
        if (idsToDelete.length > 0) {
            await collection.delete({ ids: idsToDelete });
            console.log(`\n✅ Pruning complete. ${idsToDelete.length} entries purged.`);
        } else {
            console.log("\n✨ System integrity verified. No pruning required.");
        }

    } catch (error) {
        console.error("❌ Pruning operation failed. Is ChromaDB running?");
        console.error(error);
    }
}

prune();