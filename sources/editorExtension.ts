import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, WidgetType } from "@codemirror/view";
import { Tree, TreeCursor } from "@lezer/common";
import { getIcon, livePreviewState } from "obsidian";

import { Position } from "./configuration";
import { ShortLinkPlugin } from "./plugin";

class LinkIconWidget extends WidgetType {
	private iconId: string;
	private iconPosition: Position;

	public constructor(iconId: string, iconPosition: Position) {
		super();

		this.iconId = iconId;
		this.iconPosition = iconPosition;
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
		span.setAttribute("data-position", this.iconPosition);

		return span;
	}
}

const decorations = {
	replace: Decoration.replace({}),

	start: {
		external: Decoration.widget({
			side: 0,
			widget: new LinkIconWidget("external-link", Position.Start),
		}),
		file: Decoration.widget({ side: 0, widget: new LinkIconWidget("file", Position.Start) }),
		note: Decoration.widget({ side: 0, widget: new LinkIconWidget("file-text", Position.Start) }),
		heading: Decoration.widget({ side: 0, widget: new LinkIconWidget("hash", Position.Start) }),
		block: Decoration.widget({ side: 0, widget: new LinkIconWidget("box", Position.Start) }),
	},
	end: {
		external: Decoration.widget({
			side: 1,
			widget: new LinkIconWidget("external-link", Position.End),
		}),
		file: Decoration.widget({ side: 1, widget: new LinkIconWidget("file", Position.End) }),
		note: Decoration.widget({ side: 1, widget: new LinkIconWidget("file-text", Position.End) }),
		heading: Decoration.widget({ side: 1, widget: new LinkIconWidget("hash", Position.End) }),
		block: Decoration.widget({ side: 1, widget: new LinkIconWidget("box", Position.End) }),
	},
};

interface Range {
	from: number;
	to: number;
}

const hasIntersection = (a: Range, b: Range): boolean => a.from <= b.to && a.to >= b.from;

interface IterateOptions {
	tree: Tree;
	range: Range;
	enter(cursor: TreeCursor): void;
}

const iterateTree = ({ tree, range, enter }: IterateOptions): void => {
	const cursor = tree.cursor();
	do {
		if (hasIntersection(range, cursor)) {
			enter(cursor);
			if (cursor.firstChild()) continue;
		}

		while (!cursor.nextSibling()) {
			if (!cursor.parent()) return;
		}
	} while (true);
};

