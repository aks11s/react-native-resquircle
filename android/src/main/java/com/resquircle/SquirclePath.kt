package com.resquircle

import android.graphics.Path
import android.graphics.RectF
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

data class CurveProperties(
  var a: Float,
  var b: Float,
  var c: Float,
  var d: Float,
  var p: Float,
  var arcSectionLength: Float,
  var cornerRadius: Float,
)

class SquirclePath(
  private var width: Float,
  private var height: Float,
  private var topLeftRadius: Float,
  private var topRightRadius: Float,
  private var bottomRightRadius: Float,
  private var bottomLeftRadius: Float,
  private var cornerSmoothing: Float,
) : Path() {

  init {
    val checkedCornerSmoothing = maxOf(minOf(this.cornerSmoothing, 1f), 0f)

    if (width <= 0f || height <= 0f) {
      addRect(0f, 0f, width, height, Direction.CW)
    } else {
      val budget = min(this.width, this.height) / 2f

      fun checkedRadius(r: Float): Float = minOf(maxOf(r, 0f), budget)

      val cpTL = calculateCurveProperties(checkedRadius(topLeftRadius), checkedCornerSmoothing, budget)
      val cpTR = calculateCurveProperties(checkedRadius(topRightRadius), checkedCornerSmoothing, budget)
      val cpBR =
        calculateCurveProperties(checkedRadius(bottomRightRadius), checkedCornerSmoothing, budget)
      val cpBL = calculateCurveProperties(checkedRadius(bottomLeftRadius), checkedCornerSmoothing, budget)

      buildPath(this.width, this.height, cpTL, cpTR, cpBR, cpBL)
    }
  }

  private fun buildPath(
    width: Float,
    height: Float,
    cpTL: CurveProperties,
    cpTR: CurveProperties,
    cpBR: CurveProperties,
    cpBL: CurveProperties,
  ) {
    var x = width - cpTR.p
    var y = 0f
    moveTo(x, y)

    fun relCubic(c1x: Float, c1y: Float, c2x: Float, c2y: Float, dx: Float, dy: Float) {
      rCubicTo(c1x, c1y, c2x, c2y, dx, dy)
      x += dx
      y += dy
    }

    fun arcToRelative(deltaX: Float, deltaY: Float, centerX: Float, centerY: Float, radius: Float) {
      val endX = x + deltaX
      val endY = y + deltaY

      val startAngle =
        Math.toDegrees(kotlin.math.atan2((y - centerY), (x - centerX)).toDouble()).toFloat()
      val endAngle =
        Math.toDegrees(kotlin.math.atan2((endY - centerY), (endX - centerX)).toDouble()).toFloat()

      var sweep = endAngle - startAngle
      if (sweep < 0f) sweep += 360f

      val oval = RectF(centerX - radius, centerY - radius, centerX + radius, centerY + radius)
      arcTo(oval, startAngle, sweep, false)

      x = endX
      y = endY
    }

    // Top-right corner
    if (cpTR.cornerRadius > 0f && cpTR.p > 0f) {
      relCubic(cpTR.a, 0f, cpTR.a + cpTR.b, 0f, cpTR.a + cpTR.b + cpTR.c, cpTR.d)
      arcToRelative(
        cpTR.arcSectionLength,
        cpTR.arcSectionLength,
        width - cpTR.cornerRadius,
        cpTR.cornerRadius,
        cpTR.cornerRadius
      )
      relCubic(cpTR.d, cpTR.c, cpTR.d, cpTR.c + cpTR.d, cpTR.d, cpTR.a + cpTR.b + cpTR.c)
    } else {
      x = width
      y = 0f
      lineTo(x, y)
    }

    // Right edge
    x = width
    y = height - cpBR.p
    lineTo(x, y)

    // Bottom-right corner
    if (cpBR.cornerRadius > 0f && cpBR.p > 0f) {
      relCubic(0f, cpBR.a, 0f, cpBR.a + cpBR.b, -cpBR.d, cpBR.a + cpBR.b + cpBR.c)
      arcToRelative(
        -cpBR.arcSectionLength,
        cpBR.arcSectionLength,
        width - cpBR.cornerRadius,
        height - cpBR.cornerRadius,
        cpBR.cornerRadius
      )
      relCubic(-cpBR.c, cpBR.d, -(cpBR.b + cpBR.c), cpBR.d, -(cpBR.a + cpBR.b + cpBR.c), cpBR.d)
    } else {
      x = width
      y = height
      lineTo(x, y)
    }

    // Bottom edge
    x = cpBL.p
    y = height
    lineTo(x, y)

    // Bottom-left corner
    if (cpBL.cornerRadius > 0f && cpBL.p > 0f) {
      relCubic(-cpBL.a, 0f, -(cpBL.a + cpBL.b), 0f, -(cpBL.a + cpBL.b + cpBL.c), -cpBL.d)
      arcToRelative(
        -cpBL.arcSectionLength,
        -cpBL.arcSectionLength,
        cpBL.cornerRadius,
        height - cpBL.cornerRadius,
        cpBL.cornerRadius
      )
      relCubic(-cpBL.d, -cpBL.c, -cpBL.d, -(cpBL.b + cpBL.c), -cpBL.d, -(cpBL.a + cpBL.b + cpBL.c))
    } else {
      x = 0f
      y = height
      lineTo(x, y)
    }

    // Left edge
    x = 0f
    y = cpTL.p
    lineTo(x, y)

    // Top-left corner
    if (cpTL.cornerRadius > 0f && cpTL.p > 0f) {
      relCubic(0f, -cpTL.a, 0f, -(cpTL.a + cpTL.b), cpTL.d, -(cpTL.a + cpTL.b + cpTL.c))
      arcToRelative(
        cpTL.arcSectionLength,
        -cpTL.arcSectionLength,
        cpTL.cornerRadius,
        cpTL.cornerRadius,
        cpTL.cornerRadius
      )
      relCubic(cpTL.c, -cpTL.d, cpTL.b + cpTL.c, -cpTL.d, cpTL.a + cpTL.b + cpTL.c, -cpTL.d)
    } else {
      x = 0f
      y = 0f
      lineTo(x, y)
    }

    close()
  }

  private fun calculateCurveProperties(
    cornerRadius: Float,
    cornerSmoothing: Float,
    roundingAndSmoothingBudget: Float,
  ): CurveProperties {
    if (cornerRadius <= 0f) {
      return CurveProperties(0f, 0f, 0f, 0f, 0f, 0f, 0f)
    }

    val maxCornerSmoothing = (roundingAndSmoothingBudget / cornerRadius) - 1f
    val effectiveSmoothing = minOf(cornerSmoothing, maxCornerSmoothing).coerceAtLeast(0f)

    val p = minOf((1 + effectiveSmoothing) * cornerRadius, roundingAndSmoothingBudget)

    val arcMeasure = 90 * (1 - effectiveSmoothing)
    val arcSectionLength = sin(toRadians(arcMeasure / 2)) * cornerRadius * sqrt(2f)
    val angleAlpha = (90 - arcMeasure) / 2
    val p3ToP4Distance = cornerRadius * tan(toRadians(angleAlpha / 2))
    val angleBeta = 45 * effectiveSmoothing
    val c = p3ToP4Distance * cos(toRadians(angleBeta))
    val d = c * tan(toRadians(angleBeta))
    val b = (p - arcSectionLength - c - d) / 3
    val a = 2 * b

    return CurveProperties(a, b, c, d, p, arcSectionLength, cornerRadius)
  }

  private fun toRadians(degrees: Float): Float {
    return degrees * (Math.PI.toFloat() / 180f)
  }
}

