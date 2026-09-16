'use strict';

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Загрузка JSON */
async function loadJSON(path) {
  try {
    const r = await fetch(path, { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    return d.items || d.classes || [];
  } catch (e) {
    console.warn('Ошибка загрузки', path, e);
    return [];
  }
}

/* ---------- Тосты ---------- */
const toastWrap = $('#toastWrap');
function showToast(msg, type = 'info', dur = 4500) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = msg;
  toastWrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, dur);
}

/* ---------- Объявление ---------- */
const noticeBar = $('#noticeBar'), noticeClose = $('#noticeClose');
if (sessionStorage.getItem('notice-closed') === '1') noticeBar.classList.add('hidden');
noticeClose.addEventListener('click', () => {
  noticeBar.classList.add('hidden');
  sessionStorage.setItem('notice-closed', '1');
});

/* ---------- Тема ---------- */
const htmlEl = document.documentElement, themeToggle = $('#themeToggle'), themeIcon = $('#themeIcon');
function applyTheme(t) {
  htmlEl.setAttribute('data-theme', t);
  themeIcon.textContent = t === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', t);
}
const saved = localStorage.getItem('theme');
if (saved) applyTheme(saved);
else if (matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');
themeToggle.addEventListener('click', () => {
  applyTheme(htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

/* ---------- Меню ---------- */
const burger = $('#burger'), nav = $('#nav'), overlay = $('#navOverlay');
function closeMenu() {
  nav.classList.remove('open'); burger.classList.remove('active');
  overlay.classList.remove('show'); document.body.classList.remove('no-scroll');
}
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.classList.toggle('active', open);
  overlay.classList.toggle('show', open);
  document.body.classList.toggle('no-scroll', open);
});
overlay.addEventListener('click', closeMenu);
$$('.nav-link').forEach(l => l.addEventListener('click', closeMenu));

/* ---------- Скролл ---------- */
const header = $('#header'), toTop = $('#toTop');
addEventListener('scroll', () => {
  header.classList.toggle('scrolled', scrollY > 10);
  toTop.classList.toggle('show', scrollY > 500);
}, { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- Активная ссылка ---------- */
const navLinks = $$('.nav-link'), sections = $$('main section[id]');
const obs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => obs.observe(s));

/* ---------- Появление ---------- */
const revealObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
function observeReveals() { $$('.reveal:not(.visible)').forEach(el => revealObs.observe(el)); }

/* ---------- Счётчики ---------- */
$$('[data-count]').forEach(el => {
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const target = +el.dataset.count, start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / 1600, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('ru-RU');
      if (p < 1) requestAnimationFrame(tick);
    })(start);
    obs.unobserve(el);
  }), { threshold: .5 });
  obs.observe(el);
});

/* ---------- Поиск ---------- */
const searchToggle = $('#searchToggle'), searchPanel = $('#searchPanel'), searchInput = $('#searchInput'), searchResults = $('#searchResults'), searchClose = $('#searchClose');
function openSearch() { searchPanel.classList.add('open'); setTimeout(() => searchInput.focus(), 200); }
function closeSearch() { searchPanel.classList.remove('open'); searchInput.value = ''; searchResults.innerHTML = ''; }
searchToggle.addEventListener('click', () => searchPanel.classList.contains('open') ? closeSearch() : openSearch());
searchClose.addEventListener('click', closeSearch);
function esc(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
searchInput.addEventListener('input', e => {
  const q = e.target.value.trim();
  if (q.length < 2) { searchResults.innerHTML = q ? '<p class="search-empty">Введите минимум 2 символа</p>' : ''; return; }
  const found = [];
  sections.forEach(s => {
    const title = s.querySelector('.section-title')?.textContent?.trim() || s.id;
    const text = s.innerText.replace(/\s+/g, ' ').trim();
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i !== -1) {
      const start = Math.max(0, i - 45), end = Math.min(text.length, i + q.length + 70);
      let snip = text.slice(start, end);
      if (start > 0) snip = '…' + snip;
      if (end < text.length) snip += '…';
      found.push({ id: s.id, title, snippet: snip });
    }
  });
  if (!found.length) { searchResults.innerHTML = `<p class="search-empty">Ничего не найдено</p>`; return; }
  const re = new RegExp(`(${escRe(q)})`, 'gi');
  searchResults.innerHTML = found.slice(0, 8).map(it => `
    <a class="search-result" href="#${it.id}">
      <strong>${esc(it.title)}</strong>
      <span>${esc(it.snippet).replace(re, '<mark>$1</mark>')}</span>
    </a>`).join('');
  $$('.search-result').forEach(el => el.addEventListener('click', closeSearch));
});

