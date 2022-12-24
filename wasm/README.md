以下コマンドを実行してコンパイル

```
tinygo build -o ../out/wasmbin -target wasm .
```

生成された`wasmbin`を移動させる

## ディレクトリ構造

MVC モデルを参考にしている

- `handler`
  関数を export していて, VSCode から呼び出すことができる。V に相当する部分

- `controller`
  与えられた構造歌いから最適化を行う。C に相当する部分

- `model`
  構造体を宣言している。JSON の marshal もここで行う。M に相当する部分

- `main.go`
  wasm を介さなくてもモックデータでテスト実行できる
