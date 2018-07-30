'use strict';

function rejectAsk( path ) {
  // Reject 'askcfpb' urls
  if ( path.indexOf( 'askcfpb' ) > -1 ) {
    return true;
  }
  // Reject 'slug' urls
  if ( path.indexOf( 'ask-cfpb' ) > -1 && path.indexOf( 'slug' ) > -1 ) {
    return true;
  }
  return false;
}

function rejectEregs( path ) {
  // Check if this is a an eregs URL
  if ( path.indexOf( 'eregulations' ) === -1 ) {
    return false;
  }
  // Check if it has a '-' or its directory depth is more than 1
  if ( path.indexOf( '-' ) > -1 || path.match( /\//gi ).length > 2 ) {
    return true
  }
  return false;
}

function sitemapCheck( path ) {
  if ( path.match( /(\/external-site\/)/ ) ) {
    return false;
  } else if ( path.indexOf( 'page=' ) > -1 ) {
    return false;
  } else if ( rejectEregs( path ) ) {
    return false;
  } else if ( rejectAsk( path ) ) {
    return false;
  }

  return true;
}

module.exports = sitemapCheck;