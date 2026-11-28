import { pool } from "../../src/config/db.js";

const tables = [
  "images",
  "posts",
  "categories",
  "users"
];

export async function resetTestDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of tables) {
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
  } finally {
    connection.release();
  }
}

export async function closeTestDatabase() {
  await pool.end();
}
