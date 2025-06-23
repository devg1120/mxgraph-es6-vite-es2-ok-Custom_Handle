import * as m from "../dist/mxgraph.es.js";

window.onload = function () {
  main(document.getElementById("graphContainer"));
};
m.mxShape.constraints = [
  new m.mxConnectionConstraint(new m.mxPoint(0.25, 0), true),
  new m.mxConnectionConstraint(new m.mxPoint(0.5, 0), true),
  new m.mxConnectionConstraint(new m.mxPoint(0.75, 0), true),
  new m.mxConnectionConstraint(new m.mxPoint(0, 0.25), true),
  new m.mxConnectionConstraint(new m.mxPoint(0, 0.5), true),
  new m.mxConnectionConstraint(new m.mxPoint(0, 0.75), true),
  new m.mxConnectionConstraint(new m.mxPoint(1, 0.25), true),
  new m.mxConnectionConstraint(new m.mxPoint(1, 0.5), true),
  new m.mxConnectionConstraint(new m.mxPoint(1, 0.75), true),
  new m.mxConnectionConstraint(new m.mxPoint(0.25, 1), true),
  new m.mxConnectionConstraint(new m.mxPoint(0.5, 1), true),
  new m.mxConnectionConstraint(new m.mxPoint(0.75, 1), true),
];

m.mxPolyline.prototype.constraints = null;

function main(container) {
  // Checks if the browser is supported
  if (!m.mxClient.isBrowserSupported()) {
    // Displays an error message if the browser is not supported.
    mxUtils.error("Browser is not supported!", 200, false);
  } else {
    // Disables the built-in context menu
    m.mxEvent.disableContextMenu(container);

    // Creates the graph inside the given container
    var graph = new m.mxGraph(container);
    graph.setConnectable(true);

    // Enables connect preview for the default edge style
    graph.connectionHandler.createEdgeState = function (me) {
      var edge = graph.createEdge(null, null, null, null, null);

      return new m.mxCellState(
        this.graph.view,
        edge,
        this.graph.getCellStyle(edge),
      );
    };

    // Specifies the default edge style
    graph.getStylesheet().getDefaultEdgeStyle()["edgeStyle"] =
      "orthogonalEdgeStyle";

    // Enables rubberband selection
    new m.mxRubberband(graph);

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    var parent = graph.getDefaultParent();

    // Adds cells to the model in a single step
    graph.getModel().beginUpdate();
    try {
      var v1 = graph.insertVertex(parent, null, "Hello,", 20, 20, 80, 30);
      var v2 = graph.insertVertex(parent, null, "World!", 200, 150, 80, 30);
      var e1 = graph.insertEdge(parent, null, "", v1, v2);
    } finally {
      // Updates the display
      graph.getModel().endUpdate();
    }
  }
}
