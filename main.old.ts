import { syntaxTree } from "@codemirror/language";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

const logDecorations = ViewPlugin.fromClass(
	class {
		update(update: ViewUpdate): void {
			console.clear();
			console.log("Updated!");
			const allDecorations = update.state.facet(EditorView.decorations);
			for (let decorations of allDecorations) {
				if (typeof decorations === "function") {
					decorations = decorations(update.view);
				}

				if (decorations.size > 0) {
					console.log(decorations.size, decorations);
					const cursor = decorations.iter();
					while (cursor.value !== null) {
						console.log(cursor.from, cursor.to, update.state.sliceDoc(cursor.from, cursor.to));
						console.log(cursor.value);
						cursor.next();
					}
				}
			}
		}
	}
);

const logNodes = ViewPlugin.fromClass(
	class {
		update(update: ViewUpdate): void {
			console.clear();
			console.log("Updated!");
			for (const { from, to } of update.view.visibleRanges) {
				syntaxTree(update.view.state).iterate({
					from,
					to,
					enter: (node) => {
						console.log(node.name, node.node);
						console.log(node.from, node.to, update.state.sliceDoc(node.from, node.to));
					},
				});
			}
		}
	}
);
