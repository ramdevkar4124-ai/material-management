// Small shared UI pieces. Every colour comes from the active palette.
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from './store';
import { palette } from './theme';

export function useColors() {
  const { theme, systemScheme } = useStore();
  return palette(theme, systemScheme);
}

export function Card({ children, style }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }, style]}>{children}</View>;
}

export function Title({ children }) {
  const c = useColors();
  return <Text style={[styles.title, { color: c.fg }]}>{children}</Text>;
}

export function Muted({ children, style }) {
  const c = useColors();
  return <Text style={[styles.muted, { color: c.muted }, style]}>{children}</Text>;
}

export function Button({ label, onPress, variant = 'primary', disabled, style }) {
  const c = useColors();
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  const bg = danger ? c.danger : primary ? c.accent : c.surface;
  const fg = primary || danger ? c.accentFg : c.fg;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: primary || danger ? bg : c.line, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Input(props) {
  const c = useColors();
  return (
    <TextInput
      placeholderTextColor={c.muted}
      {...props}
      style={[styles.input, { color: c.fg, borderColor: c.line, backgroundColor: c.surface }, props.style]}
    />
  );
}

export function Pill({ label, active, onPress }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, { backgroundColor: active ? c.accent : c.surface, borderColor: c.line }]}
    >
      <Text style={{ color: active ? c.accentFg : c.fg, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function ErrorText({ children }) {
  const c = useColors();
  if (!children) return null;
  return <Text style={{ color: c.danger, marginTop: 4 }}>{children}</Text>;
}

export function Bar({ pct, color }) {
  const c = useColors();
  return (
    <View style={[styles.bar, { backgroundColor: c.line }]}>
      <View style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', backgroundColor: color || c.accent }} />
    </View>
  );
}

export const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  muted: { fontSize: 13 },
  btn: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontWeight: '700', fontSize: 15 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, minWidth: 0 },
  pill: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginRight: 6 },
  bar: { height: 8, borderRadius: 99, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
