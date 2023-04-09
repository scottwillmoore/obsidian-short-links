import { MarkdownPostProcessor } from "obsidian";

import { Position } from "./configuration";
import { createLinkIcon, iconMap, InternalLinkType, LinkType, parseInternalLink } from "./link";
import { ShortLinkPlugin } from "./plugin";

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

	const externalLinkElements = element.querySelectorAll(
		"a.external-link"
	) as NodeListOf<HTMLAnchorElement>;

	for (const linkElement of externalLinkElements) {
		if (configuration.showIcons && configuration.replaceExternalLinkIcons) {
			insertLinkIcon(linkElement, iconMap[LinkType.External]);
		}
	}

	const internalLinkElements = element.querySelectorAll(
		"a.internal-link"
	) as NodeListOf<HTMLAnchorElement>;

	for (const linkElement of internalLinkElements) {
		const link = linkElement.getAttribute("href");
		if (link === null) continue;

		const isAlias = linkElement.hasAttribute("aria-label");

		const internalLink = parseInternalLink(link);

		switch (internalLink.type) {
			case InternalLinkType.Block:
				if (configuration.shortLinksToBlocks && !isAlias) {
					linkElement.setText(internalLink.block);
				}
				break;

			case InternalLinkType.Heading:
				if (configuration.shortLinksToHeadings && !isAlias) {
					if (configuration.showSubheadings) {
						linkElement.setText(internalLink.heading);
					} else {
						linkElement.setText(internalLink.lastHeading);
					}
				}
				break;

			case InternalLinkType.Note:
			case InternalLinkType.File:
				if (configuration.shortLinksToFiles && !isAlias) {
					linkElement.setText(internalLink.name);
				}
				break;
		}

		if (configuration.showIcons) {
			insertLinkIcon(linkElement, iconMap[LinkType.Internal][internalLink.type]);
		}
	}
};
