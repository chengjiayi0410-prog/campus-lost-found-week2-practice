import express from "express";
import cors from "cors";
import {
  testDatabaseConnection
} from "./config/db.js";
import authRouter from "./routes/auth.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:5173"
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (request, response) => {
    response.json({
      status: "ok",
      service: "campus-lost-found-api",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/health/db", async (request, response) => {
    try {
      const database = await testDatabaseConnection();

      response.json({
        status: "ok",
        database
      });
    } catch (error) {
      console.error(
        "Database health check failed:",
        error.message
      );

      response.status(503).json({
        status: "error",
        message: "数据库连接失败"
      });
    }
  });

  app.use("/api/auth", authRouter);

  app.use((request, response) => {
    response.status(404).json({
      message: "接口不存在"
    });
  });

  app.use((error, request, response, next) => {
  if (error.type === "entity.parse.failed") {
    return response.status(400).json({
      message: "请求 JSON 格式错误"
    });
  }

  console.error("Unhandled API error:", error);

  return response.status(500).json({
    message: "服务器内部错误"
  });
});

  return app;
}