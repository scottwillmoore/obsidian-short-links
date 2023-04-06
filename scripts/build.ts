import { build, BuildOptions } from "esbuild";

export const buildOptions: BuildOptions = {
	bundle: true,
	entryPoints: ["sources/plugin.ts"],
	external: ["@codemirror/*", "@lezer/*", "electron", "obsidian"],
	logLevel: "info",
	outfile: "main.js",
	platform: "node",
	treeShaking: true,
};

build({
	...buildOptions,
	minify: true,
});
