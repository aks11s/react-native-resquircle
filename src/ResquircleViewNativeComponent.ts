import {
  codegenNativeComponent,
  type ColorValue,
  type ViewProps,
} from 'react-native';
import type { Float } from 'react-native/Libraries/Types/CodegenTypes';

// NOTE: RN codegen expects an interface (not a type-alias intersection).
// Otherwise it may fail with:
// "Failed to find type definition for <TypeName>"
export interface NativeResquircleViewProps extends ViewProps {
  /**
   * Background fill for the squircle.
   */
  squircleBackgroundColor?: ColorValue;
  /**
   * Border stroke color.
   */
  squircleBorderColor?: ColorValue;
  /**
   * Border width (dp).
   */
  squircleBorderWidth?: Float;
  /**
   * Corner radius (dp).
   */
  borderRadius?: Float;
  /**
   * Per-corner radii (dp). If provided, they take precedence over `borderRadius`.
   */
  squircleTopLeftRadius?: Float;
  squircleTopRightRadius?: Float;
  squircleBottomRightRadius?: Float;
  squircleBottomLeftRadius?: Float;
  /**
   * Corner smoothing amount. Range 0..1
   */
  cornerSmoothing?: Float;
  /**
   * CSS-like box-shadow string: "0px 2px 4px 0px rgba(...), ..."
   */
  squircleBoxShadow?: string;
  /**
   * Clip children to the squircle shape (iOS).
   */
  clipContent?: boolean;
  /**
   * Outline props (dp). Mirrors RN View `outline*` but rendered as squircle.
   */
  squircleOutlineColor?: ColorValue;
  squircleOutlineWidth?: Float;
  squircleOutlineOffset?: Float;
  squircleOutlineStyle?: string;
  /**
   * Back-compat: old example prop. Treated as squircleBackgroundColor.
   */
  color?: ColorValue;
}

export default codegenNativeComponent<NativeResquircleViewProps>(
  'ResquircleView'
);
