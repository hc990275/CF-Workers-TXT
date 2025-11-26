// ========== Cloudflare Worker 完整代码 (完整版 v2) ==========
// 包含：分享、删除、新建、友情链接等全部功能

// ========== 配置区域 ==========
const GITHUB_OWNER = "hc990275";        // 你的 GitHub 用户名
const GITHUB_REPO  = "CF-Workers-TXT";  // 你的仓库名
const BRANCH       = "main";

// Token 权限表（在 Cloudflare 环境变量中配置更安全）
const TOKENS = {
  "your-read-uuid-here": "read",
  "your-editor-uuid-here": "write",
  "your-admin-uuid-here": "admin"
};

// ========== 工具函数 ==========

function getGitHubToken(env) {
  return env.GITHUB_TOKEN || env.GITHUBWEB;
}

function checkAuth(request, env) {
  const token = request.headers.get("X-Token") || "";
  if (env.TOKEN_ADMIN && token === env.TOKEN_ADMIN) return "admin";
  if (env.TOKEN_EDITOR && token === env.TOKEN_EDITOR) return "write";
  if (env.TOKEN_READ && token === env.TOKEN_READ) return "read";
  return TOKENS[token] || null;
}

function getFriendLinks(env) {
  try {
    if (env.FRIEND_LINKS) {
      return JSON.parse(env.FRIEND_LINKS);
    }
  } catch (e) {}
  return [];
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Token"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() }
  });
}

function htmlResponse(html) {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() }
  });
}

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}

async function githubAPI(env, path, method = "GET", body = null) {
  const token = getGitHubToken(env);
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "User-Agent": "Cloudflare-Worker-Editor"
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  return res.json();
}

