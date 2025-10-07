import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';

export default function ThemeToggle() {
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const colors = getTheme(theme);

  return (
    <TouchableOpacity
      accessibilityLabel="Toggle theme"
      onPress={toggleTheme}
      style={[styles.btn, { backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}
    >
      <View>
        {theme === 'light' ? (
          <Moon size={18} color={colors.subtext} />
        ) : (
          <Sun size={18} color={colors.accent} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)'
  }
});

