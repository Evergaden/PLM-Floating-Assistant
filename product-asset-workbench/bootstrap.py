# -*- coding: utf-8 -*-
"""Visible first-run launcher for the Qt desktop application.

The old batch file launched PythonW directly, so missing packages failed without
any visible feedback.  This standard-library-only window keeps the user informed
while the one-time desktop dependencies are installed.
"""

from __future__ import annotations

import importlib.util
import os
import queue
import subprocess
import sys
import threading
import traceback
import tkinter as tk
from pathlib import Path
from tkinter import messagebox


APP_DIR = Path(__file__).resolve().parent
REQUIRED = ("PySide6.QtSvg", "PIL", "openpyxl")
ERROR_LOG = APP_DIR / "startup-error.log"


def dependencies_ready() -> bool:
    return all(importlib.util.find_spec(name) is not None for name in REQUIRED)


def launch_app() -> int:
    return subprocess.call([sys.executable, str(APP_DIR / "rename_tool.py")], cwd=APP_DIR)


def write_fatal_error() -> None:
    """Persist errors so a double-click launch never fails silently."""
    ERROR_LOG.write_text(traceback.format_exc(), encoding="utf-8")


class Bootstrap:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("Product Asset Workbench")
        self.root.geometry("620x400")
        self.root.resizable(False, False)
        self.root.configure(bg="#102B43")
        self.messages: queue.Queue[str | None] = queue.Queue()
        self.installing = False
        self.closing = False
        self.poll_job: str | None = None
        self._build_ui()
        self.poll_job = self.root.after(80, self._poll_messages)

    def _build_ui(self) -> None:
        title = tk.Label(self.root, text="Product Asset Workbench", bg="#102B43", fg="#FFFFFF", font=("Microsoft YaHei", 22, "bold"))
        title.pack(anchor="w", padx=30, pady=(28, 3))
        subtitle = tk.Label(self.root, text="正在准备 PLM 成品资产工作台", bg="#102B43", fg="#B8DDF3", font=("Microsoft YaHei", 10))
        subtitle.pack(anchor="w", padx=32, pady=(0, 20))
        self.status = tk.Label(self.root, text="检查桌面组件…", bg="#102B43", fg="#B8DDF3", font=("Microsoft YaHei", 11))
        self.status.pack(anchor="w", padx=32)
        self.log = tk.Text(self.root, height=12, bg="#0B1E30", fg="#D4E7F5", insertbackground="#FFFFFF", relief="flat", wrap="word", font=("Consolas", 9))
        self.log.pack(fill="both", expand=True, padx=30, pady=(9, 14))
        self.log.configure(state="disabled")
        self.button = tk.Button(self.root, text="安装并启动", command=self.install, bg="#1E7FB9", fg="#FFFFFF", activebackground="#1672A6", activeforeground="#FFFFFF", relief="flat", padx=18, pady=8, font=("Microsoft YaHei", 10, "bold"))
        self.button.pack(anchor="e", padx=30, pady=(0, 25))
        if dependencies_ready():
            self.status.configure(text="组件已就绪，正在启动…")
            self.root.after(120, self.start)
        else:
            self._append("首次运行需要安装桌面组件。安装过程会显示在这里，完成后自动启动。")

    def _append(self, text: str) -> None:
        self.log.configure(state="normal")
        self.log.insert("end", text.rstrip() + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    def install(self) -> None:
        if self.installing:
            return
        self.installing = True
        self.button.configure(state="disabled")
        self.status.configure(text="正在安装组件，请保持此窗口打开…")
        self._append(f"Python: {sys.executable}")
        threading.Thread(target=self._install_worker, daemon=True).start()

    def _install_worker(self) -> None:
        command = [sys.executable, "-m", "pip", "install", "--prefer-binary", "-r", str(APP_DIR / "requirements.txt")]
        try:
            process = subprocess.Popen(command, cwd=APP_DIR, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
            assert process.stdout is not None
            for line in process.stdout:
                self.messages.put(line)
            if process.wait() == 0 and dependencies_ready():
                self.messages.put("__DONE__")
            else:
                self.messages.put("__FAILED__")
        except OSError as error:
            self.messages.put(f"安装器无法启动：{error}")
            self.messages.put("__FAILED__")

    def _poll_messages(self) -> None:
        if self.closing:
            return
        try:
            while True:
                message = self.messages.get_nowait()
                if message == "__DONE__":
                    self.status.configure(text="组件安装完成，正在启动…")
                    self._append("安装完成。")
                    self.root.after(400, self.start)
                elif message == "__FAILED__":
                    self.installing = False
                    self.status.configure(text="安装没有完成。请查看日志并重试。")
                    self.button.configure(state="normal", text="重试安装")
                    self._append("安装失败；请检查网络、Python 版本和日志。")
                else:
                    self._append(message)
        except queue.Empty:
            pass
        if not self.closing:
            self.poll_job = self.root.after(100, self._poll_messages)

    def start(self) -> None:
        if self.closing:
            return
        self.closing = True
        if self.poll_job is not None:
            try:
                self.root.after_cancel(self.poll_job)
            except tk.TclError:
                pass
        self.root.destroy()
        code = launch_app()
        if code:
            error_root = tk.Tk()
            error_root.withdraw()
            messagebox.showerror("Product Asset Workbench", f"程序退出，错误代码：{code}\n请查看 startup.log 和 startup-error.log。", parent=error_root)
            error_root.destroy()

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    try:
        Bootstrap().run()
    except Exception:
        write_fatal_error()
        raise
