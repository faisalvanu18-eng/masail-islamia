const API = 'https://masail-islamia.onrender.com/api';
const SITE = 'https://masail-islamia.onrender.com';

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  const admin = JSON.parse(localStorage.getItem('adminUser') || 'null');

  if (token && admin) {
    showDashboard(admin);
    verifyAdmin();
  }
});

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function authHeaders(isJson = true) {
  const token = localStorage.getItem('adminToken');
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getVal(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[m]));
}

function showPanel(id) {
  ['panel-dashboard', 'panel-masail', 'panel-questions', 'panel-books'].forEach(panelId => {
    document.getElementById(panelId)?.classList.add('admin-hidden');
  });
  document.getElementById(id)?.classList.remove('admin-hidden');
}

async function adminLogin() {
  const username = getVal('admin-username');
  const password = getVal('admin-password');

  if (!username || !password) {
    showToast('Enter username and password');
    return;
  }

  try {
    const res = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const json = await res.json();

    if (!json.success) {
      showToast(json.message || 'Login failed');
      return;
    }

    localStorage.setItem('adminToken', json.token);
    localStorage.setItem('adminUser', JSON.stringify(json.admin));

    showDashboard(json.admin);
    await loadAllAdminData();
    showToast('Login successful');
  } catch (error) {
    showToast('Login error');
  }
}

async function verifyAdmin() {
  try {
    const res = await fetch(`${API}/admin/me`, {
      headers: authHeaders(false)
    });

    const json = await res.json();

    if (!json.success) {
      adminLogout(false);
      return;
    }

    await loadAllAdminData();
  } catch (error) {
    adminLogout(false);
  }
}

function showDashboard(admin) {
  document.getElementById('admin-login-section')?.classList.add('admin-hidden');
  document.getElementById('admin-dashboard-section')?.classList.remove('admin-hidden');
  document.getElementById('admin-welcome').textContent = `Logged in as ${admin.username} · ${admin.role}`;
}

function adminLogout(showMsg = true) {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  document.getElementById('admin-dashboard-section')?.classList.add('admin-hidden');
  document.getElementById('admin-login-section')?.classList.remove('admin-hidden');
  if (showMsg) showToast('Logged out');
}

async function loadAllAdminData() {
  await loadStats();
  await loadMasail();
  await loadQuestions();
  await loadBooks();
}

async function loadStats() {
  try {
    const res = await fetch(`${API}/admin/stats`, {
      headers: authHeaders(false)
    });
    const json = await res.json();
    if (!json.success) return;

    const d = json.data || {};
    document.getElementById('stat-total-masail').textContent = d.totalMasail ?? 0;
    document.getElementById('stat-published-masail').textContent = d.publishedMasail ?? 0;
    document.getElementById('stat-total-questions').textContent = d.totalQuestions ?? 0;
    document.getElementById('stat-total-books').textContent = d.totalBooks ?? 0;

    const recent = document.getElementById('recent-questions');
    if (recent) {
      recent.innerHTML = '';
      (d.recentQuestions || []).forEach(q => {
        recent.innerHTML += `
          <div class="list-card">
            <div class="list-head">
              <div>
                <div class="list-title">${escapeHtml(q.name)}</div>
                <div class="list-sub">${escapeHtml(q.topic || 'Other')} · ${new Date(q.createdAt).toLocaleString()}</div>
              </div>
              <span class="admin-badge">${escapeHtml(q.status || 'pending')}</span>
            </div>
          </div>
        `;
      });
    }
  } catch (error) {}
}

function resetMasailForm() {
  document.getElementById('masail-id').value = '';
  document.getElementById('m-titleUrdu').value = '';
  document.getElementById('m-category').value = 'Namaz';
  document.getElementById('m-questionUrdu').value = '';
  document.getElementById('m-answerUrdu').value = '';
  document.getElementById('m-reference').value = '';
  document.getElementById('m-madhab').value = 'Shafi';
  document.getElementById('m-isPublished').value = 'true';
  document.getElementById('m-isFeatured').value = 'false';
}

