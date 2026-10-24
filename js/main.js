/* ============================================
   DAVIDE D'ANNA — Home page logic
   (dynamic work grid from /api/projects)
   ============================================= */

const PLACEHOLDER_SVG = `
<svg class="work-svg" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 200 L110 130 L150 155 L200 90 L240 115" stroke="rgba(232,224,216,0.45)" stroke-width="2" fill="none"/>
    <circle cx="190" cy="190" r="48" stroke="rgba(232,224,216,0.25)" stroke-width="1" fill="none"/>
    <circle cx="190" cy="190" r="28" stroke="rgba(232,224,216,0.18)" stroke-width="1" fill="none"/>
</svg>`;

function projectCoverUrl(project) {
    const images = project.images || [];
    if (images.length > 0) {
        return images[0].thumbnail_url || images[0].url;
    }
    return '';
}

function createWorkItem(project, index) {
    const item = document.createElement('a');
    item.className = 'work-item reveal-up'
        + (index === 0 ? ' work-item--large' : '')
        + (index === 3 ? ' work-item--wide' : '');
    item.href = (window.BASE_PATH || '') + '/progetti/' + encodeURIComponent(project.slug);

    const cover = projectCoverUrl(project);
    let imageHtml;
    if (cover) {
        imageHtml = `<img src="${escapeHtml(cover)}" alt="${escapeHtml(project.title)}" loading="lazy">`;
    } else {
        imageHtml = `<div class="work-placeholder">${PLACEHOLDER_SVG}</div>`;
    }

    item.innerHTML = `
        <div class="work-image">${imageHtml}</div>
        <div class="work-info">
            <span class="work-category">${escapeHtml(project.category || '')}</span>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.short_description || project.description || '')}</p>
            ${project.year ? `<span class="work-year">${escapeHtml(project.year)}</span>` : ''}
        </div>`;
    return item;
}

async function loadProjects() {
    const grid = document.getElementById('work-grid');
    if (!grid) return;

    try {
        const res = await fetch(window.API_BASE + '/api/projects');
        if (!res.ok) throw new Error('API non disponibile');
        const projects = await res.json();

        projects.forEach((project, index) => {
            grid.appendChild(createWorkItem(project, index));
        });

        observeReveals(grid);
        initTilt();
    } catch (err) {
        grid.innerHTML = '<p class="work-grid-error">Non è stato possibile caricare i progetti.</p>';
    }
}

// ---- WORK ITEM TILT (delegated for dynamic items) ----
function initTilt() {
    const grid = document.getElementById('work-grid');
    if (!grid || grid.dataset.tiltInit === '1') return;
    grid.dataset.tiltInit = '1';

    grid.addEventListener('mousemove', (e) => {
        const item = e.target.closest('.work-item');
        if (!item) return;

        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    grid.addEventListener('mouseleave', (e) => {
        const item = e.target.closest('.work-item');
        if (item) {
            item.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        }
    });

    grid.addEventListener('mouseout', (e) => {
        const item = e.target.closest('.work-item');
        if (item && !item.contains(e.relatedTarget)) {
            item.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        }
    });
}

document.addEventListener('DOMContentLoaded', loadProjects);
