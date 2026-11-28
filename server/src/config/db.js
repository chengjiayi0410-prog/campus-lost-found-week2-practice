import "dotenv/config";
import mysql from "mysql2/promise";

const requiredVariables = [
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME"
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`缺少数据库环境变量：${variable}`);
  }
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testDatabaseConnection() {
  const [rows] = await pool.query(`
    SELECT
      DATABASE() AS db,
      VERSION() AS version
  `);

  return rows[0];
}