import hnsw from 'hnswlib-node'
import fs from 'fs'
import path from 'path'
import { Configuration, OpenAIApi } from 'openai'

export async function vectorSearch(indexName: string, documents: string[], query: string, numResults = 5) {
    const index = await getOrCreateIndex(indexName, documents)
    const queryEmbedding = await getEmbedding(query)
    return index.searchKnn(queryEmbedding, numResults).neighbors.map(id => documents[id])
}

async function getEmbedding(document: string) {
    const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))
    const res = await openai.createEmbedding({ input: document, model: 'text-embedding-ada-002' })
    return res.data.data[0].embedding
}

async function createIndex(indexName: string, documents: string[]) {
    const index = new hnsw.HierarchicalNSW('cosine', 1536)
    index.initIndex(1000)

    for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        const embedding = await getEmbedding(doc)
        index.addPoint(embedding, i)
    }

    index.writeIndexSync(__dirname + `/${indexName}.dat`);
    return index
}

async function getOrCreateIndex(indexName: string, documents: string[]) {
    const indexPath = path.join(__dirname, `/${indexName}.dat`)
    if (!fs.existsSync(indexPath)) {
        return createIndex(indexName, documents)
    }
    const index = new hnsw.HierarchicalNSW('cosine', 1536)
    index.readIndexSync(indexPath);
    return index
}