/* ---------- Рендеры ---------- */
const CATEGORY_LABELS = { study: 'Учёба', sport: 'Спорт', event: 'Мероприятие', notice: 'Объявление' };
const LESSON_TIMES = ['08:00', '08:55', '09:50', '10:45', '11:40', '12:35'];

function renderNews(list) {
  const grid = $('#newsGrid');
  grid.innerHTML = list.map(it => `
    <article class="card news-card reveal" data-category="${it.category}">
      <div class="news-thumb ${it.image || 'ph-1'}"><span class="news-cat">${CATEGORY_LABELS[it.category] || 'Новость'}</span></div>
      <div class="news-body"><time class="news-date">${it.date}</time><h3>${it.title}</h3><p>${it.text}</p></div>
    </article>
  `).join('');
  $$('.filter-btn').forEach(btn => btn.onclick = () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    $$('.news-card').forEach(c => c.style.display = (cat === 'all' || c.dataset.category === cat) ? '' : 'none');
  });
}

function getInitials(n) { return n.replace(/\./g, '').trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase(); }
function renderTeachers(list) {
  $('#teachersGrid').innerHTML = list.map(t => `
    <article class="card teacher-card reveal">
      <div class="teacher-avatar">${getInitials(t.name)}</div>
      <h3>${t.name}</h3><span class="teacher-role">${t.role}</span><p class="teacher-meta">${t.meta}</p>
    </article>
  `).join('');
}

let SCHEDULE = {}, currentClass = '', currentDay = 'Пн';
function renderSchedule() {
  const day = SCHEDULE[currentClass]?.[currentDay] || [];
  $('#scheduleBody').innerHTML = day.length
    ? day.map((s, i) => `<tr><td>${i + 1}</td><td>${LESSON_TIMES[i] || '—'}</td><td>${s}</td></tr>`).join('')
    : '<tr><td colspan="3" class="schedule-empty">Уроков нет</td></tr>';
}
function initSchedule(classes) {
  const sel = $('#classSelect');
  sel.innerHTML = '';
  SCHEDULE = {};
  classes.forEach(c => {
    const d = {};
    c.days.forEach(x => d[x.day] = x.lessons);
    SCHEDULE[c.name] = d;
    const o = document.createElement('option');
    o.value = c.name; o.textContent = c.name;
    sel.appendChild(o);
  });
  if (classes.length) { currentClass = classes[0].name; sel.value = currentClass; }
  sel.onchange = e => { currentClass = e.target.value; renderSchedule(); };
  $('#dayTabs').onclick = e => {
    const tab = e.target.closest('.day-tab');
    if (!tab) return;
    $$('.day-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentDay = tab.dataset.day;
    renderSchedule();
  };
  renderSchedule();
}

let GALLERY = [];
function renderGallery(list) {
  GALLERY = list;
  $('#galleryGrid').innerHTML = list.map((it, i) => `
    <div class="gallery-item ${it.cls}" data-index="${i}" tabindex="0">
      <span class="gallery-zoom">🔍</span>
      <span class="gallery-label">${it.label}</span>
    </div>
  `).join('');
}

function renderDocs(list) {
  const grid = $('#docsGrid');
  grid.innerHTML = list.map(d => `
    <a href="${d.url || '#'}" class="card doc-card reveal" data-doc="${d.title}">
      <span class="doc-icon">${d.icon || '📄'}</span>
      <span class="doc-info"><h4>${d.title}</h4><span>${d.meta}</span></span>
      <span class="doc-arrow">↓</span>
    </a>
  `).join('');
  grid.onclick = e => {
    const c = e.target.closest('.doc-card');
    if (!c) return;
    if ((c.getAttribute('href') || '#') === '#') { e.preventDefault(); showToast('📄 Демо-файл', 'info'); }
  };
}

/* ---------- Лайтбокс ---------- */
const lightbox = $('#lightbox'), lbImage = $('#lbImage'), lbCaption = $('#lbCaption');
let currentPhoto = 0;
function openLightbox(i) {
  if (!GALLERY.length) return;
  currentPhoto = (i + GALLERY.length) % GALLERY.length;
  const it = GALLERY[currentPhoto];
  lbImage.className = `lb-image ${it.cls}`;
  lbCaption.textContent = it.label;
  lightbox.classList.add('open');
  document.body.classList.add('no-scroll');
}
function closeLightbox() { lightbox.classList.remove('open'); document.body.classList.remove('no-scroll'); }
$('#galleryGrid').onclick = e => {
  const i = e.target.closest('.gallery-item');
  if (i) openLightbox(+i.dataset.index);
};
$('#lbClose').addEventListener('click', closeLightbox);
$('#lbPrev').addEventListener('click', () => openLightbox(currentPhoto - 1));
$('#lbNext').addEventListener('click', () => openLightbox(currentPhoto + 1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMenu(); closeSearch(); closeLightbox(); }
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'ArrowLeft') openLightbox(currentPhoto - 1);
  if (e.key === 'ArrowRight') openLightbox(currentPhoto + 1);
});

