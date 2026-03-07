import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

export const Haptics = {
  impact(style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Light) {
    if (Platform.OS === 'web') return;
    ExpoHaptics.impactAsync(style);
  },
  notification(type: ExpoHaptics.NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType.Success) {
    if (Platform.OS === 'web') return;
    ExpoHaptics.notificationAsync(type);
  },
};
