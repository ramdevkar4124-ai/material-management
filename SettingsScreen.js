import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import { useStore, normaliseSites } from '../store';
import { money, siteSpent, itemCost, usedOf, leftOf } from '../util';
import { Button, Card, Muted, Pill, Title, useColors } from '../ui';

export default function SettingsScreen() {
  const { sites, replaceAll, theme, updatePrefs } = useStore();
  const c = useColors();
  const [busy, setBusy] = useState(false);

  async function exportBackup() {
    try {
      const path = FileSystem.cacheDirectory + 'material-management-backup.json';
      await FileSystem.writeAsStringAsync(path, JSON.stringify({ app: 'material-management', version: 1, sites }, null, 2));
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Save backup' });
    } catch (e) {
      Alert.alert('Backup failed', String(e.message || e));
    }
  }

  async function restoreBackup() {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (res.canceled) return;
      const text = await FileSystem.readAsStringAsync(res.assets[0].uri);
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.sites;
      const clean = normaliseSites(list);
      if (!clean.length) return Alert.alert('Restore failed', 'No sites found in this file.');
      Alert.alert('Replace all data?', `This replaces your current ${sites.length} site(s) with ${clean.length} from the backup.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: () => replaceAll(clean) },
      ]);
    } catch (e) {
      Alert.alert('Restore failed', 'This file is not a valid backup.');
    }
  }

  // Print-ready HTML report for every site (open with Print or Save as PDF).
  async function printReport() {
    setBusy(true);
    try {
      const rows = sites.map((s) => {
        const items = s.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.quantity} ${esc(i.unit)}</td><td>${usedOf(i)}</td><td>${leftOf(i)}</td><td style="text-align:right">${money(itemCost(i))}</td></tr>`).join('');
        return `<h2>${esc(s.name)}</h2><p>Budget ${money(s.budget)} · Spent ${money(siteSpent(s))}</p>
          <table><thead><tr><th>Material</th><th>Qty</th><th>Used</th><th>Left</th><th>Cost</th></tr></thead><tbody>${items || '<tr><td colspan="5">No materials</td></tr>'}</tbody></table>`;
      }).join('');
      const html = `<html><head><meta name="viewport" content="width=device-width"><style>
        body{font-family:Helvetica,Arial,sans-serif;color:#14213d;padding:12px}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px}
        th,td{border:1px solid #ccc;padding:5px;text-align:left}
        th{background:#eef2f7}
      </style></head><body><h1>Material Management Report</h1>${rows}</body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save report' });
    } catch (e) {
      Alert.alert('Report failed', String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Title>Settings</Title>

      <Card>
        <Text style={{ color: c.fg, fontWeight: '700', marginBottom: 8 }}>Theme</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['system', 'light', 'dark'].map((t) => (
            <Pill key={t} label={t[0].toUpperCase() + t.slice(1)} active={theme === t} onPress={() => updatePrefs({ theme: t })} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={{ color: c.fg, fontWeight: '700' }}>Reports</Text>
        <Muted style={{ marginTop: 4, marginBottom: 10 }}>Create a PDF of all sites and their materials.</Muted>
        <Button label={busy ? 'Preparing…' : 'Print / Save PDF report'} onPress={printReport} disabled={busy} />
      </Card>

      <Card>
        <Text style={{ color: c.fg, fontWeight: '700' }}>Backup and restore</Text>
        <Muted style={{ marginTop: 4, marginBottom: 10 }}>Data is stored only on this phone. Save a backup file to keep it safe or move it to another phone.</Muted>
        <Button label="Save backup file" onPress={exportBackup} />
        <View style={{ height: 8 }} />
        <Button label="Restore from backup file" variant="alt" onPress={restoreBackup} />
      </Card>

      <Muted style={{ textAlign: 'center', marginTop: 12 }}>Material Management · Version 1.0.0</Muted>
    </ScrollView>
  );
}

function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
