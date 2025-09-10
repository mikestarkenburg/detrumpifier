# Mobile Usage Instructions

## Quick Option: Bookmarklet (Works on Most Mobile Browsers)

### Setup Instructions:

**Note**: We have two bookmarklet versions:
- `bookmarklet.min.js` - Basic version (smaller, less accurate, Google News only)
- `bookmarklet-improved.min.js` - Enhanced version (recommended, multi-site support)

#### iPhone/iPad (Safari):
1. Copy the entire code from `bookmarklet-improved.min.js` (recommended)
2. Add this page to bookmarks (tap Share → Add Bookmark)
3. Edit the bookmark:
   - Change name to "Detrumpifier"
   - Replace the URL with the copied javascript code
4. Save the bookmark

#### Android (Chrome):
1. Bookmark any page
2. Go to Chrome menu → Bookmarks
3. Long-press the bookmark and select "Edit"
4. Change name to "Detrumpifier"
5. Replace URL with the code from `bookmarklet-improved.min.js`

### Usage:
1. Visit any supported news site:
   - Google News (news.google.com)
   - CNN (cnn.com)
   - BBC News (bbc.com)
   - Reuters (reuters.com)
   - The New York Times (nytimes.com)
2. Tap the bookmarklet from your bookmarks
3. Trump articles will be hidden
4. Blue notification appears showing filter count and site name

## Better Option: Kiwi Browser (Android Only)

Kiwi Browser supports Chrome extensions directly!

1. Install [Kiwi Browser](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser) from Play Store
2. In Kiwi, go to chrome://extensions
3. Enable "Developer mode"
4. Load the extension folder directly

## For Power Users: Firefox Mobile (Android)

1. Install Firefox for Android
2. We'll need to submit to Mozilla Add-ons
3. Or use Firefox Nightly with custom add-on collections

## iOS Alternative: Userscripts App

1. Install [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) from App Store
2. Set up the extension in Safari
3. Add the filtering script

## Bookmarklet Comparison

**Basic Bookmarklet** (`bookmarklet.min.js`):
- ✓ Very small size (~1KB)
- ✓ Basic Trump filtering
- ✗ Simple selectors (may miss articles)
- ✗ No title-specific filtering
- ✗ Google News only

**Improved Bookmarklet** (`bookmarklet-improved.min.js`):
- ✓ Multi-site support (Google News, CNN, BBC, Reuters, NYTimes)
- ✓ Better article detection with site-specific selectors
- ✓ Title-focused filtering (fewer false positives)
- ✓ Debounced updates for dynamic content
- ✓ Shows filtered count in notification with site name
- ✓ Uses proper text extraction to avoid missing spaces
- ✗ Larger size (~3KB) but still mobile-friendly

## Note
The bookmarklet version doesn't persist between page loads - you'll need to tap it each time you visit a news site. The browser extension options (Kiwi, Firefox) work automatically like the desktop version.