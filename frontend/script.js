/* ============================================================
   SEEDLYNX — script.js  |  Canvas BG + Full Interactivity
   ============================================================ */
'use strict';

const API_BASE = 'http://localhost:5000/api';

/* ── Canvas Particle Network Background ── */
(function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles, mouse = { x: -1000, y: -1000 };

  const PARTICLE_COLOR = 'rgba(14,196,184,';
  const LINE_COLOR     = 'rgba(14,196,184,';
  const PARTICLE_COUNT = () => Math.min(Math.floor(W * H / 14000), 80);
  const MAX_DIST = 140;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initParticles();
  }

  function initParticles() {
    const n = PARTICLE_COUNT();
    particles = Array.from({ length: n }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      r:  Math.random() * 1.5 + .5,
      opacity: Math.random() * .45 + .15,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Subtle radial gradient base
    const grad = ctx.createRadialGradient(W * .35, H * .35, 0, W * .5, H * .5, W * .7);
    grad.addColorStop(0, 'rgba(14,196,184,.04)');
    grad.addColorStop(.5, 'rgba(168,85,247,.02)');
    grad.addColorStop(1, 'rgba(7,9,15,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    particles.forEach(p => {
      // Move
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0)  { p.x = 0;  p.vx *= -1; }
      if (p.x > W)  { p.x = W;  p.vx *= -1; }
      if (p.y < 0)  { p.y = 0;  p.vy *= -1; }
      if (p.y > H)  { p.y = H;  p.vy *= -1; }

      // Mouse attraction (subtle)
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const md = Math.sqrt(dx*dx + dy*dy);
      if (md < 180) {
        p.x += dx / md * .25;
        p.y += dy / md * .25;
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = PARTICLE_COLOR + p.opacity + ')';
      ctx.fill();
    });

    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * .18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = LINE_COLOR + alpha + ')';
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
  }, { passive: true });

  resize();
  draw();
})();

/* ── Smooth Scroll ── */
document.querySelectorAll('.scroll-link').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 76;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });
});

/* ── Navbar Scroll State ── */
const navbar = document.getElementById('navbar');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 40);
  updateActiveLink();
  lastY = y;
}, { passive: true });

function updateActiveLink() {
  const sections = ['home','webdev','multimedia','about','opportunities','book'];
  const offset = 130;
  let cur = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - offset) cur = id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = (a.getAttribute('href') || '').replace('#','');
    a.classList.toggle('active', href === cur || (href === 'webdev' && cur === 'webdev'));
  });
}

/* ── Mobile Menu ── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
});

function closeMob() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
}

// Close on outside click
document.addEventListener('click', e => {
  if (!navbar.contains(e.target)) closeMob();
}, { passive: true });

/* ── Intersection Observer (Reveal) ── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Booking Date Min ── */
const dateEl = document.getElementById('bookDate');
if (dateEl) dateEl.min = new Date().toISOString().split('T')[0];

/* ── Booking Form ── */
const form       = document.getElementById('bookingForm');
const submitBtn  = document.getElementById('submitBtn');
const bookSuccess = document.getElementById('bookSuccess');

function showErr(field, msg) {
  const errEl = document.getElementById(field + 'Error');
  const inEl  = document.getElementById('book' + field.charAt(0).toUpperCase() + field.slice(1));
  if (errEl) errEl.textContent = msg;
  if (inEl)  inEl.classList.add('err');
}

function clearErrs() {
  ['name','email','date','time'].forEach(f => {
    const e = document.getElementById(f + 'Error');
    const i = document.getElementById('book' + f.charAt(0).toUpperCase() + f.slice(1));
    if (e) e.textContent = '';
    if (i) i.classList.remove('err');
  });
}

function validate(d) {
  let ok = true;
  clearErrs();
  if (!d.name || d.name.length < 2) { showErr('name', 'Please enter your full name.'); ok = false; }
  if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { showErr('email', 'Please enter a valid email.'); ok = false; }
  if (!d.date) { showErr('date', 'Please select a date.'); ok = false; }
  else {
    const sel = new Date(d.date), today = new Date();
    today.setHours(0,0,0,0);
    if (sel < today) { showErr('date', 'Please select a future date.'); ok = false; }
  }
  if (!d.time) { showErr('time', 'Please select a time slot.'); ok = false; }
  return ok;
}

function setLoading(v) {
  submitBtn.disabled = v;
  submitBtn.querySelector('.btext').style.display = v ? 'none' : 'flex';
  submitBtn.querySelector('.bload').style.display = v ? 'flex' : 'none';
}

form && form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    name:    document.getElementById('bookName').value.trim(),
    email:   document.getElementById('bookEmail').value.trim(),
    date:    document.getElementById('bookDate').value,
    time:    document.getElementById('bookTime').value,
    service: document.getElementById('bookService').value,
    message: document.getElementById('bookMessage').value.trim(),
  };
  if (!validate(data)) return;
  setLoading(true);
  try {
    const res  = await fetch(`${API_BASE}/bookings`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) { if (json.field) showErr(json.field, json.message); else alert(json.message || 'Something went wrong.'); return; }
    form.style.display  = 'none';
    bookSuccess.style.display = 'flex';
  } catch { alert('Could not connect to the server. Please try again later.'); }
  finally { setLoading(false); }
});

function resetBooking() {
  form && (form.reset(), form.style.display = 'block', clearErrs());
  bookSuccess && (bookSuccess.style.display = 'none');
}

/* ── Sample Works Modal ── */
function showSample(type) {
  const titles = { web:'Web Development Portfolio', multimedia:'Multimedia Portfolio', video:'Video Works', photo:'Photo Works' };
  document.getElementById('sampleTitle').textContent = titles[type] || 'Sample Works';
  document.getElementById('sampleModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeSample() {
  document.getElementById('sampleModal').style.display = 'none';
  document.body.style.overflow = '';
}

document.getElementById('sampleModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('sampleModal')) closeSample();
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSample(); });

/* ── Logo → top ── */
document.querySelector('.nav-logo')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── Init active link ── */
updateActiveLink();