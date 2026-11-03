/* ============================================================
   filters.js — search, status/category filters and sorting
   ============================================================ */

window.MyTasks = window.MyTasks || {};

(function (App) {
  'use strict';

  const DEFAULT_FILTERS = {
    status: 'all', // all | active | completed
    category: 'all', // all | personal | work | study | other
    query: '',
    sort: 'newest' // newest | oldest | dueDate | priority
  };

  const SORT_OPTIONS = ['newest', 'oldest', 'dueDate', 'priority'];

  function compareNewestFirst(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }

  function compareOldestFirst(a, b) {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }

  /** Nearest due date first; tasks without a due date go to the end. */
  function compareDueDate(a, b) {
    const aHasDate = Boolean(a.dueDate);
    const bHasDate = Boolean(b.dueDate);

    if (aHasDate && bHasDate) {
      if (a.dueDate === b.dueDate) {
        return compareNewestFirst(a, b);
      }
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    if (aHasDate !== bHasDate) {
      return aHasDate ? -1 : 1;
    }
    return compareNewestFirst(a, b);
  }

  /** High -> Medium -> Low, newest first as tie-breaker. */
  function comparePriority(a, b) {
    const difference =
      App.utils.PRIORITY_WEIGHT[b.priority] - App.utils.PRIORITY_WEIGHT[a.priority];
    return difference !== 0 ? difference : compareNewestFirst(a, b);
  }

  const COMPARATORS = {
    newest: compareNewestFirst,
    oldest: compareOldestFirst,
    dueDate: compareDueDate,
    priority: comparePriority
  };

  /**
   * Applies status filter, category filter, title search and sorting.
   * All criteria combine (AND) and never mutate the input array.
   */
  function applyFilters(tasks, filters) {
    const safeFilters = Object.assign({}, DEFAULT_FILTERS, filters || {});
    const query = App.utils.normalizeText(safeFilters.query).toLowerCase();

    const filtered = (Array.isArray(tasks) ? tasks : []).filter(function (task) {
      if (safeFilters.status === 'active' && task.completed) {
        return false;
      }
      if (safeFilters.status === 'completed' && !task.completed) {
        return false;
      }
      if (safeFilters.category !== 'all' && task.category !== safeFilters.category) {
        return false;
      }
      if (query && task.title.toLowerCase().indexOf(query) === -1) {
        return false;
      }
      return true;
    });

    const comparator =
      COMPARATORS[SORT_OPTIONS.indexOf(safeFilters.sort) !== -1 ? safeFilters.sort : 'newest'];

    return filtered.sort(comparator);
  }

  App.filters = {
    DEFAULT_FILTERS: DEFAULT_FILTERS,
    SORT_OPTIONS: SORT_OPTIONS,
    applyFilters: applyFilters
  };
})(window.MyTasks);
