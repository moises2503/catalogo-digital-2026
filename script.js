const totalPages = 52;
const pageImages = Array.from({ length: totalPages }, (_, i) => `pages/page-${String(i + 1).padStart(2, '0')}.jpg`);

const spreadEl = document.getElementById('spread');
const viewerEl = document.getElementById('viewer');
const pageLabel = document.getElementById('pageLabel');
const pageInput = document.getElementById('pageInput');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const goBtn = document.getElementById('goBtn');
const clickPrev = document.getElementById('clickPrev');
const clickNext = document.getElementById('clickNext');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const quickLinks = Array.from(document.querySelectorAll('.quick-link'));
const magazineShell = document.querySelector('.magazine-shell');
const flipDuration = 400;

let currentPage = 1;
let isAnimating = false;

function clampPage(page) {
  return Math.max(1, Math.min(totalPages, page));
}

function normalizePageForView(page) {
  page = clampPage(page);
  if (page === 1) return 1;
  return page % 2 === 0 ? page : page - 1;
}

function getDisplayedPages(page) {
  if (page === 1) return [1];
  const left = normalizePageForView(page);
  const right = left + 1 <= totalPages ? left + 1 : null;
  return [left, right].filter(Boolean);
}

function getPageLabel(pages) {
  if (pages.length === 1) {
    return pages[0] === 1 ? 'Portada · Página 1' : `Página ${pages[0]} de ${totalPages}`;
  }
  return `Páginas ${pages[0]} y ${pages[1]} de ${totalPages}`;
}

function createPageCard(pageNum, positionClass, isSingle) {
  const article = document.createElement('article');
  article.className = `page-card ${positionClass} ${isSingle ? 'single' : ''}`.trim();

  const img = document.createElement('img');
  img.className = 'page-media';
  img.src = pageImages[pageNum - 1];
  img.alt = `Página ${pageNum} del catálogo`;
  img.loading = pageNum <= 3 ? 'eager' : 'lazy';
  const setPageAspectRatio = () => {
    if (img.naturalWidth && img.naturalHeight) {
      article.style.setProperty('--page-aspect-ratio', `${img.naturalWidth} / ${img.naturalHeight}`);
    }
  };
  img.addEventListener('load', setPageAspectRatio, { once: true });
  if (img.complete) setPageAspectRatio();

  if (pageNum === 1) {
    const contact = document.createElement('a');
    contact.className = 'cover-contact';
    contact.href = 'https://wa.me/529181139130';
    contact.textContent = 'WhatsApp · 9181139130';
    contact.setAttribute('aria-label', 'Contactar por WhatsApp al 9181139130');
    contact.target = '_blank';
    contact.rel = 'noopener noreferrer';
    article.appendChild(contact);
  }

  const tag = document.createElement('div');
  tag.className = 'page-number-tag';
  tag.textContent = `Página ${pageNum}`;

  article.appendChild(img);
  article.appendChild(tag);
  return article;
}

function updateQuickLinks() {
  quickLinks.forEach(btn => {
    const startPage = Number(btn.dataset.page);
    const pages = getDisplayedPages(currentPage);
    const isActive = pages.includes(startPage) || (startPage === 1 && currentPage === 1);
    btn.classList.toggle('active', isActive);
  });
}

function renderViewer() {
  currentPage = normalizePageForView(currentPage);
  const pages = getDisplayedPages(currentPage);
  spreadEl.innerHTML = '';
  spreadEl.classList.toggle('single-page', pages.length === 1);

  if (pages.length === 1) {
    spreadEl.appendChild(createPageCard(pages[0], 'single', true));
  } else {
    spreadEl.appendChild(createPageCard(pages[0], 'left', false));
    spreadEl.appendChild(createPageCard(pages[1], 'right', false));
  }

  pageLabel.textContent = getPageLabel(pages);
  pageInput.value = pages[0];
  prevBtn.disabled = pages[0] <= 1 || isAnimating;
  nextBtn.disabled = pages[pages.length - 1] >= totalPages || isAnimating;
  clickPrev.disabled = prevBtn.disabled;
  clickNext.disabled = nextBtn.disabled;
  updateQuickLinks();

}

function getNextTargetPage() {
  if (currentPage === 1) return 2;
  return clampPage(currentPage + 2);
}

