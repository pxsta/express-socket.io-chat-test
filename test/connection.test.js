"use strict";
var should = require('should')
  , expect = require('expect.js')
  , helper = require('./support/helper')
  , app = require('../app.js')

var options = {
    transports : ['websocket'],
    'force new connection' : true,  //別々のコネクションとして認識させるために必要
    port : app.get('port'),
    'connect timeout': 5000
};


//socket.ioの接続テスト
describe('socket.io test', function() {
    before(function(done) {
        helper.initDataStore(done);
    });
    
    it('ログイン前はsocket.ioで接続できないはず', function(done) {
        this.timeout(10000);
        helper.login({
            auth : {
                userID : 'test',
                password : 'wrong password'
            },
            server : {
                host : "",
                details : options
            }
        }, function(err, client) {
            //接続できてはいけない
            client.on('connect', function(data) {
                done("wrong behaviour");
            });
            
            //エラーが起こるはず
            client.on('error', function(data) {
                //ハンドシェイクのエラーのはず
                should.equal(data.toString(),"handshake error");
                done();
            });
        });
    });
    it('ログインした後はsocket.ioで接続できるはず', function(done) {
        this.timeout(10000);
        helper.login({
            auth : {
                userID : 'test',
                password : 'test'
            },
            server : {
                host : "",
                details : options
            }
        }, function(err, client) {
            client.on('connect', function(data) {
                //接続完了するはず
                done();
            });
        });
    });
    
    it('1000件接続出来るかどうか。ファイルディスクリプタの最大値を大きくしないと一度に接続できない', function(done) {
        this.timeout(600000);
        var maxCount = 100;
        var clientCount = 0;
        var clients = [];
        
        //全てが接続し終わったら全て切断してから終了
        var end = function() {
            for (var k=0;k<clients.length;k++) {
                clients[k].disconnect();
            }
            done();
        }; 
        
        //maxCount個のクライアントを接続する
        for (var i = 0; i < maxCount; i++) {
            var client = helper.login({
                auth : {
                    userID : 'test' + i,
                    password : 'test'
                },
                server : {
                    host : "",
                    details : options
                }
            }, function(err, client) {
                clients.push(client);
                
                //接続出来たクライアントがmaxCount個に達するまで待つ
                client.on('connect', function(data) {
                    if ((++clientCount) == maxCount) {
                        end();
                    }
                });
            });
        }
    });
    
    it('メッセージの送受信がclient0とclient1でできるかどうか', function(done) {
        this.timeout(10000);
        var maxCount = 2;
        var clientCount = 0;
        var clients = [];
        
        var connectCompleat = function() {
            clients[0].on("message",function(message){
                //client0が受信したメッセージはclient1が送信したメッセージなはず
                should.equal(message, clients[1].userID + ' ' + "message");
                
                //テスト終了前に切断する
                clients[0].disconnect();
                clients[1].disconnect();
                done();
            });
            clients[1].emit("chat","message");
        }; 
        
        for (var i = 0; i < maxCount; i++) {
            (function(userID) {
                var client = helper.login({
                    auth : {
                        userID : userID,
                        password : 'test'
                    },
                    server : {
                        host : "",
                        details : options
                    }
                }, function(err, client) {
                    client.userID = userID;
                    clients.push(client);
                    
                    //client0とclient1が接続するまで待つ
                    client.on('connect', function(data) {
                        if ((++clientCount) == maxCount) {
                            connectCompleat();
                        }
                    });
                });
            })('test' + i);
        }
    });
    
    after(function(done) {
        helper.initDataStore(done);
    });
});