async function getTree(env) {
  const token = getGitHubToken(env);
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${BRANCH}?recursive=1`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "User-Agent": "Cloudflare-Worker-Editor"
    }
  });
  const data = await res.json();
  if (!data.tree) return [];
  return data.tree.filter(item => item.type === "blob").map(item => item.path);
}

async function getFile(env, path) {
  const data = await githubAPI(env, path);
  if (data.message) return { error: data.message };
  
  // 修复：空文件的 content 是空字符串，不应该报错
  // 只有 undefined 或 null 才是真正没有内容
  if (data.content === undefined || data.content === null) {
    return { error: "No content" };
  }
  
  // 解码内容（空文件返回空字符串）
  let content = '';
  if (data.content && data.content.length > 0) {
    try {
      content = base64ToUtf8(data.content);
    } catch (e) {
      console.error('Base64 decode error:', e);
      content = '';
    }
  }
  
  return {
    content: content,
    sha: data.sha,
    size: data.size || 0,
    name: data.name
  };
}

async function saveFile(env, path, content, sha = null) {
  const body = {
    message: `Update ${path} via Cloudflare Worker`,
    content: utf8ToBase64(content),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  return await githubAPI(env, path, "PUT", body);
}

async function deleteFile(env, path, sha) {
  const token = getGitHubToken(env);
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "Cloudflare-Worker-Editor"
    },
    body: JSON.stringify({
      message: `Delete ${path} via Cloudflare Worker`,
      sha: sha,
      branch: BRANCH
    })
  });
  return res.json();
}

// ========== 前端页面 ==========
const FRONTEND_HTML = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cloudflare Workers 在线编辑器</title>
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; }
  #editor { font-family: 'Fira Code', 'Consolas', monospace; tab-size: 2; }
  #preview { line-height: 1.8; }
  #preview h1 { font-size: 1.8em; font-weight: bold; border-bottom: 1px solid #444; padding-bottom: 0.3em; margin: 1em 0 0.5em; }
  #preview h2 { font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em; }
  #preview h3 { font-size: 1.25em; font-weight: bold; margin: 1em 0 0.5em; }
  #preview p { margin: 0.8em 0; }
  #preview code { background: #1e293b; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  #preview pre { background: #0f172a; padding: 1em; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
  #preview pre code { background: none; padding: 0; }
  #preview ul, #preview ol { padding-left: 1.5em; margin: 0.5em 0; }
  #preview li { margin: 0.3em 0; }
  #preview blockquote { border-left: 4px solid #3b82f6; padding-left: 1em; margin: 1em 0; color: #94a3b8; }
  #preview a { color: #60a5fa; text-decoration: underline; }
  #preview table { border-collapse: collapse; margin: 1em 0; }
  #preview th, #preview td { border: 1px solid #475569; padding: 8px 12px; }
  #preview th { background: #334155; }
  .tree-item { cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.15s; }
  .tree-item:hover { background: #334155; }
  .tree-item.active { background: #3b82f6; color: white; }
  .toast { animation: slideIn 0.3s ease; }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #1e293b; }
  ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
  .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
  .modal.show { display: flex; }
</style>
</head>
<body class="bg-slate-900 text-slate-100 h-screen overflow-hidden">

<!-- 认证弹窗 -->
<div id="authModal" class="modal show">
  <div class="bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
    <div class="text-center mb-6">
      <div class="text-5xl mb-3">🔐</div>
      <h2 class="text-2xl font-bold">身份验证</h2>
      <p class="text-slate-400 mt-2">请输入访问令牌</p>
    </div>
    <input id="tokenInput" type="password" placeholder="输入 Token..." 
      class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-center text-lg">
    <div class="flex gap-3 mb-4">
      <button id="authBtn" class="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition">🔑 验证登录</button>
      <button id="guestBtn" class="flex-1 bg-slate-600 hover:bg-slate-500 py-3 rounded-xl font-semibold transition">👁️ 游客浏览</button>
    </div>
    <p id="authError" class="text-red-400 text-center hidden text-sm"></p>
  </div>
</div>

<!-- 新建弹窗 -->
<div id="createModal" class="modal">
  <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-700">
    <h3 class="text-xl font-bold mb-4">➕ 新建文件</h3>
    <div class="mb-4">
      <label class="block text-sm mb-2">选择目录</label>
      <select id="createDirSelect" class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none">
        <option value="">根目录</option>
      </select>
    </div>
    <div class="mb-4">
      <label class="block text-sm mb-2">文件名</label>
      <input id="createFileName" type="text" placeholder="例如: notes.md" 
        class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div class="flex gap-2">
      <button id="createConfirm" class="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold">✅ 创建</button>
      <button id="createCancel" class="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded-lg">❌ 取消</button>
    </div>
  </div>
</div>

<!-- 分享弹窗 -->
<div id="shareModal" class="modal">
  <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-700">
    <h3 class="text-xl font-bold mb-4">📤 分享文件</h3>
    <div class="mb-4">
      <label class="block text-sm mb-2">分享链接</label>
      <div class="flex gap-2">
        <input id="shareUrl" type="text" readonly class="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm">
        <button id="copyShareUrl" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">📋 复制</button>
      </div>
    </div>
    <div class="mb-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input id="shareBase64" type="checkbox" class="w-4 h-4">
        <span class="text-sm">Base64 加密（适合订阅链接）</span>
      </label>
    </div>
    <button id="shareClose" class="w-full bg-slate-600 hover:bg-slate-500 py-2 rounded-lg">关闭</button>
  </div>
</div>

<!-- 主应用 -->
<div id="app" class="flex h-full">
  <!-- 侧边栏 -->
  <div class="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
    <div class="p-4 border-b border-slate-700">
      <h1 class="text-lg font-bold flex items-center gap-2"><span class="text-2xl">📝</span> 在线编辑器</h1>
      <div class="mt-3 flex items-center justify-between">
        <span id="roleTag" class="text-xs px-2 py-1 rounded-full bg-slate-600">未登录</span>
        <button id="logoutBtn" class="text-xs text-slate-400 hover:text-red-400 transition hidden">退出</button>
      </div>
    </div>
    <div class="p-3">
      <input id="search" placeholder="搜索文件…" class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
    <div id="tree" class="flex-1 overflow-y-auto p-2">
      <div class="text-center text-slate-500 py-12">
        <div class="inline-block w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-3"></div>
        <div class="text-sm">加载中...</div>
      </div>
    </div>
    <div class="p-3 border-t border-slate-700 space-y-2">
      <button id="createBtn" class="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm transition hidden">➕ 新建文件</button>
      <button id="refreshBtn" class="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm transition">🔄 刷新列表</button>
    </div>
    <div id="friendLinks" class="p-3 border-t border-slate-700 hidden">
      <div class="text-xs text-slate-400 mb-2">🔗 友情链接</div>
      <div id="friendLinksList" class="space-y-1"></div>
    </div>
  </div>

  <!-- 编辑区 -->
  <div class="flex-1 flex flex-col bg-slate-900">
    <div class="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
      <div class="flex items-center gap-3">
        <span id="filepath" class="text-slate-400 font-mono text-sm">未选择文件</span>
        <span id="fileStatus" class="text-xs px-2 py-0.5 rounded-full bg-yellow-600 hidden">● 未保存</span>
      </div>
      <div class="flex items-center gap-2">
        <button id="shareBtn" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition hidden">📤 分享</button>
        <button id="deleteBtn" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition hidden">🗑️ 删除</button>
        <button id="previewToggle" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition hidden">👁️ 预览</button>
        <button id="saveBtn" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition disabled:opacity-40" disabled>💾 保存</button>
      </div>
    </div>
    <div id="panes" class="flex-1 flex overflow-hidden">
      <div id="welcome" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="text-7xl mb-6">📄</div>
          <h2 class="text-2xl font-bold mb-3">欢迎使用在线编辑器</h2>
          <p class="text-slate-400">从左侧选择文件开始编辑</p>
        </div>
      </div>
      <textarea id="editor" class="hidden flex-1 bg-slate-950 text-slate-100 p-4 resize-none focus:outline-none text-sm leading-relaxed" spellcheck="false"></textarea>
      <div id="preview" class="hidden w-1/2 bg-slate-850 p-6 overflow-y-auto border-l border-slate-700"></div>
    </div>
  </div>
</div>

<div id="toasts" class="fixed top-4 right-4 space-y-2 z-50"></div>

<script>
const $ = id => document.getElementById(id);
const state = { currentFile: null, currentSha: null, originalContent: '', userRole: null, userToken: '', fileList: [], isPreviewVisible: true };

function toast(msg, type = 'info') {
  const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600', warning: 'bg-yellow-600' };
  const div = document.createElement('div');
  div.className = 'toast ' + colors[type] + ' text-white px-4 py-3 rounded-lg shadow-lg min-w-64';
  div.textContent = msg;
  $('toasts').appendChild(div);
  setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 300); }, 3000);
}

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = { md: '📝', txt: '📄', json: '📋', js: '🟨', html: '🌐', css: '🎨', py: '🐍', yml: '⚙️', yaml: '⚙️' };
  return icons[ext] || '📄';
}

async function api(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (state.userToken) headers['X-Token'] = state.userToken;
  return fetch(endpoint, { ...options, headers });
}

async function loadTree() {
  $('tree').innerHTML = '<div class="text-center py-8"><div class="inline-block w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div></div>';
  try {
    const res = await api('/api/tree');
    state.fileList = await res.json();
    renderTree(state.fileList);
    toast('已加载 ' + state.fileList.length + ' 个文件', 'success');
  } catch (e) {
    $('tree').innerHTML = '<div class="text-center text-red-400 py-8">加载失败</div>';
  }
}

function renderTree(files, filter = '') {
  const filtered = filter ? files.filter(f => f.toLowerCase().includes(filter.toLowerCase())) : files;
  if (!filtered.length) { $('tree').innerHTML = '<div class="text-center text-slate-500 py-8">无匹配文件</div>'; return; }
  
  const groups = {};
  filtered.forEach(file => {
    const parts = file.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '根目录';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push({ path: file, name: parts[parts.length - 1] });
  });
  
  let html = '';
  Object.keys(groups).sort().forEach(folder => {
    html += '<div class="text-slate-500 text-xs px-3 py-2 mt-2">📁 ' + folder + '</div>';
    groups[folder].forEach(file => {
      html += '<div class="tree-item flex items-center gap-2" data-path="' + file.path + '">' + getFileIcon(file.name) + ' <span class="truncate">' + file.name + '</span></div>';
    });
  });
  
  $('tree').innerHTML = html;
  $('tree').querySelectorAll('.tree-item').forEach(el => el.addEventListener('click', () => loadFile(el.dataset.path)));
  
  // 更新目录选择器
  updateDirSelect();
}

function updateDirSelect() {
  const dirs = new Set(['']);
  state.fileList.forEach(file => {
    const parts = file.split('/');
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join('/'));
    }
  });
  $('createDirSelect').innerHTML = Array.from(dirs).sort().map(dir => 
    '<option value="' + dir + '">' + (dir || '根目录') + '</option>'
  ).join('');
}

async function loadFile(path) {
  $('filepath').textContent = '加载中...';
  try {
    const res = await api('/api/file?path=' + encodeURIComponent(path));
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    state.currentFile = path;
    state.currentSha = data.sha;
    state.originalContent = data.content;
    
    $('filepath').textContent = path;
    $('editor').value = data.content;
    $('welcome').classList.add('hidden');
    $('editor').classList.remove('hidden');
    $('fileStatus').classList.add('hidden');
    
    // 显示操作按钮
    if (state.userRole && state.userRole !== 'read') {
      $('shareBtn').classList.remove('hidden');
      $('deleteBtn').classList.remove('hidden');
    }
    
    if (path.endsWith('.md')) {
      $('previewToggle').classList.remove('hidden');
      $('preview').classList.remove('hidden');
      $('editor').classList.add('w-1/2');
      $('editor').classList.remove('w-full');
      updatePreview();
    } else {
      $('previewToggle').classList.add('hidden');
      $('preview').classList.add('hidden');
      $('editor').classList.remove('w-1/2');
      $('editor').classList.add('w-full');
    }
    
    document.querySelectorAll('.tree-item').forEach(el => el.classList.toggle('active', el.dataset.path === path));
    updateSaveBtn();
  } catch (e) {
    $('filepath').textContent = '加载失败';
    toast('加载失败: ' + e.message, 'error');
  }
}

async function saveFile() {
  if (!state.currentFile || !state.userRole || state.userRole === 'read') return;
  $('saveBtn').disabled = true;
  $('saveBtn').textContent = '⏳ 保存中...';
  
  try {
    const res = await api('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: state.currentFile, content: $('editor').value, sha: state.currentSha })
    });
    if (res.status === 403) throw new Error('无权限');
    const data = await res.json();
    if (data.content?.sha) {
      state.currentSha = data.content.sha;
      state.originalContent = $('editor').value;
      $('fileStatus').classList.add('hidden');
      toast('保存成功!', 'success');
    } else if (data.message) {
      throw new Error(data.message);
    }
  } catch (e) {
    toast('保存失败: ' + e.message, 'error');
  } finally {
    $('saveBtn').disabled = false;
    $('saveBtn').textContent = '💾 保存';
    updateSaveBtn();
  }
}

async function deleteFile() {
  if (!state.currentFile || !state.userRole || state.userRole === 'read') return;
  if (!confirm('确定删除 ' + state.currentFile + '？')) return;
  
  try {
    const res = await api('/api/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: state.currentFile, sha: state.currentSha })
    });
    if (res.status === 403) throw new Error('无权限');
    const data = await res.json();
    if (data.commit) {
      toast('删除成功!', 'success');
      state.currentFile = null;
      $('editor').classList.add('hidden');
      $('welcome').classList.remove('hidden');
      $('shareBtn').classList.add('hidden');
      $('deleteBtn').classList.add('hidden');
      $('filepath').textContent = '未选择文件';
      loadTree();
    } else {
      throw new Error(data.message || '删除失败');
    }
  } catch (e) {
    toast('删除失败: ' + e.message, 'error');
  }
}

async function createFile() {
  const dir = $('createDirSelect').value;
  const name = $('createFileName').value.trim();
  if (!name) { toast('请输入文件名', 'warning'); return; }
  
  const fullPath = dir ? dir + '/' + name : name;
  try {
    const res = await api('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: fullPath, content: '', sha: null })
    });
    if (res.ok) {
      toast('创建成功!', 'success');
      $('createModal').classList.remove('show');
      $('createFileName').value = '';
      await loadTree();
      setTimeout(() => loadFile(fullPath), 500);
    } else {
      const data = await res.json();
      throw new Error(data.error || '创建失败');
    }
  } catch (e) {
    toast('创建失败: ' + e.message, 'error');
  }
}

function updatePreview() {
  if (state.currentFile?.endsWith('.md')) {
    $('preview').innerHTML = marked.parse($('editor').value);
    $('preview').querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
  }
}

function updateSaveBtn() {
  $('saveBtn').disabled = !state.userRole || state.userRole === 'read' || !state.currentFile;
}

function updateRoleUI() {
  const cfg = { admin: ['👑 管理员', 'bg-purple-600'], write: ['✏️ 编辑者', 'bg-green-600'], read: ['👁️ 只读', 'bg-blue-600'] };
  if (state.userRole && cfg[state.userRole]) {
    $('roleTag').textContent = cfg[state.userRole][0];
    $('roleTag').className = 'text-xs px-2 py-1 rounded-full ' + cfg[state.userRole][1];
    $('logoutBtn').classList.remove('hidden');
    if (state.userRole !== 'read') $('createBtn').classList.remove('hidden');
  } else {
    $('roleTag').textContent = '🚶 游客';
    $('roleTag').className = 'text-xs px-2 py-1 rounded-full bg-slate-600';
    $('logoutBtn').classList.add('hidden');
    $('createBtn').classList.add('hidden');
  }
  updateSaveBtn();
}

async function verifyToken(token) {
  try {
    const res = await fetch('/api/verify', { headers: { 'X-Token': token } });
    if (res.ok) {
      const data = await res.json();
      return data.role;
    }
  } catch (e) {}
  return null;
}

async function loadFriendLinks() {
  try {
    const res = await api('/api/friend-links');
    const links = await res.json();
    if (links && links.length > 0) {
      $('friendLinks').classList.remove('hidden');
      $('friendLinksList').innerHTML = links.map(link => 
        '<a href="' + link.url + '" target="_blank" class="block text-xs text-blue-400 hover:text-blue-300 truncate">' + link.name + '</a>'
      ).join('');
    }
  } catch (e) {}
}

// 分享功能
$('shareBtn').addEventListener('click', () => {
  if (!state.currentFile) return;
  $('shareUrl').value = location.origin + '/share/' + encodeURIComponent(state.currentFile);
  $('shareBase64').checked = false;
  $('shareModal').classList.add('show');
});

$('shareBase64').addEventListener('change', () => {
  const encode = $('shareBase64').checked ? '?encode=base64' : '';
  $('shareUrl').value = location.origin + '/share/' + encodeURIComponent(state.currentFile) + encode;
});

$('copyShareUrl').addEventListener('click', () => {
  $('shareUrl').select();
  document.execCommand('copy');
  toast('链接已复制!', 'success');
});

$('shareClose').addEventListener('click', () => $('shareModal').classList.remove('show'));
$('deleteBtn').addEventListener('click', deleteFile);

// 新建功能
$('createBtn').addEventListener('click', () => {
  $('createFileName').value = '';
  $('createModal').classList.add('show');
});
$('createConfirm').addEventListener('click', createFile);
$('createCancel').addEventListener('click', () => $('createModal').classList.remove('show'));

// 认证
$('authBtn').addEventListener('click', async () => {
  const token = $('tokenInput').value.trim();
  if (!token) { $('authError').textContent = '请输入 Token'; $('authError').classList.remove('hidden'); return; }
  
  const role = await verifyToken(token);
  if (role) {
    state.userToken = token;
    state.userRole = role;
    localStorage.setItem('editorToken', token);
    $('authModal').classList.remove('show');
    updateRoleUI();
    loadTree();
    loadFriendLinks();
    toast('登录成功! 权限: ' + role, 'success');
  } else {
    $('authError').textContent = 'Token 无效';
    $('authError').classList.remove('hidden');
  }
});

$('tokenInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('authBtn').click(); });

$('guestBtn').addEventListener('click', () => {
  $('authModal').classList.remove('show');
  updateRoleUI();
  loadTree();
  loadFriendLinks();
});

$('logoutBtn').addEventListener('click', () => {
  state.userRole = null;
  state.userToken = '';
  state.currentFile = null;
  localStorage.removeItem('editorToken');
  $('editor').classList.add('hidden');
  $('welcome').classList.remove('hidden');
  $('shareBtn').classList.add('hidden');
  $('deleteBtn').classList.add('hidden');
  $('previewToggle').classList.add('hidden');
  $('preview').classList.add('hidden');
  $('filepath').textContent = '未选择文件';
  $('authModal').classList.add('show');
  $('tokenInput').value = '';
  $('authError').classList.add('hidden');
  updateRoleUI();
  toast('已退出', 'info');
});

$('search').addEventListener('input', e => renderTree(state.fileList, e.target.value));
$('editor').addEventListener('input', () => {
  $('fileStatus').classList.toggle('hidden', $('editor').value === state.originalContent);
  if (state.currentFile?.endsWith('.md')) updatePreview();
});
$('saveBtn').addEventListener('click', saveFile);
$('refreshBtn').addEventListener('click', loadTree);
$('previewToggle').addEventListener('click', () => {
  state.isPreviewVisible = !state.isPreviewVisible;
  $('preview').classList.toggle('hidden', !state.isPreviewVisible);
  $('editor').classList.toggle('w-1/2', state.isPreviewVisible);
  $('editor').classList.toggle('w-full', !state.isPreviewVisible);
  $('previewToggle').textContent = state.isPreviewVisible ? '📝 仅编辑' : '👁️ 预览';
});

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (!$('saveBtn').disabled) saveFile();
  }
});

// 自动登录
const saved = localStorage.getItem('editorToken');
if (saved) {
  verifyToken(saved).then(role => {
    if (role) {
      state.userToken = saved;
      state.userRole = role;
      $('authModal').classList.remove('show');
      updateRoleUI();
      loadTree();
      loadFriendLinks();
    }
  });
}
</script>
</body>
</html>`;

// ========== 路由处理 ==========
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // 首页
    if (path === "/" || path === "/index.html") {
      return htmlResponse(FRONTEND_HTML);
    }

    // 分享路由
    if (path.startsWith("/share/")) {
      const filePath = decodeURIComponent(path.substring(7));
      const encode = url.searchParams.get("encode");
      try {
        const result = await getFile(env, filePath);
        if (result.error) return textResponse("文件不存在: " + result.error, 404);
        let content = result.content;
        if (encode === "base64") content = utf8ToBase64(content);
        return textResponse(content);
      } catch (e) {
        return textResponse("读取失败: " + e.message, 500);
      }
    }

    // API: 验证 Token
    if (path === "/api/verify") {
      const role = checkAuth(request, env);
      if (role) return jsonResponse({ success: true, role });
      return jsonResponse({ success: false, message: "Invalid token" }, 401);
    }

    // API: 友情链接
    if (path === "/api/friend-links") {
      return jsonResponse(getFriendLinks(env));
    }

    // API: 文件树
    if (path === "/api/tree") {
      try {
        return jsonResponse(await getTree(env));
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: 获取文件
    if (path === "/api/file") {
      const filePath = url.searchParams.get("path");
      if (!filePath) return jsonResponse({ error: "Missing path" }, 400);
      try {
        const result = await getFile(env, filePath);
        if (result.error) return jsonResponse({ error: result.error }, 404);
        return jsonResponse(result);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: 保存文件
    if (path === "/api/save") {
      const role = checkAuth(request, env);
      if (!role) return jsonResponse({ error: "Unauthorized" }, 401);
      if (role === "read") return jsonResponse({ error: "No write permission" }, 403);
      try {
        const body = await request.json();
        const { path: filePath, content, sha } = body;
        if (!filePath || content === undefined) return jsonResponse({ error: "Missing path or content" }, 400);
        const result = await saveFile(env, filePath, content, sha);
        if (result.message?.includes("sha")) return jsonResponse({ error: "File modified, please refresh" }, 409);
        return jsonResponse(result);
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: 删除文件
    if (path === "/api/delete") {
      const role = checkAuth(request, env);
      if (!role) return jsonResponse({ error: "Unauthorized" }, 401);
      if (role === "read") return jsonResponse({ error: "No delete permission" }, 403);
      try {
        const body = await request.json();
        const { path: filePath, sha } = body;
        if (!filePath || !sha) return jsonResponse({ error: "Missing path or sha" }, 400);
        return jsonResponse(await deleteFile(env, filePath, sha));
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // API: 文件元信息
    if (path === "/api/meta") {
      const filePath = url.searchParams.get("path");
      if (!filePath) return jsonResponse({ error: "Missing path" }, 400);
      try {
        const data = await githubAPI(env, filePath);
        return jsonResponse({ sha: data.sha, size: data.size, name: data.name });
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    return jsonResponse({ error: "Not found" }, 404);
  }
};