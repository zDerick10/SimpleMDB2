import { $, apiFetch, renderStatus, captureMovieForm } from '/scripts/common.js';

(async function initMovieAdd() {
  const form = $('#movie-form');
  const statusEl = $('#status');

  renderStatus(statusEl, 'ok', 'New movie. Fill the form and click Create.');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const payload = captureMovieForm(form);

    if (!payload.title) {
      renderStatus(statusEl, 'err', 'Title is required.');
      return;
    }
    if (payload.title.length > 256) {
      renderStatus(statusEl, 'err', 'Title cannot be longer than 256 characters.');
      return;
    }
    if (!Number.isInteger(payload.year) || payload.year < 1888) {
      renderStatus(statusEl, 'err', 'Year must be a valid number (>= 1888).');
      return;
    }

    try {
      const created = await apiFetch('/movies', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      renderStatus(
        statusEl,
        'ok',
        `Created movie #${created.id} "${created.title}" (${created.year}).`
      );
      form.reset();
    } catch (err) {
      renderStatus(statusEl, 'err', `Create failed: ${err.message}`);
    }
  });
})();
