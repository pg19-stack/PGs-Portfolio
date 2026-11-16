// ============================================
// PG Portfolio - Interactive Script
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile menu toggle ---
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    const setMenu = (open) => {
        nav.classList.toggle('open', open);
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
    };
    if (toggle && nav) {
        toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
        nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    }

    // --- Scroll reveal ---
    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('visible'));
    }

    // --- Active nav link highlighting ---
    const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
    const updateActive = () => {
        const line = window.scrollY + window.innerHeight * 0.35;
        let current = null;
        sections.forEach(section => {
            if (section.offsetTop <= line) current = section;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', !!current && link.getAttribute('href') === '#' + current.id);
        });
    };
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
});
