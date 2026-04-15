# Obsidian Share System

感谢您使用Obsidian Share System！我已经为您创建了一个完整的Obsidian分享系统，包含以下组件：

## 🎯 已完成的功能

### 1. **Obsidian插件** (`obsidian-share-plugin/`)
- 悬浮分享按钮（编辑器右上角）
- 密码保护分享功能
- 过期时间设置（1天、7天、30天、90天、永久）
- 自动复制分享链接
- 快捷键支持 (Ctrl/Cmd + Shift + S)
- 右键菜单分享选项
- 可配置的API设置界面

### 2. **后端API服务** (`backend/`)
- RESTful API接口
- SQLite数据库存储
- 密码加密（bcrypt）
- 访问统计和日志
- 速率限制保护
- 管理员认证系统
- 健康检查端点

### 3. **后台管理面板** (`admin-panel/`)
- 现代化的React界面
- 响应式设计（支持移动端）
- 仪表板统计
- 分享链接管理（查看、搜索、删除）
- 访问日志查看
- 数据可视化图表
- 过期分享清理

### 4. **容器化部署** (`docker/`)
- Docker Compose一键部署
- 独立容器（后端 + 前端）
- 数据持久化存储
- 健康检查和自动重启
- 生产环境就绪配置

### 5. **完整文档**
- 部署指南
- API测试文档
- Obsidian插件使用指南
- 项目结构说明
- 故障排除指南

## 🚀 快速启动

### 步骤1: 设置环境
```bash
# 克隆项目（如果尚未克隆）
git clone <your-repo-url>
cd obsidian-share-system

# 运行安装脚本
chmod +x setup.sh
./setup.sh

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑 .env 文件，修改安全配置
```

### 步骤2: 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 验证服务运行
docker-compose ps
```

### 步骤3: 安装Obsidian插件
1. 构建插件：
   ```bash
   cd obsidian-share-plugin
   npm install
   npm run build
   ```

2. 将插件文件复制到Obsidian：
   - 复制 `dist/main.js` 和 `manifest.json` 到您的Obsidian vault的 `.obsidian/plugins/obsidian-share-plugin/` 目录
   - 重启Obsidian并启用插件

3. 配置插件：
   - 打开Obsidian设置 → Community plugins
   - 找到 "Share Plugin" 并启用
   - 在插件设置中配置API URL为 `http://localhost:3000/api`

### 步骤4: 访问系统
- **后端API**: http://localhost:3000
- **后台管理**: http://localhost:3001
- **默认管理员**: 用户名 `admin`，密码 `admin123`（请在生产环境中修改！）

## 🔧 功能使用

### 分享笔记
1. 在Obsidian中打开任何笔记
2. 点击右上角的悬浮分享按钮（上传图标）
3. 可选：设置密码和过期时间
4. 点击"Share"按钮
5. 分享链接将自动复制到剪贴板

### 管理分享
1. 访问 http://localhost:3001
2. 使用管理员账号登录
3. 查看所有分享链接
4. 管理分享（查看、删除）
5. 查看统计信息

## ⚙️ 生产环境部署建议

### 安全配置
1. **修改默认密码**: 必须修改 `ADMIN_PASSWORD`
2. **使用HTTPS**: 配置SSL证书
3. **设置防火墙**: 限制不必要的端口访问
4. **定期备份**: 备份数据库文件

### 环境变量配置
```env
# 必须修改的配置
SESSION_SECRET=your-very-long-random-secret-key
JWT_SECRET=another-very-long-random-secret-key
ADMIN_PASSWORD=your-strong-admin-password-here

# 使用您的域名
SHARE_URL_PREFIX=https://your-domain.com/share
```

## 📊 系统架构

```
用户 -> Obsidian插件 -> 后端API -> SQLite数据库
                     ↓
              后台管理面板
```

- **数据库**: SQLite（轻量级，无需单独服务）
- **后端**: Node.js + Express
- **前端**: React + TailwindCSS
- **部署**: Docker容器化

## 🔍 测试系统

运行API测试：
```bash
# 查看API测试文档
cat docs/API_TESTING.md

# 运行测试脚本
./test-api.sh
```

## 🛠️ 故障排除

### 常见问题

1. **插件无法连接API**
   ```bash
   # 检查API服务
   curl http://localhost:3000/health
   
   # 查看日志
   docker-compose logs backend
   ```

2. **无法访问后台管理**
   ```bash
   # 检查前端服务
   curl http://localhost:3001
   
   # 重启服务
   docker-compose restart
   ```

3. **数据库问题**
   ```bash
   # 检查数据库文件权限
   ls -la backend/data/
   
   # 重建数据库
   rm backend/data/shares.db
   docker-compose up -d
   ```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs backend -f
docker-compose logs admin-panel -f
```

## 📝 扩展开发

### 添加新功能
- 后端API: 修改 `backend/src/routes/`
- 前端界面: 修改 `admin-panel/src/components/`
- 插件功能: 修改 `obsidian-share-plugin/src/main.ts`

### 自定义样式
- 前端CSS: `admin-panel/src/index.css`
- Tailwind配置: `admin-panel/tailwind.config.js`
- 插件样式: 插件内的CSS样式

## 📁 项目结构概览

```
obsidian-share-system/
├── obsidian-share-plugin/     # Obsidian插件
├── backend/                   # 后端API服务
├── admin-panel/              # 后台管理界面
├── docker/                   # Docker配置
├── docs/                     # 文档
├── setup.sh                  # 安装脚本
├── docker-compose.yml        # 容器编排
└── README.md                 # 主文档
```

## 🎉 开始使用

系统已完全配置好，可以立即使用。建议先在本地的开发环境中测试，确认一切正常后再部署到生产环境。

如需进一步帮助或功能建议，请查阅文档或提出问题。

**祝您使用愉快！** 🚀