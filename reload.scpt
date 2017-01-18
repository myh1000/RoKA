if isRunning("Google Chrome") then
	tell application "Google Chrome"
		set extensionsWindow to null
		repeat with browserWindow in windows
			repeat with browserTab in tabs of browserWindow
				if URL of browserTab is equal to "chrome://extensions/" then
					set extensionsWindow to browserTab
				end if
			end repeat
		end repeat

		if extensionsWindow is null then
			set extensionsWindow to make new tab at end of tabs of window 1
			set URL of extensionsWindow to "chrome://extensions"
		end if

		reload extensionsWindow
	end tell
end if

on isRunning(appName)
	tell application "System Events"
		set isAppRunning to (name of processes) contains appName
		return isAppRunning
	end tell
end isRunning
