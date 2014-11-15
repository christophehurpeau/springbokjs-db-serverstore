var AbstractCursor = require('springbokjs-db/lib/AbstractCursor').AbstractCursor;
var webSocket = require('springbokjs-browser/webSocket');

export class Cursor extends AbstractCursor {
    constructor(idCursor, store) {
        this._idCursor = idCursor;
        this._store = store;
    }

    advance(count) {
        webSocket.emit('db cursor ' + this._idCursor, 'advance', count);
        return this;
    }

    next() {
        return webSocket.emit('db cursor ' + this._idCursor, 'next').then((result) => {
            this._result = result;
            this.primaryKey = this.key = result && result[this._store.keyPath];
            return this.key;
        });
    }

    result() {
        return Promise.resolve(this._result);
    }

    remove() {
        return this._store.deleteByKey(this.key);
    }

    forEachKeys(callback) {
        var cursor = this;
        return (function _callback() {
            return cursor.next().then((key) => {
                if (!key) {
                    return cursor.close();
                }
                return callback(key);
            }).then(() => {
                if (cursor.key) {
                    return _callback();
                }
            });
        })();
    }

    close() {
        return webSocket.emit('db cursor ' + this._idCursor, 'close').then(() => {
            this._result = this._store = this._idCursor = undefined;
        });
    }
}