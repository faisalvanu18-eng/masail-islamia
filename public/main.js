/* ============================================================
   MASAIL ISLAMIA — main.js
   ============================================================ */

const API = 'https://masail-islamia.onrender.com/api';
const SITE = 'https://masail-islamia.onrender.com';

/* ─────────────────────────────────────────────
   BOOT
   ───────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => document.getElementById('intro')?.classList.add('hide'), 3800);

  bindCategoryClicks();
  bindBooksButton();
  bindAskForm();
  loadFeatured();

  if (document.body.dataset.page === 'category') {
    loadCategoryPage();
  }

  if (document.body.dataset.page === 'books') {
    loadBooksPage();
  }
});

/* ─────────────────────────────────────────────
   NAV DRAWER
   ───────────────────────────────────────────── */
function openNav() {
  document.getElementById('navDrawer')?.classList.add('open');
  document.getElementById('navScrim')?.classList.add('open');
}

function closeNav() {
  document.getElementById('navDrawer')?.classList.remove('open');
  document.getElementById('navScrim')?.classList.remove('open');
}

/* ─────────────────────────────────────────────
   DETAIL PAGE
   ───────────────────────────────────────────── */
function openDetail() {
  document.getElementById('pgMain')?.classList.add('hide');
  document.getElementById('pgDetail')?.classList.add('show');
  window.scrollTo(0, 0);
}

function closeDetail() {
  document.getElementById('pgDetail')?.classList.remove('show');
  document.getElementById('pgMain')?.classList.remove('hide');
  window.scrollTo(0, 0);
}

/* ─────────────────────────────────────────────
   FEATURED MASAIL
   ───────────────────────────────────────────── */
async function loadFeatured() {
  try {
    const res = await fetch(`${API}/masail`);
    const json = await res.json();

    if (!json.success || !json.data || !json.data.length) {
      setText('masail-date', '');
      setText('masail-title', 'فی الحال کوئی مسئلہ موجود نہیں ہے');
      setText('masail-excerpt', 'No masail available right now');
      window._masail = null;
      return;
    }

    const m = json.data[0];
    window._masail = m;

    setText('masail-date', fmtDate(m.publishedDate));
    setText('masail-title', m.titleUrdu || '');

    const excerpt = (m.questionUrdu || '').length > 190
      ? `${m.questionUrdu.slice(0, 190)}...`
      : (m.questionUrdu || '');

    setText('masail-excerpt', excerpt);
  } catch (error) {
    console.log('Featured masail load failed:', error.message);
  }
}

/* ─────────────────────────────────────────────
   OPEN DETAIL WITH LIVE DATA
   ───────────────────────────────────────────── */
function openDetailFull() {
  const m = window._masail;
  if (!m) return;

  setText('d-num', `MASAIL NO. ${m.masailNumber || ''} — ${fmtDate(m.publishedDate).toUpperCase()}`);
  setText('d-title', m.titleUrdu || '');
  setText('d-cat', m.category || '');
  setText('d-mad', `Fiqh · ${m.madhab || 'Shafi'}`);
  setText('d-date', fmtDate(m.publishedDate));

  const qEl = document.getElementById('d-q');
  const aEl = document.getElementById('d-a');

  if (qEl) qEl.innerHTML = (m.questionUrdu || '').replace(/\n/g, '<br><br>');
  if (aEl) aEl.innerHTML = (m.answerUrdu || '').replace(/\n/g, '<br><br>');

  setText('d-ref', m.reference || 'درمختار، رد المحتار، فتاوی عالمگیری');

  openDetail();
}

/* ─────────────────────────────────────────────
   CATEGORY SEE MORE / SEE LESS
   ───────────────────────────────────────────── */
let catsOpen = false;

function toggleCats() {
  catsOpen = !catsOpen;

  document.querySelectorAll('.cat-h').forEach(el => {
    el.classList.toggle('show', catsOpen);
  });

  const lbl = document.getElementById('more-lbl');
  if (lbl) {
    lbl.textContent = catsOpen ? 'See Less ▲' : 'See More ▼';
  }
}

