package com.resquircle

import android.graphics.Color
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.ResquircleViewManagerInterface
import com.facebook.react.viewmanagers.ResquircleViewManagerDelegate
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

@ReactModule(name = ResquircleViewManager.NAME)
class ResquircleViewManager : ReactViewManager(),
  ResquircleViewManagerInterface<ResquircleView> {

  private val delegate: ViewManagerDelegate<ReactViewGroup>

  init {
    val specificDelegate = ResquircleViewManagerDelegate(ViewManagerWrapper(this))
    delegate = SplitDelegate(super.getDelegate(), specificDelegate)
  }

  override fun getName(): String {
    return NAME
  }

  override fun createViewInstance(context: ThemedReactContext): ResquircleView {
    return ResquircleView(context)
  }

  // Back-compat: old example prop.
  override fun setColor(view: ResquircleView?, color: Int?) {
    view?.setViewBackgroundColor(color ?: Color.TRANSPARENT)
  }

  override fun setSquircleBackgroundColor(view: ResquircleView?, color: Int?) {
    view?.setViewBackgroundColor(color ?: Color.TRANSPARENT)
  }

  override fun setSquircleBorderColor(view: ResquircleView?, color: Int?) {
    view?.setBorderColor(color ?: Color.TRANSPARENT)
  }

  override fun setSquircleBorderWidth(view: ResquircleView?, width: Float) {
    view?.setBorderWidth(width)
  }

  override fun setSquircleBoxShadow(view: ResquircleView?, boxShadow: String?) {
    view?.setSquircleBoxShadow(boxShadow)
  }

  override fun setBorderRadius(view: ResquircleView?, radius: Float) {
    view?.setSquircleBorderRadius(radius)
  }

  override fun setSquircleTopLeftRadius(view: ResquircleView?, value: Float) {
    view?.setSquircleTopLeftRadius(value)
  }

  override fun setSquircleTopRightRadius(view: ResquircleView?, value: Float) {
    view?.setSquircleTopRightRadius(value)
  }

  override fun setSquircleBottomRightRadius(view: ResquircleView?, value: Float) {
    view?.setSquircleBottomRightRadius(value)
  }

  override fun setSquircleBottomLeftRadius(view: ResquircleView?, value: Float) {
    view?.setSquircleBottomLeftRadius(value)
  }

  override fun setCornerSmoothing(view: ResquircleView?, smoothing: Float) {
    view?.setCornerSmoothing(smoothing)
  }

  override fun setClipContent(view: ResquircleView?, value: Boolean) {
    view?.setClipContent(value)
  }

  override fun getDelegate(): ViewManagerDelegate<ReactViewGroup> {
    return delegate
  }

  companion object {
    const val NAME = "ResquircleView"
  }
}

private class ViewManagerWrapper(private val baseVm: ResquircleViewManager) :
  SimpleViewManager<ResquircleView>(), ResquircleViewManagerInterface<ResquircleView> {
  override fun createViewInstance(reactContext: ThemedReactContext): ResquircleView {
    return baseVm.createViewInstance(reactContext)
  }

  override fun getName(): String {
    return baseVm.name
  }

  override fun setColor(view: ResquircleView?, value: Int?) = baseVm.setColor(view, value)
  override fun setSquircleBackgroundColor(view: ResquircleView?, value: Int?) =
    baseVm.setSquircleBackgroundColor(view, value)

  override fun setSquircleBorderColor(view: ResquircleView?, value: Int?) =
    baseVm.setSquircleBorderColor(view, value)

  override fun setSquircleBorderWidth(view: ResquircleView?, value: Float) =
    baseVm.setSquircleBorderWidth(view, value)

  override fun setBorderRadius(view: ResquircleView?, value: Float) = baseVm.setBorderRadius(view, value)
  override fun setSquircleTopLeftRadius(view: ResquircleView?, value: Float) =
    baseVm.setSquircleTopLeftRadius(view, value)

  override fun setSquircleTopRightRadius(view: ResquircleView?, value: Float) =
    baseVm.setSquircleTopRightRadius(view, value)

  override fun setSquircleBottomRightRadius(view: ResquircleView?, value: Float) =
    baseVm.setSquircleBottomRightRadius(view, value)

  override fun setSquircleBottomLeftRadius(view: ResquircleView?, value: Float) =
    baseVm.setSquircleBottomLeftRadius(view, value)

  override fun setCornerSmoothing(view: ResquircleView?, value: Float) =
    baseVm.setCornerSmoothing(view, value)

  override fun setSquircleBoxShadow(view: ResquircleView?, value: String?) =
    baseVm.setSquircleBoxShadow(view, value)

  override fun setClipContent(view: ResquircleView?, value: Boolean) = baseVm.setClipContent(view, value)
}

private class SplitDelegate(
  private val baseDelegate: ViewManagerDelegate<ReactViewGroup>,
  private val specificDelegate: ViewManagerDelegate<ResquircleView>
) : ViewManagerDelegate<ReactViewGroup> {

  override fun setProperty(view: ReactViewGroup, propName: String, value: Any?) {
    baseDelegate.setProperty(view, propName, value)
    if (view is ResquircleView) specificDelegate.setProperty(view, propName, value)
  }

  override fun receiveCommand(view: ReactViewGroup, commandName: String, args: ReadableArray?) {
    baseDelegate.receiveCommand(view, commandName, args)
    if (view is ResquircleView) specificDelegate.receiveCommand(view, commandName, args)
  }
}
