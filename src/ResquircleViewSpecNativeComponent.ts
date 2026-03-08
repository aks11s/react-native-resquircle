/**
 * Codegen spec. combine-js-to-schema requires "export default codegenNativeComponent(...)".
 * ResquircleViewNativeComponent imports via require() only when cache is empty.
 */
import { codegenNativeComponent } from 'react-native';
import { type ColorValue, type ViewProps } from 'react-native';
import type { Float } from './CodegenTypes';

export interface NativeResquircleViewProps extends ViewProps {
  squircleBackgroundColor?: ColorValue;
  squircleBorderColor?: ColorValue;
  squircleBorderWidth?: Float;
  borderRadius?: Float;
  squircleTopLeftRadius?: Float;
  squircleTopRightRadius?: Float;
  squircleBottomRightRadius?: Float;
  squircleBottomLeftRadius?: Float;
  cornerSmoothing?: Float;
  squircleBoxShadow?: string;
  clipContent?: boolean;
  squircleOutlineColor?: ColorValue;
  squircleOutlineWidth?: Float;
  squircleOutlineOffset?: Float;
  squircleOutlineStyle?: string;
  color?: ColorValue;
}

export default codegenNativeComponent<NativeResquircleViewProps>(
  'ResquircleView'
);
