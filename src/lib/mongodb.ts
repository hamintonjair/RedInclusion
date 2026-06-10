import { MongoClient, Db } from 'mongodb';

let cachedDb: Db | null = null;
let client: MongoClient | null = null;

export async function connectToDatabase() {
  if (cachedDb) {
    return { db: cachedDb, client: client! };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI no está definido en las variables de entorno');
  }

  client = new MongoClient(uri);
  await client.connect();
  const db = client.db('red_inclusion');
  
  cachedDb = db;
  return { db, client };
}