/* ─────────────────────────────────────────────
   CATEGORY CLICK → OPEN CATEGORY PAGE
   ───────────────────────────────────────────── */
function bindCategoryClicks() {
  const boxes = document.querySelectorAll('.cat-box');

  boxes.forEach(box => {
    box.addEventListener('click', () => {
      const category = box.dataset.category;
      if (!category) return;
      window.location.href = `category.html?category=${encodeURIComponent(category)}`;
    });
  });
}

/* ─────────────────────────────────────────────
   CATEGORY PAGE LOAD
   ───────────────────────────────────────────── */
async function loadCategoryPage() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || '';

  setText('category-title', category || 'Category');
  await fetchCategoryMasail(category);
}

async function fetchCategoryMasail(category, search = '') {
  try {
    const params = new URLSearchParams();

    if (category) params.set('category', category);
    if (search) params.set('search', search);

    const res = await fetch(`${API}/masail?${params.toString()}`);
    const json = await res.json();

    if (!json.success) {
      renderCategoryMasail([]);
      return;
    }

    renderCategoryMasail(json.data || []);
  } catch (error) {
    console.log('Category masail load failed:', error.message);
    renderCategoryMasail([]);
  }
}

function renderCategoryMasail(list) {
  const wrap = document.getElementById('category-results');
  const empty = document.getElementById('category-empty');

  if (!wrap) return;

  wrap.innerHTML = '';

  if (!list.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

    const safeItem = JSON.stringify(item).replace(/'/g, '&apos;');

    card.innerHTML = `
      <div class="card-hd">
        <div class="card-hd-text">
          <span class="ur">${escapeHtml(item.category || '')}</span>
          <span class="en">CATEGORY</span>
        </div>
        <div class="card-hd-ico">📘</div>
      </div>
      <div class="masail-body">
        <div class="masail-tag">#${escapeHtml(item.masailNumber || '')}</div>
        <h3 class="masail-ti">${escapeHtml(item.titleUrdu || '')}</h3>
        <p class="masail-ex">${escapeHtml(shortText(item.questionUrdu || '', 220))}</p>
        <button class="btn-rm" type="button" onclick='openCategoryDetail(${safeItem})'>
          <span>Read More</span>
        </button>
      </div>
    `;

    wrap.appendChild(card);
  });
}

function searchInCategory() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || '';
  const search = getVal('category-search');

  fetchCategoryMasail(category, search);
}

function openCategoryDetail(item) {
  window._masail = item;

  setText('d-num', `MASAIL NO. ${item.masailNumber || ''} — ${fmtDate(item.publishedDate).toUpperCase()}`);
  setText('d-title', item.titleUrdu || '');
  setText('d-cat', item.category || '');
  setText('d-mad', `Fiqh · ${item.madhab || 'Shafi'}`);
  setText('d-date', fmtDate(item.publishedDate));

  const qEl = document.getElementById('d-q');
  const aEl = document.getElementById('d-a');

  if (qEl) qEl.innerHTML = (item.questionUrdu || '').replace(/\n/g, '<br><br>');
  if (aEl) aEl.innerHTML = (item.answerUrdu || '').replace(/\n/g, '<br><br>');

  setText('d-ref', item.reference || 'درمختار، رد المحتار، فتاوی عالمگیری');

  openDetail();
}

/* ─────────────────────────────────────────────
   BOOKS PAGE BUTTON
   ───────────────────────────────────────────── */
function bindBooksButton() {
  const btn = document.getElementById('books-page-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.location.href = 'books.html';
  });
}

/* ─────────────────────────────────────────────
   LOAD BOOKS PAGE
   ───────────────────────────────────────────── */
async function loadBooksPage() {
  await fetchBooks();
}

async function fetchBooks() {
  try {
    const search = getVal('books-search');
    const category = getVal('books-category');

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);

    const res = await fetch(`${API}/books?${params.toString()}`);
    const json = await res.json();

    if (!json.success) {
      renderBooks([]);
      return;
    }

    renderBooks(json.data || []);
  } catch (error) {
    console.log('Books load failed:', error.message);
    renderBooks([]);
  }
}

