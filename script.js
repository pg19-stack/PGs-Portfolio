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

    // --- Case studies open in place under the cards ---
    const cases = Array.from(document.querySelectorAll('.case'));
    const cards = Array.from(document.querySelectorAll('.insight[data-case]'));
    const scrollToEl = (el) => {
        const y = window.scrollY + el.getBoundingClientRect().top - header.offsetHeight - 30;
        window.scrollTo({ top: y, behavior: 'smooth' });
    };
    const setHash = (id) => {
        try {
            if (history.replaceState) history.replaceState(null, '', id ? '#' + id : location.pathname + location.search);
        } catch (e) { /* not available in every viewer */ }
    };
    const showCase = (id) => {
        const target = cases.find(c => c.id === id);
        if (!target) return null;
        cases.forEach(c => c.classList.toggle('active', c === target));
        cards.forEach(card => {
            const on = card.dataset.case === id;
            card.classList.toggle('is-open', on);
            card.setAttribute('aria-expanded', String(on));
        });
        return target;
    };
    const closeCases = () => {
        const openCard = cards.find(card => card.classList.contains('is-open'));
        cases.forEach(c => c.classList.remove('active'));
        cards.forEach(card => { card.classList.remove('is-open'); card.setAttribute('aria-expanded', 'false'); });
        setHash('');
        if (openCard) scrollToEl(openCard);
    };
    document.querySelectorAll('a[data-case]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = showCase(link.dataset.case);
            if (!target) return;
            setHash(target.id);
            scrollToEl(target);
        });
    });
    document.querySelectorAll('.case-close').forEach(btn => btn.addEventListener('click', closeCases));
    cards.forEach(card => card.setAttribute('aria-expanded', 'false'));
    const initial = showCase((location.hash || '').slice(1));
    if (initial) setTimeout(() => scrollToEl(initial), 150);

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
