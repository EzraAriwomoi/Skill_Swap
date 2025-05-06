import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

export default function BlurTabBarBackground() {
  return (
    <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
  );
}
