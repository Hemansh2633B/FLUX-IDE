const vscode = require('vscode');

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('flux.inspectMemory', () => {
            const panel = vscode.window.createWebviewPanel(
                'fluxMemory',
                'Flux Visual Memory Inspector',
                vscode.ViewColumn.Two,
                { enableScripts: true }
            );

            panel.webview.html = getWebviewContent();

            // Listen for debug session updates to refresh memory view
            vscode.debug.onDidChangeActiveStackItem(async (e) => {
                if (e) {
                    const session = vscode.debug.activeDebugSession;
                    if (session && session.type === 'lldb') {
                        // In a real implementation, we would query the debug session for memory addresses
                        // and data layouts of variables in the current scope.
                        panel.webview.postMessage({ command: 'refresh', data: { /* memory dump */ } });
                    }
                }
            });
        })
    );
}

function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flux Memory Inspector</title>
    <style>
        body { font-family: sans-serif; background-color: #1e1e1e; color: #d4d4d4; }
        .memory-cell { display: inline-block; width: 30px; height: 30px; border: 1px solid #333; text-align: center; line-height: 30px; margin: 2px; font-size: 12px; }
        .heap { background-color: #264f78; }
        .stack { background-color: #4b1b1b; }
    </style>
</head>
<body>
    <h3>Visual Memory Inspector</h3>
    <div id="memory-map">
        <p>Start a debug session to visualize memory layout (endianness, alignment, allocation).</p>
        <div class="memory-cell stack">00</div>
        <div class="memory-cell stack">A1</div>
        <div class="memory-cell heap">FF</div>
    </div>
    <script>
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'refresh') {
                // Update DOM with memory data
            }
        });
    </script>
</body>
</html>`;
}

module.exports = { activate };
