// Shared helpers: ids, money formatting, dates, stock and budget maths.
// Same rules as the web app: spent = sum(quantity * costPerUnit),
// warn at 80% of budget, over at 100%.

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function money(n) {
  const v = Number(n) || 0;
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function dayKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function monthKey(d = new Date()) {
  return dayKey(d).slice(0, 7);
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ---- Materials and stock ----
export function usedOf(item) {
  return (item.stock || []).reduce((a, e) => a + (e.type === 'out' ? e.qty : 0), 0);
}

export function leftOf(item) {
  return item.quantity - usedOf(item);
}

export function itemCost(item) {
  return (Number(item.quantity) || 0) * (Number(item.costPerUnit) || 0);
}

export function siteSpent(site) {
  return (site.items || []).reduce((a, it) => a + itemCost(it), 0);
}

// 'ok' | 'warn' | 'over' | 'none'
export function budgetState(site) {
  if (!site.budget) return 'none';
  const pct = (siteSpent(site) / site.budget) * 100;
  if (pct > 100) return 'over';
  if (pct >= 80) return 'warn';
  return 'ok';
}

// ---- Suppliers: balance = udhar (we owe) minus jama (we paid) ----
export function supBalance(sp) {
  return (sp.entries || []).reduce((a, e) => a + (e.type === 'udhar' ? e.amount : -e.amount), 0);
}

// ---- Labour: P = 1 day, H = half day, A = 0 ----
export function labDaysIn(worker, prefix) {
  return Object.keys(worker.att || {}).reduce((a, k) => {
    if (prefix && !k.startsWith(prefix)) return a;
    const c = worker.att[k];
    return a + (c === 'P' ? 1 : c === 'H' ? 0.5 : 0);
  }, 0);
}

export function labEarnedIn(worker, prefix) {
  return labDaysIn(worker, prefix) * (Number(worker.rate) || 0);
}
