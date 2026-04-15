import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface SharePluginSettings {
	apiUrl: string;
	apiKey: string;
	defaultPassword: string;
	autoCopyToClipboard: boolean;
	showNotification: boolean;
}

const DEFAULT_SETTINGS: SharePluginSettings = {
	apiUrl: 'http://localhost:3000/api',
	apiKey: '',
	defaultPassword: '',
	autoCopyToClipboard: true,
	showNotification: true
}

export default class SharePlugin extends Plugin {
	settings: SharePluginSettings;
	private shareButton: HTMLElement | null = null;
	private stylesInjected = false;

	async onload() {
		await this.loadSettings();

		// 添加悬浮分享按钮
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.addShareButton();
			})
		);

		// 初始化时添加按钮
		setTimeout(() => this.addShareButton(), 1000);

		// 添加右键菜单项
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				menu.addItem((item) => {
					item
						.setTitle('分享当前笔记')
						.setIcon('upload')
						.onClick(async () => {
							await this.shareCurrentNote();
						});
				});
			})
		);

		// 添加命令
		this.addCommand({
			id: 'share-note',
			name: '分享当前笔记',
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 's' }],
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await this.shareCurrentNote();
			}
		});

		// 添加设置标签页
		this.addSettingTab(new ShareSettingTab(this.app, this));
	}

	onunload() {
		// 移除分享按钮
		if (this.shareButton) {
			this.shareButton.remove();
			this.shareButton = null;
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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

	async addShareButton() {
		// 移除旧的按钮
		if (this.shareButton) {
			this.shareButton.remove();
			this.shareButton = null;
		}

		const activeLeaf = this.app.workspace.activeLeaf;
		if (!activeLeaf) return;

		const view = activeLeaf.view;
		if (view.getViewType() !== 'markdown') return;

		// 获取编辑器容器
		const editorContainer = view.containerEl.querySelector('.cm-editor');
		if (!editorContainer) return;

		// 创建悬浮按钮
		this.shareButton = document.createElement('div');
		this.shareButton.className = 'share-floating-button';
		this.shareButton.innerHTML = `
			<button class="share-button" aria-label="分享当前笔记">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
					<polyline points="16 6 12 2 8 6"></polyline>
					<line x1="12" y1="2" x2="12" y2="15"></line>
				</svg>
			</button>
		`;

		if (!this.stylesInjected) {
			this.injectStyles();
			this.stylesInjected = true;
		}

		// 添加点击事件
		this.shareButton.querySelector('.share-button')?.addEventListener('click', async () => {
			await this.shareCurrentNote();
		});

		// 添加到编辑器容器
		editorContainer.appendChild(this.shareButton);
	}

	private injectStyles() {
		const style = document.createElement('style');
		style.id = 'obsidian-share-plugin-styles';
		style.textContent = `
			.share-floating-button {
				position: absolute;
				top: 20px;
				right: 20px;
				z-index: 1000;
			}
			.share-button {
				background: var(--interactive-accent);
				color: white;
				border: none;
				border-radius: 50%;
				width: 40px;
				height: 40px;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
				transition: all 0.2s ease;
			}
			.share-button:hover {
				transform: scale(1.1);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			}
			.share-button:active {
				transform: scale(0.95);
			}
			.share-modal {
				padding: 4px;
				width: 100%;
			}
			.share-modal .modal-content {
				padding: 0;
			}
			.share-modal .share-form {
				display: flex;
				flex-direction: column;
				gap: 14px;
				width: 100%;
			}
			.share-modal .field {
				display: flex;
				flex-direction: column;
				gap: 6px;
				width: 100%;
			}
			.share-modal .field-label {
				font-size: 13px;
				color: var(--text-muted);
			}
			.share-modal .share-input {
				display: block;
				width: 100%;
				min-height: 42px;
				padding: 10px 12px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				background: var(--background-primary);
				color: var(--text-normal);
				box-sizing: border-box;
				line-height: 1.4;
				font-size: 14px;
				vertical-align: middle;
			}
			.share-modal .share-select {
				display: block;
				width: 100%;
				min-height: 42px;
				padding: 8px 28px 8px 12px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				background: var(--background-primary);
				background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%23888888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
				background-position: right 10px center;
				background-repeat: no-repeat;
				background-size: 12px 12px;
				color: var(--text-normal);
				box-sizing: border-box;
				line-height: 1.4;
				font-size: 14px;
				vertical-align: middle;
				appearance: none;
				-webkit-appearance: none;
				-moz-appearance: none;
			}
			.share-modal .field.is-hidden {
				display: none;
			}
			.share-modal .field-help {
				font-size: 12px;
				color: var(--text-muted);
			}
			.share-modal .modal-button-container {
				display: flex;
				justify-content: flex-end;
				gap: 10px;
				margin-top: 8px;
				flex-wrap: wrap;
			}
			.share-modal .modal-button-container button {
				min-width: 88px;
			}
		`;

		document.head.appendChild(style);
	}

	async shareCurrentNote() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('未找到当前打开的文件。');
			return;
		}

		// 读取文件内容
		const content = await this.app.vault.read(activeFile);

		// 显示分享模态框
		new ShareModal(this.app, this, content, activeFile.basename).open();
	}

	async shareNote(content: string, options?: { title?: string, password?: string, expireDays?: number, expiresAt?: string | null }) {
		try {
			const response = await fetch(`${this.getApiBaseUrl()}/shares`, {
				method: 'POST',
				headers: this.buildApiHeaders(),
				body: JSON.stringify({
					title: options?.title || '未命名分享',
					content: content,
					password: options?.password || '',
					expireDays: options?.expireDays ?? 30,
					expiresAt: options?.expiresAt || null
				})
			});

			if (!response.ok) {
				throw new Error(`请求失败，状态码：${response.status}`);
			}

			const result = await response.json();

			if (result.success && result.data) {
				const url = result.data.url;

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
			} else {
				throw new Error(result.error || '分享失败');
			}
		} catch (error) {
			console.error('Error sharing note:', error);
			new Notice(`分享失败：${error.message}`);
			return null;
		}
	}

	async testConnection() {
		try {
			const response = await fetch(`${this.getApiBaseUrl()}/shares/connection-test`, {
				method: 'GET',
				headers: this.buildApiHeaders()
			});

			const result = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(result?.error || `请求失败，状态码：${response.status}`);
			}

			new Notice('接口连接成功，密钥校验通过。');
			return true;
		} catch (error) {
			console.error('Error testing share API connection:', error);
			new Notice(`接口连接失败：${error.message}`);
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

	onOpen() {
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
			placeholder: '请输入分享标题'
		});
		titleInput.value = this.defaultTitle;
		titleField.createEl('div', { text: '默认使用当前文件名，你也可以手动修改。', cls: 'field-help' });

		const passwordField = formEl.createDiv({ cls: 'field' });
		passwordField.createEl('label', { text: '访问密码', cls: 'field-label' });

		const passwordInput = passwordField.createEl('input', {
			type: 'password',
			cls: 'share-input',
			placeholder: '留空则无需密码'
		});
		passwordInput.value = this.plugin.settings.defaultPassword;

		const expireField = formEl.createDiv({ cls: 'field' });
		expireField.createEl('label', { text: '有效期', cls: 'field-label' });
		const expireSelect = expireField.createEl('select', { cls: 'share-select' });
		expireSelect.innerHTML = `
			<option value="1">1 天</option>
			<option value="7">7 天</option>
			<option value="30" selected>30 天</option>
			<option value="90">90 天</option>
			<option value="0">永不过期</option>
			<option value="custom">自定义日期时间</option>
		`;
		const customExpireField = formEl.createDiv({ cls: 'field is-hidden' });
		customExpireField.createEl('label', { text: '自定义过期时间', cls: 'field-label' });
		const customExpireInput = customExpireField.createEl('input', {
			type: 'datetime-local',
			cls: 'share-input'
		});
		customExpireField.createEl('div', {
			text: '按本地时间选择，分享会在该时刻自动失效。',
			cls: 'field-help'
		});
		const defaultCustomExpireAt = new Date();
		defaultCustomExpireAt.setHours(defaultCustomExpireAt.getHours() + 1);
		customExpireInput.value = defaultCustomExpireAt.toISOString().slice(0, 16);

		expireSelect.onchange = () => {
			customExpireField.classList.toggle('is-hidden', expireSelect.value !== 'custom');
		};

		const buttonContainer = formEl.createDiv({ cls: 'modal-button-container' });

		const shareButton = buttonContainer.createEl('button', {
			text: '确认分享',
			cls: 'mod-cta'
		});

		const cancelButton = buttonContainer.createEl('button', {
			text: '取消'
		});

		shareButton.onclick = async () => {
			const title = titleInput.value.trim() || this.defaultTitle;
			const password = passwordInput.value;
			const useCustomExpireAt = expireSelect.value === 'custom';
			const expireDays = useCustomExpireAt ? 0 : parseInt(expireSelect.value);
			const expiresAt = useCustomExpireAt ? new Date(customExpireInput.value).toISOString() : null;

			shareButton.disabled = true;
			shareButton.textContent = '分享中...';

			const result = await this.plugin.shareNote(this.content, {
				title: title,
				password: password,
				expireDays: expireDays,
				expiresAt: expiresAt
			});

			shareButton.disabled = false;
			shareButton.textContent = '确认分享';

			if (result) {
				this.close();
			}
		};

		cancelButton.onclick = () => {
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
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

		containerEl.createEl('h2', { text: '分享插件设置' });

		new Setting(containerEl)
			.setName('后端接口地址')
			.setDesc('分享服务后端 API 地址')
			.addText(text => text
				.setPlaceholder('http://localhost:3000/api')
				.setValue(this.plugin.settings.apiUrl)
				.onChange(async (value) => {
					this.plugin.settings.apiUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('接口密钥')
			.setDesc('需与后端 SHARE_API_KEY 保持一致，否则无法分享')
			.addText(text => text
				.setPlaceholder('请输入分享接口密钥')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('接口连通性测试')
			.setDesc('测试当前接口地址和密钥是否可用')
			.addButton(button => button
				.setButtonText('测试连接')
				.setCta()
				.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('测试中...');
					await this.plugin.testConnection();
					button.setButtonText('测试连接');
					button.setDisabled(false);
				}));

		new Setting(containerEl)
			.setName('默认访问密码')
			.setDesc('分享时默认带上的密码，留空则默认无密码')
			.addText(text => text
				.setPlaceholder('可选密码')
				.setValue(this.plugin.settings.defaultPassword)
				.onChange(async (value) => {
					this.plugin.settings.defaultPassword = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('自动复制链接')
			.setDesc('分享成功后自动将链接复制到剪贴板')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoCopyToClipboard)
				.onChange(async (value) => {
					this.plugin.settings.autoCopyToClipboard = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('显示通知')
			.setDesc('分享成功或失败时显示提示通知')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotification)
				.onChange(async (value) => {
					this.plugin.settings.showNotification = value;
					await this.plugin.saveSettings();
				}));
	}
}
