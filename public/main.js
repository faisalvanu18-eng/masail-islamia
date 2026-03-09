/* ============================================================
   MASAIL ISLAMIA — main.js  (UX ENHANCED)
   ============================================================ */

const API = 'https://masail-islamia.onrender.com/api';
const SITE = 'https://masail-islamia.onrender.com';

/* ─────────────────────────────────────────────
   BOOT
   ───────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('intro');

  bindCategoryClicks();
  bindBooksButton();
  bindAskForm();
  initScrollReveal();
  initScrollTop();
  initHeaderScroll();
  initRippleEffects();
  addParticleCanvas();

  document.body.classList.add('page-fade');

  if (intro) {
    setTimeout(() => {
      intro.classList.add('hide');
      setTimeout(() => {
        intro.style.display = 'none';
        handleInitialState();
        afterIntroLoad();
      }, 1000);
    }, 3800);

    setTimeout(() => {
      if (intro && intro.style.display !== 'none') {
        intro.style.display = 'none';
        handleInitialState();
        afterIntroLoad();
      }
    }, 5200);
  } else {
    handleInitialState();
    afterIntroLoad();
  }
});

function afterIntroLoad() {
  loadFeatured();

  if (document.body.dataset.page === 'category') {
    loadCategoryPage();
  }

  if (document.body.dataset.page === 'books') {
    loadBooksPage();
  }
}

function handleInitialState() {
  if (location.hash === '#detail') {
    document.getElementById('pgMain')?.classList.add('hide');
    document.getElementById('pgDetail')?.classList.add('show');
  } else {
    document.getElementById('pgDetail')?.classList.remove('show');
    document.getElementById('pgMain')?.classList.remove('hide');
  }
}

/* ─────────────────────────────────────────────
   PARTICLE CANVAS (Intro)
   ───────────────────────────────────────────── */
function addParticleCanvas() {
  const intro = document.getElementById('intro');
  if (!intro) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'intro-canvas';
  intro.insertBefore(canvas, intro.firstChild);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '#f0c84a' : '#ffffff',
      life: 1
    };
  }

  for (let i = 0; i < 60; i++) particles.push(createParticle());

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.004;
      if (p.life <= 0 || p.y < -10) {
        particles[i] = createParticle();
        particles[i].y = canvas.height + 5;
        return;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha * p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    animId = requestAnimationFrame(draw);
  }
  draw();

  // Stop when intro hides
  const observer = new MutationObserver(() => {
    if (intro.style.display === 'none' || intro.classList.contains('hide')) {
      cancelAnimationFrame(animId);
    }
  });
  observer.observe(intro, { attributes: true, attributeFilter: ['style', 'class'] });
}

/* ─────────────────────────────────────────────
   SCROLL REVEAL
   ───────────────────────────────────────────── */
function initScrollReveal() {
  const targets = document.querySelectorAll('.card, .cat-box, .ct-tile, .bk, .sec-hd, .hero-in');
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 4 === 1) el.classList.add('reveal-delay-1');
    else if (i % 4 === 2) el.classList.add('reveal-delay-2');
    else if (i % 4 === 3) el.classList.add('reveal-delay-3');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────
   HEADER SCROLL STATE
   ───────────────────────────────────────────── */
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   SCROLL TO TOP
   ───────────────────────────────────────────── */
function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'scrollTop';
  btn.innerHTML = '↑';
  btn.setAttribute('aria-label', 'Scroll to top');
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────────
   RIPPLE EFFECTS
   ───────────────────────────────────────────── */
function initRippleEffects() {
  const rippleTargets = document.querySelectorAll('.btn-rm, .btn-sub, .btn-srch, .btn-dl, .admin-btn, .cat-box');
  rippleTargets.forEach(el => {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('click', createRipple);
  });
}

function createRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top  = (e.clientY - rect.top) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

/* ─────────────────────────────────────────────
   NAV DRAWER
   ───────────────────────────────────────────── */
