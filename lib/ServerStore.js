"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var AbstractStore = require("springbokjs-db/lib/AbstractStore").AbstractStore;
var webSocket = require("springbokjs-browser/webSocket");
var Cursor = require("./Cursor").Cursor;

var ServerStore = exports.ServerStore = (function (AbstractStore) {
    function ServerStore() {
        _classCallCheck(this, ServerStore);

        if (AbstractStore != null) {
            AbstractStore.apply(this, arguments);
        }
    }

    _inherits(ServerStore, AbstractStore);

    _prototypeProperties(ServerStore, null, {
        initialize: {
            value: function initialize() {},
            writable: true,
            configurable: true
        },
        store: {
            value: function store() {},
            writable: true,
            configurable: true
        },
        findOne: {
            value: function findOne(query, options) {
                var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
                return webSocket.emit("db findOne", this.db.dbName, modelName, query, options);
            },
            writable: true,
            configurable: true
        },
        insert: {
            value: function insert(options) {
                var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
                return webSocket.emit("db insert", this.db.dbName, modelName, options).then(function (result) {
                    if (result) {
                        Object.assign(options.fullData, result);
                    }
                });
            },
            writable: true,
            configurable: true
        },
        update: {
            value: function update(options) {
                throw new Error();
            },
            writable: true,
            configurable: true
        },
        "delete": {
            value: function _delete(options) {
                throw new Error();
            },
            writable: true,
            configurable: true
        },
        cursor: {
            value: function cursor(query, options) {
                var _this = this;
                var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
                return webSocket.emit("db cursor", this.db.dbName, modelName, query, options).then(function (idCursor) {
                    if (!idCursor) {
                        return;
                    }
                    return new Cursor(idCursor, _this, query);
                });
            },
            writable: true,
            configurable: true
        },
        subscribe: {
            value: function subscribe(listeners) {
                var _this = this;
                var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
                return webSocket.emit("subscribe", this.db.dbName, modelName, listeners.query).then(function (listenerId) {
                    listeners.listenerId = listenerId;
                    console.log("listing for: " + listenerId + " event");
                    webSocket.on(listenerId + " event", function (result) {
                        var type = result.type;
                        var data = result.data;
                        console.log("received event", type, data);
                        if (listeners[type]) {
                            listeners[type](_this.toVO(data));
                        }
                    });
                });
            },
            writable: true,
            configurable: true
        },
        unsubscribe: {
            value: function unsubscribe(listeners) {
                webSocket.off(listeners.listenerId + " event");
                return webSocket.emit("unsubscribe " + listeners.listenerId);
            },
            writable: true,
            configurable: true
        }
    });

    return ServerStore;
})(AbstractStore);


ServerStore.initialize = function (db) {
    return Promise.resolve();
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
//# sourceMappingURL=ServerStore.js.map