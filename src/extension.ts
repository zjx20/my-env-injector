import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

// Define the possible statuses for each extension
type ExtensionStatus = "injected" | "not found" | "not modified";

// Keep track of the status of each extension
interface ExtensionStatusMap {
    [extensionName: string]: ExtensionStatus;
}

export async function activate(context: vscode.ExtensionContext) {
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

            // Asyncronously inject env vars
            injectEnvVarsWithLock(context, extensionStatus, context);
        }
    }));

    await injectEnvVarsWithLock(context, extensionStatus, context);
}

// Acquire a lock to prevent concurrent executions.
// The locking mechanism is not perfect but should work for most cases
async function acquireLock(context: vscode.ExtensionContext, timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    const lockKey = 'myEnvInjector.lock';
    const lockValue = `${randomUUID()}-${startTime}`;

    while (Date.now() - startTime < timeout) {
        const currentLock = context.globalState.get(lockKey);

        if (!currentLock) {
            await context.globalState.update(lockKey, lockValue);

            // Double check
            if (context.globalState.get(lockKey) === lockValue) {
                return true;
            }
        } else {
            // Check stale lock
            const lastLockTime = (currentLock as string).split('-').pop();
            console.log("last lock time: ", lastLockTime, "elapse: ", Date.now() - Number(lastLockTime))
            if (Date.now() - Number(lastLockTime) > 30000) {
                // Clean up stale lock
                await context.globalState.update(lockKey, undefined);
                continue;
            }
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
}

async function releaseLock(context: vscode.ExtensionContext) {
    await context.globalState.update('myEnvInjector.lock', undefined);
}

async function injectEnvVarsWithLock(context: vscode.ExtensionContext, extensionStatus: ExtensionStatusMap, originalContext: vscode.ExtensionContext) {
    console.log("in injectEnvVarsWithLock");
    if (await acquireLock(context)) {
        console.log("acquired lock, begin injecting");
        injectEnvVars(context, extensionStatus, originalContext);
        releaseLock(context);
    } else {
        console.log("failed to acquire lock");
    }
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
