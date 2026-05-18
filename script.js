/* ============================================================
   Juan Felipe Celis Rojas — Configuration Space
   - Live canvas (decorative configuration-space animation)
   - Section reveal on scroll
   - Dot-nav active state
   - Theme toggle (light / dark) with localStorage
   ============================================================ */

(() => {
    'use strict';

    const prefersReducedMotion =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----------------------------------------------------------
       Footer year
       ---------------------------------------------------------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    /* ----------------------------------------------------------
       Theme toggle (light / dark)
       ---------------------------------------------------------- */
    const root = document.documentElement;
    const toggle = document.querySelector('.theme-toggle');
    const STORE_KEY = 'jfc-theme';

    function systemPref() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(mode) {
        root.setAttribute('data-theme', mode);
        root.classList.toggle('is-dark', mode === 'dark');
        root.classList.toggle('is-light', mode === 'light');
        if (toggle) {
            toggle.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
            const label = toggle.querySelector('.theme-toggle__label');
            if (label) label.textContent = mode === 'dark' ? 'Dark' : 'Light';
        }
    }

    const stored = (() => {
        try { return localStorage.getItem(STORE_KEY); } catch { return null; }
    })();
    applyTheme(stored || systemPref());

    if (toggle) {
        toggle.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            try { localStorage.setItem(STORE_KEY, next); } catch {}
        });
    }

    /* React to OS-level theme changes if user hasn't pinned one */
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', (e) => {
        const pinned = (() => {
            try { return localStorage.getItem(STORE_KEY); } catch { return null; }
        })();
        if (!pinned) applyTheme(e.matches ? 'dark' : 'light');
    });

    /* ----------------------------------------------------------
       Reveal on scroll
       ---------------------------------------------------------- */
    const revealCandidates = document.querySelectorAll(
        '.block, .topic, .research-block, .contact-list, .affiliations, .portrait'
    );
    revealCandidates.forEach((el) => el.classList.add('reveal'));

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
        revealCandidates.forEach((el) => io.observe(el));
    } else {
        revealCandidates.forEach((el) => el.classList.add('is-visible'));
    }

    /* ----------------------------------------------------------
       Dot-nav active state
       ---------------------------------------------------------- */
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const dotLinks = Array.from(document.querySelectorAll('.dot-nav a'));
    const linkBySection = new Map(
        dotLinks.map((a) => [a.getAttribute('data-section') || a.getAttribute('href')?.slice(1), a])
    );

    function setActiveDot(id) {
        dotLinks.forEach((a) => a.classList.remove('is-active'));
        const a = linkBySection.get(id);
        if (a) a.classList.add('is-active');
    }

    if ('IntersectionObserver' in window && sections.length) {
        const navIo = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActiveDot(visible.target.id);
        }, { threshold: [0.25, 0.5, 0.75] });
        sections.forEach((s) => navIo.observe(s));
    }

    /* Smooth scroll for dot-nav (also normalises focus) */
    dotLinks.forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('data-section') || a.getAttribute('href')?.slice(1);
            const target = id && document.getElementById(id);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
            history.replaceState(null, '', `#${id}`);
            setActiveDot(id);
        });
    });

    /* ----------------------------------------------------------
       Configuration-space canvas
       ----------------------------------------------------------
       A scatter of moving points (a "configuration" on the page).
       Pairs of points within a distance threshold are joined by
       thin lines, suggesting the proximity graph that lives at
       the heart of configuration-space topology.
       ---------------------------------------------------------- */
    const canvas = document.getElementById('config-space');
    if (canvas && !prefersReducedMotion) {
        const ctx = canvas.getContext('2d', { alpha: true });

        let DPR = Math.min(window.devicePixelRatio || 1, 2);
        let w = 0, h = 0;
        let points = [];
        const pointer = { x: -1e6, y: -1e6, active: false };
        let lastT = 0;

        function readStyle() {
            const cs = getComputedStyle(document.documentElement);
            const rgb = (cs.getPropertyValue('--canvas-rgb') || '0,33,71').trim();
            const a = parseFloat(cs.getPropertyValue('--canvas-alpha')) || 0.22;
            const la = parseFloat(cs.getPropertyValue('--canvas-link-alpha')) || 0.10;
            return { rgb, a, la };
        }

        let style = readStyle();

        function targetCount() {
            const area = w * h;
            const density = 1 / 16000; /* one point per ~16k px² */
            return Math.max(30, Math.min(150, Math.round(area * density)));
        }

        function spawnPoint() {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.18,
                vy: (Math.random() - 0.5) * 0.18,
                r: 0.9 + Math.random() * 1.2,
            };
        }

        function resize() {
            DPR = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = Math.floor(w * DPR);
            canvas.height = Math.floor(h * DPR);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

            const desired = targetCount();
            if (points.length === 0) {
                points = Array.from({ length: desired }, spawnPoint);
            } else if (points.length < desired) {
                while (points.length < desired) points.push(spawnPoint());
            } else if (points.length > desired) {
                points.length = desired;
            }
        }

        function step(t) {
            const dt = lastT ? Math.min(40, t - lastT) : 16;
            lastT = t;

            ctx.clearRect(0, 0, w, h);

            const linkDist = Math.min(170, Math.max(110, Math.sqrt(w * h) / 8));
            const linkDist2 = linkDist * linkDist;

            /* Update positions */
            for (let i = 0; i < points.length; i++) {
                const p = points[i];

                /* Pointer interaction — gentle attraction */
                if (pointer.active) {
                    const dx = pointer.x - p.x;
                    const dy = pointer.y - p.y;
                    const d2 = dx * dx + dy * dy;
                    const r = 160;
                    if (d2 < r * r) {
                        const d = Math.sqrt(d2) || 1;
                        const force = (1 - d / r) * 0.04;
                        p.vx += (dx / d) * force;
                        p.vy += (dy / d) * force;
                    }
                }

                p.x += p.vx * (dt / 16);
                p.y += p.vy * (dt / 16);

                /* Mild damping */
                p.vx *= 0.992;
                p.vy *= 0.992;

                /* Brownian jitter so points never freeze */
                p.vx += (Math.random() - 0.5) * 0.01;
                p.vy += (Math.random() - 0.5) * 0.01;

                /* Wrap on edges (torus topology, which feels apt) */
                if (p.x < -10) p.x = w + 10;
                else if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                else if (p.y > h + 10) p.y = -10;
            }

            /* Draw links */
            ctx.lineWidth = 1;
            for (let i = 0; i < points.length; i++) {
                const a = points[i];
                for (let j = i + 1; j < points.length; j++) {
                    const b = points[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < linkDist2) {
                        const alpha = (1 - d2 / linkDist2) * style.la;
                        ctx.strokeStyle = `rgba(${style.rgb}, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            /* Draw points */
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                ctx.fillStyle = `rgba(${style.rgb}, ${style.a})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            requestAnimationFrame(step);
        }

        function onPointer(e) {
            const touch = e.touches?.[0];
            const cx = touch ? touch.clientX : e.clientX;
            const cy = touch ? touch.clientY : e.clientY;
            pointer.x = cx;
            pointer.y = cy;
            pointer.active = true;
        }
        function clearPointer() { pointer.active = false; }

        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('mousemove', onPointer, { passive: true });
        window.addEventListener('touchmove', onPointer, { passive: true });
        window.addEventListener('mouseleave', clearPointer, { passive: true });
        window.addEventListener('blur', clearPointer);

        /* Refresh style when theme changes (CSS vars update) */
        const themeObserver = new MutationObserver(() => { style = readStyle(); });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'class'],
        });

        resize();
        requestAnimationFrame(step);
    } else if (canvas) {
        /* Reduced-motion fallback: a static, sparse scatter */
        const ctx = canvas.getContext('2d');
        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.floor(w * DPR);
        canvas.height = Math.floor(h * DPR);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        const cs = getComputedStyle(document.documentElement);
        const rgb = (cs.getPropertyValue('--canvas-rgb') || '0,33,71').trim();
        const a  = parseFloat(cs.getPropertyValue('--canvas-alpha')) || 0.22;
        ctx.fillStyle = `rgba(${rgb}, ${a})`;
        for (let i = 0; i < 60; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
})();
