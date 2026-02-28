import Quill from 'quill';
import { TabManager } from './lib/tabManager';
import { readTextFile, writeTextFile, readDir } from '@tauri-apps/plugin-fs';
import { message } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

const BASE_DIR = "C:\\scripts\\DataAnalisis";

// Initialize Quill Editor
const quill = new Quill('#quill-editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['code-block', 'image'],
    ],
  },
});

// Setup Tabs
const tabsContainer = document.getElementById('tabs-container') as HTMLDivElement;
const btnNewTab = document.getElementById('btn-new-tab') as HTMLButtonElement;

const tabManager = new TabManager((content: string) => {
  // Safe injection of HTML to Quill
  quill.clipboard.dangerouslyPasteHTML(content);
});

// Render Tabs UI
function renderTabs() {
  tabsContainer.innerHTML = '';
  const tabs = tabManager.getTabs();
  const activeId = tabManager.getActiveTabId();

  for (const tab of tabs) {
    const tabEl = document.createElement('div');
    tabEl.className = `tab ${tab.id === activeId ? 'active' : ''}`;

    const titleEl = document.createElement('span');
    titleEl.className = 'tab-title';
    titleEl.textContent = tab.name;

    // Double click to rename
    titleEl.addEventListener('dblclick', async (e) => {
      e.stopPropagation();
      const newName = prompt('Rename tab:', tab.name);
      if (newName && newName.trim()) {
        tabManager.renameTab(tab.id, newName.trim());
        renderTabs();
      }
    });

    const closeEl = document.createElement('button');
    closeEl.className = 'tab-close';
    closeEl.textContent = 'x';
    closeEl.onclick = (e) => {
      e.stopPropagation();
      tabManager.removeTab(tab.id);
      renderTabs();
    };

    tabEl.appendChild(titleEl);
    tabEl.appendChild(closeEl);

    tabEl.onclick = async () => {
      // Pass the current DOM state to save it encrypted
      await tabManager.switchTab(tab.id, quill.root.innerHTML);
      renderTabs();
    };

    tabsContainer.appendChild(tabEl);
  }
}

// Initial Tab
async function initApp() {
  const id = await tabManager.createTab('Untitled 1');
  await tabManager.switchTab(id, '');
  renderTabs();
}

btnNewTab.addEventListener('click', async () => {
  const id = await tabManager.createTab(`Untitled ${tabManager.getTabs().length + 1}`);
  await tabManager.switchTab(id, quill.root.innerHTML);
  renderTabs();
});

// Toolbar Actions

document.getElementById('btn-add-table')?.addEventListener('click', () => {
  const range = quill.getSelection(true);
  const tableHtml = `
    <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr><th>Header 1</th><th>Header 2</th></tr>
      <tr><td>Data</td><td>Data</td></tr>
    </table><br/>
  `;
  quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
});

document.getElementById('btn-format-log')?.addEventListener('click', () => {
  const range = quill.getSelection();
  if (range && range.length > 0) {
    const text = quill.getText(range.index, range.length);
    quill.deleteText(range.index, range.length);
    const preHtml = `<pre class="log-block">${text}</pre><br/>`;
    quill.clipboard.dangerouslyPasteHTML(range.index, preHtml);
  } else {
    message('Please select text to format as log.', { title: 'Enclave', kind: 'info' });
  }
});

document.getElementById('btn-copy')?.addEventListener('click', async () => {
  try {
    const htmlContent = quill.root.innerHTML;
    const textContent = quill.getText();

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const textBlob = new Blob([textContent], { type: 'text/plain' });

    const data = [new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    })];

    await navigator.clipboard.write(data);
    message('Contenido copiado (con formato e imágenes)', { title: 'Éxito', kind: 'info' });
  } catch (err) {
    console.error('Failed to copy', err);
    message('Error al copiar contenido rico. Reintente.', { title: 'Error', kind: 'error' });
  }
});

document.getElementById('btn-breakout')?.addEventListener('click', () => {
  const range = quill.getSelection(true);
  // Insert a newline and a paragraph break after the current selection
  quill.insertText(range.index, '\n', 'user');
  quill.setSelection(range.index + 1, 0, 'user');
  // Force a new paragraph by inserting a newline followed by any character or just ensuring cursor is out
  // In Quill, '\n' usually creates a new block.
});

