import type {
  PressableProps,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';

type ResquircleProps = {
  /**
   * Corner smoothing amount.
   *
   * Range: **0..1**
   * Default: 0.6 (60%)
   */
  cornerSmoothing?: number;
  /**
   * Controls whether the squircle drawing is clipped.
   */
  overflow?: 'visible' | 'hidden';
};

export type ResquircleViewProps = Omit<ViewProps, 'style'> &
  ResquircleProps & {
    style?: StyleProp<ViewStyle>;
  };

export type ResquircleButtonProps = Omit<PressableProps, 'style'> &
  ResquircleProps & {
    /**
     * Applied to the underlying `ResquircleView` (not to `Pressable`).
     */
    style?: StyleProp<ViewStyle>;
    activeOpacity?: number;
  };
