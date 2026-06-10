import { MongoClient, ObjectId } from 'mongodb';

async function test() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.log('No uri'); return; }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const bSample = await db.collection('beneficiarios').findOne({});
  console.log("JSON.stringify output:", JSON.stringify(bSample._id));
  
  await client.close();
}
test().catch(console.error);
