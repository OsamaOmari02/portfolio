/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ---------- Theme toggle ---------- */
const themeBtn = $('#themeBtn');
const syncTheme = () => { themeBtn.dataset.mode = getComputedStyle(root).colorScheme === 'dark' ? 'dark' : 'light'; };
try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) { }
syncTheme();
const darkMq = matchMedia('(prefers-color-scheme: dark)');
if (darkMq.addEventListener) darkMq.addEventListener('change', syncTheme); else if (darkMq.addListener) darkMq.addListener(syncTheme);
themeBtn.addEventListener('click', () => {
    const next = themeBtn.dataset.mode === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { }
    syncTheme();
});

/* ---------- Nav: scrolled state, mobile menu, shortcut label ---------- */
const nav = $('.nav'), menu = $('#menu'), menuBtn = $('#menuBtn');
const setMenu = open => { menu.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); };
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Project filter ---------- */
const btns = $$('#projects .filters button'), items = $$('#projectGrid li');
btns.forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    let shown = 0;
    btns.forEach(x => x.setAttribute('aria-pressed', x === b));
    items.forEach(li => {
        const ok = f === 'all' || li.dataset.cat.split(' ').includes(f);
        li.hidden = !ok;
        if (ok) shown++;
    });
    $('#emptyMsg').hidden = shown > 0;
}));

/* ---------- Subtle animated background ----------
   Slow drifting dots joined by faint lines, in your accent color.
   Off for reduced-motion users, paused when the tab is hidden.
   Tweak: MAX_DOTS (amount), SPEED (movement), LINK (line distance), ALPHA (visibility). */
(() => {
    const cv = $('#bg');
    if (!cv || calm) return;
    const MAX_DOTS = 70, SPEED = 0.25, LINK = 120, ALPHA = 0.18;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dots = [], rgb = '90,169,255', raf = 0, tick = 0;
    const readColor = () => {
        const m = /^#?([0-9a-f]{6})$/i.exec(getComputedStyle(root).getPropertyValue('--accent').trim());
        if (m) { const n = parseInt(m[1], 16); rgb = `${n >> 16},${(n >> 8) & 255},${n & 255}`; }
    };
    const resize = () => {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        w = innerWidth; h = innerHeight;
        cv.width = w * dpr; cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.min(MAX_DOTS, Math.round(w * h / 22000));
        dots = Array.from({ length: n }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - .5) * SPEED, vy: (Math.random() - .5) * SPEED,
            r: Math.random() * 1.2 + .8
        }));
    };
    const frame = () => {
        if (++tick % 40 === 1) readColor();
        ctx.clearRect(0, 0, w, h);
        for (const d of dots) {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > w) d.vx *= -1;
            if (d.y < 0 || d.y > h) d.vy *= -1;
            ctx.fillStyle = `rgba(${rgb},.35)`;
            ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
        }
        for (let i = 0; i < dots.length; i++) {
            for (let k = i + 1; k < dots.length; k++) {
                const dx = dots[i].x - dots[k].x, dy = dots[i].y - dots[k].y, dist = Math.hypot(dx, dy);
                if (dist < LINK) {
                    ctx.strokeStyle = `rgba(${rgb},${(1 - dist / LINK) * ALPHA})`;
                    ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[k].x, dots[k].y); ctx.stroke();
                }
            }
        }
        raf = requestAnimationFrame(frame);
    };
    let lastW = innerWidth, t;
    addEventListener('resize', () => {
        clearTimeout(t);
        t = setTimeout(() => { if (innerWidth !== lastW) { lastW = innerWidth; resize(); } }, 200);
    });
    document.addEventListener('visibilitychange', () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) raf = requestAnimationFrame(frame);
    });
    resize(); readColor();
    raf = requestAnimationFrame(frame);
})();

/* ---------- Footer year ---------- */
$('#year').textContent = new Date().getFullYear();

/* ---------- Scroll progress bar ---------- */
const bar = $('#bar');
const onScroll = () => {
    const h = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    nav.classList.toggle('scrolled', scrollY > 8);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Reveal, count-up, active nav ---------- */
const countUp = el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (calm) return;
    const t0 = performance.now(), dur = 1200;
    const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};
if ('IntersectionObserver' in window) {
    let alive = false;
    const io = new IntersectionObserver(es => {
        alive = true;
        es.forEach(e => {
            if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
        });
    }, { threshold: .05 });
    const revealEls = $$('.reveal');
    revealEls.forEach(el => {
        if (!calm && el.getBoundingClientRect().top > innerHeight) el.classList.add('pre');
        io.observe(el);
    });
    setTimeout(() => { if (!alive) revealEls.forEach(el => el.classList.remove('pre')); }, 2500);

    const co = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); }
    }), { threshold: .6 });
    $$('[data-count]').forEach(e => co.observe(e));

    const links = $$('.nav li a');
    const spy = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.hash === '#' + e.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    $$('main section[id]').forEach(s => spy.observe(s));
} else {
    $$('.reveal').forEach(e => e.classList.add('in'));
}
window.siteReady = true;

/* ---------- Typing effect (real title stays in the HTML) ---------- */
const typed = $('#typed');
if (!calm && typed) {
    const words = ['Flutter Developer', 'NestJS API Builder', 'Team Lead & Mentor', 'Hackathon Winner'];
    let w = 0, i = words[0].length, del = true;
    const step = () => {
        const word = words[w];
        typed.textContent = word.slice(0, i);
        if (del) { i--; if (i < 0) { del = false; w = (w + 1) % words.length; i = 0; } }
        else { i++; if (i > words[w].length) { del = true; setTimeout(step, 1600); return; } }
        setTimeout(step, del ? 35 : 70);
    };
    setTimeout(step, 2000);
}

/* ---------- 3D tilt on project cards (mouse devices only) ---------- */
if (matchMedia('(hover: hover)').matches && !calm) {
    $$('.tilt').forEach(c => {
        c.addEventListener('pointermove', e => {
            const r = c.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            c.style.transform = `perspective(700px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
        });
        c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
}
