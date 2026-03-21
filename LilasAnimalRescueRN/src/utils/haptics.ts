import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

export const Haptics = {
  tap() {
    if (Platform.OS === 'web') return;
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
  },
  success() {
    if (Platform.OS === 'web') return;
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
  },
  star() {
    if (Platform.OS === 'web') return;
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
  },
  error() {
    if (Platform.OS === 'web') return;
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
  },
};
