import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useStore } from '../store';
import { dayKey, labDaysIn, labEarnedIn, money, monthKey, uid } from '../util';
import { Button, Card, ErrorText, Input, Muted, Title, useColors } from '../ui';

// Labour: daily attendance per worker, plus a monthly muster roll grid.
export default function LabourScreen() {
  const { sites, persist } = useStore();
  const c = useColors();
  const [siteId, setSiteId] = useState(sites[0]?.id);
  const [day, setDay] = useState(dayKey());
  const [month, setMonth] = useState(monthKey());
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [err, setErr] = useState('');

  const site = sites.find((s) => s.id === siteId) || sites[0];
  if (!site) return <Muted style={{ padding: 16 }}>Add a site first.</Muted>;
  const workers = site.labour;

  function updateWorkers(next) {
    persist(sites.map((s) => (s.id === site.id ? { ...s, labour: next } : s)));
  }

  function addWorker() {
    const n = name.trim();
    const r = Number(rate);
    if (!n) return setErr('Enter a worker name.');
    if (!(isFinite(r) && r >= 0)) return setErr('Enter the daily rate.');
    updateWorkers([...workers, { id: uid(), name: n.slice(0, 40), rate: Math.round(r * 100) / 100, att: {} }]);
    setName(''); setRate(''); setErr('');
  }

  function mark(w, code) {
    const att = { ...w.att };
    if (att[day] === code) delete att[day]; else att[day] = code;
    updateWorkers(workers.map((x) => (x.id === w.id ? { ...w, att } : x)));
  }

  function removeWorker(w) {
    if (Object.keys(w.att).length) return;
    updateWorkers(workers.filter((x) => x.id !== w.id));
  }

  const monthTotal = useMemo(() => workers.reduce((a, w) => a + labEarnedIn(w, month), 0), [workers, month]);
  const [yr, mo] = month.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const dayNums = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cellKey = (d) => `${month}-${String(d).padStart(2, '0')}`;

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={workers}
      keyExtractor={(w) => w.id}
      ListHeaderComponent={
        <View>
          <Title>Labour</Title>
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
            <Input placeholder="Worker name" value={name} onChangeText={setName} maxLength={40} accessibilityLabel="Worker name" />
            <View style={{ height: 8 }} />
            <Input placeholder="Rate per day" value={rate} onChangeText={setRate} keyboardType="decimal-pad" accessibilityLabel="Rate per day" />
            <ErrorText>{err}</ErrorText>
            <View style={{ height: 8 }} />
            <Button label="Add worker" onPress={addWorker} />
          </Card>

          <Card>
            <Muted>Attendance date (YYYY-MM-DD)</Muted>
            <Input value={day} onChangeText={(v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && setDay(v)} accessibilityLabel="Attendance date" />
          </Card>

          {!workers.length && <Muted>No workers yet.</Muted>}
        </View>
      }
      renderItem={({ item: w }) => {
        const st = w.att[day] || '';
        return (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.fg, fontWeight: '700' }}>{w.name}</Text>
              <Text style={{ color: c.fg, fontWeight: '600' }}>{money(labEarnedIn(w, month))}</Text>
            </View>
            <Muted>Rate {money(w.rate)}/day · Days this month {labDaysIn(w, month)}</Muted>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              {[['P', 'Present'], ['H', 'Half'], ['A', 'Absent']].map(([code, label]) => (
                <Pressable
                  key={code}
                  onPress={() => mark(w, code)}
                  accessibilityRole="button"
                  style={{ flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderColor: c.line, backgroundColor: st === code ? c.accent : c.surface }}
                >
                  <Text style={{ color: st === code ? c.accentFg : c.fg, fontWeight: '700' }}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {!Object.keys(w.att).length && (
              <View style={{ marginTop: 8 }}>
                <Button label="Remove worker" variant="alt" onPress={() => removeWorker(w)} />
              </View>
            )}
          </Card>
        );
      }}
      ListFooterComponent={
        workers.length ? (
          <View style={{ marginTop: 10 }}>
            <Title>Muster roll</Title>
            <Card>
              <Muted>Month (YYYY-MM)</Muted>
              <Input value={month} onChangeText={(v) => /^\d{4}-\d{2}$/.test(v) && setMonth(v)} accessibilityLabel="Muster month" />
              <Muted style={{ marginTop: 8 }}>Wages for {month}</Muted>
              <Text style={{ color: c.fg, fontSize: 22, fontWeight: '800' }}>{money(monthTotal)}</Text>
            </Card>
            <ScrollView horizontal style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, backgroundColor: c.surface }}>
              <View>
                <View style={{ flexDirection: 'row' }}>
                  <Cell w={28} bold>#</Cell>
                  <Cell w={120} bold>Worker</Cell>
                  {dayNums.map((d) => <Cell key={d} w={30} bold>{d}</Cell>)}
                  <Cell w={50} bold>Days</Cell>
                  <Cell w={90} bold>Wages</Cell>
                </View>
                {workers.map((w, i) => (
                  <View key={w.id} style={{ flexDirection: 'row' }}>
                    <Cell w={28}>{i + 1}</Cell>
                    <Cell w={120}>{w.name}</Cell>
                    {dayNums.map((d) => <Cell key={d} w={30}>{w.att[cellKey(d)] || '-'}</Cell>)}
                    <Cell w={50}>{labDaysIn(w, month)}</Cell>
                    <Cell w={90}>{money(labEarnedIn(w, month))}</Cell>
                  </View>
                ))}
              </View>
            </ScrollView>
            <Muted style={{ marginTop: 6 }}>P = Present, H = Half day, A = Absent, - = not marked</Muted>
          </View>
        ) : null
      }
    />
  );
}

function Cell({ w, bold, children }) {
  const c = useColors();
  return (
    <View style={{ width: w, paddingVertical: 5, borderRightWidth: 1, borderBottomWidth: 1, borderColor: c.line, alignItems: 'center' }}>
      <Text style={{ color: c.fg, fontSize: 11, fontWeight: bold ? '700' : '400' }} numberOfLines={1}>{children}</Text>
    </View>
  );
}
