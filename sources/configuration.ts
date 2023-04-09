import { PluginSettingTab, Setting } from "obsidian";
import { ShortLinkPlugin } from "./plugin";

export enum Position {
	Start = "start",
	End = "end",
}

// NOTE: It would be a good idea to attempt to maintain a versioned
// configuration, therefore making it easier to support forward and backward
// compatibility.

export interface Configuration {
	// Files
	shortLinksToFiles: boolean;

	// Headings
	shortLinksToHeadings: boolean;
	showSubheadings: boolean;

	// Blocks
	shortLinksToBlocks: boolean;
	showCarets: boolean;

	// Icons
	showIcons: boolean;
	replaceExternalLinkIcons: boolean;
	iconPosition: Position;
}

export const defaultConfiguration: Configuration = {
	// Files
	shortLinksToFiles: true,

	// Headings
	shortLinksToHeadings: true,
	showSubheadings: true,

	// Blocks
	shortLinksToBlocks: true,
	showCarets: true,

	// Icons
	showIcons: true,
	replaceExternalLinkIcons: true,
	iconPosition: Position.End,
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

		new Setting(this.containerEl).setHeading().setName("Notes");

		new Setting(this.containerEl)
			.setName("Short links to files")
			.setDesc("Only show the file name in internal links to files.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortLinksToFiles).onChange((newValue) => {
					configuration.shortLinksToFiles = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Headings");

		new Setting(this.containerEl)
			.setName("Short links to headings")
			.setDesc("Only show the heading name in internal links to headings.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortLinksToHeadings).onChange((newValue) => {
					configuration.shortLinksToHeadings = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Show subheadings")
			.setDesc("Show both headings and subheadings in shortened internal links to headings.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.showSubheadings).onChange((newValue) => {
					configuration.showSubheadings = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Blocks");

		new Setting(this.containerEl)
			.setName("Short links to blocks")
			.setDesc("Only show the block name in internal links to blocks.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.shortLinksToBlocks).onChange((newValue) => {
					configuration.shortLinksToBlocks = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Show carets")
			.setDesc("Show the block name with a caret.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.showCarets).onChange((newValue) => {
					configuration.showCarets = newValue;
				})
			);

		new Setting(this.containerEl).setHeading().setName("Icons");

		new Setting(this.containerEl)
			.setName("Show icons")
			.setDesc("Show icons with links to indicate their type.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.showIcons).onChange((newValue) => {
					configuration.showIcons = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Replace external link icons")
			.setDesc("For consistency, let this plugin replace the default icon for external links.")
			.addToggle((toggle) =>
				toggle.setValue(configuration.replaceExternalLinkIcons).onChange((newValue) => {
					configuration.replaceExternalLinkIcons = newValue;
				})
			);

		new Setting(this.containerEl)
			.setName("Icon position")
			.setDesc("Set whether icons are show before or after the link.")
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
