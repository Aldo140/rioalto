(function(){
  const root = document.getElementById('menu-root');
  if (!root) return;

  function formatPrice(p){
    if (p === null || p === undefined) return '';
    try{
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(p);
    }catch(e){
      return `$${p}`;
    }
  }

function escapeHtml(str){
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const TAG_LABEL_MAP = {
  'popular': '★ Popular choice',
  'seasonal': '🌿 Seasonal item',
  'lunch-only': '🕛 Lunch only',
  'starter': '🥗 Perfect starter',
  'special': '🔥 House special'
};

const CATEGORY_ICONS = {
  'cold-drinks': '🥤',
  'alcoholic-drinks': '🍹',
  'hot-drinks': '☕',
  'appetizers': '🥟',
  'soup': '🍜',
  'salads': '🥗',
  'lunch': '🍱',
  'main-course': '🍽️',
  'tortas': '🥪',
  'soft-tacos': '🌮',
  'sides': '🥑',
  'kids-menu': '🧸',
  'dessert': '🍮'
};

const CATEGORY_GROUPS = [
  { id: 'refreshments', label: 'Refreshments', categories: ['cold-drinks', 'alcoholic-drinks', 'hot-drinks'] },
  { id: 'starters', label: 'Starters & Greens', categories: ['appetizers', 'soup', 'salads'] },
  { id: 'plates', label: 'Daytime Plates', categories: ['lunch', 'main-course'] },
  { id: 'street', label: 'Street Favourites', categories: ['tortas', 'soft-tacos'] },
  { id: 'sides', label: 'Sides & Treats', categories: ['sides', 'dessert'] },
  { id: 'kids', label: 'Kids Menu', categories: ['kids-menu'] }
];

const TILE_ARROW_SVG = `<svg class="menu-tile__arrow-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M8 6h10v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderItem(item, base, index = 0){
  const price = item.price != null ? `<span class="sig-price">${formatPrice(item.price)}</span>` : '';
  const desc = item.description ? `<p>${escapeHtml(item.description)}</p>` : '';
  // Images are intentionally suppressed on the menu page to keep layout consistent.
  const media = '';
  const tags = Array.isArray(item.tags) && item.tags.length
    ? `<div class="menu-item-tags">${item.tags.map(tag => {
        const label = TAG_LABEL_MAP[tag] || tag.replace(/-/g, ' ');
        return `<span class="menu-tag ${escapeHtml(tag)}">${label}</span>`;
      }).join('')}</div>`
    : '';
  const cardClass = 'sig-card no-media';
  
  return `
      <article class="${cardClass}">
        ${media}
        <div class="sig-body">
          <h3>${escapeHtml(item.name)}</h3>
          ${desc}
          ${price}
        </div>
        ${tags}
      </article>`;
  }

  function renderSubcategory(subcat, base) {
    if (!subcat.items || !subcat.items.length) return '';
    
    const items = subcat.items.map((i, index) => renderItem(i, base, index)).join('');
    
    return `
      <div class="subcategory">
        <h3 class="subcategory-title">${escapeHtml(subcat.name)}</h3>
        <div class="sig-grid">${items}</div>
      </div>`;
  }

  function renderCategory(cat, base){
    let content = '';
    
    // Handle categories with subcategories (like alcoholic drinks)
    if (cat.subcategories && cat.subcategories.length) {
      content = cat.subcategories.map(subcat => renderSubcategory(subcat, base)).join('');
    } 
    // Handle regular categories with direct items
    else if (cat.items && cat.items.length) {
      const items = cat.items.map((i, index) => renderItem(i, base, index)).join('');
      content = `<div class="sig-grid">${items}</div>`;
    }
    
    const catDesc = cat.description ? `<p class="category-description">${escapeHtml(cat.description)}</p>` : '';
    const extras = cat.extras ? renderExtras(cat.extras) : '';
    
    return `
      <section class="sig" id="cat-${escapeHtml(cat.id)}" aria-labelledby="cat-${escapeHtml(cat.id)}-title">
        <div class="container">
          <h2 id="cat-${escapeHtml(cat.id)}-title" class="section-title">${escapeHtml(cat.name)}</h2>
          ${catDesc}
          ${content}
          ${extras}
        </div>
      </section>`;
  }

  function renderExtras(extras){
    if (!extras || !extras.length) return '';
    const extrasItems = extras.map(extra => {
      const price = extra.price != null ? ` … ${formatPrice(extra.price)}` : '';
      return `<span class="extra-item">${escapeHtml(extra.name)}${price}</span>`;
    }).join(' | ');
    
    return `<div class="menu-extras"><strong>Add:</strong> ${extrasItems}</div>`;
  }

  function renderCategoryNav(categories){
    if (!categories || !categories.length) return '';
    const categoryById = new Map(categories.map(cat => [cat.id, cat]));
    const grouped = [];
    const used = new Set();

    CATEGORY_GROUPS.forEach(group => {
      const collected = group.categories
        .map(id => categoryById.get(id))
        .filter(Boolean);
      if (!collected.length) return;
      collected.forEach(cat => used.add(cat.id));
      grouped.push({ id: group.id, label: group.label, categories: collected });
    });

    const leftovers = categories.filter(cat => !used.has(cat.id));
    if (leftovers.length){
      grouped.push({ id: 'more', label: 'More', categories: leftovers });
    }

    const renderCard = (cat, groupId, groupLabel) => {
      const icon = CATEGORY_ICONS[cat.id] || '🍽️';
      return `
        <a class="menu-card" data-group="${escapeHtml(groupId)}" href="#cat-${escapeHtml(cat.id)}">
          <span class="menu-card-icon" aria-hidden="true">${escapeHtml(icon)}</span>
          <span class="menu-card-content">
            <span class="menu-card-label">${escapeHtml(cat.name)}</span>
            <span class="menu-card-meta">${escapeHtml(groupLabel)}</span>
          </span>
          <span class="menu-card-chevron" aria-hidden="true">›</span>
        </a>`;
    };

    const renderTile = (group) => {
      const contentId = `menu-tile-${group.id}`;
      const categoryIds = group.categories.map(cat => cat.id);
      const options = group.categories.map(cat => `
          <a class="menu-tile__option" href="#cat-${escapeHtml(cat.id)}" data-category="${escapeHtml(cat.id)}">
            ${escapeHtml(cat.name)}
          </a>`).join('');
      const guardOptions = options
        ? `<div class="menu-tile__options">${options}</div>`
        : `<p class="menu-tile__empty">More coming soon.</p>`;

      return `
        <article class="menu-tile" data-group="${escapeHtml(group.id)}" data-categories="${categoryIds.map(id => escapeHtml(id)).join(',')}">
          <button class="menu-tile__header" type="button" aria-expanded="false" aria-controls="${escapeHtml(contentId)}">
            <span class="menu-tile__label">${escapeHtml(group.label)}</span>
            <span class="menu-tile__arrow" aria-hidden="true">${TILE_ARROW_SVG}</span>
          </button>
          <div class="menu-tile__content" id="${escapeHtml(contentId)}" hidden>
            <div class="menu-tile__body">
              ${guardOptions}
            </div>
          </div>
        </article>`;
    };

    const cards = grouped.map(group => group.categories.map(cat => renderCard(cat, group.id, group.label)).join('')).join('');
    const tiles = grouped.map(renderTile).join('');

    return `
      <section class="menu-links" aria-label="Menu quick links">
        <div class="menu-cards">
          ${cards}
        </div>
        <h2 class="menu-list-title" aria-hidden="true">Menu Quick Links</h2>
        <div class="menu-list">
          ${tiles}
        </div>
      </section>`;
  }

  function showError(msg){
    root.innerHTML = `<div style="padding:28px;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.06)">${escapeHtml(msg)}</div>`;
  }

  // Try fetch menu.json; if not available, attempt relative path
  const paths = ['./menu.json', 'menu.json', window.location.pathname.replace(/\/[^/]*$/, '') + '/menu.json'];
  (async function load(){
    let data = null;
    for (const p of paths){
      try{
        const res = await fetch(p, {cache: 'no-cache'});
        if (!res.ok) continue;
        data = await res.json();
        break;
      }catch(e){ /* try next */ }
    }
    if (!data || !Array.isArray(data.categories)){
      showError('Menu data unavailable.');
      return;
    }

    const base = (data.imagesBasePath || './pictures/');
    console.log('Fetching menu.json from paths:', paths);
    console.log('Using imagesBasePath:', base);

    // Build top category nav
    const navHtml = renderCategoryNav(data.categories);

    // Render categories
    const catsHtml = data.categories.map(cat => renderCategory(cat, base)).join('');

    root.innerHTML = navHtml + catsHtml;
    const srCount = document.createElement('span');
    srCount.className = 'sr-only';
    srCount.textContent = `${data.categories.length} menu sections loaded`;
    root.appendChild(srCount);

    // Smooth scrolling for category links + active state handling
    const cardLinks = Array.from(root.querySelectorAll('.menu-cards .menu-card'));
    const tiles = Array.from(root.querySelectorAll('.menu-list .menu-tile'));
    const tileHeaders = tiles.map(tile => tile.querySelector('.menu-tile__header')).filter(Boolean);
    const tileLinks = Array.from(root.querySelectorAll('.menu-tile__option'));
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let manualTileLockUntil = 0;

    const prefersReducedMotion = () => reducedMotionQuery.matches;

    const closeTile = (tile, { animate = true } = {}) => {
      if (!tile || !tile.classList.contains('is-open')) return;
      const header = tile.querySelector('.menu-tile__header');
      const content = tile.querySelector('.menu-tile__content');
      if (!header || !content) return;

      tile.classList.remove('is-open');
      header.setAttribute('aria-expanded', 'false');

      const finishClose = () => {
        content.hidden = true;
        content.style.maxHeight = '';
        content.style.opacity = '';
        content.style.transform = '';
        tile.querySelectorAll('.menu-tile__option').forEach(link => link.classList.remove('active'));
      };

      if (!animate || prefersReducedMotion()){
        content.style.maxHeight = '0px';
        finishClose();
        return;
      }

      const currentHeight = content.scrollHeight;
      content.style.maxHeight = `${currentHeight}px`;
      requestAnimationFrame(() => {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.transform = 'translateY(-6px)';
      });

      const onTransitionEnd = (evt) => {
        if (evt.propertyName !== 'max-height') return;
        content.removeEventListener('transitionend', onTransitionEnd);
        finishClose();
      };
      content.addEventListener('transitionend', onTransitionEnd);
    };

    const openTile = (tile, { animate = true } = {}) => {
      if (!tile || tile.classList.contains('is-open')) return;
      const header = tile.querySelector('.menu-tile__header');
      const content = tile.querySelector('.menu-tile__content');
      if (!header || !content) return;

      tile.classList.add('is-open');
      header.setAttribute('aria-expanded', 'true');
      content.hidden = false;

      if (!animate || prefersReducedMotion()){
        content.style.maxHeight = 'none';
        content.style.opacity = '1';
        content.style.transform = 'none';
        return;
      }

      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      content.style.transform = 'translateY(-6px)';

      const onTransitionEnd = (evt) => {
        if (evt.propertyName !== 'max-height') return;
        content.removeEventListener('transitionend', onTransitionEnd);
        if (tile.classList.contains('is-open')) {
          content.style.maxHeight = 'none';
        }
      };
      content.addEventListener('transitionend', onTransitionEnd);

      requestAnimationFrame(() => {
        const fullHeight = content.scrollHeight;
        content.style.maxHeight = `${fullHeight}px`;
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      });
    };

    const closeOtherTiles = (except) => {
      tiles.forEach(tile => {
        if (tile !== except) {
          closeTile(tile);
        }
      });
    };

    const highlightTileOption = (hash) => {
      tileLinks.forEach(link => {
        if (!link.hash) return;
        if (link.hash === hash) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    const setActiveLink = (targetId, { fromScroll = false } = {}) => {
      const hash = `#${targetId}`;
      const now = Date.now();
      const skipTileSync = fromScroll && now < manualTileLockUntil;

      cardLinks.forEach(link => {
        const linkTarget = link.getAttribute('href') || '';
        if (linkTarget.replace(/^#/, '') === targetId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      const matchingLink = tileLinks.find(link => (link.getAttribute('href') || '') === hash);
      if (skipTileSync){
        highlightTileOption(hash);
        return;
      }

      if (matchingLink){
        const tile = matchingLink.closest('.menu-tile');
        if (tile){
          closeOtherTiles(tile);
          openTile(tile, { animate: !fromScroll });
          highlightTileOption(hash);
        }
      } else {
        highlightTileOption('');
      }
    };

    cardLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = (link.getAttribute('href') || '').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          setActiveLink(targetId);
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    });

    tileHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const tile = header.closest('.menu-tile');
        if (!tile) return;
        const shouldOpen = !tile.classList.contains('is-open');
        if (shouldOpen){
          manualTileLockUntil = Date.now() + 1800;
          closeOtherTiles(tile);
          openTile(tile);
        } else {
          closeTile(tile);
          highlightTileOption('');
          manualTileLockUntil = Date.now() + 400;
        }
      });
    });

    tileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = (link.getAttribute('href') || '').slice(1);
        const target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();
        manualTileLockUntil = 0;
        setActiveLink(targetId);
        target.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });

    // Update active link while scrolling using IntersectionObserver
    try{
      const sections = Array.from(root.querySelectorAll('section[id^="cat-"]'));
      const idToLink = new Map(
        sections.map(section => [section.id, cardLinks.find(link => (link.getAttribute('href') || '') === `#${section.id}`)])
      );
      let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.target || !entry.isIntersecting) return;
          const link = idToLink.get(entry.target.id);
          if (link) {
            setActiveLink(entry.target.id, { fromScroll: true });
          }
        });
      }, { root: null, rootMargin: '0px 0px -40% 0px', threshold: 0.25 });
      sections.forEach(s => observer.observe(s));
    }catch(e){ /* IntersectionObserver not supported — fine */ }

    // announce number of categories for screen readers
    root.setAttribute('aria-label', `${data.categories.length} menu sections loaded`);
  })();
})();
