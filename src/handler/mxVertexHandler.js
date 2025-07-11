import { mxPoint } from "@mxgraph/util/mxPoint";
import { mxClient } from "@mxgraph/mxClient";
import { mxUtils } from "@mxgraph/util/mxUtils";
import { mxEllipse } from "@mxgraph/shape/mxEllipse";
import { mxImageShape } from "@mxgraph/shape/mxImageShape";
import { mxRectangleShape } from "@mxgraph/shape/mxRectangleShape";
import { mxGraphHandler } from "@mxgraph/handler/mxGraphHandler";
import { mxConstants } from "@mxgraph/util/mxConstants";
import { mxRectangle } from "@mxgraph/util/mxRectangle";
import { mxEvent } from "@mxgraph/util/mxEvent";

export class mxVertexHandler {
  graph = null;
  state = null;
  singleSizer = false;
  index = null;
  allowHandleBoundsCheck = true;
  handleImage = null;
//static  tolerance = 0;
  tolerance = 0;
  rotationEnabled = true;
  parentHighlightEnabled = false;
  rotationRaster = true;
  rotationCursor = "crosshair";
static  livePreview = false;
//  livePreview = false;
static  manageSizers = false;
//  manageSizers = false;
  constrainGroupByChildren = false;
static   rotationHandleVSpacing = -16;
//  rotationHandleVSpacing = -16;
  horizontalOffset = 0;
  verticalOffset = 0;

  constructor(state) {
    if (state != null) {
      this.state = state;
      this.init();

      this.escapeHandler = (sender, evt) => {
        if (this.livePreview && this.index != null) {
          this.state.view.graph.cellRenderer.redraw(this.state, true);
          this.state.view.invalidate(this.state.cell);
          this.state.invalid = false;
          this.state.view.validate();
        }

        this.reset();
      };

      this.state.view.graph.addListener(mxEvent.ESCAPE, this.escapeHandler);
    }
  }

  init() {
    this.graph = this.state.view.graph;
    this.selectionBounds = this.getSelectionBounds(this.state);
    this.bounds = new mxRectangle(
      this.selectionBounds.x,
      this.selectionBounds.y,
      this.selectionBounds.width,
      this.selectionBounds.height,
    );
    this.selectionBorder = this.createSelectionShape(this.bounds);
    this.selectionBorder.dialect =
      this.graph.dialect != mxConstants.DIALECT_SVG
        ? mxConstants.DIALECT_VML
        : mxConstants.DIALECT_SVG;
    this.selectionBorder.pointerEvents = false;
    this.selectionBorder.rotation = Number(
      this.state.style[mxConstants.STYLE_ROTATION] || "0",
    );
    this.selectionBorder.init(this.graph.getView().getOverlayPane());
    mxEvent.redirectMouseEvents(
      this.selectionBorder.node,
      this.graph,
      this.state,
    );
    if (this.graph.isCellMovable(this.state.cell)) {
      this.selectionBorder.setCursor(mxConstants.CURSOR_MOVABLE_VERTEX);
    }

    if (
      mxGraphHandler.maxCells <= 0 ||
      this.graph.getSelectionCount() < mxGraphHandler.maxCells
    ) {
      var resizable = this.graph.isCellResizable(this.state.cell);
      this.sizers = [];

      if (
        resizable ||
        (this.graph.isLabelMovable(this.state.cell) &&
          this.state.width >= 2 &&
          this.state.height >= 2)
      ) {
        var i = 0;

        if (resizable) {
          if (!this.singleSizer) {
            this.sizers.push(this.createSizer("nw-resize", i++));
            this.sizers.push(this.createSizer("n-resize", i++));
            this.sizers.push(this.createSizer("ne-resize", i++));
            this.sizers.push(this.createSizer("w-resize", i++));
            this.sizers.push(this.createSizer("e-resize", i++));
            this.sizers.push(this.createSizer("sw-resize", i++));
            this.sizers.push(this.createSizer("s-resize", i++));
          }

          this.sizers.push(this.createSizer("se-resize", i++));
        }

        var geo = this.graph.model.getGeometry(this.state.cell);

        if (
          geo != null &&
          !geo.relative &&
          !this.graph.isSwimlane(this.state.cell) &&
          this.graph.isLabelMovable(this.state.cell)
        ) {
          this.labelShape = this.createSizer(
            mxConstants.CURSOR_LABEL_HANDLE,
            mxEvent.LABEL_HANDLE,
            mxConstants.LABEL_HANDLE_SIZE,
            mxConstants.LABEL_HANDLE_FILLCOLOR,
          );
          this.sizers.push(this.labelShape);
        }
      } else if (
        this.graph.isCellMovable(this.state.cell) &&
        !this.graph.isCellResizable(this.state.cell) &&
        this.state.width < 2 &&
        this.state.height < 2
      ) {
        this.labelShape = this.createSizer(
          mxConstants.CURSOR_MOVABLE_VERTEX,
          mxEvent.LABEL_HANDLE,
          null,
          mxConstants.LABEL_HANDLE_FILLCOLOR,
        );
        this.sizers.push(this.labelShape);
      }
    }

    if (this.isRotationHandleVisible()) {
      this.rotationShape = this.createSizer(
        this.rotationCursor,
        mxEvent.ROTATION_HANDLE,
        mxConstants.HANDLE_SIZE + 3,
        mxConstants.HANDLE_FILLCOLOR,
      );
      this.sizers.push(this.rotationShape);
    }



    this.customHandles = this.createCustomHandles();
    this.redraw();

    if (this.constrainGroupByChildren) {
      this.updateMinBounds();
    }
  }

  isRotationHandleVisible() {
    return (
      this.graph.isEnabled() &&
      this.rotationEnabled &&
      this.graph.isCellRotatable(this.state.cell) &&
      (mxGraphHandler.maxCells <= 0 ||
        this.graph.getSelectionCount() < mxGraphHandler.maxCells)
    );
  }

  isConstrainedEvent(me) {
    return (
      mxEvent.isShiftDown(me.getEvent()) ||
      this.state.style[mxConstants.STYLE_ASPECT] == "fixed"
    );
  }

  isCenteredEvent(state, me) {
    return false;
  }

  createCustomHandles() {
    return null;
  }

