# 📝 Cloudflare Workers 在线编辑器

基于 **Cloudflare Workers + GitHub API** 的在线文件编辑器，支持在线浏览、编辑、保存 GitHub 仓库中的文件。

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)
![GitHub](https://img.shields.io/badge/GitHub-API-181717?logo=github)
![License](https://img.shields.io/badge/License-MIT-green)


打开 [实例网址，访客密码      110](https://txt.abcai.online/)


---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🔐 **Token 权限系统** | 支持管理员、编辑者、只读三种权限等级 |
| 📁 **文件树浏览** | 自动扫描 GitHub 仓库，树形目录展示 |
| 🔍 **文件搜索** | 实时过滤文件列表 |
| ✏️ **在线编辑** | 支持多种文本文件格式编辑 |
| 👁️ **Markdown 预览** | 实时渲染 Markdown，支持代码高亮 |
| 💾 **一键保存** | 直接提交到 GitHub 仓库 |
| ⌨️ **快捷键** | Ctrl+S 快速保存 |
| 📱 **响应式设计** | 支持桌面和移动设备 |

---

## 🚀 快速部署

### 第一步：Fork 或创建仓库

将本项目 Fork 到你的 GitHub 账户，或创建新仓库。

### 第二步：获取 GitHub Token

1. 打开 [GitHub Token 设置页](https://github.com/settings/tokens)
2. 点击 **Generate new token (classic)**
3. 配置 Token：
   - **Note**: `Cloudflare Worker Editor`
   - **Expiration**: 选择有效期（建议 90 天或 No expiration）
   - **权限**: 勾选 ✅ `repo`（完整仓库访问权限）
4. 点击 **Generate token**
5. **立即复制** Token（刷新后不再显示！）

### 第三步：部署 Cloudflare Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Create** → **Create Worker**
3. 给 Worker 命名（如 `my-editor`）
4. 点击 **Edit code**
5. 删除默认代码，粘贴 `worker.js` 的全部内容
6. **重要**：修改代码顶部的配置：

```javascript
const GITHUB_OWNER = "你的GitHub用户名";
const GITHUB_REPO  = "你的仓库名";
const BRANCH       = "main";
```

7. 点击右上角 **Deploy**

### 第四步：配置环境变量

进入 Worker 的 **Settings** → **Variables and Secrets** → **Add**

#### 必需变量

| 变量名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `GITHUB_TOKEN` | Secret | GitHub 个人访问令牌 | `ghp_aBcDeFgHiJkLmNoPqRsT...` |
| `TOKEN_ADMIN` | Secret | 管理员登录密钥 | `admin-550e8400-e29b-41d4` |
| `TOKEN_EDITOR` | Secret | 编辑者登录密钥 | `editor-6ba7b810-9dad-11d1` |
| `TOKEN_READ` | Secret | 只读用户登录密钥 | `read-6ba7b814-9dad-11d1` |

> 💡 **提示**：Token 可以是任意字符串，建议使用 UUID。可在 [UUID Generator](https://www.uuidgenerator.net/) 生成。

#### 添加变量步骤

```
Settings → Variables and Secrets → Add

┌─────────────────────────────────────────┐
│  Type:     ● Secret (推荐加密存储)       │
│  Name:     [ GITHUB_TOKEN         ]     │
│  Value:    [ ghp_xxxxxxxxxx       ]     │
│                          [ Save ]       │
└─────────────────────────────────────────┘
```

### 第五步：访问使用

访问你的 Worker URL：

```
https://my-editor.你的账户.workers.dev
```

---

## 🔑 权限说明

| 权限等级 | Token 变量 | 可执行操作 |
|----------|------------|------------|
| 👑 管理员 | `TOKEN_ADMIN` | 查看、编辑、保存所有文件 |
| ✏️ 编辑者 | `TOKEN_EDITOR` | 查看、编辑、保存所有文件 |
| 👁️ 只读 | `TOKEN_READ` | 仅查看文件内容 |
| 🚶 游客 | 无需 Token | 仅查看文件列表 |

---

## 📖 使用指南

### 登录认证

1. 打开编辑器页面，显示登录弹窗
2. 输入你配置的 Token（如 `admin-550e8400-e29b-41d4`）
3. 点击 **验证登录**
4. 或点击 **游客浏览** 以只读模式访问

### 编辑文件

1. 从左侧文件树选择文件
2. 在编辑器中修改内容
3. Markdown 文件会在右侧实时预览
4. 点击 **保存** 或按 `Ctrl+S` 保存到 GitHub

### 搜索文件

在左侧搜索框输入关键词，实时过滤文件列表。

---

## 🔌 API 接口

Worker 提供以下 API 接口：

| 接口 | 方法 | 说明 | 权限要求 |
|------|------|------|----------|
| `/` | GET | 返回编辑器页面 | 无 |
| `/api/verify` | GET | 验证 Token 权限 | 无 |
| `/api/tree` | GET | 获取仓库文件列表 | 无 |
| `/api/file?path=xxx` | GET | 获取文件内容 | 无 |
| `/api/save` | POST | 保存文件 | write/admin |
| `/api/meta?path=xxx` | GET | 获取文件元信息 | 无 |

### API 示例

#### 获取文件树

```bash
curl https://your-worker.workers.dev/api/tree
```

#### 获取文件内容

```bash
curl https://your-worker.workers.dev/api/file?path=README.md
```

#### 保存文件

```bash
curl -X POST https://your-worker.workers.dev/api/save \
  -H "Content-Type: application/json" \
  -H "X-Token: your-editor-token" \
  -d '{"path":"test.txt","content":"Hello World","sha":"原文件SHA"}'
```

---

## 📁 支持的文件类型

### 可编辑文件

| 类型 | 扩展名 |
|------|--------|
| Markdown | `.md` |
| 文本文件 | `.txt` |
| JSON | `.json` |
| JavaScript | `.js` |
| HTML | `.html` |
| CSS | `.css` |
| YAML | `.yml`, `.yaml` |
| Python | `.py` |
| Go | `.go` |
| Rust | `.rs` |
| TypeScript | `.ts` |
| Shell | `.sh` |
| 配置文件 | `.env`, `.gitignore` |

### Markdown 预览功能

- ✅ 标题（H1-H6）
- ✅ 粗体、斜体、删除线
- ✅ 有序/无序列表
- ✅ 代码块（支持语法高亮）
- ✅ 引用块
- ✅ 表格
- ✅ 链接和图片
- ✅ 分割线

---

## ❓ 常见问题

### Q: 保存时提示 "No write permission"

**A**: 检查以下几点：
1. 确认使用的是 `TOKEN_ADMIN` 或 `TOKEN_EDITOR` 的值登录
2. 检查 Cloudflare 环境变量是否正确配置
3. 确认 Token 值完全匹配（注意空格）

### Q: 文件列表加载失败

**A**: 检查以下几点：
1. `GITHUB_TOKEN` 是否正确配置
2. GitHub Token 是否有 `repo` 权限
3. Token 是否已过期
4. 仓库名和用户名是否正确

### Q: 保存后提示 SHA 冲突

**A**: 文件在其他地方被修改过。点击 **刷新列表**，重新打开文件后再编辑保存。

### Q: 如何添加更多用户？

**A**: 在 Cloudflare 环境变量中添加更多 Token：
- `TOKEN_EDITOR_2`: 第二个编辑者
- `TOKEN_READ_2`: 第二个只读用户

然后在 `worker.js` 的 `checkAuth` 函数中添加对应检查。

---

## 🔧 自定义配置

### 修改仓库配置

编辑 `worker.js` 顶部：

```javascript
const GITHUB_OWNER = "你的用户名";
const GITHUB_REPO  = "你的仓库名";
const BRANCH       = "main";  // 或 master
```

### 添加更多 Token（代码方式）

在 `worker.js` 中修改 `TOKENS` 对象：

```javascript
const TOKENS = {
  "custom-token-1": "read",
  "custom-token-2": "write",
  "custom-token-3": "admin"
};
```

---

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| [Cloudflare Workers](https://workers.cloudflare.com/) | 无服务器后端 |
| [GitHub API](https://docs.github.com/en/rest) | 文件存储和版本控制 |
| [Tailwind CSS](https://tailwindcss.com/) | UI 样式框架 |
| [marked.js](https://marked.js.org/) | Markdown 解析 |
| [highlight.js](https://highlightjs.org/) | 代码语法高亮 |

---

## 📄 许可证

MIT License - 自由使用、修改和分发。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📮 联系方式

如有问题，请在 [GitHub Issues](../../issues) 中反馈。
