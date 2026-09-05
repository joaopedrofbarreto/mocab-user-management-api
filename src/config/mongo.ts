import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI as string);
let connected = false;

export async function getAuditLogsCollection() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client.db('mocab').collection('audit_logs');
}