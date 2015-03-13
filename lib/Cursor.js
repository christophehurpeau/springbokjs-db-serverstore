"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var AbstractCursor = require("springbokjs-db/lib/AbstractCursor").AbstractCursor;
var webSocket = require("springbokjs-browser/webSocket");

var Cursor = exports.Cursor = (function (AbstractCursor) {
    function Cursor(idCursor, store, query) {
        _classCallCheck(this, Cursor);

        this._idCursor = idCursor;
        this._store = store;
        this._query = query;
    }

    _inherits(Cursor, AbstractCursor);

    _prototypeProperties(Cursor, null, {
        query: {
            get: function () {
                return this._query;
            },
            configurable: true
        },
        advance: {
            value: function advance(count) {
                webSocket.emit("db cursor " + this._idCursor, "advance", count);
                return this;
            },
            writable: true,
            configurable: true
        },
        next: {
            value: function next() {
                var _this = this;
                return webSocket.emit("db cursor " + this._idCursor, "next").then(function (result) {
                    _this._result = result;
                    _this.primaryKey = _this.key = result && result[_this._store.keyPath];
                    return _this.key;
                });
            },
            writable: true,
            configurable: true
        },
        result: {
            value: function result() {
                return Promise.resolve(this._result);
            },
            writable: true,
            configurable: true
        },
        remove: {
            value: function remove() {
                return this._store.deleteByKey(this.key);
            },
            writable: true,
            configurable: true
        },
        forEachKeys: {
            value: function forEachKeys(callback) {
                var _this = this;
                var promise = Promise.resolve();
                webSocket.on("db cursor forEach " + this._idCursor, function (result) {
                    if (!result) {
                        return promise.then(function () {
                            return _this.close();
                        }).then(resolve);
                    }
                    promise.then(function () {
                        _this._result = result;
                        _this.primaryKey = _this.key = result && result[_this._store.keyPath];
                        return callback(_this.key);
                    });
                });
                return webSocket.emit("db cursor " + this._idCursor, "forEach").then(function () {
                    webSocket.off("db cursor forEach " + _this._idCursor);
                    return promise;
                });
            },
            writable: true,
            configurable: true
        },
        close: {
            value: function close() {
                var _this = this;
                return webSocket.emit("db cursor " + this._idCursor, "close").then(function () {
                    _this._result = _this._store = _this._idCursor = undefined;
                });
            },
            writable: true,
            configurable: true
        }
    });

    return Cursor;
})(AbstractCursor);
Object.defineProperty(exports, "__esModule", {
    value: true
});
//# sourceMappingURL=Cursor.js.map