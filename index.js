'use strict';

// Description
//   A script to index some useful cf.gov things
//
// Configuration:
//   CFPB_INDEXER_SECRET_KEY - Secret key that must be provided to start indexing
//   CFPB_INDEXER_GOOGLE_CLIENT_EMAIL - Google API service account email address.
//   CFPB_INDEXER_GOOGLE_PRIVATE_KEY - Google API sercice account private key.
//   CFPB_INDEXER_DEFAULT_SITE - Default site to index.
//   CFPB_INDEXER_GITHUB_TOKEN - GitHub account token.
//   CFPB_INDEXER_GITHUB_URL - URL for the GitHub
//
// Commands:
//   ????? - start indexing consumerfinance.gov.
// 
// Author:
//   CFPB

const createCrawler = require( './src/crawler' ).create;
const createGoogleSheets = require( './src/google-sheets' ).create;
const GitHub = require( './src/github' );
const isURL = require( 'is-url' );
const SimpleCrawler = require( 'simplecrawler' );
const fs = require( 'fs' );
const mkdirRecursive = require( './src/utils/mkdirRecursive' );

var beautify = require( 'json-beautify' );

const CFPB_INDEX = 'cfpb-index';
const CFPB_INDEX_REPORT_URL = 'cfpb-index-report-url';

const contentRegex = /\.(html|php|htm)$/i;
var sitemap = '<?xml version="1.0" encoding="utf-8" standalone="yes" ?>';
    sitemap += '\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

const crawlerOptions = {
  URL: 'https://www.consumerfinance.gov/'
}

var crawler = createCrawler( crawlerOptions );

/**
 * Initiates the environment for the crawler.
 */
function init() {
  mkdirRecursive( './cache' );
}

// FOR DEVELOPMENT ONLY: 
// Disable discovery during development
crawler.discoverResources = false;

// FOR DEVELOPMENT ONLY: Emit all events!
var originalEmit = crawler.emit;
crawler.emit = function(evtName, queueItem) {
    crawler.queue.countItems({ fetched: true }, function(err, completeCount) {
        if (err) {
            throw err;
        }

        crawler.queue.getLength(function(err, length) {
            if (err) {
                throw err;
            }

            console.log("fetched %d of %d — %d open requests, %d open listeners",
                completeCount,
                length,
                crawler._openRequests.length,
                crawler._openListeners);
        });
    });

    console.log(evtName, queueItem ? queueItem.url ? queueItem.url : queueItem : null);
    originalEmit.apply(crawler, arguments);
};


// FOR DEVELOPMENT ONLY: 
// Create a queue (for development purposes)
crawler.queueURL( 'https://www.consumerfinance.gov/es/', undefined, true);
crawler.queueURL( 'https://www.consumerfinance.gov/paying-for-college/', undefined, true );
crawler.queueURL( 'https://www.consumerfinance.gov/paying-for-college/choose-a-student-loan/', undefined, true );
crawler.queueURL( 'https://www.consumerfinance.gov/blog/', undefined, true);
crawler.queueURL( 'https://www.consumerfinance.gov/data-research/', undefined, true);
crawler.queueURL( 'https://www.consumerfinance.gov/ask-cfpb/', undefined, true);

// on fetchcomplete, write the HTML content
crawler.on( 'fetchcomplete', ( queueItem, responseBuffer, response ) => {
  var path = './cache' + queueItem.uriPath;
  
  mkdirRecursive( path );
  fs.writeFile( path + 'index.html', responseBuffer, 'ascii', ( err ) => {} );

  // add to the sitemap
  sitemap += '\n  <url>';
  sitemap += '\n    <loc>' + queueItem.url + '</loc>';
  sitemap += '\n  </url>'

} );

crawler.on( 'complete', () => {
  sitemap += '\n</sitemap>';
  mkdirRecursive( './sitemap' );
  fs.writeFile( './sitemap/sitemap.xml', sitemap, 'ascii', ( err ) => { } );
  
} );

// Initiate the stuff the crawler needs to work
init();

// Start the crawler
crawler.start();


