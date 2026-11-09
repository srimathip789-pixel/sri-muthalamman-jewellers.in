/**
 * Sri Muthalamman Jewellers — Professional Catalogue Engine
 * Architecture: Data fetched from /data/jewellery.json (local DB)
 *               Images served from /assets/img/ (local, zero external deps)
 */

// App State
let catalogueItems = [];
let filteredItems = [];
let currentPage = 1;
const itemsPerPage = 8;

/* ─────────────────────────────────────────
   1. DATA LOADING — Fetch from local JSON DB
───────────────────────────────────────── */
async function loadCatalogue() {
    try {
        const res = await fetch('data/jewellery.json');
        if (!res.ok) throw new Error('Database unreachable');
        catalogueItems = await res.json();
        filteredItems = [...catalogueItems];
        renderCatalogue();
    } catch (err) {
        document.getElementById('catalogue-view').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:6rem 2rem;">
                <i class="fas fa-exclamation-circle" style="font-size:3rem;color:#D4AF37;margin-bottom:1.5rem;display:block;"></i>
                <h3 style="font-weight:300;color:#666;">Unable to load catalogue. Please refresh.</h3>
            </div>`;
    }
}

/* ─────────────────────────────────────────
   2. FILTER & LIVE SEARCH (debounced)
───────────────────────────────────────── */
function applyFilters() {
    const category = document.getElementById('filter-category').value;
    const collection = document.getElementById('filter-collection').value;
    const query = (document.getElementById('catalogue-search').value || '').toLowerCase();

    filteredItems = catalogueItems.filter(item => {
        return (category === 'all' || item.category === category) &&
            (collection === 'all' || item.collection === collection) &&
            (item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
    });

    currentPage = 1;
    renderCatalogue();
}

/* ─────────────────────────────────────────
   3. RENDER — Build product cards
───────────────────────────────────────── */
function renderCatalogue() {
    const view = document.getElementById('catalogue-view');
    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredItems.slice(start, start + itemsPerPage);

    view.innerHTML = '';

    if (pageItems.length === 0) {
        view.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:8rem 2rem;">
                <i class="fas fa-search" style="font-size:3rem;color:#ddd;margin-bottom:1.5rem;display:block;"></i>
                <h3 style="font-weight:300;color:#999;">No designs found.</h3>
                <p style="color:#aaa;margin-top:0.5rem;">Try another keyword or reset filters.</p>
            </div>`;
        updatePagination();
        return;
    }

    const fragment = document.createDocumentFragment();

    pageItems.forEach(item => {
        const weightLabel = item.metal === 'silver'
            ? `${item.weight}g`
            : `${item.weight}g (Approx)`;

        const waMsg = encodeURIComponent(`Hi Sri Muthalamman Jewellers! I'd like to enquire about "${item.name}" from your Digital Catalogue. Please share more details.`);
        const waLink = `https://wa.me/917010955834?text=${waMsg}`;

        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-inner">
                <div class="img-container">
                    <a href="${item.img}" class="glightbox"
                       data-glightbox="title: ${item.name}; description: ${item.description}">
                        <img
                            src="${item.img}"
                            alt="${item.name}"
                            loading="lazy"
                            onerror="this.onerror=null; this.src='https://placehold.co/600x800/f9f5ec/D4AF37?text=${encodeURIComponent(item.name)}'">
                        <div class="zoom-overlay"><i class="fas fa-expand"></i></div>
                    </a>
                    <div class="card-tag">${item.collection.toUpperCase()}</div>
                </div>
                <div class="product-info">
                    <div class="brand-line">SMJ MADURAI · ${item.metal.toUpperCase()}</div>
                    <h4>${item.name}</h4>
                    <p class="description">${item.description}</p>
                    <div class="card-footer">
                        <span class="weight"><i class="fas fa-weight-hanging" style="color:#D4AF37;margin-right:6px;"></i>${weightLabel}</span>
                        <a href="${waLink}" target="_blank" rel="noopener" class="enquire-btn">
                            <i class="fab fa-whatsapp"></i> Enquire
                        </a>
                    </div>
                </div>
            </div>`;
        fragment.appendChild(card);
    });

    view.appendChild(fragment);

    // Re-initialise lightbox on each render
    GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true, zoomable: true });

    updatePagination();
}

/* ─────────────────────────────────────────
   4. PAGINATION
───────────────────────────────────────── */
function updatePagination() {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
    const nums = document.getElementById('page-numbers');
    nums.innerHTML = '';

    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;

    // Show max 5 page buttons
    const from = Math.max(1, currentPage - 2);
    const to = Math.min(totalPages, from + 4);

    for (let i = from; i <= to; i++) {
        const btn = document.createElement('button');
        btn.className = `nav-btn${i === currentPage ? ' active' : ''}`;
        btn.textContent = i;
        btn.dataset.page = i;
        nums.appendChild(btn);
    }

    nums.onclick = e => {
        const btn = e.target.closest('[data-page]');
        if (!btn) return;
        currentPage = +btn.dataset.page;
        renderCatalogue();
        document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
    };
}

/* ─────────────────────────────────────────
   5. LIVE BULLION RATES (simulated)
───────────────────────────────────────── */
function updateLiveRates() {
    const base = { gold24: 164680, silverLB: 277394, silverFancy: 279000, gold22m: 14930, silverM: 295.0 };
    const f = (Math.random() - 0.5) * 40;
    const r = {
        gold24: Math.floor(base.gold24 + f),
        silverLB: Math.floor(base.silverLB + f * 2),
        silverFancy: Math.floor(base.silverFancy + f * 2.1),
        gold22m: Math.floor(base.gold22m + f / 10),
        silverM: (base.silverM + f / 200).toFixed(2)
    };

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('sell-pure-ft', `₹${r.gold24.toLocaleString('en-IN')}`);
    set('sell-silver-lb', `₹${r.silverLB.toLocaleString('en-IN')}`);
    set('sell-silver-fancy', `₹${r.silverFancy.toLocaleString('en-IN')}`);
    set('sell-gold-m', `₹${r.gold22m.toLocaleString('en-IN')}`);
    set('sell-silver-madurai', `₹${r.silverM}`);

    const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    set('last-sync', `SYNC: ${t}`);
}

/* ─────────────────────────────────────────
   6. INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Load data from local JSON DB
    loadCatalogue();

    // Bullion rates
    updateLiveRates();
    setInterval(updateLiveRates, 60_000);

    // Filters
    ['filter-category', 'filter-collection'].forEach(id =>
        document.getElementById(id).addEventListener('change', applyFilters));

    // Live search (debounced 300 ms)
    let t;
    document.getElementById('catalogue-search').addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(applyFilters, 300);
    });

    // Prev / Next buttons
    document.getElementById('prev-page').onclick = () => {
        if (currentPage > 1) { currentPage--; renderCatalogue(); }
    };
    document.getElementById('next-page').onclick = () => {
        if (currentPage < Math.ceil(filteredItems.length / itemsPerPage)) {
            currentPage++; renderCatalogue();
        }
    };
});
