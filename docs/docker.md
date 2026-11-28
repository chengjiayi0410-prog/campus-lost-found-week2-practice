# Docker Compose 运行说明

> 当前阶段：第 8 周，前后端、MySQL 和 Nginx 已可通过 Compose 一键启动。

## 服务结构

```text
Browser
   │
   ▼
nginx :8080
   ├── /api/      → backend:3000
   ├── /uploads/  → backend:3000
   └── /          → frontend:80

backend:3000 ──→ mysql:3306
```

| 服务       | 作用                    | 是否暴露到主机 |
| ---------- | ----------------------- | -------------- |
| `nginx`    | 统一入口和反向代理      | 是，8080       |
| `frontend` | Nginx 托管 Vue 构建产物 | 否             |
| `backend`  | Express API             | 否             |
| `mysql`    | MySQL 8.4 数据库        | 否             |

## 数据卷

| 卷             | 挂载位置         | 用途           |
| -------------- | ---------------- | -------------- |
| `mysql_data`   | `/var/lib/mysql` | 持久化数据库   |
| `uploads_data` | `/app/uploads`   | 持久化上传图片 |

删除容器不会删除这两个卷，因此数据库和图片可以保留。

## 环境变量

复制模板：

```bash
cp .env.docker.example .env.docker
```

需要填写：

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

不要提交 `.env.docker`。

## 启动

```bash
docker compose --env-file .env.docker up -d --build
```

访问：

```text
http://localhost:8080
```

演示账号：

```text
普通用户：student1 / TestPass123!
管理员：admin / AdminPass123!
```

## 状态与日志

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker logs -f mysql
docker compose --env-file .env.docker logs -f nginx
```

## 停止

停止并保留数据：

```bash
docker compose --env-file .env.docker down
```

重新启动：

```bash
docker compose --env-file .env.docker up -d
```

## 清空并重新初始化

以下命令会删除本项目的数据库和上传图片：

```bash
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d --build
```

仅在确认不需要现有容器数据时使用。

## 健康检查

四个服务都配置了健康检查：

- MySQL：`mysqladmin ping`
- 后端：`/api/health`
- 前端：`/health`
- 反向代理：`/health`

入口健康检查：

```text
http://localhost:8080/health
```

数据库代理检查：

```text
http://localhost:8080/api/health/db
```
