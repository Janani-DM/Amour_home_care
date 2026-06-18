// ═══════════════════════════════════════
// KSK Farmos GmbH & Co. KG — main.js v3.0
// Fully calibrated: lang, FAQ, i18n icons
// ═══════════════════════════════════════

// ── i18n Translation Engine ─────────────────────────────
const I18N = {
  current: localStorage.getItem('ksk-lang') || 'de',
  cache: {},
  codes: ['de','en','ru','tr','pl','ro','bg','ua','ar','bs'],
  labels: {de:'Deutsch',en:'English',ru:'Русский',tr:'Türkçe',pl:'Polski',ro:'Română',bg:'Български',ua:'Українська',ar:'العربية',bs:'Bosanski'},

  async load(lang) {
    if (this.cache[lang]) return this.cache[lang];
    try {
      const r = await fetch(`i18n/${lang}.json?v=${Date.now()}`);
      if (!r.ok) return null;
      const data = await r.json();
      this.cache[lang] = data;
      return data;
    } catch(e) { return null; }
  },

  apply(data) {
    if (!data) return;
    // Restore hero titles/subtitles to original structure before translating,
    // so that their inner [data-i18n] spans are present in the DOM for translation.
    document.querySelectorAll('.hero-title, .hero-subtitle').forEach(el => {
      if (el.dataset.originalHtml) {
        el.innerHTML = el.dataset.originalHtml;
        el.style.fontSize = '';
        delete el.dataset.originalHtml;
      }
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (data[key] === undefined) return;
      // INPUT → placeholder
      if (el.tagName === 'INPUT' && el.type !== 'checkbox') {
        el.placeholder = data[key];
        return;
      }
      // OPTION → just textContent
      if (el.tagName === 'OPTION') {
        el.textContent = data[key];
        return;
      }
      // Collect ALL child element nodes to preserve (icons, checkboxes, chevrons)
      // excluding children that themselves have data-i18n (they get translated separately)
      const children = Array.from(el.childNodes);
      const preserved = [];
      const positions = []; // 'before' or 'after' relative to first text node
      let foundText = false;
      children.forEach(n => {
        if (n.nodeType === Node.ELEMENT_NODE && !n.hasAttribute('data-i18n')) {
          preserved.push(n);
          positions.push(foundText ? 'after' : 'before');
        } else if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
          foundText = true;
        }
      });
      // Replace content
      const hasTags = data[key].includes('<') && data[key].includes('>');
      if (hasTags) {
        el.innerHTML = data[key];
      } else {
        el.textContent = data[key];
        // Restore preserved elements in correct positions
        if (preserved.length > 0) {
          const beforeEls = [];
          const afterEls = [];
          preserved.forEach((child, i) => {
            if (positions[i] === 'before') beforeEls.push(child);
            else afterEls.push(child);
          });
          // Prepend 'before' elements (e.g., checkbox, icon before text)
          for (let i = beforeEls.length - 1; i >= 0; i--) {
            el.prepend(' ');
            el.prepend(beforeEls[i]);
          }
          // Append 'after' elements (e.g., arrow-right icon after text)
          afterEls.forEach(child => {
            el.append(' ');
            el.appendChild(child);
          });
        }
      }
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (data[key] !== undefined) el.placeholder = data[key];
    });
    adjustHeroTitles();
  },

  // Helper: grab first and last icon from the float button (works for both <i> and <svg>)
  _getFloatIcons(floatBtn) {
    const allIcons = floatBtn.querySelectorAll('i, svg');
    if (allIcons.length === 0) return { icon1: null, icon2: null };
    return {
      icon1: allIcons[0] || null,
      icon2: allIcons.length > 1 ? allIcons[allIcons.length - 1] : null
    };
  },

  async switchTo(lang) {
    const data = await this.load(lang);
    if (!data) return;
    this.current = lang;
    localStorage.setItem('ksk-lang', lang);
    this.apply(data);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    const floatBtn = document.getElementById('langFloatBtn');
    if (floatBtn) {
      const { icon1, icon2 } = this._getFloatIcons(floatBtn);
      floatBtn.textContent = '';
      if (icon1) floatBtn.appendChild(icon1);
      floatBtn.append(` ${lang.toUpperCase()} `);
      if (icon2) floatBtn.appendChild(icon2);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    document.querySelectorAll('#langDropdown a[data-lang]').forEach(a => {
      a.classList.remove('active');
      if (a.dataset.lang === lang) a.classList.add('active');
    });
  },

  async init() {
    if (this.current !== 'de') {
      const data = await this.load(this.current);
      if (data) {
        this.apply(data);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        // Update direction for RTL
        if (this.current === 'ar') document.documentElement.dir = 'rtl';
        document.documentElement.lang = this.current === 'ua' ? 'uk' : this.current;
      }
    }
    // Always sync floating button and lang-grid
    const floatBtn = document.getElementById('langFloatBtn');
    if (floatBtn) {
      const { icon1, icon2 } = this._getFloatIcons(floatBtn);
      floatBtn.textContent = '';
      if (icon1) floatBtn.appendChild(icon1);
      floatBtn.append(` ${this.current.toUpperCase()} `);
      if (icon2) floatBtn.appendChild(icon2);
    }
    document.querySelectorAll('#langDropdown a[data-lang]').forEach(a => {
      a.classList.remove('active');
      if (a.dataset.lang === this.current) a.classList.add('active');
    });
  }
};

