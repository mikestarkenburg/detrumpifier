# detrumpifier
This Chrome extension removes any articles with Trump references from your news feeds across multiple major news websites including Google News, CNN, BBC, Reuters, and The New York Times.
****

This is not a political statement of any kind.  OR, it is a political statement of EVERY KIND!!!!  It's got something to make everyone happy.  

If you are positive on Trump, this extension will make you happy by removing the mainstream media distortions of his words from your feed.  
If you are negative on Trump, this extension will make you happy by removing all the triggering things his administration is saying or doing from your feed.  

Either way, everyone wins!  

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black )](https://coff.ee/detrumpifier )

## Installation

INSTALL AT YOUR OWN RISK:  it's all the way open source, so you can see I am doing nothing sinister here, but my coding chops are so rusty who knows what this thing might do.  It's been pretty well behaved on my own browsers but I take no responsibility for unintended consequences.  

This extension is designed for users who are willing to turn on Chrome's developer mode.  It's generally pretty harmless but keep your chrome up to date and don't install extensions you haven't verified (maybe including this one?!)   

### Installation from GitHub

1.  **Clone or Download the Repository**: Begin by obtaining the extension's source code. Clone this repository or download the ZIP file of the repository directly from GitHub and extract it to a convenient location on your computer.
2.  **Enable Developer Mode in Chrome**: Open your Chrome browser and navigate to `chrome://extensions/`. In the top right corner of the extensions page, toggle the **"Developer mode"** switch to the `On` position.
3.  **Load the Unpacked Extension**: With Developer mode enabled, a new button labeled **"Load unpacked"** will appear on the top left of the extensions page. Click this button.
4.  **Select the Extension Folder**: A file dialog will open. Navigate to and select the `chrome_extension_trump_filter` folder that you cloned or extracted in Step 1. **Do not select the ZIP file itself, but the folder containing `manifest.json` and other extension files.**
5.  **Verify Installation**: The "Trump Filter for Google News" extension should now appear in your list of installed extensions. You may want to click the puzzle piece icon in your Chrome toolbar and then the pin icon next to the "Trump Filter" to make its icon visible for easy access.

## Usage

Once installed, the extension automatically operates on supported news websites:
- **Google News** (`news.google.com`)
- **CNN** (`cnn.com`)
- **BBC News** (`bbc.com`)
- **Reuters** (`reuters.com`)
- **The New York Times** (`nytimes.com`)

Simply navigate to any of these news sites. The extension automatically detects and hides articles that contain references to Donald Trump as the page loads, providing a cleaner news feed without requiring any manual intervention.

### Manual Controls (via Extension Popup)

For more control, you can interact with the extension's popup:

1.  **Click the Extension Icon**: Click on the icon in your Chrome toolbar (the blue filter icon).
2.  **Filter Current Page**: If articles weren't filtered or content loads dynamically, click the **"Filter Current Page"** button to re-apply filtering.
3.  **Open Filtered View**: Click the **"Open Filtered View"** button to see all non-Trump articles in a clean, distraction-free layout (works on all supported sites).
4.  **Monitor Statistics**: The popup shows real-time statistics of filtered vs. total articles on the current page.
5.  **Settings**: Click the gear icon to access settings where you can:
    - Enable/disable filtering for specific sites
    - Add custom keywords to filter
    - View lifetime statistics
    - Export/import your settings


## Mobile Support

While Chrome mobile doesn't support extensions, you have several options:

- **Bookmarklet**: Works on any mobile browser (see `MOBILE_USAGE.md`)
- **Kiwi Browser** (Android): Supports Chrome extensions directly
- **Firefox Mobile** (Android): Extension support available
- **Safari** (iOS): Via Userscripts app

See `MOBILE_USAGE.md` for detailed instructions.

VERY INTERESTED to see what people think about this and what enhancements they might want, don't be shy!   


[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black )](https://coff.ee/detrumpifier )

SMALL PRINT FOLLOWS:  

Contributing:  This extension is designed to be simple and focused. If you'd like to contribute:
  1. Fork the repository
  2. Make your changes
  3. Test thoroughly on all supported news sites
  4. Submit a pull request... sorry, can't give more guidance than that... 

License: MIT License - feel free to modify and distribute as needed.

Disclaimer:  This extension is for personal use and educational purposes. It modifies the display of web content locally and does not affect the original news services.  No content ever leaves your computer and goes anywhere sinister.  Honestly, the whole thing is really a goof, but once I built it I realized it really did calm down my news reading day.  Make what you will of that....
