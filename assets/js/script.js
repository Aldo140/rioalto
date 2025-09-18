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
    }
    function closeNav() {
      if (!nav) return;
      // Only hide on small screens; on desktop nav is always visible via CSS
      const isMobile = window.matchMedia('(max-width: 720px)').matches;
      nav.style.display = isMobile ? 'none' : 'flex';
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
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
          const isMobile = window.matchMedia('(max-width: 720px)').matches;
          if (isMobile) closeNav();
        });
      });
  
      // Keep nav in sync when resizing
      window.addEventListener('resize', () => {
        closeNav();
      });
    }
  
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
      // Set up smooth transform without needing CSS changes
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
  
    // ===== Minor: add 'loaded' class for optional CSS transitions =====
    document.documentElement.classList.add('js-loaded');
  })();
  