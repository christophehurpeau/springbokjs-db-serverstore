"use strict";

var y = require("yielded");

exports.initialize = function (io, serverStore) {
    io.on("connection", function (socket) {
        var openCursors = {},
            timeouts = {},
            activeListeners = {};

        socket.on("disconnect", function () {
            Object.keys(openCursors).forEach(function (cursorKey) {
                openCursors[cursorKey].close();
            });
            openCursors = null;

            Object.keys(timeouts).forEach(function (timeoutKey) {
                clearTimeout(timeouts[timeoutKey]);
            });
            timeouts = null;

            Object.keys(activeListeners).forEach(function (activeListenerKey) {
                var activeListener = activeListeners[activeListenerKey];
                activeListener.service.unsubscribe(activeListener.listeners);
            });
            activeListeners = null;
        });

        socket.on("connectedUser", function (response) {
            var userRestService = serverStore.restService("user");
            userRestService.findConnected(socket.connectedUser).then(function (user) {
                if (!user) {
                    return response(null);
                }
                response(null, {
                    connected: socket.connectedUser,
                    user: userRestService.transform(user)
                });
            })["catch"](function (err) {
                return response(err);
            });
        });

        var nextIdCursor = 1;
        socket.on("db cursor", function (dbName, modelName, query, options, response) {
            var idCursor = nextIdCursor++;
            var restService = serverStore.restService(modelName);
            if (!restService) {
                response(null);
                throw new Error("restService missing: " + modelName);
            }
            query = restService.query(socket.connectedUser, query);
            restService.service.findAll().query(query).cursor().then(function (cursor) {
                if (!cursor) {
                    return response();
                }
                // TODO cursor.isEmpty()
                var count = cursor.count().then(function (count) {
                    // console.log(idCursor, 'count = ', count);
                    if (!count) {
                        cursor.close();
                        return response(null);
                    }
                    var closeCursor = function closeCursor() {
                        cursor.close();
                        delete openCursors[idCursor];
                        delete timeouts[idCursor];
                        socket.removeAllListeners("db cursor " + idCursor);
                    };

                    var closeTimeout = setTimeout(function () {
                        console.log("cursor closed by timeout " + idCursor);
                        closeCursor();
                    }, 5 * 60 * 1000);
                    openCursors[idCursor] = cursor;
                    timeouts[idCursor] = closeTimeout;

                    // TODO timeouts
                    socket.on("db cursor " + idCursor, function (instruction, response) {
                        console.log("db cursor " + idCursor + " " + instruction);
                        if (instruction === "next") {
                            cursor.next().then(function (key) {
                                if (!key) {
                                    return response(null);
                                }
                                return cursor.result().then(function (data) {
                                    response(null, restService.transform(data));
                                });
                            }, function () {
                                response(null);
                            });
                        } else if (instruction === "forEach") {
                            cursor.forEachResults(function (result) {
                                socket.emit("db cursor forEach " + idCursor, result && restService.transform(result));
                            }).then(function () {
                                response(null);
                            });
                        } else if (instruction === "close") {
                            clearTimeout(closeTimeout);
                            closeCursor();
                            response(null);
                        } else if (instruction === "advance") {
                            cursor.advance().then(function () {
                                return response(null);
                            });
                        }
                    });
                    return response(null, idCursor);
                });
            });
        });

        socket.on("db findOne", function (dbName, modelName, query, options, response) {
            var restService = serverStore.restService(modelName);
            query = restService.query(socket.connectedUser, query);
            y.promise(restService.service.findOne().query(query).fetch()).then(function (vo) {
                response(null, vo && restService.transform(vo.data));
            })["catch"](function (err) {
                console.log(err.stack);
                response(err);
            });
        });

        socket.on("db insert", function (dbName, modelName, data, response) {
            var restService = serverStore.restService(modelName);
            var vo = restService.service.createNewVO(data);
            vo = restService.prepareInsert(socket.connectedUser, vo);
            y.promise(restService.service.insert(vo)).then(function () {
                response(null, restService.transform(vo.data));
            })["catch"](function (err) {
                response(err);
            });
        });

        var nextIdListener = 1;
        socket.on("subscribe", function (dbName, modelName, query, response) {
            var idListener = nextIdListener++;
            var restService = serverStore.restService(modelName);
            var listeners = {
                query: restService.query(socket.connectedUser, query),
                inserted: function inserted(vo) {
                    console.log("sending insert", idListener);
                    socket.emit(idListener + " event", { type: "inserted", data: restService.transform(vo.data) });
                },
                updated: function updated(vo) {
                    console.log("sending update", idListener);
                    socket.emit(idListener + " event", { type: "updated", data: restService.transform(vo.data) });
                },
                deleted: function deleted(vo) {
                    console.log("sending delete", idListener);
                    socket.emit(idListener + " event", { type: "deleted", data: restService.transform(vo.data) });
                } };
            console.log("scoket subscribing ", listeners);
            restService.service.subscribe(listeners);
            activeListeners[idListener] = { service: restService.service, listeners: listeners };
            socket.on("unsubscribe " + idListener, function (response) {
                console.log("scoket unsubscribing ", listeners);
                restService.service.unsubscribe(listeners);
                delete activeListeners[idListener];
                response(null);
            });
            response(null, idListener);
        });
    });
};
//# sourceMappingURL=server.js.map