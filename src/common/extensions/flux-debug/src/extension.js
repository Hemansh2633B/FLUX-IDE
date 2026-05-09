const vscode = require('vscode');

function activate(context) {
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('flux', new FluxDebugConfigurationProvider()));
}

class FluxDebugConfigurationProvider {
    resolveDebugConfiguration(folder, config, token) {
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'flux') {
                config.type = 'flux';
                config.name = 'Launch';
                config.request = 'launch';
                config.program = '${fileDirname}/${fileBasenameNoExtension}';
                config.stopOnEntry = true;
            }
        }

        if (!config.program) {
            return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
                return undefined;
            });
        }

        // Target CodeLLDB if available, which is open-source and works better with VSCodium
        // Fallback to lldb-dap (part of LLVM)
        config.type = 'lldb';

        return config;
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
