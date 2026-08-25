"""ORYX Tools — Keyboard input simulation (pyautogui)."""

import pyautogui
from backend.security.audit import log_audit


def type_text(text: str) -> dict:
    """Type a string at the current cursor position."""
    log_audit("pc_agent", "type_text", text[:80])
    pyautogui.typewrite(text, interval=0.03)
    return {"status": "success", "action": "type_text", "text": text}


def hotkey(*keys: str) -> dict:
    """Press a hotkey combo, e.g. hotkey('ctrl', 'c')."""
    combo = "+".join(keys)
    log_audit("pc_agent", "keyboard_hotkey", combo)
    pyautogui.hotkey(*keys)
    return {"status": "success", "action": "hotkey", "combo": combo}


def press(key: str) -> dict:
    log_audit("pc_agent", "key_press", key)
    pyautogui.press(key)
    return {"status": "success", "action": "key_press", "key": key}
