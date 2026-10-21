using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

class Program {
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    static extern IntPtr GetShellWindow();

    [DllImport("user32.dll")]
    static extern IntPtr GetDesktopWindow();

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    const int GWL_STYLE = -16;
    const long WS_CAPTION = 0x00C00000L;

    [StructLayout(LayoutKind.Sequential)]
    struct RECT { public int Left, Top, Right, Bottom; }

    static void Main(string[] args) {
        try {
            IntPtr fg = GetForegroundWindow();
            if (fg == IntPtr.Zero || fg == GetShellWindow() || fg == GetDesktopWindow()) {
                Console.WriteLine("normal");
                return;
            }

            uint pid = 0;
            GetWindowThreadProcessId(fg, out pid);
            if (pid == 0) {
                Console.WriteLine("normal");
                return;
            }

            string procName = "";
            try {
                procName = Process.GetProcessById((int)pid).ProcessName.ToLower();
            } catch {
                Console.WriteLine("normal");
                return;
            }

            if (procName == "idle" || procName == "explorer" || procName.Contains("momus") || procName == "shellexperiencehost") {
                Console.WriteLine("normal");
                return;
            }

            StringBuilder cls = new StringBuilder(256);
            GetClassName(fg, cls, 256);
            string clsStr = cls.ToString();
            if (clsStr == "Progman" || clsStr == "WorkerW" || clsStr == "Shell_TrayWnd") {
                Console.WriteLine("normal");
                return;
            }

            RECT r;
            if (GetWindowRect(fg, out r)) {
                int w = r.Right - r.Left;
                int h = r.Bottom - r.Top;
                int sw = Screen.PrimaryScreen.Bounds.Width;
                int sh = Screen.PrimaryScreen.Bounds.Height;

                int style = GetWindowLong(fg, GWL_STYLE);
                bool hasCaption = (style & WS_CAPTION) == WS_CAPTION;

                if (args.Length > 0 && args[0] == "--debug") {
                    Console.WriteLine("Proc: " + procName);
                    Console.WriteLine("Class: " + clsStr);
                    Console.WriteLine("Rect: " + r.Left + "," + r.Top + "," + w + "x" + h);
                    Console.WriteLine("Screen: " + sw + "x" + sh);
                    Console.WriteLine("HasCaption: " + hasCaption);
                }

                // A game in fullscreen covers the entire primary screen from (0,0) or (-X, -Y) and has height >= screen height (covers taskbar)
                // Also true borderless or exclusive fullscreen games lack WS_CAPTION or cover the taskbar completely
                if (r.Left <= 0 && r.Top <= 0 && w >= sw && h >= sh && !hasCaption) {
                    Console.WriteLine("game");
                    return;
                }
            }
        } catch {}

        Console.WriteLine("normal");
    }
}
