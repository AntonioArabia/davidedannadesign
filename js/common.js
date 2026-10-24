/* ============================================
   DAVIDE D'ANNA — Shared behavior
   (loader, cursor, navbar, reveals, stats, parallax)
   ============================================= */

// ---- HTML ESCAPE (shared by main.js and project.js) ----
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ---- LOADER ----
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('done');
        const hero = document.getElementById('hero');
        if (hero) animateHero();
        setupReveals();
    }, 1400);
});

// ---- HERO REVEAL SEQUENCE ----
function animateHero() {
    const hero = document.getElementById('hero');
    hero.classList.add('visible');

    const reveals = hero.querySelectorAll('.reveal-up');
    reveals.forEach((el, i) => {
        setTimeout(() => {
            el.classList.add('revealed');
        }, 300 + (i * 250));
    });
}

// ---- CUSTOM CURSOR ----
(function initCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    if (!cursor || !follower) return;

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    function animateFollower() {
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';
        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    const HOVER_SELECTOR = 'a, .work-item, .service-card, button';

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(HOVER_SELECTOR)) {
            cursor.classList.add('hover');
            follower.classList.add('hover');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(HOVER_SELECTOR)) {
            cursor.classList.remove('hover');
            follower.classList.remove('hover');
        }
    });
})();

// ---- NAVBAR SCROLL EFFECT ----
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    setTimeout(() => {
        navbar.classList.add('visible');
    }, 1500);

    // Smooth scroll for hash links pointing to sections on this page
    document.querySelectorAll('.nav-links a, .logo').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
})();

// ---- SECTION + ELEMENT REVEALS ----
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');

            const parent = entry.target.parentElement;
            const siblings = parent.querySelectorAll('.reveal-up:not(.revealed)');
            siblings.forEach((sib, i) => {
                setTimeout(() => {
                    sib.classList.add('revealed');
                }, (i + 1) * 120);
            });

            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

let sectionObserver = null;

function observeReveals(root) {
    (root || document).querySelectorAll('.reveal-up').forEach(el => {
        if (!el.classList.contains('revealed')) {
            revealObserver.observe(el);
        }
    });
}

function setupReveals() {
    if (sectionObserver) sectionObserver.disconnect();

    sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.hidden').forEach(section => {
        if (section.id !== 'hero') {
            sectionObserver.observe(section);
        }
    });

    observeReveals(document);
}

// ---- STAT COUNTER ANIMATION ----
function initStatCounters() {
    const statsContainer = document.querySelector('.about-stats');
    if (!statsContainer) return;

    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stats = entry.target.querySelectorAll('.stat-number');
                stats.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    animateCounter(stat, target);
                });
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statObserver.observe(statsContainer);
}

function animateCounter(el, target) {
    let current = 0;
    const duration = 2000;
    const step = target / (duration / 16);

    function update() {
        current += step;
        if (current < target) {
            el.textContent = Math.floor(current);
            requestAnimationFrame(update);
        } else {
            el.textContent = target + '+';
        }
    }
    update();
}

// ---- PARALLAX SUBTLE EFFECTS ----
(function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;

        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.25}px)`;
            heroContent.style.opacity = 1 - (scrolled / (window.innerHeight * 0.8));
        }

        const scrollInd = document.querySelector('.scroll-indicator');
        if (scrollInd && scrolled < window.innerHeight) {
            scrollInd.style.transform = `translateX(-50%) translateY(${scrolled * 0.15}px)`;
        }
    });
})();

// ---- MAGNETIC BUTTON EFFECT ----
function initMagnetic() {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
        });
    });
}

// ---- ACTIVE NAV HIGHLIGHT ----
(function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    if (!sections.length || !navLinks.length) return;

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 200;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.style.color = '';
            if (link.getAttribute('href') === `#${current}`) {
                link.style.color = 'var(--accent)';
            }
        });
    });
})();

window.addEventListener('DOMContentLoaded', () => {
    initStatCounters();
    initMagnetic();
});
