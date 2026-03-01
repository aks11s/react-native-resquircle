import {
  codegenNativeComponent,
  type ColorValue,
  type ViewProps,
} from 'react-native';
import type { Float } from 'react-native/Libraries/Types/CodegenTypes';

const GLOBAL_CACHE_KEY = '__react_native_resquircle_NativeComponent';

// Cache on global to avoid "Tried to register two views with the same name" when
// switching branches or Fast Refresh re-evaluates this module while native registry persists.
function getNativeResquircleView() {
  const g = typeof global !== 'undefined' ? global : ({} as any);
  if (g[GLOBAL_CACHE_KEY]) {
    return g[GLOBAL_CACHE_KEY];
  }
  const Component = codegenNativeComponent<NativeResquircleViewProps>(
    'ResquircleView'
  );
  g[GLOBAL_CACHE_KEY] = Component;
  return Component;
}

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

export default getNativeResquircleView();
