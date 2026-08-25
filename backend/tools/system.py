"""ORYX Tools — System information utilities."""

import platform
import psutil


def get_system_info() -> dict:
    """Return OS, CPU, RAM, disk, and hostname info."""
    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "hostname": platform.node(),
        "processor": platform.processor(),
        "cpu_count": psutil.cpu_count(),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "ram_total_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
        "ram_available_gb": round(psutil.virtual_memory().available / (1024 ** 3), 2),
        "ram_percent": psutil.virtual_memory().percent,
        "disk_total_gb": round(psutil.disk_usage("/").total / (1024 ** 3), 2) if platform.system() != "Windows"
                           else round(psutil.disk_usage("C:\\").total / (1024 ** 3), 2),
        "disk_free_gb": round(psutil.disk_usage("/").free / (1024 ** 3), 2) if platform.system() != "Windows"
                          else round(psutil.disk_usage("C:\\").free / (1024 ** 3), 2),
    }
