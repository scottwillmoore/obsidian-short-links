import { PluginSettingTab, Setting } from "obsidian";
import { ShortLinkPlugin } from "./plugin";

export enum Position {
	Start = "start",
	End = "end",
}

export interface Configuration {
	version: 2;

	// Files
	shortLinksToFiles: boolean;
	shortNames: string;

	// Headings
	shortLinksToHeadings: boolean;
	showSubheadings: boolean;
	showHash: boolean;

	// Blocks
	shortLinksToBlocks: boolean;
	showCaret: boolean;

	// Icons
	showIcons: boolean;
	replaceExternalLinkIcons: boolean;
	iconPosition: Position;
}

export const defaultConfiguration: Configuration = {
	version: 2,

	// Files
	shortLinksToFiles: true,
	shortNames: "short-name",

	// Headings
	shortLinksToHeadings: true,
	showSubheadings: false,
	showHash: false,

	// Blocks
	shortLinksToBlocks: true,
	showCaret: false,

	// Icons
	showIcons: true,
	replaceExternalLinkIcons: true,
	iconPosition: Position.Start,
};

// NOTE: It would be nice to have a live preview of example Markdown that would
// reflect what effect each setting has on the plugin.

export class ShortLinkPluginSettingTab extends PluginSettingTab {
	private plugin: ShortLinkPlugin;

	constructor(plugin: ShortLinkPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	override display(): void {
		const configuration = this.plugin.configuration;

		this.containerEl.empty();

		new Setting(this.containerEl).setHeading().setName("Files");

		new Setting(this.containerEl)
			.setName("Short links to files")
			.setDesc("Only show the file name in links to headings.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortLinksToFiles).onChange((newValue) => {
					configuration.shortLinksToFiles = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Short names")
			.setDesc("Replace links with the short name defined by the frontmatter.")
			.addText((text) =>
				text.setValue(configuration.shortNames).onChange((newValue) => {
					configuration.shortNames = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Headings");

		new Setting(this.containerEl)
			.setName("Short links to headings")
			.setDesc("Only show the last heading name in links to headings.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortLinksToHeadings).onChange((newValue) => {
					configuration.shortLinksToHeadings = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Show subheadings")
			.setDesc("Show all heading names in links to headings.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.showSubheadings).onChange((newValue) => {
					configuration.showSubheadings = newValue;
				})
			);
		new Setting(this.containerEl)
			.setName("Show hash")
			.setDesc("Show the hash at the start of links to headings.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.showHash).onChange((newValue) => {
					configuration.showHash = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Blocks");

		new Setting(this.containerEl)
			.setName("Short links to blocks")
			.setDesc("Only show the block name in links to blocks.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortLinksToBlocks).onChange((newValue) => {
					configuration.shortLinksToBlocks = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Show caret")
			.setDesc("Show the caret at the start of links to blocks.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.showCaret).onChange((newValue) => {
					configuration.showCaret = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Icons");

		new Setting(this.containerEl)
			.setName("Show icons")
			.setDesc("Show icons to indicate the type of internal link.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.showIcons).onChange((newValue) => {
					configuration.showIcons = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Replace external link icons")
			.setDesc("For consistency, replace the default icon used for external links.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.replaceExternalLinkIcons).onChange((newValue) => {
					configuration.replaceExternalLinkIcons = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Icon position")
			.setDesc("Set whether icons are show at the start or end of links.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						[Position.Start]: "Start",
						[Position.End]: "End",
					})
					.setValue(configuration.iconPosition)
					.onChange((newValue) => {
						configuration.iconPosition = newValue as Position;
					})
			);
	}
}
