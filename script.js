document.addEventListener("DOMContentLoaded", () => {
  const headerNavLinks = Array.from(document.querySelectorAll("header nav a"));
  const sections = Array.from(document.querySelectorAll("main section"));
  const headerImg = document.querySelector(".header-image");

  if (sections.length === 0) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let activeId = null;
  let revealTimers = [];
  let exitFallbackTimer = null;

  function clearTimers() {
    revealTimers.forEach((t) => clearTimeout(t));
    revealTimers = [];
    if (exitFallbackTimer) {
      clearTimeout(exitFallbackTimer);
      exitFallbackTimer = null;
    }
  }

  function getTargetIdFromLink(link) {
    // Priority: data-section -> aria-controls -> href hash -> inline onclick showSection('id')
    const ds = link.getAttribute("data-section");
    if (ds && document.getElementById(ds)) return ds;

    const ac = link.getAttribute("aria-controls");
    if (ac && document.getElementById(ac)) return ac;

    const href = link.getAttribute("href") || "";
    if (href.startsWith("#")) {
      const id = href.slice(1).trim();
      if (id && document.getElementById(id)) return id;
    }

    const onclick = link.getAttribute("onclick") || "";
    const m = onclick.match(/showSection\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (m && m[1] && document.getElementById(m[1])) return m[1];

    return null;
  }

  function setActiveLink(sectionId) {
    headerNavLinks.forEach((link) => {
      const target = getTargetIdFromLink(link);
      const isActive = target === sectionId;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function revealTopics(section) {
    const topics = Array.from(section.querySelectorAll(".topic"));
    topics.forEach((t) => t.classList.remove("reveal"));

    if (prefersReducedMotion) {
      topics.forEach((t) => t.classList.add("reveal"));
      return;
    }

    topics.forEach((topic, i) => {
      const timer = setTimeout(() => topic.classList.add("reveal"), 90 * i);
      revealTimers.push(timer);
    });
  }

  function hideSection(section) {
    section.classList.remove("is-active");
    section.hidden = true;
    section.setAttribute("aria-hidden", "true");
  }

  function showSectionEl(section) {
    section.hidden = false;
    section.setAttribute("aria-hidden", "false");
    // reflow to ensure transition triggers
    void section.offsetHeight;
    section.classList.add("is-active");
  }

  function switchSection(sectionId, { updateUrl = true } = {}) {
    const next = document.getElementById(sectionId);
    if (!next) return;

    const current = activeId ? document.getElementById(activeId) : null;
    if (current === next) {
      setActiveLink(sectionId);
      return;
    }

    clearTimers();

    // Ensure only current/next are visible during transition
    sections.forEach((s) => {
      if (s !== current && s !== next) hideSection(s);
    });

    setActiveLink(sectionId);
    activeId = sectionId;

    // Update URL without jump/scroll
    if (updateUrl) {
      history.pushState(null, "", `#${sectionId}`);
    }

    // If no current (first load) or reduced motion, swap instantly
    if (!current || prefersReducedMotion) {
      sections.forEach((s) => (s === next ? showSectionEl(s) : hideSection(s)));
      revealTopics(next);
      return;
    }

    // Show next first (so it can animate in)
    showSectionEl(next);
    revealTopics(next);

    // Animate current out, then hide
    current.classList.remove("is-active");

    const finish = () => {
      hideSection(current);
    };

    current.addEventListener("transitionend", finish, { once: true });

    // Fallback in case transitionend doesn't fire
    exitFallbackTimer = setTimeout(finish, 450);
  }

  function idFromLocation() {
    const raw = (window.location.hash || "").replace("#", "").trim();
    return raw && document.getElementById(raw) ? raw : sections[0].id;
  }

  // Make inline onclick="showSection('about')" still work
  window.showSection = (id) => {
    if (!id || !document.getElementById(id)) return;
    switchSection(id, { updateUrl: true });
  };

  // Click handlers for header nav
  headerNavLinks.forEach((link) => {
    const targetId = getTargetIdFromLink(link);
    if (!targetId) return;

    // Normalize attributes so styling/logic is consistent
    link.setAttribute("data-section", targetId);
    link.setAttribute("href", `#${targetId}`);

    link.addEventListener("click", (e) => {
      e.preventDefault();
      switchSection(targetId, { updateUrl: true });
    });
  });

  // Back/forward
  window.addEventListener("popstate", () => {
    switchSection(idFromLocation(), { updateUrl: false });
  });

  // Initialize
  sections.forEach((s) => hideSection(s));
  switchSection(idFromLocation(), { updateUrl: false });

  // Lightweight parallax on header image (visual only)
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
