下面为你生成 **专业级 GitHub 使用说明书（README.md）**，完全按照 GitHub 项目最佳实践撰写，包含：

* 功能说明
* 安装部署
* 使用方式
* 示例截图（可替换）
* API 文档
* Token 权限说明
* 访客访问方式
* 高级功能

你可以直接复制整份 README.md 到 GitHub 仓库根目录即可。

---

# 📄 **README.md（完整成品，可直接发布到 GitHub）**

````markdown
# 🌐 Cloudflare Worker 云笔记系统（Cloud Notebook System）

基于 **Cloudflare Workers + KV** 构建的 **在线云笔记 / Markdown 文档系统**。  
支持多文件、多目录、Markdown 渲染、权限控制、Token 分享、Base64 输出、订阅配置等功能。

特点：  
**零后端 / 无服务器 / 无限扩展 / 高速 CDN / 隐私安全 / 支持多管理员。**

---

## ✨ 功能特性

### 🗂️ 文件系统（树状结构）
- 无限层级目录（Folder）
- 文件管理（创建 / 删除 / 重命名 / 移动）
- 文件树实时刷新
- 搜索文件 / 目录

### 📝 编辑器（专业级）
- Markdown 实时渲染（GitHub 风格）
- JSON 自动高亮 + 格式化
- YAML 高亮
- TXT 文本显示
- 双栏模式（编辑 / 预览 / 分栏）
- 自动保存（防抖 1.5 秒）
- 编辑器支持快捷键

### 🔐 权限系统（核心）
- Token-based 权限控制  
- **read / edit / admin** 三级权限  
- 每个文件独立的 Token（自动生成）  
- 多管理员支持  
- 访客无权限无法访问任何文件  

### 📤 多格式输出
| 路径 | 输出类型 | 用途 |
|------|----------|------|
| `/txt?file=&token=` | text/plain | 订阅、配置文件 |
| `/md?file=&token=` | Markdown 渲染页面 | 文档展示 |
| `/raw?file=&token=` | 文件下载 | 直接下载原始内容 |
| `/sub?file=&token=` | 自动判断类型 | 默认分享链接 |
| `/b64?file=&token=` | Base64 | 节点订阅、V2/TUIC/VMess |

### 🎨 管理后台（Obsidian/VSCode 风格）
- 左侧目录树
- 点击即加载文件
- 右键菜单（新建 / 删除 / 重命名 / 移动）
- 文件 Token 显示 + 一键复制
- 自动识别文件类型（md/json/yaml/txt）
- 文件夹展开/折叠动画

---

# 🚀 快速开始

