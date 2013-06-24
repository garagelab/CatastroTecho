/**
 * Datasources/Database - Base de datos del proyecto "Catastro Techo".
 *
 *
 */

// Google API key for project 'TechoCatastro'. User data access is not need therefor.
var API_KEY = 'AIzaSyCQ3Kiec1Vz_flwDFJxqahORuIES0WVxmw';

// Google API V1.0 URL Endpoint
var urlEndpoint = 'https://www.googleapis.com/fusiontables/v1/query';

// Datasources - fusion tablas de google
var datasources = {
	table : []
};

/////////////////////////////////////////////////////////////////////
// TABLE SECTION BEGIN >>>
// ADD NEW TABLES HERE...
// AÑADIR NUEVAS TABLAS ACÁ... 
/////////////////////////////////////////////////////////////////////
datasources.table['buenos_aires_2013'] = { 
	name:	'Buenos Aires',
	year:	'2013',
	id:		'1_fEVSZmIaCJzDQoOgTY7pIcjBLng1MFOoeeTtYY',
	type:	'fusion table'
};

/////////////////////////////////////////////////////////////////////
// <<< END OF TABLE SECTION
/////////////////////////////////////////////////////////////////////


// Interfaces

/**
 * Get data from underlying fusion table.
 *
 * Hint: Google visualization api has a limit of 500 rows here!
 * Therefore we cannot use it. A so-called 'trusted tester' google-user
 * would be possible but we use another workaround - the method of
 * a direct 'Ajax' call - and 'bypassing' this restriction.
 *
 * @return {json-p} Query result.
 */
function getFusionTableData(query, callback) {	
	// Prepare query string.
	var encodedQuery = encodeURIComponent(query);

    // Construct the URL.
    var url = [urlEndpoint];
    url.push('?sql=' + encodedQuery);
    url.push('&key=' + API_KEY);
    url.push('&callback=?');

	// Send the JSONP request using jQuery.
  	$.ajax( {
    	type: "GET",
    	url: url.join(''),
    	dataType: 'jsonp',
		contentType: "application/json",
    	success: function(response) { callback(response); },
    	error: function () { 
    		console.error("getFusionTableData(): Error in json-p call. Query was " + url);
    	}
  	});
}
