/* ============================================================
   tasks.js — task state and CRUD operations (single source of truth)
   ============================================================ */

window.MyTasks = window.MyTasks || {};

(function (App) {
  'use strict';

  const listeners = new Set();

  /** @type {Array<Object>} in-memory task list */
  let tasks = [];

  function emit(event) {
    listeners.forEach(function (listener) {
      try {
        listener(event);
      } catch (error) {
        console.error('A task listener failed:', error);
      }
    });
  }

  function persist() {
    const saved = App.storage.saveTasks(tasks);
    if (!saved) {
      App.notifications.show(
        'Your changes could not be saved. Local storage may be full or blocked.',
        'error',
        5000
      );
    }
    return saved;
  }

  /** Loads tasks from LocalStorage, cleaning and de-duplicating them. */
  function init() {
    const stored = App.storage.loadTasks();
    const seenIds = new Set();

    tasks = stored
      .map(function (raw) {
        return App.utils.normalizeTask(raw);
      })
      .filter(function (task) {
        if (!task) {
          return false;
        }
        if (seenIds.has(task.id)) {
          return false;
        }
        seenIds.add(task.id);
        return true;
      });

    return tasks.length;
  }

  /** Validates raw form input. Returns { values, errors }. */
  function validateInput(input) {
    const source = input || {};
    const errors = {};

    const title = App.utils.normalizeTitle(source.title);
    const description = App.utils.normalizeText(source.description);
    const dueDate = App.utils.normalizeText(source.dueDate);
    const priority = source.priority;
    const category = source.category;

    if (!title) {
      errors.title = 'Task title is required.';
    } else if (title.length > 120) {
      errors.title = 'Task title must be 120 characters or fewer.';
    }

    if (description.length > 500) {
      errors.description = 'Description must be 500 characters or fewer.';
    }

    if (dueDate && !App.utils.isValidDateString(dueDate)) {
      errors.dueDate = 'Please choose a valid due date.';
    }

    if (App.utils.PRIORITIES.indexOf(priority) === -1) {
      errors.priority = 'Please choose a valid priority.';
    }

    if (App.utils.CATEGORIES.indexOf(category) === -1) {
      errors.category = 'Please choose a valid category.';
    }

    return {
      errors: errors,
      values: {
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
        category: category
      }
    };
  }

  function create(input) {
    const result = validateInput(input);

    if (Object.keys(result.errors).length > 0) {
      return { ok: false, errors: result.errors };
    }

    const now = new Date().toISOString();
    const task = {
      id: App.utils.generateId(),
      title: result.values.title,
      description: result.values.description,
      dueDate: result.values.dueDate,
      priority: result.values.priority,
      category: result.values.category,
      completed: false,
      createdAt: now,
      updatedAt: now
    };

    tasks.unshift(task);
    persist();
    emit({ type: 'create', task: task });

    return { ok: true, task: task };
  }

  function update(id, input) {
    const task = findById(id);
    if (!task) {
      return { ok: false, errors: { form: 'This task no longer exists.' } };
    }

    const result = validateInput(input);
    if (Object.keys(result.errors).length > 0) {
      return { ok: false, errors: result.errors };
    }

    task.title = result.values.title;
    task.description = result.values.description;
    task.dueDate = result.values.dueDate;
    task.priority = result.values.priority;
    task.category = result.values.category;
    task.updatedAt = new Date().toISOString();

    persist();
    emit({ type: 'update', task: task });

    return { ok: true, task: task };
  }

  function toggle(id) {
    const task = findById(id);
    if (!task) {
      return null;
    }

    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();

    persist();
    emit({ type: task.completed ? 'complete' : 'reopen', task: task });

    return task;
  }

  function remove(id) {
    const index = tasks.findIndex(function (task) {
      return task.id === id;
    });

    if (index === -1) {
      return false;
    }

    const removed = tasks.splice(index, 1)[0];
    persist();
    emit({ type: 'delete', task: removed });

    return true;
  }

  function clearCompleted() {
    const completedCount = tasks.filter(function (task) {
      return task.completed;
    }).length;

    if (completedCount === 0) {
      return 0;
    }

    tasks = tasks.filter(function (task) {
      return !task.completed;
    });

    persist();
    emit({ type: 'clear-completed', count: completedCount });

    return completedCount;
  }

  function findById(id) {
    return (
      tasks.find(function (task) {
        return task.id === id;
      }) || null
    );
  }

  /** Returns copies so callers cannot mutate internal state directly. */
  function getAll() {
    return tasks.map(function (task) {
      return Object.assign({}, task);
    });
  }

  function getById(id) {
    const task = findById(id);
    return task ? Object.assign({}, task) : null;
  }

  function getStats() {
    const total = tasks.length;
    const completed = tasks.filter(function (task) {
      return task.completed;
    }).length;
    const pending = total - completed;

    return {
      total: total,
      completed: completed,
      pending: pending,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100)
    };
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      return function () {};
    }
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  App.tasks = {
    init: init,
    create: create,
    update: update,
    toggle: toggle,
    remove: remove,
    clearCompleted: clearCompleted,
    getAll: getAll,
    getById: getById,
    getStats: getStats,
    validateInput: validateInput,
    subscribe: subscribe
  };
})(window.MyTasks);