  updateMinBounds() {
    var children = this.graph.getChildCells(this.state.cell);

    if (children.length > 0) {
      this.minBounds = this.graph.view.getBounds(children);

      if (this.minBounds != null) {
        var s = this.state.view.scale;
        var t = this.state.view.translate;
        this.minBounds.x -= this.state.x;
        this.minBounds.y -= this.state.y;
        this.minBounds.x /= s;
        this.minBounds.y /= s;
        this.minBounds.width /= s;
        this.minBounds.height /= s;
        this.x0 = this.state.x / s - t.x;
        this.y0 = this.state.y / s - t.y;
      }
    }
  }

  getSelectionBounds(state) {
    return new mxRectangle(
      Math.round(state.x),
      Math.round(state.y),
      Math.round(state.width),
      Math.round(state.height),
    );
  }

  createParentHighlightShape(bounds) {
    return this.createSelectionShape(bounds);
  }

  createSelectionShape(bounds) {
    var shape = new mxRectangleShape(
      mxRectangle.fromRectangle(bounds),
      null,
      this.getSelectionColor(),
    );
    shape.strokewidth = this.getSelectionStrokeWidth();
    shape.isDashed = this.isSelectionDashed();
    return shape;
  }

  getSelectionColor() {
    return mxConstants.VERTEX_SELECTION_COLOR;
  }

  getSelectionStrokeWidth() {
    return mxConstants.VERTEX_SELECTION_STROKEWIDTH;
  }

  isSelectionDashed() {
    return mxConstants.VERTEX_SELECTION_DASHED;
  }

  createSizer(cursor, index, size, fillColor) {
    size = size || mxConstants.HANDLE_SIZE;
    var bounds = new mxRectangle(0, 0, size, size);
    var sizer = this.createSizerShape(bounds, index, fillColor);
    if (
      sizer.isHtmlAllowed() &&
      this.state.text != null &&
      this.state.text.node.parentNode == this.graph.container
    ) {
      sizer.bounds.height -= 1;
      sizer.bounds.width -= 1;
      sizer.dialect = mxConstants.DIALECT_STRICTHTML;
      sizer.init(this.graph.container);
    } else {
      sizer.dialect =
        this.graph.dialect != mxConstants.DIALECT_SVG
          ? mxConstants.DIALECT_MIXEDHTML
          : mxConstants.DIALECT_SVG;
      sizer.init(this.graph.getView().getOverlayPane());
    }
    mxEvent.redirectMouseEvents(sizer.node, this.graph, this.state);

    if (this.graph.isEnabled()) {
      sizer.setCursor(cursor);
    }

    if (!this.isSizerVisible(index)) {
     sizer.visible = false;
    }
    return sizer;
  }

  isSizerVisible(index) {
    return true;
  }

  createSizerShape(bounds, index, fillColor) {
    if (this.handleImage != null) {
      // console.log("createSizerShape A");
      bounds = new mxRectangle(
        bounds.x,
        bounds.y,
        this.handleImage.width,
        this.handleImage.height,
      );
      var shape = new mxImageShape(bounds, this.handleImage.src);
      shape.preserveImageAspect = false;
      return shape;
    } else if (index == mxEvent.ROTATION_HANDLE) {
       //console.log("createSizerShape B");
      return new mxEllipse(
        bounds,
        fillColor || mxConstants.HANDLE_FILLCOLOR,
        mxConstants.HANDLE_STROKECOLOR,
      );
    } else {
      let r =  new mxRectangleShape(
        bounds,
        fillColor || mxConstants.HANDLE_FILLCOLOR,
        mxConstants.HANDLE_STROKECOLOR,
      );
    // console.log(r);
	    return r;
    }
  }

  moveSizerTo(shape, x, y, from) {
    if (shape != null) {
      shape.bounds.x = Math.floor(x - shape.bounds.width / 2);
      shape.bounds.y = Math.floor(y - shape.bounds.height / 2);
//	   if (isNaN(x)) { console.log("#2 x ************ NaN Err",x, "from:", from); }
//	   if (isNaN(y)) { console.log("#2 y ************ NaN Err",y, "from:", from); }


      if (shape.node != null && shape.node.style.display != "none") {
        shape.redraw();
      }
    }
  }

  getHandleForEvent(me) {
    var tol = !mxEvent.isMouseEvent(me.getEvent()) ? this.tolerance : 1;
    var hit =
      this.allowHandleBoundsCheck && tol > 0
        ? new mxRectangle(
            me.getGraphX() - tol,
            me.getGraphY() - tol,
            2 * tol,
            2 * tol,
          )
        : null;

    var checkShape = (shape) => {
      var real =
        shape != null &&
        shape.constructor != mxImageShape &&
        this.allowHandleBoundsCheck
          ? new mxRectangle(
              me.getGraphX() - shape.svgStrokeTolerance,
              me.getGraphY() - shape.svgStrokeTolerance,
              2 * shape.svgStrokeTolerance,
              2 * shape.svgStrokeTolerance,
            )
          : hit;
      return (
        shape != null &&
        (me.isSource(shape) ||
          (real != null &&
            mxUtils.intersects(shape.bounds, real) &&
            shape.node.style.display != "none" &&
            shape.node.style.visibility != "hidden"))
      );
    };

    if (checkShape(this.rotationShape)) {
      return mxEvent.ROTATION_HANDLE;
    } else if (checkShape(this.labelShape)) {
      return mxEvent.LABEL_HANDLE;
    }

    if (this.sizers != null) {
      for (var i = 0; i < this.sizers.length; i++) {
        if (checkShape(this.sizers[i])) {
          return i;
        }
      }
    }

    if (this.customHandles != null && this.isCustomHandleEvent(me)) {
      for (var i = this.customHandles.length - 1; i >= 0; i--) {
        if (checkShape(this.customHandles[i].shape)) {
          return mxEvent.CUSTOM_HANDLE - i;
        }
      }
    }

    return null;
  }

  isCustomHandleEvent(me) {
    return true;
  }

  mouseDown(sender, me) {
    if (!me.isConsumed() && this.graph.isEnabled()) {
      var handle = this.getHandleForEvent(me);

      if (handle != null) {
        this.start(me.getGraphX(), me.getGraphY(), handle);
        me.consume();
      }
    }
  }

