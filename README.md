# discord_bot_YNUTECH

## discord bot(node)の開発と AWS EC2 環境構築練習

ローカルで開発した discord bot を EC2 から SSH で git clone し、稼働させています。

バックエンドには microCMS を用いています。

## 機能

機能は二つです。

① 投票機能

② 画像で宣言機能

① は/vote start コマンドと/vote finish コマンドで行います。

/vote start content:〜で投票を開始し、それにみんながスタンプで投票します。

/vote finish コマンドで投票の終了と結果の報告を行います。

注意事項としては、

- 一人につき同時に一つまでしか投票を開催できない
- みんなが、賛成と反対、両方のスタンプを押せてしまう

ことです。

そこまで実装するとコスト高そうだったので今回の要件からは外しました。

② は imgix というサービスの機能を使った小ネタ機能です。

qiita などでサムネイルに使われている動的に OGP を生成する機能になります。

/annotation contetnt:〜 (color:〜)で（color は任意）その内容を埋め込んだ画像をチャンネルに投稿してくれます。

投票で決まったことの告知や、これから何か作ろうとする時の目標宣言等にお使いいただけると幸いです。

こちらも注意事項としては、

- 改行に対応できない
- 60 文字まで（60 文字超えると 59 文字までと「..」が表示されます。）

があります。
