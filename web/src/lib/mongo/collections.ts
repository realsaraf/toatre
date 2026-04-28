import { Db } from "mongodb";
import { getMongoClient } from "./client";

const DB_NAME =
  process.env.MONGODB_DB_NAME ??
  process.env.MONGODB_DB ??
  "toatre_prod";

async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}

export async function getCollections() {
  const db = await getDb();
  return {
    users: db.collection("users"),
    toats: db.collection("toats"),
    captures: db.collection("captures"),
    people: db.collection("people"),
    acl: db.collection("acl"),
    settings: db.collection("settings"),
    reminders: db.collection("reminders"),
    calendarSyncTokens: db.collection("calendar_sync_tokens"),
    calendarSyncStates: db.collection("calendar_sync_states"),
    reminder_policies: db.collection("reminder_policies"),
    audit: db.collection("audit"),
  };
}
