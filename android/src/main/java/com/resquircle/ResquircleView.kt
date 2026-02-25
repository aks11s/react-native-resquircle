package com.resquircle

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.ceil
import kotlin.math.roundToInt

private data class ShadowKey(
  val widthPx: Int,
  val heightPx: Int,
  val cornerSmoothingBits: Int,
  val topLeftRadiusBits: Int,
  val topRightRadiusBits: Int,
  val bottomRightRadiusBits: Int,
  val bottomLeftRadiusBits: Int,
  val borderWidthPxBits: Int,
  val specs: List<ShadowSpecKey>,
)

private data class ShadowSpecKey(
  val dxBits: Int,
  val dyBits: Int,
  val blurBits: Int,
  val spreadBits: Int,
  val colorInt: Int,
)

private data class CornerRadiiPx(
  val topLeft: Float,
  val topRight: Float,
  val bottomRight: Float,
  val bottomLeft: Float,
)

class ResquircleView(context: Context) : ReactViewGroup(context) {
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val borderPaint = Paint(paint)
  private val outlinePaint = Paint(paint)
  private val path = Path() // fill/border path
  private val clipPath = Path() // inner clip for children
  private val outlinePath = Path()
  private var shadowSpecs: List<ShadowSpec> = emptyList()
  private val shadowRenders: MutableList<ShadowRender> = mutableListOf()
  private val gpuShadowRenders: MutableList<GpuShadowRender> = mutableListOf()
  private var lastShadowKey: ShadowKey? = null
  private val shadowMaskPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val shadowDrawPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    isFilterBitmap = true
  }
  private val maxShadowLayers = Int.MAX_VALUE
  private val tempMatrix = Matrix()
  private val tempPath = Path()
  private val tempClipPath = Path()
  private val gpuShadowPaint = Paint(Paint.ANTI_ALIAS_FLAG)

  private var cornerSmoothing = 1.0f
  private var borderColor = 0xFF000000.toInt()
  private var borderWidth = 0f // dp
  private var backgroundColorInt = 0x00000000
  private var borderRadius = 0f // px
  private var topLeftRadius = 0f // px
  private var topRightRadius = 0f // px
  private var bottomRightRadius = 0f // px
  private var bottomLeftRadius = 0f // px
  private var hasPerCornerRadii = false
  private var boxShadowString: String? = null
  private var clipContent: Boolean = false
  private var outlineColor = 0x00000000
  private var outlineWidth = 0f // dp
  private var outlineOffset = 0f // dp
  private var outlineStyle: String = "solid"

  init {
    paint.color = backgroundColorInt
    paint.style = Paint.Style.FILL
    paint.isDither = true

    borderPaint.isDither = true
    borderPaint.strokeJoin = Paint.Join.ROUND
    borderPaint.strokeCap = Paint.Cap.ROUND

    outlinePaint.isDither = true
    outlinePaint.style = Paint.Style.STROKE
    outlinePaint.strokeJoin = Paint.Join.ROUND
    outlinePaint.strokeCap = Paint.Cap.ROUND
    setWillNotDraw(false)
  }

  private data class ShadowRender(
    val bitmap: Bitmap,
    val drawX: Float,
    val drawY: Float,
    val colorInt: Int,
  )

  private data class GpuShadowRender(
    val node: RenderNode,
    val drawX: Float,
    val drawY: Float,
    val scaleUp: Float,
  )

  override fun dispatchDraw(canvas: Canvas) {
    if (!clipContent) {
      super.dispatchDraw(canvas)
      return
    }

    val checkpoint = canvas.save()
    canvas.clipPath(clipPath)
    super.dispatchDraw(canvas)
    canvas.restoreToCount(checkpoint)
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)

    // Draw shadows behind fill/border (can extend beyond bounds).
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      if (gpuShadowRenders.isNotEmpty()) {
        for (render in gpuShadowRenders) {
          canvas.save()
          if (render.scaleUp != 1f) {
            canvas.translate(render.drawX / render.scaleUp, render.drawY / render.scaleUp)
            canvas.scale(render.scaleUp, render.scaleUp)
          } else {
            canvas.translate(render.drawX, render.drawY)
          }
          canvas.drawRenderNode(render.node)
          canvas.restore()
        }
      }
    } else {
      // GPU-only mode: no shadow rendering on < API 31.
      for (render in shadowRenders) {
        shadowDrawPaint.color = render.colorInt
        canvas.drawBitmap(render.bitmap, render.drawX, render.drawY, shadowDrawPaint)
      }
    }

    paint.color = backgroundColorInt
    canvas.drawPath(path, paint)

    if (borderWidth > 0) {
      borderPaint.color = borderColor
      borderPaint.style = Paint.Style.STROKE
      borderPaint.strokeWidth = Utils.convertDpToPixel(borderWidth, context)
      canvas.drawPath(path, borderPaint)
    }

    val outlineWidthPx = Utils.convertDpToPixel(outlineWidth, context)
    if (outlineWidthPx > 0f && Color.alpha(outlineColor) > 0) {
      outlinePaint.color = outlineColor
      outlinePaint.strokeWidth = outlineWidthPx
      outlinePaint.pathEffect =
        when (outlineStyle) {
          "dashed" -> DashPathEffect(floatArrayOf(3f * outlineWidthPx, 2f * outlineWidthPx), 0f)
          "dotted" -> DashPathEffect(floatArrayOf(outlineWidthPx, 2f * outlineWidthPx), 0f)
          else -> null
        }
      canvas.drawPath(outlinePath, outlinePaint)
    }
  }

  override fun onSizeChanged(newWidth: Int, newHeight: Int, oldWidth: Int, oldHeight: Int) {
    super.onSizeChanged(newWidth, newHeight, oldWidth, oldHeight)
    if (newWidth == oldWidth && newHeight == oldHeight) return
    resetPaths(newWidth.toFloat(), newHeight.toFloat())
  }

  private fun resetPaths(width: Float, height: Float) {
    if (width == 0f || height == 0f) return

    val pixelBorderWidth = Utils.convertDpToPixel(this.borderWidth, context)
    val r = effectiveCornerRadiiPx()
    val baseRadii =
      CornerRadiiPx(
        topLeft = r.topLeft + (pixelBorderWidth / 2f),
        topRight = r.topRight + (pixelBorderWidth / 2f),
        bottomRight = r.bottomRight + (pixelBorderWidth / 2f),
        bottomLeft = r.bottomLeft + (pixelBorderWidth / 2f),
      )

    updateShadowsIfNeeded(width, height, pixelBorderWidth, baseRadii)

    val squirclePath =
      SquirclePath(
        width - pixelBorderWidth,
        height - pixelBorderWidth,
        r.topLeft,
        r.topRight,
        r.bottomRight,
        r.bottomLeft,
        cornerSmoothing,
      )

    val shiftX = pixelBorderWidth / 2f
    val shiftY = pixelBorderWidth / 2f
    tempMatrix.reset()
    tempMatrix.setTranslate(shiftX, shiftY)
    tempPath.reset()
    squirclePath.transform(tempMatrix, tempPath)

    path.reset()
    path.addPath(tempPath)

    // Clip children to the inner edge of the border stroke.
    val innerInset = pixelBorderWidth
    val innerW = (width - 2f * innerInset).coerceAtLeast(0f)
    val innerH = (height - 2f * innerInset).coerceAtLeast(0f)
    val innerRadii =
      CornerRadiiPx(
        topLeft = (r.topLeft - pixelBorderWidth).coerceAtLeast(0f),
        topRight = (r.topRight - pixelBorderWidth).coerceAtLeast(0f),
        bottomRight = (r.bottomRight - pixelBorderWidth).coerceAtLeast(0f),
        bottomLeft = (r.bottomLeft - pixelBorderWidth).coerceAtLeast(0f),
      )
    val innerSquircle =
      SquirclePath(
        innerW,
        innerH,
        innerRadii.topLeft,
        innerRadii.topRight,
        innerRadii.bottomRight,
        innerRadii.bottomLeft,
        cornerSmoothing
      )
    tempMatrix.reset()
    tempMatrix.setTranslate(innerInset, innerInset)
    tempClipPath.reset()
    innerSquircle.transform(tempMatrix, tempClipPath)
    clipPath.reset()
    clipPath.addPath(tempClipPath)

    // Outline (outside border).
    outlinePath.reset()
    val outlineWidthPx = Utils.convertDpToPixel(outlineWidth, context)
    val outlineOffsetPx = Utils.convertDpToPixel(outlineOffset, context)
    if (outlineWidthPx > 0f && Color.alpha(outlineColor) > 0) {
      val outset = (pixelBorderWidth / 2f) + outlineOffsetPx + (outlineWidthPx / 2f)
      val outlineSquircle =
        SquirclePath(
          width + 2f * outset,
          height + 2f * outset,
          r.topLeft + outset,
          r.topRight + outset,
          r.bottomRight + outset,
          r.bottomLeft + outset,
          cornerSmoothing
        )
      tempMatrix.reset()
      tempMatrix.setTranslate(-outset, -outset)
      tempPath.reset()
      outlineSquircle.transform(tempMatrix, tempPath)
      outlinePath.addPath(tempPath)
    }
  }

  private fun effectiveCornerRadiiPx(): CornerRadiiPx {
    if (!hasPerCornerRadii) {
      val r = borderRadius
      return CornerRadiiPx(r, r, r, r)
    }
    return CornerRadiiPx(topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius)
  }

  private fun clearShadowRenders() {
    for (r in shadowRenders) {
      if (!r.bitmap.isRecycled) r.bitmap.recycle()
    }
    shadowRenders.clear()
    lastShadowKey = null
  }

  private fun clearGpuShadowRenders() {
    gpuShadowRenders.clear()
  }

  private fun updateShadowsIfNeeded(
    width: Float,
    height: Float,
    pixelBorderWidth: Float,
    baseRadii: CornerRadiiPx,
  ) {
    if (width <= 0f || height <= 0f) return
    if (shadowSpecs.isEmpty()) {
      if (shadowRenders.isNotEmpty()) clearShadowRenders()
      if (gpuShadowRenders.isNotEmpty()) clearGpuShadowRenders()
      return
    }

    val keySpecs =
      shadowSpecs.take(maxShadowLayers).map {
        ShadowSpecKey(
          dxBits = it.dxPx.toRawBits(),
          dyBits = it.dyPx.toRawBits(),
          blurBits = it.blurPx.toRawBits(),
          spreadBits = it.spreadPx.toRawBits(),
          colorInt = it.colorInt,
        )
      }

    val key =
      ShadowKey(
        widthPx = width.roundToInt(),
        heightPx = height.roundToInt(),
        cornerSmoothingBits = cornerSmoothing.toRawBits(),
        topLeftRadiusBits = baseRadii.topLeft.toRawBits(),
        topRightRadiusBits = baseRadii.topRight.toRawBits(),
        bottomRightRadiusBits = baseRadii.bottomRight.toRawBits(),
        bottomLeftRadiusBits = baseRadii.bottomLeft.toRawBits(),
        borderWidthPxBits = pixelBorderWidth.toRawBits(),
        specs = keySpecs,
      )

    if (key == lastShadowKey) return
    lastShadowKey = key
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      rebuildGpuShadowNodes(width, height, baseRadii, shadowSpecs.take(maxShadowLayers))
      clearShadowRenders()
    } else {
      clearGpuShadowRenders()
      rebuildShadowBitmaps(width, height, baseRadii)
    }
  }

  private fun rebuildShadowBitmaps(width: Float, height: Float, baseRadii: CornerRadiiPx) {
    if (shadowSpecs.isEmpty()) return

    val old = shadowRenders.toList()
    shadowRenders.clear()

    // Reuse a single Canvas instance to avoid allocations.
    val bitmapCanvas = Canvas()

    shadowSpecs.forEachIndexed { index, spec ->
        val spread = spec.spreadPx
        val blur = spec.blurPx

        // Padding around the content to fit blur + spread.
        val pad = ceil((kotlin.math.abs(spread) + blur).toDouble()).toInt() + 2

        val innerW = (width + 2f * spread).coerceAtLeast(0f)
        val innerH = (height + 2f * spread).coerceAtLeast(0f)
        val radii =
          CornerRadiiPx(
            topLeft = (baseRadii.topLeft + spread).coerceAtLeast(0f),
            topRight = (baseRadii.topRight + spread).coerceAtLeast(0f),
            bottomRight = (baseRadii.bottomRight + spread).coerceAtLeast(0f),
            bottomLeft = (baseRadii.bottomLeft + spread).coerceAtLeast(0f),
          )

        val bmpW = (width + 2f * pad).roundToInt().coerceAtLeast(1)
        val bmpH = (height + 2f * pad).roundToInt().coerceAtLeast(1)

        val reused = old.getOrNull(index)?.bitmap
        val bitmap =
          if (reused != null &&
            !reused.isRecycled &&
            reused.width == bmpW &&
            reused.height == bmpH &&
            reused.config == Bitmap.Config.ALPHA_8
          ) {
            reused.eraseColor(Color.TRANSPARENT)
            reused
          } else {
            // Recycle old slot bitmap (if any) before replacing.
            if (reused != null && !reused.isRecycled) reused.recycle()
            try {
              Bitmap.createBitmap(bmpW, bmpH, Bitmap.Config.ALPHA_8)
            } catch (_: Throwable) {
              return@forEachIndexed
            }
          }

        bitmapCanvas.setBitmap(bitmap)

        // Draw an alpha mask (white) with blur. Color is applied at draw time.
        shadowMaskPaint.reset()
        shadowMaskPaint.isAntiAlias = true
        shadowMaskPaint.isDither = true
        shadowMaskPaint.style = Paint.Style.FILL
        shadowMaskPaint.color = Color.WHITE
        shadowMaskPaint.alpha = 0xFF
        shadowMaskPaint.maskFilter =
          if (blur > 0f) BlurMaskFilter(blur, BlurMaskFilter.Blur.NORMAL) else null

        val squircle =
          SquirclePath(
            innerW,
            innerH,
            radii.topLeft,
            radii.topRight,
            radii.bottomRight,
            radii.bottomLeft,
            cornerSmoothing
          )
        val m = Matrix().apply { setTranslate((pad - spread), (pad - spread)) }
        val shadowPath = Path().apply { squircle.transform(m, this) }
        bitmapCanvas.drawPath(shadowPath, shadowMaskPaint)

        shadowRenders.add(
          ShadowRender(
            bitmap = bitmap,
            drawX = (-pad + spec.dxPx),
            drawY = (-pad + spec.dyPx),
            colorInt = spec.colorInt,
          )
        )
    }

    // Recycle any remaining old bitmaps that were not reused.
    for (i in shadowSpecs.size until old.size) {
      val b = old[i].bitmap
      if (!b.isRecycled) b.recycle()
    }
  }

  private fun rebuildGpuShadowNodes(
    width: Float,
    height: Float,
    baseRadii: CornerRadiiPx,
    effectiveSpecs: List<ShadowSpec>,
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    if (effectiveSpecs.isEmpty()) return

    val old = gpuShadowRenders.toList()
    gpuShadowRenders.clear()

    effectiveSpecs.forEachIndexed { index, spec ->
      val spread = spec.spreadPx
      val blur = spec.blurPx

      // Padding around the content to fit blur + spread.
      val pad = ceil((kotlin.math.abs(spread) + blur).toDouble()).toInt() + 2

      val innerW = (width + 2f * spread).coerceAtLeast(0f)
      val innerH = (height + 2f * spread).coerceAtLeast(0f)
      val radii =
        CornerRadiiPx(
          topLeft = (baseRadii.topLeft + spread).coerceAtLeast(0f),
          topRight = (baseRadii.topRight + spread).coerceAtLeast(0f),
          bottomRight = (baseRadii.bottomRight + spread).coerceAtLeast(0f),
          bottomLeft = (baseRadii.bottomLeft + spread).coerceAtLeast(0f),
        )

      val scaleUp = 1f
      val nodeW = (width + 2f * pad).roundToInt().coerceAtLeast(1)
      val nodeH = (height + 2f * pad).roundToInt().coerceAtLeast(1)

      val node =
        old.getOrNull(index)?.node ?: RenderNode("ResquircleShadow$index")
      node.setPosition(0, 0, nodeW, nodeH)

      val c = node.beginRecording(nodeW, nodeH)
      gpuShadowPaint.reset()
      gpuShadowPaint.isAntiAlias = true
      gpuShadowPaint.style = Paint.Style.FILL
      gpuShadowPaint.color = spec.colorInt

      val squircle =
        SquirclePath(
          innerW,
          innerH,
          radii.topLeft,
          radii.topRight,
          radii.bottomRight,
          radii.bottomLeft,
          cornerSmoothing
        )
      tempMatrix.reset()
      tempMatrix.setTranslate((pad - spread), (pad - spread))
      tempPath.reset()
      squircle.transform(tempMatrix, tempPath)
      c.drawPath(tempPath, gpuShadowPaint)

      node.endRecording()

      if (blur > 0f) {
        node.setRenderEffect(
          RenderEffect.createBlurEffect(blur, blur, Shader.TileMode.CLAMP)
        )
      } else {
        node.setRenderEffect(null)
      }

      gpuShadowRenders.add(
        GpuShadowRender(
          node = node,
          drawX = (-pad + spec.dxPx),
          drawY = (-pad + spec.dyPx),
          scaleUp = scaleUp,
        )
      )
    }

    // Release unused nodes from the previous frame list.
    for (i in effectiveSpecs.size until old.size) {
      val n = old[i].node
      n.setRenderEffect(null)
      n.setPosition(0, 0, 0, 0)
      n.discardDisplayList()
    }
  }

  // Intentionally no GPU clamping/area cutoff for maximum quality.

  override fun onDetachedFromWindow() {
    // Ensure we free native heap allocations held by Bitmaps.
    clearShadowRenders()
    clearGpuShadowRenders()
    super.onDetachedFromWindow()
  }

  fun setCornerSmoothing(c: Float) {
    if (c == cornerSmoothing) return
    cornerSmoothing = c
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setSquircleBorderRadius(b: Float) {
    val pixelRadius = Utils.convertDpToPixel(b, context)
    if (pixelRadius == borderRadius) return
    borderRadius = pixelRadius
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setSquircleTopLeftRadius(value: Float) {
    val px = Utils.convertDpToPixel(value, context)
    if (px == topLeftRadius && hasPerCornerRadii) return
    topLeftRadius = px
    hasPerCornerRadii = true
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setSquircleTopRightRadius(value: Float) {
    val px = Utils.convertDpToPixel(value, context)
    if (px == topRightRadius && hasPerCornerRadii) return
    topRightRadius = px
    hasPerCornerRadii = true
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setSquircleBottomRightRadius(value: Float) {
    val px = Utils.convertDpToPixel(value, context)
    if (px == bottomRightRadius && hasPerCornerRadii) return
    bottomRightRadius = px
    hasPerCornerRadii = true
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setSquircleBottomLeftRadius(value: Float) {
    val px = Utils.convertDpToPixel(value, context)
    if (px == bottomLeftRadius && hasPerCornerRadii) return
    bottomLeftRadius = px
    hasPerCornerRadii = true
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setViewBackgroundColor(color: Int) {
    backgroundColorInt = color
    paint.color = backgroundColorInt
    invalidate()
  }

  fun setBorderColor(color: Int) {
    if (color == borderColor) return
    borderColor = color
    invalidate()
  }

  fun setBorderWidth(width: Float) {
    if (width == borderWidth) return
    borderWidth = width
    resetPaths(this.width.toFloat(), this.height.toFloat())
    invalidate()
  }

  fun setSquircleBoxShadow(value: String?) {
    if (value == boxShadowString) return
    boxShadowString = value
    rebuildShadowSpecs()
    invalidate()
  }

  fun setClipContent(value: Boolean) {
    if (value == clipContent) return
    clipContent = value
    invalidate()
  }

  fun setSquircleOutlineColor(color: Int?) {
    val c = color ?: 0x00000000
    if (c == outlineColor) return
    outlineColor = c
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setSquircleOutlineWidth(value: Float) {
    if (value == outlineWidth) return
    outlineWidth = value
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setSquircleOutlineOffset(value: Float) {
    if (value == outlineOffset) return
    outlineOffset = value
    resetPaths(width.toFloat(), height.toFloat())
    invalidate()
  }

  fun setSquircleOutlineStyle(value: String?) {
    val v = value ?: "solid"
    if (v == outlineStyle) return
    outlineStyle = v
    invalidate()
  }

  private fun rebuildShadowSpecs() {
    val s = boxShadowString?.trim()
    if (s.isNullOrEmpty()) {
      shadowSpecs = emptyList()
      clearShadowRenders()
      return
    }

    shadowSpecs = parseBoxShadow(s)
    val w = width.toFloat()
    val h = height.toFloat()
    if (w > 0f && h > 0f) {
      val pixelBorderWidth = Utils.convertDpToPixel(this.borderWidth, context)
      val r = effectiveCornerRadiiPx()
      val baseRadii =
        CornerRadiiPx(
          topLeft = r.topLeft + (pixelBorderWidth / 2f),
          topRight = r.topRight + (pixelBorderWidth / 2f),
          bottomRight = r.bottomRight + (pixelBorderWidth / 2f),
          bottomLeft = r.bottomLeft + (pixelBorderWidth / 2f),
        )
      updateShadowsIfNeeded(w, h, pixelBorderWidth, baseRadii)
    }
  }

  private data class ShadowSpec(
    val dxPx: Float,
    val dyPx: Float,
    val blurPx: Float,
    val spreadPx: Float,
    val colorInt: Int,
  )

  private fun parseBoxShadow(input: String): List<ShadowSpec> {
    val parts = splitTopLevelCommas(input)
    val out = mutableListOf<ShadowSpec>()

    for (raw in parts) {
      val t = raw.trim()
      if (t.isEmpty()) continue

      val tokens = splitTopLevelWhitespace(t)
      if (tokens.size < 4) continue

      val xDp = parseLengthDp(tokens[0]) ?: 0f
      val yDp = parseLengthDp(tokens[1]) ?: 0f
      val blurDp = parseLengthDp(tokens[2]) ?: 0f

      val spreadDp: Float
      val colorTokenIndex: Int
      val maybeSpread = parseLengthDp(tokens[3])
      if (tokens.size >= 5 && maybeSpread != null) {
        spreadDp = maybeSpread
        colorTokenIndex = 4
      } else {
        spreadDp = 0f
        colorTokenIndex = 3
      }

      val colorToken = tokens.getOrNull(colorTokenIndex) ?: continue
      val colorInt = parseColor(colorToken) ?: continue

      out.add(
        ShadowSpec(
          dxPx = Utils.convertDpToPixel(xDp, context),
          dyPx = Utils.convertDpToPixel(yDp, context),
          blurPx = Utils.convertDpToPixel(blurDp, context),
          spreadPx = Utils.convertDpToPixel(spreadDp, context),
          colorInt = colorInt,
        )
      )
    }
    return out
  }

  private fun splitTopLevelCommas(s: String): List<String> {
    val out = mutableListOf<String>()
    val current = StringBuilder()
    var depth = 0
    for (ch in s) {
      if (ch == '(') depth += 1
      if (ch == ')') depth = maxOf(0, depth - 1)
      if (ch == ',' && depth == 0) {
        out.add(current.toString())
        current.setLength(0)
      } else {
        current.append(ch)
      }
    }
    if (current.isNotEmpty()) out.add(current.toString())
    return out
  }

  private fun splitTopLevelWhitespace(s: String): List<String> {
    val out = mutableListOf<String>()
    val current = StringBuilder()
    var depth = 0

    fun flush() {
      val t = current.toString().trim()
      if (t.isNotEmpty()) out.add(t)
      current.setLength(0)
    }

    for (ch in s) {
      if (ch == '(') depth += 1
      if (ch == ')') depth = maxOf(0, depth - 1)
      if (depth == 0 && ch.isWhitespace()) {
        flush()
      } else {
        current.append(ch)
      }
    }
    flush()
    return out
  }

  private fun parseLengthDp(token: String): Float? {
    val t = token.trim().removeSuffix("px")
    return t.toFloatOrNull()
  }

  private fun parseColor(token: String): Int? {
    val t = token.trim()
    if (t.startsWith("rgba(") && t.endsWith(")")) {
      val inner = t.substring(5, t.length - 1)
      val parts = inner.split(",").map { it.trim() }
      if (parts.size != 4) return null
      val r = parts[0].toFloatOrNull() ?: return null
      val g = parts[1].toFloatOrNull() ?: return null
      val b = parts[2].toFloatOrNull() ?: return null
      val a = parts[3].toFloatOrNull() ?: return null
      val alpha = (a.coerceIn(0f, 1f) * 255f).roundToInt()
      return Color.argb(
        alpha,
        r.roundToInt().coerceIn(0, 255),
        g.roundToInt().coerceIn(0, 255),
        b.roundToInt().coerceIn(0, 255)
      )
    }
    if (t.startsWith("rgb(") && t.endsWith(")")) {
      val inner = t.substring(4, t.length - 1)
      val parts = inner.split(",").map { it.trim() }
      if (parts.size != 3) return null
      val r = parts[0].toFloatOrNull() ?: return null
      val g = parts[1].toFloatOrNull() ?: return null
      val b = parts[2].toFloatOrNull() ?: return null
      return Color.rgb(
        r.roundToInt().coerceIn(0, 255),
        g.roundToInt().coerceIn(0, 255),
        b.roundToInt().coerceIn(0, 255)
      )
    }
    if (t.startsWith("#")) {
      val hex = t.drop(1)
      if (hex.length == 8) {
        val rr = hex.substring(0, 2)
        val gg = hex.substring(2, 4)
        val bb = hex.substring(4, 6)
        val aa = hex.substring(6, 8)
        return try {
          Color.parseColor("#$aa$rr$gg$bb")
        } catch (_: Throwable) {
          null
        }
      }
      return try {
        Color.parseColor(t)
      } catch (_: Throwable) {
        null
      }
    }
    return null
  }
}
