const vscode = require('vscode');

function activate(context) {
    vscode.tasks.registerTaskProvider('flux', {
        provideTasks: () => {
            return [];
        },
        resolveTask(_task) {
            const definition = _task.definition;
            if (definition.command) {
                const compilerPath = vscode.workspace.getConfiguration('flux').get('compilerPath') || 'fluxc';
                return new vscode.Task(
                    definition,
                    _task.scope,
                    _task.name || definition.command,
                    'flux',
                    new vscode.ShellExecution(`${compilerPath} ${definition.command}`),
                    "$fluxc"
                );
            }
            return undefined;
        }
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
