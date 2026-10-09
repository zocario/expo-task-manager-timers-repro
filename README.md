# expo-task-manager: JS timers hang in Android background tasks (SDK 57)

Minimal reproduction for an expo-task-manager bug on Android with SDK 57 / React Native 0.86: a background task that awaits a timer never gets past that `await` while the app is in the background.

The whole repro is in [`App.tsx`](App.tsx): a task defined at module scope that logs, awaits `setTimeout(1000)`, then logs again.

## Steps

1. `npm install && npx expo run:android` on an Android emulator.
2. Tap **Register background task**, then press Home (keep the app process alive).
3. Find the job id (it changes after each run):

   ```sh
   adb shell dumpsys jobscheduler com.example.taskmanagertimers | grep "JOB #"
   ```

4. Force the job:

   ```sh
   adb shell cmd jobscheduler run -f com.example.taskmanagertimers <jobId>
   ```

5. Watch the logs:

   ```sh
   adb logcat | grep -E "ReactNativeJS|TaskService"
   ```

**Expected:** `[repro] task started`, then `[repro] timer fired after ~1000 ms`.

**Actual:** only `[repro] task started`. The second line appears only when the app is brought back to the foreground.

## Verifying the fix

Change the headless task registration in `node_modules/expo-task-manager/build/TaskManager.js` so that it never settles:

```diff
-    AppRegistry.registerHeadlessTask('expo-task-manager', () => async () => { });
+    AppRegistry.registerHeadlessTask('expo-task-manager', () => () => new Promise(() => { }));
```

Restart Metro with `npx expo start --clear`, relaunch the app and repeat steps 2 to 5: the timer fires after ~1000 ms and `TaskService` logs `Finished headless task N` once the task is done.
