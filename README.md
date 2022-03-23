
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


## Adding custom search parameters

A primary use of this app is to create custom crawls and view the results. The steps are pretty easy:

### 1. Add the database fields that will store the data to `database-model.js`.

The database will need to know about additional columns when it is created, so we add this to the model in `src/models/database-model.js`. In `databaseModel.databaseStructure`, we simply add parameters. For instance, say we want to add a new text column `foo` that indicates whether the HTML class `"foo"` was found in the page body. We can add it to the end of the database schema object as such:

```
  databaseStructure: {
    url: 'text primary key', host: 'text', path: 'text', port: 'text',
    protocol: 'text', uriPath: 'text', stateData: 'text', components: 'text',
    hasWordPressContent: 'text', contentLinks: 'text', contentImages: 'text',
    metaTags: 'text', title: 'text', pageHash: 'text', sitemap: 'text',
    timestamp: 'text', foo: 'text'
  },
```

### 2. Add a handler method to `page-model.js`

Now we need to tell the app what to store into that new database column. We do this by adding a private method to `pageModel` in `src/models/page-model.js`. We can use the variable `responseBuffer` to get the content of the HTTP response to our request (turning it into a string with the `toString()` method:

```
let pageModel = {
  ...
  
  // Parse page for classname "foo"
  _findFoo: function( responseBuffer ) {
    const pageHMTL = responseBuffer.toString();
    return responseBuffer.indexOf( 'foo' ) > -1;
  },
  
  ...
```

Unfortunately, parsing HTML as a string instead of a DOM object or the like is not ideal, so we can alternatively use the `cheerio` pacakage to enable some jQuery-like functions and methods. In this case, `$` represents a cheerio Object representation of the HTML response. For instance:

```
let pageModel = {
  ...
  
  // Parse page for classname "foo"
  _findFoo: function( $ ) {
    return $( 'body' ).find( '.foo' ).text();
  },
  
  ...
```

More information about cheerio can be found at https://cheerio.js.org/.

### 3. Add your handler method to the `createPageObject` Object in `page-model.js`

Now we need `createPageObject` to call your method. In this step, it's important that you assign the returned value of your method to the same column name that you used in the `database-model.js` code. This will assure that it gets into the database. So, if we used `foo` in the `databaseStructure` property, we need to add `foo` to the `pageObj` Object with the data we want. For example:

```
      // Find foo
      pageObj.foo = this._findFoo( responseBuffer );
```

or, when using cheerio:

```
      // Find foo
      pageObj.foo = this._findFoo( $ );
```

### 4. Run the app!

Now you can run the app. You can test that it is working by querying the database to see if your data is being populated as it runs.



### Additional notes

1. Most of the time, text is the only data type we really need for these simple crawls, but other types of values can be useful. Consult sqlite documentation for more information on types.

