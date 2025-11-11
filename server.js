const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3099;

// 정적 파일(public 폴더) 서빙
app.use(express.static('public'));
app.use(express.json());

// 버튼 목록 반환
app.get('/api/buttons', (req, res) => {
  fs.readFile(path.join(__dirname, 'buttons.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).send([]);
    res.json(JSON.parse(data));
  });
});

// 버튼 목록 수정
app.post('/api/buttons', (req, res) => {
  fs.writeFile(path.join(__dirname, 'buttons.json'), JSON.stringify(req.body, null, 2), err => {
    if (err) return res.status(500).send({success:false});
    res.send({success:true});
  });
});

// 404일 때 index.html로 리디렉트 (SPA 경우)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Korbill 메인페이지: http://localhost:${PORT}`);
});