async function saveMasail() {
  const id = getVal('masail-id');
  const payload = {
    titleUrdu: getVal('m-titleUrdu'),
    category: getVal('m-category'),
    questionUrdu: getVal('m-questionUrdu'),
    answerUrdu: getVal('m-answerUrdu'),
    reference: getVal('m-reference'),
    madhab: getVal('m-madhab'),
    isPublished: document.getElementById('m-isPublished').value === 'true',
    isFeatured: document.getElementById('m-isFeatured').value === 'true'
  };

  if (!payload.titleUrdu || !payload.category || !payload.questionUrdu || !payload.answerUrdu) {
    showToast('Fill all required masail fields');
    return;
  }

  try {
    const res = await fetch(`${API}/admin/masail${id ? `/${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Could not save masail');
      return;
    }

    showToast(id ? 'Masail updated' : 'Masail added');
    resetMasailForm();
    await loadMasail();
    await loadStats();
    showPanel('panel-masail');
  } catch (error) {
    showToast('Error saving masail');
  }
}

async function loadMasail() {
  try {
    const res = await fetch(`${API}/admin/masail`, {
      headers: authHeaders(false)
    });
    const json = await res.json();
    if (!json.success) return;

    const wrap = document.getElementById('masail-list');
    if (!wrap) return;

    wrap.innerHTML = '';

    (json.data || []).forEach(m => {
      const excerpt = (m.questionUrdu || '').slice(0, 120);
      wrap.innerHTML += `
        <div class="list-card">
          <div class="list-head">
            <div>
              <div class="list-title">${escapeHtml(m.titleUrdu)}</div>
              <div class="list-sub">#${escapeHtml(m.masailNumber || '')} · ${escapeHtml(m.category)} · ${escapeHtml(m.madhab || 'Shafi')}</div>
            </div>
            <div class="list-row-actions">
              <button class="mini-btn edit" onclick='editMasail(${JSON.stringify(m).replace(/'/g, "&apos;")})'>Edit</button>
              <button class="mini-btn view" onclick='setFeatured("${m._id}")'>Feature</button>
              <button class="mini-btn del" onclick='deleteMasail("${m._id}")'>Delete</button>
            </div>
          </div>
          <div style="margin-top:8px;font-family:var(--fu);color:var(--txt-m);line-height:1.9;">${escapeHtml(excerpt)}...</div>
        </div>
      `;
    });
  } catch (error) {}
}

function editMasail(m) {
  showPanel('panel-masail');
  document.getElementById('masail-id').value = m._id || '';
  document.getElementById('m-titleUrdu').value = m.titleUrdu || '';
  document.getElementById('m-category').value = m.category || 'Other';
  document.getElementById('m-questionUrdu').value = m.questionUrdu || '';
  document.getElementById('m-answerUrdu').value = m.answerUrdu || '';
  document.getElementById('m-reference').value = m.reference || '';
  document.getElementById('m-madhab').value = m.madhab || 'Shafi';
  document.getElementById('m-isPublished').value = String(!!m.isPublished);
  document.getElementById('m-isFeatured').value = String(!!m.isFeatured);
  window.scrollTo(0, 0);
}

async function deleteMasail(id) {
  if (!confirm('Delete this masail?')) return;
  try {
    const res = await fetch(`${API}/admin/masail/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false)
    });
    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Delete failed');
      return;
    }
    showToast('Masail deleted');
    await loadMasail();
    await loadStats();
  } catch (error) {
    showToast('Delete error');
  }
}

async function setFeatured(id) {
  try {
    const res = await fetch(`${API}/admin/masail/${id}/feature`, {
      method: 'PUT',
      headers: authHeaders(false)
    });
    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Could not set featured');
      return;
    }
    showToast('Featured masail updated');
    await loadMasail();
  } catch (error) {
    showToast('Feature error');
  }
}

async function loadQuestions() {
  try {
    const res = await fetch(`${API}/admin/questions`, {
      headers: authHeaders(false)
    });
    const json = await res.json();
    if (!json.success) return;

    const wrap = document.getElementById('questions-list');
    if (!wrap) return;

    wrap.innerHTML = '';

    (json.data || []).forEach(q => {
      wrap.innerHTML += `
        <div class="list-card">
          <div class="list-head">
            <div>
              <div class="list-title">${escapeHtml(q.name)} <span class="admin-badge">${escapeHtml(q.status || 'pending')}</span></div>
              <div class="list-sub">${escapeHtml(q.email)} · ${escapeHtml(q.phone)} · ${new Date(q.createdAt).toLocaleString()}</div>
            </div>
            <div class="list-row-actions">
              <button class="mini-btn view" onclick='replyToQuestion("${q._id}", ${JSON.stringify(q.replyText || '').replace(/'/g, "&apos;")})'>Reply</button>
              <button class="mini-btn del" onclick='deleteQuestion("${q._id}")'>Delete</button>
            </div>
          </div>
          <div style="margin-top:8px;font-family:var(--fu);line-height:1.9;">${escapeHtml(q.questionText || '')}</div>
          ${q.replyText ? `<div style="margin-top:10px;background:#eef7f0;border:1px solid #cfe3d2;border-radius:10px;padding:10px;font-family:var(--fu);line-height:1.8;">Reply: ${escapeHtml(q.replyText)}</div>` : ''}
        </div>
      `;
    });
  } catch (error) {}
}

async function replyToQuestion(id) {
  const replyText = prompt('Enter reply for this question:');
  if (!replyText) return;

  try {
    const res = await fetch(`${API}/admin/questions/${id}/reply`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ replyText })
    });

    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Reply failed');
      return;
    }

    showToast('Reply sent');
    await loadQuestions();
    await loadStats();
  } catch (error) {
    showToast('Reply error');
  }
}

async function deleteQuestion(id) {
  if (!confirm('Delete this question?')) return;
  try {
    const res = await fetch(`${API}/admin/questions/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false)
    });
    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Delete failed');
      return;
    }
    showToast('Question deleted');
    await loadQuestions();
    await loadStats();
  } catch (error) {
    showToast('Delete error');
  }
}

