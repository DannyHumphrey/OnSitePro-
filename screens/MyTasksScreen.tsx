import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { getMyOpenTasks } from '@/api/formsApi';

export default function MyTasksScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  useEffect(() => {
    (async () => setTasks(await getMyOpenTasks()))();
  }, []);
  return (
    <FlatList
      data={tasks}
      keyExtractor={(t) => String(t.formTaskId)}
      renderItem={({ item }) => (
        <Card
          style={{ margin: 12 }}
          onPress={() =>
            navigation.navigate('FormInstance', {
              id: item.formInstanceId,
              sectionKey: item.sectionKey,
            })
          }
        >
          <Card.Title
            title={`${item.sectionKey}`}
            subtitle={`Instance #${item.formInstanceId} • ${item.roleRequired}`}
          />
          <Card.Actions>
            <Button
              onPress={() =>
                navigation.navigate('FormInstance', {
                  id: item.formInstanceId,
                  sectionKey: item.sectionKey,
                })
              }
            >
              Open
            </Button>
          </Card.Actions>
        </Card>
      )}
    />
  );
}
