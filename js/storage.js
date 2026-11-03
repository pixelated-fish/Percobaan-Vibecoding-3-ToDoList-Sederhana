/* ============================================================
   storage.js — LocalStorage persistence (tasks + theme preference)
   ============================================================ */

window.MyTasks = window.MyTasks || {};

(function (App) {
  'use strict';

  const STORAGE_KEYS = {
    tasks: 'mytasks.tasks.v1',
    theme: 'mytasks.theme.v1'
  };

  const THEMES = ['light', 'dark'];

  /**
   * LocalStorage can be unavailable (private mode with blocked storage,
   * disabled cookies, etc.). Detect it once so the app can keep working
   * in memory instead of throwing.
   */
  const storageAvailable = (function checkStorage() {
    try {
      const testKey = '__mytasks_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage is not available; tasks will only last for this session.', error);
      return false;
    }
  })();

  function isAvailable() {
    return storageAvailable;
  }

  /** Reads and parses the stored task array. Returns [] on any problem. */
  function loadTasks() {
    if (!storageAvailable) {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.tasks);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn('Stored task data is not an array; starting with an empty list.');
        return [];
      }

      return parsed;
    } catch (error) {
      console.error('Could not read tasks from LocalStorage:', error);
      return [];
    }
  }

  /** Serializes the task array. Returns false when saving failed. */
  function saveTasks(tasks) {
    if (!storageAvailable) {
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('Could not save tasks to LocalStorage:', error);
      return false;
    }
  }

  function loadTheme() {
    if (!storageAvailable) {
      return null;
    }

    try {
      const theme = window.localStorage.getItem(STORAGE_KEYS.theme);
      return THEMES.indexOf(theme) !== -1 ? theme : null;
    } catch (error) {
      console.warn('Could not read the theme preference:', error);
      return null;
    }
  }

  function saveTheme(theme) {
    if (!storageAvailable || THEMES.indexOf(theme) === -1) {
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, theme);
      return true;
    } catch (error) {
      console.warn('Could not save the theme preference:', error);
      return false;
    }
  }

  /** Removes all app data (tasks + theme) from LocalStorage. */
  function clearAll() {
    if (!storageAvailable) {
      return false;
    }

    try {
      window.localStorage.removeItem(STORAGE_KEYS.tasks);
      window.localStorage.removeItem(STORAGE_KEYS.theme);
      return true;
    } catch (error) {
      console.error('Could not clear LocalStorage:', error);
      return false;
    }
  }

  App.storage = {
    STORAGE_KEYS: STORAGE_KEYS,
    isAvailable: isAvailable,
    loadTasks: loadTasks,
    saveTasks: saveTasks,
    loadTheme: loadTheme,
    saveTheme: saveTheme,
    clearAll: clearAll
  };
})(window.MyTasks);
