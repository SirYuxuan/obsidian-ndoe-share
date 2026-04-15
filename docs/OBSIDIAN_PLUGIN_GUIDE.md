# Obsidian Share Plugin 使用指南

## 安装方法

### 方法一：从市场安装（推荐）
1. 打开 Obsidian 设置
2. 进入 "Community plugins"（社区插件）
3. 搜索 "Share Plugin"
4. 点击安装并启用

### 方法二：手动安装
1. 从Releases下载最新版本的插件文件
2. 解压到您的Obsidian库的 `.obsidian/plugins/obsidian-share-plugin` 文件夹
3. 重启Obsidian并启用插件

## 配置插件

1. 打开 Obsidian 设置
2. 在左侧边栏找到 "Share Plugin"
3. 配置以下选项：
   - **API URL**: 后端API地址 (默认: http://localhost:3000/api)
   - **Default Password**: 默认分享密码（可选）
   - **Auto-copy to clipboard**: 自动复制分享链接到剪贴板
   - **Show notifications**: 显示分享成功通知

## 使用方法

### 基本分享
1. 打开任何Markdown笔记
2. 点击编辑器右上角的悬浮分享按钮（上传图标）
3. 选择是否设置密码和过期时间
4. 点击 "Share" 按钮
5. 分享链接将自动复制到剪贴板

### 快捷方式
- **快捷键**: `Cmd/Ctrl + Shift + S`
- **右键菜单**: 在文件列表中右键点击文件，选择 "Share Note"

### 分享选项
- **密码保护**: 设置密码保护分享内容
- **过期时间**: 设置分享链接的有效期
- **默认密码**: 可以在设置中配置默认密码

## 功能特点

### 悬浮按钮
- 在编辑器右上角显示悬浮分享按钮
- 鼠标悬停时有缩放效果
- 点击即可快速分享当前笔记

### 分享模态框
- 密码输入框（可选）
- 过期时间选择（1天、7天、30天、90天、永久）
- 自动复制选项
- 保存为默认密码选项

### 分享链接
- 格式: `http://your-domain.com/share/{share-id}`
- 支持密码保护访问
- 过期后自动失效
- 可查看访问统计

## 故障排除

### 常见问题

1. **分享按钮不显示**
   - 确保插件已启用
   - 重启Obsidian
   - 检查是否在Markdown编辑模式

2. **无法连接到API**
   - 检查API URL配置
   - 确保后端服务正在运行
   - 检查网络连接

3. **分享失败**
   - 检查后端服务状态
   - 验证API URL是否正确
   - 查看Obsidian开发者控制台（Ctrl+Shift+I）

4. **密码保护无效**
   - 确保密码正确
   - 检查后端密码验证逻辑

### 调试方法

1. 打开 Obsidian 开发者工具 (`Ctrl+Shift+I`)
2. 切换到 Console 标签页
3. 查看错误信息
4. 检查网络请求状态

## 隐私和安全

### 数据存储
- 分享内容存储在自托管的服务器上
- 密码使用bcrypt加密存储
- 访问日志记录IP地址和User-Agent

### 安全建议
1. 使用强密码保护分享
2. 定期清理过期分享
3. 在生产环境中启用HTTPS
4. 限制API访问频率

## 更新插件

### 自动更新
1. 插件支持通过Obsidian社区插件市场自动更新
2. 更新后重启Obsidian生效

### 手动更新
1. 下载最新版本插件
2. 替换 `.obsidian/plugins/obsidian-share-plugin` 文件夹
3. 重启Obsidian

## 支持

如果您遇到问题或有建议：
1. 查看 [GitHub Issues](https://github.com/your-repo/issues)
2. 提交新的Issue
3. 查看详细日志并提供错误信息

## 许可证

MIT License - 详见LICENSE文件