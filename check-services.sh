#!/bin/bash

echo "=== Obsidian Share System 配置脚本 ==="
echo ""

# 检查服务状态
echo "🔍 检查服务状态..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "failed")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "failed")

echo "后端API服务 (端口3000): $([ "$BACKEND_STATUS" = "200" ] && echo "✅ 运行正常" || echo "❌ 未运行")"
echo "后台管理面板 (端口3001): $([ "$FRONTEND_STATUS" = "200" ] && echo "✅ 运行正常" || echo "❌ 未运行")"
echo ""

# 检查Obsidian插件
OBSIDIAN_PLUGIN_DIR="/Users/yuxuan/Library/Mobile Documents/iCloud~md~obsidian/Documents/雨轩知识库/.obsidian/plugins/obsidian-share-plugin"
echo "🔍 检查Obsidian插件..."
if [ -d "$OBSIDIAN_PLUGIN_DIR" ]; then
    if [ -f "$OBSIDIAN_PLUGIN_DIR/main.js" ] && [ -f "$OBSIDIAN_PLUGIN_DIR/manifest.json" ]; then
        echo "✅ Obsidian插件已安装"
        echo "   插件目录: $OBSIDIAN_PLUGIN_DIR"
        echo "   main.js: $(ls -lh "$OBSIDIAN_PLUGIN_DIR/main.js" | awk '{print $5}')"
        echo "   manifest.json: $(cat "$OBSIDIAN_PLUGIN_DIR/manifest.json" | grep '"version"' | sed 's/.*"\(.*\)".*/\1/')"
    else
        echo "⚠️  插件目录存在但文件不全"
    fi
else
    echo "❌ Obsidian插件未安装"
fi

echo ""
echo "=== 服务访问地址 ==="
echo ""
echo "🌐 后端API服务: http://localhost:3000"
echo "   - 健康检查: http://localhost:3000/health"
echo "   - API端点: http://localhost:3000/api"
echo ""
echo "📊 后台管理面板: http://localhost:3001"
echo "   - 默认管理员: admin / admin123"
echo ""
echo "🔗 分享链接格式: http://localhost:3000/share/{share-id}"
echo ""

# 测试API
echo "=== API测试 ==="
echo ""
echo "测试创建分享:"
SHARE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -d '{"content":"这是一个测试分享","expireDays":7}')

if [ $? -eq 0 ] && echo "$SHARE_RESPONSE" | grep -q "success"; then
    echo "✅ 创建分享成功"
    SHARE_ID=$(echo "$SHARE_RESPONSE" | grep -o '"shareId":"[^"]*"' | cut -d'"' -f4)
    SHARE_URL=$(echo "$SHARE_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    echo "   分享ID: $SHARE_ID"
    echo "   分享链接: $SHARE_URL"
else
    echo "❌ 创建分享失败"
    echo "   响应: $SHARE_RESPONSE"
fi

echo ""
echo "=== Obsidian插件配置步骤 ==="
echo ""
echo "1. 打开Obsidian应用"
echo "2. 进入设置 → 第三方插件"
echo "3. 关闭安全模式（如果未关闭）"
echo "4. 点击'浏览社区插件'，但不需要搜索"
echo "5. 返回，点击'已安装插件'"
echo "6. 找到'Share Plugin'并启用"
echo "7. 进入插件设置，配置以下内容:"
echo "   - API URL: http://localhost:3000/api"
echo "   - 默认密码: (可选)"
echo "   - 自动复制: 启用"
echo "   - 显示通知: 启用"
echo ""
echo "=== 使用方法 ==="
echo ""
echo "1. 在Obsidian中打开任何笔记"
echo "2. 点击右上角的悬浮分享按钮（上传图标）"
echo "3. 设置密码和过期时间（可选）"
echo "4. 点击'Share'按钮"
echo "5. 分享链接将自动复制到剪贴板"
echo ""
echo "=== 安全注意事项 ==="
echo ""
echo "⚠️ 重要: 请在生产环境修改以下配置:"
echo "1. 修改 backend/.env 文件中的:"
echo "   - SESSION_SECRET (改为随机字符串)"
echo "   - JWT_SECRET (改为随机字符串)"
echo "   - ADMIN_PASSWORD (改为强密码)"
echo "2. 使用HTTPS而不是HTTP"
echo "3. 配置防火墙规则"
echo ""
echo "=== 故障排除 ==="
echo ""
echo "如果服务无法访问:"
echo "1. 检查端口是否被占用:"
echo "   lsof -i :3000"
echo "   lsof -i :3001"
echo "2. 重启服务:"
echo "   cd backend && node src/index.js"
echo "   cd admin-panel/build && python3 -m http.server 3001"
echo "3. 查看日志:"
echo "   tail -f /private/tmp/claude-501/.../tasks/*.output"
echo ""
echo "=== 系统信息 ==="
echo ""
echo "后端服务PID: $(pgrep -f "node src/index.js" 2>/dev/null || echo "未运行")"
echo "前端服务PID: $(pgrep -f "python.*3001" 2>/dev/null || echo "未运行")"
echo "插件安装时间: $(stat -f "%Sm" "$OBSIDIAN_PLUGIN_DIR/main.js" 2>/dev/null || echo "未知")"