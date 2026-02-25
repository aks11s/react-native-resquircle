//
//  SquirclePath.swift
//  Ported from expo-squircle-view (MIT)
//

import UIKit

struct CurveProperties {
  var a: CGFloat
  var b: CGFloat
  var c: CGFloat
  var d: CGFloat
  var p: CGFloat
  var arcSectionLength: CGFloat
  var cornerRadius: CGFloat
}

struct SquirclePath {
  static func create(
    width: CGFloat,
    height: CGFloat,
    radius: CGFloat,
    cornerSmoothing: CGFloat
  ) -> CGPath {
    if width <= 0 || height <= 0 {
      return CGPath(rect: .zero, transform: nil)
    }

    let checkedRadius = min(radius, width / 2, height / 2)
    let checkedCornerSmoothing = max(min(cornerSmoothing, 1), 0)

    let curveProperties = calculateCurveProperties(
      cornerRadius: checkedRadius,
      cornerSmoothing: checkedCornerSmoothing,
      roundingAndSmoothingBudget: min(width, height) / 2
    )

    return createPath(width: width, height: height, curveProperties: curveProperties)
  }

  static func create(
    width: CGFloat,
    height: CGFloat,
    topLeftRadius: CGFloat,
    topRightRadius: CGFloat,
    bottomRightRadius: CGFloat,
    bottomLeftRadius: CGFloat,
    cornerSmoothing: CGFloat
  ) -> CGPath {
    if width <= 0 || height <= 0 {
      return CGPath(rect: .zero, transform: nil)
    }

    let checkedCornerSmoothing = max(min(cornerSmoothing, 1), 0)
    let budget = min(width, height) / 2

    func checkedRadius(_ r: CGFloat) -> CGFloat {
      min(max(0, r), budget)
    }

    let cpTL = calculateCurveProperties(
      cornerRadius: checkedRadius(topLeftRadius),
      cornerSmoothing: checkedCornerSmoothing,
      roundingAndSmoothingBudget: budget
    )
    let cpTR = calculateCurveProperties(
      cornerRadius: checkedRadius(topRightRadius),
      cornerSmoothing: checkedCornerSmoothing,
      roundingAndSmoothingBudget: budget
    )
    let cpBR = calculateCurveProperties(
      cornerRadius: checkedRadius(bottomRightRadius),
      cornerSmoothing: checkedCornerSmoothing,
      roundingAndSmoothingBudget: budget
    )
    let cpBL = calculateCurveProperties(
      cornerRadius: checkedRadius(bottomLeftRadius),
      cornerSmoothing: checkedCornerSmoothing,
      roundingAndSmoothingBudget: budget
    )

    return createPath(
      width: width,
      height: height,
      topLeft: cpTL,
      topRight: cpTR,
      bottomRight: cpBR,
      bottomLeft: cpBL
    )
  }

  private static func createPath(
    width: CGFloat,
    height: CGFloat,
    curveProperties cp: CurveProperties
  ) -> CGPath {
    if cp.cornerRadius <= 0 {
      return CGPath(rect: CGRect(x: 0, y: 0, width: width, height: height), transform: nil)
    }

    let a = cp.a
    let b = cp.b
    let c = cp.c
    let d = cp.d
    let p = cp.p
    let arc = cp.arcSectionLength
    let r = cp.cornerRadius

    let topRightCenter = CGPoint(x: width - r, y: r)
    let bottomRightCenter = CGPoint(x: width - r, y: height - r)
    let bottomLeftCenter = CGPoint(x: r, y: height - r)
    let topLeftCenter = CGPoint(x: r, y: r)

    let path = UIBezierPath()

    var current = CGPoint(x: width - p, y: 0)
    path.move(to: current)

    // Top-right corner
    current = addRelativeCurve(
      path,
      from: current,
      c1: CGPoint(x: a, y: 0),
      c2: CGPoint(x: a + b, y: 0),
      end: CGPoint(x: a + b + c, y: d)
    )
    current = addArc(path, from: current, by: CGPoint(x: arc, y: arc), center: topRightCenter, radius: r)
    current = addRelativeCurve(
      path,
      from: current,
      c1: CGPoint(x: d, y: c),
      c2: CGPoint(x: d, y: c + d),
      end: CGPoint(x: d, y: a + b + c)
    )

    // Right edge
    current = CGPoint(x: width, y: height - p)
    path.addLine(to: current)

    // Bottom-right corner
    current = addRelativeCurve(
      path,
      from: current,
      c1: CGPoint(x: 0, y: a),
      c2: CGPoint(x: 0, y: a + b),
      end: CGPoint(x: -d, y: a + b + c)
    )
    current = addArc(path, from: current, by: CGPoint(x: -arc, y: arc), center: bottomRightCenter, radius: r)
    current = addRelativeCurve(
      path,
      from: current,
      c1: CGPoint(x: -c, y: d),
      c2: CGPoint(x: -(b + c), y: d),
      end: CGPoint(x: -(a + b + c), y: d)
    )

    // Bottom edge
    current = CGPoint(x: p, y: height)
    path.addLine(to: current)

    // Bottom-left corner
    current = addRelativeCurve(
      path,
      from: current,
      c1: CGPoint(x: -a, y: 0),
      c2: CGPoint(x: -(a + b), y: 0),
      end: CGPoint(x: -(a + b + c), y: -d)
    )
    current = addArc(path, from: current, by: CGPoint(x: -arc, y: -arc), center: bottomLeftCenter, radius: r)
    current = addRelativeCurve(
      path,
      from: current,
      c1: CGPoint(x: -d, y: -c),
      c2: CGPoint(x: -d, y: -(b + c)),
      end: CGPoint(x: -d, y: -(a + b + c))
    )

    // Left edge
    current = CGPoint(x: 0, y: p)
    path.addLine(to: current)

    // Top-left corner
    current = addRelativeCurve(
      path,
      from: current,
      c1: CGPoint(x: 0, y: -a),
      c2: CGPoint(x: 0, y: -(a + b)),
      end: CGPoint(x: d, y: -(a + b + c))
    )
    current = addArc(path, from: current, by: CGPoint(x: arc, y: -arc), center: topLeftCenter, radius: r)
    _ = addRelativeCurve(
      path,
      from: current,
      c1: CGPoint(x: c, y: -d),
      c2: CGPoint(x: b + c, y: -d),
      end: CGPoint(x: a + b + c, y: -d)
    )

    path.close()
    return path.cgPath
  }

