const vscode = require('vscode');

function activate(context) {
    const provider = new FluxProfileProvider();
    vscode.window.registerTreeDataProvider('fluxProfiler', provider);

    context.subscriptions.push(
        vscode.commands.registerCommand('flux.startProfiling', () => {
            vscode.window.showInformationMessage('Starting Flux Profiler...');
            // In a real implementation, this would trigger fluxc --profile and stream results
        }),
        vscode.commands.registerCommand('flux.stopProfiling', () => {
            vscode.window.showInformationMessage('Profiler stopped. Results generated.');
        })
    );
}

class FluxProfileProvider {
    getTreeItem(element) { return element; }
    getChildren(element) {
        return Promise.resolve([
            new vscode.TreeItem('Total Execution Time: --', vscode.TreeItemCollapsibleState.None),
            new vscode.TreeItem('Memory Peak: --', vscode.TreeItemCollapsibleState.None),
            new vscode.TreeItem('Top Functions (Hotspots)', vscode.TreeItemCollapsibleState.Collapsed)
        ]);
    }
}

module.exports = { activate };
