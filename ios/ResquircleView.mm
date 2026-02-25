#import "ResquircleView.h"

#import <React/RCTConversions.h>
#import <React/RCTComponentViewProtocol.h>

#import <react/renderer/components/ResquircleViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/ResquircleViewSpec/Props.h>
#import <react/renderer/components/ResquircleViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

#if __has_include("Resquircle-Swift.h")
#import "Resquircle-Swift.h"
#endif

@implementation ResquircleView {
    ResquircleDrawingView * _contentView;
    ResquircleDrawingView * _shadowView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<ResquircleViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ResquircleViewProps>();
    _props = defaultProps;

    // Never clip at the root level: we want shadows to be able to render
    // outside bounds even when overflow="hidden" is used for content clipping.
    self.clipsToBounds = NO;
    self.layer.masksToBounds = NO;

    // Content view: hosts Fabric children + draws fill/border and applies clipping mask.
    _contentView = [[ResquircleDrawingView alloc] init];
    // Shadow view: draws shadows without being clipped by overflow.
    _shadowView = [[ResquircleDrawingView alloc] init];
    _shadowView.drawSquircleLayer = NO;
    _shadowView.clipContent = NO;

    self.contentView = _contentView;
    [self insertSubview:_shadowView belowSubview:self.contentView];
  }

  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _shadowView.frame = self.bounds;
  _contentView.frame = self.bounds;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<ResquircleViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<ResquircleViewProps const>(props);

    // Back-compat
    if (oldViewProps.color != newViewProps.color) {
        UIColor *c = RCTUIColorFromSharedColor(newViewProps.color);
        _contentView.squircleBackgroundColor = c;
        _shadowView.squircleBackgroundColor = c;
    }

    if (oldViewProps.squircleBackgroundColor != newViewProps.squircleBackgroundColor) {
        UIColor *c = RCTUIColorFromSharedColor(newViewProps.squircleBackgroundColor);
        _contentView.squircleBackgroundColor = c;
        _shadowView.squircleBackgroundColor = c;
    }

    if (oldViewProps.squircleBorderColor != newViewProps.squircleBorderColor) {
        UIColor *c = RCTUIColorFromSharedColor(newViewProps.squircleBorderColor);
        _contentView.squircleBorderColor = c;
        _shadowView.squircleBorderColor = c;
    }

    if (oldViewProps.squircleBorderWidth != newViewProps.squircleBorderWidth) {
        CGFloat w = newViewProps.squircleBorderWidth;
        _contentView.squircleBorderWidth = w;
        _shadowView.squircleBorderWidth = w;
    }

    if (oldViewProps.borderRadius != newViewProps.borderRadius) {
        CGFloat r = newViewProps.borderRadius;
        _contentView.borderRadius = r;
        _shadowView.borderRadius = r;
    }

    if (oldViewProps.squircleTopLeftRadius != newViewProps.squircleTopLeftRadius) {
        CGFloat r = newViewProps.squircleTopLeftRadius;
        _contentView.squircleTopLeftRadius = r;
        _shadowView.squircleTopLeftRadius = r;
    }

    if (oldViewProps.squircleTopRightRadius != newViewProps.squircleTopRightRadius) {
        CGFloat r = newViewProps.squircleTopRightRadius;
        _contentView.squircleTopRightRadius = r;
        _shadowView.squircleTopRightRadius = r;
    }

    if (oldViewProps.squircleBottomRightRadius != newViewProps.squircleBottomRightRadius) {
        CGFloat r = newViewProps.squircleBottomRightRadius;
        _contentView.squircleBottomRightRadius = r;
        _shadowView.squircleBottomRightRadius = r;
    }

    if (oldViewProps.squircleBottomLeftRadius != newViewProps.squircleBottomLeftRadius) {
        CGFloat r = newViewProps.squircleBottomLeftRadius;
        _contentView.squircleBottomLeftRadius = r;
        _shadowView.squircleBottomLeftRadius = r;
    }

    if (oldViewProps.cornerSmoothing != newViewProps.cornerSmoothing) {
        CGFloat s = newViewProps.cornerSmoothing;
        _contentView.cornerSmoothing = s;
        _shadowView.cornerSmoothing = s;
    }

    if (oldViewProps.squircleBoxShadow != newViewProps.squircleBoxShadow) {
        NSString *shadow = newViewProps.squircleBoxShadow.empty()
          ? nil
          : [NSString stringWithUTF8String:newViewProps.squircleBoxShadow.c_str()];
        // Shadows should stay visible even when content is clipped.
        _shadowView.squircleBoxShadow = shadow;
        _contentView.squircleBoxShadow = nil;
    }

    if (oldViewProps.clipContent != newViewProps.clipContent) {
        // Clip only content (and its children). Keep shadow un-clipped.
        _contentView.clipContent = newViewProps.clipContent;
        _shadowView.clipContent = NO;
    }

    [super updateProps:props oldProps:oldProps];
}

// MARK: - Child mounting (Fabric)
// Ensure children are mounted inside `_contentView` so they participate in squircle clipping.
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // Mount Fabric children inside the dedicated container that we clip (not the whole view),
  // so borders can stay on top and shadows can remain visible.
  [_contentView.reactContentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

@end
