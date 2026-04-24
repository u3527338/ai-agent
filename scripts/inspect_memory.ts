// scripts/inspect_memory.ts
import { ChromaClient } from "chromadb";

async function inspect() {
    const client = new ChromaClient();
    const collection = await client.getCollection({
        name: "lumos_memory"
    });

    const data = await collection.get();
    
    console.log("=== 🛡️ LUMOS NEURAL ARCHIVE ===");
    if (data.documents.length === 0) {
        console.log("Empty. No memories recorded yet.");
    } else {
        data.documents.forEach((doc, i) => {
            console.log(`\n[Memory Block ${i + 1}]`);
            console.log(doc);
            console.log(`Metadata: ${JSON.stringify(data.metadatas[i])}`);
            console.log("----------------------------");
        });
    }
}

inspect();