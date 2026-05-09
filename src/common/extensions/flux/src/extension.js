const vscode = require('vscode');
const { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } = require('vscode-languageclient/node');
const path = require('path');

let client;

function activate(context) {
    const config = vscode.workspace.getConfiguration('flux');
    const pythonPath = config.get('pythonPath') || 'python3';
    const lspPath = config.get('lspPath') || 'flsp.py';

    const serverOptions = {
        run: { command: pythonPath, args: [lspPath], transport: TransportKind.stdio },
        debug: { command: pythonPath, args: [lspPath], transport: TransportKind.stdio }
    };

    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'flux' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.fx')
        }
    };

    client = new LanguageClient(
        'fluxLSP',
        'Flux Language Server',
        serverOptions,
        clientOptions
    );

    client.start();

    // Safe Document Formatter
    // Implements the logic of fix_spacing.py (take every other line) safely on the editor buffer
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('flux', {
            provideDocumentFormattingEdits(document) {
                const text = document.getText();
                const lines = text.split(/\r?\n/);

                // fix_spacing.py logic: take every other line starting from 0
                const correctedLines = [];
                for (let i = 0; i < lines.length; i += 2) {
                    correctedLines.push(lines[i]);
                }

                const newText = correctedLines.join('\n') + '\n';

                // Replace the entire document content
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
                );

                return [vscode.TextEdit.replace(fullRange, newText)];
            }
        })
    );
}

function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

module.exports = {
    activate,
    deactivate
};
