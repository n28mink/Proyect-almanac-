'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'clover-motion';
const EVENT = 'clover-motion-change';

/** Preferencia de la persona: «reduced» detiene vídeos, scroll suave, revelados y transiciones (además de prefers-reduced-motion). */
export function applyMotionPref(pref: 'reduced' | 'auto') {
  const root = document.documentElement;
  if (pref === 'reduced') root.setAttribute('data-motion', 'reduced');
  else root.removeAttribute('data-motion');
  window.dispatchEvent(new Event(EVENT));
}

export function loadMotionPref() {
  try {
    if (localStorage.getItem(KEY) === 'reduced') applyMotionPref('reduced');
  } catch {}
}

export function setMotionPref(pref: 'reduced' | 'auto') {
  try {
    if (pref === 'reduced') localStorage.setItem(KEY, 'reduced');
    else localStorage.removeItem(KEY);
  } catch {}
  applyMotionPref(pref);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export const useMotionReducedByUser = () =>
  useSyncExternalStore(subscribe, () => document.documentElement.getAttribute('data-motion') === 'reduced', () => false);