  private static func createPath(
    width: CGFloat,
    height: CGFloat,
    topLeft cpTL: CurveProperties,
    topRight cpTR: CurveProperties,
    bottomRight cpBR: CurveProperties,
    bottomLeft cpBL: CurveProperties
  ) -> CGPath {
    let path = UIBezierPath()

    func isZero(_ cp: CurveProperties) -> Bool {
      cp.cornerRadius <= 0 || cp.p <= 0
    }

    // Start at top-right.
    var current = CGPoint(x: width - cpTR.p, y: 0)
    path.move(to: current)

    // Top-right corner
    if !isZero(cpTR) {
      current = addRelativeCurve(
        path,
        from: current,
        c1: CGPoint(x: cpTR.a, y: 0),
        c2: CGPoint(x: cpTR.a + cpTR.b, y: 0),
        end: CGPoint(x: cpTR.a + cpTR.b + cpTR.c, y: cpTR.d)
      )
      let center = CGPoint(x: width - cpTR.cornerRadius, y: cpTR.cornerRadius)
      current = addArc(
        path,
        from: current,
        by: CGPoint(x: cpTR.arcSectionLength, y: cpTR.arcSectionLength),
        center: center,
        radius: cpTR.cornerRadius
      )
      current = addRelativeCurve(
        path,
        from: current,
        c1: CGPoint(x: cpTR.d, y: cpTR.c),
        c2: CGPoint(x: cpTR.d, y: cpTR.c + cpTR.d),
        end: CGPoint(x: cpTR.d, y: cpTR.a + cpTR.b + cpTR.c)
      )
    } else {
      current = CGPoint(x: width, y: 0)
      path.addLine(to: current)
    }

    // Right edge
    current = CGPoint(x: width, y: height - cpBR.p)
    path.addLine(to: current)

    // Bottom-right corner
    if !isZero(cpBR) {
      current = addRelativeCurve(
        path,
        from: current,
        c1: CGPoint(x: 0, y: cpBR.a),
        c2: CGPoint(x: 0, y: cpBR.a + cpBR.b),
        end: CGPoint(x: -cpBR.d, y: cpBR.a + cpBR.b + cpBR.c)
      )
      let center = CGPoint(x: width - cpBR.cornerRadius, y: height - cpBR.cornerRadius)
      current = addArc(
        path,
        from: current,
        by: CGPoint(x: -cpBR.arcSectionLength, y: cpBR.arcSectionLength),
        center: center,
        radius: cpBR.cornerRadius
      )
      current = addRelativeCurve(
        path,
        from: current,
        c1: CGPoint(x: -cpBR.c, y: cpBR.d),
        c2: CGPoint(x: -(cpBR.b + cpBR.c), y: cpBR.d),
        end: CGPoint(x: -(cpBR.a + cpBR.b + cpBR.c), y: cpBR.d)
      )
    } else {
      current = CGPoint(x: width, y: height)
      path.addLine(to: current)
    }

    // Bottom edge
    current = CGPoint(x: cpBL.p, y: height)
    path.addLine(to: current)

    // Bottom-left corner
    if !isZero(cpBL) {
      current = addRelativeCurve(
        path,
        from: current,
        c1: CGPoint(x: -cpBL.a, y: 0),
        c2: CGPoint(x: -(cpBL.a + cpBL.b), y: 0),
        end: CGPoint(x: -(cpBL.a + cpBL.b + cpBL.c), y: -cpBL.d)
      )
      let center = CGPoint(x: cpBL.cornerRadius, y: height - cpBL.cornerRadius)
      current = addArc(
        path,
        from: current,
        by: CGPoint(x: -cpBL.arcSectionLength, y: -cpBL.arcSectionLength),
        center: center,
        radius: cpBL.cornerRadius
      )
      current = addRelativeCurve(
        path,
        from: current,
        c1: CGPoint(x: -cpBL.d, y: -cpBL.c),
        c2: CGPoint(x: -cpBL.d, y: -(cpBL.b + cpBL.c)),
        end: CGPoint(x: -cpBL.d, y: -(cpBL.a + cpBL.b + cpBL.c))
      )
    } else {
      current = CGPoint(x: 0, y: height)
      path.addLine(to: current)
    }

    // Left edge
    current = CGPoint(x: 0, y: cpTL.p)
    path.addLine(to: current)

    // Top-left corner
    if !isZero(cpTL) {
      current = addRelativeCurve(
        path,
        from: current,
        c1: CGPoint(x: 0, y: -cpTL.a),
        c2: CGPoint(x: 0, y: -(cpTL.a + cpTL.b)),
        end: CGPoint(x: cpTL.d, y: -(cpTL.a + cpTL.b + cpTL.c))
      )
      let center = CGPoint(x: cpTL.cornerRadius, y: cpTL.cornerRadius)
      current = addArc(
        path,
        from: current,
        by: CGPoint(x: cpTL.arcSectionLength, y: -cpTL.arcSectionLength),
        center: center,
        radius: cpTL.cornerRadius
      )
      _ = addRelativeCurve(
        path,
        from: current,
        c1: CGPoint(x: cpTL.c, y: -cpTL.d),
        c2: CGPoint(x: cpTL.b + cpTL.c, y: -cpTL.d),
        end: CGPoint(x: cpTL.a + cpTL.b + cpTL.c, y: -cpTL.d)
      )
    } else {
      current = CGPoint(x: 0, y: 0)
      path.addLine(to: current)
    }

    path.close()
    return path.cgPath
  }

