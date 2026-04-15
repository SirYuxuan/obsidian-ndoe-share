# 部署指南

## 快速部署

### 使用Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/your-repo/obsidian-share-system.git
cd obsidian-share-system

# 2. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 .env 文件，设置您的配置

# 3. 启动服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

### 环境变量配置 (backend/.env)

```env
# ============ 必须配置 ============
PORT=3000
NODE_ENV=production

# 数据库路径（Docker卷中使用）
DB_PATH=/app/data/shares.db

# 安全密钥 - 必须修改！
SESSION_SECRET=your-unique-session-secret-here
JWT_SECRET=your-unique-jwt-secret-here

# 分享链接前缀 - 必须修改为您的域名！
SHARE_URL_PREFIX=https://your-domain.com/share

# 管理员密码 - 必须修改！
ADMIN_PASSWORD=your-strong-admin-password

# ============ 可选配置 ============
# Bcrypt加密轮数（默认10）
BCRYPT_SALT_ROUNDS=10

# 前端管理面板地址
FRONTEND_URL=https://your-domain.com

# 分享Token长度（默认16）
SHARE_TOKEN_LENGTH=16

# 默认过期天数（默认30）
SHARE_EXPIRE_DAYS=30

# 速率限制窗口（毫秒）
RATE_LIMIT_WINDOW_MS=900000  # 15分钟
# 每个窗口最大请求数
RATE_LIMIT_MAX=100
```

## 生产环境部署

### 1. 使用Docker Compose (推荐)

```bash
# 使用生产配置启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

创建 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/shares.db
      - SESSION_SECRET=${SESSION_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - SHARE_URL_PREFIX=https://your-domain.com/share
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.your-domain.com`)"
      - "traefik.http.services.backend.loadbalancer.server.port=3000"
    networks:
      - traefik-public
    restart: always

  admin-panel:
    environment:
      - REACT_APP_API_URL=https://api.your-domain.com/api
      - REACT_APP_SHARE_URL_PREFIX=https://your-domain.com/share
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin.rule=Host(`admin.your-domain.com`)"
      - "traefik.http.services.admin.loadbalancer.server.port=3000"
    networks:
      - traefik-public
    restart: always

networks:
  traefik-public:
    external: true

volumes:
  share_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/persistent/data
