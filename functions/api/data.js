export async function onRequestGet(context) {
  try {
    // Test if env is accessible
    var envKeys = context.env ? Object.keys(context.env) : [];
    var hasKV = !!(context.env && context.env.BOSS_DATA);
    var info = { envKeys: envKeys, hasKV: hasKV };
    
    if (!hasKV) {
      return new Response(JSON.stringify(info), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const raw = await context.env.BOSS_DATA.get('boss_list');
    const data = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
    });
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  try {
    var hasKV = !!(context.env && context.env.BOSS_DATA);
    if (!hasKV) {
      return new Response(JSON.stringify({error:'KV not bound'}), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const body = await context.request.json();
    const pw = body.password || '';
    const bossList = body.data;
    const pwHash = await sha256(pw);
    const storedHash = (await context.env.BOSS_DATA.get('editor_password'))
      || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
    if (pwHash !== storedHash) {
      return new Response(JSON.stringify({ error: '密码错误' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!Array.isArray(bossList)) {
      return new Response(JSON.stringify({ error: '数据格式错误' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    await context.env.BOSS_DATA.put('boss_list', JSON.stringify(bossList));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
