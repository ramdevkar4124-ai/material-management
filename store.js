// Local-first data store. Everything is kept on the phone in AsyncStorage.
// Shape mirrors the web app's data so a backup file can move between them.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { uid } from './util';

const DATA_KEY = 'mm.data.v1';
const PREFS_KEY = 'mm.prefs.v1';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [sites, setSites] = useState([]);
  const [prefs, setPrefs] = useState({ theme: 'system', currency: '₹' });
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'light');

  useEffect(() => {
    (async () => {
      try {
        const [d, p] = await Promise.all([AsyncStorage.getItem(DATA_KEY), AsyncStorage.getItem(PREFS_KEY)]);
        if (d) setSites(normaliseSites(JSON.parse(d)));
        if (p) setPrefs((old) => ({ ...old, ...JSON.parse(p) }));
      } catch (e) {
        // Corrupt storage: start empty rather than crash.
      }
      setReady(true);
    })();
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme || 'light'));
    return () => sub.remove();
  }, []);

  const persist = useCallback(async (next) => {
    setSites(next);
    try { await AsyncStorage.setItem(DATA_KEY, JSON.stringify(next)); } catch (e) {}
  }, []);

  const updatePrefs = useCallback(async (patch) => {
    setPrefs((old) => {
      const next = { ...old, ...patch };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Replace all sites (used by restore). Returns the normalised list.
  const replaceAll = useCallback((list) => persist(normaliseSites(list)), [persist]);

  const value = {
    ready,
    sites,
    persist,
    replaceAll,
    prefs,
    updatePrefs,
    theme: prefs.theme,
    systemScheme,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// Fill in missing fields so older or partial backups still load.
export function normaliseSites(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((s) => s && typeof s.name === 'string')
    .map((s) => ({
      id: String(s.id || uid()),
      name: s.name.trim().slice(0, 60),
      budget: Math.max(0, Number(s.budget) || 0),
      location: typeof s.location === 'string' ? s.location : '',
      suppliers: Array.isArray(s.suppliers) ? s.suppliers.map(normSupplier) : [],
      labour: Array.isArray(s.labour) ? s.labour.map(normWorker) : [],
      items: Array.isArray(s.items) ? s.items.map(normItem) : [],
    }));
}

function normSupplier(sp) {
  return {
    id: String(sp.id || uid()),
    name: String(sp.name || 'Supplier').slice(0, 40),
    entries: Array.isArray(sp.entries)
      ? sp.entries
          .filter((e) => e && (e.type === 'udhar' || e.type === 'jama'))
          .map((e) => ({ id: String(e.id || uid()), type: e.type, amount: Math.max(0, Number(e.amount) || 0), at: Number(e.at) || Date.now(), note: String(e.note || '').slice(0, 60) }))
      : [],
  };
}

function normWorker(w) {
  const att = {};
  if (w.att && typeof w.att === 'object') {
    Object.keys(w.att).forEach((k) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && ['P', 'H', 'A'].includes(w.att[k])) att[k] = w.att[k];
    });
  }
  return { id: String(w.id || uid()), name: String(w.name || 'Worker').slice(0, 40), rate: Math.max(0, Number(w.rate) || 0), att };
}

function normItem(it) {
  return {
    id: String(it.id || uid()),
    name: String(it.name || 'Material').slice(0, 60),
    quantity: Math.max(0, Number(it.quantity) || 0),
    unit: String(it.unit || ''),
    costPerUnit: Math.max(0, Number(it.costPerUnit) || 0),
    cat: String(it.cat || ''),
    addedAt: Number(it.addedAt) || Date.now(),
    stock: Array.isArray(it.stock)
      ? it.stock
          .filter((e) => e && (e.type === 'in' || e.type === 'out'))
          .map((e) => ({ type: e.type, qty: Math.max(0, Number(e.qty) || 0), at: Number(e.at) || Date.now(), note: String(e.note || '').slice(0, 60) }))
      : [],
  };
}
