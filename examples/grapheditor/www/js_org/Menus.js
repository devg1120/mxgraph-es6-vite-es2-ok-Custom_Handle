/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */
/**
 * Constructs a new graph editor
 */

import * as m from "../../../../../dist/mxgraph.es.js";
import { EditorUi } from "./EditorUi.js";

//Menus = function (editorUi) {
export function Menus(editorUi) {
  this.editorUi = editorUi;
  this.menus = new Object();
  this.init();

  // Pre-fetches checkmark image
  if (!m.mxClient.IS_SVG) {
    new Image().src = this.checkmarkImage;
  }
}

/**
 * Sets the default font family.
 */
Menus.prototype.defaultFont = "Helvetica";

/**
 * Sets the default font size.
 */
Menus.prototype.defaultFontSize = "12";

/**
 * Sets the default font size.
 */
Menus.prototype.defaultMenuItems = [
  "file",
  "edit",
  "view",
  "arrange",
  "extras",
  "help",
];

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.defaultFonts = [
  "Helvetica",
  "Verdana",
  "Times New Roman",
  "Garamond",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Lucida Console",
  "Tahoma",
];

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.init = function () {
  var graph = this.editorUi.editor.graph;
  var isGraphEnabled = m.mxUtils.bind(graph, graph.isEnabled);

  this.customFonts = [];
  this.customFontSizes = [];

  this.put(
    "fontFamily",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        var addItem = m.mxUtils.bind(this, function (fontname) {
          var tr = this.styleChange(
            menu,
            fontname,
            [m.mxConstants.STYLE_FONTFAMILY],
            [fontname],
            null,
            parent,
            function () {
              document.execCommand("fontname", false, fontname);
            },
            function () {
              graph.updateLabelElements(
                graph.getSelectionCells(),
                function (elt) {
                  elt.removeAttribute("face");
                  elt.style.fontFamily = null;

                  if (elt.nodeName == "PRE") {
                    graph.replaceElement(elt, "div");
                  }
                },
              );
            },
          );
          tr.firstChild.nextSibling.style.fontFamily = fontname;
        });

        for (var i = 0; i < this.defaultFonts.length; i++) {
          addItem(this.defaultFonts[i]);
        }

        menu.addSeparator(parent);

        if (this.customFonts.length > 0) {
          for (var i = 0; i < this.customFonts.length; i++) {
            addItem(this.customFonts[i]);
          }

          menu.addSeparator(parent);

          menu.addItem(
            m.mxResources.get("reset"),
            null,
            mxUtils.bind(this, function () {
              this.customFonts = [];
              this.editorUi.fireEvent(new mxEventObject("customFontsChanged"));
            }),
            parent,
          );

          menu.addSeparator(parent);
        }

        this.promptChange(
          menu,
          m.mxResources.get("custom") + "...",
          "",
          m.mxConstants.DEFAULT_FONTFAMILY,
          m.mxConstants.STYLE_FONTFAMILY,
          parent,
          true,
          m.mxUtils.bind(this, function (newValue) {
            if (m.mxUtils.indexOf(this.customFonts, newValue) < 0) {
              this.customFonts.push(newValue);
              this.editorUi.fireEvent(
                new m.mxEventObject("customFontsChanged"),
              );
            }
          }),
        );
      }),
    ),
  );
  this.put(
    "formatBlock",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        function addItem(label, tag) {
          return menu.addItem(
            label,
            null,
            m.mxUtils.bind(this, function () {
              // TODO: Check if visible
              if (graph.cellEditor.textarea != null) {
                graph.cellEditor.textarea.focus();
                document.execCommand("formatBlock", false, "<" + tag + ">");
              }
            }),
            parent,
          );
        }

        addItem(m.mxResources.get("normal"), "p");

        addItem("", "h1").firstChild.nextSibling.innerHTML =
          '<h1 style="margin:0px;">' + m.mxResources.get("heading") + " 1</h1>";
        addItem("", "h2").firstChild.nextSibling.innerHTML =
          '<h2 style="margin:0px;">' + m.mxResources.get("heading") + " 2</h2>";
        addItem("", "h3").firstChild.nextSibling.innerHTML =
          '<h3 style="margin:0px;">' + m.mxResources.get("heading") + " 3</h3>";
        addItem("", "h4").firstChild.nextSibling.innerHTML =
          '<h4 style="margin:0px;">' + m.mxResources.get("heading") + " 4</h4>";
        addItem("", "h5").firstChild.nextSibling.innerHTML =
          '<h5 style="margin:0px;">' + m.mxResources.get("heading") + " 5</h5>";
        addItem("", "h6").firstChild.nextSibling.innerHTML =
          '<h6 style="margin:0px;">' + m.mxResources.get("heading") + " 6</h6>";

        addItem("", "pre").firstChild.nextSibling.innerHTML =
          '<pre style="margin:0px;">' +
          m.mxResources.get("formatted") +
          "</pre>";
        addItem("", "blockquote").firstChild.nextSibling.innerHTML =
          '<blockquote style="margin-top:0px;margin-bottom:0px;">' +
          m.mxResources.get("blockquote") +
          "</blockquote>";
      }),
    ),
  );
  this.put(
    "fontSize",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        var sizes = [6, 8, 9, 10, 11, 12, 14, 18, 24, 36, 48, 72];

        var addItem = m.mxUtils.bind(this, function (fontsize) {
          this.styleChange(
            menu,
            fontsize,
            [m.mxConstants.STYLE_FONTSIZE],
            [fontsize],
            null,
            parent,
            function () {
              if (graph.cellEditor.textarea != null) {
                // Creates an element with arbitrary size 3
                document.execCommand("fontSize", false, "3");

                // Changes the css font size of the first font element inside the in-place editor with size 3
                // hopefully the above element that we've just created. LATER: Check for new element using
                // previous result of getElementsByTagName (see other actions)
                var elts =
                  graph.cellEditor.textarea.getElementsByTagName("font");

                for (var i = 0; i < elts.length; i++) {
                  if (elts[i].getAttribute("size") == "3") {
                    elts[i].removeAttribute("size");
                    elts[i].style.fontSize = fontsize + "px";

                    break;
                  }
                }
              }
            },
          );
        });

        for (var i = 0; i < sizes.length; i++) {
          addItem(sizes[i]);
        }

        menu.addSeparator(parent);

        if (this.customFontSizes.length > 0) {
          for (var i = 0; i < this.customFontSizes.length; i++) {
            addItem(this.customFontSizes[i]);
          }

          menu.addSeparator(parent);

          menu.addItem(
            m.mxResources.get("reset"),
            null,
            m.mxUtils.bind(this, function () {
              this.customFontSizes = [];
            }),
            parent,
          );

          menu.addSeparator(parent);
        }

        this.promptChange(
          menu,
          m.mxResources.get("custom") + "...",
          "(pt)",
          "12",
          m.mxConstants.STYLE_FONTSIZE,
          parent,
          true,
          m.mxUtils.bind(this, function (newValue) {
            this.customFontSizes.push(newValue);
          }),
        );
      }),
    ),
  );
  this.put(
    "direction",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        menu.addItem(
          m.mxResources.get("flipH"),
          null,
          function () {
            graph.toggleCellStyles(m.mxConstants.STYLE_FLIPH, false);
          },
          parent,
        );
        menu.addItem(
          m.mxResources.get("flipV"),
          null,
          function () {
            graph.toggleCellStyles(m.mxConstants.STYLE_FLIPV, false);
          },
          parent,
        );
        this.addMenuItems(menu, ["-", "rotation"], parent);
      }),
    ),
  );
  this.put(
    "align",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        menu.addItem(
          m.mxResources.get("leftAlign"),
          null,
          function () {
            graph.alignCells(m.mxConstants.ALIGN_LEFT);
          },
          parent,
        );
        menu.addItem(
          m.mxResources.get("center"),
          null,
          function () {
            graph.alignCells(m.mxConstants.ALIGN_CENTER);
          },
          parent,
        );
        menu.addItem(
          m.mxResources.get("rightAlign"),
          null,
          function () {
            graph.alignCells(m.mxConstants.ALIGN_RIGHT);
          },
          parent,
        );
        menu.addSeparator(parent);
        menu.addItem(
          m.mxResources.get("topAlign"),
          null,
          function () {
            graph.alignCells(m.mxConstants.ALIGN_TOP);
          },
          parent,
        );
        menu.addItem(
          m.mxResources.get("middle"),
          null,
          function () {
            graph.alignCells(m.mxConstants.ALIGN_MIDDLE);
          },
          parent,
        );
        menu.addItem(
          m.mxResources.get("bottomAlign"),
          null,
          function () {
            graph.alignCells(m.mxConstants.ALIGN_BOTTOM);
          },
          parent,
        );
      }),
    ),
  );
  this.put(
    "distribute",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        menu.addItem(
          m.mxResources.get("horizontal"),
          null,
          function () {
            graph.distributeCells(true);
          },
          parent,
        );
        menu.addItem(
          m.mxResources.get("vertical"),
          null,
          function () {
            graph.distributeCells(false);
          },
          parent,
        );
      }),
    ),
  );
  this.put(
    "layout",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        var promptSpacing = m.mxUtils.bind(this, function (defaultValue, fn) {
          var dlg = new FilenameDialog(
            this.editorUi,
            defaultValue,
            m.mxResources.get("apply"),
            function (newValue) {
              fn(parseFloat(newValue));
            },
            m.mxResources.get("spacing"),
          );
          this.editorUi.showDialog(dlg.container, 300, 80, true, true);
          dlg.init();
        });

        menu.addItem(
          m.mxResources.get("horizontalFlow"),
          null,
          m.mxUtils.bind(this, function () {
            var layout = new m.mxHierarchicalLayout(
              graph,
              m.mxConstants.DIRECTION_WEST,
            );

            this.editorUi.executeLayout(function () {
              var selectionCells = graph.getSelectionCells();
              layout.execute(
                graph.getDefaultParent(),
                selectionCells.length == 0 ? null : selectionCells,
              );
            }, true);
          }),
          parent,
        );
        menu.addItem(
          m.mxResources.get("verticalFlow"),
          null,
          m.mxUtils.bind(this, function () {
            var layout = new m.mxHierarchicalLayout(
              graph,
              m.mxConstants.DIRECTION_NORTH,
            );

            this.editorUi.executeLayout(function () {
              var selectionCells = graph.getSelectionCells();
              layout.execute(
                graph.getDefaultParent(),
                selectionCells.length == 0 ? null : selectionCells,
              );
            }, true);
          }),
          parent,
        );
        menu.addSeparator(parent);
        menu.addItem(
          m.mxResources.get("horizontalTree"),
          null,
          m.mxUtils.bind(this, function () {
            var tmp = graph.getSelectionCell();
            var roots = null;

            if (tmp == null || graph.getModel().getChildCount(tmp) == 0) {
              if (graph.getModel().getEdgeCount(tmp) == 0) {
                roots = graph.findTreeRoots(graph.getDefaultParent());
              }
            } else {
              roots = graph.findTreeRoots(tmp);
            }

            if (roots != null && roots.length > 0) {
              tmp = roots[0];
            }

            if (tmp != null) {
              var layout = new m.mxCompactTreeLayout(graph, true);
              layout.edgeRouting = false;
              layout.levelDistance = 30;

              promptSpacing(
                layout.levelDistance,
                m.mxUtils.bind(this, function (newValue) {
                  layout.levelDistance = newValue;

                  this.editorUi.executeLayout(function () {
                    layout.execute(graph.getDefaultParent(), tmp);
                  }, true);
                }),
              );
            }
          }),
          parent,
        );
        menu.addItem(
          m.mxResources.get("verticalTree"),
          null,
          m.mxUtils.bind(this, function () {
            var tmp = graph.getSelectionCell();
            var roots = null;

            if (tmp == null || graph.getModel().getChildCount(tmp) == 0) {
              if (graph.getModel().getEdgeCount(tmp) == 0) {
                roots = graph.findTreeRoots(graph.getDefaultParent());
              }
            } else {
              roots = graph.findTreeRoots(tmp);
            }

            if (roots != null && roots.length > 0) {
              tmp = roots[0];
            }

            if (tmp != null) {
              var layout = new m.mxCompactTreeLayout(graph, false);
              layout.edgeRouting = false;
              layout.levelDistance = 30;

              promptSpacing(
                layout.levelDistance,
                m.mxUtils.bind(this, function (newValue) {
                  layout.levelDistance = newValue;

                  this.editorUi.executeLayout(function () {
                    layout.execute(graph.getDefaultParent(), tmp);
                  }, true);
                }),
              );
            }
          }),
          parent,
        );
        menu.addItem(
          m.mxResources.get("radialTree"),
          null,
          m.mxUtils.bind(this, function () {
            var tmp = graph.getSelectionCell();
            var roots = null;

            if (tmp == null || graph.getModel().getChildCount(tmp) == 0) {
              if (graph.getModel().getEdgeCount(tmp) == 0) {
                roots = graph.findTreeRoots(graph.getDefaultParent());
              }
            } else {
              roots = graph.findTreeRoots(tmp);
            }

            if (roots != null && roots.length > 0) {
              tmp = roots[0];
            }

            if (tmp != null) {
              var layout = new m.mxRadialTreeLayout(graph, false);
              layout.levelDistance = 80;
              layout.autoRadius = true;

              promptSpacing(
                layout.levelDistance,
                m.mxUtils.bind(this, function (newValue) {
                  layout.levelDistance = newValue;

                  this.editorUi.executeLayout(function () {
                    layout.execute(graph.getDefaultParent(), tmp);

                    if (!graph.isSelectionEmpty()) {
                      tmp = graph.getModel().getParent(tmp);

                      if (graph.getModel().isVertex(tmp)) {
                        graph.updateGroupBounds(
                          [tmp],
                          graph.gridSize * 2,
                          true,
                        );
                      }
                    }
                  }, true);
                }),
              );
            }
          }),
          parent,
        );
        menu.addSeparator(parent);
        menu.addItem(
          m.mxResources.get("organic"),
          null,
          m.mxUtils.bind(this, function () {
            var layout = new m.mxFastOrganicLayout(graph);

            promptSpacing(
              layout.forceConstant,
              m.mxUtils.bind(this, function (newValue) {
                layout.forceConstant = newValue;

                this.editorUi.executeLayout(function () {
                  var tmp = graph.getSelectionCell();

                  if (tmp == null || graph.getModel().getChildCount(tmp) == 0) {
                    tmp = graph.getDefaultParent();
                  }

                  layout.execute(tmp);

                  if (graph.getModel().isVertex(tmp)) {
                    graph.updateGroupBounds([tmp], graph.gridSize * 2, true);
                  }
                }, true);
              }),
            );
          }),
          parent,
        );
        menu.addItem(
          m.mxResources.get("circle"),
          null,
          m.mxUtils.bind(this, function () {
            var layout = new m.mxCircleLayout(graph);

            this.editorUi.executeLayout(function () {
              var tmp = graph.getSelectionCell();

              if (tmp == null || graph.getModel().getChildCount(tmp) == 0) {
                tmp = graph.getDefaultParent();
              }

              layout.execute(tmp);

              if (graph.getModel().isVertex(tmp)) {
                graph.updateGroupBounds([tmp], graph.gridSize * 2, true);
              }
            }, true);
          }),
          parent,
        );
      }),
    ),
  );
  this.put(
    "navigation",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(
          menu,
          [
            "home",
            "-",
            "exitGroup",
            "enterGroup",
            "-",
            "expand",
            "collapse",
            "-",
            "collapsible",
          ],
          parent,
        );
      }),
    ),
  );
  this.put(
    "arrange",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(menu, ["toFront", "toBack", "-"], parent);
        this.addSubmenu("direction", menu, parent);
        this.addMenuItems(menu, ["turn", "-"], parent);
        this.addSubmenu("align", menu, parent);
        this.addSubmenu("distribute", menu, parent);
        menu.addSeparator(parent);
        this.addSubmenu("navigation", menu, parent);
        this.addSubmenu("insert", menu, parent);
        this.addSubmenu("layout", menu, parent);
        this.addMenuItems(
          menu,
          [
            "-",
            "group",
            "ungroup",
            "removeFromGroup",
            "-",
            "clearWaypoints",
            "autosize",
          ],
          parent,
        );
      }),
    ),
  ).isEnabled = isGraphEnabled;
  this.put(
    "insert",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(menu, ["insertLink", "insertImage"], parent);
      }),
    ),
  );
  this.put(
    "view",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(
          menu,
          (this.editorUi.format != null ? ["formatPanel"] : []).concat(
            [
              "outline",
              "layers",
              "-",
              "pageView",
              "pageScale",
              "-",
              "scrollbars",
              "tooltips",
              "-",
              "grid",
              "guides",
              "-",
              "connectionArrows",
              "connectionPoints",
              "-",
              "resetView",
              "zoomIn",
              "zoomOut",
            ],
            parent,
          ),
        );
      }),
    ),
  );
  // Two special dropdowns that are only used in the toolbar
  this.put(
    "viewPanels",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        if (this.editorUi.format != null) {
          this.addMenuItems(menu, ["formatPanel"], parent);
        }

        this.addMenuItems(menu, ["outline", "layers"], parent);
      }),
    ),
  );
  this.put(
    "viewZoom",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(menu, ["resetView", "-"], parent);
        var scales = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

        for (var i = 0; i < scales.length; i++) {
          (function (scale) {
            menu.addItem(
              scale * 100 + "%",
              null,
              function () {
                graph.zoomTo(scale);
              },
              parent,
            );
          })(scales[i]);
        }

        this.addMenuItems(
          menu,
          [
            "-",
            "fitWindow",
            "fitPageWidth",
            "fitPage",
            "fitTwoPages",
            "-",
            "customZoom",
          ],
          parent,
        );
      }),
    ),
  );
  this.put(
    "file",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(
          menu,
          [
            "new",
            "open",
            "-",
            "save",
            "saveAs",
            "-",
            "import",
            "export",
            "-",
            "pageSetup",
            "print",
          ],
          parent,
        );
      }),
    ),
  );
  this.put(
    "edit",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(menu, [
          "undo",
          "redo",
          "-",
          "cut",
          "copy",
          "paste",
          "delete",
          "-",
          "duplicate",
          "-",
          "editData",
          "editTooltip",
          "-",
          "editStyle",
          "-",
          "edit",
          "-",
          "editLink",
          "openLink",
          "-",
          "selectVertices",
          "selectEdges",
          "selectAll",
          "selectNone",
          "-",
          "lockUnlock",
        ]);
      }),
    ),
  );
  this.put(
    "extras",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(menu, [
          "copyConnect",
          "collapseExpand",
          "-",
          "editDiagram",
        ]);
      }),
    ),
  );
  this.put(
    "help",
    new Menu(
      m.mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(menu, ["help", "-", "about"]);
      }),
    ),
  );
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.put = function (name, menu) {
  this.menus[name] = menu;

  return menu;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.get = function (name) {
  return this.menus[name];
};

/**
 * Adds the given submenu.
 */
Menus.prototype.addSubmenu = function (name, menu, parent, label) {
  var entry = this.get(name);

  if (entry != null) {
    var enabled = entry.isEnabled();

    if (menu.showDisabled || enabled) {
      var submenu = menu.addItem(
        label || m.mxResources.get(name),
        null,
        null,
        parent,
        null,
        enabled,
      );
      this.addMenu(name, menu, submenu);
    }
  }
};

/**
 * Adds the label menu items to the given menu and parent.
 */
Menus.prototype.addMenu = function (name, popupMenu, parent) {
  var menu = this.get(name);

  if (menu != null && (popupMenu.showDisabled || menu.isEnabled())) {
    this.get(name).execute(popupMenu, parent);
  }
};

/**
 * Adds a menu item to insert a table cell.
 */
Menus.prototype.addInsertTableCellItem = function (menu, parent) {
  var graph = this.editorUi.editor.graph;

  this.addInsertTableItem(
    menu,
    m.mxUtils.bind(this, function (evt, rows, cols) {
      var table =
        m.mxEvent.isControlDown(evt) || m.mxEvent.isMetaDown(evt)
          ? graph.createCrossFunctionalSwimlane(rows, cols)
          : graph.createTable(
              rows,
              cols,
              null,
              null,
              m.mxEvent.isShiftDown(evt) ? "Table" : null,
            );
      var pt = m.mxEvent.isAltDown(evt)
        ? graph.getFreeInsertPoint()
        : graph.getCenterInsertPoint(
            graph.getBoundingBoxFromGeometry([table], true),
          );
      var select = graph.importCells([table], pt.x, pt.y);

      if (select != null && select.length > 0) {
        graph.scrollCellToVisible(select[0]);
        graph.setSelectionCells(select);
      }
    }),
    parent,
  );
};

/**
 * Adds a menu item to insert a table.
 */
Menus.prototype.addInsertTableItem = function (menu, insertFn, parent) {
  insertFn =
    insertFn != null
      ? insertFn
      : m.mxUtils.bind(this, function (evt, rows, cols) {
          var graph = this.editorUi.editor.graph;
          var td = graph.getParentByName(m.mxEvent.getSource(evt), "TD");

          if (td != null && graph.cellEditor.textarea != null) {
            var row2 = graph.getParentByName(td, "TR");

            // To find the new link, we create a list of all existing links first
            // LATER: Refactor for reuse with code for finding inserted image below
            var tmp = graph.cellEditor.textarea.getElementsByTagName("table");
            var oldTables = [];

            for (var i = 0; i < tmp.length; i++) {
              oldTables.push(tmp[i]);
            }

            // Finding the new table will work with insertHTML, but IE does not support that
            graph.container.focus();
            graph.pasteHtmlAtCaret(createTable(rows, cols));

            // Moves cursor to first table cell
            var newTables =
              graph.cellEditor.textarea.getElementsByTagName("table");

            if (newTables.length == oldTables.length + 1) {
              // Inverse order in favor of appended tables
              for (var i = newTables.length - 1; i >= 0; i--) {
                if (i == 0 || newTables[i] != oldTables[i - 1]) {
                  graph.selectNode(newTables[i].rows[0].cells[0]);
                  break;
                }
              }
            }
          }
        });

  // KNOWN: Does not work in IE8 standards and quirks
  var graph = this.editorUi.editor.graph;
  var row2 = null;
  var td = null;

  function createTable(rows, cols) {
    var html = ["<table>"];

    for (var i = 0; i < rows; i++) {
      html.push("<tr>");

      for (var j = 0; j < cols; j++) {
        html.push("<td><br></td>");
      }

      html.push("</tr>");
    }

    html.push("</table>");

    return html.join("");
  }

  // Show table size dialog
  var elt2 = menu.addItem("", null, null, parent, null, null, null, true);

  // Quirks mode does not add cell padding if cell is empty, needs good old spacer solution
  var quirksCellHtml =
    '<img src="' +
    m.mxClient.imageBasePath +
    "/transparent.gif" +
    '" width="16" height="16"/>';

  function createPicker(rows, cols) {
    var table2 = document.createElement("table");
    table2.setAttribute("border", "1");
    table2.style.borderCollapse = "collapse";
    table2.style.borderStyle = "solid";

    if (!m.mxClient.IS_QUIRKS) {
      table2.setAttribute("cellPadding", "8");
    }

    for (var i = 0; i < rows; i++) {
      var row = table2.insertRow(i);

      for (var j = 0; j < cols; j++) {
        var cell = row.insertCell(-1);

        if (m.mxClient.IS_QUIRKS) {
          cell.innerHTML = quirksCellHtml;
        }
      }
    }

    return table2;
  }

  function extendPicker(picker, rows, cols) {
    for (var i = picker.rows.length; i < rows; i++) {
      var row = picker.insertRow(i);

      for (var j = 0; j < picker.rows[0].cells.length; j++) {
        var cell = row.insertCell(-1);

        if (m.mxClient.IS_QUIRKS) {
          cell.innerHTML = quirksCellHtml;
        }
      }
    }

    for (var i = 0; i < picker.rows.length; i++) {
      var row = picker.rows[i];

      for (var j = row.cells.length; j < cols; j++) {
        var cell = row.insertCell(-1);

        if (m.mxClient.IS_QUIRKS) {
          cell.innerHTML = quirksCellHtml;
        }
      }
    }
  }

  elt2.firstChild.innerHTML = "";
  var picker = createPicker(5, 5);
  elt2.firstChild.appendChild(picker);

  var label = document.createElement("div");
  label.style.padding = "4px";
  label.style.fontSize = Menus.prototype.defaultFontSize + "px";
  label.innerHTML = "1x1";
  elt2.firstChild.appendChild(label);

  function mouseover(e) {
    td = graph.getParentByName(m.mxEvent.getSource(e), "TD");
    var selected = false;

    if (td != null) {
      row2 = graph.getParentByName(td, "TR");
      var ext = m.mxEvent.isMouseEvent(e) ? 2 : 4;
      extendPicker(
        picker,
        Math.min(20, row2.sectionRowIndex + ext),
        Math.min(20, td.cellIndex + ext),
      );
      label.innerHTML = td.cellIndex + 1 + "x" + (row2.sectionRowIndex + 1);

      for (var i = 0; i < picker.rows.length; i++) {
        var r = picker.rows[i];

        for (var j = 0; j < r.cells.length; j++) {
          var cell = r.cells[j];

          if (i == row2.sectionRowIndex && j == td.cellIndex) {
            selected = cell.style.backgroundColor == "blue";
          }

          if (i <= row2.sectionRowIndex && j <= td.cellIndex) {
            cell.style.backgroundColor = "blue";
          } else {
            cell.style.backgroundColor = "transparent";
          }
        }
      }
    }

    m.mxEvent.consume(e);

    return selected;
  }

  m.mxEvent.addGestureListeners(
    picker,
    null,
    null,
    m.mxUtils.bind(this, function (e) {
      var selected = mouseover(e);

      if (td != null && row2 != null && selected) {
        insertFn(e, row2.sectionRowIndex + 1, td.cellIndex + 1);

        // Async required to block event for elements under menu
        window.setTimeout(
          m.mxUtils.bind(this, function () {
            this.editorUi.hideCurrentMenu();
          }),
          0,
        );
      }
    }),
  );
  m.mxEvent.addListener(picker, "mouseover", mouseover);
};

/**
 * Adds a style change item to the given menu.
 */
Menus.prototype.edgeStyleChange = function (
  menu,
  label,
  keys,
  values,
  sprite,
  parent,
  reset,
) {
  return menu.addItem(
    label,
    null,
    m.mxUtils.bind(this, function () {
      var graph = this.editorUi.editor.graph;
      graph.stopEditing(false);

      graph.getModel().beginUpdate();
      try {
        var cells = graph.getSelectionCells();
        var edges = [];

        for (var i = 0; i < cells.length; i++) {
          var cell = cells[i];

          if (graph.getModel().isEdge(cell)) {
            if (reset) {
              var geo = graph.getCellGeometry(cell);

              // Resets all edge points
              if (geo != null) {
                geo = geo.clone();
                geo.points = null;
                graph.getModel().setGeometry(cell, geo);
              }
            }

            for (var j = 0; j < keys.length; j++) {
              graph.setCellStyles(keys[j], values[j], [cell]);
            }

            edges.push(cell);
          }
        }

        this.editorUi.fireEvent(
          new m.mxEventObject(
            "styleChanged",
            "keys",
            keys,
            "values",
            values,
            "cells",
            edges,
          ),
        );
      } finally {
        graph.getModel().endUpdate();
      }
    }),
    parent,
    sprite,
  );
};

/**
 * Adds a style change item to the given menu.
 */
Menus.prototype.styleChange = function (
  menu,
  label,
  keys,
  values,
  sprite,
  parent,
  fn,
  post,
) {
  var apply = this.createStyleChangeFunction(keys, values);

  return menu.addItem(
    label,
    null,
    m.mxUtils.bind(this, function () {
      var graph = this.editorUi.editor.graph;

      if (fn != null && graph.cellEditor.isContentEditing()) {
        fn();
      } else {
        apply(post);
      }
    }),
    parent,
    sprite,
  );
};

/**
 *
 */
Menus.prototype.createStyleChangeFunction = function (keys, values) {
  return m.mxUtils.bind(this, function (post) {
    var graph = this.editorUi.editor.graph;
    graph.stopEditing(false);

    graph.getModel().beginUpdate();
    try {
      var cells = graph.getSelectionCells();

      for (var i = 0; i < keys.length; i++) {
        graph.setCellStyles(keys[i], values[i], cells);

        // Removes CSS alignment to produce consistent output
        if (keys[i] == m.mxConstants.STYLE_ALIGN) {
          graph.updateLabelElements(cells, function (elt) {
            elt.removeAttribute("align");
            elt.style.textAlign = null;
          });
        }

        // Updates autosize after font changes
        if (keys[i] == m.mxConstants.STYLE_FONTFAMILY) {
          for (var j = 0; j < cells.length; j++) {
            if (graph.model.getChildCount(cells[j]) == 0) {
              graph.autoSizeCell(cells[j], false);
            }
          }
        }
      }

      if (post != null) {
        post();
      }

      this.editorUi.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          keys,
          "values",
          values,
          "cells",
          cells,
        ),
      );
    } finally {
      graph.getModel().endUpdate();
    }
  });
};

