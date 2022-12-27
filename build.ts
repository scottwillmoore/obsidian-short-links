import { build } from "esbuild";
import { argv } from "process";

const production = argv[2] === "production";

build({
	bundle: true,
	entryPoints: ["main.ts"],
	external: ["@codemirror/*", "@lezer/*", "electron", "obsidian"],
	logLevel: "info",
	minify: production,
	outfile: "main.js",
	platform: "node",
	sourcemap: production ? false : "inline",
	treeShaking: true,
	watch: !production,
});
