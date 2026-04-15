# YxMdShare Plugin & Backend System

这是一个完整的 YxMdShare 笔记分享系统，包含：

1. **YxMdShare 插件** - 在 Obsidian 中添加悬浮分享按钮
2. **后端API服务** - Node.js + Express API服务，处理文件分享
3. **后台管理面板** - React后台管理系统，管理分享链接和统计
4. **Docker容器化** - 使用Docker Compose一键部署

## 功能特性

### YxMdShare 插件
- 在文章页面添加悬浮分享按钮
- 支持密码保护分享
- 设置分享过期时间
- 自动复制分享链接到剪贴板
- 可配置的API端点

### 后端API
- 创建和管理分享链接
- 密码保护和过期时间
- 访问统计和日志
- 管理员认证
- 数据库存储（SQLite）

### 后台管理
- 查看所有分享链接
- 删除分享链接
- 查看访问统计
- 清理过期分享
- 响应式设计

## 快速开始

### 1. 前提条件
- Docker 和 Docker Compose
- Node.js 16+ (用于开发)
- Obsidian 0.15+

### 2. 部署后端和管理面板

```bash
# 复制环境变量配置
cp backend/.env.example backend/.env

# 启动服务
docker-compose up -d
```

服务将在以下地址运行：
- 后端API: http://localhost:3000
- 后台管理: http://localhost:3001
- API文档: http://localhost:3000/api-docs (开发中)

### 3. 安装 YxMdShare 插件

#### 方法一：手动安装
1. 在 Obsidian 插件市场搜索 `YxMdShare`
2. 或者手动安装：
   - 将插件文件复制到您的 Obsidian vault 的 `.obsidian/plugins/yx-md-share/` 目录
   - 在Obsidian中启用插件

#### 方法二：开发模式
```bash
cd obsidian-share-plugin
npm install
npm run dev
```

### 4. 配置 YxMdShare 插件
1. 在 Obsidian 设置中找到 `YxMdShare`
2. 设置API URL为 `http://localhost:3000/api`
3. 配置默认密码（可选）
4. 保存设置

## 使用说明

### 创建分享
1. 在Obsidian中打开任何笔记
2. 点击右上角的悬浮分享按钮
3. 设置密码（可选）
4. 设置过期时间（可选）
5. 点击"Share"按钮

### 访问分享
1. 生成的分享链接格式为：`http://localhost:3000/share/{share-id}`
2. 如果设置了密码，需要输入密码才能查看内容

### 后台管理
1. 访问 http://localhost:3001
2. 使用默认管理员账号登录：
   - 用户名: admin
   - 密码: admin123 (请在生产环境中修改)
3. 可以查看所有分享链接、删除分享、查看统计等

## API接口

### 创建分享
```http
POST /api/shares
Content-Type: application/json

{
  "content": "分享内容",
  "password": "可选密码",
  "expireDays": 30
}
```

### 获取分享内容
```http
GET /api/shares/{share-id}?password={password}
```

### 后台管理接口
所有后台管理接口都需要Basic Auth认证，使用管理员账号密码。

## 配置说明

### 环境变量 (backend/.env)
```bash
# 服务配置
PORT=3000
NODE_ENV=development

# 数据库
DB_PATH=./data/shares.db

# 安全配置
SESSION_SECRET=your-session-secret-key
JWT_SECRET=your-jwt-secret
BCRYPT_SALT_ROUNDS=10

# 应用设置
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
SHARE_URL_PREFIX=http://localhost:3000/share
SHARE_TOKEN_LENGTH=16
SHARE_EXPIRE_DAYS=30

# 管理员账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Docker配置
- 数据存储在 `share_data` Docker卷中
- 支持健康检查
- 自动重启策略

## 开发指南

### 后端开发
```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 文件
npm run dev
```

### 前端开发
```bash
cd admin-panel
npm install
npm start
```

### YxMdShare 插件开发
```bash
cd obsidian-share-plugin
npm install
npm run dev
```

## 安全建议

### 生产环境部署
1. **修改默认密码**: 修改 `ADMIN_PASSWORD` 环境变量
2. **使用HTTPS**: 配置SSL证书
3. **限制访问**: 使用防火墙限制对后台管理页面的访问
4. **定期清理**: 定期清理过期分享链接
5. **数据库备份**: 定期备份SQLite数据库

### 安全配置
- 使用强密码保护管理员账号
- 定期更换SESSION_SECRET和JWT_SECRET
- 在生产环境中禁用CORS或配置允许的来源
- 使用环境变量存储敏感信息

## 故障排除

### 常见问题

1. **插件无法连接API**
   - 检查API URL配置
   - 确保后端服务正在运行
   - 检查防火墙设置

2. **数据库错误**
   - 确保 `data` 目录有写入权限
   - 检查数据库文件路径配置

3. **Docker容器无法启动**
   - 检查Docker日志: `docker-compose logs`
   - 检查端口是否被占用

4. **无法访问分享链接**
   - 检查Nginx配置
   - 确认分享链接未过期
   - 验证密码是否正确

### 日志查看
```bash
# 查看所有容器日志
docker-compose logs -f

# 查看特定容器日志
docker-compose logs backend -f
docker-compose logs admin-panel -f
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v0.1.0
- 初始版本发布
- 基础分享功能
- 密码保护和过期时间
- 后台管理系统
- Docker容器化部署
