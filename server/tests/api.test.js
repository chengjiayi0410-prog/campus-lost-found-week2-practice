import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { pool } from "../src/config/db.js";
import { uploadDirectory } from "../src/config/uploads.js";
import { closeTestDatabase, resetTestDatabase } from "./helpers/database.js";

const app = createApp();
const testPassword = "TestPass123!";
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

async function register(username, nickname = username) {
  return request(app).post("/api/auth/register").send({
    username,
    password: testPassword,
    nickname
  });
}

async function createUser(username, role = "user") {
  const registration = await register(username);
  expect(registration.status).toBe(201);

  if (role === "admin") {
    await pool.execute("UPDATE users SET role = 'admin' WHERE username = ?", [
      username
    ]);
  }

  const login = await request(app).post("/api/auth/login").send({
    username,
    password: testPassword
  });

  expect(login.status).toBe(200);

  return {
    user: login.body.user,
    token: login.body.token
  };
}

async function createPost(token, overrides = {}) {
  return request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      type: "found",
      category: "electronics",
      title: "白色蓝牙耳机",
      description: "白色充电盒，已交给图书馆服务台。",
      location: "图书馆三楼",
      ...overrides
    });
}

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

describe("authentication API", () => {
  it("registers, logs in, and returns the current user", async () => {
    const registration = await register("student1", "测试同学");

    expect(registration.status).toBe(201);
    expect(registration.body.user).toMatchObject({
      username: "student1",
      nickname: "测试同学",
      role: "user"
    });
    expect(registration.body.user).not.toHaveProperty("password_hash");

    const login = await request(app).post("/api/auth/login").send({
      username: "student1",
      password: testPassword
    });

    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe("student1");
  });

  it("rejects duplicate usernames and invalid registration data", async () => {
    await expect(register("student1")).resolves.toMatchObject({
      status: 201
    });

    const duplicate = await register("student1");
    expect(duplicate.status).toBe(409);

    const invalid = await register("x");
    expect(invalid.status).toBe(400);
  });

  it("rejects an incorrect password and missing token", async () => {
    await register("student1");

    const login = await request(app).post("/api/auth/login").send({
      username: "student1",
      password: "WrongPassword123!"
    });

    expect(login.status).toBe(401);

    const me = await request(app).get("/api/auth/me");
    expect(me.status).toBe(401);
  });
});

describe("posts API", () => {
  it("creates, filters, paginates, and reads posts", async () => {
    const owner = await createUser("owner1");
    const first = await createPost(owner.token);

    expect(first.status).toBe(201);

    await createPost(owner.token, {
      type: "lost",
      category: "book",
      title: "高等数学教材",
      description: "绿色封面，书内写有姓名。",
      location: "西区自习室"
    });

    const all = await request(app).get("/api/posts").query({ pageSize: 1 });

    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(1);
    expect(all.body.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
      total: 2,
      totalPages: 2
    });

    const filtered = await request(app).get("/api/posts").query({
      type: "found",
      category: "electronics",
      keyword: "耳机"
    });

    expect(filtered.status).toBe(200);
    expect(filtered.body.pagination.total).toBe(1);
    expect(filtered.body.data[0].title).toBe("白色蓝牙耳机");

    const detail = await request(app).get(`/api/posts/${first.body.data.id}`);

    expect(detail.status).toBe(200);
    expect(detail.body.data.author.username).toBe("owner1");
    expect(detail.body.data.category.slug).toBe("electronics");

    await request(app).get("/api/posts/999999").expect(404);
  });

  it("prevents another user from editing or deleting a post", async () => {
    const owner = await createUser("owner1");
    const other = await createUser("student2");
    const created = await createPost(owner.token);
    const postId = created.body.data.id;

    const forbiddenUpdate = await request(app)
      .put(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({
        type: "found",
        category: "key",
        title: "试图修改",
        description: "没有权限的修改请求",
        location: "未知"
      });

    expect(forbiddenUpdate.status).toBe(403);

    const forbiddenDelete = await request(app)
      .delete(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${other.token}`);

    expect(forbiddenDelete.status).toBe(403);
  });

  it("allows the owner to update and an admin to soft delete", async () => {
    const owner = await createUser("owner1");
    const admin = await createUser("admin1", "admin");
    const created = await createPost(owner.token);
    const postId = created.body.data.id;

    const updated = await request(app)
      .put(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        type: "found",
        category: "key",
        title: "捡到钥匙",
        description: "蓝色小熊钥匙扣，已交给门卫。",
        location: "体育馆门卫处"
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("捡到钥匙");

    const deleted = await request(app)
      .delete(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(deleted.status).toBe(200);

    const [rows] = await pool.execute("SELECT status FROM posts WHERE id = ?", [
      postId
    ]);

    expect(rows[0].status).toBe("removed");
    await request(app).get(`/api/posts/${postId}`).expect(404);
  });

  it("uploads one image and enforces type and count limits", async () => {
    const owner = await createUser("owner1");
    const created = await createPost(owner.token);
    const postId = created.body.data.id;

    const upload = await request(app)
      .post(`/api/posts/${postId}/images`)
      .set("Authorization", `Bearer ${owner.token}`)
      .attach("image", onePixelPng, {
        filename: "test.png",
        contentType: "image/png"
      });

    expect(upload.status).toBe(201);
    expect(upload.body.data.url).toMatch(/^\/uploads\/.+\.png$/);

    const uploadedPath = path.join(
      uploadDirectory,
      path.basename(upload.body.data.url)
    );

    try {
      await request(app)
        .post(`/api/posts/${postId}/images`)
        .set("Authorization", `Bearer ${owner.token}`)
        .attach("image", onePixelPng, {
          filename: "second.png",
          contentType: "image/png"
        })
        .expect(409);

      const secondPost = await createPost(owner.token, {
        category: "card",
        title: "第二张图片测试"
      });

      await request(app)
        .post(`/api/posts/${secondPost.body.data.id}/images`)
        .set("Authorization", `Bearer ${owner.token}`)
        .attach("image", Buffer.from("<svg></svg>"), {
          filename: "invalid.svg",
          contentType: "image/svg+xml"
        })
        .expect(400);
    } finally {
      await fs.rm(uploadedPath, { force: true });
    }
  });
});
