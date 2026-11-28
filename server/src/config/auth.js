import "dotenv/config";

const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("JWT_SECRET 未配置或长度少于 32 个字符");
}

export const authConfig = Object.freeze({
  secret,
  issuer: "campus-lost-found-api",
  audience: "campus-lost-found-web",
  expiresIn: "2h",
  algorithm: "HS256"
});
