// ============================================
// PG Portfolio - Interactive Script
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    const header = document.getElementById('site-header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');

    // --- Header: clear over the hero, white once scrolled or when the menu is open ---
    const updateHeader = () => {
        const menuOpen = nav && nav.classList.contains('open');
        header.classList.toggle('solid', window.scrollY > 40 || menuOpen);
    };

    // --- Mobile menu toggle ---
    const setMenu = (open) => {
        nav.classList.toggle('open', open);
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
        updateHeader();
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

    // --- Case study viewer ---
    const cases = Array.from(document.querySelectorAll('.case'));
    const tabs = Array.from(document.querySelectorAll('.case-tabs a'));
    const tabBar = document.getElementById('case-tabs');
    const showCase = (id) => {
        if (!cases.some(c => c.id === id)) return false;
        cases.forEach(c => c.classList.toggle('active', c.id === id));
        tabs.forEach(t => {
            const on = t.dataset.case === id;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', String(on));
            if (on && tabBar) {
                const left = t.offsetLeft - (tabBar.clientWidth - t.offsetWidth) / 2;
                tabBar.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
            }
        });
        return true;
    };
    document.querySelectorAll('a[data-case]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.dataset.case;
            showCase(id);
            if (history.replaceState) history.replaceState(null, '', '#' + id);
            // Cards jump down to the viewer; tabs only move the page if the viewer top is off screen
            const fromTab = link.closest('.case-tabs');
            const top = tabBar.getBoundingClientRect().top;
            if (!fromTab || top < 0 || top > window.innerHeight * 0.5) {
                const y = window.scrollY + top - header.offsetHeight + 1;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });
    const initial = (location.hash || '').slice(1);
    if (!showCase(initial)) showCase('case-1');

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
    const onScroll = () => { updateHeader(); updateActive(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
});
