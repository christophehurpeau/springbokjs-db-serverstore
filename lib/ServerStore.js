"use strict";

var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

var AbstractStore = require("springbokjs-db/lib/AbstractStore").AbstractStore;
var webSocket = require("springbokjs-browser/webSocket");
var Cursor = require("./Cursor").Cursor;

var ServerStore = (function (AbstractStore) {
  var ServerStore = function ServerStore() {
    AbstractStore.apply(this, arguments);
  };

  _extends(ServerStore, AbstractStore);

  ServerStore.prototype.initialize = function () {};

  ServerStore.prototype.store = function () {};

  ServerStore.prototype.findOne = function (query, options) {
    var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
    return webSocket.emit("db findOne", this.db.dbName, modelName, query, options);
  };

  ServerStore.prototype.insert = function (options) {
    var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
    return webSocket.emit("db insert", this.db.dbName, modelName, options).then(function (result) {
      if (result) {
        Object.assign(options.fullData, result);
      }
    });
  };

  ServerStore.prototype.update = function (options) {
    throw new Error();
  };

  ServerStore.prototype["delete"] = function (options) {
    throw new Error();
  };

  ServerStore.prototype.cursor = function (query, options) {
    var _this = this;
    var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
    return webSocket.emit("db cursor", this.db.dbName, modelName, query, options).then(function (idCursor) {
      if (!idCursor) {
        return;
      }
      return new Cursor(idCursor, _this, query);
    });
  };

  ServerStore.prototype.subscribe = function (listeners) {
    var _this2 = this;
    var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
    return webSocket.emit("subscribe", this.db.dbName, modelName, listeners.query).then(function (listenerId) {
      listeners.listenerId = listenerId;
      console.log("listing for: " + listenerId + " event");
      webSocket.on(listenerId + " event", function (result) {
        var type = result.type;
        var data = result.data;
        console.log("received event", type, data);
        if (listeners[type]) {
          listeners[type](_this2.toVO(data));
        }
      });
    });
  };

  ServerStore.prototype.unsubscribe = function (listeners) {
    webSocket.off(listeners.listenerId + " event");
    return webSocket.emit("unsubscribe " + listeners.listenerId);
  };

  return ServerStore;
})(AbstractStore);

exports.ServerStore = ServerStore;


ServerStore.initialize = function (db) {
  return Promise.resolve();
};
//# sourceMappingURL=ServerStore.js.map