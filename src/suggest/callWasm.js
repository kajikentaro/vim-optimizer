const path = require('path');
require('./wasm_exec_tiny');
const fs = require('fs');

async function prepareWasm() {}

export async function callWasm(optIn) {
  const go = new Go();

  const obj = await WebAssembly.instantiate(
    fs.readFileSync(path.resolve(__dirname, './wasmbin')),
    go.importObject
  );
  const wasm = obj.instance;

  // 変数をセット
  wasm.exports.setOriginPosition(optIn.origin.line, optIn.origin.character);
  wasm.exports.setDestinationPosition(optIn.destination.line, optIn.destination.character);
  const [addr, length] = writeBuffer(optIn.editorText, wasm);
  wasm.exports.setEditorText(addr, length);

  // 最適化開始
  const addrOut = wasm.exports.wasmHandler();

  // 結果取得
  const lengthOut = wasm.exports.getBufSize();
  const result = readBuffer(addrOut, lengthOut, wasm);
  return result;
}

// 共有メモリを読み込む
function readBuffer(addr, size, module) {
  let memory = module.exports.memory;
  let bytes = memory.buffer.slice(addr, addr + size);
  let text = String.fromCharCode.apply(null, new Int8Array(bytes));
  return text;
}

// 共有メモリに書き込む
function writeBuffer(text, module) {
  // Get the address of the writable memory.
  const addr = module.exports.getBuffer();
  const buffer = module.exports.memory.buffer;

  const mem = new Int8Array(buffer);
  const view = mem.subarray(addr, addr + text.length);

  for (let i = 0; i < text.length; i++) {
    view[i] = text.charCodeAt(i);
  }

  // Return the address we started at.
  return [addr, text.length];
}
