import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, access, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { pipeline } from "node:stream/promises";
import { createBrotliDecompress } from "node:zlib";
import { spawn } from "node:child_process";

// Same pinned Linux binary and fonts locally and in CI. No CDN download or install hook.
if (process.platform !== "linux" || process.arch !== "x64")
  throw Error(
    "Visual baselines use Linux x64. Run this command in a Linux x64 checkout; other platforms can review the checked-in PNGs and CI diffs.",
  );
const require = createRequire(import.meta.resolve("@sparticuz/chromium"));
const { extract } = require("tar-fs");
const pkgRoot = resolve(
  dirname(fileURLToPath(import.meta.resolve("@sparticuz/chromium"))),
  "..",
);
const runtime = join(tmpdir(), "hydra-visual-chromium-153.0.0"),
  executable = join(runtime, "chromium");
const marker = join(runtime, "ready");
try {
  await access(marker);
} catch {
  await mkdir(join(runtime, "fonts"), { recursive: true });
  for (const name of ["fonts", "swiftshader"])
    await pipeline(
      createReadStream(join(pkgRoot, "bin", name + ".tar.br")),
      createBrotliDecompress(),
      extract(name === "fonts" ? join(runtime, "fonts") : runtime, {
        chown: false,
      }),
    );
  await pipeline(
    createReadStream(join(pkgRoot, "bin/chromium.br")),
    createBrotliDecompress(),
    createWriteStream(executable, { mode: 0o755 }),
  );
  await writeFile(
    join(runtime, "fonts.conf"),
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${runtime}/fonts</dir><cachedir>${runtime}/font-cache</cachedir></fontconfig>`,
  );
  await writeFile(marker, "153.0.0\n");
}
const args = process.argv.slice(2);
if (
  process.env.CI &&
  args.some((arg) => arg.startsWith("--update-snapshots") || arg === "-u")
)
  throw Error(
    "CI validates committed baselines; update and review screenshots locally.",
  );
const child = spawn(
  process.execPath,
  [
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config=playwright.visual.config.ts",
    ...args,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      HYDRA_VISUAL_CHROMIUM: executable,
      FONTCONFIG_FILE: join(runtime, "fonts.conf"),
      LD_LIBRARY_PATH:
        runtime +
        (process.env.LD_LIBRARY_PATH ? ":" + process.env.LD_LIBRARY_PATH : ""),
    },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
