import { MongoClient } from 'mongodb';

async function test() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.log('No uri'); return; }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const act = await db.collection('actividades').findOne({ "asistentes.0": { $exists: true } });
  console.log("Actividad asistentes:", act.asistentes);
  
  const b = await db.collection('beneficiarios').findOne();
  console.log("Beneficiario sample:", b);
  await client.close();
}
test().catch(console.error);
