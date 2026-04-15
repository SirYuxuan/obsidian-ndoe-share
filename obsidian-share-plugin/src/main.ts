import {
	App,
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	requestUrl,
	setIcon,
} from 'obsidian';

interface ShareResponseData {
	url: string;
}

interface ShareApiResponse {
	success?: boolean;
	error?: string;
	data?: ShareResponseData;
}

interface SharePluginSettings {
	apiUrl: string;
	apiKey: string;
	defaultPassword: string;
	autoCopyToClipboard: boolean;
	showNotification: boolean;
}

const DEFAULT_SETTINGS: SharePluginSettings = {
	apiUrl: 'https://s.oofo.cc/api',
	apiKey: '',
	defaultPassword: '',
	autoCopyToClipboard: true,
	showNotification: true,
};

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}

function formatLocalDateTimeInputValue(date: Date): string {
	const offset = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offset * 60 * 1000);
	return localDate.toISOString().slice(0, 16);
}

export default class SharePlugin extends Plugin {
	settings!: SharePluginSettings;
	private shareButton: HTMLElement | null = null;
	private shareButtonTimeoutId: number | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.addShareButton();
			})
		);

		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.addShareButton();
			})
		);

		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				this.addShareButton();
			})
		);

		this.shareButtonTimeoutId = window.setTimeout(() => {
			this.addShareButton();
		}, 1000);

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu) => {
				menu.addItem((item) => {
					item.setTitle('分享当前笔记').setIcon('upload').onClick(() => {
						this.runTask(this.shareCurrentNote(), 'share note from file menu');
					});
				});
			})
		);

		this.addCommand({
			id: 'share-note',
			name: '分享当前笔记',
			editorCallback: (_editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) => {
				this.runTask(this.shareCurrentNote(), 'share note from command');
			},
		});

		this.addSettingTab(new ShareSettingTab(this.app, this));
	}

	onunload(): void {
		if (this.shareButtonTimeoutId !== null) {
			window.clearTimeout(this.shareButtonTimeoutId);
			this.shareButtonTimeoutId = null;
		}

		if (this.shareButton) {
			this.shareButton.remove();
			this.shareButton = null;
		}
	}

	async loadSettings(): Promise<void> {
		const savedSettings = (await this.loadData()) as Partial<SharePluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings ?? {});
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private runTask(task: Promise<unknown>, context: string): void {
		task.catch((error: unknown) => {
			console.error(`Unexpected error in ${context}:`, error);
			new Notice(`操作失败：${getErrorMessage(error)}`);
		});
	}

	private getApiBaseUrl(): string {
		return this.settings.apiUrl.trim().replace(/\/+$/, '');
	}

	private buildApiHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		const apiKey = this.settings.apiKey.trim();
		if (apiKey) {
			headers['X-Share-Api-Key'] = apiKey;
		}

		return headers;
	}

	private async requestShareApi(
		path: string,
		method: 'GET' | 'POST',
		body?: Record<string, unknown>
	): Promise<ShareApiResponse> {
		const response = await requestUrl({
			url: `${this.getApiBaseUrl()}${path}`,
			method,
			headers: this.buildApiHeaders(),
			body: body ? JSON.stringify(body) : undefined,
		});

		const result = (response.json ?? {}) as ShareApiResponse;
		if (response.status >= 400) {
			throw new Error(result.error || `请求失败，状态码：${response.status}`);
		}

		return result;
	}

	addShareButton(): void {
		if (this.shareButton) {
			this.shareButton.remove();
			this.shareButton = null;
		}

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || view.getViewType() !== 'markdown') {
			return;
		}

		const buttonHost = this.getShareButtonHost(view);

		this.shareButton = document.createElement('div');
		this.shareButton.className = 'share-floating-button';

		const shareButton = this.shareButton.createEl('button', {
			cls: 'share-button',
			attr: {
				'aria-label': '分享当前笔记',
			},
		});

		setIcon(shareButton, 'upload');
		shareButton.addEventListener('click', () => {
			this.runTask(this.shareCurrentNote(), 'share note from floating button');
		});

		buttonHost.appendChild(this.shareButton);
	}

	private getShareButtonHost(view: MarkdownView): HTMLElement {
		view.contentEl.addClass('share-button-host');
		return view.contentEl;
	}

	async shareCurrentNote(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('未找到当前打开的文件。');
			return;
		}

		const content = await this.app.vault.read(activeFile);
		new ShareModal(this.app, this, content, activeFile.basename).open();
	}

	async shareNote(
		content: string,
		options?: { title?: string; password?: string; expireDays?: number; expiresAt?: string | null }
	): Promise<ShareResponseData | null> {
		try {
			const payload: Record<string, unknown> = {
				title: options?.title || '未命名分享',
				content,
				password: options?.password || '',
				expireDays: options?.expireDays ?? 30,
			};

			if (options?.expiresAt) {
				payload.expiresAt = options.expiresAt;
			}

			const result = await this.requestShareApi('/shares', 'POST', payload);
			if (!result.success || !result.data) {
				throw new Error(result.error || '分享失败');
			}

			const { url } = result.data;

			if (this.settings.autoCopyToClipboard) {
				await navigator.clipboard.writeText(url);
			}

			if (this.settings.showNotification) {
				const message = this.settings.autoCopyToClipboard
					? '分享成功，链接已复制到剪贴板'
					: '分享成功';
				new Notice(message);
			}

			return result.data;
		} catch (error: unknown) {
			console.error('Error sharing note:', error);
			new Notice(`分享失败：${getErrorMessage(error)}`);
			return null;
		}
	}

	async testConnection(): Promise<boolean> {
		try {
			await this.requestShareApi('/shares/connection-test', 'GET');
			new Notice('接口连接成功，密钥校验通过。');
			return true;
		} catch (error: unknown) {
			console.error('Error testing share API connection:', error);
			new Notice(`接口连接失败：${getErrorMessage(error)}`);
			return false;
		}
	}
}