/**
 * Adds a style change item with a prompt to the given menu.
 */
Menus.prototype.promptChange = function (
  menu,
  label,
  hint,
  defaultValue,
  key,
  parent,
  enabled,
  fn,
  sprite,
) {
  return menu.addItem(
    label,
    null,
    m.mxUtils.bind(this, function () {
      var graph = this.editorUi.editor.graph;
      var value = defaultValue;
      var state = graph.getView().getState(graph.getSelectionCell());

      if (state != null) {
        value = state.style[key] || value;
      }

      var dlg = new FilenameDialog(
        this.editorUi,
        value,
        m.mxResources.get("apply"),
        m.mxUtils.bind(this, function (newValue) {
          if (newValue != null && newValue.length > 0) {
            graph.getModel().beginUpdate();
            try {
              graph.stopEditing(false);
              graph.setCellStyles(key, newValue);
            } finally {
              graph.getModel().endUpdate();
            }

            if (fn != null) {
              fn(newValue);
            }
          }
        }),
        m.mxResources.get("enterValue") + (hint.length > 0 ? " " + hint : ""),
      );
      this.editorUi.showDialog(dlg.container, 300, 80, true, true);
      dlg.init();
    }),
    parent,
    sprite,
    enabled,
  );
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menus.prototype.pickColor = function (key, cmd, defaultValue) {
  var graph = this.editorUi.editor.graph;
  var h =
    226 +
    (Math.ceil(ColorDialog.prototype.presetColors.length / 12) +
      Math.ceil(ColorDialog.prototype.defaultColors.length / 12)) *
      17;

  if (cmd != null && graph.cellEditor.isContentEditing()) {
    // Saves and restores text selection for in-place editor
    var selState = graph.cellEditor.saveSelection();

    var dlg = new ColorDialog(
      this.editorUi,
      defaultValue || "000000",
      m.mxUtils.bind(this, function (color) {
        graph.cellEditor.restoreSelection(selState);
        document.execCommand(
          cmd,
          false,
          color != m.mxConstants.NONE ? color : "transparent",
        );
      }),
      function () {
        graph.cellEditor.restoreSelection(selState);
      },
    );
    this.editorUi.showDialog(dlg.container, 230, h, true, true);
    dlg.init();
  } else {
    if (this.colorDialog == null) {
      this.colorDialog = new ColorDialog(this.editorUi);
    }

    this.colorDialog.currentColorKey = key;
    var state = graph.getView().getState(graph.getSelectionCell());
    var color = "none";

    if (state != null) {
      color = state.style[key] || color;
    }

    if (color == "none") {
      color = "ffffff";
      this.colorDialog.picker.fromString("ffffff");
      this.colorDialog.colorInput.value = "none";
    } else {
      this.colorDialog.picker.fromString(color);
    }

    this.editorUi.showDialog(this.colorDialog.container, 230, h, true, true);
    this.colorDialog.init();
  }
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menus.prototype.toggleStyle = function (key, defaultValue) {
  var graph = this.editorUi.editor.graph;
  var value = graph.toggleCellStyles(key, defaultValue);
  this.editorUi.fireEvent(
    new m.mxEventObject(
      "styleChanged",
      "keys",
      [key],
      "values",
      [value],
      "cells",
      graph.getSelectionCells(),
    ),
  );
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addMenuItem = function (
  menu,
  key,
  parent,
  trigger,
  sprite,
  label,
) {
  var action = this.editorUi.actions.get(key);

  if (
    action != null &&
    (menu.showDisabled || action.isEnabled()) &&
    action.visible
  ) {
    var item = menu.addItem(
      label || action.label,
      null,
      function () {
        action.funct(trigger);
      },
      parent,
      sprite,
      action.isEnabled(),
    );

    // Adds checkmark image
    if (action.toggleAction && action.isSelected()) {
      menu.addCheckmark(item, Editor.checkmarkImage);
    }

    this.addShortcut(item, action);

    return item;
  }

  return null;
};

/**
 * Adds a checkmark to the given menuitem.
 */
Menus.prototype.addShortcut = function (item, action) {
  if (action.shortcut != null) {
    var td = item.firstChild.nextSibling.nextSibling;
    var span = document.createElement("span");
    span.style.color = "gray";
    m.mxUtils.write(span, action.shortcut);
    td.appendChild(span);
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addMenuItems = function (menu, keys, parent, trigger, sprites) {
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] == "-") {
      menu.addSeparator(parent);
    } else {
      this.addMenuItem(
        menu,
        keys[i],
        parent,
        trigger,
        sprites != null ? sprites[i] : null,
      );
    }
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.createPopupMenu = function (menu, cell, evt) {
  menu.smartSeparators = true;

  this.addPopupMenuHistoryItems(menu, cell, evt);
  this.addPopupMenuEditItems(menu, cell, evt);
  this.addPopupMenuStyleItems(menu, cell, evt);
  this.addPopupMenuArrangeItems(menu, cell, evt);
  this.addPopupMenuCellItems(menu, cell, evt);
  this.addPopupMenuSelectionItems(menu, cell, evt);
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuHistoryItems = function (menu, cell, evt) {
  if (this.editorUi.editor.graph.isSelectionEmpty()) {
    this.addMenuItems(menu, ["undo", "redo"], null, evt);
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuEditItems = function (menu, cell, evt) {
  if (this.editorUi.editor.graph.isSelectionEmpty()) {
    this.addMenuItems(menu, ["pasteHere"], null, evt);
  } else {
    this.addMenuItems(
      menu,
      ["delete", "-", "cut", "copy", "-", "duplicate"],
      null,
      evt,
    );
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuStyleItems = function (menu, cell, evt) {
  if (this.editorUi.editor.graph.getSelectionCount() == 1) {
    this.addMenuItems(menu, ["-", "setAsDefaultStyle"], null, evt);
  } else if (this.editorUi.editor.graph.isSelectionEmpty()) {
    this.addMenuItems(menu, ["-", "clearDefaultStyle"], null, evt);
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuArrangeItems = function (menu, cell, evt) {
  var graph = this.editorUi.editor.graph;

  if (!graph.isSelectionEmpty()) {
    this.addMenuItems(menu, ["-", "toFront", "toBack"], null, evt);
  }

  if (graph.getSelectionCount() > 1) {
    this.addMenuItems(menu, ["-", "group"], null, evt);
  } else if (
    graph.getSelectionCount() == 1 &&
    !graph.getModel().isEdge(cell) &&
    !graph.isSwimlane(cell) &&
    graph.getModel().getChildCount(cell) > 0
  ) {
    this.addMenuItems(menu, ["-", "ungroup"], null, evt);
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuCellItems = function (menu, cell, evt) {
  var graph = this.editorUi.editor.graph;
  cell = graph.getSelectionCell();
  var state = graph.view.getState(cell);
  menu.addSeparator();

  if (state != null) {
    var hasWaypoints = false;

    if (
      graph.getModel().isEdge(cell) &&
      m.mxUtils.getValue(state.style, m.mxConstants.STYLE_EDGE, null) !=
        "entityRelationEdgeStyle" &&
      m.mxUtils.getValue(state.style, m.mxConstants.STYLE_SHAPE, null) !=
        "arrow"
    ) {
      var handler = graph.selectionCellsHandler.getHandler(cell);
      var isWaypoint = false;

      if (
        handler instanceof m.mxEdgeHandler &&
        handler.bends != null &&
        handler.bends.length > 2
      ) {
        var index = handler.getHandleForEvent(
          graph.updateMouseEvent(new m.mxMouseEvent(evt)),
        );

        // Configures removeWaypoint action before execution
        // Using trigger parameter is cleaner but have to find waypoint here anyway.
        var rmWaypointAction = this.editorUi.actions.get("removeWaypoint");
        rmWaypointAction.handler = handler;
        rmWaypointAction.index = index;

        isWaypoint = index > 0 && index < handler.bends.length - 1;
      }

      menu.addSeparator();
      this.addMenuItem(
        menu,
        "turn",
        null,
        evt,
        null,
        m.mxResources.get("reverse"),
      );
      this.addMenuItems(
        menu,
        [isWaypoint ? "removeWaypoint" : "addWaypoint"],
        null,
        evt,
      );

      // Adds reset waypoints option if waypoints exist
      var geo = graph.getModel().getGeometry(cell);
      hasWaypoints = geo != null && geo.points != null && geo.points.length > 0;
    }

    if (
      graph.getSelectionCount() == 1 &&
      (hasWaypoints ||
        (graph.getModel().isVertex(cell) &&
          graph.getModel().getEdgeCount(cell) > 0))
    ) {
      this.addMenuItems(menu, ["-", "clearWaypoints"], null, evt);
    }

    if (graph.getSelectionCount() == 1) {
      this.addMenuItems(
        menu,
        ["-", "editStyle", "editData", "editLink"],
        null,
        evt,
      );

      // Shows edit image action if there is an image in the style
      if (
        graph.getModel().isVertex(cell) &&
        m.mxUtils.getValue(state.style, m.mxConstants.STYLE_IMAGE, null) != null
      ) {
        menu.addSeparator();
        this.addMenuItem(
          menu,
          "image",
          null,
          evt,
        ).firstChild.nextSibling.innerHTML =
          m.mxResources.get("editImage") + "...";
      }
    }
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.addPopupMenuSelectionItems = function (menu, cell, evt) {
  if (this.editorUi.editor.graph.isSelectionEmpty()) {
    this.addMenuItems(
      menu,
      ["-", "selectVertices", "selectEdges", "selectAll"],
      null,
      evt,
    );
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.createMenubar = function (container) {
  var menubar = new Menubar(this.editorUi, container);
  var menus = this.defaultMenuItems;

  for (var i = 0; i < menus.length; i++) {
    m.mxUtils.bind(this, function (menu) {
      var elt = menubar.addMenu(
        m.mxResources.get(menus[i]),
        m.mxUtils.bind(this, function () {
          // Allows extensions of menu.funct
          menu.funct.apply(this, arguments);
        }),
      );

      this.menuCreated(menu, elt);
    })(this.get(menus[i]));
  }

  return menubar;
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.menuCreated = function (menu, elt, className) {
  if (elt != null) {
    className = className != null ? className : "geItem";

    menu.addListener("stateChanged", function () {
      elt.enabled = menu.enabled;

      if (!menu.enabled) {
        elt.className = className + " mxDisabled";

        if (document.documentMode == 8) {
          elt.style.color = "#c3c3c3";
        }
      } else {
        elt.className = className;

        if (document.documentMode == 8) {
          elt.style.color = "";
        }
      }
    });
  }
};

/**
 * Construcs a new menubar for the given editor.
 */
function Menubar(editorUi, container) {
  this.editorUi = editorUi;
  this.container = container;
}

/**
 * Adds the menubar elements.
 */
Menubar.prototype.hideMenu = function () {
  this.editorUi.hideCurrentMenu();
};

/**
 * Adds a submenu to this menubar.
 */
Menubar.prototype.addMenu = function (label, funct, before) {
  var elt = document.createElement("a");
  elt.className = "geItem";
  m.mxUtils.write(elt, label);
  this.addMenuHandler(elt, funct);

  if (before != null) {
    this.container.insertBefore(elt, before);
  } else {
    this.container.appendChild(elt);
  }

  return elt;
};

/**
 * Adds a handler for showing a menu in the given element.
 */
Menubar.prototype.addMenuHandler = function (elt, funct) {
  if (funct != null) {
    var show = true;

    var clickHandler = m.mxUtils.bind(this, function (evt) {
      if ((show && elt.enabled == null) || elt.enabled) {
        this.editorUi.editor.graph.popupMenuHandler.hideMenu();
        var menu = new m.mxPopupMenu(funct);
        menu.div.className += " geMenubarMenu";
        menu.smartSeparators = true;
        menu.showDisabled = true;
        menu.autoExpand = true;

        // Disables autoexpand and destroys menu when hidden
        menu.hideMenu = m.mxUtils.bind(this, function () {
          m.mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
          this.editorUi.resetCurrentMenu();
          menu.destroy();
        });

        var offset = m.mxUtils.getOffset(elt);
        menu.popup(offset.x, offset.y + elt.offsetHeight, null, evt);
        this.editorUi.setCurrentMenu(menu, elt);
      }

      m.mxEvent.consume(evt);
    });

    // Shows menu automatically while in expanded state
    m.mxEvent.addListener(
      elt,
      "mousemove",
      m.mxUtils.bind(this, function (evt) {
        if (
          this.editorUi.currentMenu != null &&
          this.editorUi.currentMenuElt != elt
        ) {
          this.editorUi.hideCurrentMenu();
          clickHandler(evt);
        }
      }),
    );

    // Hides menu if already showing and prevents focus
    m.mxEvent.addListener(
      elt,
      m.mxClient.IS_POINTER ? "pointerdown" : "mousedown",
      m.mxUtils.bind(this, function (evt) {
        show = this.currentElt != elt;
        evt.preventDefault();
      }),
    );

    m.mxEvent.addListener(
      elt,
      "click",
      m.mxUtils.bind(this, function (evt) {
        clickHandler(evt);
        show = true;
      }),
    );
  }
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menubar.prototype.destroy = function () {
  // do nothing
};

/**
 * Constructs a new action for the given parameters.
 */
function Menu(funct, enabled) {
  m.mxEventSource.call(this);
  this.funct = funct;
  this.enabled = enabled != null ? enabled : true;
}

// Menu inherits from mxEventSource
m.mxUtils.extend(Menu, m.mxEventSource);

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Menu.prototype.isEnabled = function () {
  return this.enabled;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Menu.prototype.setEnabled = function (value) {
  if (this.enabled != value) {
    this.enabled = value;
    this.fireEvent(new m.mxEventObject("stateChanged"));
  }
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Menu.prototype.execute = function (menu, parent) {
  this.funct(menu, parent);
};

/**
 * "Installs" menus in EditorUi.
 */
EditorUi.prototype.createMenus = function () {
  return new Menus(this);
};
