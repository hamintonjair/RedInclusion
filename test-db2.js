import { MongoClient, ObjectId } from 'mongodb';

async function test() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.log('No uri'); return; }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const act = await db.collection('actividades').findOne({ "asistentes.0": { $exists: true } });
  if (act) {
    console.log("Actividad id:", act._id, "Asistentes:", act.asistentes.slice(0, 3));
  } else {
    console.log("No actividad with asistentes found.");
  }
  
  const bSample = await db.collection('beneficiarios').findOne({});
  if (bSample) {
    console.log("Sample Beneficiario ID:", String(bSample._id), "type:", typeof bSample._id, bSample._id.constructor.name);
  }
  
  await client.close();
}
test().catch(console.error);
