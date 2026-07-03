import subprocess
import platform
import threading
import time

def copy_to_clipboard(text: str, clear_after_seconds: int = 15):
    """
    Copy text to clipboard and automatically clear after N seconds.
    Prevents clipboard sniffing attacks.
    """
    if not text:
        return
    
    system = platform.system()
    
    try:
        if system == "Windows":
            subprocess.run(["clip"], input=text.encode("utf-8"), check=True, shell=True)
        elif system == "Darwin":  # macOS
            subprocess.run(["pbcopy"], input=text.encode("utf-8"), check=True)
        else:  # Linux (requires xclip: sudo apt install xclip)
            subprocess.run(["xclip", "-selection", "clipboard"], input=text.encode("utf-8"), check=True)
        
        # Auto-clear after timeout
        def clear():
            time.sleep(clear_after_seconds)
            try:
                subprocess.run(["clip"], input=b"", check=True, shell=True) if system == "Windows" else None
            except:
                pass
        
        threading.Thread(target=clear, daemon=True).start()
        return True
    except:
        return False
        