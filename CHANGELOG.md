# Changelog

All notable changes to the "My Env Injector" extension will be documented in this file.

## [0.0.1] - 2023-12-08

### Added

-   **Initial Release:** This is the first release of the "My Env Injector" extension.
-   **Environment Variable Injection:**
    -   Allows injecting environment variables into other locally installed VS Code extensions.
    -   Supports setting HTTP/HTTPS proxies, API keys, and other custom environment variables.
-   **Configuration-Driven:**
    -   Users can configure target extensions and environment variables to inject directly within VS Code's `settings.json`.
    -   Uses the `myEnvInjector.targets` array to define target extensions and their environment variables.
    -   Supports a custom parent directory for extensions via the `myEnvInjector.extensionParentDir` setting.
-   **Automatic Re-injection:**
    -   Automatically re-injects environment variables upon configuration changes or target extension updates.
-   **Clean Injection:**
    -   Utilizes marker comments (`// --- My Env Injector Start ---` and `// --- My Env Injector End ---`) to manage injected code, making modifications clean and easy to identify.
-   **Python-Powered Modification:**
    -   Leverages a Python script (`modifyExtension.py`) for secure file system modifications, as VS Code API doesn't allow direct changes outside the extension's workspace.
-   **Multiple Extension Support:**
    -   Allows users to configure and inject environment variables into multiple extensions simultaneously.
-   **Persisted Extension Status:**
    -   Tracks and displays the injection status of each target extension, providing feedback on success or failure.
-   **Reload Prompt:**
    -   Prompts the user to reload the VS Code window after a successful injection or a configuration change to apply the new environment variables.
- **Error handling**:
    - Show warning message if the target extension is not found.
- **Added icon**:
  - Added the new icon.

### Warning

- This extension modify the code of other locally installed vs code extensions. Please use with extreme caution.

### Recovery steps

- If you encounter issues with other extensions, please disable this extension first, then uninstall and reinstall the target extensions.

### How to use

- Please read the `README.md` file for detail.

### Notes

- This extension requires Node.js, npm, Python 3, and VS Code.

### Prerequisite

*   **Node.js and npm:** Required for building and developing the VS Code extension.
*   **Python 3:** Required for running the `modifyExtension.py` script.
*   **VS Code**: Obviously.

