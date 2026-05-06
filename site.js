(() => {
  const STORAGE_KEY = "intusketch_lang";
  /** Set when the visitor picks a language from the dropdown — then we keep it until they clear site data. */
  const MANUAL_KEY = "intusketch_lang_manual";
  const LOCALES = ["en", "ru", "de", "es", "zh", "ko"];

  const normalizeLang = (raw) => {
    if (raw == null || typeof raw !== "string") return null;
    const s = raw.trim().toLowerCase().replace(/_/g, "-");
    if (LOCALES.includes(s)) return s;
    if (s === "zh-hans" || s === "zh-cn" || s.startsWith("zh-hans")) return "zh";
    if (s.startsWith("zh")) return "zh";
    const base = s.split("-")[0];
    if (LOCALES.includes(base)) return base;
    return null;
  };

  /** First supported match from the browser / OS preference list; otherwise null (caller falls back to en). */
  const detectSystemLang = () => {
    const candidates = [];
    if (Array.isArray(navigator.languages) && navigator.languages.length) {
      candidates.push(...navigator.languages);
    }
    if (navigator.language) candidates.push(navigator.language);
    if (navigator.userLanguage) candidates.push(navigator.userLanguage);
    for (const raw of candidates) {
      const n = normalizeLang(raw);
      if (n) return n;
    }
    return null;
  };

  const htmlLang = (code) => (code === "zh" ? "zh-Hans" : code);

  const params = new URLSearchParams(window.location.search);
  const urlLang = normalizeLang(params.get("lang"));

  let currentLang;
  if (urlLang) {
    currentLang = urlLang;
  } else if (window.localStorage.getItem(MANUAL_KEY) === "1") {
    currentLang = normalizeLang(window.localStorage.getItem(STORAGE_KEY)) || "en";
  } else {
    currentLang = detectSystemLang() || "en";
  }

  const dict = () => {
    const root = window.INTUSKETCH_I18N || {};
    return root[currentLang] || root.en || {};
  };

  const t = (key) => {
    const d = dict();
    if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    const en = (window.INTUSKETCH_I18N || {}).en || {};
    return Object.prototype.hasOwnProperty.call(en, key) ? en[key] : key;
  };

  const setMeta = (selector, content) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", content);
  };

  const applyMailto = () => {
    document.querySelectorAll("[data-i18n-mailto]").forEach((el) => {
      const mailKey = el.getAttribute("data-i18n-mailto");
      if (!mailKey) return;
      const sub = encodeURIComponent(t(`${mailKey}_subject`));
      const body = encodeURIComponent(t(`${mailKey}_body`));
      el.setAttribute("href", `mailto:intusketch@gmail.com?subject=${sub}&body=${body}`);
    });
  };

  const withLangQuery = (href) => {
    if (
      !href ||
      href === "#" ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("http://") ||
      href.startsWith("https://")
    )
      return href;
    try {
      const u = new URL(href, window.location.href);
      if (u.origin !== window.location.origin) return href;
      u.searchParams.set("lang", currentLang);
      return u.pathname + u.search + u.hash;
    } catch {
      return href;
    }
  };

  const syncAnchorLangParams = () => {
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      const next = withLangQuery(href);
      if (next !== href) a.setAttribute("href", next);
    });
  };

  const applyTranslations = () => {
    document.documentElement.lang = htmlLang(currentLang);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.hasAttribute("data-i18n-attr")) return;
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (key) el.innerHTML = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) el.setAttribute("placeholder", t(key));
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const attr = el.getAttribute("data-i18n-attr");
      const key = el.getAttribute("data-i18n");
      if (attr && key) el.setAttribute(attr, t(key));
    });

    const page = document.body && document.body.getAttribute("data-page");
    if (page === "landing") {
      document.title = t("l_meta_title");
      setMeta('meta[name="description"]', t("l_meta_desc"));
      setMeta('meta[property="og:description"]', t("l_og_desc"));
    } else if (page === "privacy") {
      document.title = t("p_meta_title");
      setMeta('meta[name="description"]', t("p_meta_desc"));
    } else if (page === "terms") {
      document.title = t("t_meta_title");
      setMeta('meta[name="description"]', t("t_meta_desc"));
    } else if (page === "support") {
      document.title = t("s_meta_title");
      setMeta('meta[name="description"]', t("s_meta_desc"));
    }

    applyMailto();
    syncAnchorLangParams();
  };

  const syncLangToUrl = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("lang") === currentLang) return;
    url.searchParams.set("lang", currentLang);
    window.history.replaceState(null, "", url);
  };

  const fillLangSelect = () => {
    const sel = document.querySelector("[data-lang-select]");
    if (!sel) return;
    sel.innerHTML = "";
    for (const code of LOCALES) {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = t(`lang_label_${code}`);
      sel.appendChild(opt);
    }
    sel.value = LOCALES.includes(currentLang) ? currentLang : "en";
    sel.setAttribute("aria-label", t("lang_select_aria"));
  };

  const wireLangSelect = () => {
    const sel = document.querySelector("[data-lang-select]");
    if (!sel || sel.dataset.langWired === "1") return;
    sel.dataset.langWired = "1";
    sel.addEventListener("change", () => {
      const next = normalizeLang(sel.value);
      if (!next) return;
      currentLang = next;
      window.localStorage.setItem(STORAGE_KEY, currentLang);
      window.localStorage.setItem(MANUAL_KEY, "1");
      syncLangToUrl();
      applyTranslations();
      fillLangSelect();
    });
  };

  syncLangToUrl();
  applyTranslations();
  fillLangSelect();
  wireLangSelect();

  const header = document.querySelector("[data-site-header]");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const revealNodes = document.querySelectorAll(".reveal");
  const staggerNodes = document.querySelectorAll(".reveal-stagger");
  const observeReveal = (elements, options, className = "is-visible") => {
    if (!elements.length) return;
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add(className));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add(className);
          observer.unobserve(entry.target);
        }
      },
      options
    );
    elements.forEach((el) => observer.observe(el));
  };

  observeReveal(revealNodes, { threshold: 0.12, rootMargin: "0px 0px -6%" });

  document.querySelectorAll(".timeline").forEach((timeline) => {
    const items = timeline.querySelectorAll(".reveal-stagger");
    observeReveal(items, { threshold: 0.22, rootMargin: "0px 0px -4%" });
  });

  const strayStagger = [...staggerNodes].filter(
    (node) => !node.closest(".timeline")
  );
  observeReveal(strayStagger, { threshold: 0.18, rootMargin: "0px 0px -6%" });

  const dual = document.querySelector("[data-dual-canvas]");
  if (dual && window.matchMedia("(pointer: fine) and (min-width: 900px)").matches) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      window.addEventListener(
        "pointermove",
        (event) => {
          const x = (event.clientX / window.innerWidth - 0.5) * 14;
          const y = (event.clientY / window.innerHeight - 0.5) * 10;
          dual.style.transform = `perspective(1200px) rotateY(${x * -0.15}deg) rotateX(${y * 0.12}deg) translateZ(0)`;
        },
        { passive: true }
      );
      window.addEventListener(
        "pointerleave",
        () => {
          dual.style.transform = "";
        },
        { passive: true }
      );
    }
  }
})();
