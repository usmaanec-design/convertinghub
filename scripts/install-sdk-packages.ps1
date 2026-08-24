$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot"
$env:ANDROID_HOME = "C:\Users\usmaa\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"

$sdkMgr = "C:\Users\usmaa\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "Installing build-tools 36.1.0..."
(1..10 | ForEach-Object { "y" }) | & $sdkMgr "build-tools;36.1.0" "platforms;android-36"
