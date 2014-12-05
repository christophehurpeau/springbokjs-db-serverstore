"use strict";

var y = require("yielded");

exports.initialize = function (io, serverStore) {
  io.on("connection", function (socket) {
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
          if (!count) {
            cursor.close();
            return response(null);
          }
          var closeTimeout = setTimeout(function () {
            console.log("cursor closed by timeout " + idCursor);
            cursor.close();
            //socket.off('db cursor ' + idCursor);
          }, 5 * 60 * 1000);

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
            } else if (instruction === "close") {
              clearTimeout(closeTimeout);
              cursor.close();
              //socket.off('db cursor ' + idCursor);
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
  });
};
//# sourceMappingURL=server.js.map