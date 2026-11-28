import crypto from "node:crypto";
import fs from "node:fs";
import multer from "multer";
import { uploadDirectory } from "../config/uploads.js";
import { authenticate } from "../middleware/authenticate.js";
import { Router } from "express";
import { pool } from "../config/db.js";
import { parsePositiveInteger } from "../utils/pagination.js";

const router = Router();

fs.mkdirSync(uploadDirectory, {
  recursive: true
});

const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

const imageStorage = multer.diskStorage({
  destination: uploadDirectory,

  filename(request, file, callback) {
    const extension = allowedImageTypes.get(file.mimetype);
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    callback(null, filename);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1
  },
  fileFilter(request, file, callback) {
    if (!allowedImageTypes.has(file.mimetype)) {
      const error = new Error("仅支持 JPG、PNG 和 WebP 图片");

      error.status = 400;
      return callback(error);
    }

    return callback(null, true);
  }
});

function handleImageUpload(request, response, next) {
  imageUpload.single("image")(request, response, (error) => {
    if (!error) {
      return next();
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return response.status(400).json({
        message: "图片不能超过 2 MB"
      });
    }

    if (error.status === 400 || error.code === "LIMIT_UNEXPECTED_FILE") {
      return response.status(400).json({
        message: error.message || "图片上传参数无效，只允许一个 image 文件"
      });
    }

    return next(error);
  });
}

const postSelect = `
  SELECT
    p.id,
    p.type,
    p.title,
    p.description,
    p.location,
    p.status,
    p.created_at AS createdAt,
    p.updated_at AS updatedAt,
    u.id AS authorId,
    u.username AS authorUsername,
    u.nickname AS authorNickname,
    c.id AS categoryId,
    c.slug AS categorySlug,
    c.name AS categoryName,
    c.icon AS categoryIcon
  FROM posts p
  INNER JOIN users u ON u.id = p.user_id
  INNER JOIN categories c ON c.id = p.category_id
`;

function toPublicPost(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    location: row.location,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.authorId,
      username: row.authorUsername,
      nickname: row.authorNickname
    },
    category: {
      id: row.categoryId,
      slug: row.categorySlug,
      name: row.categoryName,
      icon: row.categoryIcon
    },
    images: []
  };
}

async function attachImages(posts) {
  if (posts.length === 0) {
    return;
  }

  const placeholders = posts.map(() => "?").join(", ");

  const [imageRows] = await pool.query(
    `
      SELECT
        id,
        post_id AS postId,
        url,
        sort_order AS sortOrder
      FROM images
      WHERE post_id IN (${placeholders})
      ORDER BY post_id, sort_order, id
    `,
    posts.map((post) => post.id)
  );

  const postsById = new Map(posts.map((post) => [String(post.id), post]));

  for (const image of imageRows) {
    const post = postsById.get(String(image.postId));

    if (post) {
      post.images.push({
        id: image.id,
        url: image.url,
        sortOrder: image.sortOrder
      });
    }
  }
}

