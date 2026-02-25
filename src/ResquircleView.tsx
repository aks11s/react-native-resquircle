import * as React from 'react';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  View,
  type ColorValue,
  type DimensionValue,
  processColor,
} from 'react-native';

import NativeResquircleView from './ResquircleViewNativeComponent';
import type {
  ResquircleButtonProps,
  ResquircleViewProps,
} from './ResquircleView.types';

const DEFAULT_CORNER_SMOOTHING = 0.6;

export const ResquircleView = React.forwardRef<
  View,
  ResquircleViewProps
>((props, ref) => {
  const { children } = props;
  const { nativeProps, contentStyle, restProps } =
    useResquircleProps(props);

  return (
    <NativeResquircleView
      ref={ref}
      {...nativeProps}
      style={contentStyle}
      {...restProps}
    >
      {children}
    </NativeResquircleView>
  );
});

ResquircleView.displayName = 'ResquircleView';

export const ResquircleButton = React.forwardRef<View, ResquircleButtonProps>(
  (props, ref) => {
    const { children, activeOpacity = 0.85 } = props;
    const { nativeProps, contentStyle, restProps } =
      useResquircleProps(props);

    return (
      <Pressable
        ref={ref}
        {...restProps}
      >
        {({ pressed }) => (
          <NativeResquircleView
            {...nativeProps}
            style={[contentStyle, pressed && { opacity: activeOpacity }]}
          >
            {typeof children === 'function' ? children({ pressed }) : children}
          </NativeResquircleView>
        )}
      </Pressable>
    );
  }
);

ResquircleButton.displayName = 'ResquircleButton';

