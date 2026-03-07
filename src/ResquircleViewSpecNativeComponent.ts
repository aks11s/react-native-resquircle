/**
 * Codegen spec. combine-js-to-schema requires "export default codegenNativeComponent(...)".
 * ResquircleViewNativeComponent imports via require() only when cache is empty.
 * Import from Libraries path for RN 0.73–0.78 compatibility (not exported from main in older versions).
 */
// eslint-disable-next-line @react-native/no-deep-imports -- needed for RN 0.73–0.78
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import { type ColorValue, type ViewProps } from 'react-native';

export interface NativeResquircleViewProps extends ViewProps {
  squircleBackgroundColor?: ColorValue;
  squircleBorderColor?: ColorValue;
  squircleBorderWidth?: number;
  borderRadius?: number;
  squircleTopLeftRadius?: number;
  squircleTopRightRadius?: number;
  squircleBottomRightRadius?: number;
  squircleBottomLeftRadius?: number;
  cornerSmoothing?: number;
  squircleBoxShadow?: string;
  clipContent?: boolean;
  squircleOutlineColor?: ColorValue;
  squircleOutlineWidth?: number;
  squircleOutlineOffset?: number;
  squircleOutlineStyle?: string;
  color?: ColorValue;
}

export default codegenNativeComponent<NativeResquircleViewProps>(
  'ResquircleView'
);
