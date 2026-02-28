# Enclave
**Secure, Ephemeral Documentation App for Network Engineers**

Enclave is a portable, offline-first Windows desktop application built with Tauri (v2), Vite, and Vanilla TypeScript. It is designed to provide network engineers with a highly secure, zero-footprint environment for analyzing PCAPs, firewalls logs, and writing incident reports. 

As a sister-application to **[Structura](https://github.com/Richard/Structura)** (A Mermaid diagramming tool), Enclave orchestrates its execution and injects the resulting SVG diagrams directly into its own WYSIWYG editor via a background Rust-based mailbox system.

## 🛡️ Key Security Features
- **Zero Network Egress**: Strict Content Security Policy (CSP) blocking *all* outbound connections.
- **In-Memory Encryption**: Tab switching triggers AES-GCM encryption of DOM trees (`window.crypto.subtle`). Only the currently viewed tab exists as plain text in memory.
- **Strict File System Control**: Reading and saving templates is hardcoded and locked strictly to `C:\scripts\DataAnalisis\**`. Enclave has zero access to any other directory.

## ⚙️ Integrations & "The Inbox" (Buzón)

Enclave operates as a master orchestrator by continuously polling designated files inside `C:\scripts\DataAnalisis\` using a background Tokio thread:
1. **PowerShell Text/Tables** (`inbox.html`): PowerShell scripts can output HTML directly to this file. Enclave intercepts, reads, displays at the cursor's location, and instantly deletes the file to avoid tracking.
2. **Structura SVG Diagrams** (`inbox_diagram.svg`): Enclave launches the `Structura-Portable.exe` detached app. Structura generates visual Mermaid SVGs and drops them here. Enclave consumes the SVG visually and deletes the file.

## 🚀 Building Enclave

**Prerequisites:** Node.js, Rust, and Tauri v2 CLI.

```bash
npm install
npm run build-all
```
This custom command builds the Rust backend, generates the Windows Installer (`.msi` / `setup.exe`) and finally extracts the native portable standalone executable (`.exe`) to the `build/nsis/` directory.

## 📦 Releases
Grab the latest v0.1 Standalone Portable Executable or MSI Installer from the [Releases Tab](../../releases).
