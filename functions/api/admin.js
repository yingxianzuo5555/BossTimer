export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const adminPw = body.admin_password || '';
    const newEditorPw = body.new_password || '';
    const adminHash = await sha256(adminPw);
    const storedAdmin = (await context.env.BOSS_DATA.get('admin_password'))
      || 'aaffebecec560fec66e75f24062224ffa4e07696d2ae9a1fee3707c3f8fd9373';
    if (adminHash !== storedAdmin) {
      return new Response(JSON.stringify({ error: '管理员密码错误' }), { status: 403,
        headers: { 'Content-Type': 'application/json' } });
    }
    const newHash = await sha256(newEditorPw);
    await context.env.BOSS_DATA.put('editor_password', newHash);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500,
      headers: { 'Content-Type': 'application/json' } });
  }
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
