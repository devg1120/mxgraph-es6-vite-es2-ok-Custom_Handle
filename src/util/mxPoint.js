export class mxPoint {
  constructor(x, y) {
    this.x = x != null ? x : 0;
    this.y = y != null ? y : 0;
  }

  equals(obj) {
    return obj != null && obj.x == this.x && obj.y == this.y;
  }

  clone() {
    //console.log("mxPoint clone");
    return cloneObj(this);
    ///let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    //return clone;
  }
}

function cloneObj(obj, transients, shallow) {
  shallow = shallow != null ? shallow : false;
  var clone = null;

  if (obj != null && typeof obj.constructor == "function") {
    clone = new obj.constructor();

    for (var i in obj) {
      if (
        i != "mxObjectId" &&
        (transients == null || transients.indexOf(i) < 0)
      ) {
        if (!shallow && typeof obj[i] == "object") {
          clone[i] = cloneObj(obj[i]);
        } else {
          clone[i] = obj[i];
        }
      }
    }
  }

  return clone;
}
