// Cloudflare Worker — Boss Timer 数据 API
// 部署到 Workers，绑定 KV namespace

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers });

    // GET /api/data — 公开读取
    if (url.pathname === '/api/data' && request.method === 'GET') {
      const raw = await env.BOSS_DATA.get('boss_list');
      const data = raw ? JSON.parse(raw) : [];
      return new Response(JSON.stringify(data), { headers });
    }

    // POST /api/data — 写数据（需密码）
    if (url.pathname === '/api/data' && request.method === 'POST') {
      try {
        const body = await request.json();
        const pw = body.password || '';
        const bossList = body.data;
        
        // SHA-256 验证编辑密码 (默认: admin)
        const pwHash = await sha256(pw);
        const storedHash = (await env.BOSS_DATA.get('editor_password')) 
          || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
        
        if (pwHash !== storedHash) {
          return new Response(JSON.stringify({ error: '密码错误' }), { status: 403, headers });
        }
        
        if (!Array.isArray(bossList)) {
          return new Response(JSON.stringify({ error: '数据格式错误' }), { status: 400, headers });
        }
        
        await env.BOSS_DATA.put('boss_list', JSON.stringify(bossList));
        return new Response(JSON.stringify({ ok: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // POST /api/admin — 修改编辑密码（需管理员密码）
    if (url.pathname === '/api/admin' && request.method === 'POST') {
      try {
        const body = await request.json();
        const adminPw = body.admin_password || '';
        const newEditorPw = body.new_password || '';
        
        const adminHash = await sha256(adminPw);
        const storedAdmin = (await env.BOSS_DATA.get('admin_password'))
          || 'aaffebecec560fec66e75f24062224ffa4e07696d2ae9a1fee3707c3f8fd9373';
        
        if (adminHash !== storedAdmin) {
          return new Response(JSON.stringify({ error: '管理员密码错误' }), { status: 403, headers });
        }
        
        const newHash = await sha256(newEditorPw);
        await env.BOSS_DATA.put('editor_password', newHash);
        return new Response(JSON.stringify({ ok: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    return new Response('Boss Timer API', { headers: { ...headers, 'Content-Type': 'text/plain' } });
  }
};

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
