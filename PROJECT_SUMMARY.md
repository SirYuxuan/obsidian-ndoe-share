# Obsidian Share System

## 项目概述

我已经为您开发了一个完整的Obsidian分享系统，包含：

### 1. Obsidian插件
- 在编辑器右上角添加悬浮分享按钮
- 支持密码保护和过期时间设置
- 自动复制分享链接到剪贴板
- 可配置的API端点
- 快捷键支持 (Ctrl/Cmd + Shift + S)
- 右键菜单分享功能

### 2. 后端API服务 (Node.js + Express)
- RESTful API接口
- SQLite数据库存储
- 密码加密存储 (bcrypt)
- 访问统计和日志记录
- 速率限制保护
- 管理员认证系统

### 3. 后台管理面板 (React + TailwindCSS)
- 现代化的响应式界面
- 分享链接管理
- 访问统计和图表
- 管理员认证
- 实时数据展示

### 4. Docker容器化部署
- 一键部署配置
- 健康检查和监控
- 持久化数据存储
- 生产环境就绪

## 项目结构

```
obsidian-share-system/
├── obsidian-share-plugin/     # Obsidian插件
│   ├── src/
│   │   └── main.ts           # 插件主逻辑
│   ├── manifest.json          # 插件清单
│   ├── package.json          # 插件依赖
│   └── esbuild.config.mjs    # 构建配置
│
├── backend/                   # 后端API服务
│   ├── src/
│   │   ├── index.js          # 服务入口
│   │   ├── routes/           # API路由
│   │   ├── models/           # 数据库模型
│   │   └── middleware/       # 中间件
│   ├── package.json          # 后端依赖
│   └── Dockerfile            # 后端容器配置
│
├── admin-panel/              # 后台管理界面
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── utils/           # 工具函数
│   │   └── App.js           # 应用主入口
│   ├── public/              # 静态资源
│   ├── package.json         # 前端依赖
│   └── Dockerfile           # 前端容器配置
│
├── docker/                   # Docker配置
│   └── docker-compose.yml   # 容器编排
│
├── docs/                    # 文档
│   ├── OBSIDIAN_PLUGIN_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── API_TESTING.md
│
├── setup.sh                 # 一键安装脚本
├── package.json             # 项目管理
└── README.md               # 主文档
```

## 主要功能特性

### Obsidian插件
- **悬浮分享按钮**: 在编辑器右上角显示，方便使用
- **密码保护**: 可选密码保护分享内容
- **过期时间**: 设置分享链接的有效期
- **快捷键支持**: Ctrl/Cmd + Shift + S 快速分享
- **配置界面**: 在Obsidian设置中配置API和选项

### 后端API
- **创建分享**: POST `/api/shares`
- **获取分享**: GET `/api/shares/{id}`
- **密码验证**: 支持密码保护的分享
- **访问统计**: 记录访问次数和时间
- **管理接口**: 管理员可以查看和删除分享
- **自动清理**: 自动清理过期分享

### 后台管理
- **仪表板**: 系统概览和统计
- **分享管理**: 查看、搜索、删除分享链接
- **访问日志**: 查看每个分享的访问记录
- **统计图表**: 可视化展示分享数据
- **系统设置**: 清理过期分享等功能

## 技术栈

### 后端技术
- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: SQLite (轻量级，无需单独服务)
- **安全**: bcrypt密码加密、速率限制、CORS防护
- **部署**: Docker容器化

### 前端技术 (管理面板)
- **框架**: React 18
- **样式**: TailwindCSS
- **路由**: React Router
- **HTTP客户端**: Axios
- **UI组件**: React Icons、React Hot Toast
- **构建工具**: Create React App

### Obsidian插件
- **语言**: TypeScript
- **构建**: esbuild
- **API**: Obsidian官方插件API

## 快速开始

### 1. 一键部署
```bash
# 克隆项目
git clone <your-repo-url>
cd obsidian-share-system

# 运行安装脚本
chmod +x setup.sh
./setup.sh

# 启动服务
docker-compose up -d
```

### 2. 配置环境
```bash
# 编辑后端配置
cp backend/.env.example backend/.env
# 修改 .env 文件中的配置
```

### 3. 安装Obsidian插件
1. 构建插件: `cd obsidian-share-plugin && npm run build`
2. 将 `dist/main.js` 和 `manifest.json` 复制到您的Obsidian vault的 `.obsidian/plugins/obsidian-share-plugin/` 目录
3. 在Obsidian中启用插件
4. 配置插件设置中的API URL为 `http://localhost:3000/api`

### 4. 访问服务
- **后端API**: http://localhost:3000
- **后台管理**: http://localhost:3001
- **默认管理员**: admin / admin123

## API接口文档

### 公开接口
```
POST   /api/shares          创建分享
GET    /api/shares/{id}     获取分享内容
HEAD   /api/shares/{id}     检查分享是否存在
GET    /api/shares/{id}/stats   获取分享统计
GET    /health              健康检查
```

