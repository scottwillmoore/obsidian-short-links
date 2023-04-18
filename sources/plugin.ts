import { Extension } from "@codemirror/state";
import { MarkdownView, Plugin } from "obsidian";

import { Configuration, defaultConfiguration, ShortLinkPluginSettingTab } from "./configuration";
import { createEditorExtension } from "./editorExtension";
import { createMarkdownPostProcessor } from "./markdownPostProcessor";

export class ShortLinkPlugin extends Plugin {
	public configuration!: Configuration;

	private settingTab = new ShortLinkPluginSettingTab(this);

	private editorExtension = new Array<Extension>(createEditorExtension(this));
	private markdownPostProcessor = createMarkdownPostProcessor(this);

	public override async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(this.settingTab);

		this.registerEditorExtension(this.editorExtension);
		this.registerMarkdownPostProcessor(this.markdownPostProcessor);

		this.updateBody();
		this.updateEditor();
	}

	public override async onunload(): Promise<void> {
		this.updateBody(true);
		this.updateEditor();

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
					this.updateEditor();

					this.saveSettings();
				}

				return success;
			},
		});
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.configuration);
	}

	private updateBody(removeClasses: boolean = false): void {
		const className = "hide-external-link-icon";
		if (this.configuration.replaceExternalLinkIcons && !removeClasses) {
			document.body.classList.add(className);
		} else {
			document.body.classList.remove(className);
		}
	}

	private updateEditor(): void {
		// Update editor extensions
		this.editorExtension.length = 0;
		this.editorExtension.push(createEditorExtension(this));

		this.app.workspace.updateOptions();

		// Update markdown post processors
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) {
				leaf.view.previewMode.rerender(true);
			}
		});
	}
}

export default ShortLinkPlugin;