document.getElementById('btn-save-template')?.addEventListener('click', async () => {
  const name = prompt('Enter file name (without extension):');
  if (!name) return;
  const path = `${BASE_DIR}\\${name}.html`;
  try {
    await writeTextFile(path, quill.root.innerHTML);
    await message(`Saved to ${path}`, { title: 'Success', kind: 'info' });
  } catch (err: any) {
    await message(`Failed to save: ${err.message}`, { title: 'Error', kind: 'error' });
  }
});

document.getElementById('btn-load-template')?.addEventListener('click', async () => {
  try {
    const entries = await readDir(BASE_DIR);
    const htmlFiles = entries.filter(e => e.name?.endsWith('.html'));

    if (htmlFiles.length === 0) {
      await message('No templates found in ' + BASE_DIR, { title: 'Info', kind: 'info' });
      return;
    }

    const filesStr = htmlFiles.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
    const input = prompt(`Select template by number:\n${filesStr}`);

    const idx = parseInt(input || '') - 1;
    if (idx >= 0 && idx < htmlFiles.length) {
      const selected = htmlFiles[idx].name;
      const content = await readTextFile(`${BASE_DIR}\\${selected}`);
      quill.clipboard.dangerouslyPasteHTML(content);
    }
  } catch (err: any) {
    await message(`Error loading templates: ${err.message}`, { title: 'Error', kind: 'error' });
  }
});

// Theme Toggle Logic
document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-mode');
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    btn.textContent = isLight ? '🌙' : '🌓';
  }
});

import { invoke } from '@tauri-apps/api/core';

// Open Structura Sub App
document.getElementById('btn-structura')?.addEventListener('click', async () => {
  try {
    await invoke('launch_structura');
  } catch (error) {
    console.error("Failed to launch structura:", error);
    await message(`Error al lanzar Structura-Portable.exe: ${error}`, { title: 'Structura', kind: 'error' });
  }
});

// Listen for global insert-diagram events from old internal Structura
listen('insert-diagram', (event) => {
  const svgContent = event.payload as string;
  const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
  const imgTag = `<img src="data:image/svg+xml;base64,${base64Svg}" style="display: block; margin: 20px auto; max-width: 100%;" />`;
  const range = quill.getSelection(true);
  quill.clipboard.dangerouslyPasteHTML(range.index, imgTag + '<br/>');
});

// Listen for External Structura Diagram Inbox updates
listen('inbox-diagram-received', async (event) => {
  const svgContent = event.payload as string;
  const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
  const imgTag = `<img src="data:image/svg+xml;base64,${base64Svg}" style="display: block; margin: 10px auto; max-width: 100%;" />`;
  const range = quill.getSelection(true);
  quill.clipboard.dangerouslyPasteHTML(range.index, imgTag + '<br/>');

  // Show non-intrusive toast notification
  await message('Diagrama importado correctamente', { title: 'Buzón Structura', kind: 'info' });
});

// Listen for PowerShell Inbox (or New Structura HTML) updates
listen('inbox-data-received', async (event) => {
  const htmlContent = event.payload as string;
  const range = quill.getSelection(true);
  quill.clipboard.dangerouslyPasteHTML(range.index, htmlContent + '<br/>');

  // If it contains an IMG tag, it's likely a diagram from Structura
  const isDiagram = htmlContent.includes('<img');
  const msg = isDiagram ? 'Diagrama recibido de Structura' : 'Datos recibidos de PowerShell';
  const title = isDiagram ? 'Buzón Structura' : 'Buzón PowerShell';

  await message(msg, { title, kind: 'info' });
});

// Custom Image Handler for Local Files
const toolbar = quill.getModule('toolbar') as any;
toolbar.addHandler('image', async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
      }]
    });

    if (selected && typeof selected === 'string') {
      const fileData = await readFile(selected);
      // Determine mime type from extension
      const ext = selected.split('.').pop()?.toLowerCase();
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;

      // Convert to Base64
      const base64 = btoa(
        new Uint8Array(fileData)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const range = quill.getSelection(true);
      const imgTag = `<img src="data:${mime};base64,${base64}" style="max-width: 100%; display: block; margin: 10px auto;" />`;
      quill.clipboard.dangerouslyPasteHTML(range.index, imgTag + '<br/>');
      message('Imagen importada correctamente', { title: 'Éxito', kind: 'info' });
    }
  } catch (err: any) {
    console.error('Image import failed', err);
    message(`Error al importar imagen: ${err.message}`, { title: 'Error', kind: 'error' });
  }
});

initApp();
