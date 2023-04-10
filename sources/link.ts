import { getIcon } from "obsidian";

import { Position } from "./configuration";

export enum LinkType {
	External = "external",
	Internal = "internal",
}

export enum InternalLinkType {
	Block = "block",
	Heading = "heading",
	Note = "note",
	File = "file",
}

export interface LinkMap<T> {
	[LinkType.External]: T;
	[LinkType.Internal]: Record<InternalLinkType, T>;
}

export const iconMap: LinkMap<string> = {
	[LinkType.External]: "external-link",
	[LinkType.Internal]: {
		[InternalLinkType.Block]: "box",
		[InternalLinkType.Heading]: "hash",
		[InternalLinkType.Note]: "file-text",
		[InternalLinkType.File]: "file",
	},
};

interface InternalLinkBlock {
	type: InternalLinkType.Block;
	block: string;
	blockIndex: number;
}

interface InternalLinkHeading {
	type: InternalLinkType.Heading;
	heading: string;
	headingIndex: number;
	lastHeading: string;
	lastHeadingIndex: number;
}

interface InternalLinkNote {
	type: InternalLinkType.Note;
	path: string;
	pathIndex: number;
	name: string;
	nameIndex: number;
}

interface InternalLinkFile {
	type: InternalLinkType.File;
	path: string;
	pathIndex: number;
	name: string;
	nameIndex: number;
	base: string;
	extension: string;
}

export type InternalLink = InternalLinkBlock | InternalLinkHeading | InternalLinkNote | InternalLinkFile;

export const parseInternalLink = (link: string): InternalLink => {
	const caretIndex = link.lastIndexOf("^");
	if (caretIndex >= 0) {
		const type = InternalLinkType.Block;

		const blockIndex = caretIndex + 1;
		const block = link.substring(blockIndex);

		// Folder1/Folder2/Note#^
		//						  block

		// Folder1/Folder2/Note#^Block
		//						 ..... block

		return { type, block, blockIndex };
	} else {
		const hashIndex = link.indexOf("#");

		if (hashIndex >= 0) {
			const type = InternalLinkType.Heading;

			const headingIndex = hashIndex + 1;
			const heading = link.substring(headingIndex);

			const lastHeadingIndex = link.lastIndexOf("#") + 1;
			const lastHeading = link.substring(lastHeadingIndex);

			// Folder1/Folder2/Note#
			//                       heading
			// 						 lastHeading

			// Folder1/Folder2/Note#Heading1
			//                      ........ heading
			//                      ........ lastHeading

			// Folder1/Folder2/Note#Heading1#Heading2
			//                      ................. heading
			//                               ........ lastHeading

			return { type, heading, headingIndex, lastHeading, lastHeadingIndex };
		} else {
			const pathIndex = link.lastIndexOf("/");
			const path = link.substring(0, pathIndex);

			const nameIndex = pathIndex + 1;
			const name = link.substring(nameIndex);

			const matches = name.match(/(?<base>.+)\.(?<extension>\w+)/);
			if (matches === null) {
				const type = InternalLinkType.Note;

				// Note
				//      path
				// .... name

				// Folder1/Folder2/Note
				// ...............      path
				//                 .... name

				return { type, path, pathIndex, name, nameIndex };
			} else {
				const type = InternalLinkType.File;

				const base = matches.groups!.base!;
				const extension = matches.groups!.extension!;

				// File.svg
				//          path
				// ........ name
				// ....     base
				//      ... extension

				// Folder1/Folder2/File.svg
				// ...............          path
				//                 ........ name
				//                 ....     base
				//                      ... extension

				return { type, path, pathIndex, name, nameIndex, base, extension };
			}
		}
	}
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

	const position = iconPosition === Position.Start ? "start" : "end";
	linkIcon.setAttribute("data-position", position);

	return linkIcon;
};
