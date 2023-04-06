import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, WidgetType } from "@codemirror/view";
import { Tree, TreeCursor } from "@lezer/common";
import { getIcon, livePreviewState } from "obsidian";

import { ShortLinkPlugin } from "./plugin";

class LinkIconWidget extends WidgetType {
	private iconId: string;

	public constructor(iconId: string) {
		super();

		this.iconId = iconId;
	}

	public override eq(widget: LinkIconWidget): boolean {
		return this.iconId == widget.iconId;
	}

	public override toDOM(): HTMLElement {
		const icon = getIcon(this.iconId);
		if (icon === null) {
			throw new Error(`Failed to get icon: ${this.iconId}`);
		}

		icon.removeAttribute("width");
		icon.removeAttribute("height");
		icon.removeAttribute("stroke-width");
		icon.removeClass("svg-icon");

		const span = document.createElement("span");

		span.addClass("link-icon");
		span.appendChild(icon);

		return span;
	}
}

type IterateOptions = {
	tree: Tree;
	enter(cursor: TreeCursor): void;
	from?: number;
	to?: number;
};

const iterate = ({ tree, enter, from = 0, to = tree.length }: IterateOptions): void => {
	const cursor = tree.cursor();
	do {
		if (cursor.from <= to && cursor.to >= from) {
			enter(cursor);

			if (cursor.firstChild()) continue;
		}

		while (!cursor.nextSibling()) {
			if (!cursor.parent()) return;
		}
	} while (true);
};

const widgets = {
	box: new LinkIconWidget("box"),
	externalLink: new LinkIconWidget("external-link"),
	file: new LinkIconWidget("file"),
	heading: new LinkIconWidget("heading"),
	note: new LinkIconWidget("box"),
};

const createDecorations = (plugin: ShortLinkPlugin, view: EditorView): DecorationSet => {
	const builder = new RangeSetBuilder<Decoration>();

	const tree = syntaxTree(view.state);
	for (const visibleRange of view.visibleRanges) {
		iterate({
			tree,
			from: visibleRange.from,
			to: visibleRange.to,
			enter(cursor) {
				// if (cursor.type.id === 4) {
				// 	const start = cursor.from;
				// 	while (cursor.nextSibling() && cursor.type.id !== 4);
				// 	const end = cursor.to;

				// 	const slice = state.sliceDoc(start + 1, end - 1);
				// 	console.log(start, end, slice);
				// }

				if (cursor.type.name.contains("formatting-link-start")) {
					const linkFrom = cursor.from;
					while (cursor.nextSibling() && !cursor.type.name.contains("formatting-link-end"));
					const linkTo = cursor.to;

					// builder.add(linkFrom, linkFrom, Decoration.widget({ widget: widgets.externalLink }));

					let isSelected = false;
					for (const selectionRange of view.state.selection.ranges) {
						if (linkFrom <= selectionRange.to && linkTo >= selectionRange.from) {
							isSelected = true;
						}
					}

					if (!isSelected) {
						const textFrom = linkFrom + 2;
						const textTo = linkTo - 2;

						const text = view.state.sliceDoc(textFrom, textTo);

						const lastIndex = text.lastIndexOf("#");
						if (lastIndex >= 0) {
							builder.add(textFrom, textFrom + lastIndex + 1, Decoration.replace({}));
						}
					}

					if (plugin.configuration.showIcons) {
						builder.add(
							linkTo,
							linkTo,
							Decoration.widget({ side: 1, widget: widgets.externalLink })
						);
					}
				}
			},
		});
	}

	return builder.finish();
};

export const createLinkExtension = (plugin: ShortLinkPlugin) =>
	ViewPlugin.define(
		(view) => ({
			decorations: createDecorations(plugin, view),
			update(update) {
				if (update.view.composing || update.view.plugin(livePreviewState)?.mousedown) {
					this.decorations = this.decorations.map(update.changes);
				} else if (update.selectionSet || update.viewportChanged) {
					this.decorations = createDecorations(plugin, update.view);
				}
			},
		}),
		{
			decorations(value) {
				return value.decorations;
			},
		}
	);

export const consoleExtension = ViewPlugin.define(
	(_view) => ({
		update(update) {
			if (update.selectionSet || update.viewportChanged) {
				console.clear();

				const tree = syntaxTree(update.view.state);
				for (const { from, to } of update.view.visibleRanges) {
					iterate({
						tree,
						from,
						to,
						enter(cursor) {
							if (cursor.type.name.contains("Document")) return;

							let isSelected = false;
							for (const selectionRange of update.view.state.selection.ranges) {
								if (cursor.from <= selectionRange.to && cursor.to >= selectionRange.from) {
									isSelected = true;
								}
							}

							if (isSelected) {
								const slice = update.view.state.sliceDoc(cursor.from, cursor.to);
								console.log(cursor.type.name, cursor.type.id, slice);
							}
						},
					});
				}
			}
		},
	}),
	{}
);
