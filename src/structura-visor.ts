import mermaid from 'mermaid';
import { listen, emit } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

const outputElement = document.getElementById('mermaid-output') as HTMLDivElement;
let currentSvg = '';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark', // Engineering vibe
    securityLevel: 'loose', // Needed to inject styling in some cases
});

listen('update-diagram', async (event) => {
    const code = event.payload as string;
    if (!code || code.trim() === '') {
        outputElement.innerHTML = '';
        currentSvg = '';
        return;
    }

    try {
        const { svg } = await mermaid.render('mermaid-svg', code);
        outputElement.innerHTML = svg;
        currentSvg = svg;
    } catch (err: any) {
        // Mermaid parsing error
        console.warn("Mermaid error:", err);
        outputElement.innerHTML = `<div class="error-box">Syntax Error:<br/>${err.message || 'Check your mermaid code.'}</div>`;
        currentSvg = '';
    }
});

document.getElementById('btn-export')?.addEventListener('click', async () => {
    if (!currentSvg) return;

    try {
        // Send to main window
        await emit('insert-diagram', currentSvg);

        // Close the sub-app windows
        const current = getCurrentWindow();
        // In multi-window we typically must grab the editor window by label if we want to close it too.
        // For now we close self (visor). 
        await current.close();
    } catch (error) {
        console.error("Failed to export diagram", error);
    }
});