function getPrevTargetPage() {
  if (currentPage <= 2) return 1;
  return clampPage(currentPage - 2);
}

function buildFlipOverlay(direction, sourcePage, side) {
  const overlay = document.createElement('div');
  overlay.className = `flip-overlay ${side} ${direction}`;

  const sheet = document.createElement('div');
  sheet.className = 'flip-sheet';

  const front = document.createElement('div');
  front.className = 'flip-face front';
  const img = document.createElement('img');
  img.src = pageImages[sourcePage - 1];
  img.alt = `Animación de página ${sourcePage}`;
  front.appendChild(img);

  const back = document.createElement('div');
  back.className = 'flip-face back';

  const gloss = document.createElement('div');
  gloss.className = 'flip-gloss';

  sheet.appendChild(front);
  sheet.appendChild(back);
  sheet.appendChild(gloss);
  overlay.appendChild(sheet);
  return overlay;
}

function runFlipTransition(direction, targetPage) {
  if (isAnimating) return;

  const currentDisplayed = getDisplayedPages(currentPage);
  const hasTarget = direction === 'next'
    ? currentDisplayed[currentDisplayed.length - 1] < totalPages
    : currentDisplayed[0] > 1;

  if (!hasTarget) return;

  isAnimating = true;

  let sourcePage = currentDisplayed[0];
  let side = 'full';

  if (currentDisplayed.length === 1) {
    side = 'full';
    sourcePage = currentDisplayed[0];
  } else if (direction === 'next') {
    side = 'right';
    sourcePage = currentDisplayed[currentDisplayed.length - 1];
  } else {
    side = 'left';
    sourcePage = currentDisplayed[0];
  }

  currentPage = targetPage;
  renderViewer();

  const overlay = buildFlipOverlay(direction, sourcePage, side);
  spreadEl.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('animate');
    });
  });

  window.setTimeout(() => {
    overlay.remove();
    isAnimating = false;
    renderViewer();
  }, flipDuration);
}

function goNext() {
  const target = getNextTargetPage();
  if (target === currentPage) return;
  runFlipTransition('next', target);
}

function goPrev() {
  const target = getPrevTargetPage();
  if (target === currentPage) return;
  runFlipTransition('prev', target);
}

function goToPage(page) {
  if (isAnimating) return;
  currentPage = clampPage(Number(page) || 1);
  renderViewer();
}

prevBtn.addEventListener('click', goPrev);
nextBtn.addEventListener('click', goNext);
clickPrev.addEventListener('click', goPrev);
clickNext.addEventListener('click', goNext);
goBtn.addEventListener('click', () => goToPage(pageInput.value));
pageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') goToPage(pageInput.value);
});

viewerEl.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') goNext();
  if (event.key === 'ArrowLeft') goPrev();
});

document.addEventListener('keydown', (event) => {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT') return;
  if (event.key === 'ArrowRight') goNext();
  if (event.key === 'ArrowLeft') goPrev();
});

quickLinks.forEach(btn => {
  btn.addEventListener('click', () => {
    goToPage(Number(btn.dataset.page));
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

function isCatalogFullscreen() {
  return document.fullscreenElement === magazineShell || magazineShell.classList.contains('is-fullscreen');
}

function updateFullscreenButton() {
  const isFullscreen = isCatalogFullscreen();
  fullscreenBtn.textContent = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';
  fullscreenBtn.setAttribute('aria-expanded', String(isFullscreen));
  document.body.classList.toggle('catalog-fullscreen-active', isFullscreen);
}

fullscreenBtn.addEventListener('click', async () => {
  if (isCatalogFullscreen()) {
    if (document.fullscreenElement === magazineShell) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn('No se pudo salir de pantalla completa', error);
        magazineShell.classList.remove('is-fullscreen');
      }
    } else {
      magazineShell.classList.remove('is-fullscreen');
    }
    updateFullscreenButton();
    return;
  }

  if (typeof magazineShell.requestFullscreen === 'function') {
    try {
      await magazineShell.requestFullscreen();
      updateFullscreenButton();
      return;
    } catch (error) {
      console.warn('No se pudo activar pantalla completa nativa; se usará la vista ampliada', error);
    }
  }

  magazineShell.classList.add('is-fullscreen');
  updateFullscreenButton();
});

document.addEventListener('fullscreenchange', updateFullscreenButton);

renderViewer();
