import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import { SquircleView, SquircleButton, buildBoxShadow } from '../index';

describe('buildBoxShadow', () => {
  it('formats single shadow', () => {
    expect(
      buildBoxShadow([
        { x: 0, y: 2, blur: 4, spread: 0, color: '#000', opacity: 50 },
      ])
    ).toBe('0px 2px 4px 0px rgba(0, 0, 0, 0.5)');
  });

  it('formats shadow with spread', () => {
    expect(
      buildBoxShadow([
        { x: 1, y: 1, blur: 2, spread: 3, color: 'rgb(255,0,0)', opacity: 100 },
      ])
    ).toBe('1px 1px 2px 3px rgba(255, 0, 0, 1)');
  });

  it('joins multiple shadows', () => {
    const result = buildBoxShadow([
      { x: 0, y: 1, blur: 2, spread: 0, color: '#000', opacity: 30 },
      { x: 0, y: 2, blur: 4, spread: 0, color: '#000', opacity: 20 },
    ]);
    expect(result).toContain('0px 1px 2px 0px');
    expect(result).toContain('0px 2px 4px 0px');
  });

  it('handles hex shorthand', () => {
    expect(
      buildBoxShadow([{ x: 0, y: 0, blur: 0, color: '#f00', opacity: 100 }])
    ).toContain('rgba(255, 0, 0, 1)');
  });
});

describe('SquircleView', () => {
  it('renders without crashing', () => {
    let tree: ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <SquircleView style={{ backgroundColor: 'blue' }} />
      );
    });
    expect(tree!.root).toBeTruthy();
  });

  it('accepts cornerSmoothing and overflow props', () => {
    let tree: ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <SquircleView cornerSmoothing={0.8} overflow="hidden" />
      );
    });
    expect(tree!.root).toBeTruthy();
  });
});

describe('SquircleButton', () => {
  it('renders without crashing', () => {
    let tree: ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(<SquircleButton>Press</SquircleButton>);
    });
    expect(tree!.root).toBeTruthy();
  });

  it('accepts activeOpacity', () => {
    let tree: ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <SquircleButton activeOpacity={0.7}>Press</SquircleButton>
      );
    });
    expect(tree!.root).toBeTruthy();
  });
});
