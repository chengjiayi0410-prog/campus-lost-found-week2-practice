import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.js";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

function validateRegisterInput({ username, password, nickname }) {
  if (typeof username !== "string") {
    return "用户名不能为空";
  }

  const normalizedUsername = normalizeUsername(username);

  if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
    return "用户名只能包含字母、数字和下划线，长度为 3 至 30 位";
  }

  if (typeof password !== "string" || password.length < 8) {
    return "密码至少需要 8 个字符";
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    return "密码过长，请控制在 72 字节以内";
  }

  if (nickname !== undefined && typeof nickname !== "string") {
    return "昵称格式不正确";
  }

  if ((nickname || "").trim().length > 50) {
    return "昵称不能超过 50 个字符";
  }

  return "";
}

router.post("/register", async (request, response, next) => {
  try {
    const { username, password, nickname } = request.body || {};

    const validationMessage = validateRegisterInput({
      username,
      password,
      nickname
    });

    if (validationMessage) {
      return response.status(400).json({
        message: validationMessage
      });
    }

    const normalizedUsername = normalizeUsername(username);
    const displayName = (nickname || "").trim() || normalizedUsername;

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `
        INSERT INTO users (
          username,
          password_hash,
          nickname,
          role
        )
        VALUES (?, ?, ?, ?)
      `,
      [normalizedUsername, passwordHash, displayName, "user"]
    );

    return response.status(201).json({
      message: "注册成功",
      user: {
        id: result.insertId,
        username: normalizedUsername,
        nickname: displayName,
        role: "user"
      }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({
        message: "该用户名已被注册"
      });
    }

    return next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const { username, password } = request.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return response.status(400).json({
        message: "请输入用户名和密码"
      });
    }

    const normalizedUsername = normalizeUsername(username);

    const [rows] = await pool.execute(
      `
        SELECT
          id,
          username,
          password_hash,
          nickname,
          role,
          created_at
        FROM users
        WHERE username = ?
        LIMIT 1
      `,
      [normalizedUsername]
    );

    const user = rows[0];

    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!user || !passwordMatches) {
      return response.status(401).json({
        message: "用户名或密码错误"
      });
    }

    const token = jwt.sign(
      {
        username: user.username,
        role: user.role
      },
      authConfig.secret,
      {
        subject: String(user.id),
        expiresIn: authConfig.expiresIn,
        issuer: authConfig.issuer,
        audience: authConfig.audience,
        algorithm: authConfig.algorithm
      }
    );

    return response.json({
      message: "登录成功",
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticate, (request, response) => {
  response.json({
    user: request.user
  });
});

export default router;
