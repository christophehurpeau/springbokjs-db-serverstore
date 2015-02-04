"use strict";

var _classProps = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

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

var AbstractCursor = require("springbokjs-db/lib/AbstractCursor").AbstractCursor;
var webSocket = require("springbokjs-browser/webSocket");

var Cursor = (function (AbstractCursor) {
  var Cursor = function Cursor(idCursor, store, query) {
    this._idCursor = idCursor;
    this._store = store;
    this._query = query;
  };

  _extends(Cursor, AbstractCursor);

  Cursor.prototype.advance = function (count) {
    webSocket.emit("db cursor " + this._idCursor, "advance", count);
    return this;
  };

  Cursor.prototype.next = function () {
    var _this = this;
    return webSocket.emit("db cursor " + this._idCursor, "next").then(function (result) {
      _this._result = result;
      _this.primaryKey = _this.key = result && result[_this._store.keyPath];
      return _this.key;
    });
  };

  Cursor.prototype.result = function () {
    return Promise.resolve(this._result);
  };

  Cursor.prototype.remove = function () {
    return this._store.deleteByKey(this.key);
  };

  Cursor.prototype.forEachKeys = function (callback) {
    var _this2 = this;
    var promise = Promise.resolve();
    webSocket.on("db cursor forEach " + this._idCursor, function (result) {
      if (!result) {
        return promise.then(function () {
          return _this2.close();
        }).then(resolve);
      }
      promise.then(function () {
        _this2._result = result;
        _this2.primaryKey = _this2.key = result && result[_this2._store.keyPath];
        return callback(_this2.key);
      });
    });
    return webSocket.emit("db cursor " + this._idCursor, "forEach").then(function () {
      webSocket.off("db cursor forEach " + _this2._idCursor);
      return promise;
    });
  };

  Cursor.prototype.close = function () {
    var _this3 = this;
    return webSocket.emit("db cursor " + this._idCursor, "close").then(function () {
      _this3._result = _this3._store = _this3._idCursor = undefined;
    });
  };

  _classProps(Cursor, null, {
    query: {
      get: function () {
        return this._query;
      }
    }
  });

  return Cursor;
})(AbstractCursor);

exports.Cursor = Cursor;
//# sourceMappingURL=Cursor.js.map