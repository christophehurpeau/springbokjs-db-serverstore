"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
    value: true
});
var AbstractStore = require("springbokjs-db/lib/AbstractStore").AbstractStore;
var webSocket = require("springbokjs-browser/webSocket");
var Cursor = require("./Cursor").Cursor;

var ServerStore = exports.ServerStore = (function (_AbstractStore) {
    function ServerStore() {
        _classCallCheck(this, ServerStore);

        if (_AbstractStore != null) {
            _AbstractStore.apply(this, arguments);
        }
    }

    _inherits(ServerStore, _AbstractStore);

    _createClass(ServerStore, {
        initialize: {
            value: function initialize() {}
        },
        store: {
            value: function store() {}
        },
        findOne: {
            value: function findOne(query, options) {
                var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
                return webSocket.emit("db findOne", this.db.dbName, modelName, query, options);
            }
        },
        insert: {
            value: function insert(options) {
                var modelName = this.manager.VO.name[0].toLowerCase() + this.manager.VO.name.substr(1);
                return webSocket.emit("db insert", this.db.dbName, modelName, options).then(function (result) {
                    if (result) {
                        Object.assign(options.fullData, result);
                    }
                });
            }
        },
        update: {
            value: function update(options) {
                throw new Error();
            }
        },
        "delete": {
            value: function _delete(options) {
                throw new Error();
            }
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
            }
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
            }
        },
        unsubscribe: {
            value: function unsubscribe(listeners) {
                webSocket.off(listeners.listenerId + " event");
                return webSocket.emit("unsubscribe " + listeners.listenerId);
            }
        }
    });

    return ServerStore;
})(AbstractStore);

ServerStore.initialize = function (db) {
    return Promise.resolve();
};
//# sourceMappingURL=ServerStore.js.map