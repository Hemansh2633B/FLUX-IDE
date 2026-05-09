const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class FluxPackageProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!this.workspaceRoot) {
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve([]);
        } else {
            const tomlPath = path.join(this.workspaceRoot, 'flux.toml');
            if (fs.existsSync(tomlPath)) {
                // Simplified TOML parsing
                return Promise.resolve([
                    new vscode.TreeItem('standard', vscode.TreeItemCollapsibleState.None),
                    new vscode.TreeItem('io', vscode.TreeItemCollapsibleState.None)
                ]);
            } else {
                return Promise.resolve([]);
            }
        }
    }
}

function activate(context) {
    const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

    const packageProvider = new FluxPackageProvider(rootPath);
    vscode.window.registerTreeDataProvider('fluxPackages', packageProvider);

    let createProjectDisposable = vscode.commands.registerCommand('flux.createProject', async function () {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select folder for new Flux project'
        });

        if (result && result[0]) {
            const projectPath = result[0].fsPath;
            const templatePath = path.join(context.extensionPath, 'templates', 'starter');

            try {
                copyRecursiveSync(templatePath, projectPath);
                vscode.window.showInformationMessage(`Flux project created at ${projectPath}`);
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath));
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to create project: ${err.message}`);
            }
        }
    });

    let fpmInstallDisposable = vscode.commands.registerCommand('flux.fpmInstall', async () => {
        const pkgName = await vscode.window.showInputBox({
            prompt: 'Enter package name to install (leave blank for --stdlib)',
            placeHolder: 'e.g. json'
        });
        if (pkgName === undefined) return;
        const args = pkgName.trim() === '' ? 'install --stdlib' : `install ${pkgName}`;
        runFpmCommand(args);
    });

    let fpmUpdateDisposable = vscode.commands.registerCommand('flux.fpmUpdate', () => {
        runFpmCommand('update --all');
    });

    let fpmListDisposable = vscode.commands.registerCommand('flux.fpmList', () => {
        runFpmCommand('list');
    });

    let fpmAddSourceDisposable = vscode.commands.registerCommand('flux.fpmAddSource', () => {
        runFpmCommand('addsource');
    });

    let refreshPackagesDisposable = vscode.commands.registerCommand('flux.refreshPackages', () => {
        packageProvider.refresh();
    });

    context.subscriptions.push(
        createProjectDisposable,
        fpmInstallDisposable,
        fpmUpdateDisposable,
        fpmListDisposable,
        fpmAddSourceDisposable,
        refreshPackagesDisposable
    );
}

function runFpmCommand(args) {
    const config = vscode.workspace.getConfiguration('flux');
    const fpmPath = config.get('fpmPath') || 'fpm.py';
    const pythonPath = config.get('pythonPath') || 'python3';

    const terminal = vscode.window.createTerminal('FPM');
    terminal.show();
    terminal.sendText(`${pythonPath} ${fpmPath} ${args}`);
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
