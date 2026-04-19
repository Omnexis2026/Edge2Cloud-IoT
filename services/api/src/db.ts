import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type StoredMqttMessage = {
  id: number;
  topic: string;
  payload: string;
  receivedAt: string;
};

export function openTelemetryDb(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS mqtt_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      payload TEXT NOT NULL,
      received_at TEXT NOT NULL
    );
  `);
  return db;
}

export function insertTelemetry(
  db: Database.Database,
  row: { topic: string; payload: string; receivedAt: string },
): void {
  const maxRows = Number(process.env.MQTT_DB_MAX_ROWS ?? 50_000);
  const cap = Number.isFinite(maxRows) && maxRows > 0 ? Math.trunc(maxRows) : 50_000;

  db.prepare(
    "INSERT INTO mqtt_messages (topic, payload, received_at) VALUES (?, ?, ?)",
  ).run(row.topic, row.payload, row.receivedAt);

  const count = (db.prepare("SELECT COUNT(*) AS c FROM mqtt_messages").get() as { c: number }).c;
  if (count > cap) {
    const excess = count - cap;
    db.prepare(
      `DELETE FROM mqtt_messages WHERE id IN (
        SELECT id FROM mqtt_messages ORDER BY id ASC LIMIT ?
      )`,
    ).run(excess);
  }
}

export function countTelemetry(db: Database.Database): number {
  return (db.prepare("SELECT COUNT(*) AS c FROM mqtt_messages").get() as { c: number }).c;
}

export function recentTelemetry(db: Database.Database, limit: number): StoredMqttMessage[] {
  const rows = db
    .prepare(
      `SELECT id, topic, payload, received_at AS receivedAt
       FROM mqtt_messages ORDER BY id DESC LIMIT ?`,
    )
    .all(limit) as StoredMqttMessage[];
  return rows.reverse();
}
