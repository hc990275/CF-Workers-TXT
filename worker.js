// ============= 在线 Markdown 管理器（自定义访客 Token + MD渲染） =============
// 管理员： https://<worker域名>/<ADMIN_UUID>
// 访客MD： https://<worker域名>/sub?token=<Token>
// 原始MD： https://<worker域名>/raw?token=<Token>

// ===== 默认配置 =====
let ADMIN_UUID = null;
let FileName = 'CF-Workers-MD';

const MD_FILE = 'MARKDOWN_CONTENT';

// ===== 工具 =====
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// ===== 主入口 =====
export default {
  async fetch(request, env) {
    ADMIN_UUID = env.ADMIN_UUID || ADMIN_UUID;
    FileName = env.FILENAME || FileName;

    const url = new URL(request.url);
    const pathname = url.pathname.slice(1);
    const token = url.searchParams.get('token');

    // 未设置 ADMIN_UUID
    if (!ADMIN_UUID) {
      return new Response(
        `<!doctype html><meta charset="utf-8"><h1>⚠️ 请先设置环境变量 ADMIN_UUID</h1>`,
        { status: 400, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
      );
    }

    // 管理员页面
    if (pathname === ADMIN_UUID) {
      if (request.method === 'POST') {
        const body = await request.text();

        // 生成访客 Token
        if (body.startsWith('GUESTGEN|')) {
          const custom = body.split('|')[1] || uuidv4();
          await env.KV.put('GUEST_TOKEN', custom);
          return new Response(custom);
        }

        // 保存 Markdown
        await env.KV.put(MD_FILE, body);
        return new Response('saved');
      }
      const content = await env.KV.get(MD_FILE) || '';
      return new Response(adminPage(content), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    }

    // ====== 访客模式 ======

    async function checkToken() {
      if (!token) return false;
      const saved = await env.KV.get('GUEST_TOKEN');
      return token === saved;
    }

    // 渲染 Markdown
    if (url.pathname === '/sub') {
      if (!await checkToken()) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(MD_FILE) || '';
      return new Response(mdViewPage(data), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    }

    // 原始 Markdown
    if (url.pathname === '/raw') {
      if (!await checkToken()) return new Response('Token invalid', { status: 403 });
      const data = await env.KV.get(MD_FILE) || '';
      return new Response(data, {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

// ================= 管理员编辑页（Markdown 编辑 + 实时预览） =================

function adminPage(content) {
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<title>${FileName} - 管理</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown-light.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github.min.css">

<style>
body { margin:0; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto; background:#f6f8fa; }
.header { padding:12px 20px; background:#24292f; color:#fff; display:flex; justify-content:space-between; }
.editor { width:50%; height:90vh; float:left; border-right:1px solid #ddd; }
.preview { width:50%; height:90vh; float:right; overflow:auto; background:#fff; }
textarea { width:100%; height:100%; border:none; padding:20px; font-size:15px; font-family: monospace; outline:none; }
.markdown-body { padding:20px; }
.controls { padding:10px 20px; background:#fff; border-bottom:1px solid #ddd; }
button { padding:6px 14px; border-radius:6px; cursor:pointer; }
</style>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/highlight.js/lib/common.min.js"></script>
<script>
marked.setOptions({
  highlight(code) {
    return hljs.highlightAuto(code).value;
  },
  breaks:true,
  gfm:true
});
</script>
</head>

<body>
<div class="header">
  <div>${FileName} 管理器</div>
</div>

<div class="controls">
  <button onclick="save()">💾 保存</button>
  <button onclick="gen()">🔗 生成 Token</button>
  <span id="status"></span>
</div>

<div class="editor"><textarea id="editor">${escaped}</textarea></div>
<div class="preview"><div id="preview" class="markdown-body"></div></div>

<script>
function render() {
  document.getElementById('preview').innerHTML = marked.parse(document.getElementById('editor').value);
}
render();
document.getElementById('editor').addEventListener('input', render);

function save() {
  fetch(location.href, { method:'POST', body: editor.value })
    .then(()=> status.textContent='已保存')
    .catch(()=> status.textContent='保存失败');
}

function gen() {
  fetch(location.href, { method:'POST', body:'GUESTGEN|' })
    .then(r=>r.text())
    .then(t=>{
      const base = location.href.split('/').slice(0,-1).join('/');
      alert("访客链接：\n" + base + "/sub?token=" + t);
    });
}
</script>
</body>
</html>`;
}

// ====================== 访客页面（GitHub 风格 Markdown 渲染） ======================

function mdViewPage(md) {
  const esc = md.replace(/`/g, '\\`');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Markdown</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown-light.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github.min.css">

<style>
body { background:#fff; margin:0; padding:0; }
.markdown-body { max-width:980px; margin:0 auto; padding:32px; }
</style>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/highlight.js/lib/common.min.js"></script>

<script>
marked.setOptions({
  highlight(code) { return hljs.highlightAuto(code).value; },
  breaks:true,
  gfm:true
});
window.onload = ()=>{
  document.getElementById("content").innerHTML = marked.parse(\`${esc}\`);
};
</script>
</head>

<body>
<article id="content" class="markdown-body"></article>
</body>
</html>`;
}
