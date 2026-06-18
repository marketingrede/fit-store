function resolveUrl(url) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const href = url ?? (typeof window !== 'undefined' ? window.location.href : `${base}/`);
  return new URL(href, base);
}

export function getCategoriesFromUrl(url) {
  const u = resolveUrl(url);
  const raw = u.searchParams.get('categorias');
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const single = u.searchParams.get('categoria');
  if (single && single !== 'all') return [single];
  return [];
}

export function getSearchFromUrl(url) {
  const u = resolveUrl(url);
  return u.searchParams.get('q') || '';
}

export function buildHomeUrl(q, categories = []) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (categories.length > 0) params.set('categorias', categories.join(','));
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}
