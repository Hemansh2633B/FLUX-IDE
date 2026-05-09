const vscode = require('vscode');
const { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } = require('vscode-languageclient/node');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const memoryInspector = require('./memoryInspector');
const profiler = require('./profiler');

let client;

function activate(context) {
    const config = vscode.workspace.getConfiguration('flux');
    const pythonPath = config.get('pythonPath') || 'python3';
    const lspPath = config.get('lspPath') || 'flsp.py';

    // --- LSP Setup ---
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

    // --- Memory Inspector ---
    memoryInspector.activate(context);

    // --- Profiler ---
    profiler.activate(context);

    // --- Semantic Tokens ---
    const legend = new vscode.SemanticTokensLegend(['variable', 'type', 'keyword'], ['heap', 'stack', 'readonly']);
    const provider = {
        provideDocumentSemanticTokens(document) {
            const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
            const text = document.getText();
            const heapRegex = /\bheap\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
            let match;
            while ((match = heapRegex.exec(text)) !== null) {
                const pos = document.positionAt(match.index + match[0].indexOf(match[1]));
                tokensBuilder.push(pos.line, pos.character, match[1].length, 0, 1); // variable, heap
            }
            return tokensBuilder.build();
        }
    };
    context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'flux' }, provider, legend));

    // --- LLVM IR Explorer ---
    let irProvider = new class {
        constructor() {
            this.onDidChangeEmitter = new vscode.EventEmitter();
            this.onDidChange = this.onDidChangeEmitter.event;
        }
        provideTextDocumentContent(uri) {
            const sourceUri = vscode.Uri.parse(uri.query);
            return new Promise((resolve) => {
                const compilerPath = vscode.workspace.getConfiguration('flux').get('compilerPath') || 'fluxc';
                const outputIrPath = sourceUri.fsPath + '.ll';

                exec(`${pythonPath} ${compilerPath} "${sourceUri.fsPath}" --log-level 0`, (err) => {
                    if (fs.existsSync(outputIrPath)) {
                        resolve(fs.readFileSync(outputIrPath, 'utf8'));
                    } else {
                        resolve('; Failed to generate LLVM IR or .ll file not found.');
                    }
                });
            });
        }
    };

    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('flux-ir', irProvider));

    context.subscriptions.push(vscode.commands.registerCommand('flux.showIr', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const uri = vscode.Uri.parse(`flux-ir://authority/LLVM IR Explorer?${editor.document.uri.toString()}`);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, true);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.languageId === 'flux') {
            const irUri = vscode.Uri.parse(`flux-ir://authority/LLVM IR Explorer?${doc.uri.toString()}`);
            irProvider.onDidChangeEmitter.fire(irUri);
        }
    }));

    // --- Safe Document Formatter ---
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('flux', {
            provideDocumentFormattingEdits(document) {
                const text = document.getText();
                const lines = text.split(/\r?\n/);
                const correctedLines = [];
                for (let i = 0; i < lines.length; i += 2) {
                    correctedLines.push(lines[i]);
                }
                const newText = correctedLines.join('\n') + '\n';
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
