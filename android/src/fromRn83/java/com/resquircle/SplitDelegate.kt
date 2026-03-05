package com.resquircle

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.views.view.ReactViewGroup

/**
 * RN >= 0.83: ViewManagerDelegate uses ReadableArray (non-null args)
 */
internal class SplitDelegate(
  private val baseDelegate: ViewManagerDelegate<ReactViewGroup>,
  private val specificDelegate: ViewManagerDelegate<ResquircleView>
) : ViewManagerDelegate<ReactViewGroup> {

  override fun setProperty(view: ReactViewGroup, propName: String, value: Any?) {
    baseDelegate.setProperty(view, propName, value)
    if (view is ResquircleView) specificDelegate.setProperty(view, propName, value)
  }

  override fun receiveCommand(
    view: ReactViewGroup,
    commandName: String,
    args: ReadableArray
  ) {
    baseDelegate.receiveCommand(view, commandName, args)
    if (view is ResquircleView) specificDelegate.receiveCommand(view, commandName, args)
  }
}
