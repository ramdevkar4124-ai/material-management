import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useStore } from '../store';
import { money, supBalance, uid, fmtDate } from '../util';
import { Button, Card, ErrorText, Input, Muted, Title, useColors } from '../ui';

// Khata ledger: Udhar = we bought on credit (we owe), Jama = we paid.
export default function SuppliersScreen() {
  const { sites, persist } = useStore();
  const c = useColors();
  const [siteId, setSiteId] = useState(sites[0]?.id);
  const [openId, setOpenId] = useState(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const site = sites.find((s) => s.id === siteId) || sites[0];
  const suppliers = site ? site.suppliers : [];
  const openSupp = suppliers.find((s) => s.id === openId);

  const totalOwed = useMemo(
    () => suppliers.reduce((a, sp) => a + Math.max(0, supBalance(sp)), 0),
    [suppliers]
  );

  if (!site) return <Muted style={{ padding: 16 }}>Add a site first.</Muted>;

  function updateSite(nextSuppliers) {
    persist(sites.map((s) => (s.id === site.id ? { ...s, suppliers: nextSuppliers } : s)));
  }

  function addSupplier() {
    const n = name.trim();
    if (!n) return setErr('Enter a supplier name.');
    updateSite([...suppliers, { id: uid(), name: n.slice(0, 40), entries: [] }]);
    setName(''); setErr('');
  }

  function addEntry(type) {
    const v = Number(amount);
    if (!(isFinite(v) && v > 0)) return setErr('Enter an amount above 0.');
    const entry = { id: uid(), type, amount: Math.round(v * 100) / 100, at: Date.now(), note: note.trim().slice(0, 60) };
    updateSite(suppliers.map((s) => (s.id === openSupp.id ? { ...s, entries: [...s.entries, entry] } : s)));
    setAmount(''); setNote(''); setErr('');
  }

  function removeSupplier(sp) {
    if (sp.entries.length) return;
    updateSite(suppliers.filter((s) => s.id !== sp.id));
    setOpenId(null);
  }

  // ---- Detail view for one supplier ----
  if (openSupp) {
    const bal = supBalance(openSupp);
    const label = bal > 0 ? 'Baki (you owe)' : bal < 0 ? 'Advance with supplier' : 'Settled';
    return (
      <FlatList
        style={{ backgroundColor: c.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={[...openSupp.entries].reverse()}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={
          <View>
            <Pressable onPress={() => setOpenId(null)}><Text style={{ color: c.accent, fontWeight: '700', marginBottom: 8 }}>← All suppliers</Text></Pressable>
            <Title>{openSupp.name}</Title>
            <Card>
              <Muted>{label}</Muted>
              <Text style={{ color: bal > 0 ? c.danger : c.ok, fontSize: 26, fontWeight: '800' }}>{money(Math.abs(bal))}</Text>
            </Card>
            <Card>
              <Input placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" accessibilityLabel="Amount" />
              <View style={{ height: 6 }} />
              <Input placeholder="Note (e.g. 20 bags cement)" value={note} onChangeText={setNote} maxLength={60} accessibilityLabel="Note" />
              <ErrorText>{err}</ErrorText>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}><Button label="Udhar (credit)" onPress={() => addEntry('udhar')} /></View>
                <View style={{ flex: 1 }}><Button label="Jama (paid)" variant="alt" onPress={() => addEntry('jama')} /></View>
              </View>
            </Card>
            {!openSupp.entries.length && <Muted>No entries yet.</Muted>}
          </View>
        }
        ListFooterComponent={
          !openSupp.entries.length ? (
            <View style={{ marginTop: 10 }}>
              <Button label="Remove supplier" variant="danger" onPress={() => removeSupplier(openSupp)} />
            </View>
          ) : null
        }
        renderItem={({ item: e }) => (
          <Card>
            <Text style={{ color: e.type === 'udhar' ? c.danger : c.ok, fontWeight: '700' }}>
              {e.type === 'udhar' ? 'Udhar +' : 'Jama −'}{money(e.amount)}
            </Text>
            <Muted>{fmtDate(e.at)}{e.note ? ` · ${e.note}` : ''}</Muted>
          </Card>
        )}
      />
    );
  }

  // ---- List of suppliers for the chosen site ----
  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={suppliers}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={
        <View>
          <Title>Suppliers</Title>
          {sites.length > 1 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 }}>
              {sites.map((s) => (
                <Pressable key={s.id} onPress={() => setSiteId(s.id)}>
                  <Text style={{ color: s.id === site.id ? c.accent : c.muted, fontWeight: '700' }}>{s.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Card>
            <Muted>Total you owe suppliers ({site.name})</Muted>
            <Text style={{ color: c.danger, fontSize: 26, fontWeight: '800' }}>{money(totalOwed)}</Text>
          </Card>
          <Card>
            <Input placeholder="Supplier or vendor name" value={name} onChangeText={setName} maxLength={40} accessibilityLabel="Supplier name" />
            <ErrorText>{err}</ErrorText>
            <View style={{ height: 8 }} />
            <Button label="Add supplier" onPress={addSupplier} />
          </Card>
          {!suppliers.length && <Muted>No suppliers yet.</Muted>}
        </View>
      }
      renderItem={({ item: sp }) => {
        const bal = supBalance(sp);
        return (
          <Pressable onPress={() => setOpenId(sp.id)}>
            <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.fg, fontWeight: '600', fontSize: 15 }}>{sp.name}</Text>
              <Text style={{ color: bal > 0 ? c.danger : c.ok, fontWeight: '700' }}>
                {bal > 0 ? 'Baki ' + money(bal) : bal < 0 ? 'Advance ' + money(-bal) : 'Settled'}
              </Text>
            </Card>
          </Pressable>
        );
      }}
    />
  );
}
