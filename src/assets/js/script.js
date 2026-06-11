// Rio Alto — interaction engine
// 3D hero scene (mouse + scroll parallax), reveal-on-scroll, tilt cards,
// animated counters, menu scrollspy, gallery filters + Fancybox.

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktop = () => window.innerWidth >= 941;

  /* ----------------------------------------------------------------------
     Lenis — inertia smooth scrolling (desktop, fine pointer only)
     ---------------------------------------------------------------------- */
  if (window.Lenis && desktop() && finePointer && !reducedMotion) {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) lenis.on('scroll', () => window.ScrollTrigger.update());
    // anchor links scroll through Lenis so they inherit the easing
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(a => {
      const hash = a.getAttribute('href').replace(/^\//, '');
      if (hash.length > 1 && document.querySelector(hash)) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          lenis.scrollTo(hash, { offset: -90 });
        });
      }
    });
  }

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (navToggle && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.classList.toggle('is-open', open);
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    navToggle.addEventListener('click', () => {
      setMenu(!mobileMenu.classList.contains('is-open'));
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenu(false));
    });
  }

  /* ----------------------------------------------------------------------
     Header scroll state
     ---------------------------------------------------------------------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    const handleScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /* ----------------------------------------------------------------------
     Scroll-to-top FAB
     ---------------------------------------------------------------------- */
  const scrollBtn = document.getElementById('scrollToTopFb');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------------------
     Reveal-on-scroll ([data-reveal])
     ---------------------------------------------------------------------- */
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (reducedMotion) {
      reveals.forEach(el => el.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -70px 0px', threshold: 0.08 });

      reveals.forEach(el => revealObserver.observe(el));
    }
  }

  /* ----------------------------------------------------------------------
     Animated counters ([data-count])
     ---------------------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const runCounter = (el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      if (reducedMotion) {
        el.textContent = target.toFixed(decimals);
        return;
      }
      const duration = 1700;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(el => countObserver.observe(el));
  }

  /* ----------------------------------------------------------------------
     3D tilt cards ([data-tilt] + .tilt-glare)
     ---------------------------------------------------------------------- */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const maxTilt = 9;
      let rafId = null;

      card.addEventListener('mousemove', (e) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          const rx = (0.5 - py) * maxTilt;
          const ry = (px - 0.5) * maxTilt;
          card.style.transform =
            'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(6px)';
          card.style.setProperty('--glare-x', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--glare-y', (py * 100).toFixed(1) + '%');
          rafId = null;
        });
      });

      card.addEventListener('mouseleave', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        card.style.transform = '';
      });
    });
  }

  /* ----------------------------------------------------------------------
     HERO cinematic scene — video stage + mouse/scroll parallax (desktop)
     ---------------------------------------------------------------------- */
  const hero = document.querySelector('.hero');
  const heroVideo = document.getElementById('heroVideo');

  // gate playback: desktop, motion allowed, no data-saver
  const startHeroVideo = () => {
    if (!heroVideo || heroVideo.src) return;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (desktop() && !reducedMotion && !saveData) {
      heroVideo.src = heroVideo.dataset.src;
      heroVideo.play().catch(() => { /* poster remains */ });
    }
  };
  startHeroVideo();
  window.addEventListener('resize', startHeroVideo);

  /* ----------------------------------------------------------------------
     HERO entrance — orchestrated GSAP timeline (desktop). The CSS
     keyframes remain as the no-GSAP fallback; .js-anim disables them.
     ---------------------------------------------------------------------- */
  if (hero && window.gsap && desktop() && !reducedMotion) {
    hero.classList.add('js-anim');
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    gsap.set('.hero-title .char', { yPercent: 115 });
    gsap.set('.hero-tagline', { y: 22, opacity: 0 });
    gsap.set('.hero-meta-line', { y: 14, opacity: 0 });
    gsap.set('.hero-poster-links a', { y: 14, opacity: 0 });

    gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => {
        // scrolling away sinks the letters back into the cut, edges first
        if (!window.ScrollTrigger) return;
        gsap.to('.hero-title .char', {
          yPercent: 95,
          ease: 'none',
          stagger: { each: 0.04, from: 'edges' },
          scrollTrigger: { trigger: hero, start: 'top top', end: '65% top', scrub: 0.5 }
        });
      }
    })
      .to('.hero-title .char', { yPercent: 0, duration: 1.35, stagger: 0.05 }, 0.25)
      .to('.hero-tagline', { y: 0, opacity: 1, duration: 1.1 }, 0.9)
      .to('.hero-meta-line', { y: 0, opacity: 1, duration: 1 }, 1.05)
      .to('.hero-poster-links a', { y: 0, opacity: 1, duration: 1, stagger: 0.1 }, 1.15);
  }

  /* ----------------------------------------------------------------------
     HERO poster title — fit the wordmark to the viewport edge-to-edge
     ---------------------------------------------------------------------- */
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    const fitTitle = () => {
      if (!desktop()) { heroTitle.style.fontSize = ''; return; }
      heroTitle.style.fontSize = '13.8vw';
      const w = heroTitle.scrollWidth;
      if (w > 0) {
        const current = parseFloat(getComputedStyle(heroTitle).fontSize);
        heroTitle.style.fontSize = (current * (window.innerWidth * 0.975) / w).toFixed(2) + 'px';
      }
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitTitle);
    } else {
      fitTitle();
    }
    window.addEventListener('resize', fitTitle);
  }

  /* ----------------------------------------------------------------------
     Live open/closed status (real hours, America/Edmonton)
     ---------------------------------------------------------------------- */
  const statusEl = document.getElementById('heroStatus');
  if (statusEl) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Edmonton', weekday: 'short', hour: 'numeric', hourCycle: 'h23'
      }).formatToParts(new Date());
      const pick = (t) => (parts.find(p => p.type === t) || {}).value;
      const day = pick('weekday');
      const hour = parseInt(pick('hour'), 10);
      // Mon–Wed 11–8, Thu–Sat 11–9, Sun closed
      const hoursByDay = { 'Mon.': 20, 'Tue.': 20, 'Wed.': 20, 'Thu.': 21, 'Fri.': 21, 'Sat.': 21,
                           Mon: 20, Tue: 20, Wed: 20, Thu: 21, Fri: 21, Sat: 21 };
      const close = hoursByDay[day];
      const label = statusEl.querySelector('.label');
      if (close && hour >= 11 && hour < close) {
        label.textContent = 'Open · until ' + (close - 12) + ' PM';
      } else if (close && hour < 11) {
        label.textContent = 'Closed · opens 11 AM';
        statusEl.classList.add('is-closed');
      } else {
        label.textContent = 'Closed now';
        statusEl.classList.add('is-closed');
      }
      statusEl.classList.add('is-on');
    } catch (e) { /* leave hidden */ }
  }

  if (hero && !reducedMotion) {
    const content = hero.querySelector('.hero-poster');
    let mouseX = 0, mouseY = 0;       // -1..1 around center
    let targetX = 0, targetY = 0;
    let scrollP = 0;                  // 0..1 progress of hero leaving viewport
    let running = false;

    const applyFrame = () => {
      running = false;
      if (!desktop()) {
        // mobile hero is the untouched banner — clear any inline transforms
        if (heroVideo) heroVideo.style.transform = '';
        if (content) { content.style.transform = ''; content.style.opacity = ''; }
        return;
      }

      // ease toward the cursor for a weighty, fluid feel
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;

      if (heroVideo) {
        const scale = 1.08 + scrollP * 0.12;
        heroVideo.style.transform =
          'scale(' + scale.toFixed(4) + ') translate3d(' + (mouseX * -12).toFixed(1) + 'px, ' +
          (mouseY * -8 + scrollP * 46).toFixed(1) + 'px, 0)';
      }

      // cursor spotlight position (eased, in % of viewport)
      hero.style.setProperty('--sx', (((mouseX + 1) / 2) * 100).toFixed(2) + '%');
      hero.style.setProperty('--sy', (((mouseY + 1) / 2) * 100).toFixed(2) + '%');

      if (content) {
        // full-bleed poster: keep horizontal drift tiny so edges never gap
        content.style.transform =
          'translate3d(' + (mouseX * -5).toFixed(1) + 'px, ' + (mouseY * -4 + scrollP * 130).toFixed(1) + 'px, 0)';
        content.style.opacity = String(Math.max(0, 1 - scrollP * 1.5));
      }

      // keep settling toward the cursor between events
      if (Math.abs(targetX - mouseX) > 0.001 || Math.abs(targetY - mouseY) > 0.001) {
        schedule();
      }
    };

    const schedule = () => {
      if (!running) {
        running = true;
        requestAnimationFrame(applyFrame);
      }
    };

    if (finePointer) {
      hero.addEventListener('mousemove', (e) => {
        targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        schedule();
      });
      hero.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
        schedule();
      });
    }

    window.addEventListener('scroll', () => {
      scrollP = Math.min(window.scrollY / Math.max(hero.offsetHeight, 1), 1);
      schedule();
    }, { passive: true });

    window.addEventListener('resize', schedule);
    schedule();
  }

  /* ----------------------------------------------------------------------
     Scroll parallax for [data-depth] outside the hero (story photos,
     gallery columns). Uses the `translate` property so it composes with
     any `transform` set by reveals or scrub animations.
     ---------------------------------------------------------------------- */
  let parallaxEls = [];
  if (!reducedMotion) {
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      const vh = window.innerHeight;
      const factor = desktop() ? -28 : -15;
      parallaxEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) / vh; // -1..1-ish
        const depth = parseFloat(el.getAttribute('data-depth') || '1');
        el.style.translate = '0 ' + (offset * depth * factor).toFixed(1) + 'px';
      });
    };
    window.refreshParallax = () => {
      parallaxEls = Array.from(document.querySelectorAll('[data-depth]'))
        .filter(el => !el.closest('.hero'));
      updateParallax();
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
    }, { passive: true });
    window.refreshParallax();
  }

  /* ----------------------------------------------------------------------
     Mobile: tricolor scroll progress bar
     ---------------------------------------------------------------------- */
  const progressBar = document.getElementById('scrollProgressBar');
  if (progressBar) {
    let pTick = false;
    const updateProgress = () => {
      pTick = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progressBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    };
    window.addEventListener('scroll', () => {
      if (!pTick) { pTick = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  /* ----------------------------------------------------------------------
     Mobile: quick-action dock — direction-aware.
     Greets you as you leave the hero, tucks away while you read down,
     returns the moment you scroll up, and bows out back in the hero.
     ---------------------------------------------------------------------- */
  const dock = document.getElementById('mobileDock');
  if (dock) {
    const isHome = document.body.classList.contains('home-page');
    let lastY = window.scrollY;
    let dockTick = false;

    const dockUpdate = () => {
      dockTick = false;
      const y = window.scrollY;
      if (desktop()) {
        dock.classList.remove('is-visible');
        lastY = y;
        return;
      }
      const gate = isHome ? window.innerHeight * 0.8 : 280;
      const delta = y - lastY;
      const goingDown = delta > 6;
      const goingUp = delta < -6;

      if (y <= gate) {
        dock.classList.remove('is-visible');           // inside the hero
      } else if (y < gate + 360) {
        dock.classList.add('is-visible');               // greet past the hero
      } else if (goingDown) {
        dock.classList.remove('is-visible');            // reading — step aside
      } else if (goingUp) {
        dock.classList.add('is-visible');               // navigating — return
      }
      lastY = y;
    };

    window.addEventListener('scroll', () => {
      if (!dockTick) { dockTick = true; requestAnimationFrame(dockUpdate); }
    }, { passive: true });
    window.addEventListener('resize', dockUpdate);
    dockUpdate();
  }

  /* ----------------------------------------------------------------------
     Mobile: 3D coverflow snap-carousels (.mobile-carousel)
     ---------------------------------------------------------------------- */
  const carousels = document.querySelectorAll('.mobile-carousel');
  carousels.forEach(carousel => {
    const slides = Array.from(carousel.children);
    const targets = slides.map(s => s.querySelector('[data-tilt]') || s);
    let cTick = false;

    const settle = () => {
      // inside a carousel, slides skip the reveal entrance — coverflow owns them
      if (!desktop()) {
        carousel.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
      }
    };

    const updateCoverflow = () => {
      cTick = false;
      if (desktop() || reducedMotion) {
        targets.forEach(t => { t.style.transform = ''; });
        return;
      }
      const rect = carousel.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      slides.forEach((slide, i) => {
        const r = slide.getBoundingClientRect();
        const d = Math.max(-1, Math.min(1, (r.left + r.width / 2 - mid) / rect.width));
        targets[i].style.transform =
          'rotateY(' + (d * -16).toFixed(2) + 'deg) translateZ(' + (-Math.abs(d) * 52).toFixed(1) + 'px) scale(' +
          (1 - Math.abs(d) * 0.06).toFixed(3) + ')';
      });
    };

    const schedule = () => {
      if (!cTick) { cTick = true; requestAnimationFrame(updateCoverflow); }
    };

    carousel.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => { settle(); schedule(); });
    settle();
    updateCoverflow();
  });

  /* ----------------------------------------------------------------------
     One-shot scroll-triggered films ([data-film]):
     dark window → curtain rises → plays once → settles on the final frame
     ---------------------------------------------------------------------- */
  document.querySelectorAll('video[data-film]').forEach(film => {
    const frame = film.closest('.film-window') || film.closest('.story-arch');
    const saveData = navigator.connection && navigator.connection.saveData;

    if (reducedMotion || saveData) {
      // no autoplay: just show the poster inside the window
      if (frame) frame.classList.add('is-revealed');
      return;
    }

    const loadFilm = () => {
      if (film.src) return;
      film.preload = 'auto';
      film.src = film.dataset.src;
      film.load();
    };

    // warm the file early so frame zero is decoded before the curtain rises
    const warmObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(film);
        loadFilm();
      });
    }, { rootMargin: '600px 0px' });
    warmObserver.observe(film);

    // reveal only once the video element already shows frame zero —
    // the poster is that same frame, so nothing visibly swaps
    const reveal = () => {
      if (frame) frame.classList.add('is-revealed');
      film.addEventListener('ended', () => {
        if (frame) frame.classList.add('is-finished');
      }, { once: true });
      // let the curtain clear the frame, then roll
      setTimeout(() => { film.play().catch(() => {}); }, 550);
    };

    const playObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(film);
        loadFilm();
        if (film.readyState >= 2) {
          reveal();
        } else {
          let revealed = false;
          const once = () => { if (!revealed) { revealed = true; reveal(); } };
          film.addEventListener('loadeddata', once, { once: true });
          setTimeout(once, 2500); // never leave the window dark
        }
      });
    }, { threshold: 0.45 });
    playObserver.observe(film);
  });

  /* ----------------------------------------------------------------------
     Pillars — sticky stack compression + arch-window parallax (scrubbed)
     ---------------------------------------------------------------------- */
  if (window.gsap && window.ScrollTrigger && !reducedMotion) {
    gsap.registerPlugin(ScrollTrigger);
    const pillars = gsap.utils.toArray('.pillar');
    pillars.forEach((pillar, i) => {
      // as the next panel arrives, this one settles back — gentle, no dimming
      const next = pillars[i + 1];
      if (next) {
        gsap.to(pillar, {
          scale: 0.955,
          y: -10,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: 0.8 }
        });
      }
      // the photo drifts softly inside its arch window
      const img = pillar.querySelector('.pillar-media img');
      if (img) {
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 4,
          ease: 'none',
          scrollTrigger: { trigger: pillar, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
        });
      }
    });

    // postcard choreography: stamp slams → postmark pops → cancellation draws
    const stamp = document.getElementById('postcardStamp');
    if (stamp) {
      gsap.timeline({ scrollTrigger: { trigger: '#postcard', start: 'top 62%' } })
        .from(stamp, { scale: 2.6, opacity: 0, rotation: 14, duration: 0.5, ease: 'power4.in' })
        .from('.postmark', { scale: 0, opacity: 0, rotation: 40, duration: 0.65, ease: 'back.out(1.7)' }, '+=0.05')
        .to('#postCancel path', { strokeDashoffset: 0, duration: 0.55, stagger: 0.12, ease: 'power2.out' }, '-=0.35');
    }
  }

  /* ----------------------------------------------------------------------
     Reviews quote theater — word-stagger rotation
     ---------------------------------------------------------------------- */
  const quoteStage = document.getElementById('quoteStage');
  if (quoteStage) {
    const slides = Array.from(quoteStage.querySelectorAll('.quote-slide'));
    const dots = Array.from(quoteStage.querySelectorAll('.q-dot'));
    const QUOTE_MS = 7500;
    let quoteTimer = null;

    // split each quote into per-word spans for the staggered 3D reveal
    slides.forEach(slide => {
      const q = slide.querySelector('.quote-text');
      const words = q.textContent.trim().split(/\s+/);
      q.textContent = '';
      words.forEach((word, i) => {
        const w = document.createElement('span');
        w.className = 'w';
        w.style.setProperty('--w', i);
        w.textContent = word;
        q.appendChild(w);
        q.appendChild(document.createTextNode(' '));
      });
    });

    const showQuote = (i) => {
      const idx = ((i % slides.length) + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle('is-active', j === idx));
      dots.forEach((d, j) => {
        d.classList.remove('is-active');
        if (j === idx) {
          void d.offsetWidth; // restart the progress animation
          d.classList.add('is-active');
        }
      });
      clearTimeout(quoteTimer);
      if (!reducedMotion) quoteTimer = setTimeout(() => showQuote(idx + 1), QUOTE_MS);
    };

    dots.forEach((d, j) => d.addEventListener('click', () => showQuote(j)));
    showQuote(0);
  }

  /* ----------------------------------------------------------------------
     Menu page — mobile spring accordions + jump links
     ---------------------------------------------------------------------- */
  const menuCats = Array.from(document.querySelectorAll('.menu-category'));
  if (menuCats.length) {
    const mobileMenuMode = () => window.innerWidth < 941;

    const setOpen = (cat, open) => {
      cat.classList.toggle('is-open', open);
      const head = cat.querySelector('.category-head');
      if (head) head.setAttribute('aria-expanded', String(open));
    };

    menuCats.forEach(cat => {
      const head = cat.querySelector('.category-head');
      if (head) {
        head.addEventListener('click', () => {
          if (!mobileMenuMode()) return;
          setOpen(cat, !cat.classList.contains('is-open'));
        });
      }
    });

    // jump links (sticky pills + launcher chips + sidebar) open their category first
    document.querySelectorAll('.menu-nav a, .launch-chip, .sidebar-nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        if (!mobileMenuMode()) return;
        const target = document.getElementById((link.getAttribute('href') || '').replace(/^#/, ''));
        if (!target) return;
        e.preventDefault();
        setOpen(target, true);
        setTimeout(() => {
          target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        }, 80);
      });
    });

    // mobile starts as a compact overview (all collapsed); desktop always open
    const initAccordions = () => {
      if (mobileMenuMode()) {
        menuCats.forEach(cat => setOpen(cat, cat.classList.contains('is-open')));
      } else {
        menuCats.forEach(cat => setOpen(cat, true));
      }
    };
    window.addEventListener('resize', () => {
      if (!mobileMenuMode()) menuCats.forEach(cat => setOpen(cat, true));
    });
    initAccordions();

    /* live menu search — filters dishes, hides empty categories,
       auto-opens matching accordions on mobile */
    const searchInputs = Array.from(document.querySelectorAll('[data-menu-search]'));
    const emptyMsg = document.getElementById('menuEmpty');
    if (searchInputs.length) {
      const statusEls = document.querySelectorAll('[data-search-status]');
      const launcherParts = document.querySelectorAll('.menu-launcher, .launcher-label');
      const navJumpLinks = document.querySelectorAll('#menuNav a, #sidebarNav a, .launch-chip');
      let wasSearching = false;

      const applyFilter = (query) => {
        const q = query.trim().toLowerCase();
        let total = 0;
        menuCats.forEach(cat => {
          let visible = 0;
          const catTitle = cat.querySelector('.category-title');
          const catMatch = q && catTitle && catTitle.textContent.toLowerCase().includes(q);
          cat.querySelectorAll('.menu-card').forEach(card => {
            const match = !q || catMatch || card.textContent.toLowerCase().includes(q);
            card.style.display = match ? '' : 'none';
            if (match) {
              visible++;
              if (q) card.classList.add('is-visible'); // skip reveal wait on results
            }
          });
          cat.querySelectorAll('.subcategory-title').forEach(title => {
            const grid = title.nextElementSibling;
            const any = grid && Array.from(grid.querySelectorAll('.menu-card'))
              .some(c => c.style.display !== 'none');
            title.style.display = any ? '' : 'none';
          });
          const extras = cat.querySelector('.menu-extras');
          if (extras) extras.style.display = q ? 'none' : '';
          cat.style.display = visible ? '' : 'none';
          if (mobileMenuMode()) setOpen(cat, q ? visible > 0 : false);
          total += visible;
        });
        if (emptyMsg) emptyMsg.hidden = total > 0;

        const searching = !!q;
        // results start right under the search box: launcher steps aside
        launcherParts.forEach(el => { el.style.display = searching ? 'none' : ''; });
        // live count where the user is looking
        statusEls.forEach(el => {
          el.hidden = !searching;
          el.textContent = total === 0 ? 'No matches'
            : total + (total === 1 ? ' dish found' : ' dishes found');
        });
        // nav chips/pills/sidebar links follow the filtered categories
        navJumpLinks.forEach(link => {
          const target = document.getElementById((link.getAttribute('href') || '').replace(/^#/, ''));
          link.style.display = (!searching || (target && target.style.display !== 'none')) ? '' : 'none';
        });
        // desktop: bring the results into view when a search begins
        if (searching && !wasSearching && !mobileMenuMode()) {
          const content = document.querySelector('.menu-content');
          if (content) {
            const top = content.getBoundingClientRect().top + window.scrollY - 130;
            if (window.scrollY > top) window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
          }
        }
        wasSearching = searching;
      };

      let searchDebounce;
      searchInputs.forEach(input => {
        input.addEventListener('input', () => {
          searchInputs.forEach(other => { if (other !== input) other.value = input.value; });
          clearTimeout(searchDebounce);
          searchDebounce = setTimeout(() => applyFilter(input.value), 120);
        });
      });
    }
  }

  /* ----------------------------------------------------------------------
     Menu page (mobile) — pill bar slides in once you scroll past the
     launcher; before that, the launcher owns navigation
     ---------------------------------------------------------------------- */
  const menuNavBar = document.querySelector('.menu-nav-bar');
  const launcherWrap = document.querySelector('.menu-launcher-wrap');
  if (menuNavBar && launcherWrap) {
    let pinTick = false;
    const pinSpy = () => {
      pinTick = false;
      if (window.innerWidth >= 941) { menuNavBar.classList.remove('is-pinned'); return; }
      const threshold = launcherWrap.offsetTop + launcherWrap.offsetHeight - 90;
      menuNavBar.classList.toggle('is-pinned', window.scrollY > threshold);
    };
    window.addEventListener('scroll', () => {
      if (!pinTick) { pinTick = true; requestAnimationFrame(pinSpy); }
    }, { passive: true });
    window.addEventListener('resize', pinSpy);
    pinSpy();
  }

  /* ----------------------------------------------------------------------
     Menu page — scrollspy for the sticky category nav
     ---------------------------------------------------------------------- */
  const menuNav = document.getElementById('menuNav');
  if (menuNav) {
    const links = Array.from(document.querySelectorAll('#menuNav a, #sidebarNav a'));
    const sections = Array.from(document.querySelectorAll('[data-category-section]'));

    const spy = () => {
      const fromTop = window.scrollY + 220;
      let current = sections[0];
      sections.forEach(sec => {
        if (sec.style.display !== 'none' && sec.offsetTop <= fromTop) current = sec;
      });
      links.forEach(link => {
        const active = current && link.getAttribute('href') === '#' + current.id;
        link.classList.toggle('is-active', active);
        // keep the active pill in view (mobile pill bar only)
        if (active && link.closest('#menuNav')) {
          link.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
        }
      });
    };

    let spyTick = false;
    window.addEventListener('scroll', () => {
      if (!spyTick) {
        spyTick = true;
        requestAnimationFrame(() => { spy(); spyTick = false; });
      }
    }, { passive: true });
    spy();
  }

  /* ----------------------------------------------------------------------
     Gallery — Fancybox lightbox + category filters
     ---------------------------------------------------------------------- */
  if (typeof Fancybox !== 'undefined') {
    Fancybox.bind('[data-fancybox="gallery"]', {
      Hash: false,
      Thumbs: { autoStart: false },
      Toolbar: {
        display: {
          left: [],
          middle: ['infobar'],
          right: ['close'],
        },
      },
    });
  }

  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryGrid = document.getElementById('gallery-grid');

  if (filterBtns.length && galleryGrid) {
    const galleryItems = Array.from(galleryGrid.querySelectorAll('.gallery-item'));

    // randomize initial order so the wall feels fresh on each visit
    for (let i = galleryItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      galleryGrid.appendChild(galleryItems[j]);
      galleryItems.splice(j, 1);
    }

    const allItems = Array.from(galleryGrid.querySelectorAll('.gallery-item'));

    // alternate column depths so the two mobile columns drift apart on scroll
    allItems.forEach((item, i) => {
      item.setAttribute('data-depth', i % 2 ? '1.1' : '0.45');
    });
    if (window.refreshParallax) window.refreshParallax();

    // staggered 3D entrance
    if (!reducedMotion) {
      allItems.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'perspective(900px) rotateX(-18deg) translateY(40px)';
      });
      const galleryObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const item = entry.target;
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = '';
            }, (Array.prototype.indexOf.call(galleryGrid.children, item) % 8) * 70);
            observer.unobserve(item);
          }
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
      allItems.forEach(item => galleryObserver.observe(item));
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        const filterVal = btn.getAttribute('data-filter');

        allItems.forEach(item => {
          const isMatch = filterVal === 'all' || item.getAttribute('data-category') === filterVal;

          if (isMatch) {
            item.style.display = 'block';
            requestAnimationFrame(() => {
              item.style.opacity = '1';
              item.style.transform = '';
              item.style.pointerEvents = 'auto';
              item.setAttribute('data-fancybox', 'gallery');
            });
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.92)';
            item.style.pointerEvents = 'none';
            item.removeAttribute('data-fancybox');
            setTimeout(() => {
              if (item.style.opacity === '0') item.style.display = 'none';
            }, 350);
          }
        });
      });
    });
  }
});
