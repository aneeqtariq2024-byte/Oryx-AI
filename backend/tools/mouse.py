"""ORYX Tools — Mouse control (pyautogui)."""

import pyautogui
from backend.security.audit import log_audit


def click(x: int | None = None, y: int | None = None, button: str = "left") -> dict:
    """Click at (x, y) or current position."""
    log_audit("pc_agent", "click", f"{x},{y} {button}")
    if x is not None and y is not None:
        pyautogui.click(x, y, button=button)
    else:
        pyautogui.click(button=button)
    return {"status": "success", "action": "click", "x": x, "y": y, "button": button}


def scroll(direction: str = "down", amount: int = 5) -> dict:
    """Scroll the mouse wheel."""
    clicks = amount if direction == "down" else -amount
    log_audit("pc_agent", "scroll", f"{direction} {amount}")
    pyautogui.scroll(clicks)
    return {"status": "success", "action": "scroll", "direction": direction, "amount": amount}


def move_to(x: int, y: int) -> dict:
    """Move the mouse cursor to (x, y)."""
    pyautogui.moveTo(x, y)
    return {"status": "success", "action": "move_to", "x": x, "y": y}


def get_position() -> dict:
    """Return current mouse position."""
    x, y = pyautogui.position()
    return {"status": "success", "action": "get_position", "x": x, "y": y}
