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
  var Cursor = function Cursor(idCursor, store) {
    this._idCursor = idCursor;
    this._store = store;
  };

  _extends(Cursor, AbstractCursor);

  _classProps(Cursor, null, {
    advance: {
      writable: true,
      value: function (count) {
        webSocket.emit("db cursor " + this._idCursor, "advance", count);
        return this;
      }
    },
    next: {
      writable: true,
      value: function () {
        var _this = this;
        return webSocket.emit("db cursor " + this._idCursor, "next").then(function (result) {
          _this._result = result;
          _this.primaryKey = _this.key = result && result[_this._store.keyPath];
          return _this.key;
        });
      }
    },
    result: {
      writable: true,
      value: function () {
        return Promise.resolve(this._result);
      }
    },
    remove: {
      writable: true,
      value: function () {
        return this._store.deleteByKey(this.key);
      }
    },
    forEachKeys: {
      writable: true,
      value: function (callback) {
        var cursor = this;
        return (function _callback() {
          return cursor.next().then(function (key) {
            if (!key) {
              return cursor.close();
            }
            return callback(key);
          }).then(function () {
            if (cursor.key) {
              return _callback();
            }
          });
        })();
      }
    },
    close: {
      writable: true,
      value: function () {
        var _this2 = this;
        return webSocket.emit("db cursor " + this._idCursor, "close").then(function () {
          _this2._result = _this2._store = _this2._idCursor = undefined;
        });
      }
    }
  });

  return Cursor;
})(AbstractCursor);

exports.Cursor = Cursor;
//# sourceMappingURL=Cursor.js.map