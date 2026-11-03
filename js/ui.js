/* ============================================================
   ui.js — DOM rendering, dialogs, theme and form feedback
   ============================================================ */

window.MyTasks = window.MyTasks || {};

(function (App) {
  'use strict';

  const els = {};
  const THEME_COLORS = { light: '#F5F6FA', dark: '#0B1120' };

  let editingTaskId = null;
  let confirmResolver = null;

  /** Caches every element the module touches. */
  function cacheElements() {
    els.currentDate = document.getElementById('current-date');
    els.pendingCount = document.getElementById('pending-count');
    els.themeToggle = document.getElementById('theme-toggle');

    els.statTotal = document.getElementById('stat-total');
    els.statCompleted = document.getElementById('stat-completed');
    els.statPending = document.getElementById('stat-pending');

    els.progressTrack = document.getElementById('progress-track');
    els.progressFill = document.getElementById('progress-fill');
    els.progressPercent = document.getElementById('progress-percent');
    els.progressHint = document.getElementById('progress-hint');

    els.taskList = document.getElementById('task-list');
    els.taskTemplate = document.getElementById('task-template');
    els.emptyState = document.getElementById('empty-state');
    els.emptyTitle = document.getElementById('empty-title');
    els.emptyText = document.getElementById('empty-text');

    els.visibleCount = document.getElementById('visible-count');
    els.statusFilters = document.getElementById('status-filters');
    els.statusButtons = Array.prototype.slice.call(
      document.querySelectorAll('#status-filters [data-status]')
    );
    els.clearCompleted = document.getElementById('clear-completed');
    els.clearCompletedCount = document.getElementById('clear-completed-count');
    els.searchInput = document.getElementById('search-input');
    els.categoryFilter = document.getElementById('category-filter');
    els.sortSelect = document.getElementById('sort-select');

    els.taskForm = document.getElementById('task-form');
    els.taskFormError = document.getElementById('form-error');
    els.titleInput = document.getElementById('task-title');
    els.titleError = document.getElementById('title-error');

    els.editDialog = document.getElementById('edit-dialog');
    els.editForm = document.getElementById('edit-form');
    els.editError = document.getElementById('edit-error');
    els.editClose = document.getElementById('edit-close');
    els.editCancel = document.getElementById('edit-cancel');

    els.confirmDialog = document.getElementById('confirm-dialog');
    els.confirmTitle = document.getElementById('confirm-title');
    els.confirmMessage = document.getElementById('confirm-message');
    els.confirmOk = document.getElementById('confirm-ok');
    els.confirmCancel = document.getElementById('confirm-cancel');
  }

  function init() {
    cacheElements();
    els.currentDate.textContent = App.utils.formatToday();
    bindDialogEvents();
  }

  function elements() {
    return els;
  }

  /* ------------------------------------------------------------
     Rendering
     ------------------------------------------------------------ */

  function render(state) {
    renderStats(state.stats);
    renderProgress(state.stats);
    renderToolbar(state.filters, state.stats);
    renderTaskList(state.visible, state.tasks);
  }

  function renderStats(stats) {
    els.statTotal.textContent = String(stats.total);
    els.statCompleted.textContent = String(stats.completed);
    els.statPending.textContent = String(stats.pending);
    els.pendingCount.textContent = String(stats.pending);
  }

  function renderProgress(stats) {
    els.progressFill.style.width = stats.percent + '%';
    els.progressTrack.setAttribute('aria-valuenow', String(stats.percent));
    els.progressPercent.textContent = stats.percent + '%';

    if (stats.total === 0) {
      els.progressHint.textContent = 'Add a task to start tracking progress.';
    } else if (stats.completed === stats.total) {
      els.progressHint.textContent = 'All tasks completed. Nice work!';
    } else {
      els.progressHint.textContent =
        stats.pending +
        ' ' +
        App.utils.pluralize(stats.pending, 'task') +
        ' left to finish.';
    }
  }

  function renderToolbar(filters, stats) {
    els.statusButtons.forEach(function (button) {
      const isActive = button.dataset.status === filters.status;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    els.clearCompleted.disabled = stats.completed === 0;
    els.clearCompletedCount.textContent = String(stats.completed);
  }

  function renderTaskList(visibleTasks, allTasks) {
    els.taskList.textContent = '';

    const fragment = document.createDocumentFragment();
    visibleTasks.forEach(function (task) {
      fragment.appendChild(createTaskCard(task));
    });
    els.taskList.appendChild(fragment);

    const hasVisibleTasks = visibleTasks.length > 0;
    els.emptyState.hidden = hasVisibleTasks;

    if (!hasVisibleTasks) {
      const isFiltered = allTasks.length > 0;
      els.emptyTitle.textContent = isFiltered ? 'No matching tasks' : 'No tasks yet';
      els.emptyText.textContent = isFiltered
        ? 'Try a different search term, category, or status filter.'
        : 'Add your first task to get started.';
    }

    els.visibleCount.textContent =
      'Showing ' + visibleTasks.length + ' of ' + allTasks.length;
  }

  /** Builds one task card from the <template>. User text uses textContent. */
  function createTaskCard(task) {
    const card = els.taskTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.id = task.id;
    card.classList.toggle('is-completed', task.completed);

    const checkbox = card.querySelector('.task-checkbox');
    checkbox.checked = task.completed;
    const toggleLabel = task.completed ? 'Mark as active' : 'Mark as completed';
    checkbox.setAttribute('aria-label', toggleLabel + ': ' + task.title);
    checkbox.title = toggleLabel;

    card.querySelector('.task-title').textContent = task.title;

    const description = card.querySelector('.task-description');
    if (task.description) {
      description.textContent = task.description;
    } else {
      description.remove();
    }

    const priorityBadge = card.querySelector('.badge--priority');
    priorityBadge.textContent = App.utils.capitalize(task.priority);
    priorityBadge.classList.add('badge--' + task.priority);

    const categoryBadge = card.querySelector('.badge--category');
    categoryBadge.textContent = App.utils.capitalize(task.category);
    categoryBadge.classList.add('badge--cat-' + task.category);

    const dueElement = card.querySelector('.task-due');
    const formattedDue = App.utils.formatDueDate(task.dueDate);

    if (formattedDue) {
      if (App.utils.isOverdue(task.dueDate, task.completed)) {
        dueElement.textContent = 'Overdue · ' + formattedDue;
        dueElement.classList.add('is-overdue');
      } else if (App.utils.isDueToday(task.dueDate)) {
        dueElement.textContent = 'Due today';
        dueElement.classList.add('is-today');
      } else {
        dueElement.textContent = 'Due ' + formattedDue;
      }
    } else {
      dueElement.remove();
    }

    const createdElement = card.querySelector('.task-created');
    const createdLabel = App.utils.formatCreatedDate(task.createdAt);
    if (createdLabel) {
      createdElement.textContent = 'Added ' + createdLabel;
    } else {
      createdElement.remove();
    }

    const editButton = card.querySelector('[data-action="edit"]');
    editButton.title = 'Edit task';
    editButton.setAttribute('aria-label', 'Edit task: ' + task.title);

    const deleteButton = card.querySelector('[data-action="delete"]');
    deleteButton.title = 'Delete task';
    deleteButton.setAttribute('aria-label', 'Delete task: ' + task.title);

    return card;
  }

  /* ------------------------------------------------------------
     Add-task form feedback
     ------------------------------------------------------------ */

  function showFormError(errors) {
    const titleMessage = errors.title || '';
    els.titleError.textContent = titleMessage;

    if (titleMessage) {
      els.titleInput.setAttribute('aria-invalid', 'true');
    } else {
      els.titleInput.removeAttribute('aria-invalid');
    }

    const generalMessage =
      errors.form ||
      errors.description ||
      errors.dueDate ||
      errors.priority ||
      errors.category ||
      '';
    els.taskFormError.textContent = generalMessage;
  }

  function clearFormError() {
    els.titleError.textContent = '';
    els.taskFormError.textContent = '';
    els.titleInput.removeAttribute('aria-invalid');
  }

  /* ------------------------------------------------------------
     Edit dialog
     ------------------------------------------------------------ */

  function openEditModal(task) {
    if (!task) {
      return;
    }

    editingTaskId = task.id;
    els.editForm.reset();
    els.editForm.elements.title.value = task.title;
    els.editForm.elements.description.value = task.description || '';
    els.editForm.elements.dueDate.value = task.dueDate || '';
    els.editForm.elements.priority.value = task.priority;
    els.editForm.elements.category.value = task.category;

    els.editError.textContent = '';
    els.editForm.elements.title.removeAttribute('aria-invalid');

    if (!els.editDialog.open) {
      els.editDialog.showModal();
    }

    els.editForm.elements.title.focus();
    const titleLength = els.editForm.elements.title.value.length;
    els.editForm.elements.title.setSelectionRange(titleLength, titleLength);
  }

  function closeEditModal() {
    editingTaskId = null;
    els.editError.textContent = '';
    if (els.editDialog.open) {
      els.editDialog.close();
    }
  }

  function getEditingTaskId() {
    return editingTaskId;
  }

  function showEditError(errors) {
    const message =
      errors.title ||
      errors.description ||
      errors.dueDate ||
      errors.priority ||
      errors.category ||
      errors.form ||
      'Please review the form and try again.';
    els.editError.textContent = message;

    if (errors.title) {
      els.editForm.elements.title.setAttribute('aria-invalid', 'true');
    } else {
      els.editForm.elements.title.removeAttribute('aria-invalid');
    }
  }

  /* ------------------------------------------------------------
     Confirmation dialog (promise based)
     ------------------------------------------------------------ */

  function openConfirm(options) {
    const settings = options || {};

    // Never stack confirmations: a new request cancels the previous one.
    if (confirmResolver) {
      settleConfirm(false);
    }

    return new Promise(function (resolve) {
      confirmResolver = resolve;
      els.confirmTitle.textContent = settings.title || 'Are you sure?';
      els.confirmMessage.textContent = settings.message || '';
      els.confirmOk.textContent = settings.confirmLabel || 'Confirm';

      if (!els.confirmDialog.open) {
        els.confirmDialog.showModal();
      }

      els.confirmCancel.focus();
    });
  }

  function settleConfirm(value) {
    const resolve = confirmResolver;
    confirmResolver = null;
    if (els.confirmDialog.open) {
      els.confirmDialog.close();
    }
    if (resolve) {
      resolve(value);
    }
  }

  function bindDialogEvents() {
    els.confirmOk.addEventListener('click', function () {
      settleConfirm(true);
    });
    els.confirmCancel.addEventListener('click', function () {
      settleConfirm(false);
    });

    // Escape key closes the dialog without firing a button handler.
    els.confirmDialog.addEventListener('close', function () {
      if (confirmResolver) {
        const resolve = confirmResolver;
        confirmResolver = null;
        resolve(false);
      }
    });

    // Clicking the backdrop counts as a cancel.
    els.confirmDialog.addEventListener('click', function (event) {
      if (event.target === els.confirmDialog) {
        settleConfirm(false);
      }
    });

    els.editClose.addEventListener('click', closeEditModal);
    els.editCancel.addEventListener('click', closeEditModal);
    els.editDialog.addEventListener('click', function (event) {
      if (event.target === els.editDialog) {
        closeEditModal();
      }
    });
    els.editDialog.addEventListener('close', function () {
      editingTaskId = null;
    });
  }

  /* ------------------------------------------------------------
     Theme
     ------------------------------------------------------------ */

  function applyTheme(theme) {
    const safeTheme = theme === 'dark' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', safeTheme);
    els.themeToggle.setAttribute('aria-pressed', safeTheme === 'dark' ? 'true' : 'false');
    els.themeToggle.setAttribute(
      'aria-label',
      safeTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );

    const metaThemeColor = document.getElementById('meta-theme-color');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', THEME_COLORS[safeTheme]);
    }

    return safeTheme;
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function showToast(message, type, duration) {
    App.notifications.show(message, type, duration);
  }

  App.ui = {
    init: init,
    elements: elements,
    render: render,
    showFormError: showFormError,
    clearFormError: clearFormError,
    openEditModal: openEditModal,
    closeEditModal: closeEditModal,
    getEditingTaskId: getEditingTaskId,
    showEditError: showEditError,
    openConfirm: openConfirm,
    applyTheme: applyTheme,
    getTheme: getTheme,
    showToast: showToast
  };
})(window.MyTasks);
