# 校园失物招领 API

> 当前阶段：第 4 周，认证与信息 CRUD API 已实现。

## 基础信息

- 开发地址：`http://localhost:3000/api`
- 数据格式：`application/json`
- 登录方式：JWT Bearer Token
- 图片上传：`multipart/form-data`

需要登录的接口使用请求头：

```http
Authorization: Bearer <token>
```

JWT 默认有效期为 2 小时。

## 健康检查

### GET /health

检查 Express API 是否运行。

响应：

```json
{
  "status": "ok",
  "service": "campus-lost-found-api",
  "timestamp": "2026-11-28T03:00:00.000Z"
}
```

### GET /health/db

检查 MySQL 是否可连接。

成功响应：

```json
{
  "status": "ok",
  "database": {
    "db": "campus_lost_found",
    "version": "8.0.46"
  }
}
```

数据库不可用时返回 `503`。

## 认证接口

### POST /auth/register

注册普通用户。

请求：

```json
{
  "username": "student1",
  "password": "TestPass123!",
  "nickname": "测试同学"
}
```

规则：

- 用户名长度为 3 至 30 位。
- 用户名只允许字母、数字和下划线。
- 密码至少 8 个字符，且不超过 72 字节。
- 昵称选填，最多 50 个字符。

成功响应：`201 Created`

```json
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "username": "student1",
    "nickname": "测试同学",
    "role": "user"
  }
}
```

用户名已存在时返回 `409`。

### POST /auth/login

使用用户名和密码登录。

请求：

```json
{
  "username": "student1",
  "password": "TestPass123!"
}
```

成功响应：

```json
{
  "message": "登录成功",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "username": "student1",
    "nickname": "测试同学",
    "role": "user"
  }
}
```

用户名或密码错误时统一返回 `401`，避免暴露账号是否存在。

### GET /auth/me

获取当前登录用户，需要 Bearer Token。

成功响应：

```json
{
  "user": {
    "id": 1,
    "username": "student1",
    "nickname": "测试同学",
    "role": "user",
    "created_at": "2026-11-28T02:07:22.000Z"
  }
}
```

## 信息接口

### GET /posts

公开获取有效信息列表。

查询参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `page` | `1` | 页码 |
| `pageSize` | `10` | 每页数量，最多 50 |
| `type` | 全部 | `lost` 或 `found` |
| `category` | 全部 | 分类 slug，例如 `card` |
| `keyword` | 空 | 搜索标题、描述和地点 |

示例：

```text
GET /api/posts?type=found&category=electronics&page=1&pageSize=10
```

响应：

```json
{
  "data": [
    {
      "id": 1,
      "type": "found",
      "title": "白色蓝牙耳机",
      "description": "白色充电盒，已交给图书馆服务台。",
      "location": "图书馆三楼",
      "status": "active",
      "createdAt": "2026-11-28T03:16:34.000Z",
      "updatedAt": "2026-11-28T03:16:34.000Z",
      "author": {
        "id": 1,
        "username": "student1",
        "nickname": "测试同学"
      },
      "category": {
        "id": 2,
        "slug": "electronics",
        "name": "电子设备",
        "icon": "📱"
      },
      "images": []
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

列表默认只返回 `active` 信息，不返回 `removed` 信息。

### GET /posts/:id

公开获取单条有效信息。

成功响应：

```json
{
  "data": {
    "id": 1,
    "type": "found",
    "title": "白色蓝牙耳机",
    "description": "白色充电盒，已交给图书馆服务台。",
    "location": "图书馆三楼",
    "status": "active",
    "author": {
      "id": 1,
      "username": "student1",
      "nickname": "测试同学"
    },
    "category": {
      "id": 2,
      "slug": "electronics",
      "name": "电子设备",
      "icon": "📱"
    },
    "images": [
      {
        "id": 1,
        "url": "/uploads/example.png",
        "sortOrder": 0
      }
    ]
  }
}
```

信息不存在或已软删除时返回 `404`。

### POST /posts

发布信息，需要 Bearer Token。

请求：

```json
{
  "type": "found",
  "category": "key",
  "title": "捡到一串钥匙",
  "description": "钥匙串上挂着蓝色小熊。",
  "location": "体育馆正门"
}
```

发布者由 JWT 确定，客户端不能指定 `userId`。

成功响应：`201 Created`

### PUT /posts/:id

修改信息，需要 Bearer Token。

只有发布者或管理员可以修改。请求体字段与发布接口相同。

成功响应：

```json
{
  "message": "修改成功",
  "data": {}
}
```

普通用户修改别人的信息时返回 `403`。

### DELETE /posts/:id

软删除信息，需要 Bearer Token。

只有发布者或管理员可以删除。接口会把 `status` 更新为 `removed`，不会物理删除记录。

成功响应：

```json
{
  "message": "删除成功"
}
```

### POST /posts/:id/images

为信息上传一张图片，需要 Bearer Token 和 `multipart/form-data`。

表单字段：

```text
image
```

限制：

- 仅支持 JPG、PNG 和 WebP。
- 最大 2 MB。
- 当前每条信息最多一张图片。
- 只有发布者或管理员可以上传。

成功响应：`201 Created`

```json
{
  "message": "图片上传成功",
  "data": {
    "id": 1,
    "url": "/uploads/example.png",
    "sortOrder": 0
  }
}
```

返回的图片地址是相对路径。完整地址为：

```text
http://localhost:3000/uploads/example.png
```

## 常见状态码

| 状态码 | 含义 |
| --- | --- |
| `200` | 请求成功 |
| `201` | 创建成功 |
| `400` | 参数、分类、JSON 或上传文件格式错误 |
| `401` | 未登录、JWT 无效或过期 |
| `403` | 已登录但无权限操作该信息 |
| `404` | 接口或信息不存在 |
| `409` | 用户名重复或图片数量已达到限制 |
| `500` | 未处理的服务器异常 |
| `503` | 数据库不可用 |
