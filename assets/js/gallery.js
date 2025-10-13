// assets/js/gallery.js
// Rio Alto — Gallery logic (uniform grid, filters, lightbox)

document.addEventListener("DOMContentLoaded", () => {
    const galleryGrid = document.querySelector(".gallery-grid");
    if (!galleryGrid) return;
  
    const filterButtons = document.querySelectorAll(".chip");
    const galleryItems = Array.from(galleryGrid.querySelectorAll(".card"));

    // Utility: Fisher-Yates shuffle
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    // Shuffle DOM nodes and keep galleryItems in same randomized order
    function shuffleGalleryInDOM() {
      const shuffled = shuffleArray(galleryItems.slice());
      shuffled.forEach(item => galleryGrid.appendChild(item));
      // mutate galleryItems to match DOM order so lightbox/navigation follows
      galleryItems.length = 0;
      galleryItems.push(...shuffled);
    }

    // Initial shuffle on each page load to present random order
    shuffleGalleryInDOM();
  
    /* ---------------------------
       Thumbnail load → stop skeleton
       --------------------------- */
    // Mark each .card-media as loaded once its <img> finishes loading (for fade-in/skeleton removal)
    document.querySelectorAll(".card-media img").forEach((img) => {
      const markLoaded = () => img.closest(".card-media")?.classList.add("is-loaded");
      if (img.complete) {
        // Some browsers won't fire 'load' for cached images
        markLoaded();
      } else {
        img.addEventListener("load", markLoaded, { once: true });
        img.addEventListener("error", markLoaded, { once: true }); // fail-safe
      }
    });

    // Prefetch fallback: some browsers delay lazy-loading or don't kick off loads reliably
    // when navigating; create an offscreen Image() to ensure network fetch and mark cards loaded.
    document.querySelectorAll(".card-media img").forEach((img) => {
      if (img.complete) return; // already loaded
      try {
        const src = img.currentSrc || img.src;
        if (!src) return;
        const pre = new Image();
        pre.src = src;
        pre.onload = () => img.closest(".card-media")?.classList.add("is-loaded");
        pre.onerror = () => img.closest(".card-media")?.classList.add("is-loaded");
      } catch (e) {
        // swallow any exception — best-effort prefetch
      }
    });
  
    /* ---------------------------
       Filters
       --------------------------- */
    function applyFilter(filter) {
      galleryItems.forEach((item) => {
        const cat = item.dataset.category || "all";
        const match = filter === "all" || cat === filter;
        item.style.display = match ? "" : "none";
      });
    }
  
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;
        filterButtons.forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        // If switching to 'all', reshuffle the gallery for a fresh random order
        if (filter === 'all') {
          shuffleGalleryInDOM();
        }
        applyFilter(filter);
      });
    });
  
    /* ---------------------------
       Lightbox helpers
       --------------------------- */
    function removeExistingLightbox() {
      const existing = document.querySelector(".lightbox");
      if (existing) existing.remove();
    }
  
    function visibleItems() {
      return galleryItems.filter((i) => i.style.display !== "none");
    }
  
    function createFullMedia(item) {
      // Prefer explicit data-type; fallback based on child elements
      const type =
        item.dataset.type ||
        (item.querySelector("video") ? "video" : "image");
  
      const dataFull =
        item.dataset.full ||
        item.querySelector("[data-full]")?.dataset.full ||
        item.querySelector("img")?.src;
  
      if (!dataFull) return null;
  
      if (type === "video") {
        const video = document.createElement("video");
        video.className = "lightbox-media";
        video.controls = true;
        video.preload = "metadata";
  
        // Primary source (full)
        const srcMain = document.createElement("source");
        srcMain.src = dataFull;
        srcMain.type = "video/mp4";
        video.appendChild(srcMain);
  
        // Optional 720p fallback if present (same basename + _720.mp4)
        const low = dataFull.replace(/\.mp4$/i, "_720.mp4");
        if (low !== dataFull) {
          const srcLow = document.createElement("source");
          srcLow.src = low;
          srcLow.type = "video/mp4";
          video.appendChild(srcLow);
        }
  
        return video;
      }
  
      const img = new Image();
      img.className = "lightbox-media";
      img.src = dataFull;
      img.alt = item.querySelector("img")?.alt || "";
      img.loading = "eager";
      return img;
    }
  
    function openLightbox(startIndex) {
      removeExistingLightbox();
      const vis = visibleItems();
      if (!vis.length) return;
  
      let index = Math.max(0, Math.min(startIndex, vis.length - 1));
      const item = vis[index];
  
      const lb = document.createElement("div");
      lb.className = "lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-label", "Media preview");
  
      const content = document.createElement("div");
      content.className = "lightbox-content";
  
      const closeBtn = document.createElement("button");
      closeBtn.className = "lightbox-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.textContent = "✕";
  
      const prevBtn = document.createElement("button");
      prevBtn.className = "lightbox-prev";
      prevBtn.setAttribute("aria-label", "Previous");
      prevBtn.textContent = "◀";
  
      const nextBtn = document.createElement("button");
      nextBtn.className = "lightbox-next";
      nextBtn.setAttribute("aria-label", "Next");
      nextBtn.textContent = "▶";
  
      const media = createFullMedia(item);
      const caption = document.createElement("div");
      caption.className = "lightbox-caption";
      caption.textContent = item.querySelector("figcaption")?.textContent || "";
  
      content.append(closeBtn, prevBtn);
      if (media) content.appendChild(media);
      content.append(nextBtn, caption);
      lb.appendChild(content);
      document.body.appendChild(lb);
  
      // Focus handling
      const previouslyFocused = document.activeElement;
      closeBtn.focus();
  
      const focusable = Array.from(
        lb.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
  
      function trapTab(e) {
        if (e.key !== "Tab") return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
  
      function cleanup() {
        removeExistingLightbox();
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("keydown", trapTab);
        previouslyFocused?.focus?.();
      }
  
      function navigate(dir) {
        const list = visibleItems();
        index = (index + dir + list.length) % list.length;
        cleanup();
        openLightbox(index);
      }
  
      function onKey(e) {
        if (e.key === "Escape") cleanup();
        if (e.key === "ArrowLeft") navigate(-1);
        if (e.key === "ArrowRight") navigate(1);
        if (e.key === " ") {
          // Space toggles video play/pause when present
          const v = document.querySelector(".lightbox video");
          if (v) {
            e.preventDefault();
            if (v.paused) v.play();
            else v.pause();
          }
        }
      }
  
      closeBtn.addEventListener("click", cleanup);
      prevBtn.addEventListener("click", () => navigate(-1));
      nextBtn.addEventListener("click", () => navigate(1));
      document.addEventListener("keydown", onKey);
      document.addEventListener("keydown", trapTab);
  
      // Click backdrop to close
      lb.addEventListener("click", (ev) => {
        if (ev.target === lb) cleanup();
      });
    }
  
    // Click to open lightbox; ignore interactive elements
    galleryItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest("button,a,input,select,textarea")) return;
        // If clicking on a video element with native controls, let it be
        if (e.target.tagName === "VIDEO") return;
  
        const vis = visibleItems();
        const idx = vis.indexOf(item);
        openLightbox(idx >= 0 ? idx : 0);
      });
    });
  });
