import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const frontendUrl = "http://127.0.0.1:5174";
const backendUrl = "http://127.0.0.1:3100";

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopProcess(pid) {
  if (!Number.isInteger(pid) || !isProcessRunning(pid)) {
    return;
  }

  process.kill(pid);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!isProcessRunning(pid)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  process.kill(pid, "SIGKILL");
}

async function waitForUrl(url, timeout = 30_000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // 服务尚未就绪，继续重试
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`等待服务启动超时：${url}`);
}

export default async function globalSetup() {
  const serverDirectory = fileURLToPath(new URL("../../", import.meta.url));
  const repositoryDirectory = fileURLToPath(
    new URL("../../../", import.meta.url)
  );
  const pidFile = `${serverDirectory}.e2e-server-pids.json`;

  dotenv.config({
    path: `${serverDirectory}.env.test`,
    override: true,
    quiet: true
  });

  if (process.env.DB_NAME !== "campus_lost_found_test") {
    throw new Error("E2E 测试必须连接 campus_lost_found_test");
  }

  const schema = await fs.readFile(
    `${serverDirectory}database/schema.sql`,
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

  async function prepareDatabase() {
    await connection.query(testSchema);
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of ["images", "posts", "categories", "users"]) {
      await connection.query(`TRUNCATE TABLE \`${table}\``);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    await connection.query(`
    INSERT INTO categories (slug, name, icon)
    VALUES
      ('card', '证件', '💳'),
      ('electronics', '电子设备', '📱'),
      ('book', '书籍', '📚'),
      ('key', '钥匙', '🔑'),
      ('other', '其他', '🎒')
  `);

    const studentPassword = await bcrypt.hash("TestPass123!", 12);
    const adminPassword = await bcrypt.hash("AdminPass123!", 12);

    await connection.execute(
      `
      INSERT INTO users (
        username,
        password_hash,
        nickname,
        role
      )
      VALUES (?, ?, ?, ?), (?, ?, ?, ?)
    `,
      [
        "student1",
        studentPassword,
        "测试同学",
        "user",
        "admin",
        adminPassword,
        "管理员",
        "admin"
      ]
    );
  }

  try {
    await prepareDatabase();
  } finally {
    await connection.end();
  }

  if (await fs.stat(pidFile).catch(() => null)) {
    const previousPids = JSON.parse(await fs.readFile(pidFile, "utf8"));

    for (const pid of previousPids) {
      await stopProcess(pid);
    }

    await fs.unlink(pidFile).catch(() => {});
  }

  const backend = spawn(process.execPath, ["src/server.js"], {
    cwd: serverDirectory,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: {
      ...process.env,
      PORT: "3100",
      CORS_ORIGIN: frontendUrl
    }
  });

  const frontend = spawn(
    process.execPath,
    [
      `${repositoryDirectory}node_modules/vite/bin/vite.js`,
      "--host",
      "127.0.0.1",
      "--port",
      "5174"
    ],
    {
      cwd: repositoryDirectory,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: {
        ...process.env,
        VITE_API_BASE_URL: `${backendUrl}/api`
      }
    }
  );

  backend.unref();
  frontend.unref();

  const pids = [backend.pid, frontend.pid].filter(Number.isInteger);

  await fs.writeFile(pidFile, JSON.stringify(pids), "utf8");

  try {
    await waitForUrl(`${backendUrl}/api/health/db`);
    await waitForUrl(frontendUrl);
  } catch (error) {
    for (const pid of pids) {
      await stopProcess(pid);
    }

    await fs.unlink(pidFile).catch(() => {});
    throw error;
  }
}