class ShareModal extends Modal {
	private plugin: SharePlugin;
	private content: string;
	private defaultTitle: string;

	constructor(app: App, plugin: SharePlugin, content: string, defaultTitle: string) {
		super(app);
		this.plugin = plugin;
		this.content = content;
		this.defaultTitle = defaultTitle;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('share-modal');
		this.titleEl.setText('分享笔记');

		const formEl = contentEl.createDiv({ cls: 'share-form' });

		const titleField = formEl.createDiv({ cls: 'field' });
		titleField.createEl('label', { text: '分享标题', cls: 'field-label' });
		const titleInput = titleField.createEl('input', {
			type: 'text',
			cls: 'share-input',
			placeholder: '请输入分享标题',
		});
		titleInput.value = this.defaultTitle;
		titleField.createEl('div', {
			text: '默认使用当前文件名，你也可以手动修改。',
			cls: 'field-help',
		});

		const passwordField = formEl.createDiv({ cls: 'field' });
		passwordField.createEl('label', { text: '访问密码', cls: 'field-label' });
		const passwordInput = passwordField.createEl('input', {
			type: 'password',
			cls: 'share-input',
			placeholder: '留空则无需密码',
		});
		passwordInput.value = this.plugin.settings.defaultPassword;

		const expireField = formEl.createDiv({ cls: 'field' });
		expireField.createEl('label', { text: '有效期', cls: 'field-label' });
		const expireSelectWrap = expireField.createDiv({ cls: 'select-wrap' });
		const expireSelect = expireSelectWrap.createEl('select', { cls: 'share-select' });

		[
			{ value: '1', text: '1 天' },
			{ value: '7', text: '7 天' },
			{ value: '30', text: '30 天' },
			{ value: '90', text: '90 天' },
			{ value: '0', text: '永不过期' },
			{ value: 'custom', text: '自定义日期时间' },
		].forEach((option) => {
			const optionEl = expireSelect.createEl('option', {
				text: option.text,
				value: option.value,
			});

			if (option.value === '30') {
				optionEl.selected = true;
			}
		});

		expireSelectWrap.createEl('span', { cls: 'select-arrow', text: '▼' });

		const customExpireField = formEl.createDiv({ cls: 'field is-hidden' });
		customExpireField.createEl('label', {
			text: '自定义过期时间',
			cls: 'field-label',
		});
		const customExpireInput = customExpireField.createEl('input', {
			type: 'datetime-local',
			cls: 'share-input',
		});
		customExpireField.createEl('div', {
			text: '按本地时间选择，到达该时间后分享将自动失效。',
			cls: 'field-help',
		});

		const defaultCustomExpireAt = new Date();
		defaultCustomExpireAt.setHours(defaultCustomExpireAt.getHours() + 1);
		customExpireInput.value = formatLocalDateTimeInputValue(defaultCustomExpireAt);

		expireSelect.onchange = () => {
			customExpireField.classList.toggle('is-hidden', expireSelect.value !== 'custom');
		};

		const buttonContainer = formEl.createDiv({ cls: 'modal-button-container' });

		const shareButton = buttonContainer.createEl('button', {
			text: '确认分享',
			cls: 'mod-cta',
		});

		const cancelButton = buttonContainer.createEl('button', {
			text: '取消',
		});

		shareButton.addEventListener('click', () => {
			this.runSubmit(titleInput, passwordInput, expireSelect, customExpireInput, shareButton);
		});

		cancelButton.addEventListener('click', () => {
			this.close();
		});
	}

