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
        style={[styles.heading, hasError && styles.errorHeading, !isOpen && styles.headingClosed]}
        onPress={toggle}
        activeOpacity={0.8}>

        <ThemedText type="defaultSemiBold">{title}</ThemedText>

        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {isOpen && 
        <>

        <ThemedView style={[styles.content, hasError && styles.errorHeading]}>{children}</ThemedView>
        
        <TouchableOpacity
        style={[styles.footer, hasError && styles.errorHeading]}
        onPress={toggle}
        activeOpacity={0.8}>

          <ThemedText type="defaultSemiBold">{title}</ThemedText>

          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
            style={{ transform: [{ rotate: '-90deg' }] }}
          />
        </TouchableOpacity>
        </>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#e2e7e9',
    padding: 15,
    borderRadius: 0,
    borderColor: '#637a83',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1
  },
  headingClosed: {
    borderBottomWidth: 1
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#e2e7e9',
    padding: 5,
    paddingLeft: 15,
    paddingRight: 15,
    borderColor: '#637a83',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1
  },
  errorHeading: {
    borderColor: 'red',
  },
  content: {
    borderColor: '#637a83',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 5
  }
});
