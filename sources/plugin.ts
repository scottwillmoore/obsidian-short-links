import { Extension } from "@codemirror/state";
import { Plugin } from "obsidian";

import { Configuration, defaultConfiguration, ShortLinkPluginSettingTab } from "./configuration";
import { consoleExtension, createLinkExtension } from "./editorExtension";

const enableDeveloperExtensions = true;

export class ShortLinkPlugin extends Plugin {
	public configuration!: Configuration;

	private editorExtension = new Array<Extension>();
	private settingTab = new ShortLinkPluginSettingTab(this);

	public override async onload(): Promise<void> {
		await this.loadSettings();

		this.registerEditorExtension(this.editorExtension);
		this.addSettingTab(this.settingTab);

		this.updateBody();
		this.updateEditorExtension();
	}

	public override async onunload(): Promise<void> {
		await this.saveSettings();
	}

	private async loadSettings(): Promise<void> {
		const loadedConfiguration = await this.loadData();
		const mergedConfiguration = { ...defaultConfiguration, ...loadedConfiguration };
		this.configuration = new Proxy(mergedConfiguration, {
			set: (target, property, value, receiver) => {
				const success = Reflect.set(target, property, value, receiver);
				if (success) {
					this.updateBody();
					this.updateEditorExtension();

					this.saveSettings();
				}
				return success;
			},
		});
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.configuration);
	}

	private updateBody(): void {
		const className = "hide-external-link-icon";
		if (this.configuration.replaceExternalLinkIcons) {
			document.body.classList.add(className);
		} else {
			document.body.classList.remove(className);
		}
	}

	private updateEditorExtension(): void {
		this.editorExtension.length = 0;

		if (enableDeveloperExtensions) {
			this.editorExtension.push(consoleExtension);
		}

		const linkExtension = createLinkExtension(this);
		this.editorExtension.push(linkExtension);

		this.app.workspace.updateOptions();
	}
}

export default ShortLinkPlugin;
