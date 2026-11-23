/* Persistencia local en IndexedDB: un único registro "state". Funciona sin conexión. */
(function () {
  'use strict';
  var DB_NAME = 'titan-workout', STORE = 'kv';

  function open() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  window.TW = window.TW || {};
  window.TW.db = {
    get: async function (key) {
      var db = await open();
      return new Promise(function (resolve, reject) {
        var q = db.transaction(STORE).objectStore(STORE).get(key);
        q.onsuccess = function () { resolve(q.result); };
        q.onerror = function () { reject(q.error); };
      });
    },
    set: async function (key, value) {
      var db = await open();
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    }
  };
})();
