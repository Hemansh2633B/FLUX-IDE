const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
    let disposable = vscode.commands.registerCommand('flux.createProject', async function () {
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

    context.subscriptions.push(disposable);
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
