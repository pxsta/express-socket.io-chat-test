"use strict";
var app = require('../../app')
  , io = require('socket.io-client')
  , redis = require('socket.io/node_modules/redis')
  , superagent = require('superagent')
  , redisStore = redis.createClient();
io.transports = ['websocket'];


////////////////////////////////////////
//socket.io-client/lib/socket.js#L116
//テスト用にcookieを使用できるようにする
var xhr_cookie;
var empty = function () {
};

io.Socket.prototype.handshake = function(fn) {
    var self = this, options = this.options;

    function complete(data) {
        if ( data instanceof Error) {
            self.connecting = false;
            self.onError(data.message);
        }
        else {
            fn.apply(null, data.split(':'));
        }
    }

    var url = ['http' + (options.secure ? 's' : '') + ':/', options.host + ':' + options.port, options.resource, io.protocol, io.util.query(this.options.query, 't=' + +new Date)].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
        var insertAt = document.getElementsByTagName('script')[0], script = document.createElement('script');

        script.src = url + '&jsonp=' + io.j.length;
        insertAt.parentNode.insertBefore(script, insertAt);

        io.j.push(function(data) {
            complete(data);
            script.parentNode.removeChild(script);
        });
    }
    else {
        var xhr = io.util.request();

        xhr.open('GET', url, true);
        xhr.setRequestHeader("X-Set-Cookie", xhr_cookie);

        if (this.isXDomain()) {
            xhr.withCredentials = true;
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = empty;

                if (xhr.status == 200) {
                    complete(xhr.responseText);
                }
                else if (xhr.status == 403) {
                    self.onError(xhr.responseText);
                }
                else {
                    self.connecting = false;
                    !self.reconnecting && self.onError(xhr.responseText);
                }
            }
        };
        xhr.send(null);
    }
};
////////////////////////////////////////

// データストア初期化
var initDataStore = function(callback) {
    redisStore.flushdb(function() {
        callback();
    });
};

//ログイン
var login = function(params, callback) {
    var testUser = superagent.agent();
    testUser.post('http://localhost:3000/user/login').send(params.auth).end(function(err, res) {
        if (err) {
            callback(err);
        }
        xhr_cookie = res.req._headers.cookie;
        var socket = io.connect(params.server.host,params.server.details);
        callback(null, socket);
    });
};

module.exports.initDataStore = initDataStore;
module.exports.login = login;
