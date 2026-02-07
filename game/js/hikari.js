// hikari.js - ひかりちゃんキャラクター管理・変身

import { HIKARI_FORMS } from './data.js';

let currentForm = 'normal';

export function getForm() { return currentForm; }

export function setForm(form) {
  if (HIKARI_FORMS[form]) currentForm = form;
}

export function getEmoji() {
  return HIKARI_FORMS[currentForm]?.emoji || '👧';
}

export function getLabel() {
  return HIKARI_FORMS[currentForm]?.label || 'ひかりちゃん';
}

export function getFormCost(form) {
  return HIKARI_FORMS[form]?.cost || 0;
}

export function resetForm() {
  currentForm = 'normal';
}

export function createHikariElement(size = 48) {
  const el = document.createElement('div');
  el.className = 'hikari-char';
  el.style.fontSize = size + 'px';
  el.textContent = getEmoji();
  el.dataset.form = currentForm;
  return el;
}

export function updateHikariElement(el) {
  el.textContent = getEmoji();
  el.dataset.form = currentForm;
}
