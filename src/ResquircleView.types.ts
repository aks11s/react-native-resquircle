import type {
  PressableProps,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';

/**
 * Corner smoothing amount.
 *
 * Range: **0..1**
 * Default: 0.6 (60%)
 */
export interface SquircleViewProps extends ViewProps {
  cornerSmoothing?: number;
  /**
   * Controls whether the squircle drawing is clipped.
   */
  overflow?: 'visible' | 'hidden';
}

export interface SquircleButtonProps extends PressableProps {
  cornerSmoothing?: number;
  overflow?: 'visible' | 'hidden';
  /**
   * Applied to the underlying `SquircleView` (not to `Pressable`).
   */
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
}