function renderBooks(list) {
  const wrap = document.getElementById('books-list');
  const empty = document.getElementById('books-empty');

  if (!wrap) return;

  wrap.innerHTML = '';

  if (!list.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  list.forEach(book => {
    const bookId = book._id || '';
    const bookTitle = escapeHtml(book.titleEnglish || book.titleUrdu || 'book');

    const item = document.createElement('div');
    item.className = 'bk';

    item.innerHTML = `
      <div class="bk-cov"><span>📕</span></div>
      <div class="bk-info">
        <div class="bk-ur">${escapeHtml(book.titleUrdu || '')}</div>
        <div class="bk-en">${escapeHtml(book.titleEnglish || '')}</div>
        <div class="bk-desc">مصنف: ${escapeHtml(book.authorUrdu || '')}</div>
        <div class="bk-desc">Category: ${escapeHtml(book.category || '')}</div>
      </div>
      <button class="btn-dl" type="button" id="dl-btn-${bookId}" onclick="downloadBook('${bookId}', '${bookTitle}')">
        ⬇ Download Book
      </button>
    `;

    wrap.appendChild(item);
  });
}

/* ─────────────────────────────────────────────
   DOWNLOAD BOOK — force PDF download
   ───────────────────────────────────────────── */
async function downloadBook(bookId) {
  if (!bookId) {
    showToast('Book not found');
    return;
  }

  const btn = document.getElementById('dl-btn-' + bookId);
  const originalText = btn ? btn.innerHTML : '⬇ Download Book';

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Downloading...';
    }

    const a = document.createElement('a');
    a.href = `${API}/books/download/${bookId}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();

    showToast('کتاب ڈاؤن لوڈ ہو رہی ہے ✓');
  } catch (error) {
    console.error('downloadBook error:', error);
    showToast('کتاب ڈاؤن لوڈ نہیں ہو سکی');
  } finally {
    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }, 1500);
  }
}
/* ─────────────────────────────────────────────
   ASK FATWA SUBMIT
   ───────────────────────────────────────────── */
function bindAskForm() {
  const form = document.getElementById('ask-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitQ();
  });

  const btn = document.getElementById('sub-btn');
  if (btn) {
    btn.setAttribute('type', 'submit');
  }
}

function getSubmitButtonMarkup() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
    <span>سوال بھیجیں · SUBMIT</span>
  `;
}

async function submitQ() {
  const name  = getVal('ask-name');
  const email = getVal('ask-email');
  const phone = getVal('ask-phone');
  const topic = getVal('ask-topic');
  const qtext = getVal('ask-q');

  if (!name || !email || !phone || !qtext) {
    showToast('تمام ضروری خانے پُر کریں — Fill all fields');
    return;
  }

  const btn = document.getElementById('sub-btn');
  if (!btn) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span> ارسال ہو رہا ہے...';

  try {
    const res = await fetch(`${API}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, topic, questionText: qtext })
    });

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Server error');
    }

    btn.innerHTML = '✓ سوال کامیابی سے بھیج دیا گیا';
    btn.style.background = 'linear-gradient(135deg, #1a7a3a, #267a6a)';

    showToast('Question submitted successfully ✓');

    ['ask-name', 'ask-email', 'ask-phone', 'ask-q'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const t = document.getElementById('ask-topic');
    if (t) t.selectedIndex = 0;

    setTimeout(() => {
      btn.disabled = false;
      btn.style.background = '';
      btn.innerHTML = getSubmitButtonMarkup();
    }, 2200);

  } catch (err) {
    console.error('submitQ error:', err);
    showToast(err.message || 'Server error, please try again later');
    btn.disabled = false;
    btn.style.background = '';
    btn.innerHTML = getSubmitButtonMarkup();
  }
}

/* ─────────────────────────────────────────────
   UTILS
   ───────────────────────────────────────────── */
function getVal(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function shortText(text, len) {
  if (!text) return '';
  return text.length > len ? `${text.slice(0, len)}...` : text;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), 3400);
}