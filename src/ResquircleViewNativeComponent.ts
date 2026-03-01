/**
 * Runtime entry. Uses require() so we only load the spec when cache is empty —
 * avoids "Tried to register two views with the same name" on Fast Refresh / branch switch.
 * Spec: ResquircleViewSpecNativeComponent has codegenNativeComponent<Props>.
 */
import type { NativeResquircleViewProps } from './ResquircleViewSpecNativeComponent';
import type { HostComponent } from 'react-native';

export type { NativeResquircleViewProps };

const KEY = '__react_native_resquircle_NativeComponent';

function get(): HostComponent<NativeResquircleViewProps> {
  const g = (
    typeof global !== 'undefined'
      ? global
      : typeof globalThis !== 'undefined'
      ? globalThis
      : {}
  ) as Record<string, HostComponent<NativeResquircleViewProps>>;
  if (g[KEY]) return g[KEY];
  g[KEY] = require('./ResquircleViewSpecNativeComponent')
    .default as HostComponent<NativeResquircleViewProps>;
  return g[KEY];
}

export default get();
