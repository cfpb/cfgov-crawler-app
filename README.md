
# Installing and Running the App

1. Clone this repo and navigate to its directory.
1. `npm install` - This will install the requirements! Use node 8 or higher!
1. `npm start` - This begins the electron app.
1. An electron window will open that has two buttons: 'Start Crawler' and 'Stop Crawler'. This will allow you to control the crawler itself.

# Usage

You can start and stop the crawler via the interface. The crawler keeps track of what it has crawled and does natural discovery of new pages as it crawls.

The data the crawler finds is stored in `/database/cfpb-site.db`. This is an sqlite3 database and can be accessed as such. There's a lot of data in here, and not all of it has been formatted for ease of use. See the 'Database' section for more information.

The crawler saves its progress in the `mysavedqueue.json` file. If the app crashes, it will try to pick up where it left off, but this doesn't always work. If you want to start fresh, you can delete (or rename) this file and restart the app.

## Database

Here are some of the high points of the `database/cfpb-site.db` database. (Not every column is explained below - many of them come from the base package `simplecrawler`, and they have not been explored in depth yet by this app's developers.)

- __url__: This is the primary key and the url of the page.
- __host__, __path__, __port__, __protocol__, __uriPath__ - Various parts of the crawled url
- __components__ - Which of our components are found in the page content
- __hasWordPressContent__ - Whether Wordpress files were detected on the page.
- __contentLinks__ - An array of all links found in the content (outside the header/footer) of the page
- __contentImages__ - An array of all images found in the content (outside the header/footer) of the page

Other columns might have been added automatically from what `simplecrawler` records, or they may still be under development.
