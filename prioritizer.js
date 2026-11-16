// ============================================
// AI Use-Case Prioritizer
// ============================================

(function () {
    'use strict';

    var STORE_KEY = 'pg-prioritizer-v1';
    var MAX_IDEAS = 12;
    var LANES = {
        quick: 'Quick Wins',
        platform: 'Platform Bets',
        frontier: 'Frontier R&D',
        revisit: 'Revisit later'
    };
    var TIMES = [
        { months: 3, label: '1 to 3 months', speed: 5 },
        { months: 6, label: 'About 6 months', speed: 4 },
        { months: 12, label: 'About 12 months', speed: 2.5 },
        { months: 24, label: '18 months or more', speed: 1 }
    ];
    var EXAMPLES = [
        { name: 'Meeting and document summaries', value: 3, feasibility: 5, risk: 1, months: 3 },
        { name: 'AI skills training for all staff', value: 4, feasibility: 5, risk: 1, months: 3 },
        { name: 'Fraud detection signals', value: 5, feasibility: 4, risk: 3, months: 6 },
        { name: 'Hyper-personalized offers', value: 5, feasibility: 3, risk: 3, months: 12 },
        { name: 'Agents that draft credit memos', value: 5, feasibility: 2, risk: 4, months: 24 },
        { name: 'Chatbot for internal policy questions', value: 2, feasibility: 4, risk: 2, months: 6 }
    ];

    var ideasEl = document.getElementById('ideas');
    var chart = document.getElementById('chart');
    var tip = document.getElementById('tip');
    var addBtn = document.getElementById('add-idea');
    var limitNote = document.getElementById('limit-note');
    var exampleNote = document.getElementById('example-note');
    var SVG = 'http://www.w3.org/2000/svg';

    var state = { ideas: [], examples: true };

    // ---------- model ----------
    function speedOf(months) {
        for (var i = 0; i < TIMES.length; i++) if (TIMES[i].months === months) return TIMES[i].speed;
        return 1;
    }
    function timeLabel(months) {
        for (var i = 0; i < TIMES.length; i++) if (TIMES[i].months === months) return TIMES[i].label;
        return '';
    }
    function score(idea) {
        var raw = idea.value * 0.40 + idea.feasibility * 0.25 + speedOf(idea.months) * 0.20 + (6 - idea.risk) * 0.15;
        return Math.round(raw / 5 * 100);
    }
    function lane(idea) {
        if (idea.months <= 3 && idea.feasibility >= 4 && idea.value >= 3) return 'quick';
        if (idea.value >= 4 && idea.feasibility >= 3 && idea.months <= 12) return 'platform';
        if (idea.value >= 4) return 'frontier';
        return 'revisit';
    }
    function clampInt(v, lo, hi, dflt) {
        v = parseInt(v, 10);
        if (isNaN(v)) return dflt;
        return Math.min(hi, Math.max(lo, v));
    }
    function clean(list) {
        if (!Array.isArray(list)) return null;
        return list.slice(0, MAX_IDEAS).map(function (i) {
            var months = clampInt(i && i.months, 3, 24, 6);
            if ([3, 6, 12, 24].indexOf(months) === -1) months = 6;
            return {
                name: String((i && i.name) || '').slice(0, 60),
                value: clampInt(i && i.value, 1, 5, 3),
                feasibility: clampInt(i && i.feasibility, 1, 5, 3),
                risk: clampInt(i && i.risk, 1, 5, 3),
                months: months
            };
        });
    }

    // ---------- storage (optional; the page works without it) ----------
    function load() {
        try {
            var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
            var list = saved && clean(saved.ideas);
            if (list) { state.ideas = list; state.examples = !!saved.examples; return; }
        } catch (e) { /* ignore */ }
        state.ideas = clean(EXAMPLES);
        state.examples = true;
    }
    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    // ---------- helpers ----------
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    }
    function svg(tag, attrs) {
        var n = document.createElementNS(SVG, tag);
        for (var k in attrs) n.setAttribute(k, attrs[k]);
        return n;
    }
    function displayName(idea, i) { return idea.name.trim() || 'Idea ' + (i + 1); }

    // ---------- editor ----------
    function slider(idea, key, label, lowHint, highHint, i) {
        var wrap = el('div', 'field');
        var id = 'idea-' + i + '-' + key;
        var lab = el('label');
        lab.setAttribute('for', id);
        lab.appendChild(el('span', '', label));
        var out = el('output', '', idea[key] + ' / 5');
        lab.appendChild(out);
        var input = el('input');
        input.type = 'range'; input.min = 1; input.max = 5; input.step = 1; input.value = idea[key]; input.id = id;
        input.title = '1 = ' + lowHint + ', 5 = ' + highHint;
        input.addEventListener('input', function () {
            idea[key] = clampInt(input.value, 1, 5, 3);
            out.textContent = idea[key] + ' / 5';
            touched(); refresh(false);
        });
        wrap.appendChild(lab); wrap.appendChild(input);
        return wrap;
    }
    function renderEditor() {
        ideasEl.textContent = '';
        state.ideas.forEach(function (idea, i) {
            var card = el('div', 'idea');
            card.dataset.index = i;

            var top = el('div', 'idea-top');
            top.appendChild(el('span', 'idea-num', String(i + 1)));
            var name = el('input', 'idea-name');
            name.type = 'text'; name.value = idea.name; name.maxLength = 60; name.id = 'idea-' + i + '-name';
            name.placeholder = 'Name this idea';
            name.setAttribute('aria-label', 'Name of idea ' + (i + 1));
            name.addEventListener('input', function () { idea.name = name.value; touched(); refresh(false); });
            top.appendChild(name);
            var rm = el('button', 'idea-remove', '×');
            rm.type = 'button';
            rm.setAttribute('aria-label', 'Remove idea ' + (i + 1));
            rm.addEventListener('click', function () { state.ideas.splice(i, 1); touched(); refresh(true); });
            top.appendChild(rm);
            card.appendChild(top);

            var fields = el('div', 'idea-fields');
            fields.appendChild(slider(idea, 'value', 'Value', 'low', 'high', i));
            fields.appendChild(slider(idea, 'feasibility', 'Feasibility', 'very hard', 'easy', i));
            fields.appendChild(slider(idea, 'risk', 'Risk', 'low', 'high', i));
            var tf = el('div', 'field');
            var tl = el('label'); tl.setAttribute('for', 'idea-' + i + '-time');
            tl.appendChild(el('span', '', 'Time to impact'));
            var sel = el('select'); sel.id = 'idea-' + i + '-time';
            TIMES.forEach(function (t) {
                var o = el('option', '', t.label); o.value = t.months;
                if (t.months === idea.months) o.selected = true;
                sel.appendChild(o);
            });
            sel.addEventListener('change', function () { idea.months = clampInt(sel.value, 3, 24, 6); touched(); refresh(false); });
            tf.appendChild(tl); tf.appendChild(sel);
            fields.appendChild(tf);
            card.appendChild(fields);

            card.appendChild(el('div', 'idea-result'));
            ideasEl.appendChild(card);
        });
        addBtn.disabled = state.ideas.length >= MAX_IDEAS;
        limitNote.hidden = state.ideas.length < MAX_IDEAS;
    }
    function updateResults() {
        var cards = ideasEl.querySelectorAll('.idea');
        state.ideas.forEach(function (idea, i) {
            var card = cards[i]; if (!card) return;
            var l = lane(idea);
            card.dataset.lane = l;
            var res = card.querySelector('.idea-result');
            res.textContent = '';
            var tag = el('span', 'lane-tag');
            tag.appendChild(el('span', 'swatch lane-' + l));
            tag.appendChild(el('span', '', LANES[l]));
            res.appendChild(tag);
            var sc = el('span');
            sc.appendChild(document.createTextNode('Score '));
            sc.appendChild(el('strong', '', String(score(idea))));
            res.appendChild(sc);
        });
        exampleNote.hidden = !state.examples;
    }

    // ---------- chart ----------
    var W = 560, H = 420, M = { l: 56, r: 24, t: 18, b: 52 };
    function x(v) { return M.l + (v - 0.5) / 5 * (W - M.l - M.r); }
    function y(v) { return H - M.b - (v - 0.5) / 5 * (H - M.t - M.b); }
    var laneColor = { quick: 'var(--lane-quick)', platform: 'var(--lane-platform)', frontier: 'var(--lane-frontier)', revisit: 'var(--lane-revisit)' };

    function renderChart() {
        while (chart.firstChild) chart.removeChild(chart.firstChild);
        hideTip();
        var v;
        for (v = 1; v <= 5; v++) {
            chart.appendChild(svg('line', { class: 'grid', x1: x(v), x2: x(v), y1: y(0.5), y2: y(5.5) }));
            chart.appendChild(svg('line', { class: 'grid', x1: x(0.5), x2: x(5.5), y1: y(v), y2: y(v) }));
            var tx = svg('text', { class: 'tick', x: x(v), y: y(0.5) + 16, 'text-anchor': 'middle' }); tx.textContent = v; chart.appendChild(tx);
            var ty = svg('text', { class: 'tick', x: x(0.5) - 10, y: y(v) + 4, 'text-anchor': 'end' }); ty.textContent = v; chart.appendChild(ty);
        }
        chart.appendChild(svg('line', { class: 'axis', x1: x(0.5), x2: x(5.5), y1: y(0.5), y2: y(0.5) }));
        chart.appendChild(svg('line', { class: 'axis', x1: x(0.5), x2: x(0.5), y1: y(0.5), y2: y(5.5) }));
        var xt = svg('text', { class: 'axis-title', x: (x(0.5) + x(5.5)) / 2, y: H - 10, 'text-anchor': 'middle' });
        xt.textContent = 'FEASIBILITY  (harder to easier)'; chart.appendChild(xt);
        var yt = svg('text', { class: 'axis-title', x: 0, y: 0, 'text-anchor': 'middle', transform: 'translate(16,' + (y(0.5) + y(5.5)) / 2 + ') rotate(-90)' });
        yt.textContent = 'VALUE  (lower to higher)'; chart.appendChild(yt);

        if (!state.ideas.length) {
            var e = svg('text', { class: 'empty', x: (x(0.5) + x(5.5)) / 2, y: (y(0.5) + y(5.5)) / 2, 'text-anchor': 'middle' });
            e.textContent = 'Add an idea to see it on the map'; chart.appendChild(e);
            return;
        }

        // spread ideas that share the same square so none hides another
        var groups = {};
        state.ideas.forEach(function (idea, i) {
            var k = idea.feasibility + '-' + idea.value;
            (groups[k] = groups[k] || []).push(i);
        });
        var hits = [];
        state.ideas.forEach(function (idea, i) {
            var g = groups[idea.feasibility + '-' + idea.value];
            var pos = g.indexOf(i), n = g.length;
            var cx = x(idea.feasibility), cy = y(idea.value);
            if (n > 1) {
                var ang = (pos / n) * Math.PI * 2 - Math.PI / 2;
                cx += Math.cos(ang) * 15; cy += Math.sin(ang) * 15;
            }
            var l = lane(idea);
            var pt = svg('g', { class: 'pt' });
            pt.appendChild(svg('circle', { class: 'dot', cx: cx, cy: cy, r: 11, fill: laneColor[l] }));
            var num = svg('text', { class: 'dot-num', x: cx, y: cy + 3.5, 'text-anchor': 'middle' }); num.textContent = i + 1; pt.appendChild(num);
            var hit = svg('circle', { class: 'hit', cx: cx, cy: cy, r: 16, tabindex: 0, role: 'img' });
            hit.setAttribute('aria-label', displayName(idea, i) + ': ' + LANES[l] + ', score ' + score(idea));
            var show = function () { pt.classList.add('is-focus'); showTip(idea, i, cx, cy); };
            var hide = function () { pt.classList.remove('is-focus'); hideTip(); };
            hit.addEventListener('pointerenter', show);
            hit.addEventListener('pointerleave', hide);
            hit.addEventListener('focus', show);
            hit.addEventListener('blur', hide);
            hit.addEventListener('click', show);
            hits.push(hit);
            chart.appendChild(pt);
        });
        // hit areas go on top so a neighbour's label never blocks a dot
        hits.forEach(function (h) { chart.appendChild(h); });
    }
    function row(label, value) {
        var d = el('div');
        d.appendChild(document.createTextNode(label + ': '));
        d.appendChild(el('span', 'tip-score', value));
        return d;
    }
    function showTip(idea, i, cx, cy) {
        tip.textContent = '';
        tip.appendChild(el('strong', '', displayName(idea, i)));
        tip.appendChild(row('Lane', LANES[lane(idea)]));
        tip.appendChild(row('Priority score', score(idea) + ' / 100'));
        tip.appendChild(row('Value', idea.value + ' / 5'));
        tip.appendChild(row('Feasibility', idea.feasibility + ' / 5'));
        tip.appendChild(row('Risk', idea.risk + ' / 5'));
        tip.appendChild(row('Time to impact', timeLabel(idea.months)));
        tip.hidden = false;
        var box = chart.getBoundingClientRect();
        var k = box.width / W;
        var left = cx * k + 18, top = cy * k - 20;
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        if (left + tw > box.width) left = cx * k - tw - 18;
        if (left < 0) left = 0;
        if (top + th > box.height) top = box.height - th;
        if (top < 0) top = 0;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
    }
    function hideTip() { tip.hidden = true; }

    // ---------- lanes ----------
    function renderLanes() {
        var cols = document.querySelectorAll('.lane-col');
        Array.prototype.forEach.call(cols, function (col) {
            var key = col.dataset.lane;
            var list = col.querySelector('.lane-list');
            list.textContent = '';
            var items = state.ideas.map(function (idea, i) { return { idea: idea, i: i, s: score(idea) }; })
                .filter(function (o) { return lane(o.idea) === key; })
                .sort(function (a, b) { return b.s - a.s || a.i - b.i; });
            if (!items.length) {
                var none = el('li'); none.appendChild(el('span', 'none', 'Nothing here yet')); list.appendChild(none);
                return;
            }
            items.forEach(function (o) {
                var li = el('li');
                var nm = el('span', 'lname');
                nm.appendChild(el('span', 'lnum', String(o.i + 1)));
                nm.appendChild(document.createTextNode(displayName(o.idea, o.i)));
                li.appendChild(nm);
                li.appendChild(el('span', 'score', String(o.s)));
                list.appendChild(li);
            });
        });
    }

    // ---------- wiring ----------
    function touched() { state.examples = false; }
    function refresh(rebuildEditor) {
        if (rebuildEditor) renderEditor();
        updateResults();
        renderChart();
        renderLanes();
        save();
    }

    addBtn.addEventListener('click', function () {
        if (state.ideas.length >= MAX_IDEAS) return;
        state.ideas.push({ name: '', value: 3, feasibility: 3, risk: 3, months: 6 });
        touched(); refresh(true);
        var inputs = ideasEl.querySelectorAll('.idea-name');
        if (inputs.length) inputs[inputs.length - 1].focus();
    });
    document.getElementById('reset-ideas').addEventListener('click', function () {
        state.ideas = clean(EXAMPLES); state.examples = true; refresh(true);
    });
    document.getElementById('clear-ideas').addEventListener('click', function () {
        state.ideas = []; touched(); refresh(true);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });

    load();
    refresh(true);
})();
