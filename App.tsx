import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const TASK_NAME = 'timer-repro-task';

// Defined at module scope, as the docs require.
TaskManager.defineTask(TASK_NAME, async () => {
  const startedAt = Date.now();
  console.log('[repro] task started');

  // Any timer-based await hangs here on Android SDK 57 while the app is in the background.
  // React Native's fetch() is affected too, since whatwg-fetch resolves through setTimeout(0).
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`[repro] timer fired after ${Date.now() - startedAt} ms`);
  return BackgroundTask.BackgroundTaskResult.Success;
});

export default function App() {
  const [status, setStatus] = useState('not registered');

  const register = async () => {
    await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 15 });
    const registered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    setStatus(registered ? 'registered' : 'registration failed');
  };

  return (
    <View style={styles.container}>
      <Text>Task status: {status}</Text>
      <Button title="Register background task" onPress={register} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
