/* ============================================
   DAVIDE D'ANNA — Project detail page logic
   ============================================= */

const PLACEHOLDER_IMG_SVG =
    "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<rect width="400" height="300" fill="rgba(15,12,10,0.06)"/>' +
        '<circle cx="200" cy="150" r="64" fill="none" stroke="rgba(15,12,10,0.2)" stroke-width="1.5"/>' +
        '<path d="M120 190 L170 130 L210 155 L260 100 L300 120" stroke="rgba(15,12,10,0.25)" stroke-width="2" fill="none"/>' +
        '</svg>'
    );

function slugFromPath() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const idx = parts.lastIndexOf('progetti');
    if (idx === -1) return decodeURIComponent(parts[parts.length - 1] || '');
    return decodeURIComponent(parts[idx + 1] || '');
}

function imgSrc(img) {
    return img.thumbnail_url || img.url;
}

function captionHtml(project, img, i) {
    const parts = [];
    if (img.alt_text) parts.push(escapeHtml(img.alt_text));
    if (img.caption) parts.push(escapeHtml(img.caption));
    if (!parts.length && project.title) parts.push(escapeHtml(project.title) + ' — ' + (i + 1));
    return parts.length ? parts.join(' · ') : '';
}

function renderProject(project) {
    const root = document.getElementById('project-shell');
    if (!root) return;

    root.innerHTML = `
    <article class="project-page">
        <div class="container project-header">
            <a href="${window.BASE_PATH || ''}/" class="back-link">← Torna al portfolio</a>
            <p class="section-label">${escapeHtml(project.category || 'Progetto')}</p>
            <h1 class="project-title">${escapeHtml(project.title)}</h1>
            ${project.year ? `<p class="project-year">${escapeHtml(project.year)}</p>` : ''}
        </div>

        ${project.description ? `
        <div class="container project-description">
            <div class="project-desc-text reveal-up">${escapeHtml(project.description).replace(/\n/g, '<br>')}</div>
        </div>` : ''}

        <div class="container project-gallery-wrap">
            <div class="project-gallery" id="project-gallery"></div>
        </div>

        <nav class="project-nav" id="project-nav"></nav>
    </article>`;

    const shell = root;
    shell.classList.add('ready');
    observeReveals(shell);
    shell.querySelectorAll('.hidden').forEach(s => s.classList.add('visible'));

    const gallery = document.getElementById('project-gallery');
    const images = (project.images || []).slice();

    if (images.length === 0) {
        gallery.innerHTML = '<p class="project-no-images">Al momento non sono disponibili immagini per questo progetto.</p>';
    } else {
        images.forEach((img, i) => {
            const figure = document.createElement('figure');
            figure.className = 'project-gallery-item';
            figure.innerHTML = `
                <img src="${escapeHtml(imgSrc(img))}" alt="${escapeHtml(img.alt_text || project.title)}" loading="lazy" data-full="${escapeHtml(img.url || img.thumbnail_url)}">
                <figcaption>${captionHtml(project, img, i)}</figcaption>`;
            figure.addEventListener('click', () => openLightbox(images, i));
            gallery.appendChild(figure);
        });
    }

    // Prev / next
    const nav = document.getElementById('project-nav');
    if (nav && window.__relatedProjects && window.__relatedProjects.length > 1) {
        const all = window.__relatedProjects;
        const i = all.findIndex(p => p.slug === project.slug);
        const prev = all[(i - 1 + all.length) % all.length];
        const next = all[(i + 1) % all.length];
        nav.innerHTML = `
            <a class="project-nav-item project-nav-prev" href="${window.BASE_PATH || ''}/progetti/${encodeURIComponent(prev.slug)}">
                <span>&larr; Precedente</span>
                <strong>${escapeHtml(prev.title)}</strong>
            </a>
            <a class="project-nav-item project-nav-next" href="${window.BASE_PATH || ''}/progetti/${encodeURIComponent(next.slug)}">
                <span>Successivo &rarr;</span>
                <strong>${escapeHtml(next.title)}</strong>
            </a>`;
    }
}

// ---- LIGHTBOX ----
let lightboxIndex = 0;
let lightboxImages = [];

function openLightbox(images, start) {
    lightboxImages = images;
    lightboxIndex = start;
    document.getElementById('lightbox').classList.add('open');
    updateLightbox();
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
    lightboxImages = [];
}

function stepLightbox(dir) {
    if (!lightboxImages.length) return;
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    updateLightbox();
}

function updateLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb || lightboxIndex >= lightboxImages.length) return;
    const img = lightboxImages[lightboxIndex];
    lb.querySelector('img').src = img.url || img.thumbnail_url;
    lb.querySelector('img').alt = img.alt_text || '';
    lb.querySelector('.lightbox-caption').textContent =
        `${lightboxIndex + 1} / ${lightboxImages.length}${img.caption ? ' — ' + img.caption : ''}`;
    lb.querySelector('.lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
}

function initLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox-prev').addEventListener('click', () => stepLightbox(-1));
    lb.querySelector('.lightbox-next').addEventListener('click', () => stepLightbox(1));

    lb.addEventListener('click', (e) => {
        if (e.target === lb) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') stepLightbox(-1);
        if (e.key === 'ArrowRight') stepLightbox(1);
    });
}

// ---- LOAD ----
async function loadProjectPage() {
    const slug = slugFromPath();

    let res = await fetch(window.API_BASE + `/api/projects/by-slug/${encodeURIComponent(slug)}`);
    if (res.status === 404) {
        showNotFound();
        return;
    }
    if (!res.ok) {
        showLoadError();
        return;
    }
    const project = await res.json();

    try {
        const allRes = await fetch(window.API_BASE + '/api/projects');
        if (allRes.ok) {
            window.__relatedProjects = await allRes.json();
        }
    } catch (e) {
        // non-blocking
    }

    renderProject(project);
}

function showNotFound() {
    const root = document.getElementById('project-shell');
    root.innerHTML = `
        <div class="container project-error">
            <p class="section-label">404</p>
            <h1>Progetto non trovato</h1>
            <p>Il progetto che cerchi non esiste o non è più pubblicato.</p>
            <a href="${window.BASE_PATH || ''}/" class="contact-email" data-magnetic>
                <span>Torna al portfolio</span>
            </a>
        </div>`;
}

function showLoadError() {
    const root = document.getElementById('project-shell');
    root.innerHTML = `
        <div class="container project-error">
            <p class="section-label">Errore</p>
            <h1>Impossibile caricare il progetto</h1>
            <a href="${window.BASE_PATH || ''}/" class="contact-email" data-magnetic>
                <span>Torna al portfolio</span>
            </a>
        </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    initLightbox();
    loadProjectPage();
});
