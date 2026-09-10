import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function rewriteStrudelRetryImport(): Plugin {
  return {
    name: "strujam8-strudel-retry-import",
    apply: "build",
    generateBundle(_options, bundle) {
      // Keep one lazy runtime payload while retaining a distinct URL for retry cache recovery.
      Object.values(bundle).forEach((output) => {
        if (output.type !== "chunk") {
          return;
        }

        output.dynamicImports
          .filter((fileName) => /(?:^|\/)strudel-runtime-[^/]+\.js$/.test(fileName))
          .forEach((fileName) => {
            const runtimeFileName = fileName.split("/").pop() ?? fileName;
            const normalImport = `import(\`./${runtimeFileName}\`)`;
            const retryImport = `import(\`./${runtimeFileName}?retry=1\`)`;
            const firstImportIndex = output.code.indexOf(normalImport);
            const secondImportIndex = output.code.indexOf(
              normalImport,
              firstImportIndex + normalImport.length,
            );

            if (firstImportIndex < 0 || secondImportIndex < 0) {
              throw new Error("StruJam8 could not preserve the Strudel retry import");
            }

            output.code = `${output.code.slice(0, secondImportIndex)}${retryImport}${output.code.slice(
              secondImportIndex + normalImport.length,
            )}`;
          });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), rewriteStrudelRetryImport()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("/node_modules/@strudel/web/dist/index.mjs")) {
            return "strudel-runtime";
          }

          return undefined;
        },
      },
    },
  },
});
