import { build as viteBuild } from "vite";
import { build as esbuildBuild } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function build() {
  console.log("Building frontend with Vite...");
  await viteBuild({
    configFile: path.resolve(rootDir, "vite.config.ts"),
  });
  console.log("Frontend build complete.");

  console.log("Bundling server with esbuild...");
  await esbuildBuild({
    entryPoints: [path.resolve(rootDir, "server", "index.ts")],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: path.resolve(rootDir, "dist", "index.cjs"),
    external: [
      "mongoose",
      "dotenv",
      // Node built-ins and heavy deps are kept external for CJS bundle
      "express",
      "express-session",
      "memorystore",
      "ws",
      "passport",
      "passport-local",
      "pg",
      "connect-pg-simple",
      // Vite is only used in dev mode (dynamically imported), so exclude it
      "vite",
      "../vite.config",
      "@replit/vite-plugin-cartographer",
      "@replit/vite-plugin-dev-banner",
      "@replit/vite-plugin-runtime-error-modal",
    ],
    alias: {
      "@shared": path.resolve(rootDir, "shared"),
    },
    define: {
      "import.meta.dirname": JSON.stringify(path.resolve(rootDir, "dist")),
    },
  });
  console.log("Server bundle complete.");
  console.log("Build finished successfully!");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
