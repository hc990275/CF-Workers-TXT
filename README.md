# 📝 Cloudflare Workers 在线文件编辑器

基于 **Cloudflare Workers + GitHub API**  的在线文件编辑器，支持权限管理、文件分享、订阅链接生成等功能。


![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)
![GitHub](https://img.shields.io/badge/GitHub-API-181717?logo=github)
![License](https://img.shields.io/badge/License-MIT-green)

[点我打开示例网址访客密码      110](https://txt.abcai.online/)



## ✨ 功能特性

### 核心功能
- 📄 **在线编辑** - 在浏览器中编辑 GitHub 仓库文件
- 👥 **权限管理** - 支持管理员、编辑者、只读、游客四种角色
- 📁 **文件管理** - 创建、编辑、删除文件和目录
- 🔍 **文件搜索** - 快速搜索定位文件
- 📝 **Markdown 预览** - 实时预览 Markdown 文件效果
- 💾 **自动保存** - Ctrl/Cmd + S 快捷键保存

### 高级功能
- 📤 **文件分享** - 生成公开访问链接
- 🔐 **Base64 加密** - 支持订阅链接加密显示
- 🔗 **友情链接** - 在侧边栏显示友情链接
- 🎨 **代码高亮** - 支持多种编程语言语法高亮
- 📱 **响应式设计** - 完美适配移动端

### 适用场景
- ✅ Clash/V2Ray 订阅链接管理
- ✅ TVBox 配置订阅分享
- ✅ 文档在线协作编辑
- ✅ 代码片段管理
- ✅ 配置文件托管

---

## 🚀 快速部署

### 1. 准备工作

#### 1.1 创建 GitHub 仓库
1. 登录 [GitHub](https://github.com)
2. 创建新仓库（如：`CF-Workers-TXT`）
3. 设置为 Public 或 Private
4. 记下仓库名和用户名

#### 1.2 生成 GitHub Token
1. 访问 [GitHub Tokens](https://github.com/settings/tokens)
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 设置 Token 名称（如：`cf-worker-editor`）
4. 勾选权限：
   - ✅ `repo`（完整仓库权限）
5. 点击 **Generate token**
6. ⚠️ 复制并保存生成的 Token（只显示一次）

#### 1.3 生成访问 Token（UUID）
访问 [UUID Generator](https://www.uuidgenerator.net/) 生成 3 个 UUID：
- 管理员 Token（admin）
- 编辑者 Token（editor）
- 只读 Token（read）

### 2. 部署到 Cloudflare

#### 2.1 创建 Worker
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择 **Workers & Pages**
3. 点击 **Create** → **Create Worker**
4. 输入 Worker 名称（如：`my-editor`）
5. 点击 **Deploy**

#### 2.2 上传代码
1. 点击 **Edit code**
2. 删除默认代码
3. 复制 `worker.js` 的全部内容粘贴进去
4. 修改配置（第 6-8 行）：
```javascript
const GITHUB_OWNER = "你的GitHub用户名";  // 如：hc990275
const GITHUB_REPO  = "你的仓库名";         // 如：CF-Workers-TXT
const BRANCH       = "main";               // 分支名
```
5. 点击 **Save and Deploy**

#### 2.3 配置环境变量
1. 返回 Worker 页面
2. 点击 **Settings** → **Variables**
3. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxx` | GitHub Personal Access Token |
| `TOKEN_ADMIN` | `uuid-admin` | 管理员访问 Token |
| `TOKEN_EDITOR` | `uuid-editor` | 编辑者访问 Token |
| `TOKEN_READ` | `uuid-read` | 只读访问 Token |
| `FRIEND_LINKS` | `[{"name":"示例","url":"https://example.com"}]` | 友情链接（可选）|

4. 点击 **Save and Deploy**

### 3. 访问应用

访问你的 Worker URL：
```
https://你的worker名.你的账户名.workers.dev
```

例如：`https://my-editor.myaccount.workers.dev`

---

## 📖 使用教程

### 登录系统

#### 方式一：Token 登录
1. 打开网站，自动显示登录弹窗
2. 输入您的访问 Token（admin/editor/read）
3. 点击 **🔑 验证登录**
4. 登录成功后显示对应权限标识

#### 方式二：游客浏览
1. 点击 **👁️ 游客浏览**
2. 可以查看文件列表和内容
3. 无法编辑、保存、创建文件

### 权限说明

| 角色 | 标识 | 权限 |
|------|------|------|
| 👑 管理员 | `admin` | 所有权限（查看、编辑、创建、删除、分享）|
| ✏️ 编辑者 | `write` | 查看、编辑、创建、删除、分享 |
| 👁️ 只读 | `read` | 仅查看文件内容 |
| 🚶 游客 | - | 仅浏览文件列表和内容 |

### 基本操作

#### 📂 浏览文件
- 左侧显示文件树，按目录分组
- 点击文件名即可打开编辑
- 使用顶部搜索框快速查找

#### ✏️ 编辑文件
1. 点击文件打开编辑器
2. 在右侧编辑区修改内容
3. Markdown 文件自动显示预览
4. 按 `Ctrl + S`（Mac: `Cmd + S`）或点击 **💾 保存** 按钮

#### ➕ 新建文件
1. 点击左下角 **➕ 新建文件/目录**
2. 选择 **📄 文件** 类型
3. 在下拉框中选择目标目录
4. 输入文件名（如：`config.yaml`）
5. 点击 **✅ 创建**

**示例**：
- 目录选择：`subscriptions`
- 文件名：`clash.yaml`
- 生成路径：`subscriptions/clash.yaml`

#### 📁 新建目录
1. 点击 **➕ 新建文件/目录**
2. 选择 **📁 目录** 类型
3. 输入完整目录路径（如：`config/proxy`）
4. 点击 **✅ 创建**

> 💡 提示：目录通过创建 `.gitkeep` 文件实现，不影响使用

#### 🗑️ 删除文件
1. 打开要删除的文件
2. 点击顶部 **🗑️ 删除** 按钮
3. 确认删除操作

> ⚠️ 需要 `write` 或 `admin` 权限

---

## 📤 分享功能详解

### 生成分享链接

#### 普通分享
1. 打开要分享的文件
2. 点击顶部 **📤 分享** 按钮
3. 弹窗显示分享链接
4. 点击 **📋 复制** 按钮

**链接格式**：
```
https://your-worker.workers.dev/share/文件路径
```

**示例**：
```
https://my-editor.myaccount.workers.dev/share/config/clash.yaml
```

访问该链接将直接显示文件原始内容（纯文本）。

#### Base64 加密分享
1. 打开分享弹窗
2. 勾选 **✅ Base64 加密显示**
3. 链接自动更新为加密版本
4. 预览区域显示加密后的内容（前 200 字符）
5. 点击 **📋 复制** 按钮

**链接格式**：
```
https://your-worker.workers.dev/share/文件路径?encode=base64
```

**示例**：
```
https://my-editor.myaccount.workers.dev/share/proxy/v2ray.txt?encode=base64
```

访问该链接将显示 Base64 编码后的内容。

### 应用场景

#### 1️⃣ Clash 订阅链接
```yaml
# 文件：subscriptions/clash.yaml
# 创建 Clash 配置文件
# 分享链接（普通）：
https://your-worker.workers.dev/share/subscriptions/clash.yaml
```

#### 2️⃣ V2Ray 订阅（Base64）
```
# 文件：subscriptions/v2ray.txt
# 内容：vmess://... 节点列表
# 分享链接（加密）：
https://your-worker.workers.dev/share/subscriptions/v2ray.txt?encode=base64
```

#### 3️⃣ TVBox 配置订阅
```json
// 文件：tvbox/config.json
{
  "spider": "...",
  "sites": [...]
}

// 分享链接：
https://your-worker.workers.dev/share/tvbox/config.json
```

#### 4️⃣ 其他文本内容
- API 配置
- JSON 数据
- 文档分享
- 代码片段

---

## 🔗 友情链接配置

### 配置方法

在 Cloudflare Workers 环境变量中添加 `FRIEND_LINKS`：

```json
[
  {
    "name": "Google",
    "url": "https://www.google.com"
  },
  {
    "name": "GitHub",
    "url": "https://github.com"
  },
  {
    "name": "我的博客",
    "url": "https://myblog.com"
  }
]
```

### 显示效果

配置后，友情链接会显示在左侧边栏底部：

```
🔗 友情链接
  Google
  GitHub
  我的博客
```

点击链接会在新标签页打开。

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + S` | 保存当前文件 |
| `Enter`（登录框） | 提交登录 |

---

## 🔧 高级配置

### 自定义 Token（代码内配置）

编辑 `worker.js` 第 11-15 行：

```javascript
const TOKENS = {
  "your-read-uuid-here": "read",
  "your-editor-uuid-here": "write",
  "your-admin-uuid-here": "admin"
};
```

> 💡 建议使用环境变量配置，更安全！

### 修改仓库信息

编辑 `worker.js` 第 6-8 行：

```javascript
const GITHUB_OWNER = "你的用户名";
const GITHUB_REPO  = "你的仓库名";
const BRANCH       = "main";
```

### 自定义域名

1. 在 Cloudflare Workers 设置中
2. 点击 **Triggers** → **Custom Domains**
3. 添加你的域名（需要域名托管在 Cloudflare）
4. 访问 `https://your-domain.com`

---

## ❓ 常见问题

### Q1: Token 验证失败？
**A**: 检查以下几点：
1. Token 是否正确复制（无多余空格）
2. 环境变量是否正确配置
3. Worker 是否已重新部署

### Q2: 文件保存失败？
**A**: 可能原因：
1. 使用了只读权限的 Token
2. GitHub Token 权限不足（需要 `repo` 权限）
3. 文件被其他人修改（刷新页面重试）

### Q3: 新建文件后无法打开？
**A**: 已修复！确保使用最新版本代码。

### Q4: 分享链接无法访问？
**A**: 检查：
1. Worker 是否正常运行
2. 文件路径是否正确（区分大小写）
3. GitHub 仓库是否为 Public（Private 需要 Token）

### Q5: 退出后无法重新登录？
**A**: 已修复！退出后会自动显示登录弹窗。

### Q6: 友情链接不显示？
**A**: 检查：
1. 环境变量 `FRIEND_LINKS` 是否配置
2. JSON 格式是否正确
3. Worker 是否重新部署

### Q7: Markdown 预览不正常？
**A**: 确保 CDN 资源加载正常：
- marked.js
- highlight.js

---

## 🛡️ 安全建议

### 1. Token 管理
- ✅ 使用环境变量存储 Token
- ✅ 定期更换访问 Token
- ✅ 不要将 Token 提交到代码仓库
- ✅ 为不同用户分配不同权限

### 2. GitHub Token
- ✅ 只授予必要的权限（`repo`）
- ✅ 定期检查 Token 使用情况
- ✅ 泄露后立即删除重新生成

### 3. 仓库安全
- ✅ 敏感信息不要存储在公开仓库
- ✅ 定期备份重要文件
- ✅ 使用 `.gitignore` 排除敏感文件

---

## 📊 技术栈

- **前端**: HTML5 + Tailwind CSS + Vanilla JavaScript
- **后端**: Cloudflare Workers
- **存储**: GitHub Repository
- **API**: GitHub REST API v3
- **编辑器**: Native Textarea
- **Markdown**: marked.js + highlight.js

---

## 📝 更新日志

### v2.0 (2024-01-XX)
- ✅ 新增文件分享功能
- ✅ 支持 Base64 加密分享
- ✅ 新建文件时可选择目录
- ✅ 新增删除文件功能
- ✅ 修复退出登录问题
- ✅ 新增友情链接功能
- ✅ 优化用户体验

### v1.0 (2024-01-XX)
- ✅ 基础文件编辑功能
- ✅ 权限管理系统
- ✅ Markdown 预览
- ✅ 文件搜索

---

## 📄 开源协议

MIT License

---

## 🤝 支持与反馈

如有问题或建议，欢迎：
- 提交 Issue
- 发起 Pull Request
- 联系开发者

---

## 🎯 路线图

- [ ] 支持图片上传
- [ ] 多文件批量操作
- [ ] 版本历史对比
- [ ] 文件夹拖拽上传
- [ ] 更多主题选择
- [ ] 协作编辑功能

---

**Made with ❤️ by Cloudflare Workers**