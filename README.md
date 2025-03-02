# My Env Injector

**A VS Code Extension for Injecting Environment Variables into Other Extensions**

## ⚠️ Important Warning: Code Modification and Potential Risks ⚠️

**This extension modifies the code of other locally installed VS Code extensions. While it's designed to do so safely, there is a potential risk of damaging or corrupting the target extensions. Incorrect configuration or unexpected updates to target extensions could lead to malfunctions or instability.  Use this extension with extreme caution and at your own risk. If you encounter issues with other extensions, please follow the recovery steps mentioned below.**

## Description

`My Env Injector` is a VS Code extension designed to inject environment variables into other installed VS Code extensions. This can be particularly useful in scenarios where you need to modify the behavior of an extension by providing specific environment variables, such as setting up HTTP/HTTPS proxies, API keys, or other configuration parameters.

**Key Features:**

*   **Configuration-Driven:** You specify which extensions to modify and the environment variables to inject directly within VS Code's settings (`settings.json`).
*   **Explicit Targets:** You must explicitly add the target extension and environment variables to the `myEnvInjector.targets` array in your `settings.json` file.
*   **Custom Extension Parent Directory:** You can specify the parent directory of VS Code extensions through the `myEnvInjector.extensionParentDir` setting in your `settings.json` file. This is useful if your extensions are not installed in the default location.
*   **Automatic Re-injection:** The extension automatically re-injects the environment variables when you modify its configuration or if the target extensions are updated.
*   **Clean Injection:** It uses marker comments (`// --- My Env Injector Start ---` and `// --- My Env Injector End ---`) to identify and update the injected code, ensuring clean and manageable modifications.
*   **Python-Powered Modification:** It uses a Python script (`modifyExtension.py`) for file system modifications, as the VS Code API doesn't directly allow file system changes outside the extension's workspace.
*   **Support for Multiple Extensions:** You can set environment variables for multiple extensions simultaneously.
*   **Persisted Extension Status:** The extension tracks the injection status of each target extension, providing clear feedback on whether the injection was successful or not.
*   **Reload Prompt:** After successful injection or configuration change, the extension prompts you to reload the VS Code window to apply the changes.
*   **Error handling:** Show warning message if the target extension is not found.

## How It Works

1.  **Configuration:** You need to add the target extensions and the environment variables to the `myEnvInjector.targets` array in your `settings.json` file. If your extensions are not in the default path, you should also set `myEnvInjector.extensionParentDir` to the correct location.

    ```json
    {
      "myEnvInjector.extensionParentDir": "/path/to/your/vscode/extensions", // Optional: specify custom parent directory
      "myEnvInjector.targets": [
        {
          "extensionName": "google.geminicodeassist",
          "envVars": {
            "HTTP_PROXY": "http://127.0.0.1:8001",
            "HTTPS_PROXY": "http://127.0.0.1:8001",
            "MY_CUSTOM_VAR": "my_custom_value"
          }
        },
        {
            "extensionName": "some.other.extension",
            "envVars": {
                "API_KEY": "your_api_key"
            }
        }
      ]
    }
    ```

2.  **Activation:** When VS Code starts, `My Env Injector` activates and reads its configuration.
3.  **Finding Targets:**
    *   It tries to find the installation directory of the specified target extensions.
    *   It will first try to use the directory specified in `myEnvInjector.extensionParentDir`.
    *   If `myEnvInjector.extensionParentDir` is not set or invalid, it falls back to the default VS Code extensions directory.
    * **Error handling**: If the target extension is not found, a warning message will be showed.
4.  **Modification:** For each target extension, it runs the Python script (`modifyExtension.py`) that performs the following steps:
    *   Reads the `extension.js` file of the target extension (usually located in `dist/extension.js` within the extension's directory).
    *   Finds and removes any previously injected code using the marker comments (`// --- My Env Injector Start ---` and `// --- My Env Injector End ---`).
    *   Injects the new environment variable assignments using `process.env.<VAR_NAME> = '<VALUE>';` at the end of the file.
    *   Writes the modified `extension.js` file back to disk.
5.  **Configuration Change:** If you change the `myEnvInjector.targets` or `myEnvInjector.extensionParentDir` settings, the extension will automatically re-inject the environment variables.
6. **Status Update**: The plugin will show corresponding messages based on the status of each extension.
7.  **Reload:** After a successful injection or configuration change, a notification will prompt you to reload the VS Code window to ensure the changes take effect.

## Recovery Steps: Fixing Damaged Extensions

If you experience problems with an extension after using `My Env Injector`, follow these steps to restore it:

1.  **Disable `My Env Injector`:** Go to the Extensions view in VS Code and disable `My Env Injector`.
2.  **Uninstall the Damaged Extension:** Uninstall the extension that is exhibiting issues.
3.  **Reinstall the Extension:** Reinstall the extension you just uninstalled. This will restore it to its original state.

## Prerequisites

*   **Node.js and npm:** Required for building and developing the VS Code extension.
*   **Python 3:** Required for running the `modifyExtension.py` script.
*   **VS Code**: Obviously.

## Building and Running the Extension

1.  **Clone the Repository (or Download the Project):**
    ```bash
    git clone <repository-url> # Replace <repository-url> with your repository URL
    cd my-env-injector
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Compile the TypeScript Code:**
    ```bash
    npm run compile
    ```
    Or use the watch mode for development:
    ```bash
    npm run watch
    ```
    The compiled JavaScript code will be placed in the `out/` directory.

4.  **Run and Debug the Extension:**
    *   Open the project in VS Code.
    *   Go to the Run and Debug view (Ctrl+Shift+D or Cmd+Shift+D).
    *   Select "Run Extension" from the dropdown.
    *   Press F5 to start debugging.

    This will open a new VS Code window (the Extension Development Host) where you can test your extension.

5.  **Configuration:** Open your `settings.json` file (File -> Preferences -> Settings -> Open Settings (JSON)) and add your configuration to the `myEnvInjector.targets` and optionally the `myEnvInjector.extensionParentDir` settings as described above.

## Publishing to Marketplace

Please follow these steps to publish the extension to the VS Code Marketplace:

1.  Make sure you have `vsce` (Visual Studio Code Extensions CLI) installed. If not, run:
    ```bash
    npm install -g @vscode/vsce
    ```
2.  Create a Personal Access Token (PAT) in Azure DevOps with "Marketplace (Acquire, manage)" scope with `Read & Publish` permission.
3.  Create a publisher in VS Code Marketplace Publisher Management page.
4.  Modify `package.json`, adding fields `publisher`, `categories`, `icon`, `repository`, `keywords` if needed.
5. Create a `CHANGELOG.md` and describe the changes you made.
6.  Run `vsce login YOUR_PUBLISHER_ID --pat YOUR_PAT` to login.
7.  Run `vsce package` to package the extension.
8. Run `vsce publish` to publish the extension.
9. Visit `https://marketplace.visualstudio.com/manage/publishers` to check the publish status.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the project's repository.
