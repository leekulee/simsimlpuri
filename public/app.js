let currentUser = null;
const likedPosts = new Set(JSON.parse(localStorage.getItem('likedPosts') || '[]'));

function startApp() {
  const nickname = document.getElementById('nickname-input').value.trim();
  if (!nickname) {
    alert('닉네임을 입력해주세요!');
    return;
  }

  const job = document.getElementById('job-select').value;
  currentUser = { nickname, job };
  localStorage.setItem('user', JSON.stringify(currentUser));

  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main').classList.remove('hidden');
  document.getElementById('header-nickname').textContent = nickname;

  loadPosts();
}

document.getElementById('post-input').addEventListener('input', function () {
  document.getElementById('char-count').textContent = `${this.value.length} / 140`;
});

document.getElementById('nickname-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') startApp();
});

async function submitPost() {
  const content = document.getElementById('post-input').value.trim();
  if (!content) return;

  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: currentUser.nickname, job: currentUser.job, content })
  });

  if (res.ok) {
    document.getElementById('post-input').value = '';
    document.getElementById('char-count').textContent = '0 / 140';
    loadPosts();
  }
}

async function loadPosts() {
  const res = await fetch('/api/posts');
  const posts = await res.json();
  renderPosts(posts);
}

function renderPosts(posts) {
  const feed = document.getElementById('feed');

  if (posts.length === 0) {
    feed.innerHTML = `
      <div class="empty-feed">
        <div class="emoji">😴</div>
        <div>아직 아무도 없어요<br>첫 글을 올려보세요!</div>
      </div>`;
    return;
  }

  feed.innerHTML = posts.map(post => `
    <div class="post-card" id="post-${post.id}">
      <div class="post-meta">
        <span class="post-nickname">${escapeHtml(post.nickname)}</span>
        <span class="post-job">${escapeHtml(post.job)}</span>
        <span class="post-time">${timeAgo(post.createdAt)}</span>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      <div class="post-actions">
        <button class="like-btn ${likedPosts.has(post.id) ? 'liked' : ''}" onclick="likePost('${post.id}', this)">
          👍 공감 <span class="like-count">${post.likes}</span>
        </button>
      </div>
    </div>
  `).join('');
}

async function likePost(id, btn) {
  if (likedPosts.has(id)) return;

  const res = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
  if (res.ok) {
    const data = await res.json();
    likedPosts.add(id);
    localStorage.setItem('likedPosts', JSON.stringify([...likedPosts]));
    btn.classList.add('liked');
    btn.querySelector('.like-count').textContent = data.likes;
  }
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 자동 새로고침 (30초마다)
setInterval(loadPosts, 30000);

// 저장된 유저 있으면 바로 입장
const savedUser = localStorage.getItem('user');
if (savedUser) {
  currentUser = JSON.parse(savedUser);
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main').classList.remove('hidden');
  document.getElementById('header-nickname').textContent = currentUser.nickname;
  loadPosts();
}
