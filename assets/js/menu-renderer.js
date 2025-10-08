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

  // Try common image extensions for best-effort thumbnails without enlarging dataset
  const IMG_EXTS = ['.webp', '.jpg', '.jpeg', '.png'];

  function buildImgTag(base, id, name){
    // Don't render any image element if no base path or id - cleaner approach
    return '';
  }

  function renderItem(item, base){
    const price = item.price != null ? `<span class="sig-price">${formatPrice(item.price)}</span>` : '';
    const desc = item.description ? `<p>${escapeHtml(item.description)}</p>` : '';
    
    // Only add image if we have actual image files for specific items
    const hasKnownImage = ['empanadas'].includes(item.id); // Only empanadas has image for now
    const media = hasKnownImage ? `<div class="sig-card-media"><img loading="lazy" decoding="async" src="${escapeHtml(base)}${escapeHtml(item.id)}.webp" alt="${escapeHtml(item.name)}"></div>` : '';
    const cardClass = hasKnownImage ? 'sig-card' : 'sig-card no-media';
    
    return `
      <article class="${cardClass}">
        ${media}
        <div class="sig-body">
          <h3>${escapeHtml(item.name)}</h3>
          ${desc}
          ${price}
        </div>
      </article>`;
  }

  function renderCategory(cat, base){
    const items = (cat.items || []).map(i => renderItem(i, base)).join('');
    return `
      <section class="sig" id="cat-${escapeHtml(cat.id)}" aria-labelledby="cat-${escapeHtml(cat.id)}-title">
        <div class="container">
          <h2 id="cat-${escapeHtml(cat.id)}-title" class="section-title">${escapeHtml(cat.name)}</h2>
          <div class="sig-grid">${items}</div>
        </div>
      </section>`;
  }

  function renderCategoryNav(categories){
    if (!categories || !categories.length) return '';
    const buttons = categories.map(cat => `<a class="btn ghost" href="#cat-${escapeHtml(cat.id)}">${escapeHtml(cat.name)}</a>`).join(' ');
    return `<div class="menu-cats" style="margin:18px 0;text-align:center">${buttons}</div>`;
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

    // Build top category nav
    const navHtml = renderCategoryNav(data.categories);

    // Render categories
    const catsHtml = data.categories.map(cat => renderCategory(cat, base)).join('');

    root.innerHTML = navHtml + catsHtml;

    // Smooth scrolling for category links + active state handling
    const catLinks = Array.from(root.querySelectorAll('.menu-cats a'));
    catLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        const targetId = a.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          // update active class immediately
          catLinks.forEach(l => l.classList.remove('active'));
          a.classList.add('active');
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    });

    // Update active link while scrolling using IntersectionObserver
    try{
      const sections = Array.from(root.querySelectorAll('section[id^="cat-"]'));
      const idToLink = new Map(sections.map(s => [s.id, root.querySelector(`.menu-cats a[href="#${s.id}"]`)]));
      let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.target || !entry.isIntersecting) return;
          const link = idToLink.get(entry.target.id);
          if (link) {
            catLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      }, { root: null, rootMargin: '0px 0px -40% 0px', threshold: 0.25 });
      sections.forEach(s => observer.observe(s));
    }catch(e){ /* IntersectionObserver not supported — fine */ }

    // announce number of categories for screen readers
    root.setAttribute('aria-label', `${data.categories.length} menu sections loaded`);
  })();
})();