async function findPostForMutation(id) {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        user_id AS userId,
        status
      FROM posts
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

function canManagePost(post, user) {
  return user.role === "admin" || String(post.userId) === String(user.id);
}

async function authorizeImageUpload(request, response, next) {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return response.status(400).json({
        message: "信息 ID 无效"
      });
    }

    const post = await findPostForMutation(id);

    if (!post || post.status === "removed") {
      return response.status(404).json({
        message: "信息不存在"
      });
    }

    if (!canManagePost(post, request.user)) {
      return response.status(403).json({
        message: "无权为这条信息上传图片"
      });
    }

    const [rows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM images
        WHERE post_id = ?
      `,
      [id]
    );

    if (Number(rows[0].total) > 0) {
      return response.status(409).json({
        message: "当前版本每条信息最多上传一张图片"
      });
    }

    request.managedPost = post;
    return next();
  } catch (error) {
    return next(error);
  }
}

router.get("/", async (request, response, next) => {
  try {
    const page = parsePositiveInteger(request.query.page, 1);
    const pageSize = parsePositiveInteger(request.query.pageSize, 10);

    if (!page || !pageSize || pageSize > 50) {
      return response.status(400).json({
        message: "分页参数无效，pageSize 不能超过 50"
      });
    }

    const type =
      typeof request.query.type === "string" ? request.query.type.trim() : "";

    if (type && !["lost", "found"].includes(type)) {
      return response.status(400).json({
        message: "type 只能是 lost 或 found"
      });
    }

    const category =
      typeof request.query.category === "string"
        ? request.query.category.trim()
        : "";

    const keyword =
      typeof request.query.keyword === "string"
        ? request.query.keyword.trim()
        : "";

    if (keyword.length > 100) {
      return response.status(400).json({
        message: "搜索关键词不能超过 100 个字符"
      });
    }

    const conditions = ["p.status = 'active'"];
    const parameters = [];

    if (type) {
      conditions.push("p.type = ?");
      parameters.push(type);
    }

    if (category) {
      conditions.push("c.slug = ?");
      parameters.push(category);
    }

    if (keyword) {
      const pattern = `%${keyword}%`;

      conditions.push(`
        (
          p.title LIKE ?
          OR p.description LIKE ?
          OR p.location LIKE ?
        )
      `);

      parameters.push(pattern, pattern, pattern);
    }

    const whereClause = conditions.join(" AND ");

    const [countRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM posts p
        INNER JOIN categories c ON c.id = p.category_id
        WHERE ${whereClause}
      `,
      parameters
    );

    const total = Number(countRows[0].total);
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.execute(
      `
        ${postSelect}
        WHERE ${whereClause}
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ? OFFSET ?
      `,
      [...parameters, pageSize, offset]
    );

    const posts = rows.map(toPublicPost);
    await attachImages(posts);

    return response.json({
      data: posts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", authenticate, async (request, response, next) => {
  try {
    const type = request.body?.type;
    const category = request.body?.category;
    const title = request.body?.title;
    const description = request.body?.description;
    const location = request.body?.location;

    if (!["lost", "found"].includes(type)) {
      return response.status(400).json({
        message: "type 只能是 lost 或 found"
      });
    }

    if (typeof category !== "string" || !category.trim()) {
      return response.status(400).json({
        message: "请选择物品分类"
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return response.status(400).json({
        message: "标题不能为空且不能超过 100 个字符"
      });
    }

    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.trim().length > 2000
    ) {
      return response.status(400).json({
        message: "描述不能为空且不能超过 2000 个字符"
      });
    }

    if (
      typeof location !== "string" ||
      !location.trim() ||
      location.trim().length > 100
    ) {
      return response.status(400).json({
        message: "地点不能为空且不能超过 100 个字符"
      });
    }

    const categorySlug = category.trim();

    const [categoryRows] = await pool.execute(
      `
        SELECT id
        FROM categories
        WHERE slug = ?
        LIMIT 1
      `,
      [categorySlug]
    );

    if (categoryRows.length === 0) {
      return response.status(400).json({
        message: "分类不存在"
      });
    }

    const [result] = await pool.execute(
      `
        INSERT INTO posts (
          user_id,
          category_id,
          type,
          title,
          description,
          location,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'active')
      `,
      [
        request.user.id,
        categoryRows[0].id,
        type,
        title.trim(),
        description.trim(),
        location.trim()
      ]
    );

    const [rows] = await pool.execute(
      `
        ${postSelect}
        WHERE p.id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    const post = toPublicPost(rows[0]);
    await attachImages([post]);

    return response.status(201).json({
      message: "发布成功",
      data: post
    });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/:id/images",
  authenticate,
  authorizeImageUpload,
  handleImageUpload,
  async (request, response, next) => {
    if (!request.file) {
      return response.status(400).json({
        message: "请选择要上传的图片"
      });
    }

    const imageUrl = `/uploads/${request.file.filename}`;

    try {
      const [result] = await pool.execute(
        `
          INSERT INTO images (
            post_id,
            url,
            sort_order
          )
          VALUES (?, ?, 0)
        `,
        [request.managedPost.id, imageUrl]
      );

      return response.status(201).json({
        message: "图片上传成功",
        data: {
          id: result.insertId,
          url: imageUrl,
          sortOrder: 0
        }
      });
    } catch (error) {
      await fs.promises.unlink(request.file.path).catch(() => {});

      return next(error);
    }
  }
);

router.put("/:id", authenticate, async (request, response, next) => {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return response.status(400).json({
        message: "信息 ID 无效"
      });
    }

    const existingPost = await findPostForMutation(id);

    if (!existingPost || existingPost.status === "removed") {
      return response.status(404).json({
        message: "信息不存在"
      });
    }

    if (!canManagePost(existingPost, request.user)) {
      return response.status(403).json({
        message: "无权修改这条信息"
      });
    }

    const type = request.body?.type;
    const category = request.body?.category;
    const title = request.body?.title;
    const description = request.body?.description;
    const location = request.body?.location;

    if (!["lost", "found"].includes(type)) {
      return response.status(400).json({
        message: "type 只能是 lost 或 found"
      });
    }

    if (typeof category !== "string" || !category.trim()) {
      return response.status(400).json({
        message: "请选择物品分类"
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return response.status(400).json({
        message: "标题不能为空且不能超过 100 个字符"
      });
    }

    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.trim().length > 2000
    ) {
      return response.status(400).json({
        message: "描述不能为空且不能超过 2000 个字符"
      });
    }

    if (
      typeof location !== "string" ||
      !location.trim() ||
      location.trim().length > 100
    ) {
      return response.status(400).json({
        message: "地点不能为空且不能超过 100 个字符"
      });
    }

    const [categoryRows] = await pool.execute(
      `
        SELECT id
        FROM categories
        WHERE slug = ?
        LIMIT 1
      `,
      [category.trim()]
    );

    if (categoryRows.length === 0) {
      return response.status(400).json({
        message: "分类不存在"
      });
    }

    await pool.execute(
      `
        UPDATE posts
        SET
          category_id = ?,
          type = ?,
          title = ?,
          description = ?,
          location = ?
        WHERE id = ?
      `,
      [
        categoryRows[0].id,
        type,
        title.trim(),
        description.trim(),
        location.trim(),
        id
      ]
    );

    const [rows] = await pool.execute(
      `
        ${postSelect}
        WHERE p.id = ?
        LIMIT 1
      `,
      [id]
    );

    const post = toPublicPost(rows[0]);
    await attachImages([post]);

    return response.json({
      message: "修改成功",
      data: post
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authenticate, async (request, response, next) => {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return response.status(400).json({
        message: "信息 ID 无效"
      });
    }

    const existingPost = await findPostForMutation(id);

    if (!existingPost || existingPost.status === "removed") {
      return response.status(404).json({
        message: "信息不存在"
      });
    }

    if (!canManagePost(existingPost, request.user)) {
      return response.status(403).json({
        message: "无权删除这条信息"
      });
    }

    await pool.execute(
      `
        UPDATE posts
        SET status = 'removed'
        WHERE id = ?
      `,
      [id]
    );

    return response.json({
      message: "删除成功"
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return response.status(400).json({
        message: "信息 ID 无效"
      });
    }

    const [rows] = await pool.execute(
      `
        ${postSelect}
        WHERE p.id = ?
          AND p.status <> 'removed'
        LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return response.status(404).json({
        message: "信息不存在"
      });
    }

    const post = toPublicPost(rows[0]);
    await attachImages([post]);

    return response.json({
      data: post
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
