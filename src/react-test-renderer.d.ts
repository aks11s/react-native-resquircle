declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export interface ReactTestRenderer {
    root: { [key: string]: unknown };
    toJSON(): unknown;
  }

  export function act<T>(callback: () => T): T;

  const TestRenderer: {
    create(element: ReactElement): ReactTestRenderer;
  };
  export default TestRenderer;
}