const useResquircleProps = (
  props: ResquircleViewProps | ResquircleButtonProps
) => {
  const { cornerSmoothing, overflow, style, ...restProps } = props as any;

  const flattenedStyle = style ? StyleSheet.flatten(style) : undefined;
  const resolvedOverflow =
    overflow ?? (flattenedStyle as any)?.overflow ?? 'visible';

  const {
    // border radii
    borderRadius,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderTopStartRadius,
    borderTopEndRadius,
    borderBottomStartRadius,
    borderBottomEndRadius,
    // shadow styles
    boxShadow,
    shadowColor,
    shadowOpacity,
    shadowRadius,
    shadowOffset,
    elevation,
    // padding
    padding,
    paddingVertical,
    paddingHorizontal,
    paddingBottom,
    paddingEnd,
    paddingLeft,
    paddingRight,
    paddingStart,
    paddingTop,
    // other styles that should be passed to container
    ...containerStyle
  } = flattenedStyle || ({} as any);

  const resolvedCornerRadii = React.useMemo(() => {
    const base = typeof borderRadius === 'number' ? borderRadius : 0;
    const rtl = I18nManager.isRTL;

    const pick = (
      physical: unknown,
      logical: unknown,
      fallback: number
    ): number => {
      if (typeof physical === 'number') return physical;
      if (typeof logical === 'number') return logical;
      return fallback;
    };

    const tl = pick(
      borderTopLeftRadius,
      rtl ? borderTopEndRadius : borderTopStartRadius,
      base
    );
    const tr = pick(
      borderTopRightRadius,
      rtl ? borderTopStartRadius : borderTopEndRadius,
      base
    );
    const bl = pick(
      borderBottomLeftRadius,
      rtl ? borderBottomEndRadius : borderBottomStartRadius,
      base
    );
    const br = pick(
      borderBottomRightRadius,
      rtl ? borderBottomStartRadius : borderBottomEndRadius,
      base
    );

    return { base, tl, tr, br, bl };
  }, [
    borderRadius,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderTopStartRadius,
    borderTopEndRadius,
    borderBottomStartRadius,
    borderBottomEndRadius,
  ]);

  const derivedSquircleBoxShadow = React.useMemo(() => {
    if (typeof boxShadow === 'string' && boxShadow.trim().length > 0) {
      return boxShadow;
    }

    if (
      shadowColor == null &&
      shadowOpacity == null &&
      shadowRadius == null &&
      shadowOffset == null &&
      elevation == null
    ) {
      return undefined;
    }

    if (shadowRadius == null && shadowOffset == null && shadowColor == null) {
      return undefined;
    }

    const offsetX =
      typeof shadowOffset?.width === 'number' ? shadowOffset.width : 0;
    const offsetY =
      typeof shadowOffset?.height === 'number' ? shadowOffset.height : 0;
    const blur = typeof shadowRadius === 'number' ? shadowRadius : 0;
    const spread = 0;

    const rgba = colorToRgbaString(shadowColor as ColorValue, shadowOpacity);
    if (!rgba) return undefined;

    return `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${rgba}`;
  }, [
    boxShadow,
    shadowColor,
    shadowOpacity,
    shadowRadius,
    shadowOffset,
    elevation,
  ]);

  const calculatedPadding = React.useMemo(() => {
    const extraPadding = flattenedStyle?.borderWidth || 0;
    if (extraPadding === 0) {
      return {};
    }

    const calculatePadding = (_paddingValue: DimensionValue) => {
      if (typeof _paddingValue === 'number') {
        return _paddingValue + extraPadding;
      }
      return _paddingValue;
    };

    const result: any = {};
    if (padding !== undefined) result.padding = calculatePadding(padding);
    if (paddingVertical !== undefined)
      result.paddingVertical = calculatePadding(paddingVertical);
    if (paddingHorizontal !== undefined)
      result.paddingHorizontal = calculatePadding(paddingHorizontal);
    if (paddingBottom !== undefined)
      result.paddingBottom = calculatePadding(paddingBottom);
    if (paddingEnd !== undefined)
      result.paddingEnd = calculatePadding(paddingEnd);
    if (paddingLeft !== undefined)
      result.paddingLeft = calculatePadding(paddingLeft);
    if (paddingRight !== undefined)
      result.paddingRight = calculatePadding(paddingRight);
    if (paddingStart !== undefined)
      result.paddingStart = calculatePadding(paddingStart);
    if (paddingTop !== undefined)
      result.paddingTop = calculatePadding(paddingTop);

    if (Object.keys(result).length === 0 && extraPadding > 0) {
      result.padding = extraPadding;
    }

    return result;
  }, [
    flattenedStyle?.borderWidth,
    padding,
    paddingVertical,
    paddingHorizontal,
    paddingBottom,
    paddingEnd,
    paddingLeft,
    paddingRight,
    paddingStart,
    paddingTop,
  ]);

  const nativeProps = React.useMemo(
    () => ({
      borderRadius: resolvedCornerRadii.base,
      squircleTopLeftRadius: resolvedCornerRadii.tl,
      squircleTopRightRadius: resolvedCornerRadii.tr,
      squircleBottomRightRadius: resolvedCornerRadii.br,
      squircleBottomLeftRadius: resolvedCornerRadii.bl,
      squircleBorderWidth: flattenedStyle?.borderWidth ?? 0,
      squircleBackgroundColor:
        flattenedStyle?.backgroundColor ?? 'transparent',
      squircleBorderColor: flattenedStyle?.borderColor ?? 'transparent',
      cornerSmoothing:
        cornerSmoothing !== undefined
          ? cornerSmoothing
          : DEFAULT_CORNER_SMOOTHING,
      clipContent: resolvedOverflow === 'hidden',
      squircleBoxShadow: derivedSquircleBoxShadow,
    }),
    [
      cornerSmoothing,
      resolvedOverflow,
      derivedSquircleBoxShadow,
      resolvedCornerRadii,
      flattenedStyle?.backgroundColor,
      flattenedStyle?.borderColor,
      flattenedStyle?.borderWidth,
    ]
  );

  const contentStyle = React.useMemo(
    () => [
      styles.container,
      containerStyle,
      calculatedPadding,
      {
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        // We do our own squircle clipping; keep the host view overflow visible
        // so shadows/borders don't get rectangle-clipped by RN.
        overflow: 'visible',
        ...(boxShadow != null ? { boxShadow: undefined } : null),
        ...(shadowColor != null ? { shadowColor: undefined } : null),
        ...(shadowOpacity != null ? { shadowOpacity: undefined } : null),
        ...(shadowRadius != null ? { shadowRadius: undefined } : null),
        ...(shadowOffset != null ? { shadowOffset: undefined } : null),
        ...(elevation != null ? { elevation: undefined } : null),
      },
    ],
    [
      containerStyle,
      calculatedPadding,
      boxShadow,
      shadowColor,
      shadowOpacity,
      shadowRadius,
      shadowOffset,
      elevation,
    ]
  );

  return {
    nativeProps,
    contentStyle,
    restProps,
  };
};

const colorToRgbaString = (color: ColorValue | undefined, opacity?: number) => {
  if (color == null) return undefined;
  const processed = processColor(color);
  if (processed == null) return undefined;
  const argb = (processed as number) >>> 0;
  const a = (argb >>> 24) & 0xff;
  const r = (argb >>> 16) & 0xff;
  const g = (argb >>> 8) & 0xff;
  const b = argb & 0xff;
  const baseAlpha = a / 255;
  const finalAlpha =
    typeof opacity === 'number'
      ? Math.max(0, Math.min(1, baseAlpha * opacity))
      : Math.max(0, Math.min(1, baseAlpha));
  return `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});
