"use strict";
/* Shared verification, lockout and tab-title helpers (client-side only). */
window.Axis = (function () {
  var KEY_HASH = "c0088e7d2f093796be1dc9ba0903987c303748937541b9b94520f357df449363";
  var KEY_PLAIN_FALLBACK = String.fromCharCode(78,101,116,115,116,114,105,107,101,48,49);
  var TOKEN = "v1." + KEY_HASH.slice(0, 16);
  var VERIFY_MS = 12 * 60 * 60 * 1000;
  var LOCK_MS = 60 * 60 * 1000;
  var DEFAULT_TITLE = "Focus";

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function verified() {
    var raw = get("axisVerified");
    if (!raw) return false;
    var i = raw.lastIndexOf(".");
    return raw.slice(0, i) === TOKEN && Number(raw.slice(i + 1)) > Date.now();
  }
  function verify(key) { set("axisVerified", TOKEN + "." + (Date.now() + VERIFY_MS)); if (key) set("axisKey", key); del("axisLockUntil"); }
  function getKey() { return verified() ? get("axisKey") || "" : ""; }
  function lockLeft() { return Math.max(0, Number(get("axisLockUntil") || 0) - Date.now()); }
  function lock() { set("axisLockUntil", String(Date.now() + LOCK_MS)); del("axisVerified"); del("axisKey"); }

  function check(value) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then(function (buf) {
        var h = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
        return h === KEY_HASH;
      });
    }
    return Promise.resolve(value === KEY_PLAIN_FALLBACK);
  }

  // Pages behind the key call this; anyone arriving unverified locks the key page for an hour.
  function require(gatePath) {
    if (verified()) return true;
    lock();
    location.replace(gatePath);
    return false;
  }

  function getTitle() { return get("axisTitle") || DEFAULT_TITLE; }
  function setTitle(t) { t = (t || "").trim(); if (t) set("axisTitle", t); else del("axisTitle"); applyTitle(); }
  function applyTitle() { document.title = getTitle(); }
  applyTitle();

  return { verified: verified, verify: verify, getKey: getKey, lockLeft: lockLeft, lock: lock, check: check, require: require, getTitle: getTitle, setTitle: setTitle, applyTitle: applyTitle };
})();
