/* ============================================================
   notifications.js — lightweight toast notifications
   ============================================================ */

window.MyTasks = window.MyTasks || {};

(function (App) {
  'use strict';

  const DEFAULT_DURATION = 3000;
  const MAX_VISIBLE = 4;

  const ICONS = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.5 2.5L16 9.5" /></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16.5h.01" /></svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.6h.01" /></svg>'
  };

  let container = null;

  function getContainer() {
    if (container && document.body.contains(container)) {
      return container;
    }
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) {
      return;
    }
    toast.classList.remove('is-visible');
    toast.classList.add('is-leaving');
    window.setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 240);
  }

  /**
   * Shows a toast. The message is inserted with textContent, so task titles
   * containing markup are always rendered as plain text.
   */
  function show(message, type, duration) {
    const supported = Object.prototype.hasOwnProperty.call(ICONS, type) ? type : 'info';
    const host = getContainer();

    // Keep the stack small so notifications never cover the interface.
    while (host.children.length >= MAX_VISIBLE) {
      host.removeChild(host.firstElementChild);
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast--' + supported;
    toast.setAttribute('role', supported === 'error' ? 'alert' : 'status');

    const icon = document.createElement('span');
    icon.className = 'toast__icon';
    icon.innerHTML = ICONS[supported];

    const text = document.createElement('p');
    text.className = 'toast__message';
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    host.appendChild(toast);

    // Add the visible class on the next frame so the transition runs.
    window.requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });

    const timeout = typeof duration === 'number' ? duration : DEFAULT_DURATION;
    window.setTimeout(function () {
      removeToast(toast);
    }, timeout);

    return toast;
  }

  App.notifications = {
    show: show
  };
})(window.MyTasks);
