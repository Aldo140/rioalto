// assets/js/script.js
// Shared, lightweight JS used by both index.html and menu.html

(() => {
    // ===== Mobile Nav Toggle =====
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
  
    // Focus-trap helpers
    let _focusable = [];
    let _firstFocusable = null;
    let _lastFocusable = null;
    let _navKeyHandler = null;
    let _docClickHandler = null;

    function refreshFocusable() {
      if (!nav) return;
      _focusable = Array.from(nav.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled'));
      _firstFocusable = _focusable[0] || null;
      _lastFocusable = _focusable[_focusable.length - 1] || null;
    }

    function handleNavKeydown(e) {
      if (e.key === 'Escape') { closeNav(); return; }
      if (e.key !== 'Tab') return;
      refreshFocusable();
      if (!_firstFocusable || !_lastFocusable) return;
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === _firstFocusable) {
          e.preventDefault();
          _lastFocusable.focus();
        }
      } else {
        if (active === _lastFocusable) {
          e.preventDefault();
          _firstFocusable.focus();
        }
      }
    }

    function handleDocClick(e) {
      // close when clicking outside the nav and not on the toggle
      if (!nav) return;
      const target = e.target;
      if (nav.contains(target)) return;
      if (toggle && toggle.contains(target)) return;
      closeNav();
    }

    function openNav() {
      if (!nav) return;
      document.documentElement.classList.add('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      // Lock page scroll
      document.body.style.overflow = 'hidden';
      // focus management
      refreshFocusable();
      if (_firstFocusable) _firstFocusable.focus();
      // wire handlers
      _navKeyHandler = handleNavKeydown;
      _docClickHandler = handleDocClick;
      document.addEventListener('keydown', _navKeyHandler);
      // listen on capture so clicks on elements that stopPropagation won't prevent this closing
      document.addEventListener('click', _docClickHandler, true);
    }
    function closeNav() {
      if (!nav) return;
      document.documentElement.classList.remove('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      // Restore page scroll
      document.body.style.overflow = '';
      // remove handlers
      if (_navKeyHandler) document.removeEventListener('keydown', _navKeyHandler);
      if (_docClickHandler) document.removeEventListener('click', _docClickHandler, true);
      _navKeyHandler = _docClickHandler = null;
      // Return focus to toggle
      if (toggle) toggle.focus();
    }
  
    if (toggle && nav) {
      // Ensure nav is closed initially for mobile state
      document.documentElement.classList.remove('nav-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
  
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
        // close overlay on resize to avoid stuck state
        closeNav();
      });
    }

    // Close overlay on Escape key when open (global listener as fallback)
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

    // ===== Back to Top Button =====
    const createBackToTopButton = () => {
      // Create the button element
      const backToTopBtn = document.createElement('button');
      backToTopBtn.className = 'back-to-top';
      backToTopBtn.setAttribute('aria-label', 'Back to top');
      backToTopBtn.setAttribute('title', 'Back to top');
      backToTopBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      
      // Add to page
      document.body.appendChild(backToTopBtn);
      
      let backToTopVisible = false;
      let backToTopTicking = false;
      
      const updateBackToTop = () => {
        backToTopTicking = false;
        const currentY = window.scrollY || 0;
        const shouldShow = currentY > 300; // Show after scrolling 300px
        
        if (shouldShow && !backToTopVisible) {
          backToTopBtn.classList.add('visible');
          backToTopVisible = true;
        } else if (!shouldShow && backToTopVisible) {
          backToTopBtn.classList.remove('visible');
          backToTopVisible = false;
        }
      };
      
      const onBackToTopScroll = () => {
        if (!backToTopTicking) {
          window.requestAnimationFrame(updateBackToTop);
          backToTopTicking = true;
        }
      };
      
      // Smooth scroll to top when clicked
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
      
      // Listen for scroll events
      window.addEventListener('scroll', onBackToTopScroll, { passive: true });
      
      // Initial check
      updateBackToTop();
    };
    
    // Initialize back to top button
    createBackToTopButton();
  
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
    
    // ===== New: accessible slideshow component (supports multiple) =====
    const initSlideshows = () => {
      const slideshows = Array.from(document.querySelectorAll('.slideshow, .mobile-slideshow'));
      if (!slideshows.length) return;
      slideshows.forEach((container, sidx) => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const slides = Array.from(container.querySelectorAll('.slide, .mobile-slide'));
        if (!slides.length) return;
        
        // Determine if this is a mobile slideshow
        const isMobileSlideshow = container.classList.contains('mobile-slideshow');
        const navPrevSelector = isMobileSlideshow ? '.mobile-slideshow__nav--prev' : '.slideshow__nav--prev';
        const navNextSelector = isMobileSlideshow ? '.mobile-slideshow__nav--next' : '.slideshow__nav--next';
        const dotsSelector = isMobileSlideshow ? '.mobile-slideshow__dots' : '.slideshow__dots';
        
        // ensure container is keyboard focusable for accessibility
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '0');
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', container.getAttribute('aria-label') || 'Image slideshow');
        container.setAttribute('aria-roledescription', 'carousel');
        
        // nav
        const prevBtn = container.querySelector(navPrevSelector);
        const nextBtn = container.querySelector(navNextSelector);
        const dotsWrap = container.querySelector(dotsSelector);
        
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
        
        // set initial active slide - ensure first slide is immediately visible
        slides.forEach((sl, i) => {
          // ensure slide has data-index numeric
          sl.dataset.index = String(i);
          const isFirst = i === 0;
          sl.classList.toggle('is-active', isFirst);
          // hide from AT when not active
          sl.setAttribute('aria-hidden', isFirst ? 'false' : 'true');
          
          // Force immediate visibility for first slide to prevent flash
          if (isFirst) {
            sl.style.opacity = '1';
            if (isMobileSlideshow) {
              sl.style.transform = 'translateX(0)';
            } else {
              sl.style.transform = 'scale(1)';
            }
          }
        });
        
        // create an inline live region for screen reader announcements
        if (!container._sr) {
          const sr = document.createElement('div');
          sr.className = isMobileSlideshow ? 'mobile-slideshow__sr' : 'slideshow__sr';
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
        
        // --- Crossfade integration: only for regular slideshows, not mobile ---
        if (!isMobileSlideshow) {
          const heroSplit = container.closest('.hero-split');
          const largeScreenMq = window.matchMedia('(min-width:941px)');
          const updateCrossfadeState = () => {
            if (!heroSplit) return;
            const isLarge = largeScreenMq.matches;
            // Reduce grace period to prevent white flash - was 400ms, now 200ms
            const isPlaying = !!timer && playingSince && (Date.now() - playingSince > 200);
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
          // Reduce initial crossfade delay from 450ms to 100ms to prevent flash
          setTimeout(updateCrossfadeState, 100);
        }
        
        // Start autoplay
        if (autoplay) {
          startTimer();
        }
      });
    };
    // init when DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSlideshows);
    } else {
      initSlideshows();
    }
  })();

  // Business data centralization - single source of truth
  const BUSINESS_DATA = {
    name: "Rio Alto Authentic Mexican Food",
    tagline: "Authentic Mexican food in High River, AB.",
    contact: {
      phone: "+1-403-652-1261",
      phoneDisplay: "(403) 652-1261",
      phoneLink: "tel:+14036521261"
    },
    address: {
      street: "118 3 Ave SW",
      city: "High River",
      province: "AB", 
      postalCode: "T1V 1R3",
      country: "CA",
      full: "118 3 Ave SW, High River, AB T1V 1R3"
    },
    hours: {
      "Monday": "11:00-20:00",
      "Tuesday": "11:00-20:00", 
      "Wednesday": "11:00-20:00",
      "Thursday": "11:00-21:00",
      "Friday": "11:00-21:00",
      "Saturday": "11:00-21:00",
      "Sunday": "Closed"
    },
    hoursDisplay: {
      "Mon–Wed": "11–8",
      "Thu–Sat": "11–9", 
      "Sun": "Closed"
    },
    social: {
      facebook: "https://www.facebook.com/RioAltoHighRiver/"
    },
    website: "https://rioalto.ca",
    priceRange: "$$",
    cuisine: "Mexican"
  };
  
  // Populate business data into page elements
  function populateBusinessData() {
    // Header phone number
    const phoneNumber = document.querySelector('.phone-number');
    if (phoneNumber) phoneNumber.textContent = BUSINESS_DATA.contact.phoneDisplay;
    
    // Visit section
    const businessAddress = document.querySelector('.business-address');
    if (businessAddress) businessAddress.textContent = BUSINESS_DATA.address.full;
    
    const phoneLink = document.querySelector('.phone-link');
    if (phoneLink) {
      phoneLink.href = BUSINESS_DATA.contact.phoneLink;
      phoneLink.textContent = BUSINESS_DATA.contact.phoneDisplay;
    }
    
    const hoursDisplay = document.querySelector('.hours-display');
    if (hoursDisplay) {
      const hoursHtml = Object.entries(BUSINESS_DATA.hoursDisplay)
        .map(([days, hours]) => `<p>${days} ${hours}</p>`)
        .join('');
      hoursDisplay.innerHTML = hoursHtml;
    }
    
    // Populate footer
    populateFooter();
    
    // Update year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    
    // Populate schema.org structured data
    updateStructuredData();
  }
  
  function populateFooter() {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;
    
    const footerHTML = `
      <div class="container">
        <div>
          <img src="pictures/logo-full.png" alt="Rio Alto logo">
          <p>${BUSINESS_DATA.tagline}</p>
        </div>
        <div>
          <h4>Visit</h4>
          <p>
            ${BUSINESS_DATA.address.street}<br/>
            ${BUSINESS_DATA.address.city}, ${BUSINESS_DATA.address.province} ${BUSINESS_DATA.address.postalCode}
          </p>
          <p style="margin-top:6px">
            <a href="${BUSINESS_DATA.contact.phoneLink}">${BUSINESS_DATA.contact.phoneDisplay}</a>
          </p>
        </div>
        <div>
          <h4>Hours</h4>
          ${Object.entries(BUSINESS_DATA.hoursDisplay)
            .map(([days, hours]) => `<p>${days} ${hours}</p>`)
            .join('')}
        </div>
        <div>
          <h4>Links</h4>
          <p><a href="index.html#home">Home</a></p>
          <p><a href="menu.html">Menu</a></p>
          <p><a href="index.html#story">Our Story</a></p>
          <p><a href="index.html#visit">Visit</a></p>
          <p><a href="${BUSINESS_DATA.social.facebook}" target="_blank" rel="noopener">
            <svg class="icon icon-facebook" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M22 12a10 10 0 10-11.5 9.9v-7h-2.1V12h2.1V9.6c0-2.1 1.2-3.3 3-3.3.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 2.9h-1.8v7A10 10 0 0022 12z"/>
            </svg> Facebook</a></p>
        </div>
      </div>
      <div class="legal">© <span id="year">${new Date().getFullYear()}</span> Rio Alto. All rights reserved.</div>
    `;
    
    footer.innerHTML = footerHTML;
  }
  
  function updateStructuredData() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Restaurant", 
      "name": BUSINESS_DATA.name,
      "image": "pictures/front-of-building.jpg",
      "telephone": BUSINESS_DATA.contact.phone,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": BUSINESS_DATA.address.street,
        "addressLocality": BUSINESS_DATA.address.city,
        "addressRegion": BUSINESS_DATA.address.province,
        "postalCode": BUSINESS_DATA.address.postalCode,
        "addressCountry": BUSINESS_DATA.address.country
      },
      "servesCuisine": BUSINESS_DATA.cuisine,
      "priceRange": BUSINESS_DATA.priceRange,
      "url": BUSINESS_DATA.website,
      "sameAs": [BUSINESS_DATA.social.facebook],
      "openingHoursSpecification": [
        {"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday"],"opens":"11:00","closes":"20:00"},
        {"@type":"OpeningHoursSpecification","dayOfWeek":["Thursday","Friday","Saturday"],"opens":"11:00","closes":"21:00"}
      ]
    };
    
    // Update existing schema script or create new one
    let schemaScript = document.querySelector('script[type="application/ld+json"]');
    if (schemaScript) {
      schemaScript.textContent = JSON.stringify(schema);
    }
  }
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', populateBusinessData);

  // Ensure consistent navigation toggle functionality
  document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');

    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.contains('open');
        nav.classList.toggle('open', !isOpen);
        navToggle.setAttribute('aria-expanded', !isOpen);
      });

      // Close navigation when a link is clicked (on mobile)
      nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 940) {
            nav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }
  });
