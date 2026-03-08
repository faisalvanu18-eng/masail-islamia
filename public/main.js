/* ============================================================
   MASAIL ISLAMIA — main.js
   ============================================================ */

const API = 'https://masail-islamia.onrender.com/api';

/* ─────────────────────────────────────────────
   BOOT
   ───────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => document.getElementById('intro')?.classList.add('hide'), 3800);

  bindCategoryClicks();
  bindBooksButton();
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
      <button class="btn-dl" type="button" id="dl-btn-${bookId}" onclick="readBook('${bookId}', '${bookTitle}')">
        📖 Read Book
      </button>
    `;

    wrap.appendChild(item);
  });
}

/* ─────────────────────────────────────────────
   READ BOOK — opens PDF in new tab directly
   No download needed, no file storage issues
   ───────────────────────────────────────────── */
function readBook(bookId, bookTitle) {
  if (!bookId) {
    showToast('Book not found');
    return;
  }

  const btn = document.getElementById('dl-btn-' + bookId);
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Opening...';
  }

  // Open PDF directly in new tab using the static file URL
  // This works perfectly on Render — no file storage issues
  fetch(API + '/books/download/' + bookId)
    .then(res => res.json())
    .then(json => {
      if (!json.success || !json.url) {
        showToast('کتاب نہیں کھل سکی — please try again');
        return;
      }

      const fileUrl = json.url.startsWith('http')
        ? json.url
        : 'https://masail-islamia.onrender.com' + json.url;

      // Open in new tab
      window.open(fileUrl, '_blank');
      showToast('کتاب کھل رہی ہے ✓');
    })
    .catch(() => showToast('کتاب نہیں کھل سکی — please try again'))
    .finally(() => {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📖 Read Book';
      }
    });
}