	private runSubmit(
		titleInput: HTMLInputElement,
		passwordInput: HTMLInputElement,
		expireSelect: HTMLSelectElement,
		customExpireInput: HTMLInputElement,
		shareButton: HTMLButtonElement
	): void {
		this.submitShare(titleInput, passwordInput, expireSelect, customExpireInput, shareButton).catch(
			(error: unknown) => {
				console.error('Unexpected error while submitting share:', error);
				new Notice(`分享失败：${getErrorMessage(error)}`);
			}
		);
	}

	private async submitShare(
		titleInput: HTMLInputElement,
		passwordInput: HTMLInputElement,
		expireSelect: HTMLSelectElement,
		customExpireInput: HTMLInputElement,
		shareButton: HTMLButtonElement
	): Promise<void> {
		const title = titleInput.value.trim() || this.defaultTitle;
		const password = passwordInput.value;
		const useCustomExpireAt = expireSelect.value === 'custom';
		const expireDays = useCustomExpireAt ? 0 : Number.parseInt(expireSelect.value, 10);
		const expiresAt =
			useCustomExpireAt && customExpireInput.value
				? new Date(customExpireInput.value).toISOString()
				: null;

		shareButton.disabled = true;
		shareButton.textContent = '分享中...';

		try {
			const result = await this.plugin.shareNote(this.content, {
				title,
				password,
				expireDays,
				expiresAt,
			});

			if (result) {
				this.close();
			}
		} finally {
			shareButton.disabled = false;
			shareButton.textContent = '确认分享';
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

class ShareSettingTab extends PluginSettingTab {
	plugin: SharePlugin;

	constructor(app: App, plugin: SharePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('分享插件设置').setHeading();

		new Setting(containerEl)
			.setName('后端接口地址')
			.setDesc('分享服务后端 API 地址')
			.addText((text) =>
				text
					.setPlaceholder('https://s.oofo.cc/api')
					.setValue(this.plugin.settings.apiUrl)
					.onChange((value) => {
						this.plugin.settings.apiUrl = value;
						void this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('接口密钥')
			.setDesc('需要与后端配置的分享密钥保持一致，否则无法分享')
			.addText((text) =>
				text
					.setPlaceholder('请输入分享接口密钥')
					.setValue(this.plugin.settings.apiKey)
					.onChange((value) => {
						this.plugin.settings.apiKey = value;
						void this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('接口连通性测试')
			.setDesc('测试当前接口地址和密钥是否可用')
			.addButton((button) =>
				button.setButtonText('测试连接').setCta().onClick(() => {
					button.setDisabled(true);
					button.setButtonText('测试中...');

					this.plugin.testConnection().then(
						() => {
							button.setButtonText('测试连接');
							button.setDisabled(false);
						},
						() => {
							button.setButtonText('测试连接');
							button.setDisabled(false);
						}
					);
				})
			);

		new Setting(containerEl)
			.setName('默认访问密码')
			.setDesc('分享时默认带上的密码，留空则默认无密码')
			.addText((text) =>
				text
					.setPlaceholder('可选密码')
					.setValue(this.plugin.settings.defaultPassword)
					.onChange((value) => {
						this.plugin.settings.defaultPassword = value;
						void this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('自动复制链接')
			.setDesc('分享成功后自动将链接复制到剪贴板')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoCopyToClipboard).onChange((value) => {
					this.plugin.settings.autoCopyToClipboard = value;
					void this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('显示通知')
			.setDesc('分享成功或失败时显示提示通知')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showNotification).onChange((value) => {
					this.plugin.settings.showNotification = value;
					void this.plugin.saveSettings();
				})
			);
	}
}
