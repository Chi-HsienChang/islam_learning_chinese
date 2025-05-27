const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const csvPath = path.join(__dirname, 'public', 'visits.csv');

// 1. 啟動時若已有 visits.csv，先讀入舊資料
let counts = { total: 0, daily: {} };
if (fs.existsSync(csvPath)) {
  const data = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  data.slice(1).forEach(line => {
    const [date, cnt] = line.split(',');
    if (date === 'total') {
      counts.total = parseInt(cnt, 10);
    } else {
      counts.daily[date] = parseInt(cnt, 10);
    }
  });
}

// 2. 每次前端載入時呼叫此 API 更新計數並重寫 CSV
app.post('/api/visit', (req, res) => {
  const today = new Date().toISOString().slice(0,10);
  counts.total += 1;
  counts.daily[today] = (counts.daily[today] || 0) + 1;

  // 3. 重寫 public/visits.csv
  const rows = [['date','count']];
  Object.entries(counts.daily).forEach(([d, c]) => rows.push([d, c.toString()]));
  rows.push(['total', counts.total.toString()]);
  const csv = rows.map(r => r.join(',')).join('\n');
  fs.writeFileSync(csvPath, csv);

  // 4. 回傳最新數值
  res.json({ total: counts.total, today: counts.daily[today] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
