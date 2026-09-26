document.querySelectorAll('details').forEach((item) =>
  item.addEventListener('toggle', () => {
    if (item.open) {
      document.querySelectorAll('details').forEach((other) => {
        if (other !== item) other.open = false;
      });
    }
  })
);

const themeButton = document.querySelector('.theme-toggle');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton.setAttribute(
    'aria-label',
    theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair'
  );
  themeButton.setAttribute('aria-pressed', String(theme === 'light'));
}

try {
  applyTheme(localStorage.getItem('mk-theme') === 'light' ? 'light' : 'dark');
} catch {
  applyTheme('dark');
}

themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(theme);
  try {
    localStorage.setItem('mk-theme', theme);
  } catch {}
});

const projects = [...document.querySelectorAll('.project')];

document.querySelectorAll('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    document
      .querySelectorAll('[data-filter]')
      .forEach((other) => other.setAttribute('aria-pressed', String(other === button)));

    projects.forEach(
      (project) =>
        (project.hidden =
          button.dataset.filter !== 'all' &&
          project.dataset.category !== button.dataset.filter)
    );

    const pair = document.querySelector('.project-pair');
    pair.hidden = ![...pair.children].some((project) => !project.hidden);
    pair.classList.toggle('filtered', button.dataset.filter === 'site');

    const count = projects.filter((project) => !project.hidden).length;
    document.querySelector('#filter-status').textContent =
      `${count} projet${count > 1 ? 's' : ''} affiché${count > 1 ? 's' : ''}.`;
  })
);

document.querySelector('#copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText('moussa01kta@gmail.com');
    status.textContent = 'Adresse copiée !';
  } catch {
    status.textContent =
      'Sélectionne l’adresse ci-dessus pour la copier, ou clique dessus pour écrire.';
  }
});
