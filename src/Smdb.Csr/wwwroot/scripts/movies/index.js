import { $, apiFetch, renderStatus, clearChildren, getQueryParam } from '/scripts/common.js';

(async function initMoviesIndex() {
  const page = Math.max(
    1,
    Number(getQueryParam('page') || localStorage.getItem('page') || '1')
  );

  const size = Math.min(
    100,
    Math.max(1, Number(getQueryParam('size') || localStorage.getItem('size') || '9'))
  );

  localStorage.setItem('page', String(page));
  localStorage.setItem('size', String(size));

  const listEl = $('#movie-list');
  const statusEl = $('#status');
  const tpl = $('#movie-card');

  // One-time delete handler (avoid adding it multiple times)
  listEl.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button.btn-delete[data-id]');
    if (!btn) return;

    const id = btn.dataset.id;
    if (!confirm('Delete this movie? This cannot be undone.')) return;

    try {
      await apiFetch(`/movies/${encodeURIComponent(id)}`, { method: 'DELETE' });
      renderStatus(statusEl, 'ok', `Movie ${id} deleted.`);
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      renderStatus(statusEl, 'err', `Delete failed: ${err.message}`);
    }
  });

  try {
    const payload = await apiFetch(`/movies?page=${page}&size=${size}`);

    // Supports both: array response OR jsonapi-style { data, meta, links }
    const items = Array.isArray(payload) ? payload : (payload.data || []);
    const meta = Array.isArray(payload) ? null : (payload.meta || null);

    clearChildren(listEl);

    if (items.length === 0) {
      renderStatus(statusEl, 'warn', 'No movies found for this page.');
    } else {
      renderStatus(statusEl, '', '');

      for (const m of items) {
        const frag = tpl.content.cloneNode(true);
        const root = frag.querySelector('.card');

        root.querySelector('.title').textContent = m.title ?? '—';
        root.querySelector('.year').textContent = String(m.year ?? '—');
        root.querySelector('.btn-view').href =
          `/movies/view.html?id=${encodeURIComponent(m.id)}`;
        root.querySelector('.btn-edit').href =
          `/movies/edit.html?id=${encodeURIComponent(m.id)}`;
        root.querySelector('.btn-delete').dataset.id = m.id;

        listEl.appendChild(frag);
      }
    }

    // Page size dropdown
    const sizeSelect = document.getElementById('page-size');
    clearChildren(sizeSelect);

    const pageSizes = [3, 6, 9, 12, 15];
    for (const s of pageSizes) {
      const opt = document.createElement('option');
      opt.value = String(s);
      opt.textContent = String(s);
      opt.selected = (size === s);
      sizeSelect.appendChild(opt);
    }

    sizeSelect.addEventListener('change', () => {
      const params = new URLSearchParams(window.location.search);
      params.set('page', '1');
      params.set('size', sizeSelect.value);

      localStorage.setItem('page', '1');
      localStorage.setItem('size', sizeSelect.value);

      window.location.href = `${window.location.pathname}?${params.toString()}`;
    });

    // Pagination (only if meta exists)
    $('#page-num').textContent = `Page ${page}`;

    const totalPages = meta?.totalPages ?? 1;

    const firstPage = page <= 1;
    const lastPage = page >= totalPages;

    const firstBtn = $('#first');
    const prevBtn = $('#prev');
    const nextBtn = $('#next');
    const lastBtn = $('#last');

    firstBtn.href = `?page=1&size=${size}`;
    prevBtn.href = `?page=${Math.max(1, page - 1)}&size=${size}`;
    nextBtn.href = `?page=${page + 1}&size=${size}`;
    lastBtn.href = `?page=${totalPages}&size=${size}`;

    firstBtn.classList.toggle('disabled', firstPage);
    prevBtn.classList.toggle('disabled', firstPage);
    nextBtn.classList.toggle('disabled', lastPage);
    lastBtn.classList.toggle('disabled', lastPage);

    // Prevent navigation when disabled
    firstBtn.onclick = () => !firstPage;
    prevBtn.onclick = () => !firstPage;
    nextBtn.onclick = () => !lastPage;
    lastBtn.onclick = () => !lastPage;

  } catch (err) {
    renderStatus(statusEl, 'err', `Failed to fetch movies: ${err.message}`);
  }
})();
