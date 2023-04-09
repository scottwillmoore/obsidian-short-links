import { getIcon, MarkdownPostProcessor } from "obsidian";

import { Position } from "./configuration";
import { ShortLinkPlugin } from "./plugin";

// NOTE: Refactor implementation. There is significant duplication across
// editorExtension and markdownPostProcessor. In addition, some of the logic
// should be able to be deduplicated.

const createLinkIcon = (iconId: string, iconPosition: Position): HTMLElement => {
	const icon = getIcon(iconId);
	if (icon === null) {
		throw new Error(`Failed to get icon: ${iconId}`);
	}
	icon.removeAttribute("width");
	icon.removeAttribute("height");
	icon.removeAttribute("stroke-width");
	icon.removeClass("svg-icon");

	const span = document.createElement("span");
	span.addClass("link-icon");
	span.appendChild(icon);
	span.setAttribute("data-position", iconPosition);

	return span;
};

export const createMarkdownPostProcessor =
	(plugin: ShortLinkPlugin): MarkdownPostProcessor =>
	(element) => {
		const configuration = plugin.configuration;

		const externalLinks = element.querySelectorAll(
			"a.external-link"
		) as NodeListOf<HTMLAnchorElement>;

		for (const externalLink of externalLinks) {
			if (configuration.showIcons && configuration.replaceExternalLinkIcons) {
				const linkIcon = createLinkIcon("external-link", configuration.iconPosition);
				if (configuration.iconPosition === Position.Start) {
					externalLink.prepend(linkIcon);
				} else if (configuration.iconPosition === Position.End) {
					externalLink.append(linkIcon);
				}
			}
		}

		const internalLinks = element.querySelectorAll(
			"a.internal-link"
		) as NodeListOf<HTMLAnchorElement>;

		for (const internalLink of internalLinks) {
			const path = internalLink.getAttribute("href");
			if (!path) continue;

			const isAlias = internalLink.hasAttribute("aria-label");

			// Blocks
			// [[Folder1/Folder2/Note#^Block]] [[Block]]
			const index = path.lastIndexOf("^");
			if (index >= 0) {
				if (configuration.shortLinksToBlocks && !isAlias) {
					const text = path.substring(configuration.showCarets ? index : index + 1);
					internalLink.setText(text);
				}

				if (configuration.showIcons) {
					const linkIcon = createLinkIcon("file-text", configuration.iconPosition);
					if (configuration.iconPosition === Position.Start) {
						internalLink.prepend(linkIcon);
					} else if (configuration.iconPosition === Position.End) {
						internalLink.append(linkIcon);
					}
				}
			} else {
				// Headings
				let index: number;
				if (configuration.showSubheadings) {
					// [[Folder1/Folder2/Note#Heading1#Heading2]] [[Heading1#Heading2]]
					index = path.indexOf("#");
				} else {
					// [[Folder1/Folder2/Note#Heading1#Heading2]] [[Heading2]]
					index = path.lastIndexOf("#");
				}

				if (index >= 0) {
					if (configuration.shortLinksToHeadings && !isAlias) {
						const text = path.substring(index + 1);
						internalLink.setText(text);
					}

					if (configuration.showIcons) {
						const linkIcon = createLinkIcon("file-text", configuration.iconPosition);
						if (configuration.iconPosition === Position.Start) {
							internalLink.prepend(linkIcon);
						} else if (configuration.iconPosition === Position.End) {
							internalLink.append(linkIcon);
						}
					}
				} else {
					// Files and notes
					// [[Folder1/Folder2/File.png]] [File.png]]
					// [[Folder1/Folder2/Note]]	[Note]]

					const index = path.lastIndexOf("/");
					if (index >= 0) {
						if (configuration.shortLinksToFiles && !isAlias) {
							const text = path.substring(index + 1);
							internalLink.setText(text);
						}
					}

					if (configuration.showIcons) {
						const isFile = path.match(/(?<base>.+)\.(?<extension>\w+)/);

						const iconId = isFile ? "file" : "file-text";
						const linkIcon = createLinkIcon(iconId, configuration.iconPosition);

						if (configuration.iconPosition === Position.Start) {
							internalLink.prepend(linkIcon);
						} else if (configuration.iconPosition === Position.End) {
							internalLink.append(linkIcon);
						}
					}
				}
			}
		}
	};
