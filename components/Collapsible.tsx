import { PropsWithChildren, useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export type CollapsibleProps = PropsWithChildren & {
  title: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  hasError?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function Collapsible({
  children,
  title,
  isOpen: isOpenProp,
  onToggle,
  hasError,
  onLayout,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(isOpenProp ?? false);
  const theme = useColorScheme() ?? 'light';

  useEffect(() => {
    if (isOpenProp !== undefined) {
      setInternalOpen(isOpenProp);
    }
  }, [isOpenProp]);

  const toggle = () => {
    const next = !internalOpen;
    onToggle?.(next);
    if (isOpenProp === undefined) {
      setInternalOpen(next);
    }
  };

  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;

  return (
    <ThemedView onLayout={onLayout}>
      <TouchableOpacity
        style={[styles.heading, hasError && styles.errorHeading]}
        onPress={toggle}
        activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorHeading: {
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 4,
    padding: 4,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
