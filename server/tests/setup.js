import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({
  path: fileURLToPath(
    new URL("../.env.test", import.meta.url)
  ),
  override: true,
  quiet: true
});

if (process.env.DB_NAME !== "campus_lost_found_test") {
  throw new Error(
    "测试必须连接 campus_lost_found_test，已停止执行"
  );
}

const schema = await fs.readFile(
  new URL("../database/schema.sql", import.meta.url),
  "utf8"
);

const testSchema = schema
  .replace(/^CREATE DATABASE[\s\S]*?;\s*/i, "")
  .replace(/^USE\s+[^;]+;\s*/i, "");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

try {
  await connection.query(testSchema);
} finally {
  await connection.end();
}
