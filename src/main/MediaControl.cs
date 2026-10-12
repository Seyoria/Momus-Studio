using System;
using System.Runtime.InteropServices;

public class MediaControl {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
    public const byte VK_MEDIA_PREV_TRACK = 0xB1;
    public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static void SendKey(byte key) {
        keybd_event(key, 0, 0, UIntPtr.Zero);
        keybd_event(key, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
    }

    public static void Main(string[] args) {
        if (args.Length == 0) return;
        string cmd = args[0].ToLower();
        if (cmd == "next") SendKey(VK_MEDIA_NEXT_TRACK);
        else if (cmd == "prev") SendKey(VK_MEDIA_PREV_TRACK);
        else if (cmd == "playpause") SendKey(VK_MEDIA_PLAY_PAUSE);
    }
}
