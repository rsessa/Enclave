import { emit } from '@tauri-apps/api/event';

const inputElement = document.getElementById('mermaid-input') as HTMLTextAreaElement;

let timeout: number | null = null;

inputElement.addEventListener('input', () => {
    if (timeout) clearTimeout(timeout);
    // Debounce rapid typing
    timeout = window.setTimeout(async () => {
        const code = inputElement.value;
        try {
            await emit('update-diagram', code);
        } catch (e) {
            console.error('Failed to emit diagram update', e);
        }
    }, 300);
});

// Initial Emit
setTimeout(() => {
    emit('update-diagram', inputElement.value);
}, 500);