/* ---------- Календарь ---------- */
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const today = new Date();
let viewY = today.getFullYear(), viewM = today.getMonth();
let selectedDate = `${viewY}-${String(viewM + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
let EVENTS = [];
function iso(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

function renderCalendar() {
  $('#calendarTitle').textContent = `${MONTHS[viewM]} ${viewY}`;
  const grid = $('#calendarGrid');
  grid.innerHTML = '';
  const first = new Date(viewY, viewM, 1);
  const days = new Date(viewY, viewM + 1, 0).getDate();
  let offset = first.getDay() - 1;
  if (offset < 0) offset = 6;
  for (let i = 0; i < offset; i++) {
    const s = document.createElement('span');
    s.className = 'cal-day empty';
    grid.appendChild(s);
  }
  for (let d = 1; d <= days; d++) {
    const ds = iso(viewY, viewM, d);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal-day';
    b.textContent = d;
    if (ds === iso(today.getFullYear(), today.getMonth(), today.getDate())) b.classList.add('today');
    if (EVENTS.some(e => e.date === ds)) b.classList.add('has-event');
    if (ds === selectedDate) b.classList.add('selected');
    b.onclick = () => { selectedDate = ds; renderCalendar(); renderEvents(); };
    grid.appendChild(b);
  }
}
function renderEvents() {
  const d = new Date(selectedDate + 'T00:00:00');
  const list = EVENTS.filter(e => e.date === selectedDate);
  $('#eventsListTitle').textContent = `Мероприятия на ${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`;
  $('#eventsList').innerHTML = list.length
    ? list.map(e => `
        <article class="event-item">
          <span class="event-time">${e.time}</span>
          <h4>${e.title}</h4><p>${e.desc}</p>
          <span class="event-place">📍 ${e.place}</span>
        </article>`).join('')
    : '<div class="events-empty">На эту дату мероприятий нет.</div>';
}
$('#prevMonth').onclick = () => { viewM--; if (viewM < 0) { viewM = 11; viewY--; } renderCalendar(); };
$('#nextMonth').onclick = () => { viewM++; if (viewM > 11) { viewM = 0; viewY++; } renderCalendar(); };

/* ---------- Форма ---------- */
const contactForm = $('#contactForm');
function setErr(id, msg) {
  const f = document.getElementById(id).closest('.field');
  const e = f.querySelector('.error');
  if (msg) { f.classList.add('invalid'); e.textContent = msg; }
  else { f.classList.remove('invalid'); e.textContent = ''; }
}
contactForm.addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#cfName').value.trim(), em = $('#cfEmail').value.trim(), m = $('#cfMessage').value.trim();
  let ok = true;
  if (n.length < 2) { setErr('cfName', 'Укажите имя'); ok = false; } else setErr('cfName', '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { setErr('cfEmail', 'Неверный e-mail'); ok = false; } else setErr('cfEmail', '');
  if (m.length < 10) { setErr('cfMessage', 'Минимум 10 символов'); ok = false; } else setErr('cfMessage', '');
  if (!ok) { showToast('⚠️ Проверьте форму', 'error'); return; }
  showToast('✅ Сообщение отправлено (демо)', 'success');
  contactForm.reset();
});

/* ---------- Запуск ---------- */
async function init() {
  const [news, teachers, classes, events, gallery, documents] = await Promise.all([
    loadJSON('data/news.json'),
    loadJSON('data/teachers.json'),
    loadJSON('data/schedule.json'),
    loadJSON('data/events.json'),
    loadJSON('data/gallery.json'),
    loadJSON('data/documents.json')
  ]);
  renderNews(news);
  renderTeachers(teachers);
  initSchedule(classes);
  renderGallery(gallery);
  renderDocs(documents);
  EVENTS = events;
  renderCalendar();
  renderEvents();
  observeReveals();
  $('#year').textContent = new Date().getFullYear();
}
init();
