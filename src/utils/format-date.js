'use strict';

// Format date for timestamping entries
function formatDate() {
  let d = new Date();
  function twoChars( string ) {
    if ( string.length < 2 ) {
      string = '0' + string;
    }
    return string;
  }

  let year = d.getFullYear();
  let month = twoChars( ( d.getMonth() + 1 ).toString() );
  let date = twoChars( ( d.getDate() ).toString() );

  let hours = twoChars( d.getHours().toString() );
  let minutes = twoChars( d.getMinutes().toString() );
  let seconds = twoChars( d.getSeconds().toString() );

  return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds;
};

module.exports = formatDate;