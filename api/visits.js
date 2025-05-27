// api/visits.js

export default async function handler(req, res) {
  // 1. 從環境變數讀取 Upstash Redis REST API 的 URL 與 Token
  const REST_URL   = process.env.UPSTASH_REDIS_REST_URL;
  const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = 'visit_count';

  // 2. 確保 env 變數都有設定
  if (!REST_URL || !REST_TOKEN) {
    console.error('Missing Upstash Redis env vars:', { REST_URL, REST_TOKEN });
    return res
      .status(500)
      .json({ error: '伺服器設定錯誤：未設定 Redis 環境變數' });
  }

  try {
    // 3. 用 POST 並在 header 加上 Bearer Token 來呼叫 Upstash INCR
    const url = `${REST_URL}/incr/${key}`;
    const r   = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`
      }
    });
    const data = await r.json();

    // 4. 若回傳非 2xx，將錯誤輸出
    if (!r.ok) {
      console.error('Upstash error:', data);
      throw new Error(data.error ?? JSON.stringify(data));
    }

    // 5. 設定邊緣快取：快取 1 秒，並允許 stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    // 6. 回傳最新計數
    return res.status(200).json({ count: data.result });
  } catch (err) {
    console.error('Redis error:', err);
    return res
      .status(500)
      .json({ error: '計數更新失敗！' });
  }
}
