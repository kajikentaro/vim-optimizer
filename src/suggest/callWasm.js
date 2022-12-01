require("./wasm_exec_tiny");
const fs = require("fs")

export async function callWasm(a, b){
  return new Promise((resolve)=>{
    const go = new Go();

    WebAssembly.instantiate(fs.readFileSync("./wasmbin"), go.importObject).then(function (obj) {
      let wasm = obj.instance;
      resolve(wasm.exports.fuga(a,b));
    })
  })
}
