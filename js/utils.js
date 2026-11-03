/* ============================================================
   utils.js — shared helpers: IDs, text cleanup, dates, constants
   ============================================================ */

window.MyTasks = window.MyTasks || {};

(function (App) {
  'use strict';

  const PRIORITIES = ['low', 'medium', 'high'];
  const CATEGORIES = ['personal', 'work', 'study', 'other'];
  const PRIORITY_WEIGHT = { low: 1, medium: 2, high: 3 };
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  /**
   * Returns a unique id. Uses crypto.randomUUID when available and falls
   * back to a timestamp + random suffix for older browsers / file:// setups.
   */
  function generateId() {
    if (
      typeof window.crypto !== 'undefined' &&
      typeof window.crypto.randomUUID === 'function'
    ) {
      return window.crypto.randomUUID();
    }
    return (
      'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
    );
  }

  /** Trims a string (safe for non-string values). */
  function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  /** Trims and collapses repeated spaces so titles stay tidy. */
  function normalizeTitle(value) {
    return normalizeText(value).replace(/\s+/g, ' ');
  }

  /** Parses "YYYY-MM-DD" into a local Date (or null when invalid). */
  function parseDate(value) {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
      return null;
    }
    const parts = value.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const isRealDate =
      date.getFullYear() === parts[0] &&
      date.getMonth() === parts[1] - 1 &&
      date.getDate() === parts[2];
    if (!isRealDate) {
      return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function isValidDateString(value) {
    return parseDate(value) !== null;
  }

  function isValidTimestamp(value) {
    return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
  }

  /** Today as "YYYY-MM-DD" in the user's local timezone. */
  function getTodayISO() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return now.getFullYear() + '-' + month + '-' + day;
  }

  /** "2026-11-05" -> "Nov 5, 2026" (empty string when no/invalid date). */
  function formatDueDate(value) {
    const date = parseDate(value);
    if (!date) {
      return '';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /** ISO timestamp -> "Nov 3" (empty string when invalid). */
  function formatCreatedDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /** Full label for the header, e.g. "Tuesday, November 3, 2026". */
  function formatToday() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function isOverdue(dueDate, completed) {
    if (completed) {
      return false;
    }
    return isValidDateString(dueDate) && dueDate < getTodayISO();
  }

  function isDueToday(dueDate) {
    return dueDate === getTodayISO();
  }

  function capitalize(value) {
    const text = typeof value === 'string' ? value : '';
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural || singular + 's';
  }

  function truncate(value, maxLength) {
    const text = typeof value === 'string' ? value : '';
    return text.length > maxLength ? text.slice(0, maxLength - 1).trimEnd() + '…' : text;
  }

  /**
   * Validates and normalizes a task read from LocalStorage so a corrupted or
   * outdated record can never break the interface. Returns null when unusable.
   */
  function normalizeTask(raw) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const title = normalizeTitle(raw.title);
    if (!title) {
      return null;
    }

    const now = new Date().toISOString();
    const createdAt = isValidTimestamp(raw.createdAt) ? raw.createdAt : now;

    return {
      id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : generateId(),
      title: title,
      description: normalizeText(raw.description),
      dueDate: isValidDateString(raw.dueDate) ? raw.dueDate : '',
      priority: PRIORITIES.indexOf(raw.priority) !== -1 ? raw.priority : 'medium',
      category: CATEGORIES.indexOf(raw.category) !== -1 ? raw.category : 'other',
      completed: raw.completed === true,
      createdAt: createdAt,
      updatedAt: isValidTimestamp(raw.updatedAt) ? raw.updatedAt : createdAt
    };
  }

  App.utils = {
    PRIORITIES: PRIORITIES,
    CATEGORIES: CATEGORIES,
    PRIORITY_WEIGHT: PRIORITY_WEIGHT,
    generateId: generateId,
    normalizeText: normalizeText,
    normalizeTitle: normalizeTitle,
    normalizeTask: normalizeTask,
    parseDate: parseDate,
    isValidDateString: isValidDateString,
    isValidTimestamp: isValidTimestamp,
    getTodayISO: getTodayISO,
    formatDueDate: formatDueDate,
    formatCreatedDate: formatCreatedDate,
    formatToday: formatToday,
    isOverdue: isOverdue,
    isDueToday: isDueToday,
    capitalize: capitalize,
    pluralize: pluralize,
    truncate: truncate
  };
})(window.MyTasks);