  isLivePreviewBorder() {
    return (
      this.state.shape != null &&
      this.state.shape.fill == null &&
      this.state.shape.stroke == null
    );
  }

  start(x, y, index) {
    if (this.selectionBorder != null) {
      this.livePreviewActive =
        this.livePreview &&
        this.graph.model.getChildCount(this.state.cell) == 0;
      this.inTolerance = true;
      this.childOffsetX = 0;
      this.childOffsetY = 0;
      this.index = index;
      this.startX = x;
      this.startY = y;

      if (this.index <= mxEvent.CUSTOM_HANDLE && this.isGhostPreview()) {
        this.ghostPreview = this.createGhostPreview();
      } else {
        var model = this.state.view.graph.model;
        var parent = model.getParent(this.state.cell);

        if (
          this.state.view.currentRoot != parent &&
          (model.isVertex(parent) || model.isEdge(parent))
        ) {
          this.parentState = this.state.view.graph.view.getState(parent);
        }

        this.selectionBorder.node.style.display =
          index == mxEvent.ROTATION_HANDLE ? "inline" : "none";

        if (!this.livePreviewActive || this.isLivePreviewBorder()) {
          this.preview = this.createSelectionShape(this.bounds);

          if (
            !(
              mxClient.IS_SVG &&
              Number(this.state.style[mxConstants.STYLE_ROTATION] || "0") != 0
            ) &&
            this.state.text != null &&
            this.state.text.node.parentNode == this.graph.container
          ) {
            this.preview.dialect = mxConstants.DIALECT_STRICTHTML;
            this.preview.init(this.graph.container);
          } else {
            this.preview.dialect =
              this.graph.dialect != mxConstants.DIALECT_SVG
                ? mxConstants.DIALECT_VML
                : mxConstants.DIALECT_SVG;
            this.preview.init(this.graph.view.getOverlayPane());
          }
        }

        if (index == mxEvent.ROTATION_HANDLE) {
          var pos = this.getRotationHandlePosition();
          var dx = pos.x - this.state.getCenterX();
          var dy = pos.y - this.state.getCenterY();
          this.startAngle =
            dx != 0
              ? (Math.atan(dy / dx) * 180) / Math.PI + 90
              : dy < 0
              ? 180
              : 0;
          this.startDist = Math.sqrt(dx * dx + dy * dy);
        }

        if (this.livePreviewActive) {
          this.hideSizers();

          if (index == mxEvent.ROTATION_HANDLE) {
            this.rotationShape.node.style.display = "";
          } else if (index == mxEvent.LABEL_HANDLE) {
            this.labelShape.node.style.display = "";
          } else if (this.sizers != null && this.sizers[index] != null) {
            this.sizers[index].node.style.display = "";
          } else if (
            index <= mxEvent.CUSTOM_HANDLE &&
            this.customHandles != null
          ) {
            this.customHandles[mxEvent.CUSTOM_HANDLE - index].setVisible(true);
          }

          var edges = this.graph.getEdges(this.state.cell);
          this.edgeHandlers = [];

          for (var i = 0; i < edges.length; i++) {
            var handler = this.graph.selectionCellsHandler.getHandler(edges[i]);

            if (handler != null) {
              this.edgeHandlers.push(handler);
            }
          }
        }
      }
    }
  }

  createGhostPreview() {
    var shape = this.graph.cellRenderer.createShape(this.state);
    shape.init(this.graph.view.getOverlayPane());
    shape.scale = this.state.view.scale;
    shape.bounds = this.bounds;
    shape.outline = true;
    return shape;
  }

  setHandlesVisible(visible) {
    if (this.sizers != null) {
      for (var i = 0; i < this.sizers.length; i++) {
        this.sizers[i].node.style.display = visible ? "" : "none";
      }
    }

    if (this.customHandles != null) {
      for (var i = 0; i < this.customHandles.length; i++) {
        this.customHandles[i].setVisible(visible);
      }
    }
  }

  hideSizers() {
    this.setHandlesVisible(false);
  }

  checkTolerance(me) {
    if (this.inTolerance && this.startX != null && this.startY != null) {
      if (
        mxEvent.isMouseEvent(me.getEvent()) ||
        Math.abs(me.getGraphX() - this.startX) > this.graph.tolerance ||
        Math.abs(me.getGraphY() - this.startY) > this.graph.tolerance
      ) {
        this.inTolerance = false;
      }
    }
  }

  updateHint(me) {}

  removeHint() {}

  roundAngle(angle) {
    return Math.round(angle * 10) / 10;
  }

  roundLength(length) {
    return Math.round(length * 100) / 100;
  }

  mouseMove(sender, me) {
    if (!me.isConsumed() && this.index != null) {
      this.checkTolerance(me);

      if (!this.inTolerance) {
        if (this.index <= mxEvent.CUSTOM_HANDLE) {
          if (this.customHandles != null) {
            this.customHandles[mxEvent.CUSTOM_HANDLE - this.index].processEvent(
              me,
            );
            this.customHandles[
              mxEvent.CUSTOM_HANDLE - this.index
            ].active = true;

            if (this.ghostPreview != null) {
              this.ghostPreview.apply(this.state);
              this.ghostPreview.strokewidth =
                this.getSelectionStrokeWidth() /
                this.ghostPreview.scale /
                this.ghostPreview.scale;
              this.ghostPreview.isDashed = this.isSelectionDashed();
              this.ghostPreview.stroke = this.getSelectionColor();
              this.ghostPreview.redraw();

              if (this.selectionBounds != null) {
                this.selectionBorder.node.style.display = "none";
              }
            } else {
              this.moveToFront();
              this.customHandles[
                mxEvent.CUSTOM_HANDLE - this.index
              ].positionChanged();
            }
          }
        } else if (this.index == mxEvent.LABEL_HANDLE) {
          this.moveLabel(me);
        } else if (this.index == mxEvent.ROTATION_HANDLE) {
          this.rotateVertex(me);
        } else {
          this.resizeVertex(me);
          this.updateHint(me);
        }
      }

      me.consume();
    } else if (!this.graph.isMouseDown && this.getHandleForEvent(me) != null) {
      me.consume(false);
    }
  }

  isGhostPreview() {
    return this.state.view.graph.model.getChildCount(this.state.cell) > 0;
  }

