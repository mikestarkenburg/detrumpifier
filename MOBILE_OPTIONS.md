# Mobile Extension Options for Detrumpifier

## Option 1: Firefox Mobile (Android)
Firefox for Android supports extensions. We'd need to:
1. Ensure manifest.json is compatible with Firefox
2. Submit to Mozilla Add-ons store
3. Minor code adjustments for Firefox compatibility

## Option 2: Safari Web Extension (iOS)
For iPhone/iPad users:
1. Convert to Safari Web Extension format
2. Wrap in an iOS app container
3. Distribute through App Store
4. Requires Mac with Xcode for development

## Option 3: Bookmarklet (Universal)
Create a JavaScript bookmarklet that works on any mobile browser:
```javascript
javascript:(function(){
  // Minified version of content.js filtering logic
})();
```

## Option 4: Userscript (Via Apps)
Use apps like:
- **Android**: Kiwi Browser (supports Chrome extensions directly!)
- **iOS**: Userscripts app with Safari
- **Both**: Via Tampermonkey in supported browsers

## Option 5: Progressive Web App (PWA)
Create a PWA that:
1. Acts as a proxy/wrapper for Google News
2. Filters content before display
3. Works on all mobile devices
4. No app store needed

## Recommendation
**Short term**: Create a bookmarklet version for immediate mobile use
**Medium term**: Port to Kiwi Browser (Android) and Firefox Mobile
**Long term**: Consider Safari Web Extension for iOS if there's demand