function openNav() {
  document.getElementById('navDrawer')?.classList.add('open');
  document.getElementById('navScrim')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeNav() {
  document.getElementById('navDrawer')?.classList.remove('open');
  document.getElementById('navScrim')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────
   DETAIL PAGE
   ───────────────────────────────────────────── */
function showDetailPage() {
  document.getElementById('pgMain')?.classList.add('hide');
  document.getElementById('pgDetail')?.classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMainPage() {
  document.getElementById('pgDetail')?.classList.remove('show');
  document.getElementById('pgMain')?.classList.remove('hide');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDetail(pushHistory = true) {
  showDetailPage();
  if (pushHistory && location.hash !== '#detail') {
    history.pushState({ page: 'detail' }, '', '#detail');
  }
}

function closeDetail() {
  if (location.hash === '#detail') {
    history.back();
    return;
  }
  showMainPage();
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

  openDetail(true);
}

/* ─────────────────────────────────────────────
   CATEGORY SEE MORE / SEE LESS
   ───────────────────────────────────────────── */
let catsOpen = false;

function toggleCats() {
  const catsSection = document.getElementById('sec-cats');
  const hiddenCats = document.querySelectorAll('.cat-h');
  const lbl = document.getElementById('more-lbl');

  if (!catsSection || !hiddenCats.length) return;

  catsOpen = !catsOpen;

  hiddenCats.forEach((el, i) => {
    if (catsOpen) {
      el.classList.add('show');
      el.style.animationDelay = `${i * 0.04}s`;
    } else {
      el.classList.remove('show');
    }
  });

  if (lbl) {
    lbl.textContent = catsOpen ? 'See Less ▲' : 'See More ▼';
  }

  // Re-observe new visible categories for ripple
  setTimeout(() => {
    if (catsOpen) {
      const newCats = document.querySelectorAll('.cat-h.show');
      newCats.forEach(el => {
        if (!el.hasRipple) {
          el.addEventListener('click', createRipple);
          el.hasRipple = true;
        }
      });
    }
  }, 50);

  requestAnimationFrame(() => {
    const sectionTop = catsSection.getBoundingClientRect().top + window.pageYOffset - 20;
    window.scrollTo({ top: sectionTop, behavior: 'smooth' });
  });
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
      window.location.href = `/category.html?category=${encodeURIComponent(category)}`;
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

  list.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card reveal';
    card.style.transitionDelay = `${index * 0.08}s`;
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

    // Trigger reveal
    setTimeout(() => card.classList.add('visible'), 50 + index * 80);
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
  openDetail(true);
}

/* ─────────────────────────────────────────────
   BOOKS PAGE BUTTON
   ───────────────────────────────────────────── */
function bindBooksButton() {
  const btn = document.getElementById('books-page-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.location.href = '/books.html';
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

  list.forEach((book, index) => {
    const bookId = book._id || '';

    const item = document.createElement('div');
    item.className = 'bk reveal';
    item.style.transitionDelay = `${index * 0.1}s`;

    item.innerHTML = `
      <div class="bk-cov"><span>📕</span></div>
      <div class="bk-info">
        <div class="bk-ur">${escapeHtml(book.titleUrdu || '')}</div>
        <div class="bk-en">${escapeHtml(book.titleEnglish || '')}</div>
        <div class="bk-desc">مصنف: ${escapeHtml(book.authorUrdu || '')}</div>
        <div class="bk-desc">Category: ${escapeHtml(book.category || '')}</div>
      </div>
      <button class="btn-dl" type="button" id="dl-btn-${bookId}" onclick="downloadBook('${bookId}')">
        ⬇ Click to Read Book
      </button>
    `;
    wrap.appendChild(item);

    setTimeout(() => item.classList.add('visible'), 50 + index * 100);
  });
}

/* ─────────────────────────────────────────────
   DOWNLOAD BOOK
   ───────────────────────────────────────────── */
async function downloadBook(bookId) {
  if (!bookId) {
    showToast('Book not found');
    return;
  }

  const btn = document.getElementById(`dl-btn-${bookId}`);
  const originalText = btn ? btn.innerHTML : '⬇ Download Book';

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spin"></span> Downloading...';
    }

    const res = await fetch(`${API}/books/download/${bookId}`);
    const json = await res.json();

    if (!json.success || !json.url) {
      throw new Error(json.message || 'Book file not found');
    }

    const fileUrl = /^https?:\/\//i.test(json.url) ? json.url : `${SITE}${json.url}`;

    const a = document.createElement('a');
    a.href = fileUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

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
  const btn = document.getElementById('sub-btn');
  if (!btn) return;
  btn.setAttribute('type', 'button');
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    await submitQ();
  });
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
  const name = getVal('ask-name');
  const email = getVal('ask-email');
  const phone = getVal('ask-phone');
  const topic = getVal('ask-topic');
  const qtext = getVal('ask-q');

  if (!name || !email || !phone || !qtext) {
    // Shake animation on empty fields
    ['ask-name', 'ask-email', 'ask-phone', 'ask-q'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value.trim()) {
        el.style.borderColor = 'var(--red)';
        el.style.animation = 'shake 0.4s ease';
        el.addEventListener('input', () => {
          el.style.borderColor = '';
          el.style.animation = '';
        }, { once: true });
      }
    });
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
   BROWSER / PHONE BACK SUPPORT
   ───────────────────────────────────────────── */
window.addEventListener('popstate', () => {
  if (location.hash === '#detail') {
    showDetailPage();
  } else {
    showMainPage();
  }
});

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
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3400);
}