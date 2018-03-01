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

const crawlerOptions = {
  URL: 'https://www.consumerfinance.gov/'
}

var queueCheck = 100;

var crawler = createCrawler( crawlerOptions );

/**
 * Initiates the environment for the crawler.
 */
function init() {
  mkdirRecursive( './cache' );
}

// FOR DEVELOPMENT ONLY: 
// Disable discovery during development
// crawler.discoverResources = false;

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
// crawler.queueURL( 'https://www.consumerfinance.gov/es/', undefined, true);
// crawler.queueURL( 'https://www.consumerfinance.gov/paying-for-college/', undefined, true );
// crawler.queueURL( 'https://www.consumerfinance.gov/paying-for-college/choose-a-student-loan/', undefined, true );
// crawler.queueURL( 'https://www.consumerfinance.gov/about-us/blog/', undefined, true);
// crawler.queueURL( 'https://www.consumerfinance.gov/data-research/', undefined, true);
// crawler.queueURL( 'https://www.consumerfinance.gov/ask-cfpb/', undefined, true);
// crawler.queueURL( 'https://www.consumerfinance.gov/owning-a-home/loan-options/', undefined, true );

// on fetchcomplete, write the HTML content
crawler.on( 'fetchcomplete', ( queueItem, responseBuffer, response ) => {
  var path = './cache' + queueItem.uriPath;
  
  mkdirRecursive( path );
  fs.writeFile( path + 'index.html', responseBuffer, 'ascii', ( err ) => {} );

} );

// Testing frosting
crawler.on( 'fetchcomplete', ( queueItem, responseBuffer, response ) => {

  // FOR DEVELOPMENT PURPOSES ONLY:
  // crawler.queue.countItems({ fetched: true }, function(error, count) {
  //   if ( error ) {
  //     throw error;
  //   }
  //   if ( count >= 20 ) {
  //     console.log( 'FREEZING THE QUEUE!' );
  //     crawler.queue.freeze( 'mysavedqueue.json', () => {
  //       process.exit();
  //     } );
  //   }
  // });

  crawler.queue.countItems({ fetched: true }, function( err, count ) {
    if ( err ) {
        throw err;
    }

    if ( count > queueCheck ) {
      console.log( 'FREEZING THE QUEUE!' );
      crawler.queue.freeze( 'mysavedqueue.json', () => {
        
      } );
      queueCheck += 100;
    }

  } );

} );

crawler.on( 'complete', () => {
  var pageQuery = 0;
  var conFin = 0;
  var wp = 0;
  for ( var key in crawler.queue ) {
    var item = crawler.queue[key];
    if ( typeof item.path !== 'undefined' && item.path.indexOf( 'page=') !== -1 ) {
      pageQuery++;
      console.log( 'pageQuery ' + pageQuery + ': ' + item.path );
    }
    if ( typeof item.host !== 'undefined' && item.host === 'www.consumerfinance.gov' ) {
      conFin++;
      console.log( 'conFin ' + conFin + ': ' + item.path );
    }
    if ( typeof item.hasWordPressContent !== 'undefined' && item.path.hasWordPressContent == true ) {
      wp++;
      console.log( 'wp ' + wp + ': ' + item.path );
    }
  }

  console.log( 'pageQuery Count Total: ' + pageQuery );
  console.log( 'conFin Count Total: ' + conFin );
  console.log( 'wp Count Total: ' + wp );    

  crawler.queue.freeze( 'mysavedqueue.json', () => {
    
  } );

} );

// Initiate the stuff the crawler needs to work
init();

crawler.queue.defrost( './mysavedqueue.json', () => {
  crawler.queue.countItems( { fetched: true }, function( err, count ) {
    console.log( count );
    if ( count > 0 ) {
      queueCheck = count + 100;
    }
    console.log( queueCheck );
  } );
  
  crawler.start();
} );


// Start the crawler
// crawler.start();


