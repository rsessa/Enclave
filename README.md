# Enclave
**Secure, Ephemeral Documentation App for Network Engineers**

Enclave is a portable, offline-first Windows desktop application built with Tauri (v2), Vite, and Vanilla TypeScript. It is designed to provide network engineers with a highly secure, zero-footprint environment for analyzing PCAPs, firewalls logs, and writing incident reports. 

As a master orchestrator for **[Structura](https://github.com/Richard/Structura)**, Enclave captures visual diagrams and PowerShell data via a secure, local-only mailbox system.

## 🛡️ Key Security Features
- **Zero Network Egress**: Strict Content Security Policy (CSP) blocking *all* outbound connections.
- **In-Memory Encryption**: Tab switching triggers AES-GCM encryption of DOM trees (`window.crypto.subtle`). Only the currently viewed tab exists as plain text in memory.
- **Strict File System Control**: Reading and saving templates is hardcoded and locked strictly to `C:\scripts\DataAnalisis\**`. 

## ✨ New in v0.2.0
- **🌓 Light/Dark Mode**: Premium engineering themes with smooth transitions.
- **📋 Rich Clipboard**: Copy content as `text/html`. Paste diagrams and formatted tables directly into Outlook, Word, or Teams.
- **🖼️ Native Image Importer**: Securely import local images (`.png`, `.jpg`, `.svg`) via Windows File Picker. Images are converted to Base64 for zero-footprint storage.
- **↵ Breakout Logic**: Dedicated toolbar button to escape code blocks or tables and continue writing in a new paragraph.

## ⚙️ Integrations & "The Inbox" (Buzón)

Enclave operates as a master orchestrator by continuously polling designated files inside `C:\scripts\DataAnalisis\`:
1. **PowerShell Text/Tables** (`inbox.html`): PowerShell scripts can output HTML directly to this file. Enclave intercepts, reads, displays at the cursor's location, and instantly deletes the file.
2. **Structura Dual Export** (`inbox.html` / `inbox_diagram.svg`): Enclave launches `Structura-Portable.exe`. It prioritizes the HTML-Base64 export for perfect visual rendering while maintaining backward compatibility with SVG-only exports.

## 🚀 Building Enclave

**Prerequisites:** Node.js, Rust, and Tauri v2 CLI.

```bash
npm install
npm run build-all
```
This custom command builds the Rust backend, generates the Windows Installer (`.msi` / `setup.exe`) and finally extracts the native portable standalone executable (`.exe`) to the `build/nsis/` directory.

## 📦 CI/CD & Releases
Release binaries are automatically built and published via GitHub Actions on every version tag. Grab the latest Standalone Portable Executable or MSI Installer from the **[Releases Tab](../../releases)**.
