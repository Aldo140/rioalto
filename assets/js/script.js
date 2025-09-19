// assets/js/script.js
// Shared, lightweight JS used by both index.html and menu.html

(() => {
    // ===== Mobile Nav Toggle =====
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
  
    function openNav() {
      if (!nav) return;
      nav.style.display = 'flex';
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      // Lock page scroll and mark state for CSS
      document.documentElement.classList.add('nav-open');
      document.body.style.overflow = 'hidden';
      // Move focus to first link in nav for accessibility
      const firstLink = nav.querySelector('a');
      if (firstLink) firstLink.focus();
    }
    function closeNav() {
      if (!nav) return;
      // Only hide on small/tablet screens (<=940px); on larger screens nav is visible via CSS
      const isMobile = window.matchMedia('(max-width: 940px)').matches;
      nav.style.display = isMobile ? 'none' : 'flex';
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      // Restore page scroll and state
      document.documentElement.classList.remove('nav-open');
      document.body.style.overflow = '';
      // Return focus to toggle for keyboard users
      if (toggle) toggle.focus();
    }
  
    if (toggle && nav) {
      // Initial state for mobile
      closeNav();
  
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        if (open) {
          closeNav();
        } else {
          openNav();
        }
      });
  
      // Close menu when a nav link is clicked (on mobile)
      nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          const isMobile = window.matchMedia('(max-width: 940px)').matches;
          if (isMobile) closeNav();
        });
      });
  
      // Keep nav in sync when resizing
      window.addEventListener('resize', () => {
        closeNav();
      });
    }

    // Close overlay on Escape key when open
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const isOpen = toggle && toggle.getAttribute('aria-expanded') === 'true';
        if (isOpen) closeNav();
      }
    });
  
    // ===== Smooth Scroll for same-page anchors =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', evt => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId.length <= 1) return; // ignore plain "#"
        const el = document.querySelector(targetId);
        if (el) {
          evt.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  
    // ===== Footer Year =====
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
    // ===== Smart Header: hide on scroll down, show on scroll up (Wix-style) =====
    if (header) {
      header.style.willChange = 'transform';
      header.style.transition = 'transform .28s ease';
  
      let lastY = window.scrollY || 0;
      let ticking = false;
      let headerHidden = false;
  
      // Safety: don't hide header while mobile menu is open
      const isMenuOpen = () =>
        toggle && toggle.getAttribute('aria-expanded') === 'true';
  
      const clamp = v => (v < 0 ? 0 : v);
  
      const updateHeader = () => {
        ticking = false;
        const currentY = clamp(window.scrollY || 0);
        const delta = currentY - lastY;
  
        // Small movements shouldn't toggle
        const threshold = 8;
        if (Math.abs(delta) < threshold) {
          lastY = currentY;
          return;
        }
  
        // Only hide after we've scrolled a bit past the top
        const activationHeight = Math.max(120, header.offsetHeight);
  
        if (!isMenuOpen()) {
          if (delta > 0 && currentY > activationHeight) {
            // Scrolling down
            if (!headerHidden) {
              header.style.transform = 'translateY(-110%)';
              headerHidden = true;
            }
          } else {
            // Scrolling up or near top
            if (headerHidden) {
              header.style.transform = 'translateY(0)';
              headerHidden = false;
            }
          }
        } else {
          // Menu open: always show header
          if (headerHidden) {
            header.style.transform = 'translateY(0)';
            headerHidden = false;
          }
        }
  
        lastY = currentY;
      };
  
      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      };
  
      window.addEventListener('scroll', onScroll, { passive: true });
  
      // Show header again when resizing (prevents stuck state)
      window.addEventListener('resize', () => {
        header.style.transform = 'translateY(0)';
        headerHidden = false;
        lastY = window.scrollY || 0;
      });
    }
  
    // ===== Keep --header-h synced to sticky header height (no gap under header) =====
    (function keepHeaderHeightSynced() {
      const setHeaderHeight = () => {
        const h = header?.offsetHeight || 0;
        document.documentElement.style.setProperty('--header-h', `${h}px`);
      };
  
      // Initial + resize + orientation + font load
      window.addEventListener('load', setHeaderHeight);
      window.addEventListener('resize', setHeaderHeight);
      window.addEventListener('orientationchange', setHeaderHeight);
      // In case fonts shift layout
      try {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(setHeaderHeight);
        }
      } catch (_) {}
  
      // Fallback: also re-check after a tick for late layout changes
      setTimeout(setHeaderHeight, 150);
      setTimeout(setHeaderHeight, 600);
    })();
  
    // ===== Minor: add 'loaded' class for optional CSS transitions =====
    document.documentElement.classList.add('js-loaded');

    // ===== New: set header height CSS variable to avoid layout jumps =====
    const setHeaderHeightVar = () => {
      const hdr = document.querySelector('.site-header');
      const root = document.documentElement;
      const h = hdr ? hdr.offsetHeight : 76;
      root.style.setProperty('--header-h', `${h}px`);
    };
    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar, { passive: true });

    // ===== New: accessible slideshow component (supports multiple) =====
    const initSlideshows = () => {
      const slideshows = Array.from(document.querySelectorAll('.slideshow'));
      if (!slideshows.length) return;

      slideshows.forEach((container, sidx) => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const slides = Array.from(container.querySelectorAll('.slide'));
        if (!slides.length) return;

        // ensure container is keyboard focusable for accessibility
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '0');
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', container.getAttribute('aria-label') || 'Image slideshow');
        container.setAttribute('aria-roledescription', 'carousel');
        // nav
        const prevBtn = container.querySelector('.slideshow__nav--prev');
        const nextBtn = container.querySelector('.slideshow__nav--next');
        const dotsWrap = container.querySelector('.slideshow__dots');
        // ensure dots container is accessible
        if (dotsWrap && !dotsWrap.hasAttribute('aria-label')) dotsWrap.setAttribute('aria-label', 'Slide navigation');
        let interval = parseInt(container.dataset.interval || '4500', 10);
        if (Number.isNaN(interval) || interval < 800) interval = 4500;
        const autoplay = container.dataset.autoplay !== 'false' && !prefersReduced;

        // state
        let index = 0;
        let timer = null;
        let playingSince = 0; // timestamp when autoplay timer was started

        const goTo = (i, userInitiated = false) => {
          index = (i + slides.length) % slides.length;
          slides.forEach((sl, si) => {
            const active = si === index;
            sl.classList.toggle('is-active', active);
            // hide non-active slides from assistive tech
            sl.setAttribute('aria-hidden', active ? 'false' : 'true');
          });
          // dots
          if (dotsWrap) {
            Array.from(dotsWrap.children).forEach((b, bi) => {
              const active = bi === index;
              b.classList.toggle('is-active', active);
              b.setAttribute('aria-pressed', String(active));
              if (active) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
            });
          }
          // update live region with slide info for screen readers
          if (container._sr) {
            const img = slides[index].querySelector('img');
            const alt = img ? img.alt : '';
            container._sr.textContent = `Slide ${index + 1} of ${slides.length}: ${alt}`;
          }
          // reset autoplay timer on user interaction
          if (autoplay && userInitiated) {
            stopTimer();
            startTimer();
          }
        };

        const next = (user = false) => goTo(index + 1, user);
        const prev = (user = false) => goTo(index - 1, user);

        // timer
        let startTimer = () => {
          if (!autoplay || timer) return;
          timer = setInterval(() => next(true), interval);
          playingSince = Date.now();
        };
        let stopTimer = () => {
          if (!timer) return;
          clearInterval(timer);
          timer = null;
          playingSince = 0;
        };

        // build dots
        if (dotsWrap) {
          dotsWrap.innerHTML = '';
          slides.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = i === 0 ? 'is-active' : '';
            btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
            btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
            if (i === 0) btn.setAttribute('aria-current', 'true');
            btn.addEventListener('click', () => goTo(i, true));
            dotsWrap.appendChild(btn);
          });
        }

        // wire buttons
        if (prevBtn) prevBtn.addEventListener('click', () => prev(true));
        if (nextBtn) nextBtn.addEventListener('click', () => next(true));

        // pause on hover/focus
        container.addEventListener('mouseenter', stopTimer, { passive: true });
        container.addEventListener('mouseleave', startTimer, { passive: true });
        container.addEventListener('focusin', stopTimer);
        container.addEventListener('focusout', startTimer);

        // keyboard support (left/right)
        container.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') { prev(true); e.preventDefault(); }
          if (e.key === 'ArrowRight') { next(true); e.preventDefault(); }
        });

        // set initial active slide
        slides.forEach((sl, i) => {
          // ensure slide has data-index numeric
          sl.dataset.index = String(i);
          sl.classList.toggle('is-active', i === 0);
          // hide from AT when not active
          sl.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
        });
        // create an inline live region for screen reader announcements
        if (!container._sr) {
          const sr = document.createElement('div');
          sr.className = 'slideshow__sr';
          sr.setAttribute('aria-live', 'polite');
          sr.setAttribute('aria-atomic', 'true');
          // visually-hide but keep available to screen readers
          sr.style.position = 'absolute';
          sr.style.width = '1px';
          sr.style.height = '1px';
          sr.style.margin = '-1px';
          sr.style.border = '0';
          sr.style.padding = '0';
          sr.style.overflow = 'hidden';
          sr.style.clip = 'rect(0 0 0 0)';
          sr.style.clipPath = 'inset(50%)';
          container.appendChild(sr);
          container._sr = sr;
          // populate initial announcement
          const firstImg = slides[0].querySelector('img');
          container._sr.textContent = `Slide 1 of ${slides.length}: ${firstImg ? firstImg.alt : ''}`;
        }

        // --- Crossfade integration: toggle hero-split classes when slideshow is active on large screens ---
        const heroSplit = container.closest('.hero-split');
        const largeScreenMq = window.matchMedia('(min-width:941px)');
        const updateCrossfadeState = () => {
          if (!heroSplit) return;
          const isLarge = largeScreenMq.matches;
          // consider 'playing' only if timer has been active for a short grace period
          const isPlaying = !!timer && playingSince && (Date.now() - playingSince > 400);
          if (isLarge && isPlaying) {
            // enable crossfade overlay and show slideshow when on large screens and playing
            heroSplit.classList.add('crossfade', 'show-slideshow');
          } else {
            // hide overlay and remove crossfade state
            heroSplit.classList.remove('show-slideshow');
            heroSplit.classList.remove('crossfade');
          }
        };
        // call on relevant transitions
        const origStartTimer = startTimer;
        const origStopTimer = stopTimer;
        startTimer = () => { origStartTimer(); updateCrossfadeState(); };
        stopTimer = () => { origStopTimer(); updateCrossfadeState(); };

        // update when slides change (in case autoplay not used)
        container.addEventListener('focusin', updateCrossfadeState);
        container.addEventListener('mouseenter', updateCrossfadeState);

        // respond to screen size changes
        try { largeScreenMq.addEventListener('change', updateCrossfadeState); } catch(e) { largeScreenMq.addListener(updateCrossfadeState); }

        // defer initial crossfade state update slightly to avoid visual flash on load
        setTimeout(updateCrossfadeState, 450);
      });
    };

    // init when DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSlideshows);
    } else {
      initSlideshows();
    }
  })();
