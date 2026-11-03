/* ============================================================
   app.js — entry point: wires events, state and rendering
   ============================================================ */

window.MyTasks = window.MyTasks || {};

(function (App) {
  'use strict';

  const state = {
    filters: Object.assign({}, App.filters.DEFAULT_FILTERS)
  };

  const SEARCH_DEBOUNCE_MS = 150;
  let searchTimer = null;
  let els = null;

  /* ------------------------------------------------------------
     Rendering pipeline
     ------------------------------------------------------------ */

  function render() {
    const allTasks = App.tasks.getAll();
    const visibleTasks = App.filters.applyFilters(allTasks, state.filters);

    App.ui.render({
      tasks: allTasks,
      visible: visibleTasks,
      filters: state.filters,
      stats: App.tasks.getStats()
    });
  }

  /* ------------------------------------------------------------
     Add task
     ------------------------------------------------------------ */

  function handleAddSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const result = App.tasks.create({
      title: form.elements.title.value,
      description: form.elements.description.value,
      dueDate: form.elements.dueDate.value,
      priority: form.elements.priority.value,
      category: form.elements.category.value
    });

    if (!result.ok) {
      App.ui.showFormError(result.errors);
      if (result.errors.title) {
        els.titleInput.focus();
      }
      return;
    }

    App.ui.clearFormError();
    form.reset();

    App.ui.showToast(
      'Added "' + App.utils.truncate(result.task.title, 42) + '".',
      'success'
    );

    els.titleInput.focus();
  }

  /* ------------------------------------------------------------
     Task list interactions (event delegation)
     ------------------------------------------------------------ */

  function getTaskCardFromEvent(event) {
    const element = event.target instanceof Element ? event.target : null;
    return element ? element.closest('.task-card') : null;
  }

  function handleTaskListClick(event) {
    const button = event.target instanceof Element
      ? event.target.closest('button[data-action]')
      : null;
    if (!button) {
      return;
    }

    const card = getTaskCardFromEvent(event);
    if (!card) {
      return;
    }

    const taskId = card.dataset.id;
    const action = button.dataset.action;

    if (action === 'edit') {
      openEditDialog(taskId);
    } else if (action === 'delete') {
      confirmDeleteTask(taskId);
    }
  }

  function handleTaskListChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.dataset.action !== 'toggle') {
      return;
    }

    const card = target.closest('.task-card');
    if (!card) {
      return;
    }

    const updatedTask = App.tasks.toggle(card.dataset.id);
    if (!updatedTask) {
      return;
    }

    if (updatedTask.completed) {
      App.ui.showToast('Task marked as completed.', 'success');
    } else {
      App.ui.showToast('Task moved back to active.', 'info');
    }
  }

  function openEditDialog(taskId) {
    const task = App.tasks.getById(taskId);
    if (!task) {
      App.ui.showToast('This task no longer exists.', 'error');
      return;
    }
    App.ui.openEditModal(task);
  }

  function handleEditSubmit(event) {
    event.preventDefault();

    const taskId = App.ui.getEditingTaskId();
    if (!taskId) {
      return;
    }

    const form = event.currentTarget;
    const result = App.tasks.update(taskId, {
      title: form.elements.title.value,
      description: form.elements.description.value,
      dueDate: form.elements.dueDate.value,
      priority: form.elements.priority.value,
      category: form.elements.category.value
    });

    if (!result.ok) {
      App.ui.showEditError(result.errors);
      return;
    }

    App.ui.closeEditModal();
    App.ui.showToast('Task updated.', 'success');
  }

  async function confirmDeleteTask(taskId) {
    const task = App.tasks.getById(taskId);
    if (!task) {
      return;
    }

    const confirmed = await App.ui.openConfirm({
      title: 'Delete task?',
      message:
        '"' + task.title + '" will be permanently removed from this browser.',
      confirmLabel: 'Delete Task'
    });

    if (!confirmed) {
      return;
    }

    if (App.tasks.remove(taskId)) {
      App.ui.showToast('Task deleted.', 'success');
    }
  }

  /* ------------------------------------------------------------
     Toolbar: status, category, search, sorting, clear completed
     ------------------------------------------------------------ */

  function handleStatusFilterClick(event) {
    const button = event.target instanceof Element
      ? event.target.closest('button[data-status]')
      : null;
    if (!button) {
      return;
    }

    state.filters.status = button.dataset.status;
    render();
  }

  function handleSearchInput(event) {
    const value = event.target.value;

    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      state.filters.query = value;
      render();
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSearchKeydown(event) {
    if (event.key === 'Escape') {
      event.target.value = '';
      state.filters.query = '';
      render();
    }
  }

  function handleCategoryChange(event) {
    state.filters.category = event.target.value;
    render();
  }

  function handleSortChange(event) {
    state.filters.sort = event.target.value;
    render();
  }

  async function handleClearCompleted() {
    const stats = App.tasks.getStats();
    if (stats.completed === 0) {
      return;
    }

    const confirmed = await App.ui.openConfirm({
      title: 'Clear completed tasks?',
      message:
        stats.completed +
        ' completed ' +
        App.utils.pluralize(stats.completed, 'task') +
        ' will be permanently removed from this browser.',
      confirmLabel: 'Clear Completed'
    });

    if (!confirmed) {
      return;
    }

    const removedCount = App.tasks.clearCompleted();
    if (removedCount > 0) {
      App.ui.showToast(
        removedCount +
          ' completed ' +
          App.utils.pluralize(removedCount, 'task') +
          ' cleared.',
        'success'
      );
    }
  }

  /* ------------------------------------------------------------
     Theme
     ------------------------------------------------------------ */

  function preferredTheme() {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }

  function handleThemeToggle() {
    const nextTheme = App.ui.getTheme() === 'dark' ? 'light' : 'dark';
    App.ui.applyTheme(nextTheme);
    App.storage.saveTheme(nextTheme);
  }

  /* ------------------------------------------------------------
     Global keyboard shortcut: "/" focuses the search field
     ------------------------------------------------------------ */

  function handleGlobalKeydown(event) {
    if (event.key !== '/' || event.defaultPrevented || event.ctrlKey || event.metaKey) {
      return;
    }

    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable);

    if (isTyping) {
      return;
    }

    event.preventDefault();
    els.searchInput.focus();
    els.searchInput.select();
  }

  /* ------------------------------------------------------------
     Wiring
     ------------------------------------------------------------ */

  function bindEvents() {
    els.taskForm.addEventListener('submit', handleAddSubmit);
    els.titleInput.addEventListener('input', App.ui.clearFormError);

    els.taskList.addEventListener('click', handleTaskListClick);
    els.taskList.addEventListener('change', handleTaskListChange);

    els.editForm.addEventListener('submit', handleEditSubmit);

    els.statusFilters.addEventListener('click', handleStatusFilterClick);
    els.searchInput.addEventListener('input', handleSearchInput);
    els.searchInput.addEventListener('keydown', handleSearchKeydown);
    els.categoryFilter.addEventListener('change', handleCategoryChange);
    els.sortSelect.addEventListener('change', handleSortChange);
    els.clearCompleted.addEventListener('click', handleClearCompleted);

    els.themeToggle.addEventListener('click', handleThemeToggle);
    document.addEventListener('keydown', handleGlobalKeydown);
  }

  function init() {
    App.ui.init();
    App.tasks.init();

    els = App.ui.elements();
    bindEvents();

    App.ui.applyTheme(App.storage.loadTheme() || preferredTheme());
    App.tasks.subscribe(render);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.MyTasks);
