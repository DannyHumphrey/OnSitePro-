import { useAvailableForms } from '@/hooks/useAvailableForms';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/constants/styles';
import { useFormCounts } from '@/context/FormCountsContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { counts } = useFormCounts();
  const [open, setOpen] = React.useState(false);
  const forms = useAvailableForms();
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Card style={styles.card} onPress={() => navigation.navigate('InboxTab' as never)}>
          <Card.Title title="Inbox" left={() => <MaterialIcons name="inbox" size={24} />} subtitle={`Items: ${counts.inbox}`} />
        </Card>
        <Card style={styles.card} onPress={() => navigation.navigate('DraftsTab' as never)}>
          <Card.Title title="Drafts" left={() => <MaterialIcons name="drafts" size={24} />} subtitle={`Items: ${counts.drafts}`} />
        </Card>
        <Card style={styles.card} onPress={() => navigation.navigate('OutboxTab' as never)}>
          <Card.Title title="Outbox" left={() => <MaterialIcons name="outbox" size={24} />} subtitle={`Items: ${counts.outbox}`} />
        </Card>
        <Card style={styles.card} onPress={() => navigation.navigate('SentTab' as never)}>
          <Card.Title title="Sent" left={() => <MaterialIcons name="send" size={24} />} subtitle={`Items: ${counts.sent}`} />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
});
