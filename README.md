# VimOptimizer

## Before you start

```
git clone https://github.com/kajikentaro/VSCodeVim/
cd VSCodeVim
yarn install
```

## 前処理(optional)

`src/suggest/suggestMap.json`を生成する

```
npx gulp prepare-test
yarn test
```

## Wasm コンパイル

`out/wasmbin`を生成する

```
mkdir -p out
cd wasm && tinygo build -o ../out/wasmbin -target wasm .
```

## 本番ビルド

`vim-optimizer-x.x.x.visx`を生成する

```
npx gulp build
yarn package
```
