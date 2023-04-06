import { PluginSettingTab, Setting } from "obsidian";
import { ShortLinkPlugin } from "./plugin";

export type Configuration = {
	shortenLinksToFiles: boolean;

	shortenLinksToHeadings: boolean;
	showSubheadings: boolean;

	shortenLinksToBlocks: boolean;

	showIcons: boolean;
	replaceExternalLinkIcons: boolean;
};

export const defaultConfiguration: Configuration = {
	shortenLinksToFiles: true,

	shortenLinksToHeadings: true,
	showSubheadings: false,

	shortenLinksToBlocks: true,

	showIcons: true,
	replaceExternalLinkIcons: true,
};

export class ShortLinkPluginSettingTab extends PluginSettingTab {
	private plugin: ShortLinkPlugin;

	constructor(plugin: ShortLinkPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	override display(): void {
		const configuration = this.plugin.configuration;

		this.containerEl.empty();

		new Setting(this.containerEl).setHeading().setName("Notes");

		// E.g File.png -> File.png
		// E.g. Folder1/Folder2/File.png -> File.png
		// E.g Note -> Note
		// E.g. Folder1/Folder2/Note -> Note
		new Setting(this.containerEl)
			.setName("Shorten links to files")
			.setDesc("Only show the file name in internal links to files.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortenLinksToBlocks).onChange((newValue) => {
					configuration.shortenLinksToBlocks = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Headings");

		// E.g. Folder1/Folder2/Note#Heading1 -> Heading1
		// E.g. Folder1/Folder2/Note#Heading1#Heading2 -> Heading2
		new Setting(this.containerEl)
			.setName("Shorten links to headings")
			.setDesc("Only show the heading name in internal links to headings.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortenLinksToHeadings).onChange((newValue) => {
					configuration.shortenLinksToHeadings = newValue;
				})
			);

		// E.g. Folder1/Folder2/Note#Heading1 -> Heading1
		// E.g. Folder1/Folder2/Note#Heading1#Heading2 -> Heading1#Heading2
		new Setting(this.containerEl)
			.setName("Show subheadings")
			.setDesc("Show both headings and subheadings in shortened internal links to headings.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.showSubheadings).onChange((newValue) => {
					configuration.showSubheadings = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Blocks");

		// E.g. Folder1/Folder2/Note#^Block -> Block
		// E.g. Folder1/Folder2/Note#Heading1#^Block -> Block
		new Setting(this.containerEl)
			.setName("Shorten links to blocks")
			.setDesc("Only show the block name in internal links to blocks.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortenLinksToBlocks).onChange((newValue) => {
					configuration.shortenLinksToBlocks = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Icons");

		// E.g File.png -> [FILE_ICON] File.png
		// E.g. Folder1/Folder2/File.png -> [FILE_ICON] File.png
		// E.g Note -> [NOTE_ICON] Note
		// E.g. Folder1/Folder2/Note -> [NOTE_ICON] Note
		// E.g. Folder1/Folder2/Note#Heading1 -> [HEADING_ICON] Heading1
		// E.g. Folder1/Folder2/Note#Heading1#Heading2 -> [HEADING_ICON] Heading2
		// E.g. Folder1/Folder2/Note#^Block -> [BLOCK_ICON] Block
		// E.g. Folder1/Folder2/Note#Heading1#^Block -> [BLOCK_ICON] Block
		new Setting(this.containerEl)
			.setName("Show icons")
			.setDesc(
				"Show icons next to internal links which reflect their type (notes, headings or blocks)."
			)
			.addToggle((toggle) =>
				toggle.setValue(configuration.showIcons).onChange((newValue) => {
					configuration.showIcons = newValue;
				})
			);

		// E.g. https://wikipedia.org/ -> [EXTERNAL_ICON] https://wikipedia.org/
		new Setting(this.containerEl)
			.setName("Replace external link icons")
			.setDesc("For consistency, let this plugin replace the default icon for external links.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.replaceExternalLinkIcons).onChange((newValue) => {
					configuration.replaceExternalLinkIcons = newValue;
				})
			);
	}
}
