/*
 * Copyright (c) 2006-2013, JGraph Ltd
 *
 * Defines the startup sequence of the application.
 */
//{
/**
 * Constructs a new application (returns an mxEditor instance)
 */

import * as m from "../../../dist/mxgraph.es.js";

export function createEditor(config) {
  var editor = null;

  var hideSplash = function () {
    // Fades-out the splash screen
    var splash = document.getElementById("splash");

    if (splash != null) {
      try {
        m.mxEvent.release(splash);
        m.mxEffects.fadeOut(splash, 100, true);
      } catch (e) {
        splash.parentNode.removeChild(splash);
      }
    }
  };

  try {
    if (!m.mxClient.isBrowserSupported()) {
      m.mxUtils.error("Browser is not supported!", 200, false);
    } else {
      m.mxObjectCodec.allowEval = true;
      var node = m.mxUtils.load(config).getDocumentElement();
      //var node = m.mxUtils.load(config);
      editor = new m.mxEditor(node);
      m.mxObjectCodec.allowEval = false;

      // Adds active border for panning inside the container
      editor.graph.createPanningManager = function () {
        var pm = new m.mxPanningManager(this);
        pm.border = 30;

        return pm;
      };

      editor.graph.allowAutoPanning = true;
      editor.graph.timerAutoScroll = true;

      // Updates the window title after opening new files
      var title = document.title;
      var funct = function (sender) {
        document.title = title + " - " + sender.getTitle();
      };

      editor.addListener(m.mxEvent.OPEN, funct);

      // Prints the current root in the window title if the
      // current root of the graph changes (drilling).
      editor.addListener(m.mxEvent.ROOT, funct);
      funct(editor);

      // Displays version in statusbar
      editor.setStatus("mxGraph " + m.mxClient.VERSION);

      // Shows the application
      hideSplash();
    }
  } catch (e) {
    hideSplash();

    // Shows an error message if the editor cannot start
    m.mxUtils.alert("Cannot start application: " + e.message);
    //throw e; // for debugging
  }

  return editor;
}
//}