  private static func addRelativeCurve(
    _ path: UIBezierPath,
    from current: CGPoint,
    c1: CGPoint,
    c2: CGPoint,
    end: CGPoint
  ) -> CGPoint {
    let control1 = CGPoint(x: current.x + c1.x, y: current.y + c1.y)
    let control2 = CGPoint(x: current.x + c2.x, y: current.y + c2.y)
    let endPoint = CGPoint(x: current.x + end.x, y: current.y + end.y)
    path.addCurve(to: endPoint, controlPoint1: control1, controlPoint2: control2)
    return endPoint
  }

  private static func addArc(
    _ path: UIBezierPath,
    from current: CGPoint,
    by delta: CGPoint,
    center: CGPoint,
    radius: CGFloat
  ) -> CGPoint {
    let endPoint = CGPoint(x: current.x + delta.x, y: current.y + delta.y)
    let startAngle = atan2(current.y - center.y, current.x - center.x)
    let endAngle = atan2(endPoint.y - center.y, endPoint.x - center.x)
    path.addArc(withCenter: center, radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: true)
    return endPoint
  }

  static func calculateCurveProperties(
    cornerRadius: CGFloat,
    cornerSmoothing: CGFloat,
    roundingAndSmoothingBudget: CGFloat
  ) -> CurveProperties {
    var p = (1 + cornerSmoothing) * cornerRadius

    let arcMeasure = 90 * (1 - cornerSmoothing)
    let arcSectionLength = sin(toRadians(arcMeasure / 2)) * cornerRadius * sqrt(2)
    let angleAlpha = (90 - arcMeasure) / 2
    let p3ToP4Distance = cornerRadius * tan(toRadians(angleAlpha / 2))
    let angleBeta = 45 * cornerSmoothing
    let c = p3ToP4Distance * cos(toRadians(angleBeta))
    let d = c * tan(toRadians(angleBeta))
    var b = (p - arcSectionLength - c - d) / 3
    var a = 2 * b

    if p > roundingAndSmoothingBudget {
      let p1ToP3MaxDistance = roundingAndSmoothingBudget - d - arcSectionLength - c
      let minA = p1ToP3MaxDistance / 6
      let maxB = p1ToP3MaxDistance - minA
      b = min(b, maxB)
      a = p1ToP3MaxDistance - b
      p = min(p, roundingAndSmoothingBudget)
    }

    return CurveProperties(
      a: a,
      b: b,
      c: c,
      d: d,
      p: p,
      arcSectionLength: arcSectionLength,
      cornerRadius: cornerRadius
    )
  }

  static func toRadians(_ degrees: CGFloat) -> CGFloat {
    degrees * .pi / 180
  }
}