function adjustHeroTitles() {
  const isMobile = window.innerWidth <= 992;

  // Helper to split text into N lines by words as evenly as possible
  function splitTextIntoLines(text, lineCount) {
    const words = text.trim().split(/\s+/);
    if (words.length <= lineCount) {
      const res = [];
      for (let i = 0; i < lineCount; i++) {
        res.push(words[i] || '');
      }
      return res;
    }
    const totalChars = text.length;
    const targetLineLen = totalChars / lineCount;
    const lines = [];
    let currentWordIdx = 0;

    for (let l = 0; l < lineCount; l++) {
      if (l === lineCount - 1) {
        lines.push(words.slice(currentWordIdx).join(' '));
        break;
      }
      let lineText = "";
      while (currentWordIdx < words.length) {
        const nextWord = words[currentWordIdx];
        if (lineText === "") {
          lineText = nextWord;
          currentWordIdx++;
        } else {
          const currentDiff = Math.abs(lineText.length - targetLineLen);
          const nextDiff = Math.abs((lineText + " " + nextWord).length - targetLineLen);
          const remainingWords = words.length - (currentWordIdx + 1);
          const remainingLines = lineCount - (l + 1);
          if (remainingWords < remainingLines) {
            break;
          }
          if (nextDiff < currentDiff || (lineText + " " + nextWord).length <= targetLineLen) {
            lineText += " " + nextWord;
            currentWordIdx++;
          } else {
            break;
          }
        }
      }
      lines.push(lineText);
    }
    return lines;
  }

  // Helper to highlight italic words in German
  function wrapItalic(text) {
    const italics = [
      "die ankommt.",
      "Leistungen",
      "seit 2013",
      "wirklich zählt.",
      "Fragen",
      "aufnehmen",
      "an kommt.",
      "wirklich zaehlt."
    ];
    let result = text;
    italics.forEach(it => {
      const regex = new RegExp(it.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      result = result.replace(regex, (match) => `<em>${match}</em>`);
    });
    return result;
  }

  // Helper to highlight italic words dynamically (works for any language)
  function wrapItalicDynamic(text, italicPhrases) {
    if (!italicPhrases || italicPhrases.length === 0) return text;
    let result = text;
    italicPhrases.forEach(phrase => {
      const regex = new RegExp(phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      result = result.replace(regex, (match) => `<em>${match}</em>`);
    });
    return result;
  }

  document.querySelectorAll('.hero-title').forEach(title => {
    if (!isMobile) {
      title.style.fontSize = '';
      if (title.dataset.originalHtml) {
        title.innerHTML = title.dataset.originalHtml;
        delete title.dataset.originalHtml;
      }
      return;
    }

    if (!title.dataset.originalHtml) {
      title.dataset.originalHtml = title.innerHTML;
    }

    // Clean up content to get raw text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = title.dataset.originalHtml;
    // Extract italic phrases from <em> elements in the original HTML
    const italicPhrases = [];
    tempDiv.querySelectorAll('em').forEach(em => {
      const t = em.textContent.trim();
      if (t) italicPhrases.push(t);
    });
    tempDiv.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    const rawText = tempDiv.textContent.replace(/\s+/g, ' ').trim();

    // Split into exactly two lines
    const lines = splitTextIntoLines(rawText, 2);
    const line1Html = wrapItalicDynamic(lines[0], italicPhrases);
    const line2Html = wrapItalicDynamic(lines[1], italicPhrases);

    title.innerHTML = `
      <span class="ht-line" style="display: block !important; white-space: nowrap !important; overflow: visible !important;">${line1Html}</span>
      <span class="ht-line" style="display: block !important; white-space: nowrap !important; overflow: visible !important;">${line2Html}</span>
    `;

    // Measure and scale font-size to stretch to edges
    const container = title.closest('.hero-content') || title.parentElement;
    const containerWidth = container ? container.clientWidth - 32 : window.innerWidth - 32;

    const tester = document.createElement('span');
    tester.style.fontFamily = getComputedStyle(title).fontFamily;
    tester.style.fontWeight = getComputedStyle(title).fontWeight;
    tester.style.fontSize = '30px';
    tester.style.position = 'absolute';
    tester.style.visibility = 'hidden';
    tester.style.whiteSpace = 'nowrap';
    document.body.appendChild(tester);

    tester.textContent = lines[0];
    const w1 = tester.offsetWidth;
    tester.textContent = lines[1];
    const w2 = tester.offsetWidth;
    document.body.removeChild(tester);

    const maxWLine = Math.max(w1, w2);
    if (maxWLine > 0 && containerWidth > 0) {
      let targetFs = (containerWidth / maxWLine) * 30;
      targetFs = Math.max(22, Math.min(targetFs, 42));
      title.style.setProperty('font-size', targetFs + 'px', 'important');
    }
  });

  document.querySelectorAll('.hero-subtitle').forEach(sub => {
    if (!isMobile) {
      sub.style.fontSize = '';
      if (sub.dataset.originalHtml) {
        sub.innerHTML = sub.dataset.originalHtml;
        delete sub.dataset.originalHtml;
      }
      return;
    }

    if (!sub.dataset.originalHtml) {
      sub.dataset.originalHtml = sub.innerHTML;
    }

    const rawText = sub.textContent.replace(/\s+/g, ' ').trim();
    // Split into exactly three lines
    const lines = splitTextIntoLines(rawText, 3);

    sub.innerHTML = `
      <span class="sub-line" style="display: block !important; white-space: nowrap !important; overflow: visible !important;">${lines[0]}</span>
      <span class="sub-line" style="display: block !important; white-space: nowrap !important; overflow: visible !important;">${lines[1]}</span>
      <span class="sub-line" style="display: block !important; white-space: nowrap !important; overflow: visible !important;">${lines[2]}</span>
    `;

    // Measure and scale subtitle font-size
    const container = sub.closest('.hero-content') || sub.parentElement;
    const containerWidth = container ? container.clientWidth - 32 : window.innerWidth - 32;

    const tester = document.createElement('span');
    tester.style.fontFamily = getComputedStyle(sub).fontFamily;
    tester.style.fontSize = '16px';
    tester.style.position = 'absolute';
    tester.style.visibility = 'hidden';
    tester.style.whiteSpace = 'nowrap';
    document.body.appendChild(tester);

    tester.textContent = lines[0];
    const w1 = tester.offsetWidth;
    tester.textContent = lines[1];
    const w2 = tester.offsetWidth;
    tester.textContent = lines[2];
    const w3 = tester.offsetWidth;
    document.body.removeChild(tester);

    const maxWLine = Math.max(w1, w2, w3);
    if (maxWLine > 0 && containerWidth > 0) {
      let targetFs = (containerWidth / maxWLine) * 16;
      targetFs = Math.max(11, Math.min(targetFs, 15));
      sub.style.setProperty('font-size', targetFs + 'px', 'important');
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  // Lock heights of heroes and edge photo sections on mobile to prevent layout jumps when address bar collapses
  const isMobileInit = window.innerWidth <= 992;
  if (isMobileInit) {
    let lastWidth = window.innerWidth;
    const lockHeights = () => {
      document.querySelectorAll('.hero, .hero-cutout, .hero-inner, .edge-photo-frame').forEach(el => {
        el.style.height = '';
        el.style.minHeight = '';
        const h = el.getBoundingClientRect().height;
        if (el.classList.contains('edge-photo-frame')) {
          el.style.setProperty('height', h + 'px', 'important');
        } else {
          el.style.setProperty('min-height', h + 'px', 'important');
          el.style.setProperty('height', h + 'px', 'important');
        }
      });
      document.querySelectorAll('.section-edge-photo').forEach(el => {
        el.style.paddingTop = '';
        el.style.paddingBottom = '';
        const computedStyle = window.getComputedStyle(el);
        const paddingTop = computedStyle.paddingTop;
        const paddingBottom = computedStyle.paddingBottom;
        el.style.setProperty('padding-top', paddingTop, 'important');
        el.style.setProperty('padding-bottom', paddingBottom, 'important');
      });
    };
    lockHeights();
    window.addEventListener('resize', () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        lockHeights();
      }
    }, { passive: true });
  }

  // ── COOKIE BANNER ──────────────────────────────────────────────
  if (!localStorage.getItem('ksk-cookies')) {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-content">
        <h3 data-i18n="cookie.title">Wir verwenden Cookies</h3>
        <p><span data-i18n="cookie.desc">Wir nutzen Cookies, um unsere Dienste bereitzustellen und Ihre Erfahrungen zu verbessern. Mit Klick auf "Alle akzeptieren" stimmen Sie der Nutzung zu. Weitere Informationen finden Sie in unserer </span><a href="datenschutz.html" data-i18n="footer.datenschutz">Datenschutzerklärung</a>.</p>
      </div>
      <div class="cookie-actions">
        <button class="btn btn-outline" id="cookieReject" data-i18n="cookie.reject">Nur Notwendige</button>
        <button class="btn btn-primary" id="cookieAccept" data-i18n="cookie.accept">Alle akzeptieren</button>
      </div>
    `;
    document.body.appendChild(banner);
    
    // Translate if needed right away
    if (I18N.current !== 'de') {
      I18N.load(I18N.current).then(data => I18N.apply(data));
    }

    const closeBanner = (val) => {
      localStorage.setItem('ksk-cookies', val);
      banner.classList.add('hidden');
      setTimeout(() => banner.remove(), 400);
    };

    document.getElementById('cookieAccept').addEventListener('click', () => closeBanner('all'));
    document.getElementById('cookieReject').addEventListener('click', () => closeBanner('essential'));
  }

  // ── 1. Header scroll behavior ──────────────────────────
  const header = document.getElementById('header');
  if (header && document.querySelector('.hero-cutout')) {
    header.classList.add('header-transparent-allowed');
  }
  let isScrolled = false;
  const handleScroll = () => {
    const shouldScroll = window.scrollY > 40;
    if (shouldScroll !== isScrolled) {
      isScrolled = shouldScroll;
      if (header) {
        if (isScrolled) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      }
    }
  };
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // ── 2. Scroll reveal (IntersectionObserver) ───────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
    .forEach(el => revealObserver.observe(el));

  // ── 3. Counter animation ───────────────────────────────
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const duration = 1800;
    const startTime = performance.now();
    const isDecimal = target % 1 !== 0;
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = isDecimal
        ? current.toFixed(1).replace('.', ',')
        : Math.round(current);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.count) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]')
    .forEach(el => counterObserver.observe(el));

  // ── 4. Mobile menu ─────────────────────────────────────
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      mobileToggle.classList.toggle('open', isOpen);
      if (header) header.classList.toggle('menu-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        if (mobileToggle) mobileToggle.classList.remove('open');
        if (header) header.classList.remove('menu-open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── 5. Mega menu hover (desktop) ───────────────────────
  document.querySelectorAll('.nav-mega').forEach(mega => {
    let timeout;
    mega.addEventListener('mouseenter', () => {
      clearTimeout(timeout);
      mega.classList.add('open');
    });
    mega.addEventListener('mouseleave', () => {
      timeout = setTimeout(() => mega.classList.remove('open'), 200);
    });
  });

  // ── 6. (Removed — replaced by floating lang pill in §15) ──

  // ── 7. FAQ accordion ───────────────────────────────────
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const item = btn.closest('.faq-item');
      if (!item) return;
      
      const answer = item.querySelector('.faq-answer');
      if (!answer) return;
      
      const isOpen = item.classList.contains('open');

      // Close all open items
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        const openAnswer = openItem.querySelector('.faq-answer');
        if (openAnswer) {
          // If we had set maxHeight to 'none' for responsiveness, restore the actual scrollHeight first
          if (openAnswer.style.maxHeight === 'none') {
            openAnswer.style.maxHeight = openAnswer.scrollHeight + 'px';
          }
          // Force layout reflow
          openAnswer.offsetHeight;
          // Set to 0 to trigger close transition
          openAnswer.style.maxHeight = '0px';
        }
        openItem.classList.remove('open');
      });

      // Open clicked item
      if (!isOpen) {
        // Explicitly set starting height to 0
        answer.style.maxHeight = '0px';
        // Force layout reflow
        answer.offsetHeight;
        // Add open class and set ending height to trigger transition
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        
        // After transition completes, set max-height to none so content wraps responsively on resize
        setTimeout(() => {
          if (item.classList.contains('open')) {
            answer.style.maxHeight = 'none';
          }
        }, 450);
      }

      // Notify Lenis of height change to prevent scroll jitter after transition finishes
      if (window.lenis) {
        setTimeout(() => {
          if (window.lenis) window.lenis.resize();
        }, 450);
      }
    });
  });

  // ── 8. Back to top button ──────────────────────────────
  const backToTop = document.getElementById('backToTop');
  let isBackToTopVisible = false;
  const toggleBackToTop = () => {
    const shouldShow = window.scrollY > 600;
    if (shouldShow !== isBackToTopVisible) {
      isBackToTopVisible = shouldShow;
      if (backToTop) {
        if (isBackToTopVisible) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');
      }
    }
  };
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  
  // Initialize Lenis Smooth Scroll
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.1,
      syncTouch: false,
      syncTouchIntent: false,
      smoothTouch: false
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    window.lenis = lenis;

    // Hero scroll parallax — smooth zoom from center
    function initParallax() {
      const heroPhotos = document.querySelectorAll('.hero-home-photo');
      if (heroPhotos.length === 0) return;

      let lastScale = -1;

      function render() {
        const isMobile = window.innerWidth <= 992;
        if (isMobile) {
          heroPhotos.forEach(img => {
            img.style.transform = 'none';
          });
          return;
        }

        // Use scrollY directly — works for both sticky (mobile) and non-sticky (desktop) heroes
        const scrollY = lenis.scroll !== undefined ? lenis.scroll : window.scrollY;
        const vh = window.innerHeight;

        // Skip calculations if past viewport or scrolled up on bounce
        if (scrollY < 0) return;
        
        const progress = Math.min(scrollY / vh, 1);
        const scale = 1.0 + progress * 0.12;

        if (Math.abs(scale - lastScale) < 0.0002) return;
        lastScale = scale;

        const scaleStr = scale.toFixed(4);

        heroPhotos.forEach(img => {
          img.style.transform = `scale(${scaleStr})`;
        });
      }

      lenis.on('scroll', render);
      window.addEventListener('resize', render, { passive: true });
      render(); // initial state on load
    }

    initParallax();
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ── 9. Smooth scroll для якорей (Lenis) ─────────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      // Skip language switcher links
      if (link.closest('.lang-float')) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -100 });
        } else {
          const offset = 100;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

  // ── 10. Form handling (handled individually in pages) ──


  // ── 11. Initialize Lucide icons ────────────────────────
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  function validatePanel(panelNum) {
    const panel = document.querySelector(`[data-panel="${panelNum}"]`);
    if (!panel) return true;
    
    const inputs = panel.querySelectorAll('input[required], select[required], textarea[required], select');
    let isValid = true;
    let firstInvalid = null;
    
    // Remove any existing alerts
    const existingAlert = panel.querySelector('.form-alert');
    if (existingAlert) existingAlert.remove();
    
    inputs.forEach(input => {
      input.classList.remove('is-invalid');
      
      let isFieldValid = true;
      if (input.tagName === 'SELECT' && input.name !== 'fuehrerschein' && input.value === '') {
        isFieldValid = false;
      } else if (!input.checkValidity()) {
        isFieldValid = false;
      }
      
      if (!isFieldValid) {
        isValid = false;
        input.classList.add('is-invalid');
        if (!firstInvalid) firstInvalid = input;
      }
    });
    
    if (!isValid) {
      const alertDiv = document.createElement('div');
      alertDiv.className = 'form-alert form-alert-warning';
      
      const lang = document.documentElement.lang || 'de';
      let msg = 'Bitte füllen Sie alle erforderlichen Felder aus.';
      if (lang === 'ru') msg = 'Пожалуйста, заполните все обязательные поля.';
      if (lang === 'en') msg = 'Please fill in all required fields.';
      
      alertDiv.innerHTML = `
        <svg class="form-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>${msg}</div>
      `;
      
      const title = panel.querySelector('h3');
      if (title) {
        title.parentNode.insertBefore(alertDiv, title.nextSibling);
      } else {
        panel.insertBefore(alertDiv, panel.firstChild);
      }
      
      if (firstInvalid) firstInvalid.focus();
    }
    
    return isValid;
  }

  // ── 12. Wizard form (karriere.html / schnellbewerbung.html) ───────────────────
  window.wizardNext = function(step) {
    const currentPanel = document.querySelector('.wizard-panel.active');
    const currentStep = currentPanel ? parseInt(currentPanel.dataset.panel) : 1;
    
    if (step > currentStep) {
      if (!validatePanel(currentStep)) {
        return;
      }
    }
    
    // Clear alerts on next panel
    const targetPanel = document.querySelector(`[data-panel="${step}"]`);
    if (targetPanel) {
      const existingAlert = targetPanel.querySelector('.form-alert');
      if (existingAlert) existingAlert.remove();
    }

    document.querySelectorAll('.wizard-panel').forEach(p => {
      p.classList.remove('active');
    });
    const target = document.querySelector(`[data-panel="${step}"]`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.wizard-dot').forEach(d => {
      const s = parseInt(d.dataset.step);
      d.classList.remove('done', 'active', 'pending');
      if (s < step) d.classList.add('done');
      else if (s === step) d.classList.add('active');
      else d.classList.add('pending');
    });
    document.querySelectorAll('.wizard-line').forEach((line, i) => {
      line.classList.toggle('done', i < step - 1);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  };


  // ── 13. FAQ Search ────────────────────────────────────
  const faqSearch = document.getElementById('faqSearch');
  if (faqSearch) {
    faqSearch.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      document.querySelectorAll('.faq-item').forEach(item => {
        const span = item.querySelector('.faq-question span');
        const text = span ? span.textContent.toLowerCase() : '';
        item.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // ── 14. FAQ Category Filter ───────────────────────────
  document.querySelectorAll('.faq-cat').forEach(cat => {
    cat.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.faq-cat').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const category = this.dataset.cat;
      document.querySelectorAll('.faq-item').forEach(item => {
        if (category === 'alle') {
          item.style.display = '';
        } else {
          item.style.display = item.dataset.category === category ? '' : 'none';
        }
      });
    });
  });

  // ── 15. Floating Lang Dropdown ──────────────────────────
  const langBtn = document.getElementById('langFloatBtn');
  const langDropdown = document.getElementById('langDropdown');

  if (langBtn && langDropdown) {
    langBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      langDropdown.classList.toggle('open');
    });
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
        langDropdown.classList.remove('open');
      }
    });
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') langDropdown.classList.remove('open');
    });
    langDropdown.querySelectorAll('a[data-lang]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        I18N.switchTo(a.dataset.lang);
        langDropdown.classList.remove('open');
      });
    });
  }

  // ── 16. Anchor Nav Scroll Spy (leistungen.html) ───────
  const anchorPills = document.querySelectorAll('.anchor-pill');
  if (anchorPills.length > 0) {
    const sections = [];
    anchorPills.forEach(pill => {
      const href = pill.getAttribute('href');
      if (href && href.startsWith('#')) {
        const el = document.getElementById(href.slice(1));
        if (el) sections.push({ el, pill });
      }
    });
    if (sections.length > 0) {
      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY + 200;
        let current = sections[0];
        sections.forEach(s => {
          if (s.el.offsetTop <= scrollY) current = s;
        });
        anchorPills.forEach(p => p.classList.remove('active'));
        current.pill.classList.add('active');
      });
    }
  }

  // ── 16.5. Team Slider Observer ───────────────────────
  const teamGrid = document.getElementById('teamGrid');
  const prevBtn = document.querySelector('.slider-arrow.prev');
  const nextBtn = document.querySelector('.slider-arrow.next');

  if (teamGrid && prevBtn && nextBtn) {
    let isPrevDisabled = null;
    let isNextDisabled = null;

    const updateArrows = () => {
      const scrollLeft = teamGrid.scrollLeft;
      const maxScroll = teamGrid.scrollWidth - teamGrid.clientWidth;
      
      const shouldDisablePrev = scrollLeft <= 5;
      const shouldDisableNext = scrollLeft >= maxScroll - 5;
      
      if (shouldDisablePrev !== isPrevDisabled) {
        isPrevDisabled = shouldDisablePrev;
        prevBtn.disabled = isPrevDisabled;
        prevBtn.style.opacity = isPrevDisabled ? '0.35' : '1';
        prevBtn.style.pointerEvents = isPrevDisabled ? 'none' : 'auto';
      }

      if (shouldDisableNext !== isNextDisabled) {
        isNextDisabled = shouldDisableNext;
        nextBtn.disabled = isNextDisabled;
        nextBtn.style.opacity = isNextDisabled ? '0.35' : '1';
        nextBtn.style.pointerEvents = isNextDisabled ? 'none' : 'auto';
      }
    };

    teamGrid.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows, { passive: true });
    
    // Initial check
    setTimeout(updateArrows, 100);
  }

  // ── 17. i18n Init ─────────────────────────────────────
  I18N.init();

  // ── 18. Initialize all icons ──────────────────────────
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Adjust hero titles on page load, font load, window load and resize
  adjustHeroTitles();
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(adjustHeroTitles, 80);
  }, { passive: true });
  window.addEventListener('load', adjustHeroTitles);
  if (document.fonts) {
    document.fonts.ready.then(adjustHeroTitles);
  }
  // Safety checks for layout shifts or slower font rendering
  setTimeout(adjustHeroTitles, 100);
  setTimeout(adjustHeroTitles, 400);
  setTimeout(adjustHeroTitles, 1000);

});

