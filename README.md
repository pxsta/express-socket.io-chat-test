# express-socket.io-chat-test
##概要
expressとsocket.ioを用いた簡単なチャットアプリとそのテスト。

[pxsta&#039;s Memo  &raquo; socket.io-clientを用いてExpress+Socket.IOで作ったサービスへ同時接続テストを行う](http://www.pxsta.net/blog/?p=3780)のためのコード。



expressのセッション管理のテストにmochaとsuperagent、

socket.ioの同時接続テストにsocket.io-clientを使用。

###テスト対象の動作サンプル

[Socket.io-Express3.0.0rc3 session sample](http://socketio-express3-chat.herokuapp.com/)

簡単なチャット。passwordがtestなら何でもログイン可能。

###インストール
```bash
npm install
```


###チャット起動
redisが起動した状態で
```bash
make app
```


###テスト実行
redisが起動した状態で
```bash
make test
```