## 1. 克隆项目
```bash
git clone https://github.com/yourname/cloudflare-notebook.git
cd cloudflare-notebook
````

## 2. 创建 Cloudflare Worker

登录 Cloudflare → Workers & Pages → Create Worker → Bind KV。

## 3. 创建 KV Namespace

名称随意，例如：

```
NOTE_KV
```

## 4. Worker → Settings → Variables → KV Bindings

添加：

```
KV = NOTE_KV
```

## 5. 添加环境变量（管理员 UUID）

例如：

```
ADMIN_UUID = admin-uuid-1
ADMIN_UUID = admin-uuid-2
```

可以使用任意字符串作为管理员入口路径。

## 6. 部署 Worker

将项目中所有 JS 模块合并成你的 Worker 脚本后，点击 **Deploy**。

---

# 🔑 管理后台入口

访问：

```
https://<your-worker-domain>/<adminUUID>
```

例如：

```
https://note.example.workers.dev/admin-uuid-1
```

如果你设置多个管理员，每个路径都可以进入管理后台。

---

# 🗂️ 文件管理操作

左侧树状结构支持：

| 操作      | 方法         |
| ------- | ---------- |
| 新建文件    | 右键 → 新建文件  |
| 新建文件夹   | 右键 → 新建文件夹 |
| 删除      | 右键 → 删除    |
| 重命名     | 右键 → 重命名   |
| 移动      | 右键 → 移动到…  |
| 搜索      | 顶部搜索框      |
| 展开/折叠目录 | 点击文件夹即可    |

---

# ✍️ 编辑器说明

支持自动识别格式：

| 扩展名            | 渲染方式                |
| -------------- | ------------------- |
| `.md`          | Markdown（GitHub 样式） |
| `.json`        | 自动格式化 + JSON 高亮     |
| `.yaml / .yml` | YAML 高亮             |
| `.txt`         | 纯文本                 |

右侧面板支持：

* Markdown 实时预览
* JSON 自动格式化按钮
* 双栏视图切换
* 自动保存（1.5s 防抖）

---

# 🔐 权限系统说明（Token-Based）

每个文件自动生成两个 Token：

| Token | 权限  | 适用功能        |
| ----- | --- | ----------- |
| read  | 只读  | 查看、渲染、订阅    |
| edit  | 可编辑 | 编辑、保存、删除、移动 |
| admin | 超管  | 无限制权限       |

在管理界面右下角会显示：

```
READ: xxxxxxx
EDIT: yyyyyyy
```

点击“复制”按钮即可一键复制。

---

# 🌍 访客访问（文件公开分享）

## ① 纯文本模式

```
https://your.worker/txt?file=/docs/readme.md&token=READ_TOKEN
```

## ② Markdown 渲染（网页显示）

```
https://your.worker/md?file=/docs/readme.md&token=READ_TOKEN
```

## ③ 下载文件原文

```
https://your.worker/raw?file=/config.yaml&token=READ_TOKEN
```

## ④ Base64 输出（订阅场景）

```
https://your.worker/b64?file=/nodes.txt&token=READ_TOKEN
```

## ⑤ 智能模式（推荐分享链接）

```
https://your.worker/sub?file=/notes/test.md&token=READ_TOKEN
```

系统会自动根据文件类型输出：

* `.md` → HTML 渲染
* `.json/.yaml/.txt` → 纯文本

---

# 🔧 API 文档（Worker 后端）

所有 API 入口为：

```
/api/*
```

| 路径               | 说明         |
| ---------------- | ---------- |
| `/api/tree`      | 获取文件树      |
| `/api/content`   | 获取文件内容     |
| `/api/write`     | 保存内容       |
| `/api/create`    | 新建文件       |
| `/api/mkdir`     | 新建文件夹      |
| `/api/delete`    | 删除节点       |
| `/api/rename`    | 重命名        |
| `/api/move`      | 移动         |
| `/api/search`    | 搜索         |
| `/api/token`     | 重生成 token  |
| `/api/token_all` | 获取所有 token |

所有 API 需要权限（read/edit/admin）。

---

# 📸 截图示例（可替换）

你可以自行添加：

```
/screenshot/main.png
/screenshot/editor.png
/screenshot/sub.png
```

并在 README 中添加：

```markdown
![管理界面](screenshot/main.png)
![编辑器](screenshot/editor.png)
```

---

# 🧱 项目结构（推荐）

```
cloudflare-notebook/
 ├── worker.js          # 完整 Worker 主文件 (模块1~8)
 ├── README.md
 ├── screenshot/
 │    ├── main.png
 │    ├── editor.png
 │    └── sub.png
 └── LICENSE (可选)
```

---

# 📌 许可证

推荐使用 MIT：

```
MIT License
```

---

# 💬 支持增强功能（可继续定制）

我可以为你继续增强：

* [ ] 暗色模式（Dark Theme）
* [ ] Monaco Editor（VSCode 编辑器）
* [ ] 文件拖拽排序/拖拽移动
* [ ] 多标签页（像 Obsidian）
* [ ] 文件版本历史（自动 diff）
* [ ] WebDAV 同步
* [ ] 数据备份到 R2

---

📢 如果你希望我再自动生成：

* `LICENSE`
* `CONTRIBUTING.md`
* `CHANGELOG.md`
* GitHub 仓库推荐设置

直接告诉我即可。

---

如需增强、性能优化或自动构建脚本，也可以继续告诉我。
