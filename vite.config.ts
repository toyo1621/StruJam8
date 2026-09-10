import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const strudelWebSourceEntry = new URL("./node_modules/@strudel/web/web.mjs", import.meta.url).pathname;

function findBalancedParenthesis(source: string, start: number) {
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "`" || character === '"' || character === "'") {
      quote = character;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

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
          .filter((fileName) => fileName !== output.fileName)
          .filter((fileName) => /(?:^|\/)strudel-runtime-[^/]+\.js$/.test(fileName))
          .forEach((fileName) => {
            const runtimeFileName = fileName.split("/").pop() ?? fileName;
            const normalImports = [
              `import(\`./${runtimeFileName}\`)`,
              `import("./${runtimeFileName}")`,
              `import('./${runtimeFileName}')`,
            ];
            const importMatch = normalImports
              .map((normalImport) => {
                const firstImportIndex = output.code.indexOf(normalImport);
                const secondImportIndex = output.code.indexOf(
                  normalImport,
                  firstImportIndex + normalImport.length,
                );

                return { normalImport, secondImportIndex };
              })
              .find(({ secondImportIndex }) => secondImportIndex >= 0);

            if (!importMatch) {
              throw new Error("StruJam8 could not preserve the Strudel retry import");
            }

            const { normalImport, secondImportIndex } = importMatch;
            const retryImport = normalImport.replace(
              `./${runtimeFileName}`,
              `./${runtimeFileName}?retry=1`,
            );
            output.code = `${output.code.slice(0, secondImportIndex)}${retryImport}${output.code.slice(
              secondImportIndex + normalImport.length,
            )}`;

            // Vite wraps lazy imports in its preload helper. Because the helper is
            // shared with the Strudel chunk, that wrapper can make the audio chunk a
            // static dependency of the UI chunk. With no preload dependencies here,
            // the direct import keeps the runtime genuinely lazy.
            const escapedRuntimeFileName = runtimeFileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const runtimeImportPattern = new RegExp(
              `import\\{([^}]*)\\}from["']\\./${escapedRuntimeFileName}["']`,
            );
            const runtimeImportMatch = output.code.match(runtimeImportPattern);

            if (!runtimeImportMatch || runtimeImportMatch.index === undefined) {
              throw new Error("StruJam8 could not locate the Strudel preload helper import");
            }

            const runtimeImportStart = runtimeImportMatch.index;

            const localBindings = runtimeImportMatch[1]
              .split(",")
              .map((part) => part.trim().match(/(?:^|\s+as\s+)([A-Za-z_$][\w$]*)$/)?.[1])
              .filter((binding): binding is string => Boolean(binding));
            const helperMatch = localBindings
              .flatMap((binding) => {
                const helperCall = `${binding}(`;
                const matches: Array<{ binding: string; start: number; end: number }> = [];
                let helperStart = output.code.indexOf(helperCall, runtimeImportStart);

                while (helperStart >= 0) {
                  const helperEnd = findBalancedParenthesis(output.code, helperStart);
                  const helperSource = helperEnd >= 0 ? output.code.slice(helperStart, helperEnd + 1) : "";

                  if (
                    helperSource.includes(`import(\`./${runtimeFileName}\`)`) &&
                    helperSource.includes(`import(\`./${runtimeFileName}?retry=1\`)`)
                  ) {
                    matches.push({ binding, start: helperStart, end: helperEnd });
                    break;
                  }

                  helperStart = output.code.indexOf(helperCall, helperStart + helperCall.length);
                }

                return matches;
              })[0];

            if (!helperMatch) {
              throw new Error("StruJam8 could not identify the Strudel preload helper binding");
            }

            const { binding: helperBinding, start: helperStart, end: helperEnd } = helperMatch;

            const helperCall = output.code.slice(helperStart, helperEnd + 1);
            const helperArguments = helperCall.slice(helperBinding.length + 1, -1);
            const dependencySeparator = Math.max(
              helperArguments.lastIndexOf(",[]"),
              helperArguments.lastIndexOf(",__VITE_PRELOAD__"),
            );

            if (dependencySeparator < 0) {
              throw new Error("StruJam8 found unexpected Strudel preload dependencies");
            }

            const directImport = helperArguments
              .slice(0, dependencySeparator)
              .replace(/\(\)=>/g, "");
            output.code = `${output.code.slice(0, helperStart)}${directImport}${output.code.slice(helperEnd + 1)}`;

            const importStatement = runtimeImportMatch[0];
            const remainingBindings = runtimeImportMatch[1]
              .split(",")
              .map((part) => part.trim())
              .filter((part) => !part.endsWith(` as ${helperBinding}`) && part !== helperBinding);
            const replacement = remainingBindings.length > 0
              ? `import{${remainingBindings.join(",")}}from"./${runtimeFileName}";`
              : "";
            output.code = `${output.code.slice(0, runtimeImportStart)}${replacement}${output.code.slice(
              runtimeImportStart + importStatement.length,
            )}`;
          });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), rewriteStrudelRetryImport()],
  resolve: {
    // The package dist bundle embeds one core copy and prebakes another one.
    // Bundling the source entry lets Vite share a single @strudel/core module.
    alias: [{ find: /^@strudel\/web(?=$|\?)/, replacement: strudelWebSourceEntry }],
  },
  build: {
    // The audio runtime must stay behind the user-triggered dynamic import.
    // Vite's module-preload helper otherwise turns that lazy chunk into an eager request.
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (
            normalizedId.includes("/node_modules/@strudel/web/dist/index.mjs") ||
            normalizedId.includes("/node_modules/@strudel/web/web.mjs")
          ) {
            return "strudel-runtime";
          }

          return undefined;
        },
      },
    },
  },
});
