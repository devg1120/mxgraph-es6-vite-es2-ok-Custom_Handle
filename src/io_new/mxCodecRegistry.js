import { mxObjectCodec } from "@mxgraph/io/mxObjectCodec";
import { mxUtils } from "@mxgraph/util/mxUtils";

export class mxCodecRegistry {
  static codecs = [];
  static aliases = [];

  static register(codec) {
    if (codec != null) {
      var name = codec.getName();
      //console.log("mxCodecRegistry::register", name);
      mxCodecRegistry.codecs[name] = codec;
      var classname = mxUtils.getFunctionName(codec.template.constructor);

      if (classname != name) {
        mxCodecRegistry.addAlias(classname, name);
      }
    }

    return codec;
  }

  static addAlias(classname, codecname) {
    mxCodecRegistry.aliases[classname] = codecname;
  }

  static getCodec_org(ctor) {
    //	  console.log("mxCodecRegistry::getCodec", ctor);
    var codec = null;

    if (ctor != null) {
      var name = mxUtils.getFunctionName(ctor);
      var tmp = mxCodecRegistry.aliases[name];

      if (tmp != null) {
        name = tmp;
      }

      codec = mxCodecRegistry.codecs[name];
      //codec = mxCodecRegistry.codecs[ctor];

      if (codec == null) {
        try {
          codec = new mxObjectCodec(new ctor());
          mxCodecRegistry.register(codec);
        } catch (e) {
          /* ignore */
        }
      }
    }

    return codec;
  }

  static getCodec(name) {
    //	  console.log("mxCodecRegistry::getCodec", ctor);
    var codec = null;

    codec = mxCodecRegistry.codecs[name];
    //codec = mxCodecRegistry.codecs[ctor];

    if (codec == null) {
      try {
        let classname = name;
        let obj = eval("new " + classname + "()");
        codec = new mxObjectCodec(obj);
        mxCodecRegistry.register(codec);
      } catch (e) {
        /* ignore */
      }
    }

    return codec;
  }
}
