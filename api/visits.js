// api/visits.js

export default async function handler(req, res) {
  // 從環境變數讀取 Upstash Redis REST API 的 URL 與 Token
  const REST_URL   = process.env.UPSTASH_REDIS_REST_URL;
  const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = 'visit_count';

  try {
    // 呼叫 Upstash REST API 對 key 做 INCR 操作
    const url = `${REST_URL}/incr/${key}?token=${REST_TOKEN}`;
    const r   = await fetch(url);
    const data = await r.json();
    if (!r.ok) throw data;

    // 設定快取標頭，讓邊緣快取 1 秒
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    // 回傳最新計數
    return res.status(200).json({ count: data.result });
  } catch (err) {
    console.error('Redis error:', err);
    return res.status(500).json({ error: '計數更新失敗' });
  }
}
