# 自动化测试

> 当前阶段：第 7 周，自动化测试与 Playwright E2E 已接入 CI。

## 测试工具

- Vitest：运行单元测试和接口测试
- Supertest：不启动真实端口，直接请求 Express 应用
- `@vitest/coverage-v8`：生成 V8 覆盖率报告
- Playwright：通过真实浏览器执行用户操作

## 测试数据库

测试使用独立数据库：

```text
campus_lost_found_test
```

测试环境配置保存在本地的：

```text
server/.env.test
```

该文件不会提交到 Git。可参考：

```text
server/.env.test.example
```

每次测试开始前会清空测试库中的业务表并重新写入分类，测试结束后释放连接和清理上传文件。开发数据库 `campus_lost_found` 不会被修改。

## 运行测试

```bash
cd server
npm test
```

监听模式：

```bash
npm run test:watch
```

覆盖率报告：

```bash
npm run test:coverage
```

覆盖率 HTML 报告生成在 `server/coverage/index.html`，不会提交到 Git。

## 当前覆盖范围

### 认证接口

- 注册成功
- 用户名重复
- 注册参数非法
- 登录成功
- 密码错误
- 缺失 Token 返回 `401`
- 携带 Token 获取当前用户

### 信息接口

- 发布信息
- 类型、分类和关键词组合筛选
- 分页与总数
- 信息详情
- 不存在的详情返回 `404`
- 普通用户不能修改别人的信息
- 普通用户不能删除别人的信息
- 发布者可以修改自己的信息
- 管理员可以软删除信息

### 图片接口

- 上传合法 PNG
- 每条信息只允许一张图片
- 拒绝 SVG
- 上传文件写入后由测试自动清理

## 当前测试结果

```text
Test Files  2 passed
Tests       14 passed
```

最近一次覆盖率：

```text
Statements  77.39%
Branches    73.68%
Functions   81.81%
Lines       77.24%
```

覆盖率不应只追求数字。后续会优先补齐关键业务异常、权限组合和前端组件的测试。

Playwright 当前结果：

```text
3 passed
```

## 端到端测试

Playwright 使用独立端口：

- 后端：`http://127.0.0.1:3100`
- 前端：`http://127.0.0.1:5174`

测试启动前会重新创建测试用户与分类，结束后关闭前后端测试进程。

```bash
npm run test:e2e
```

当前 E2E 流程：

1. 普通用户登录后刷新页面，登录状态仍然有效。
2. 普通用户发布信息，并进入真实详情页。
3. 管理员登录后在后台删除信息。

失败时会保存：

- 页面截图
- 浏览器录屏
- Playwright trace
- HTML 测试报告

这些文件位于 `test-results` 和 `playwright-report`，已被 Git 忽略。

## GitHub Actions

工作流文件：

```text
.github/workflows/ci.yml
```

每次 push 和 pull request 会执行：

- ESLint
- Prettier 格式检查
- Vitest 接口测试与覆盖率
- Vue 生产构建
- Playwright Chromium E2E

覆盖率报告和失败时的 E2E 附件会作为 Actions Artifact 上传。
