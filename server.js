const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');

// data 폴더 없으면 자동 생성
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readPosts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// 글 목록 조회
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  res.json(posts.slice().reverse());
});

// 글 작성
app.post('/api/posts', (req, res) => {
  const { nickname, job, content } = req.body;
  if (!nickname || !content || content.trim().length === 0) {
    return res.status(400).json({ error: '내용을 입력해주세요' });
  }
  if (content.length > 140) {
    return res.status(400).json({ error: '140자 이내로 작성해주세요' });
  }

  const posts = readPosts();
  const newPost = {
    id: Date.now().toString(),
    nickname,
    job: job || '직장인',
    content: content.trim(),
    likes: 0,
    createdAt: new Date().toISOString()
  };
  posts.push(newPost);
  writePosts(posts);
  res.json(newPost);
});

// 공감
app.post('/api/posts/:id/like', (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: '글을 찾을 수 없어요' });

  post.likes += 1;
  writePosts(posts);
  res.json({ likes: post.likes });
});

app.listen(PORT, () => {
  console.log(`심심풀이 서버 시작! → http://localhost:${PORT}`);
});
