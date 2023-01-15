import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { MarkdownPostProcessor, Plugin } from "obsidian";

const editorExtension = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = this.buildDecorations(view);
		}

		update(update: ViewUpdate): void {
			if (update.docChanged || update.selectionSet || update.viewportChanged) {
				this.decorations = this.buildDecorations(update.view);
			}
		}

		private buildDecorations(view: EditorView): DecorationSet {
			const builder = new RangeSetBuilder<Decoration>();

			for (const { from, to } of view.visibleRanges) {
				syntaxTree(view.state).iterate({
					from,
					to,
					enter: (node) => {
						if (node.name.contains("hmd-internal-link")) {
							const extendedFrom = node.from - 2;
							const extendedTo = node.to + 2;

							for (const range of view.state.selection.ranges) {
								if (extendedFrom <= range.to && range.from < extendedTo) {
									return;
								}
							}

							const link = view.state.sliceDoc(node.from, node.to);
							const lastIndex = link.lastIndexOf("#");
							if (lastIndex < 0) {
								return;
							}

							builder.add(node.from, node.from + lastIndex + 1, Decoration.replace({}));
						}
					},
				});
			}

			return builder.finish();
		}
	},
	{
		decorations: (value) => value.decorations,
	}
);

const markdownPostProcessor: MarkdownPostProcessor = (element) => {
	const linkElements = element.querySelectorAll("a.internal-link") as NodeListOf<HTMLAnchorElement>;
	for (const linkElement of linkElements) {
		const lastIndex = linkElement.innerText.lastIndexOf(">");
		if (lastIndex < 0) {
			continue;
		}
		linkElement.innerText = linkElement.innerText.substring(lastIndex + 2);
	}
};

export default class extends Plugin {
	override async onload(): Promise<void> {
		this.registerEditorExtension(editorExtension);
		this.registerMarkdownPostProcessor(markdownPostProcessor);
	}
}
