/**
 * Codegen spec file. combine-js-to-schema requires: 1) "export default codegenNativeComponent(...)"
 * at top level, 2) filename matching *NativeComponent. ResquircleViewNativeComponent imports
 * from here and adds runtime cache for branch-switch / Fast Refresh.
 */
import {
  codegenNativeComponent,
  type ColorValue,
  type ViewProps,
} from 'react-native';
import type { Float } from 'react-native/Libraries/Types/CodegenTypes';

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
