// 密码同步端点：返回当前编辑密码哈希，供前端登录校验同步使用
export async function onRequestGet(context) {
  try {
    var hasKV = !!(context.env && context.env.BOSS_DATA);
    if (!hasKV) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const storedHash = (await context.env.BOSS_DATA.get('editor_password'))
      || '2991ba545171f81bfcab16430e453f64e3d3d51588a8a819055a9ff7c196109b';
    return new Response(JSON.stringify({ editor_hash: storedHash }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
