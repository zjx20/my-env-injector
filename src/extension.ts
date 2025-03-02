import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

// Define the possible statuses for each extension
type ExtensionStatus = "injected" | "not found" | "not modified";

// Keep track of the status of each extension
interface ExtensionStatusMap {
    [extensionName: string]: ExtensionStatus;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "my-env-injector" is now active!');

    // Load the persisted extension status from global state
    const extensionStatus = context.globalState.get<ExtensionStatusMap>('extensionStatus', {});

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('myEnvInjector')) {
            console.log('Configuration changed, re-injecting...');
            // Reset extension status to "not modified" when configuration changes
            for (const key in extensionStatus) {
                extensionStatus[key] = "not modified";
            }
            // Persist the cleared extension status
            context.globalState.update('extensionStatus', extensionStatus);
            injectEnvVars(context, extensionStatus, context);

            // Show the reload notification for configuration changes
            vscode.window.showInformationMessage(
                "My Env Injector: Please reload the VS Code window for the configuration changes to take effect.",
                "Reload Now"
            ).then(selection => {
                if (selection === "Reload Now") {
                    vscode.commands.executeCommand("workbench.action.reloadWindow");
                }
            });
        }
    }));

    injectEnvVars(context, extensionStatus, context);
}

function injectEnvVars(context: vscode.ExtensionContext, extensionStatus: ExtensionStatusMap, originalContext: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('myEnvInjector');
    const targets = config.get<any[]>('targets');
    const userDefinedExtensionParentDir = config.get<string>('extensionParentDir', ''); // Get the user-defined path

    if (!targets || targets.length === 0) {
        console.warn('No target extensions configured.');
        return;
    }

    // Use the user-defined path if provided, otherwise use the default path
    const extensionParentDir = userDefinedExtensionParentDir || path.dirname(context.extensionPath);
    console.log(`Extension Parent Directory: ${extensionParentDir}`);

    targets.forEach(target => {
        const extensionName = target.extensionName;
        const envVars = target.envVars;

        console.log(`Target Extension: ${extensionName}`);

        if (!envVars || Object.keys(envVars).length === 0) {
            console.warn(`No env vars for ${extensionName} found.`);
            return;
        }

        const pythonScriptPath = context.asAbsolutePath(path.join('src', 'modifyExtension.py'));

        console.log(`pythonScriptPath: ${pythonScriptPath}`);
        console.log(`extensionName: ${extensionName}`);
        console.log(`envVars: ${JSON.stringify(envVars)}`);

        const pythonProcess = spawn('python3', [pythonScriptPath, extensionParentDir, extensionName, JSON.stringify(envVars)]);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Script Output: ${data}`);
            const output = data.toString();
            if (output.includes("Successfully injected env vars")) {
                // Check if a notification has already been shown for this extension
                if (extensionStatus[extensionName] !== "injected") {
                    // Show the success notification with reload button
                    vscode.window.showInformationMessage(
                        `My Env Injector: Successfully injected env vars into ${extensionName}.`,
                        "Reload Now"
                    ).then(selection => {
                        if (selection === "Reload Now") {
                            vscode.commands.executeCommand("workbench.action.reloadWindow");
                        }
                    });
                    extensionStatus[extensionName] = "injected"; // Mark that the notification has been shown
                    originalContext.globalState.update('extensionStatus', extensionStatus);
                }
            }
            if (output.includes("No extension found")) {
                 if (extensionStatus[extensionName] !== "not found") {
                    vscode.window.showWarningMessage(`My Env Injector: No extension found for ${extensionName}`);
                    extensionStatus[extensionName] = "not found"; // Mark that the notification has been shown
                    originalContext.globalState.update('extensionStatus', extensionStatus);
                }
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Script Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python Script exited with code ${code}`);
        });
    });
}

export function deactivate() { }
