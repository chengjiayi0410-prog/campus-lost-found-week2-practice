# 校园失物招领

一个面向校园的失物与招领信息平台。用户可以搜索物品、按类型和分类筛选、查看详情、注册登录、发布信息，管理员可以删除违规内容。

当前进度：**第 7 周 E2E 与 GitHub Actions CI**。

![CI](https://github.com/chengjiayi0410-prog/campus-lost-found-week2-practice/actions/workflows/ci.yml/badge.svg)

## 已实现功能

- 首页失物招领列表
- 关键词搜索
- 失物、招领类型筛选
- 物品分类筛选
- 多条件组合筛选
- 信息详情页
- 用户真实注册和 JWT 登录
- 登录状态路由保护
- 发布信息与必填校验
- 图片本地预览
- 管理员信息列表和删除操作
- 手机端响应式布局

## 前端技术栈

- Vue 3
- Vite
- Vue Router
- 原生 CSS
- REST API 联调

## 后端技术栈

- Node.js
- Express
- MySQL 8
- JWT
- bcrypt
- Multer
- Vitest
- Supertest

## 页面

| 地址         | 页面     | 说明                       |
| ------------ | -------- | -------------------------- |
| `/`          | 首页     | 搜索、筛选和列表           |
| `/items/:id` | 详情     | 查看单条信息               |
| `/login`     | 登录     | 调用真实登录接口           |
| `/register`  | 注册     | 调用真实注册接口           |
| `/publish`   | 发布     | 调用真实发布和图片上传接口 |
| `/admin`     | 管理后台 | 管理员软删除信息           |

## 演示账号

普通用户：

```text
用户名：student1
密码：TestPass123!
```

管理员：

```text
用户名：admin
密码：AdminPass123!
```

## 后端开发

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

后端默认地址：`http://localhost:3000`。

健康检查：

- `GET /api/health`
- `GET /api/health/db`

接口文档：[docs/api.md](docs/api.md)

## 自动化测试

测试使用独立数据库 `campus_lost_found_test`，不会修改开发数据库。

```bash
cd server
npm test
npm run test:coverage
```

当前测试覆盖：

- 注册、登录和 JWT 当前用户接口
- 重复注册、错误密码和未授权访问
- 信息发布、筛选、分页和详情
- 修改与删除权限
- 管理员软删除
- 图片上传、类型限制和数量限制

测试说明：[docs/testing.md](docs/testing.md)

## 端到端测试

Playwright 会使用独立测试端口和测试数据库，自动启动前后端，并执行：

- 登录状态持久化
- 用户发布信息
- 管理员删除信息

```bash
npm run test:e2e
```

可视化调试：

```bash
npm run test:e2e:ui
```

CI 配置位于 `.github/workflows/ci.yml`。
