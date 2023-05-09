import { transpileGlass } from "@glass-lang/glassc";
import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { TextDecoder } from "util";
import vm from "vm";

// this is just a test, for now...
export async function executeGlassFile() {
  const transpiled2 = transpileGlass(
    "/Users/rothfels/glass/apps/demo/chat",
    "/Users/rothfels/glass/apps/demo/chat/test.glass",
    "typescript",
    "/Users/rothfels/glass/apps/demo/chat"
  );

  const outPath = path.join(
    "/Users/rothfels/glass/apps/demo/chat",
    "glass-tmp.ts"
  );

  const functionName = "getTestPrompt";

  const outfile = `${transpiled2}

c.response = ${functionName}(${JSON.stringify({})});
`;

  fs.writeFileSync(outPath, outfile, {
    encoding: "utf-8",
  });

  console.log("about to esbuild");
  const result = await esbuild.build({
    entryPoints: [outPath],
    bundle: true,
    platform: "node",
    write: false,
    format: "cjs",
    target: "es2020",
  });
  console.log("did the esbuild");

  const code = new TextDecoder().decode(result.outputFiles[0].contents);
  console.log("esbuild code is", code);

  fs.unlinkSync(outPath);

  const c: any = {};

  // new Function("context", code)(c);
  // eval(code);

  // vm.run(code);

  const script = new vm.Script(code, {
    filename: "outputFile.js",
  });

  const ctx = {
    c,
    global,
    process,
    module: { exports: {} },
    require: require,
  };

  vm.createContext(ctx);
  script.runInContext(ctx);

  console.log("ctx response is after execution", c.response);
}
