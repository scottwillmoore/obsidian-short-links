export const markdownPostProcessor = () => {};

// private markdownPostProcessor: MarkdownPostProcessor = (element) => {
// 	const configuration = this.configuration;

// 	const externalLinks = element.querySelectorAll(
// 		"a.external-link"
// 	) as NodeListOf<HTMLAnchorElement>;

// 	for (const externalLink of externalLinks) {
// 		if (configuration.showIcons && configuration.replaceExternalLinkIcons) {
// 			const linkIconElement = createLinkIconElement("heading");
// 			externalLink.appendChild(linkIconElement);
// 		}
// 	}

// 	const internalLinks = element.querySelectorAll(
// 		"a.internal-link"
// 	) as NodeListOf<HTMLAnchorElement>;

// 	for (const internalLink of internalLinks) {
// 		const { type, hasAlias } = parseInternalLink(internalLink.href);

// 		if (!hasAlias) {
// 			if (type == "block" && configuration.shortenLinksToBlocks) {
// 				internalLink.innerText = "BLOCK";
// 			}

// 			if (type == "heading" && configuration.shortenLinksToHeadings) {
// 				internalLink.innerText = "HEADING";

// 				if (configuration.showSubheadings) {
// 					// TODO
// 				} else {
// 					// TODO
// 				}
// 			}
// 		}

// 		if (configuration.showIcons) {
// 			const linkIconElement = createLinkIconElement("heading");
// 			internalLink.appendChild(linkIconElement);
// 		}
// 	}
// };

// type InternalLinkBlock = {
// 	type: "block";

// 	hasAlias: boolean;
// 	alias?: string;

// 	blockName: string;
// };

// type InternalLinkHeading = {
// 	type: "heading";

// 	hasAlias: boolean;
// 	alias?: string;

// 	headingNames: string[];
// };

// type InternalLinkFile = {
// 	type: "file";

// 	hasAlias: boolean;
// 	alias?: string;

// 	fileName: string;
// };

// type InternalLink = InternalLinkBlock | InternalLinkHeading | InternalLinkFile;

// type InternalLink2 = { hasAlias: boolean; alias?: string } & (
// 	| { type: "block"; blockName: string }
// 	| { type: "heading"; headingNames: string[] }
// 	| { type: "file"; fileName: string }
// );

// type LinkType = "external" | InternalLink["type"];

// const parseInternalLink = (link: string): InternalLink => {
// 	const components = link.split("#");
// 	if (components.length < 2) {
// 		const fileName = link;
// 		return { type: "file", fileName };
// 	}

// 	const lastComponent = components[components.length - 1]!;
// 	const isBlock = lastComponent.startsWith("^");

// 	if (isBlock) {
// 		const blockName = lastComponent.substring(1);
// 		return { type: "block", blockName };
// 	}

// 	const headingNames = components.slice(1);
// 	return { type: "heading", headingNames };
// };

// const createLinkIconElement = (linkType: LinkType): HTMLElement => {
// 	const icon = getIcon("TODO");
// 	if (!icon) {
// 		throw new Error("TODO");
// 	}
// 	icon.removeAttribute("width");
// 	icon.removeAttribute("height");
// 	icon.removeAttribute("stroke-width");
// 	icon.removeClass("svg-icon");

// 	const span = document.createElement("span");
// 	span.addClass("link-icon");
// 	span.appendChild(icon);

// 	return span;
// };
