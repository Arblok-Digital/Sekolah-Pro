// js/core/partials.js — inject partial HTML (halaman + modal) ke container.
// Setiap partial: <div id="<m>-page">…</div> lalu <!-- MODALS --> lalu modal-bg milik modul.

export async function mountPartial(name, container, modalsRoot) {
  if (document.getElementById(name + '-page')) return false;
  const res = await fetch('partials/' + name + '.html', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Gagal memuat partials/' + name + '.html (' + res.status + ')');
  const html = await res.text();
  const [pagePart, modalsPart] = html.split('<!-- MODALS -->');
  if (container) container.insertAdjacentHTML('beforeend', pagePart);
  if (modalsPart) {
    const root = modalsRoot || container;
    if (root) root.insertAdjacentHTML('beforeend', modalsPart);
  }
  return true;
}

export async function mountLogin(container) {
  if (document.getElementById('login-page')) return false;
  const res = await fetch('partials/login.html', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Gagal memuat partials/login.html (' + res.status + ')');
  container.insertAdjacentHTML('beforeend', await res.text());
  return true;
}

Object.assign(globalThis, { mountPartial, mountLogin });
