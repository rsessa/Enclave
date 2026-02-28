import { encryptContent, decryptContent } from './crypto';

export interface TabData {
    id: string;
    name: string;
    isEncrypted: boolean;
    content: string; // If active, plain HTML. If inactive, base64 ciphertext.
    iv?: string; // Stored if encrypted
}

export class TabManager {
    private tabs: Map<string, TabData> = new Map();
    private activeTabId: string | null = null;

    private onRenderContent: (content: string) => void;

    constructor(onRenderContent: (content: string) => void) {
        this.onRenderContent = onRenderContent;
    }

    public getTabs(): TabData[] {
        return Array.from(this.tabs.values());
    }

    public getActiveTabId(): string | null {
        return this.activeTabId;
    }

    public async createTab(name: string, content: string = ''): Promise<string> {
        const id = Date.now().toString();
        const newTab: TabData = { id, name, isEncrypted: false, content };
        this.tabs.set(id, newTab);
        return id;
    }

    public renameTab(id: string, newName: string) {
        const tab = this.tabs.get(id);
        if (tab) {
            tab.name = newName;
        }
    }

    public async switchTab(newTabId: string, currentDomContent: string): Promise<void> {
        if (this.activeTabId === newTabId) return;

        // Encrypt the current active tab and wipe it from plain text memory
        if (this.activeTabId) {
            const currentTab = this.tabs.get(this.activeTabId);
            if (currentTab) {
                const encrypted = await encryptContent(currentDomContent);
                currentTab.content = encrypted.ciphertext;
                currentTab.iv = encrypted.iv;
                currentTab.isEncrypted = true;
            }
        }

        // Decrypt the newly selected tab and render
        const targetTab = this.tabs.get(newTabId);
        if (targetTab) {
            if (targetTab.isEncrypted && targetTab.iv) {
                const decryptedContent = await decryptContent(targetTab.content, targetTab.iv);
                targetTab.content = decryptedContent; // temporary store plain text while active
                targetTab.isEncrypted = false;
                targetTab.iv = undefined;
                this.onRenderContent(decryptedContent);
            } else {
                this.onRenderContent(targetTab.content);
            }
            this.activeTabId = newTabId;
        }
    }

    public removeTab(id: string) {
        this.tabs.delete(id);
        if (this.activeTabId === id) {
            this.activeTabId = null;
            this.onRenderContent(''); // Clear DOM
            // Find another tab to switch to if any exist
            const remainingTabs = this.getTabs();
            if (remainingTabs.length > 0) {
                this.switchTab(remainingTabs[0].id, '');
            }
        }
    }
}