### 管理接口 (需要Basic Auth)
```
POST   /api/admin/login     管理员登录
GET    /api/admin/shares    获取所有分享
GET    /api/admin/shares/{id}   获取分享详情
DELETE /api/admin/shares/{id}   删除分享
GET    /api/admin/stats     获取系统统计
POST   /api/admin/cleanup   清理过期分享
```

## 配置说明

### 后端配置 (.env)
```env
# 服务配置
PORT=3000
NODE_ENV=production

# 数据库
DB_PATH=/app/data/shares.db

# 安全配置 (必须修改！)
SESSION_SECRET=your-unique-session-secret
JWT_SECRET=your-unique-jwt-secret
ADMIN_PASSWORD=your-strong-password

# 分享设置
SHARE_URL_PREFIX=https://your-domain.com/share
SHARE_EXPIRE_DAYS=30
```

### Obsidian插件配置
- **API URL**: 后端API地址
- **Default Password**: 默认分享密码
- **Auto-copy**: 是否自动复制链接
- **Notifications**: 是否显示通知

## 部署选项

### 1. Docker Compose (推荐)
```bash
docker-compose up -d
```

### 2. PM2部署
```bash
# 后端
cd backend
npm install --production
pm2 start src/index.js --name "obsidian-share-backend"

# 前端
cd admin-panel
npm install --production
npm run build
pm2 serve build 3001 --name "obsidian-share-admin"
```

### 3. 手动部署
```bash
# 后端
cd backend
npm install
node src/index.js

# 前端
cd admin-panel
npm install
npm run build
# 使用Nginx或Apache提供静态文件
```

## 安全建议

### 生产环境配置
1. **修改默认密码**: 必须修改 `ADMIN_PASSWORD`
2. **使用HTTPS**: 配置SSL证书
3. **防火墙规则**: 限制访问端口
4. **定期备份**: 备份数据库文件
5. **监控日志**: 设置日志监控和告警

### 数据库安全
- SQLite数据库文件存储在 `backend/data/shares.db`
- 定期备份到安全位置
- 设置适当的文件权限 (600)

### API安全
- 启用速率限制防止滥用
- 使用强密码保护管理员接口
- 在生产环境禁用CORS或配置允许的来源

## 维护和监控

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs backend -f

# 查看特定时间段日志
docker-compose logs --since 1h
```

### 数据备份
```bash
# 备份数据库
docker-compose exec backend cp /app/data/shares.db /app/data/shares.db.backup

# 恢复数据库
docker-compose exec backend cp /app/data/shares.db.backup /app/data/shares.db
```

### 系统监控
```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 健康检查
curl http://localhost:3000/health
```

## 故障排除

### 常见问题

1. **插件无法连接API**
   - 检查API URL配置
   - 确认后端服务正在运行
   - 检查防火墙设置

2. **数据库权限错误**
   ```bash
   # 修复权限
   chmod 600 backend/data/shares.db
   chown -R 1000:1000 backend/data/
   ```

3. **Docker容器启动失败**
   ```bash
   # 查看详细错误
   docker-compose logs
   
   # 重启服务
   docker-compose down
   docker-compose up -d
   ```

4. **内存不足**
   ```bash
   # 查看内存使用
   docker stats
   
   # 增加内存限制
   # 在docker-compose.yml中添加内存限制
   ```

### 获取帮助
- 查看详细日志: `docker-compose logs --tail=100`
- 检查网络连接: `curl http://localhost:3000/health`
- 验证数据库: `docker-compose exec backend sqlite3 /app/data/shares.db ".tables"`

## 扩展开发

### 添加新功能
1. **修改后端API**: 在 `backend/src/routes/` 添加新路由
2. **更新数据库**: 修改 `backend/src/models/Database.js`
3. **添加前端页面**: 在 `admin-panel/src/components/` 创建新组件
4. **增强插件功能**: 修改 `obsidian-share-plugin/src/main.ts`

### 自定义样式
- 后端: 修改 `backend/public/` 中的静态文件
- 前端: 修改 `admin-panel/src/index.css` 和 `tailwind.config.js`
- 插件: 修改插件中的CSS样式

### 集成其他服务
- 添加邮件通知
- 集成Slack/Telegram webhook
- 添加CDN支持
- 集成对象存储 (S3, MinIO等)

## 许可证

MIT License - 详见LICENSE文件

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 更新日志

### v1.0.0 (当前版本)
- ✅ 完整的Obsidian分享插件
- ✅ 后端API服务
- ✅ 后台管理系统
- ✅ Docker容器化部署
- ✅ 完整文档
- ✅ 安全特性
- ✅ 访问统计

### 计划功能
- [ ] Web界面查看分享内容
- [ ] 批量分享功能
- [ ] 分享预览图片生成
- [ ] 高级搜索功能
- [ ] 多语言支持
- [ ] 邮件通知
- [ ] 数据分析报告

---

**项目状态**: ✅ 生产就绪

这是一个完整的、生产就绪的Obsidian分享系统，可以立即部署使用。系统具有良好的安全性、可扩展性和易于维护的特性。