  moveLabel(me) {
    var point = new mxPoint(me.getGraphX(), me.getGraphY());
    var tr = this.graph.view.translate;
    var scale = this.graph.view.scale;

    if (this.graph.isGridEnabledEvent(me.getEvent())) {
      point.x = (this.graph.snap(point.x / scale - tr.x) + tr.x) * scale;
      point.y = (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale;
    }

    var index =
      this.rotationShape != null
        ? this.sizers.length - 2
        : this.sizers.length - 1;
    this.moveSizerTo(this.sizers[index], point.x, point.y, "A");
  }

  rotateVertex(me) {
    var point = new mxPoint(me.getGraphX(), me.getGraphY());
    var dx = this.state.x + this.state.width / 2 - point.x;
    var dy = this.state.y + this.state.height / 2 - point.y;
    this.currentAlpha =
      dx != 0 ? (Math.atan(dy / dx) * 180) / Math.PI + 90 : dy < 0 ? 180 : 0;

    if (dx > 0) {
      this.currentAlpha -= 180;
    }

    this.currentAlpha -= this.startAngle;

    if (this.rotationRaster && this.graph.isGridEnabledEvent(me.getEvent())) {
      var dx = point.x - this.state.getCenterX();
      var dy = point.y - this.state.getCenterY();
      var dist = Math.sqrt(dx * dx + dy * dy);
      var raster;

      if (dist - this.startDist < 2) {
        raster = 15;
      } else if (dist - this.startDist < 25) {
        raster = 5;
      } else {
        raster = 1;
      }

      this.currentAlpha = Math.round(this.currentAlpha / raster) * raster;
    } else {
      this.currentAlpha = this.roundAngle(this.currentAlpha);
    }

    this.selectionBorder.rotation = this.currentAlpha;
    this.selectionBorder.redraw();

    if (this.livePreviewActive) {
      this.redrawHandles();
    }
  }

  resizeVertex(me) {
    var ct = new mxPoint(this.state.getCenterX(), this.state.getCenterY());
    var alpha = mxUtils.toRadians(
      this.state.style[mxConstants.STYLE_ROTATION] || "0",
    );
    var point = new mxPoint(me.getGraphX(), me.getGraphY());
    var tr = this.graph.view.translate;
    var scale = this.graph.view.scale;
    var cos = Math.cos(-alpha);
    var sin = Math.sin(-alpha);
    var dx = point.x - this.startX;
    var dy = point.y - this.startY;
    var tx = cos * dx - sin * dy;
    var ty = sin * dx + cos * dy;
    dx = tx;
    dy = ty;
    var geo = this.graph.getCellGeometry(this.state.cell);
    this.unscaledBounds = this.union(
      geo,
      dx / scale,
      dy / scale,
      this.index,
      this.graph.isGridEnabledEvent(me.getEvent()),
      1,
      new mxPoint(0, 0),
      this.isConstrainedEvent(me),
      this.isCenteredEvent(this.state, me),
    );

    if (!geo.relative) {
      var max = this.graph.getMaximumGraphBounds();

      if (max != null && this.parentState != null) {
        max = mxRectangle.fromRectangle(max);
        max.x -= (this.parentState.x - tr.x * scale) / scale;
        max.y -= (this.parentState.y - tr.y * scale) / scale;
      }

      if (this.graph.isConstrainChild(this.state.cell)) {
        var tmp = this.graph.getCellContainmentArea(this.state.cell);

        if (tmp != null) {
          var overlap = this.graph.getOverlap(this.state.cell);

          if (overlap > 0) {
            tmp = mxRectangle.fromRectangle(tmp);
            tmp.x -= tmp.width * overlap;
            tmp.y -= tmp.height * overlap;
            tmp.width += 2 * tmp.width * overlap;
            tmp.height += 2 * tmp.height * overlap;
          }

          if (max == null) {
            max = tmp;
          } else {
            max = mxRectangle.fromRectangle(max);
            max.intersect(tmp);
          }
        }
      }

      if (max != null) {
        if (this.unscaledBounds.x < max.x) {
          this.unscaledBounds.width -= max.x - this.unscaledBounds.x;
          this.unscaledBounds.x = max.x;
        }

        if (this.unscaledBounds.y < max.y) {
          this.unscaledBounds.height -= max.y - this.unscaledBounds.y;
          this.unscaledBounds.y = max.y;
        }

        if (
          this.unscaledBounds.x + this.unscaledBounds.width >
          max.x + max.width
        ) {
          this.unscaledBounds.width -=
            this.unscaledBounds.x +
            this.unscaledBounds.width -
            max.x -
            max.width;
        }

        if (
          this.unscaledBounds.y + this.unscaledBounds.height >
          max.y + max.height
        ) {
          this.unscaledBounds.height -=
            this.unscaledBounds.y +
            this.unscaledBounds.height -
            max.y -
            max.height;
        }
      }
    }

    var old = this.bounds;
    this.bounds = new mxRectangle(
      Number((this.parentState != null ? this.parentState.x : tr.x * scale) +
        this.unscaledBounds.x * scale),
      Number((this.parentState != null ? this.parentState.y : tr.y * scale) +
        this.unscaledBounds.y * scale),
      this.unscaledBounds.width * scale,
      this.unscaledBounds.height * scale,
    );

    if (geo.relative && this.parentState != null) {
      this.bounds.x += this.state.x - this.parentState.x;
      this.bounds.y += this.state.y - this.parentState.y;
    }

    cos = Math.cos(alpha);
    sin = Math.sin(alpha);
    var c2 = new mxPoint(this.bounds.getCenterX(), this.bounds.getCenterY());
    var dx = c2.x - ct.x;
    var dy = c2.y - ct.y;
    var dx2 = cos * dx - sin * dy;
    var dy2 = sin * dx + cos * dy;
    var dx3 = dx2 - dx;
    var dy3 = dy2 - dy;
    var dx4 = this.bounds.x - this.state.x;
    var dy4 = this.bounds.y - this.state.y;
    var dx5 = cos * dx4 - sin * dy4;
    var dy5 = sin * dx4 + cos * dy4;
    this.bounds.x += dx3;
    this.bounds.y += dy3;
    this.unscaledBounds.x = this.roundLength(
      this.unscaledBounds.x + dx3 / scale,
    );
    this.unscaledBounds.y = this.roundLength(
      this.unscaledBounds.y + dy3 / scale,
    );
    this.unscaledBounds.width = this.roundLength(this.unscaledBounds.width);
    this.unscaledBounds.height = this.roundLength(this.unscaledBounds.height);

    if (
      !this.graph.isCellCollapsed(this.state.cell) &&
      (dx3 != 0 || dy3 != 0)
    ) {
      this.childOffsetX = this.state.x - this.bounds.x + dx5;
      this.childOffsetY = this.state.y - this.bounds.y + dy5;
    } else {
      this.childOffsetX = 0;
      this.childOffsetY = 0;
    }

    if (!old.equals(this.bounds)) {
      if (this.livePreviewActive) {
        this.updateLivePreview(me);
      }

      if (this.preview != null) {
        this.drawPreview();
      } else {
        this.updateParentHighlight();
      }
    }
  }

  updateLivePreview(me) {
    var scale = this.graph.view.scale;
    var tr = this.graph.view.translate;
    var tempState = this.state.clone();
    this.state.x = this.bounds.x;
    this.state.y = this.bounds.y;
    this.state.origin = new mxPoint(
      this.state.x / scale - tr.x,
      this.state.y / scale - tr.y,
    );
    this.state.width = this.bounds.width;
    this.state.height = this.bounds.height;
    var off = this.state.absoluteOffset;
    off = new mxPoint(off.x, off.y);
    this.state.absoluteOffset.x = 0;
    this.state.absoluteOffset.y = 0;
    var geo = this.graph.getCellGeometry(this.state.cell);

    if (geo != null) {
      var offset = geo.offset || this.EMPTY_POINT;

      if (offset != null && !geo.relative) {
        this.state.absoluteOffset.x = this.state.view.scale * offset.x;
        this.state.absoluteOffset.y = this.state.view.scale * offset.y;
      }

      this.state.view.updateVertexLabelOffset(this.state);
    }

    this.state.view.graph.cellRenderer.redraw(this.state, true);
    this.state.view.invalidate(this.state.cell);
    this.state.invalid = false;
    this.state.view.validate();
    this.redrawHandles();
    this.moveToFront();

    if (this.state.control != null && this.state.control.node != null) {
      this.state.control.node.style.visibility = "hidden";
    }

    this.state.setState(tempState);
  }

  moveToFront() {
    if (
      (this.state.text != null &&
        this.state.text.node != null &&
        this.state.text.node.nextSibling != null) ||
      (this.state.shape != null &&
        this.state.shape.node != null &&
        this.state.shape.node.nextSibling != null &&
        (this.state.text == null ||
          this.state.shape.node.nextSibling != this.state.text.node))
    ) {
      if (this.state.shape != null && this.state.shape.node != null) {
        this.state.shape.node.parentNode.appendChild(this.state.shape.node);
      }

      if (this.state.text != null && this.state.text.node != null) {
        this.state.text.node.parentNode.appendChild(this.state.text.node);
      }
    }
  }

  mouseUp(sender, me) {
    if (this.index != null && this.state != null) {
      var point = new mxPoint(me.getGraphX(), me.getGraphY());
      var index = this.index;
      this.index = null;

      if (this.ghostPreview == null) {
        this.state.view.invalidate(this.state.cell, false, false);
        this.state.view.validate();
      }

      this.graph.getModel().beginUpdate();

      try {
        if (index <= mxEvent.CUSTOM_HANDLE) {
          if (this.customHandles != null) {
            var style = this.state.view.graph.getCellStyle(this.state.cell);
            this.customHandles[mxEvent.CUSTOM_HANDLE - index].active = false;
            this.customHandles[mxEvent.CUSTOM_HANDLE - index].execute(me);

            if (
              this.customHandles != null &&
              this.customHandles[mxEvent.CUSTOM_HANDLE - index] != null
            ) {
              this.state.style = style;
              this.customHandles[
                mxEvent.CUSTOM_HANDLE - index
              ].positionChanged();
            }
          }
        } else if (index == mxEvent.ROTATION_HANDLE) {
          if (this.currentAlpha != null) {
            var delta =
              this.currentAlpha -
              (this.state.style[mxConstants.STYLE_ROTATION] || 0);

            if (delta != 0) {
              this.rotateCell(this.state.cell, delta);
            }
          } else {
            this.rotateClick();
          }
        } else {
          var gridEnabled = this.graph.isGridEnabledEvent(me.getEvent());
          var alpha = mxUtils.toRadians(
            this.state.style[mxConstants.STYLE_ROTATION] || "0",
          );
          var cos = Math.cos(-alpha);
          var sin = Math.sin(-alpha);
          var dx = point.x - this.startX;
          var dy = point.y - this.startY;
          var tx = cos * dx - sin * dy;
          var ty = sin * dx + cos * dy;
          dx = tx;
          dy = ty;
          var s = this.graph.view.scale;
          var recurse = this.isRecursiveResize(this.state, me);
          this.resizeCell(
            this.state.cell,
            this.roundLength(dx / s),
            this.roundLength(dy / s),
            index,
            gridEnabled,
            this.isConstrainedEvent(me),
            recurse,
          );
        }
      } finally {
        this.graph.getModel().endUpdate();
      }

      me.consume();
      this.reset();
    }
  }

  isRecursiveResize(state, me) {
    return this.graph.isRecursiveResize(this.state);
  }

  rotateClick() {}

  rotateCell(cell, angle, parent) {
    if (angle != 0) {
      var model = this.graph.getModel();

      if (model.isVertex(cell) || model.isEdge(cell)) {
        if (!model.isEdge(cell)) {
          var style = this.graph.getCurrentCellStyle(cell);
          var total = (style[mxConstants.STYLE_ROTATION] || 0) + angle;
          this.graph.setCellStyles(mxConstants.STYLE_ROTATION, total, [cell]);
        }

        var geo = this.graph.getCellGeometry(cell);

        if (geo != null) {
          var pgeo = this.graph.getCellGeometry(parent);

          if (pgeo != null && !model.isEdge(parent)) {
            geo = geo.clone();
            geo.rotate(angle, new mxPoint(pgeo.width / 2, pgeo.height / 2));
            model.setGeometry(cell, geo);
          }

          if ((model.isVertex(cell) && !geo.relative) || model.isEdge(cell)) {
            var childCount = model.getChildCount(cell);

            for (var i = 0; i < childCount; i++) {
              this.rotateCell(model.getChildAt(cell, i), angle, cell);
            }
          }
        }
      }
    }
  }

  reset() {
    if (
      this.sizers != null &&
      this.index != null &&
      this.sizers[this.index] != null &&
      this.sizers[this.index].node.style.display == "none"
    ) {
      this.sizers[this.index].node.style.display = "";
    }

    this.currentAlpha = null;
    this.inTolerance = null;
    this.index = null;

    if (this.preview != null) {
      this.preview.destroy();
      this.preview = null;
    }

    if (this.ghostPreview != null) {
      this.ghostPreview.destroy();
      this.ghostPreview = null;
    }

    if (this.livePreviewActive && this.sizers != null) {
      for (var i = 0; i < this.sizers.length; i++) {
        if (this.sizers[i] != null) {
          this.sizers[i].node.style.display = "";
        }
      }

      if (this.state.control != null && this.state.control.node != null) {
        this.state.control.node.style.visibility = "";
      }
    }

    if (this.customHandles != null) {
      for (var i = 0; i < this.customHandles.length; i++) {
        if (this.customHandles[i].active) {
          this.customHandles[i].active = false;
          this.customHandles[i].reset();
        } else {
          this.customHandles[i].setVisible(true);
        }
      }
    }

    if (this.selectionBorder != null) {
      this.selectionBorder.node.style.display = "inline";
      this.selectionBounds = this.getSelectionBounds(this.state);
      this.bounds = new mxRectangle(
        this.selectionBounds.x,
        this.selectionBounds.y,
        this.selectionBounds.width,
        this.selectionBounds.height,
      );
      this.drawPreview();
    }

    this.removeHint();
    this.redrawHandles();
    this.edgeHandlers = null;
    this.unscaledBounds = null;
    this.livePreviewActive = null;
  }

  resizeCell(cell, dx, dy, index, gridEnabled, constrained, recurse) {
    var geo = this.graph.model.getGeometry(cell);

    if (geo != null) {
      if (index == mxEvent.LABEL_HANDLE) {
        var alpha = -mxUtils.toRadians(
          this.state.style[mxConstants.STYLE_ROTATION] || "0",
        );
        var cos = Math.cos(alpha);
        var sin = Math.sin(alpha);
        var scale = this.graph.view.scale;
        var pt = mxUtils.getRotatedPoint(
          new mxPoint(
            Math.round(
              (this.labelShape.bounds.getCenterX() - this.startX) / scale,
            ),
            Math.round(
              (this.labelShape.bounds.getCenterY() - this.startY) / scale,
            ),
          ),
          cos,
          sin,
        );
        geo = geo.clone();

        if (geo.offset == null) {
          geo.offset = pt;
        } else {
          geo.offset.x += pt.x;
          geo.offset.y += pt.y;
        }

        this.graph.model.setGeometry(cell, geo);
      } else if (this.unscaledBounds != null) {
        var scale = this.graph.view.scale;

        if (this.childOffsetX != 0 || this.childOffsetY != 0) {
          this.moveChildren(
            cell,
            Math.round(this.childOffsetX / scale),
            Math.round(this.childOffsetY / scale),
          );
        }

        this.graph.resizeCell(cell, this.unscaledBounds, recurse);
      }
    }
  }

  moveChildren(cell, dx, dy) {
    var model = this.graph.getModel();
    var childCount = model.getChildCount(cell);

    for (var i = 0; i < childCount; i++) {
      var child = model.getChildAt(cell, i);
      var geo = this.graph.getCellGeometry(child);

      if (geo != null) {
        geo = geo.clone();
        geo.translate(dx, dy);
        model.setGeometry(child, geo);
      }
    }
  }

  union(bounds, dx, dy, index, gridEnabled, scale, tr, constrained, centered) {
    gridEnabled =
      gridEnabled != null
        ? gridEnabled && this.graph.gridEnabled
        : this.graph.gridEnabled;

    if (this.singleSizer) {
      var x = bounds.x + bounds.width + dx;
      var y = bounds.y + bounds.height + dy;

      if (gridEnabled) {
        x = this.graph.snap(x / scale) * scale;
        y = this.graph.snap(y / scale) * scale;
      }

      var rect = new mxRectangle(bounds.x, bounds.y, 0, 0);
      rect.add(new mxRectangle(x, y, 0, 0));
      return rect;
    } else {
      var w0 = bounds.width;
      var h0 = bounds.height;
      var left = bounds.x - tr.x * scale;
      var right = left + w0;
      var top = bounds.y - tr.y * scale;
      var bottom = top + h0;
      var cx = left + w0 / 2;
      var cy = top + h0 / 2;

      if (index > 4) {
        bottom = bottom + dy;

        if (gridEnabled) {
          bottom = this.graph.snap(bottom / scale) * scale;
        } else {
          bottom = Math.round(bottom / scale) * scale;
        }
      } else if (index < 3) {
        top = top + dy;

        if (gridEnabled) {
          top = this.graph.snap(top / scale) * scale;
        } else {
          top = Math.round(top / scale) * scale;
        }
      }

      if (index == 0 || index == 3 || index == 5) {
        left += dx;

        if (gridEnabled) {
          left = this.graph.snap(left / scale) * scale;
        } else {
          left = Math.round(left / scale) * scale;
        }
      } else if (index == 2 || index == 4 || index == 7) {
        right += dx;

        if (gridEnabled) {
          right = this.graph.snap(right / scale) * scale;
        } else {
          right = Math.round(right / scale) * scale;
        }
      }

      var width = right - left;
      var height = bottom - top;

      if (constrained) {
        var geo = this.graph.getCellGeometry(this.state.cell);

        if (geo != null) {
          var aspect = geo.width / geo.height;

          if (index == 1 || index == 2 || index == 7 || index == 6) {
            width = height * aspect;
          } else {
            height = width / aspect;
          }

          if (index == 0) {
            left = right - width;
            top = bottom - height;
          }
        }
      }

      if (centered) {
        width += width - w0;
        height += height - h0;
        var cdx = cx - (left + width / 2);
        var cdy = cy - (top + height / 2);
        left += cdx;
        top += cdy;
        right += cdx;
        bottom += cdy;
      }

      if (width < 0) {
        left += width;
        width = Math.abs(width);
      }

      if (height < 0) {
        top += height;
        height = Math.abs(height);
      }

      var result = new mxRectangle(
        left + tr.x * scale,
        top + tr.y * scale,
        width,
        height,
      );

      if (this.minBounds != null) {
        result.width = Math.max(
          result.width,
          this.minBounds.x * scale +
            this.minBounds.width * scale +
            Math.max(0, this.x0 * scale - result.x),
        );
        result.height = Math.max(
          result.height,
          this.minBounds.y * scale +
            this.minBounds.height * scale +
            Math.max(0, this.y0 * scale - result.y),
        );
      }

      return result;
    }
  }

  redraw(ignoreHandles) {
    this.selectionBounds = this.getSelectionBounds(this.state);
    this.bounds = new mxRectangle(
      this.selectionBounds.x,
      this.selectionBounds.y,
      this.selectionBounds.width,
      this.selectionBounds.height,
    );
    this.drawPreview();

    if (!ignoreHandles) {
      this.redrawHandles();
    }
  }

  getHandlePadding() {
    var result = new mxPoint(0, 0);
    var tol = this.tolerance;
    //console.log("tol", tol);
    if (
      this.sizers != null &&
      this.sizers.length > 0 &&
      this.sizers[0] != null &&
      (this.bounds.width < 2 * this.sizers[0].bounds.width + 2 * tol ||
        this.bounds.height < 2 * this.sizers[0].bounds.height + 2 * tol)
    ) {
      tol /= 2;
      result.x = this.sizers[0].bounds.width + tol;
      result.y = this.sizers[0].bounds.height + tol;
    }

    return result;
  }

  getSizerBounds() {
    return this.bounds;
  }

  redrawHandles() {
    var s = this.getSizerBounds();
    var tol = this.tolerance;
    this.horizontalOffset = 0;
    this.verticalOffset = 0;
/*  
    if (this.customHandles != null) {
      for (var i = 0; i < this.customHandles.length; i++) {
        var temp = this.customHandles[i].shape.node.style.display;
        this.customHandles[i].redraw();
        this.customHandles[i].shape.node.style.display = temp;
        this.customHandles[i].shape.node.style.visibility =
          this.isCustomHandleVisible(this.customHandles[i]) ? "" : "hidden";
      }
    }
*/

//console.log(this.state.view.scale )
if (this.state.view.scale >= 0.8) {  // GUSA  GS

    try {
    if (this.customHandles != null) {
      for (var i = 0; i < this.customHandles.length; i++) {
        var temp = this.customHandles[i].shape.node.style.display;
        this.customHandles[i].redraw();
        this.customHandles[i].shape.node.style.display = temp;
        this.customHandles[i].shape.node.style.visibility =
          this.isCustomHandleVisible(this.customHandles[i]) ? "" : "hidden";
      }
    }

    } catch (error) {
      console.log("ERROR", error);
    }
} //GUSA
    if (
      this.sizers != null &&
      this.sizers.length > 0 &&
      this.sizers[0] != null
    ) {
      if (this.index == null && this.manageSizers && this.sizers.length >= 8) {
        var padding = this.getHandlePadding();
        //console.log("padding",padding);
        this.horizontalOffset = padding.x;
        this.verticalOffset = padding.y;
        //console.log("horizontalOffset",this.horizontalOffset);
        //console.log("tarticalOffset",this.verticalOffset);
        if (this.horizontalOffset != 0 || this.verticalOffset != 0) {
          s = new mxRectangle(s.x, s.y, s.width, s.height);
          s.x -= this.horizontalOffset / 2;
          s.width += this.horizontalOffset;
          s.y -= this.verticalOffset / 2;
          s.height += this.verticalOffset;
        }

        if (this.sizers.length >= 8) {
          if (
            s.width < 2 * this.sizers[0].bounds.width + 2 * tol ||
            s.height < 2 * this.sizers[0].bounds.height + 2 * tol
          ) {
            this.sizers[0].node.style.display = "none";
            this.sizers[2].node.style.display = "none";
            this.sizers[5].node.style.display = "none";
            this.sizers[7].node.style.display = "none";
          } else {
            this.sizers[0].node.style.display = "";
            this.sizers[2].node.style.display = "";
            this.sizers[5].node.style.display = "";
            this.sizers[7].node.style.display = "";
          }
        }
      }

      var r = s.x + s.width;
      var b = s.y + s.height;

      if (this.singleSizer) {
        this.moveSizerTo(this.sizers[0], r, b, "B");
      } else {
        var cx = s.x + s.width / 2;
        var cy = s.y + s.height / 2;

        if (this.sizers.length >= 8) {
          var crs = [
            "nw-resize",
            "n-resize",
            "ne-resize",
            "e-resize",
            "se-resize",
            "s-resize",
            "sw-resize",
            "w-resize",
          ];

          var alpha = mxUtils.toRadians(
            this.state.style[mxConstants.STYLE_ROTATION] || "0",
          );
          var cos = Math.cos(alpha);
          var sin = Math.sin(alpha);
          var da = Math.round((alpha * 4) / Math.PI);
          var ct = new mxPoint(s.getCenterX(), s.getCenterY());
          var pt = mxUtils.getRotatedPoint(new mxPoint(s.x, s.y), cos, sin, ct);
          this.moveSizerTo(this.sizers[0], pt.x, pt.y, "C");
          this.sizers[0].setCursor(crs[mxUtils.mod(0 + da, crs.length)]);
          pt.x = cx;
          pt.y = s.y;
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[1], pt.x, pt.y, "D");
          this.sizers[1].setCursor(crs[mxUtils.mod(1 + da, crs.length)]);
          pt.x = r;
          pt.y = s.y;
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[2], pt.x, pt.y, "E");
          this.sizers[2].setCursor(crs[mxUtils.mod(2 + da, crs.length)]);
          pt.x = s.x;
          pt.y = cy;
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[3], pt.x, pt.y, "F");
          this.sizers[3].setCursor(crs[mxUtils.mod(7 + da, crs.length)]);
          pt.x = r;
          pt.y = cy;
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[4], pt.x, pt.y, "G");
          this.sizers[4].setCursor(crs[mxUtils.mod(3 + da, crs.length)]);
          pt.x = s.x;
          pt.y = b;
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[5], pt.x, pt.y, "H");
          this.sizers[5].setCursor(crs[mxUtils.mod(6 + da, crs.length)]);
          pt.x = cx;
          pt.y = b;
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[6], pt.x, pt.y, "I");
          this.sizers[6].setCursor(crs[mxUtils.mod(5 + da, crs.length)]);
          pt.x = r;
          pt.y = b;
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[7], pt.x, pt.y, "J");
          this.sizers[7].setCursor(crs[mxUtils.mod(4 + da, crs.length)]);
          pt.x = cx + this.state.absoluteOffset.x;
          pt.y = cy + this.state.absoluteOffset.y;
          pt = mxUtils.getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[8], pt.x, pt.y, "K");
        } else if (this.state.width >= 2 && this.state.height >= 2) {
		
          this.moveSizerTo(
            this.sizers[0],
            cx + this.state.absoluteOffset.x,
            cy + this.state.absoluteOffset.y,
		  "L"
          );
	  
        } else {
	
          this.moveSizerTo(this.sizers[0], this.state.x, this.state.y, "M");
	  
        }
      }
    }

    if (this.rotationShape != null) {
      var alpha = mxUtils.toRadians(
        this.currentAlpha != null
          ? this.currentAlpha
          : this.state.style[mxConstants.STYLE_ROTATION] || "0",
      );
      var cos = Math.cos(alpha);
      var sin = Math.sin(alpha);
      var ct = new mxPoint(this.state.getCenterX(), this.state.getCenterY());
      var pt = mxUtils.getRotatedPoint(
        this.getRotationHandlePosition(),
        cos,
        sin,
        ct,
      );

      if (this.rotationShape.node != null) {
        this.moveSizerTo(this.rotationShape, pt.x, pt.y, "M");
        this.rotationShape.node.style.visibility =
          this.state.view.graph.isEditing() ? "hidden" : "";
      }
    }

    if (this.selectionBorder != null) {
      this.selectionBorder.rotation = Number(
        this.state.style[mxConstants.STYLE_ROTATION] || "0",
      );
    }

    if (this.edgeHandlers != null) {
      for (var i = 0; i < this.edgeHandlers.length; i++) {
        this.edgeHandlers[i].redraw();
      }
    }
  }

  isCustomHandleVisible(handle) {
    return (
      !this.graph.isEditing() && this.state.view.graph.getSelectionCount() == 1
    );
  }

  getRotationHandlePosition() {
    return new mxPoint(
      this.bounds.x + this.bounds.width / 2,
      this.bounds.y + this.rotationHandleVSpacing,
    );
  }

  isParentHighlightVisible() {
    return true;
  }

  updateParentHighlight() {
    if (this.selectionBorder != null && this.isParentHighlightVisible()) {
      if (this.parentHighlight != null) {
        var parent = this.graph.model.getParent(this.state.cell);

        if (this.graph.model.isVertex(parent)) {
          var pstate = this.graph.view.getState(parent);
          var b = this.parentHighlight.bounds;

          if (
            pstate != null &&
            (b.x != pstate.x ||
              b.y != pstate.y ||
              b.width != pstate.width ||
              b.height != pstate.height)
          ) {
            this.parentHighlight.bounds = mxRectangle.fromRectangle(pstate);
            this.parentHighlight.redraw();
          }
        } else {
          this.parentHighlight.destroy();
          this.parentHighlight = null;
        }
      } else if (this.parentHighlightEnabled) {
        var parent = this.graph.model.getParent(this.state.cell);

        if (this.graph.model.isVertex(parent)) {
          var pstate = this.graph.view.getState(parent);

          if (pstate != null) {
            this.parentHighlight = this.createParentHighlightShape(pstate);
            this.parentHighlight.dialect =
              this.graph.dialect != mxConstants.DIALECT_SVG
                ? mxConstants.DIALECT_VML
                : mxConstants.DIALECT_SVG;
            this.parentHighlight.pointerEvents = false;
            this.parentHighlight.rotation = Number(
              pstate.style[mxConstants.STYLE_ROTATION] || "0",
            );
            this.parentHighlight.init(this.graph.getView().getOverlayPane());
            this.parentHighlight.redraw();
          }
        }
      }
    }
  }

  drawPreview() {
    if (this.preview != null) {
      this.preview.bounds = this.bounds;

      if (this.preview.node.parentNode == this.graph.container) {
        this.preview.bounds.width = Math.max(0, this.preview.bounds.width - 1);
        this.preview.bounds.height = Math.max(
          0,
          this.preview.bounds.height - 1,
        );
      }

      this.preview.rotation = Number(
        this.state.style[mxConstants.STYLE_ROTATION] || "0",
      );
      this.preview.redraw();
    }

    this.selectionBorder.bounds = this.getSelectionBorderBounds();
    this.selectionBorder.redraw();
    this.updateParentHighlight();
  }

  getSelectionBorderBounds() {
    return this.bounds;
  }

  destroy() {
    if (this.escapeHandler != null) {
      this.state.view.graph.removeListener(this.escapeHandler);
      this.escapeHandler = null;
    }

    if (this.preview != null) {
      this.preview.destroy();
      this.preview = null;
    }

    if (this.parentHighlight != null) {
      this.parentHighlight.destroy();
      this.parentHighlight = null;
    }

    if (this.ghostPreview != null) {
      this.ghostPreview.destroy();
      this.ghostPreview = null;
    }

    if (this.selectionBorder != null) {
      this.selectionBorder.destroy();
      this.selectionBorder = null;
    }

    this.labelShape = null;
    this.removeHint();

    if (this.sizers != null) {
      for (var i = 0; i < this.sizers.length; i++) {
        this.sizers[i].destroy();
      }

      this.sizers = null;
    }

    if (this.customHandles != null) {
      for (var i = 0; i < this.customHandles.length; i++) {
        this.customHandles[i].destroy();
      }

      this.customHandles = null;
    }
  }
}
