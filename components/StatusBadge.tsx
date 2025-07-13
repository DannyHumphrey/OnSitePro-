import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

export type StatusBadgeProps = {
  label: string;
  color: string;
  icon?: string;
};

export function StatusBadge({ label, color, icon }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <ThemedText style={styles.text}>
        {icon ? `${icon} ` : ''}
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    color: '#fff',
    fontSize: 12,
  },
});
