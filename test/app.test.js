"use strict";
var url = require('url')
  , connect = require("express/node_modules/connect")
  , should = require('should')
  , assert = require('assert')
  , superagent = require('superagent')
  , app = require('../app.js');


describe('HTTP Server Test', function() {
    //テストに使用するユーザーを作成
    var testUser = superagent.agent();  //正規にログインするユーザー
    var invalidUser = superagent.agent(); //ログインしないユーザー
     
    //テスト前処理
    before(function(done) {
        //セッションストアのデータをすべて消す
        app.get("sessionStore").client.flushdb(done);
    });
    
    it('ログインページにアクセスできるはず', function(done) {
        testUser.get('http://localhost:3000/').end(function(err, res) {
            should.not.exist(err);
            should.equal(res.statusCode, 200);
            done();
        });
    });
    
    it('ログイン前にチャットページにアクセスしたらログインページにリダイレクトされるはず', function(done) {
        testUser.get('http://localhost:3000/chat').end(function(err, res) {
            should.not.exist(err);
            res.redirects.should.not.be.empty;
            should.equal(url.parse(res.redirects[0], false, true).pathname, "/");
            done();
        });
    });
    
    it('ログインに失敗したらログインページにリダイレクトされるはず', function(done) {        
        //ログインページでのpost処理
        testUser.post('http://localhost:3000/user/login').send({
            userID : 'test',
            password : 'bad_password'
        }).end(function(err, res) {
            should.not.exist(err);
            res.redirects.should.not.be.empty;
            should.equal(url.parse(res.redirects[0], false, true).pathname, "/");
            done();
        });
    });
    
    it('ログインに成功したらセッションストレージにユーザー名が保存されているはず', function(done) {
        testUser.post('http://localhost:3000/user/login').send({
            userID : 'test',
            password : 'test'
        }).end(function(err, res) {
            should.not.exist(err);
            
            //sessionStoreにsessionデータが保存されているはず
            var header_cookie = res.req._headers.cookie;
            var cookie = require('cookie').parse(decodeURIComponent(header_cookie));
            cookie = connect.utils.parseSignedCookies(cookie, app.get('secretKey'));
            var sessionID = cookie[app.get('cookieSessionKey')];
            
            app.get("sessionStore").get(sessionID,function(err,session){
                 should.not.exist(err);
                 
                 //userIDがログイン時のものと一致するはず
                 should.equal(session.userID,"test");
                 done();
            });
        });
    });
    
    it('ログイン後はチャットページに直接アクセスしても表示されるはず', function(done) {
        testUser.get('http://localhost:3000/chat').end(function(err, res) {
            should.not.exist(err);
            should.equal(res.statusCode, 200);
            should.equal(res.req.path, "/chat");
            done();
        });
    });

    it('ログインしてないinvalidUserは/chatに直接にしても/にリダイレクトされるはず', function(done) {
        invalidUser.get('http://localhost:3000/chat').end(function(err, res) {
            should.not.exist(err);

            //リダイレクト先が存在し、/にリダイレクトされるはず
            res.redirects.should.not.be.empty
            should.equal(url.parse(res.redirects[0], false, true).pathname, "/");
            done();
        });
    });

    it('ログアウト後はログインページにリダイレクトされるはず', function(done) {
        testUser.get('http://localhost:3000/user/logout').end(function(err, res) {
            should.not.exist(err);
            res.redirects.should.not.be.empty;
            should.equal(url.parse(res.redirects[0], false, true).pathname, "/");
            done();
        });
    });
    
    it('ログアウト後はチャットページに直接アクセスしてもログインページにリダイレクトされるはず', function(done) {
        testUser.get('http://localhost:3000/chat').end(function(err, res) {
            should.not.exist(err);
            res.redirects.should.not.be.empty;
            should.equal(url.parse(res.redirects[0], false, true).pathname, "/");
            done();
        });
    });
    
    //テスト後処理
    after(function(done) {
        app.get("sessionStore").client.flushdb(done);
    });
});
