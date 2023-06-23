import { MarkdownPostProcessor } from "obsidian";

import { Position } from "./configuration";
import { createLinkIcon, iconMap, InternalLinkType, LinkType, parseInternalLink } from "./link";
import { ShortLinkPlugin } from "./plugin";
import { sliceText } from "./range";

type CreateMarkdownPostProcessor = (plugin: ShortLinkPlugin) => MarkdownPostProcessor;

export const createMarkdownPostProcessor: CreateMarkdownPostProcessor = (plugin) => (element) => {
	const configuration = plugin.configuration;

	const insertLinkIcon = (element: Element, iconId: string): void => {
		const linkIcon = createLinkIcon(iconId, configuration.iconPosition);
		if (configuration.iconPosition === Position.Start) {
			element.prepend(linkIcon);
		} else if (configuration.iconPosition === Position.End) {
			element.append(linkIcon);
		}
	};

	const externalLinkElements = element.querySelectorAll("a.external-link") as NodeListOf<HTMLAnchorElement>;

	for (const linkElement of externalLinkElements) {
		if (configuration.showIcons && configuration.replaceExternalLinkIcons) {
			insertLinkIcon(linkElement, iconMap[LinkType.External]);
		}
	}

	const internalLinkElements = element.querySelectorAll("a.internal-link") as NodeListOf<HTMLAnchorElement>;

	for (const linkElement of internalLinkElements) {
		const link = linkElement.getAttribute("href");
		if (link === null) continue;

		// NOTE: There is no easy way to detect whether a link is an alias or
		// not. At the moment, the only way to detect whether a link is an
		// alias is to check whether the `aria-label` attribute exists.
		// However, this does not work in rare cases, for example in the
		// Dataview plugin.  Therefore, we also must check whether the
		// attribute is different from  the link text and also strip any file
		// names! At the moment we just remove all instances of `.md`, however
		// this is not a perfect solution.

		const ariaLabel = linkElement.getAttribute("aria-label");
		const expectedText = ariaLabel?.replace(".md", "");
		const isAlias = expectedText !== linkElement.getText();

		const internalLink = parseInternalLink(link);

		if (configuration.shortLinksToFiles && !isAlias) {
			const fileBaseText = sliceText(link, internalLink.fileBase);
			linkElement.setText(fileBaseText);
		}

		switch (internalLink.type) {
			case InternalLinkType.Heading:
				let formattedHeadingText;
				if (configuration.showSubheadings) {
					const headingText = sliceText(link, internalLink.heading);
					formattedHeadingText = headingText.split("#").join(" > ");
				} else {
					formattedHeadingText = sliceText(link, internalLink.lastHeading);
				}

				if (!isAlias) {
					if (configuration.shortLinksToHeadings) {
						linkElement.setText(formattedHeadingText);
					} else if (configuration.shortLinksToFiles) {
						linkElement.appendText(" > " + formattedHeadingText);
					}
				}

				break;

			case InternalLinkType.Block:
				const block = { ...internalLink.block };
				if (configuration.showCaret) {
					block.from -= 1;
				}
				const blockText = sliceText(link, block);

				if (!isAlias) {
					if (configuration.shortLinksToBlocks) {
						linkElement.setText(blockText);
					} else if (configuration.shortLinksToFiles) {
						linkElement.appendText(" > " + blockText);
					}
				}

				break;
		}

		if (configuration.showIcons) {
			insertLinkIcon(linkElement, iconMap[LinkType.Internal][internalLink.type]);
		}
	}
};
