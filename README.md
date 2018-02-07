
# Installation

`npm install` should do what you need! Use node 8 or higher!

# Usage

`node index.js` will run the script. Currently, you'll get a lot of console messages as it works its magic.

When the script has completed crawling, it will alert you with a console message.

When complete, the script should have written a cache backup of the HTML content of the pages it crawled. These files can be found in `./cache`. The script will have also written sitemap files, which can be found in `./sitemap`.

# TODO
- Google sheets support (write info to Google sheets)
- Integrate existing Wagtail sitemap into consideration of new sitemap creation
- Check for lingering Wordpress content