Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class NewsWindowProbe {
  public delegate bool Callback(IntPtr hwnd, IntPtr data);
  [DllImport("user32.dll")] public static extern bool EnumWindows(Callback callback, IntPtr data);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hwnd, System.Text.StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out Rect rect);
  public struct Rect { public int left, top, right, bottom; }
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string title);
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hwnd, int index);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
}
'@
$newsHandle = [NewsWindowProbe]::FindWindow($null, 'RRadio News')
if ($newsHandle -eq [IntPtr]::Zero) {
  $newsProcess = @(Get-Process rradio -ErrorAction Stop)
  if ($newsProcess.Count -ne 1) { throw 'Expected exactly one owned native process' }
  $script:newsCandidates = @()
  [NewsWindowProbe]::EnumWindows({ param($handle, $data)
    [uint32]$ownerId = 0
    [void][NewsWindowProbe]::GetWindowThreadProcessId($handle, [ref]$ownerId)
    if ($ownerId -eq $newsProcess[0].Id) {
      $rect = New-Object NewsWindowProbe+Rect
      [void][NewsWindowProbe]::GetWindowRect($handle, [ref]$rect)
      if (($rect.right - $rect.left) -ge 320 -and ($rect.right - $rect.left) -le 700 -and ($rect.bottom - $rect.top) -le 300) { $script:newsCandidates += $handle }
    }
    return $true
  }, [IntPtr]::Zero) | Out-Null
  if ($script:newsCandidates.Count -ne 1) { throw "Expected one news window; found $($script:newsCandidates.Count)" }
  $newsHandle = $script:newsCandidates[0]
}
$newsStyle = [NewsWindowProbe]::GetWindowLong($newsHandle, -20)
[ordered]@{
  visible = [NewsWindowProbe]::IsWindowVisible($newsHandle)
  clickThrough = ($newsStyle -band 0x20) -ne 0
  noActivate = ($newsStyle -band 0x08000000) -ne 0
  topmost = ($newsStyle -band 0x8) -ne 0
  foreground = [NewsWindowProbe]::GetForegroundWindow().ToInt64().ToString()
  hwnd = $newsHandle.ToInt64().ToString()
} | ConvertTo-Json -Compress
