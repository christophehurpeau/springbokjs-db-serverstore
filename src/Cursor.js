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
        var promise = Promise.resolve();
        webSocket.on('db cursor forEach ' + this._idCursor, (result) => {
            if (!result) {
                return promise.then(() => this.close()).then(resolve);
            }
            promise.then(() => {
                this._result = result;
                this.primaryKey = this.key = result && result[this._store.keyPath];
                return callback(this.key);
            });
        });
        return webSocket.emit('db cursor ' + this._idCursor, 'forEach').then(() => {
            webSocket.off('db cursor forEach ' + this._idCursor);
            return promise;
        });
    }

    close() {
        return webSocket.emit('db cursor ' + this._idCursor, 'close').then(() => {
            this._result = this._store = this._idCursor = undefined;
        });
    }
}
