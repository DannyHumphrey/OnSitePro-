import { View, Text, StyleSheet } from 'react-native';

export default function FormBuilderScreen() {
  return (
    <View style={styles.container}>
      <Text>Form builder is only available on desktop web.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
