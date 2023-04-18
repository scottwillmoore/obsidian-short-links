import { getIcon } from "obsidian";

import { Position } from "./configuration";
import { createRange, getRange, Range, sliceText } from "./range";

export enum LinkType {
	External = "external",
	Internal = "internal",
}

export enum InternalLinkType {
	File = "file",
	Heading = "heading",
	Block = "block",
}

export interface LinkMap<T> {
	[LinkType.External]: T;
	[LinkType.Internal]: Record<InternalLinkType, T>;
}

export const iconMap: LinkMap<string> = {
	[LinkType.External]: "external-link",
	[LinkType.Internal]: {
		[InternalLinkType.File]: "file",
		[InternalLinkType.Heading]: "hash",
		[InternalLinkType.Block]: "box",
	},
};

interface InternalLinkFile {
	type: InternalLinkType.File;
	filePath: Range;
	parentPath: Range;
	fileName: Range;
	fileBase: Range;
	fileExtension: Range;
}

interface InternalLinkHeading extends Omit<InternalLinkFile, "type"> {
	type: InternalLinkType.Heading;
	heading: Range;
	lastHeading: Range;
}

interface InternalLinkBlock extends Omit<InternalLinkFile, "type"> {
	type: InternalLinkType.Block;
	block: Range;
}

export type InternalLink = InternalLinkFile | InternalLinkHeading | InternalLinkBlock;

export const parseInternalLink = (linkText: string): InternalLink => {
	const link = getRange(linkText);

	// hashIndex is relative to link.
	const hashIndex = linkText.indexOf("#");
	const hasHash = hashIndex >= 0;

	const filePathTo = hasHash ? link.from + hashIndex : link.to;
	const filePath = createRange(link.from, filePathTo);

	// lastSlashIndex is relative to filePath.
	const filePathText = sliceText(linkText, filePath);
	const lastSlashIndex = filePathText.lastIndexOf("/");
	const hasSlash = lastSlashIndex >= 0;

	const parentPathTo = hasSlash ? filePath.from + lastSlashIndex : filePath.from;
	const parentPath = createRange(filePath.from, parentPathTo);

	const fileNameFrom = hasSlash ? Math.min(parentPath.to + 1, filePath.to) : filePath.from;
	const fileName = createRange(fileNameFrom, filePath.to);

	// lastPeriodIndex is relative to fileName.
	const fileNameText = sliceText(linkText, fileName);
	const lastPeriodIndex = fileNameText.lastIndexOf(".");
	const hasPeriod = lastPeriodIndex >= 0;

	const fileBaseTo = hasPeriod ? fileName.from + lastPeriodIndex : fileName.to;
	const fileBase = createRange(fileName.from, fileBaseTo);

	const fileExtensionFrom = hasPeriod ? Math.min(fileBase.from + 1, fileName.to) : fileName.from;
	const fileExtension = createRange(fileExtensionFrom, fileName.to);

	if (hasHash) {
		// hashIndex is relative to link, therefore nextIndex is also relative to link.
		const nextIndex = hashIndex + 1;

		if (linkText[nextIndex] === "^") {
			const blockFrom = Math.min(nextIndex + 1, link.to);
			const block = createRange(blockFrom, link.to);

			return {
				type: InternalLinkType.Block,
				filePath,
				parentPath,
				fileName,
				fileBase,
				fileExtension,
				block,
			};
		}

		const headingFrom = Math.min(nextIndex, link.to);
		const heading = createRange(headingFrom, link.to);

		// lastHashIndex is relative to heading.
		const headingText = sliceText(linkText, heading);
		const lastHashIndex = headingText.lastIndexOf("#");
		const hasLastHash = lastHashIndex >= 0;

		const lastHeadingFrom = hasLastHash ? Math.min(heading.from + lastHashIndex + 1, heading.to) : heading.from;
		const lastHeading = createRange(lastHeadingFrom, heading.to);

		return {
			type: InternalLinkType.Heading,
			filePath,
			parentPath,
			fileName,
			fileBase,
			fileExtension,
			heading,
			lastHeading,
		};
	}

	return {
		type: InternalLinkType.File,
		filePath,
		parentPath,
		fileName,
		fileBase,
		fileExtension,
	};
};

export const createLinkIcon = (iconId: string, iconPosition: Position): HTMLElement => {
	const icon = getIcon(iconId);
	if (icon === null) throw new Error(`Failed to get icon: ${iconId}`);
	icon.removeAttribute("width");
	icon.removeAttribute("height");
	icon.removeAttribute("stroke-width");
	icon.removeClass("svg-icon");

	const linkIcon = document.createElement("span");
	linkIcon.addClass("link-icon");
	linkIcon.appendChild(icon);

	linkIcon.setAttribute("data-position", iconPosition);

	return linkIcon;
};
