import { syntaxTree } from "@codemirror/language";
import { Extension, RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, WidgetType } from "@codemirror/view";
import { Tree, TreeCursor } from "@lezer/common";
import { livePreviewState } from "obsidian";

import { Configuration, Position } from "./configuration";
import { createLinkIcon, iconMap, InternalLinkType, LinkMap, LinkType, parseInternalLink } from "./link";
import { ShortLinkPlugin } from "./plugin";
import { intersectRange, Range } from "./range";

class LinkIconWidget extends WidgetType {
	private iconId: string;
	private iconPosition: Position;

	public constructor(iconId: string, iconPosition: Position) {
		super();

		this.iconId = iconId;
		this.iconPosition = iconPosition;
	}

	public override eq(widget: LinkIconWidget): boolean {
		return this.iconId === widget.iconId && this.iconPosition === widget.iconPosition;
	}

	public override toDOM(): HTMLElement {
		return createLinkIcon(this.iconId, this.iconPosition);
	}
}

// NOTE: The `mapObject` and `mapRecursiveObject` are poorly typed, because it
// is quite difficult to write a generic `mapRecursiveObject` function... Since
// they are only used by `createDecorationMap` I am confident that their
// behaviour is correct. However, in other cases there behaviour is unverified
// and therefore unexpected, hence use with extreme cation.

const mapObject = (object: any, map: (value: any) => any): any =>
	Object.fromEntries(Object.entries(object).map(([key, value]) => [key, map(value)]));

const mapRecursiveObject = (object: any, map: (value: any) => any): any =>
	mapObject(object, (value) => (typeof value === "object" ? mapObject(value, map) : map(value)));

const createDecorationMap = (iconPosition: Position): LinkMap<Decoration> =>
	mapRecursiveObject(iconMap, (iconId) =>
		Decoration.widget({
			side: iconPosition === Position.Start ? 0 : 1,
			widget: new LinkIconWidget(iconId, iconPosition),
		})
	);

interface IterateOptions {
	tree: Tree;
	range: Range;
	enter(cursor: TreeCursor): void;
}

const iterateTree = ({ tree, range, enter }: IterateOptions): void => {
	const cursor = tree.cursor();
	do {
		if (intersectRange(range, cursor)) {
			enter(cursor);
			if (cursor.firstChild()) continue;
		}

		while (!cursor.nextSibling()) {
			if (!cursor.parent()) return;
		}
	} while (true);
};

const createDecorationSet = (
	view: EditorView,
	configuration: Configuration,
	decorationMap: LinkMap<Decoration>
): DecorationSet => {
	const builder = new RangeSetBuilder<Decoration>();

	// NOTE: There may be a possible issue when visible ranges overlap which
	// will result in decorations being applied twice.

	const tree = syntaxTree(view.state);
	for (const range of view.visibleRanges) {
		iterateTree({
			tree,
			range,
			enter(cursor) {
				// NOTE: There is an edge case with external links without an
				// alias. For example, `[](https://wikipedia.org)` will not be
				// found as Obsidian parses the first node as a barelink instead
				// of a link. This could be handled, but the extra work is
				// probably not worth it.

				// NOTE: Obsidian does recognize plain URLs in Markdown, but
				// doesn't add the external link icon to them in the live
				// preview, therefore this extension will preserve this
				// behaviour.

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
						const decorationAt = configuration.iconPosition === Position.Start ? linkFrom : linkTo;
						const decoration = decorationMap[LinkType.External];
						builder.add(decorationAt, decorationAt, decoration);
					}
				}

				// Parse internal links
				// [[
				if (cursor.name.contains("formatting-link-start") && !cursor.name.contains("footref")) {
					// [[Note]]
					// ........
					// ^
					const startFrom = cursor.from;

					// [[Note]]
					//   ....
					//   ^
					const linkFrom = cursor.to;

					// ]]
					while (cursor.nextSibling() && !cursor.name.contains("formatting-link-end"));

					// [[Note]]
					//   ....
					//      ^
					const linkTo = cursor.from;

					// [[Note]]
					// ........
					//        ^
					const endTo = cursor.to;

					const aliasedLink = view.state.sliceDoc(linkFrom, linkTo);
					const [link, ...aliases] = aliasedLink.split("|");
					if (link === undefined) throw new Error(`Failed to get path: ${aliasedLink}`);
					const isAlias = aliases.length > 0;

					const intersectWithLink = intersectRange.bind(undefined, { from: startFrom, to: endTo });
					const isSelected = view.state.selection.ranges.some(intersectWithLink);

					const internalLink = parseInternalLink(link);

					const decorationAt = configuration.iconPosition === Position.Start ? startFrom : endTo;
					const decoration = decorationMap[LinkType.Internal][internalLink.type];

					if (configuration.showIcons && configuration.iconPosition === Position.Start) {
						builder.add(decorationAt, decorationAt, decoration);
					}

					switch (internalLink.type) {
						case InternalLinkType.Heading:
							if (configuration.shortLinksToHeadings && !isAlias && !isSelected) {
								let hideTo = linkFrom;

								if (configuration.showSubheadings) {
									hideTo += internalLink.heading.from;
								} else {
									hideTo += internalLink.lastHeading.from;
								}

								if (configuration.showHash) {
									hideTo -= 1;
								}

								builder.add(linkFrom, hideTo, Decoration.replace({}));
							}
							break;

						case InternalLinkType.Block:
							if (configuration.shortLinksToBlocks && !isAlias && !isSelected) {
								let hideTo = linkFrom + internalLink.block.from;

								if (configuration.showCaret) {
									hideTo -= 1;
								}

								builder.add(linkFrom, hideTo, Decoration.replace({}));
							}
							break;
					}

					if (configuration.shortLinksToFiles && !isAlias && !isSelected) {
						let hideTo = linkFrom + internalLink.fileName.from;
						builder.add(linkFrom, hideTo, Decoration.replace({}));
					}

					if (configuration.showIcons && configuration.iconPosition === Position.End) {
						builder.add(decorationAt, decorationAt, decoration);
					}
				}
			},
		});
	}

	return builder.finish();
};

// NOTE: At the moment we create and load the extension every time the plugin
// configuration is changed. This is easiest and appears to work, but would it
// would be better to use a Compartment [1].
//
// [1] https://codemirror.net/docs/ref/#state.Compartment

type CreateEditorExtension = (plugin: ShortLinkPlugin) => Extension;

export const createEditorExtension: CreateEditorExtension = (plugin) =>
	ViewPlugin.define(
		(view) => {
			const decorationMap = createDecorationMap(plugin.configuration.iconPosition);
			const decorationSet = createDecorationSet(view, plugin.configuration, decorationMap);

			return {
				decorationMap,
				decorationSet,
				update(update) {
					if (update.view.composing || update.view.plugin(livePreviewState)?.mousedown) {
						this.decorationSet = this.decorationSet.map(update.changes);
					} else if (update.selectionSet || update.viewportChanged) {
						this.decorationSet = createDecorationSet(update.view, plugin.configuration, this.decorationMap);
					}
				},
			};
		},
		{
			decorations(value) {
				return value.decorationSet;
			},
		}
	);

// NOTE: This extension is only used for development to analyze the structure of
// the CodeMirror syntax tree.

export const consoleEditorExtension = ViewPlugin.define(() => ({
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

						const hasIntersectionWithCursor = intersectRange.bind(undefined, cursor);
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