const buildDecorations = (plugin: ShortLinkPlugin, view: EditorView): DecorationSet => {
	const builder = new RangeSetBuilder<Decoration>();

	const configuration = plugin.configuration;

	// NOTE: There may be a possible issue when visible ranges overlap which
	// will result in decorations being applied twice.

	const tree = syntaxTree(view.state);
	for (const range of view.visibleRanges) {
		iterateTree({
			tree,
			range,
			enter(cursor) {
				// NOTE: There is an edge case with external links without an
				// alias. For example, [](https://wikipedia.org) will not be
				// found as Obsidian parses the first node as a barelink instead
				// of a link. This could be handled, but the extra work is
				// probably not worth it.

				// NOTE: Obsidian does recognize and hyperlink plain URLs in
				// Markdown, but doesn't add the external link icon to them,
				// therefore this extension will preserve this behaviour.

				// Parse external links
				// [
				if (cursor.name.contains("formatting-link_link")) {
					// [Wikipedia](https://wikipedia.org/)
					// ...................................
					// ^
					const linkFrom = cursor.from;

					// (
					while (cursor.nextSibling() && !cursor.name.contains("formatting-link-string"));
					// )
					while (cursor.nextSibling() && !cursor.name.contains("formatting-link-string"));

					// [Wikipedia](https://wikipedia.org/)
					// ...................................
					//                                   ^
					const linkTo = cursor.to;

					if (configuration.showIcons && configuration.replaceExternalLinkIcons) {
						if (configuration.iconPosition === Position.Start) {
							builder.add(linkFrom, linkFrom, decorations.start.external);
						} else if (configuration.iconPosition === Position.End) {
							builder.add(linkTo, linkTo, decorations.end.external);
						}
					}
				}

				// Parse internal links
				// [[
				if (cursor.name.contains("formatting-link-start")) {
					// [[Note]]
					// ........
					// ^
					const linkFrom = cursor.from;

					// [[Note]]
					//   ....
					//   ^
					const contentFrom = cursor.to;

					// ]]
					while (cursor.nextSibling() && !cursor.name.contains("formatting-link-end"));

					// [[Note]]
					//   ....
					//      ^
					const contentTo = cursor.from;

					// [[Note]]
					// ........
					//        ^
					const linkTo = cursor.to;

					const content = view.state.sliceDoc(contentFrom, contentTo);
					const components = content.split("|");
					const path = components[0]!;
					const hasAlias = components.length > 1;

					const linkRange = { from: linkFrom, to: linkTo };
					const hasIntersectionWithLink = hasIntersection.bind(undefined, linkRange);
					const isSelected = view.state.selection.ranges.some(hasIntersectionWithLink);

					// Blocks
					// [[Folder1/Folder2/Note#^Block]] [[Block]]
					const index = path.lastIndexOf("^");
					if (index >= 0) {
						if (configuration.showIcons && configuration.iconPosition === Position.Start) {
							builder.add(linkFrom, linkFrom, decorations.start.block);
						}

						if (configuration.shortLinksToBlocks && !hasAlias && !isSelected) {
							let hideTo = contentFrom + index + 1;
							if (configuration.showCarets) {
								hideTo -= 1;
							}
							builder.add(contentFrom, hideTo, decorations.replace);
						}

						if (configuration.showIcons && configuration.iconPosition === Position.End) {
							builder.add(linkTo, linkTo, decorations.end.block);
						}
					} else {
						// Headings
						// [[Folder1/Folder2/Note#Heading1]] [[Heading1]]

						let index: number;
						if (plugin.configuration.showSubheadings) {
							// [[Folder1/Folder2/Note#Heading1#Heading2]] [[Heading1#Heading2]]
							index = path.indexOf("#");
						} else {
							// [[Folder1/Folder2/Note#Heading1#Heading2]] [[Heading2]]
							index = path.lastIndexOf("#");
						}

						if (index >= 0) {
							if (configuration.showIcons && configuration.iconPosition === Position.Start) {
								builder.add(linkFrom, linkFrom, decorations.start.heading);
							}

							if (plugin.configuration.shortLinksToHeadings && !hasAlias && !isSelected) {
								builder.add(contentFrom, contentFrom + index + 1, decorations.replace);
							}

							if (configuration.showIcons && configuration.iconPosition === Position.End) {
								builder.add(linkTo, linkTo, decorations.end.heading);
							}
						} else {
							// Files and notes
							// [[Folder1/Folder2/File.png]] [File.png]]
							// [[Folder1/Folder2/Note]]	[Note]]

							const isFile = path.match(/(?<base>.+)\.(?<extension>\w+)/);

							if (configuration.showIcons && configuration.iconPosition === Position.Start) {
								if (isFile) {
									builder.add(linkFrom, linkFrom, decorations.start.file);
								} else {
									builder.add(linkFrom, linkFrom, decorations.start.note);
								}
							}

							const index = path.lastIndexOf("/");
							if (index >= 0) {
								if (plugin.configuration.shortLinksToFiles && !hasAlias && !isSelected) {
									builder.add(contentFrom, contentFrom + index + 1, decorations.replace);
								}
							}

							if (configuration.showIcons && configuration.iconPosition === Position.End) {
								if (isFile) {
									builder.add(linkTo, linkTo, decorations.end.file);
								} else {
									builder.add(linkTo, linkTo, decorations.end.note);
								}
							}
						}
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
			decorations: buildDecorations(plugin, view),
			update(update) {
				if (update.view.composing || update.view.plugin(livePreviewState)?.mousedown) {
					this.decorations = this.decorations.map(update.changes);
				} else if (update.selectionSet || update.viewportChanged) {
					this.decorations = buildDecorations(plugin, update.view);
				}
			},
		}),
		{
			decorations(value) {
				return value.decorations;
			},
		}
	);

export const consoleExtension = ViewPlugin.define(() => ({
	update(update) {
		if (update.selectionSet || update.viewportChanged) {
			console.clear();

			const tree = syntaxTree(update.view.state);
			for (const range of update.view.visibleRanges) {
				iterateTree({
					tree,
					range,
					enter(cursor) {
						if (cursor.name.contains("Document")) return;

						const hasIntersectionWithCursor = hasIntersection.bind(undefined, cursor);
						const isSelected = update.view.state.selection.ranges.some(hasIntersectionWithCursor);

						if (isSelected) {
							const text = update.view.state.sliceDoc(cursor.from, cursor.to);
							console.log(cursor.name, text);
						}
					},
				});
			}
		}
	},
}));
