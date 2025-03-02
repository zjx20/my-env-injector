import sys
import os
import json
import re
import shutil
import glob

def modify_extension_js(extension_dir, env_vars):
    """
    Modifies the extension.js file of a VS Code extension to inject environment variables.

    Args:
        extension_dir: The directory of the target extension.
        env_vars: A dictionary of environment variables to inject.
    """
    extension_js_path = os.path.join(extension_dir, 'dist', 'extension.js')

    if not os.path.exists(extension_js_path):
        print(f"Error: extension.js not found in dist directory: {extension_dir}")
        return

    backup_js_path = os.path.join(extension_dir, 'dist', 'extension.js.bak')

    # Feature marker to identify our injected code
    start_marker = "// --- My Env Injector Start ---"
    end_marker = "// --- My Env Injector End ---"

    try:
        # Create a backup
        if not os.path.exists(backup_js_path):
            os.makedirs(os.path.dirname(backup_js_path), exist_ok=True)
            shutil.copy2(extension_js_path, backup_js_path)
            print(f"Backup created: {backup_js_path}")

        with open(extension_js_path, 'r') as f:
            content = f.read()

        # Remove existing injected code if present
        pattern = re.compile(f"{re.escape(start_marker)}.*?{re.escape(end_marker)}", re.DOTALL)
        content = pattern.sub("", content)

        # Build the new injection code
        injection_code = [start_marker]
        for key, value in env_vars.items():
            injection_code.append(f"process.env.{key} = '{value}';")
        injection_code.append(end_marker)
        injection_code_str = "\n".join(injection_code)

        # Append the new code to the end of the file
        new_content = content + "\n" + injection_code_str + "\n"

        with open(extension_js_path, 'w') as f:
            f.write(new_content)

        print(f"Successfully injected env vars into {extension_js_path}")

    except Exception as e:
        print(f"Error modifying extension.js: {e}")
        # Attempt to restore from backup on error
        if os.path.exists(backup_js_path):
            shutil.copy2(backup_js_path, extension_js_path)
            print(f"Restored from backup: {backup_js_path}")
        else:
            print("Backup file not found.")

def modify_all_versions(extension_parent_dir, base_extension_name, env_vars):
    """
    Modifies all versions of the extension in the given directory.

    Args:
        extension_parent_dir: The parent directory containing the extension directories.
        base_extension_name: The base name of the extension (e.g., "google.geminicodeassist").
        env_vars: The environment variables to inject.
    """

    # Find all matching directories
    extension_dirs = glob.glob(os.path.join(extension_parent_dir, f"{base_extension_name}*"))

    if not extension_dirs:
        print(f"No extension found, with base name: {base_extension_name} in: {extension_parent_dir}")
        return

    for extension_dir in extension_dirs:
        print(f"Found extension directory: {extension_dir}")
        modify_extension_js(extension_dir, env_vars)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python modifyExtension.py <extension_parent_dir> <base_extension_name> <env_vars_json>")
        sys.exit(1)

    extension_parent_dir = sys.argv[1]
    base_extension_name = sys.argv[2]
    env_vars_json = sys.argv[3]

    try:
        env_vars = json.loads(env_vars_json)
        modify_all_versions(extension_parent_dir, base_extension_name, env_vars)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
