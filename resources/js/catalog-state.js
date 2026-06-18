export function getCatalogUrl() {
  if (history.state?.catalogUrl) {
    return history.state.catalogUrl;
  }

  const path = window.location.pathname;
  if (path === '/' || path === '') {
    return window.location.pathname + window.location.search || '/';
  }

  return '/';
}
