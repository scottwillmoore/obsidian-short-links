import { build } from "esbuild";

import { buildOptions } from "./build";

build({
	...buildOptions,
	sourcemap: "inline",
	watch: true,
});