```

### 2. 使用Nginx反向代理

创建Nginx配置 `/etc/nginx/sites-available/obsidian-share`:

```nginx
# API服务
server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 后台管理
server {
    listen 80;
    server_name admin.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 分享链接
server {
    listen 80;
    server_name share.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用SSL（使用Let's Encrypt）:

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d api.your-domain.com -d admin.your-domain.com -d share.your-domain.com
```

### 3. 使用PM2管理进程

如果不用Docker，可以使用PM2:

```bash
# 安装PM2
npm install -g pm2

# 启动后端
cd backend
npm install --production
pm2 start src/index.js --name "obsidian-share-backend"

# 启动前端
cd admin-panel
npm install --production
npm run build
pm2 serve build 3001 --name "obsidian-share-admin"

# 保存PM2配置
pm2 save
pm2 startup
```

## 数据备份

### 自动备份脚本

创建备份脚本 `backup.sh`:

```bash
#!/bin/bash

# 备份数据库
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/app/data/shares.db"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp $DB_PATH $BACKUP_DIR/shares_$DATE.db

# 压缩备份
gzip $BACKUP_DIR/shares_$DATE.db

# 删除7天前的备份
find $BACKUP_DIR -name "*.db.gz" -mtime +7 -delete

# 日志记录
echo "[$(date)] Backup completed: $BACKUP_DIR/shares_$DATE.db.gz" >> /var/log/obsidian-share-backup.log
```

添加到crontab:

```bash
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

### Docker卷备份

```bash
# 备份Docker卷
docker run --rm -v share_data:/data -v /path/to/backups:/backup ubuntu tar czf /backup/share_data_$(date +%Y%m%d).tar.gz -C /data .

# 恢复Docker卷
docker run --rm -v share_data:/data -v /path/to/backups:/backup ubuntu tar xzf /backup/share_data_20240101.tar.gz -C /data
```

## 监控和维护

### 健康检查
- 后端: `GET http://your-domain.com/health`
- 前端: `GET http://admin.your-domain.com/health`

### 日志查看
```bash
# Docker日志
docker-compose logs -f backend
docker-compose logs -f admin-panel

# 查看最近错误
docker-compose logs backend --tail=100 | grep -i error

# 实时日志
docker-compose logs -f --tail=50
```

### 性能监控

创建监控脚本 `monitor.sh`:

```bash
#!/bin/bash

# 检查服务状态
check_service() {
    local service=$1
    local url=$2
    
    if curl -s --max-time 5 $url > /dev/null; then
        echo "[OK] $service is running"
        return 0
    else
        echo "[ERROR] $service is down"
        return 1
    fi
}

# 检查磁盘空间
check_disk() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $usage -gt 90 ]; then
        echo "[WARNING] Disk usage is $usage%"
    else
        echo "[OK] Disk usage is $usage%"
    fi
}

# 检查内存使用
check_memory() {
    local usage=$(free -m | awk 'NR==2 {printf "%.1f", $3*100/$2}')
    if [ $(echo "$usage > 90" | bc) -eq 1 ]; then
        echo "[WARNING] Memory usage is $usage%"
    else
        echo "[OK] Memory usage is $usage%"
    fi
}

# 执行检查
echo "=== Service Status Check $(date) ==="
check_service "Backend API" "http://localhost:3000/health"
check_service "Admin Panel" "http://localhost:3001"
check_disk
check_memory
```

## 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   
   # 检查Docker容器状态
   docker-compose ps
   docker-compose logs
   ```

2. **数据库权限问题**
   ```bash
   # 确保数据目录有正确权限
   chown -R 1000:1000 ./data
   ```

3. **插件无法连接**
   ```bash
   # 检查API响应
   curl http://localhost:3000/health
   
   # 检查网络连接
   docker-compose exec backend curl localhost:3000/health
   ```

4. **内存不足**
   ```bash
   # 查看容器内存使用
   docker stats
   
   # 限制容器内存
   # 在docker-compose.yml中添加:
   # services:
   #   backend:
   #     deploy:
   #       resources:
   #         limits:
   #           memory: 512M
   ```

### 恢复步骤

1. **备份恢复**
   ```bash
   # 停止服务
   docker-compose down
   
   # 恢复备份
   cp /backup/shares.db ./data/
   
   # 启动服务
   docker-compose up -d
   ```

2. **重置管理员密码**
   ```bash
   # 进入数据库
   docker-compose exec backend sqlite3 /app/data/shares.db
   
   # 重置密码（将'newpassword'替换为你的密码）
   UPDATE admins SET password_hash = 'bcrypt_hash_here' WHERE username = 'admin';
   ```

## 安全建议

### 生产环境
1. 使用HTTPS
2. 配置防火墙规则
3. 定期更新依赖
4. 使用强密码
5. 启用访问日志
6. 限制API调用频率
7. 定期备份数据

### 更新服务
```bash
# 拉取最新代码
git pull origin main

# 重建Docker镜像
docker-compose build --no-cache

# 重启服务
docker-compose down
docker-compose up -d
```

## 扩展和定制

### 添加新功能
1. 修改后端API路由 (`backend/src/routes/`)
2. 更新数据库模型 (`backend/src/models/`)
3. 添加前端组件 (`admin-panel/src/components/`)
4. 更新Obsidian插件 (`obsidian-share-plugin/src/`)

### 自定义样式
1. 修改前端CSS (`admin-panel/src/index.css`)
2. 更新Tailwind配置 (`admin-panel/tailwind.config.js`)
3. 自定义Obsidian插件样式 (`obsidian-share-plugin/styles/`)

## 支持

如需帮助：
1. 查看 [GitHub Issues](https://github.com/your-repo/issues)
2. 提供详细错误日志
3. 描述复现步骤
4. 附上相关配置信息