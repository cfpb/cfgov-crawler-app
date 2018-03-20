'use strict';

const fs = require( 'fs' );

function fileExists( filepath ){
  let bool = true;
  try {
    fs.accessSync( filepath, fs.F_OK );
  } catch( e ) {
    bool = false;
  }
  return bool;
}

module.exports = fileExists;