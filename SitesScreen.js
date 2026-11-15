import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useStore } from '../store';
import { budgetState, money, siteSpent, uid } from '../util';
import { Bar, Button, Card, ErrorText, Input, Muted, Title, useColors, styles } from '../ui';

export default function SitesScreen({ navigation }) {
  const { sites, persist } = useStore();
  const c = useColors();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [err, setErr] = useState('');

  const totals = useMemo(() => {
    const spent = sites.reduce((a, s) => a + siteSpent(s), 0);
    const items = sites.reduce((a, s) => a + s.items.length, 0);
    return { spent, items };
  }, [sites]);

  function addSite() {
    const n = name.trim();
    if (!n) return setErr('Enter a site name.');
    const b = Number(budget);
    if (budget && !(isFinite(b) && b >= 0)) return setErr('Enter a valid budget.');
    persist([...sites, { id: uid(), name: n.slice(0, 60), budget: b || 0, location: location.trim(), suppliers: [], labour: [], items: [] }]);
    setName(''); setBudget(''); setLocation(''); setErr('');
  }

  const header = (
    <View>
      <Title>Sites</Title>
      <Card>
        <Muted>Total spent across all sites</Muted>
        <Text style={{ color: c.fg, fontSize: 26, fontWeight: '800', marginTop: 4 }}>{money(totals.spent)}</Text>
        <Muted>{sites.length} sites · {totals.items} materials</Muted>
      </Card>
      <Card>
        <Input placeholder="Site name (e.g. Block B)" value={name} onChangeText={setName} maxLength={60} accessibilityLabel="Site name" />
        <View style={{ height: 8 }} />
        <Input placeholder="Budget (optional)" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" accessibilityLabel="Budget" />
        <View style={{ height: 8 }} />
        <Input placeholder="Location (optional)" value={location} onChangeText={setLocation} maxLength={60} accessibilityLabel="Location" />
        <ErrorText>{err}</ErrorText>
        <View style={{ height: 8 }} />
        <Button label="Add site" onPress={addSite} />
      </Card>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={sites}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={header}
      ListEmptyComponent={<Muted>No sites yet. Add your first site above.</Muted>}
      renderItem={({ item: s }) => {
        const spent = siteSpent(s);
        const pct = s.budget ? (spent / s.budget) * 100 : 0;
        const state = budgetState(s);
        const barColor = state === 'over' ? c.danger : state === 'warn' ? c.warn : c.accent;
        return (
          <Pressable onPress={() => navigation.navigate('Site', { siteId: s.id })}>
            <Card>
              <Text style={{ color: c.fg, fontWeight: '700', fontSize: 16 }}>{s.name}</Text>
              {!!s.location && <Muted>{s.location}</Muted>}
              <Muted style={{ marginTop: 6 }}>
                Spent {money(spent)}{s.budget ? ` of ${money(s.budget)}` : ''} · {s.items.length} materials
              </Muted>
              {!!s.budget && (
                <View style={{ marginTop: 8 }}>
                  <Bar pct={pct} color={barColor} />
                  <Muted style={{ marginTop: 4, color: barColor }}>
                    {state === 'over' ? 'Over budget' : state === 'warn' ? `${Math.round(pct)}% used, close to budget` : `${Math.round(pct)}% used`}
                  </Muted>
                </View>
              )}
            </Card>
          </Pressable>
        );
      }}
    />
  );
}
