/**
 * Runtime wrapper with global cache to avoid "Tried to register two views
 * with the same name" on branch switch / Fast Refresh. The actual spec
 * for codegen lives in ResquircleViewCodegen.ts (codegen requires direct
 * "export default codegenNativeComponent(...)" which combine-js-to-schema
 * regex matches).
 */
import CodegenComponent from './ResquircleViewSpecNativeComponent';

export type { NativeResquircleViewProps } from './ResquircleViewSpecNativeComponent';

const GLOBAL_CACHE_KEY = '__react_native_resquircle_NativeComponent';

function getNativeResquircleView() {
  const g = typeof global !== 'undefined' ? global : ({} as any);
  if (g[GLOBAL_CACHE_KEY]) {
    return g[GLOBAL_CACHE_KEY];
  }
  g[GLOBAL_CACHE_KEY] = CodegenComponent;
  return CodegenComponent;
}

export default getNativeResquircleView();
