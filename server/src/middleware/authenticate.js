import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.js";
import { pool } from "../config/db.js";

export async function authenticate(request, response, next) {
  const authorization = request.get("authorization");

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return response.status(401).json({
      message: "请先登录"
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return response.status(401).json({
      message: "请先登录"
    });
  }

  let payload;

  try {
    payload = jwt.verify(token, authConfig.secret, {
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      algorithms: [authConfig.algorithm]
    });
  } catch {
    return response.status(401).json({
      message: "登录已失效，请重新登录"
    });
  }

  if (typeof payload !== "object" || typeof payload.sub !== "string") {
    return response.status(401).json({
      message: "无效的登录凭证"
    });
  }

  try {
    const [rows] = await pool.execute(
      `
        SELECT
          id,
          username,
          nickname,
          role,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [payload.sub]
    );

    if (rows.length === 0) {
      return response.status(401).json({
        message: "用户不存在或已停用"
      });
    }

    request.user = rows[0];
    return next();
  } catch (error) {
    return next(error);
  }
}
