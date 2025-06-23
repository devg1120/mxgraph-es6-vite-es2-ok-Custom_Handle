import * as m from "../../dist/mxgraph.es.js";
import { createEditor } from "./js/app.js";

/*
window.onload = function () {
  createEditor("config/diagrameditor.xml");
};
*/

document.addEventListener("DOMContentLoaded", function () {
  createEditor("config/diagrameditor.xml");
  //let e = createEditor("config/diagrameditor.xml");
  //g_onInit(e);
});

var urlParams = (function (url) {
  var result = new Object();
  var params = window.location.search.slice(1).split("&");

  for (var i = 0; i < params.length; i++) {
    var idx = params[i].indexOf("=");

    if (idx > 0) {
      result[params[i].substring(0, idx)] = params[i].substring(idx + 1);
    }
  }

  return result;
})(window.location.href);

var mxLanguage = urlParams["lang"];

// Program starts here. The document.onLoad executes the
// createEditor function with a given configuration.
// In the config file, the mxEditor.onInit method is
// overridden to invoke this global function as the
// last step in the editor constructor.
//export function g_onInit(editor) {

globalThis.g_onInit = function (editor) {
  console.log("window:", window);

  // Enables rotation handle
  m.mxVertexHandler.prototype.rotationEnabled = true;

  // Enables guides
  m.mxGraphHandler.prototype.guidesEnabled = true;

  // Alt disables guides
  m.mxGuide.prototype.isEnabledForEvent = function (evt) {
    return !m.mxEvent.isAltDown(evt);
  };

  // Enables snapping waypoints to terminals
  m.mxEdgeHandler.prototype.snapToTerminals = true;

  // Defines an icon for creating new connections in the connection handler.
  // This will automatically disable the highlighting of the source vertex.

  m.mxConnectionHandler.prototype.connectImage = new m.mxImage(
    "images/connector.gif",
    16,
    16,
  );

  // Enables connections in the graph and disables
  // reset of zoom and translate on root change
  // (ie. switch between XML and graphical mode).
  editor.graph.setConnectable(true);

  // Clones the source if new connection has no target
  editor.graph.connectionHandler.setCreateTarget(true);

  // Updates the title if the root changes
  var title = document.getElementById("title");

  if (title != null) {
    var f = function (sender) {
      title.innerHTML = "mxDraw - " + sender.getTitle();
    };

    editor.addListener(m.mxEvent.ROOT, f);
    f(editor);
  }

  // Changes the zoom on mouseWheel events
  m.mxEvent.addMouseWheelListener(function (evt, up) {
    if (!m.mxEvent.isConsumed(evt)) {
      if (up) {
        editor.execute("zoomIn");
      } else {
        editor.execute("zoomOut");
      }

      m.mxEvent.consume(evt);
    }
  });

  // Defines a new action to switch between
  // XML and graphical display
  var textNode = document.getElementById("xml");
  var graphNode = editor.graph.container;
  var sourceInput = document.getElementById("source");
  sourceInput.checked = false;

  var funct = function (editor) {
    if (sourceInput.checked) {
      graphNode.style.display = "none";
      textNode.style.display = "inline";

      var enc = new m.mxCodec();
      var model = enc.encode(editor.graph.getModel());
      console.dir(model); //GS
      var node = enc.encode(editor.graph.getModel());  
      console.dir(node);  //GS

      textNode.value = m.mxUtils.getPrettyXml(node); // 重い
      console.log(textNode.value); //GS
      textNode.originalValue = textNode.value;
      textNode.focus();
    } else {
      graphNode.style.display = "";

      if (textNode.value != textNode.originalValue) {
        var doc = m.mxUtils.parseXml(textNode.value);
        var dec = new m.mxCodec(doc);
        dec.decode(doc.documentElement, editor.graph.getModel());
      }

      textNode.originalValue = null;

      // Makes sure nothing is selected in IE
      if (m.mxClient.IS_IE) {
        m.mxUtils.clearSelection();
      }

      textNode.style.display = "none";

      // Moves the focus back to the graph
      editor.graph.container.focus();
    }
  };

  editor.addAction("switchView", funct);

  // Defines a new action to switch between
  // XML and graphical display
  m.mxEvent.addListener(sourceInput, "click", function () {
    editor.execute("switchView");
  });

  // Create select actions in page
  var node = document.getElementById("mainActions");
  var buttons = [
    "group",
    "ungroup",
    "cut",
    "copy",
    "paste",
    "delete",
    "undo",
    "redo",
    "print",
    "show",
  ];

  // Only adds image and SVG export if backend is available
  // NOTE: The old image export in mxEditor is not used, the urlImage is used for the new export.

  if (editor.urlImage != null) {
    // Client-side code for image export
    var exportImage = function (editor) {
      var graph = editor.graph;
      var scale = graph.view.scale;
      var bounds = graph.getGraphBounds();

      // New image export
      var xmlDoc = m.mxUtils.createXmlDocument();
      var root = xmlDoc.createElement("output");
      xmlDoc.appendChild(root);

      // Renders graph. Offset will be multiplied with state's scale when painting state.
      var xmlCanvas = new m.mxXmlCanvas2D(root);
      xmlCanvas.translate(
        Math.floor(1 / scale - bounds.x),
        Math.floor(1 / scale - bounds.y),
      );
      xmlCanvas.scale(scale);

      var imgExport = new m.mxImageExport();
      imgExport.drawState(
        graph.getView().getState(graph.model.root),
        xmlCanvas,
      );

      // Puts request data together
      var w = Math.ceil(bounds.width * scale + 2);
      var h = Math.ceil(bounds.height * scale + 2);
      var xml = m.mxUtils.getXml(root);

      // Requests image if request is valid
      if (w > 0 && h > 0) {
        var name = "export.png";
        var format = "png";
        var bg = "&bg=#FFFFFF";

        new m.mxXmlRequest(
          editor.urlImage,
          "filename=" +
            name +
            "&format=" +
            format +
            bg +
            "&w=" +
            w +
            "&h=" +
            h +
            "&xml=" +
            encodeURIComponent(xml),
        ).simulate(document, "_blank");
      }
    };

    editor.addAction("exportImage", exportImage);

    // Client-side code for SVG export
    var exportSvg = function (editor) {
      var graph = editor.graph;
      var scale = graph.view.scale;
      var bounds = graph.getGraphBounds();

      // Prepares SVG document that holds the output
      var svgDoc = m.mxUtils.createXmlDocument();
      var root =
        svgDoc.createElementNS != null
          ? svgDoc.createElementNS(m.mxConstants.NS_SVG, "svg")
          : svgDoc.createElement("svg");

      if (root.style != null) {
        root.style.backgroundColor = "#FFFFFF";
      } else {
        root.setAttribute("style", "background-color:#FFFFFF");
      }

      if (svgDoc.createElementNS == null) {
        root.setAttribute("xmlns", m.mxConstants.NS_SVG);
      }

      root.setAttribute("width", Math.ceil(bounds.width * scale + 2) + "px");
      root.setAttribute("height", Math.ceil(bounds.height * scale + 2) + "px");
      root.setAttribute("xmlns:xlink", m.mxConstants.NS_XLINK);
      root.setAttribute("version", "1.1");

      // Adds group for anti-aliasing via transform
      var group =
        svgDoc.createElementNS != null
          ? svgDoc.createElementNS(m.mxConstants.NS_SVG, "g")
          : svgDoc.createElement("g");
      group.setAttribute("transform", "translate(0.5,0.5)");
      root.appendChild(group);
      svgDoc.appendChild(root);

      // Renders graph. Offset will be multiplied with state's scale when painting state.
      var svgCanvas = new m.mxSvgCanvas2D(group);
      svgCanvas.translate(
        Math.floor(1 / scale - bounds.x),
        Math.floor(1 / scale - bounds.y),
      );
      svgCanvas.scale(scale);

      var imgExport = new m.mxImageExport();
      imgExport.drawState(
        graph.getView().getState(graph.model.root),
        svgCanvas,
      );

      var name = "export.svg";
      var xml = encodeURIComponent(m.mxUtils.getXml(root));

      new m.mxXmlRequest(
        editor.urlEcho,
        "filename=" + name + "&format=svg" + "&xml=" + xml,
      ).simulate(document, "_blank");
    };

    editor.addAction("exportSvg", exportSvg);

    buttons.push("exportImage");
    buttons.push("exportSvg");
  }

  for (var i = 0; i < buttons.length; i++) {
    var button = document.createElement("button");
    m.mxUtils.write(button, m.mxResources.get(buttons[i])); // BUG   GS
    //m.mxUtils.write(button, "OK");

    var factory = function (name) {
      return function () {
        editor.execute(name);
      };
    };

    m.mxEvent.addListener(button, "click", factory(buttons[i]));
    node.appendChild(button);
  }

  // Create select actions in page
  var node = document.getElementById("selectActions");
  m.mxUtils.write(node, "Select: ");
  m.mxUtils.linkAction(node, "All", editor, "selectAll");
  m.mxUtils.write(node, ", ");
  m.mxUtils.linkAction(node, "None", editor, "selectNone");
  m.mxUtils.write(node, ", ");
  m.mxUtils.linkAction(node, "Vertices", editor, "selectVertices");
  m.mxUtils.write(node, ", ");
  m.mxUtils.linkAction(node, "Edges", editor, "selectEdges");

  // Create select actions in page
  var node = document.getElementById("zoomActions");
  m.mxUtils.write(node, "Zoom: ");
  m.mxUtils.linkAction(node, "In", editor, "zoomIn");
  m.mxUtils.write(node, ", ");
  m.mxUtils.linkAction(node, "Out", editor, "zoomOut");
  m.mxUtils.write(node, ", ");
  m.mxUtils.linkAction(node, "Actual", editor, "actualSize");
  m.mxUtils.write(node, ", ");
  m.mxUtils.linkAction(node, "Fit", editor, "fit");
};

window.onbeforeunload = function () {
  return m.mxResources.get("changesLost");
};
