document.addEventListener("DOMContentLoaded", () => {
    const navLinks = Array.from(document.querySelectorAll("nav a[data-section]"));
    const sections = Array.from(document.querySelectorAll("main section"));
    const headerImg = document.querySelector(".header-image");

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let activeId = null;
    let revealTimers = [];
    let exitFallbackTimer = null;

    function clearTimers() {
        revealTimers.forEach(t => clearTimeout(t));
        revealTimers = [];
        if (exitFallbackTimer) {
            clearTimeout(exitFallbackTimer);
            exitFallbackTimer = null;
        }
    }

    function setActiveLink(sectionId) {
        navLinks.forEach(link => {
            const isActive = link.getAttribute("data-section") === sectionId;
            link.classList.toggle("active", isActive);
            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    function hideSection(section) {
        section.classList.remove("is-active", "is-exiting");
        section.hidden = true;
        section.setAttribute("aria-hidden", "true");
    }

    function showSection(section) {
        section.hidden = false;
        section.setAttribute("aria-hidden", "false");
    }

    function revealTopics(section) {
        // Stagger topic reveal for a more dynamic feel
        const topics = Array.from(section.querySelectorAll(".topic"));
        topics.forEach(t => t.classList.remove("reveal"));

        if (prefersReducedMotion) {
            topics.forEach(t => t.classList.add("reveal"));
            return;
        }

        topics.forEach((topic, i) => {
            const timer = setTimeout(() => {
                topic.classList.add("reveal");
            }, 90 * i);
            revealTimers.push(timer);
        });
    }

    function switchSection(sectionId, { updateHash = true } = {}) {
        const next = document.getElementById(sectionId);
        if (!next) return;

        const current =
            (activeId && document.getElementById(activeId)) ||
            sections.find(s => !s.hidden) ||
            null;

        if (current === next) {
            setActiveLink(sectionId);
            if (updateHash) history.replaceState(null, "", `#${sectionId}`);
            return;
        }

        clearTimers();

        // Ensure only the current and next sections are unhidden during transition
        sections.forEach(s => {
            if (s !== current && s !== next) hideSection(s);
        });

        setActiveLink(sectionId);
        if (updateHash) history.replaceState(null, "", `#${sectionId}`);
        activeId = sectionId;

        // No-animation mode
        if (prefersReducedMotion || !current) {
            sections.forEach(s => (s === next ? showSection(s) : hideSection(s)));
            next.classList.add("is-active");
            revealTopics(next);
            return;
        }

        // Prepare next section for entrance
        showSection(next);
        next.classList.remove("is-exiting");
        next.classList.remove("is-active");

        // Force reflow so the transition triggers reliably
        void next.offsetHeight;

        // Animate in
        next.classList.add("is-active");
        revealTopics(next);

        // Animate out current, then hide it
        current.classList.add("is-exiting");
        current.classList.remove("is-active");

        const finishExit = () => {
            hideSection(current);
        };

        current.addEventListener("transitionend", finishExit, { once: true });

        // Fallback in case transitionend doesn't fire
        exitFallbackTimer = setTimeout(() => {
            finishExit();
        }, 450);
    }

    // Click handlers
    navLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const target = link.getAttribute("data-section");
            switchSection(target, { updateHash: true });
        });
    });

    // Hash routing + back/forward support
    function handleHash() {
        const hash = (window.location.hash || "").replace("#", "").trim();
        const initial = hash && document.getElementById(hash) ? hash : "about";
        switchSection(initial, { updateHash: false });
    }

    window.addEventListener("hashchange", handleHash);

    // Initial setup
    sections.forEach(s => {
        if (s.id !== "about") hideSection(s);
    });
    activeId = "about";
    setActiveLink("about");
    revealTopics(document.getElementById("about"));

    // Apply initial hash if present
    handleHash();

    // Lightweight parallax on header image (purely visual)
    if (headerImg && !prefersReducedMotion) {
        let ticking = false;

        function onScroll() {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                const y = window.scrollY || 0;
                const shift = Math.min(y * 0.12, 28);
                const scale = 1.03 + Math.min(y / 2500, 0.03);
                headerImg.style.transform = `translateY(${shift}px) scale(${scale})`;
                ticking = false;
            });
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }
});