function resetBookForm() {
  document.getElementById('book-id').value = '';
  document.getElementById('b-titleUrdu').value = '';
  document.getElementById('b-titleEnglish').value = '';
  document.getElementById('b-authorUrdu').value = '';
  document.getElementById('b-category').value = 'Other';
  document.getElementById('b-file').value = '';
  document.getElementById('b-isPublished').value = 'true';
}

async function saveBook() {
  const form = new FormData();
  const file = document.getElementById('b-file').files[0];

  if (!getVal('b-titleUrdu') || !getVal('b-titleEnglish') || !getVal('b-authorUrdu') || !getVal('b-category') || !file) {
    showToast('Fill all book fields and select PDF');
    return;
  }

  form.append('titleUrdu', getVal('b-titleUrdu'));
  form.append('titleEnglish', getVal('b-titleEnglish'));
  form.append('authorUrdu', getVal('b-authorUrdu'));
  form.append('category', getVal('b-category'));
  form.append('isPublished', document.getElementById('b-isPublished').value);
  form.append('bookFile', file);

  try {
    const res = await fetch(`${API}/admin/books`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: form
    });

    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Book upload failed');
      return;
    }

    showToast('Book uploaded');
    resetBookForm();
    await loadBooks();
    await loadStats();
  } catch (error) {
    showToast('Book upload error');
  }
}

async function loadBooks() {
  try {
    const res = await fetch(`${API}/admin/books`, {
      headers: authHeaders(false)
    });
    const json = await res.json();
    if (!json.success) return;

    const wrap = document.getElementById('books-list-admin');
    if (!wrap) return;

    wrap.innerHTML = '';

    (json.data || []).forEach(book => {
      // ✅ FIX: Use live server URL instead of hardcoded localhost
      const pdfUrl = book.fileUrl
        ? (book.fileUrl.startsWith('http') ? book.fileUrl : `${SITE}${book.fileUrl}`)
        : '#';

      wrap.innerHTML += `
        <div class="list-card">
          <div class="list-head">
            <div>
              <div class="list-title">${escapeHtml(book.titleUrdu)}</div>
              <div class="list-sub">${escapeHtml(book.titleEnglish)} · ${escapeHtml(book.category)} · Downloads ${book.downloadCount || 0}</div>
            </div>
            <div class="list-row-actions">
              <a class="mini-btn view" href="${pdfUrl}" target="_blank" rel="noopener">Open PDF</a>
              <button class="mini-btn del" onclick='deleteBook("${book._id}")'>Delete</button>
            </div>
          </div>
          <div style="margin-top:8px;font-family:var(--fu);line-height:1.9;">مصنف: ${escapeHtml(book.authorUrdu)}</div>
        </div>
      `;
    });
  } catch (error) {}
}

async function deleteBook(id) {
  if (!confirm('Delete this book?')) return;
  try {
    const res = await fetch(`${API}/admin/books/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false)
    });
    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Delete failed');
      return;
    }
    showToast('Book deleted');
    await loadBooks();
    await loadStats();
  } catch (error) {
    showToast('Delete error');
  }
}

async function changePassword() {
  const currentPassword = getVal('current-password');
  const newPassword = getVal('new-password');

  if (!currentPassword || !newPassword) {
    showToast('Enter both passwords');
    return;
  }

  try {
    const res = await fetch(`${API}/admin/change-password`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const json = await res.json();
    if (!json.success) {
      showToast(json.message || 'Password update failed');
      return;
    }

    showToast('Password updated');
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
  } catch (error) {
    showToast('Password update error');
  }
}