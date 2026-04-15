# Obsidian Share System - API 测试

## 环境准备

### 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## API 测试

### 1. 健康检查
```bash
curl http://localhost:3000/health
```
预期响应:
```json
{"status":"OK","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. 创建分享（无密码）
```bash
curl -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一个测试分享内容",
    "expireDays": 7
  }'
```

预期响应:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "shareId": "abc123def456ghij",
    "url": "http://localhost:3000/share/abc123def456ghij",
    "hasPassword": false,
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
}
```

### 3. 创建分享（有密码）
```bash
curl -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一个密码保护的分享",
    "password": "mypassword123",
    "expireDays": 30
  }'
```

### 4. 获取分享内容
```bash
# 无密码分享
curl http://localhost:3000/api/shares/abc123def456ghij

# 有密码分享
curl "http://localhost:3000/api/shares/share-id-here?password=mypassword123"
```

### 5. 检查是否需要密码
```bash
curl http://localhost:3000/api/shares/abc123def456ghij/requires-password
```

### 6. 获取分享统计
```bash
curl http://localhost:3000/api/shares/abc123def456ghij/stats
```

### 7. 管理员登录
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 8. 管理员获取所有分享（需要Basic Auth）
```bash
# 使用base64编码的用户名密码
# admin:admin123 -> YWRtaW46YWRtaW4xMjM=
curl -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:3000/api/admin/shares
```

### 9. 获取统计信息
```bash
curl -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:3000/api/admin/stats
```

### 10. 清理过期分享
```bash
curl -X POST -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:3000/api/admin/cleanup
```

## 错误测试

### 1. 无效的分享ID
```bash
curl http://localhost:3000/api/shares/invalid-id
```
预期响应: 404 Not Found

### 2. 错误的密码
```bash
curl "http://localhost:3000/api/shares/protected-id?password=wrong"
```
预期响应: 401 Unauthorized

### 3. 过期的分享
```bash
curl http://localhost:3000/api/shares/expired-id
```
预期响应: 410 Gone

### 4. 缺少内容
```bash
curl -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -d '{}'
```
预期响应: 400 Bad Request

### 5. 无效的管理员凭证
```bash
curl -H "Authorization: Basic dXNlcjp3cm9uZw==" \
  http://localhost:3000/api/admin/shares
```
预期响应: 401 Unauthorized

## 速率限制测试

### 创建分享限制（15分钟内100次）
```bash
# 测试速率限制
for i in {1..150}; do
  curl -X POST http://localhost:3000/api/shares \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"Test $i\",\"expireDays\":1}"
  echo
done
```
预期: 第101次请求会收到429 Too Many Requests

## 批量测试脚本

创建测试脚本 `test-api.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"

echo "=== API 测试开始 ==="
echo

# 测试健康检查
echo "1. 健康检查:"
curl -s "$API_URL/../health" | jq .
echo

# 测试创建分享
echo "2. 创建分享（无密码）:"
SHARE_RESPONSE=$(curl -s -X POST "$API_URL/shares" \
  -H "Content-Type: application/json" \
  -d '{"content":"这是一个测试分享内容","expireDays":1}')
echo $SHARE_RESPONSE | jq .

SHARE_ID=$(echo $SHARE_RESPONSE | jq -r '.data.shareId')
echo "分享ID: $SHARE_ID"
echo

# 测试获取分享
echo "3. 获取分享内容:"
curl -s "$API_URL/shares/$SHARE_ID" | jq .
echo

# 测试检查密码需求
echo "4. 检查是否需要密码:"
curl -s "$API_URL/shares/$SHARE_ID/requires-password" | jq .
echo

# 测试统计信息
echo "5. 获取分享统计:"
curl -s "$API_URL/shares/$SHARE_ID/stats" | jq .
echo

# 测试管理员登录
echo "6. 管理员登录:"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo $LOGIN_RESPONSE | jq .
echo

# 测试获取所有分享
echo "7. 获取所有分享:"
curl -s -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  "$API_URL/admin/shares" | jq '.data.shares[0:3]' # 只显示前3个
echo

# 测试获取统计
echo "8. 获取系统统计:"
curl -s -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  "$API_URL/admin/stats" | jq .
echo

echo "=== API 测试完成 ==="
```

运行测试:
```bash
chmod +x test-api.sh
./test-api.sh
```

## 前端测试

### 1. 访问后台管理
打开浏览器访问: http://localhost:3001

使用默认凭据登录:
- 用户名: admin
- 密码: admin123

### 2. 测试功能
1. 登录系统
2. 查看仪表板
3. 浏览分享列表
4. 查看分享详情
5. 删除分享
6. 查看统计信息
7. 清理过期分享

### 3. Obsidian插件测试
1. 在Obsidian中安装插件
2. 配置API URL: http://localhost:3000/api
3. 打开一个笔记
4. 点击悬浮分享按钮
5. 创建分享链接
6. 验证链接可以访问

## 性能测试

### 使用Apache Bench
```bash
# 测试创建分享API
ab -n 100 -c 10 -p test-data.json -T "application/json" \
  http://localhost:3000/api/shares

# 测试获取分享API
ab -n 1000 -c 50 http://localhost:3000/api/shares/test-share-id
```

创建 `test-data.json`:
```json
{
  "content": "这是一个测试内容，用于性能测试。",
  "expireDays": 1
}
```

## 安全测试

### 1. SQL注入测试
```bash
# 测试SQL注入
curl -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -d '{"content":"\"; DROP TABLE shares; --","expireDays":1}'
```

### 2. XSS测试
```bash
# 测试XSS
curl -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(\"XSS\")</script>","expireDays":1}'
```

### 3. 文件上传测试
```bash
# 测试文件上传
curl -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -d '{"content":"恶意内容","expireDays":-1}'
```

## 监控测试

### 1. 检查日志
```bash
# 查看后端日志
docker-compose logs backend --tail=50

# 查看前端日志
docker-compose logs admin-panel --tail=50
```

### 2. 监控资源使用
```bash
# 查看Docker容器资源使用
docker stats

# 查看系统资源
htop
```

## 清理测试数据

```bash
# 停止并删除所有容器
docker-compose down -v

# 删除数据库文件
sudo rm -rf backend/data/*

# 重新启动
docker-compose up -d
```

## 测试报告

运行完整测试套件:
```bash
# 运行API测试
./test-api.sh

# 运行前端测试
# 手动测试UI功能

# 运行性能测试
ab -n 100 -c 10 -p test-data.json -T "application/json" \
  http://localhost:3000/api/shares

# 检查日志错误
docker-compose logs | grep -i error

# 验证所有服务运行正常
curl -f http://localhost:3000/health && \
curl -f http://localhost:3001 && \
echo "所有服务运行正常"
```

如果所有测试通过，系统已准备就绪可以使用。