export function initAdminShell() {
  const shell = document.querySelector('[data-admin-shell]');
  if (!shell) return;

  const toggle = shell.querySelector('[data-sidebar-toggle]');
  const backdrop = shell.querySelector('[data-sidebar-backdrop]');
  const nav = shell.querySelector('[data-admin-nav]');

  const close = () => {
    shell.classList.remove('is-sidebar-open');
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('is-admin-sidebar-open');
  };

  const open = () => {
    shell.classList.add('is-sidebar-open');
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add('is-admin-sidebar-open');
  };

  toggle?.addEventListener('click', () => {
    if (shell.classList.contains('is-sidebar-open')) close();
    else open();
  });

  backdrop?.addEventListener('click', close);

  nav?.addEventListener('click', (e) => {
    const link = e.target.closest('.admin-sidebar__link');
    if (link && window.innerWidth <= 960) close();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shell.classList.contains('is-sidebar-open')) {
      close();
    }
  });
}
