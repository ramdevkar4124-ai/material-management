import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useStore } from '../store';
import { budgetState, itemCost, leftOf, money, siteSpent, uid, usedOf } from '../util';
import { Bar, Button, Card, ErrorText, Input, Muted, Pill, Title, useColors } from '../ui';

// Site screen: materials for one site, add a material, stock in/out, and the site budget.
export default function SiteScreen({ route, navigation }) {
  const { sites, persist } = useStore();
  const c = useColors();
  const site = sites.find((s) => s.id === route.params.siteId);

  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState('');
  const [cat, setCat] = useState('');
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('All');
  const [openId, setOpenId] = useState(null);
  const [moveQty, setMoveQty] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [moveErr, setMoveErr] = useState('');

  const cats = useMemo(() => {
    const set = new Set((site?.items || []).map((i) => i.cat).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [site]);

  if (!site) return <Muted style={{ padding: 16 }}>This site no longer exists.</Muted>;

  function updateSite(next) {
    persist(sites.map((s) => (s.id === site.id ? next : s)));
  }

  function addItem() {
    const n = name.trim();
    const q = Number(qty);
    const cpu = Number(cost);
    if (!n) return setErr('Enter a material name.');
    if (!(isFinite(q) && q >= 0)) return setErr('Enter the quantity.');
    if (!(isFinite(cpu) && cpu >= 0)) return setErr('Enter the cost per unit.');
    const item = { id: uid(), name: n.slice(0, 60), quantity: q, unit: unit.trim(), costPerUnit: Math.round(cpu * 100) / 100, cat: cat.trim().slice(0, 30), addedAt: Date.now(), stock: [] };
    updateSite({ ...site, items: [...site.items, item] });
    setName(''); setQty(''); setUnit(''); setCost(''); setCat(''); setErr('');
  }

  function removeItem(id) {
    Alert.alert('Delete material?', 'This removes the material and its stock log.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => updateSite({ ...site, items: site.items.filter((i) => i.id !== id) }) },
    ]);
  }

  function stockMove(item, type) {
    const q = Number(moveQty);
    setMoveErr('');
    if (!(Number.isInteger(q) && q > 0)) return setMoveErr('Enter a whole number above 0.');
    if (type === 'out' && q > leftOf(item)) return setMoveErr(`Only ${leftOf(item)} left in stock.`);
    const entry = { type, qty: q, at: Date.now(), note: moveNote.trim().slice(0, 60) };
    const items = site.items.map((i) =>
      i.id !== item.id ? i : { ...i, stock: [...(i.stock || []), entry], quantity: type === 'in' ? i.quantity + q : i.quantity }
    );
    updateSite({ ...site, items });
    setMoveQty(''); setMoveNote('');
  }

  const state = budgetState(site);
  const spent = siteSpent(site);
  const pct = site.budget ? (spent / site.budget) * 100 : 0;
  const barColor = state === 'over' ? c.danger : state === 'warn' ? c.warn : c.accent;
  const shown = site.items.filter((i) => filter === 'All' || i.cat === filter);

  const header = (
    <View>
      <Title>{site.name}</Title>
      <Card>
        <Muted>Spent</Muted>
        <Text style={{ color: c.fg, fontSize: 24, fontWeight: '800' }}>{money(spent)}</Text>
        {!!site.budget && (
          <>
            <Muted>of {money(site.budget)} budget</Muted>
            <View style={{ marginTop: 8 }}><Bar pct={pct} color={barColor} /></View>
            <Muted style={{ marginTop: 4, color: barColor }}>
              {state === 'over' ? 'Over budget' : state === 'warn' ? 'Close to budget' : `${Math.round(pct)}% used`}
            </Muted>
          </>
        )}
      </Card>

      <Card>
        <Text style={{ color: c.fg, fontWeight: '700', marginBottom: 8 }}>Add material</Text>
        <Input placeholder="Material name (e.g. TMT steel rod)" value={name} onChangeText={setName} maxLength={60} accessibilityLabel="Material name" />
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input placeholder="Qty" value={qty} onChangeText={setQty} keyboardType="decimal-pad" accessibilityLabel="Quantity" /></View>
          <View style={{ flex: 1 }}><Input placeholder="Unit (kg, bag)" value={unit} onChangeText={setUnit} accessibilityLabel="Unit" /></View>
        </View>
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input placeholder="Cost per unit" value={cost} onChangeText={setCost} keyboardType="decimal-pad" accessibilityLabel="Cost per unit" /></View>
          <View style={{ flex: 1 }}><Input placeholder="Category" value={cat} onChangeText={setCat} maxLength={30} accessibilityLabel="Category" /></View>
        </View>
        <ErrorText>{err}</ErrorText>
        <View style={{ height: 8 }} />
        <Button label="Add material" onPress={addItem} />
      </Card>

      {cats.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {cats.map((k) => <Pill key={k} label={k} active={filter === k} onPress={() => setFilter(k)} />)}
        </View>
      )}
      {!site.items.length && <Muted>No materials yet.</Muted>}
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={shown}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => {
        const left = leftOf(item);
        const low = item.quantity > 0 && left / item.quantity <= 0.2;
        const open = openId === item.id;
        return (
          <Card>
            <Pressable onPress={() => { setOpenId(open ? null : item.id); setMoveErr(''); }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.fg, fontWeight: '700', fontSize: 15, flex: 1 }}>{item.name}</Text>
                <Text style={{ color: c.fg, fontWeight: '600' }}>{money(itemCost(item))}</Text>
              </View>
              <Muted>{item.cat ? item.cat + ' · ' : ''}{left} of {item.quantity} {item.unit} left</Muted>
              {low && <Muted style={{ color: c.warn, fontWeight: '700' }}>Low stock</Muted>}
            </Pressable>

            {open && (
              <View style={{ marginTop: 10 }}>
                <Input placeholder="Qty" value={moveQty} onChangeText={setMoveQty} keyboardType="number-pad" accessibilityLabel="Stock quantity" />
                <View style={{ height: 6 }} />
                <Input placeholder="Note (optional)" value={moveNote} onChangeText={setMoveNote} maxLength={60} accessibilityLabel="Stock note" />
                <ErrorText>{moveErr}</ErrorText>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <View style={{ flex: 1 }}><Button label="Stock in" onPress={() => stockMove(item, 'in')} /></View>
                  <View style={{ flex: 1 }}><Button label="Stock out" variant="alt" onPress={() => stockMove(item, 'out')} /></View>
                </View>
                <Text style={{ color: c.fg, fontWeight: '700', marginTop: 12 }}>Stock log</Text>
                {(item.stock || []).length === 0 && <Muted>No movements yet.</Muted>}
                {[...(item.stock || [])].reverse().map((e, idx) => (
                  <Muted key={idx}>
                    {new Date(e.at).toLocaleDateString('en-IN')} · {e.type === 'in' ? 'In +' : 'Out −'}{e.qty} {item.unit}{e.note ? ` · ${e.note}` : ''}
                  </Muted>
                ))}
                <View style={{ height: 10 }} />
                <Button label="Delete material" variant="danger" onPress={() => removeItem(item.id)} />
              </View>
            )}
          </Card>
        );
      }}
    />
  );
}
