"""ORYX Tools — PC application and folder control (cross-platform).

Uses subprocess / os.startfile / xdg-open to open apps and folders.
"""

import os
import platform
import subprocess
from pathlib import Path

from backend.security.audit import log_audit


APP_ALIASES: dict[str, str] = {
    "notepad": "notepad.exe",
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "firefox": r"C:\Program Files\Mozilla Firefox\firefox.exe",
    "vscode": "code",
    "explorer": "explorer.exe",
    "cmd": "cmd.exe",
    "powershell": "powershell.exe",
    "terminal": "wt.exe",
    "calc": "calc.exe",
    "paint": "mspaint.exe",
}


def open_application(name: str) -> dict:
    """Open an application by name or alias."""
    log_audit("pc_agent", "open_application", name)
    name_lower = name.lower().strip()

    exe = APP_ALIASES.get(name_lower, name_lower)
    try:
        if platform.system() == "Windows":
            os.startfile(exe)  # type: ignore[attr-defined]
        else:
            subprocess.Popen(["xdg-open", exe])
        return {"status": "success", "action": "open_application", "app": name}
    except Exception as e:
        return {"status": "error", "action": "open_application", "app": name, "error": str(e)}


def close_application(name: str) -> dict:
    """Attempt to kill a process by name."""
    log_audit("pc_agent", "close_application", name)
    try:
        if platform.system() == "Windows":
            subprocess.run(["taskkill", "/f", "/im", name], capture_output=True)
        else:
            subprocess.run(["pkill", "-f", name], capture_output=True)
        return {"status": "success", "action": "close_application", "app": name}
    except Exception as e:
        return {"status": "error", "action": "close_application", "app": name, "error": str(e)}


def open_folder(path: str) -> dict:
    """Open a folder in the system file explorer."""
    log_audit("pc_agent", "open_folder", path)
    expanded = os.path.expanduser(path)
    if not os.path.isdir(expanded):
        return {"status": "error", "action": "open_folder", "path": path, "error": "Folder not found"}
    try:
        if platform.system() == "Windows":
            os.startfile(expanded)  # type: ignore[attr-defined]
        else:
            subprocess.Popen(["xdg-open", expanded])
        return {"status": "success", "action": "open_folder", "path": expanded}
    except Exception as e:
        return {"status": "error", "action": "open_folder", "path": path, "error": str(e)}


def screenshot() -> dict:
    """Take a screenshot and return the file path."""
    log_audit("pc_agent", "screenshot", "")
    try:
        import pyautogui
        ss_dir = Path(__file__).parent.parent.parent / "screenshots"
        ss_dir.mkdir(exist_ok=True)
        path = str(ss_dir / "screenshot.png")
        pyautogui.screenshot(path)
        return {"status": "success", "action": "screenshot", "path": path}
    except ImportError:
        return {"status": "error", "action": "screenshot", "error": "pyautogui not installed"}
    except Exception as e:
        return {"status": "error", "action": "screenshot", "error": str(e)}
