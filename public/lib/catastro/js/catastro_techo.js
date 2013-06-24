/**
 * Project:		Catastro Techo
 *
 * Subject:		Geographic Information System
 * Objective:	Establish an interactive, web-based platform with information
 *				and analysis for the comprehensive description of the geometric
 *				location, structures, people and infrastructure of all the poor
 *				districts of the Buenos Aires province.
 * Code type:	Business coding
 * Copyright:	2012 - 2013 Techo http://www.techo.org/ All Rights Reserved.
 * @author		Andreas Hempfling <andreas.hempfling@gmail.com>
 *
 */

/////////////////////////////////////////////////////////////////////
// Init all necessary stuff.
/////////////////////////////////////////////////////////////////////

// Preventing older browser problems with "console" in source code.
// Lastly older browsers will crash when using console.log or something similar.
// This checks to see if the console is present, and if not it sets it to an 
// object with a blank function called in names array. This way window.console.*
// is never truely undefined.
if (!window.console) { 
 	var names = [
 					"log", "debug", "info", "warn", "error", "assert", "dir", 
 					"dirxml", "group", "groupEnd", "time", "timeEnd", "count", 
 					"trace", "profile", "profileEnd" 
 				];
 	window.console = {};
 	for (var i=0, len=names.length; i<len; ++i) {
 		window.console[names[i]] = function(){};
 	}
} 

// Load the Visualization API library and the chart libraries using 'Spanish' locale.
google.load('visualization', '1', { 'packages' : ['table', 'corechart'], 'language': 'es' } );


var dataSourceUrl = 'http://www.google.com/fusiontables/gvizdata?tq=';
//var queryUrlHead = 'https://fusiontables.googleusercontent.com/fusiontables/api/query?sql=';

//var dataSourceUrl = 'https://www.googleapis.com/fusiontables/v1/query?key=' + API_KEY + '&sql=';

// Numeric ID - Notice: Table have to be 'public'.
/// Encrypted ID
//var dataSourceEncryptedID ='1_fEVSZmIaCJzDQoOgTY7pIcjBLng1MFOoeeTtYY';

//     queryText = encodeURIComponent("SELECT * FROM " + dataSourceEncryptedID + where_clause);
//     query = new google.visualization.Query(dataSourceUrl + queryText);

var dataSourceEncryptedID = datasources.table['buenos_aires_2013'].id;

// Query components
var query;
var queryText;
var queryUrl = ['https://www.googleapis.com/fusiontables/v1/query'];
var queryEncoded;

var queryUrlHead = 'https://www.googleapis.com/fusiontables/v1/query?key=' + API_KEY + '&sql=';
var queryUrlTail = '&jsonCallback=?'; // ? could be a function name

// Filter criteria
var filter = {
  criteria : []
};

filter.criteria['region'] = { value: 'metropolitania' };
filter.criteria['provincia'] = { value: 'buenos aires' };
filter.criteria['municipio'] = { value: null };
filter.criteria['partido'] = { value: null };
filter.criteria['localidad'] = { value: null };
filter.criteria['barrio'] = { value: null };
filter.criteria['selected_area'] = { value: null };

var escala = {
  // region metropolitana
  metropolitana: 1,
  // municipio
  municipio: 2,
  // localidad
  localidad: 3,
  // barrio
  barrio: 4
};

var shortcut_municipio = "Mpio.";
var shortcut_localidad = "Loc.";

var where_clause;
var where_clause_area_map;
var barrio;
var map;
var initLayer;
var markers = [];
var techo_marker = "../images/marker_techo1.png";
var techo_marker_shadow = "../images/shadow_blue_marker.png";

var buenos_aires_lat_lng = new google.maps.LatLng(-34.6084, -58.3732);
var barrios_bsas = new google.maps.LatLng(-34.672747,-58.41774);

var locationColumn = "Poligono";

var partidoFilter = false;
var barrioFilter = false;

// Selected barrio (is selected) in fusion table
var barrio_issel = {
  attr : []
};
barrio_issel.attr['rowid'] = { value: ' ' };
barrio_issel.attr['nombre'] = { value: ' ' };
barrio_issel.attr['nombre2'] = { value: ' ' };
barrio_issel.attr['localidad'] = { value: ' ' };
barrio_issel.attr['partido'] = { value: ' ' };

var tmp_container;

/////////////////////////////////////////////////////////////////////
//  Initializers for web pages.
/////////////////////////////////////////////////////////////////////

/**
 * Initialize index.html page when it is called.
 * by function setOnLoadCallback() at the page.
 */
function initIndexPage() {
	initMapIndexPage();
}

/**
 * Initialize map page (overview) at index page for first use.
 *
 */
function initMapIndexPage() {
	var argentina = new google.maps.LatLng(-38.416097, -63.616672);

  	map = new google.maps.Map(document.getElementById('map_index_page'), {
    	center: argentina,
    	zoom: 4,
    	minZoom: 2,
    	mapTypeId: google.maps.MapTypeId.ROADMAP,
    	streetViewControl: false
  	} );

  	// Add a Circle overlay to the map.
  	var circle = new google.maps.Circle({
    	//center: buenos_aires_lat_lng,
    	map: map,
    	fillColor: '#0000FF',
    	fillOpacity: 0.5,
    	strokeColor: '#1e90ff',
    	strokeOpacity: 0.5,
    	strokeWeight: 1,
    	//radius: 1836.55489862987
    	radius: 200000 // 200 km
  	});
  	//map.fitBounds(circle.getBounds());

  	// google.maps.event.addListener(map, 'zoom_changed', function() {
  	//   setTimeout(moveToBuenosAires, 3000);
  	// });
  
  	// var marker = new google.maps.Marker({
  	//     position: buenos_aires_lat_lng,
  	//     map: map,
  	//     title:"Conoce información sobre cada una de las villas y asentamientos relevados."
  	// });
  
  	// Create a marker.
  	var marker = placeMarker(map, buenos_aires_lat_lng, techo_marker, techo_marker_shadow);
  	marker.setTitle('Buenos Aires');

  	// Bind marker to cirlce.
  	// We're binding the Circle's center to the Marker's position.
  	circle.bindTo('center', marker, 'position');

  	google.maps.event.addListener(marker, 'click', function() {
    	// Show map page of Buenos Aires...
    	window.location.href = "/content/mapa-de-barrios";
  	});

  	google.maps.event.addListener(circle, 'click', function() {
    	// Show map page of Buenos Aires...
    	window.location.href = "/content/mapa-de-barrios";
  	});
}

function moveToBuenosAires() {
	map.setCenter(buenos_aires_lat_lng);
}

/**
 * Initialize map page with barrios for first use.
 *
 */
function initMapBarriosPage() {    
  	map = new google.maps.Map(document.getElementById('map_canvas'), {
    	center: barrios_bsas,
    	zoom: 10,
    	minZoom: 9,
    	mapTypeId: google.maps.MapTypeId.ROADMAP,
    	streetViewControl: false
  	} );

  	initMapLayer();
  	initLayer.setMap(map);

  	// Show metropolitana data (all data).
  	setViewToMetropolitana();

  	// Init 'Barrio' search field.
  	initSearchFieldBarrio();

  	// Init 'Partido' search field.
  	initSearchFieldPartido();
}

/**
 * Initialize table page.
 *
 */
function initTableBarriosPage() {
	getFusionTableData('select * from ' + dataSourceEncryptedID, dataTableHandler);
}

/////////////////////////////////////////////////////////////////////
// User interactions 
/////////////////////////////////////////////////////////////////////

function setViewToMetropolitana() {
  //
  // Set/reset to Metropolitana data (all).
  //
  // Init numbers of villas and families.
  filter.criteria['region'] = { value: 'metropolitania'};
  filter.criteria['provincia'] = { value: 'buenos aires'};

  queryText = "SELECT sum('NRO DE FLIAS') as familias, count('NOMBRE DEL BARRIO') FROM " + dataSourceEncryptedID;
  getFamilyNumber(escala["metropolitana"], queryText);

  drawSupplyCharts(escala["metropolitana"], "map_page");
}

function setViewToPartido() {
  //
  // Set/reset to partido/localidad data.
  //
  // Clear old barrio data first.
  removeAllBarrioSelections();
  // Set partido data.
  var result = findPartidoData();
}

function setViewToBarrio() {
  //
  // Set/reset to barrio data.
  //
  var result = findBarrioData();
}

function initMapLayer() {
  //
  // Updating Fusion Table Layer.
  //
  
  initLayer = new google.maps.FusionTablesLayer( {
    suppressInfoWindows: true, // Because we have a separate listener for that.
    query: {
      select: 'Poligon',
      from: dataSourceEncryptedID
    },
    styles: [ {
      polygonOptions: {
        fillColor: "#ff0000",     // Color del plano - #ff0000 rojo de Google.
        fillOpacity: 0.5,         // Opacidad del plano
        strokeColor: "#000000",   // Color del margen
        strokeOpacity: 0.5,       // Opacidad del margen
        strokeWeight: 1           // Grosor del margen
      }
    } ]
  } );

  // A listener to the initLayer that constructs a map marker and
  // afterwards shows barrio data for information.
  google.maps.event.addListener(initLayer, 'click', function(e) {
    placeMarker(map, e.latLng, techo_marker, techo_marker_shadow);
    showBarrioInfo(e);
    drawSupplyCharts(escala["barrio"], "map_page");
  } );
}

function getLatLngFocusFromPolygonBoundary(polygonBoundary) {
	//
  	// Evaluate focus (midpoint) from a given polygon boundary.
  	//
  	var result;

  	var latlngArr = [];
  	var lat_lng, lat, lng;
  	var comma1, comma2;

  	// Extract polygon coordinates from xml structure.
  	polygonBoundary = $(polygonBoundary).find("coordinates").text();
  	polygonBoundary = polygonBoundary.replace(/\\n/g, " ");
  	polygonBoundary = polygonBoundary.trim();

  	// Each pair of coordinates is stored in an array element.
  	latlngArr = polygonBoundary.split(' ');
	
	var bounds = new google.maps.LatLngBounds();
	
	for(var i=0; i<latlngArr.length; i++) {    	
      	comma1 = latlngArr[i].indexOf(',');
      	comma2 = latlngArr[i].lastIndexOf(',');
      	lat = latlngArr[i].substring(0, comma1-1);
      	lng = latlngArr[i].substring(comma1+1);
      	//lng = latlngArr[i].substring(comma1+1, comma2-1);      
      	bounds.extend(new google.maps.LatLng(lat, lng));
    }

	lat_lng = bounds.getCenter();

	// Changes of coordinates lat to lng and vice versa.
  	// Otherwise we get a wrong position here.
	var focus = lat_lng.toString();
  	latlngArr = focus.split(',');
  	lat = latlngArr[1].substring(1, latlngArr[1].indexOf(')')-1);
  	lng = latlngArr[0].substring(latlngArr[0].indexOf('(')+1);

  	result = new google.maps.LatLng(lat, lng);

  	return result;
}

function findPartidoData() {
  //
  // Find Partido/Localidad via text search.
  //
  // Init - alert message box should be closed.
  $(".alert").alert('clos	e');
  var latlngArr = [];
  var lat_lng, lat, lng;
  var comma1, comma2;
  var choice;
  var area_choice;
  var polygonBoundary;

  // Check text search field for manually search first.
  choice = document.getElementById('search_part_txt').value;
	
  // Search field is empty.
  if (!choice) {
    return false;
  }

  if (isEmpty(choice) || isBlank(choice)) {
    return false;
  }

  // Is there an entity in search field?
  if (choice && !isEmpty(choice) && !isBlank(choice)) {
    // Extract parentheses and prepare query.
    if (choice.indexOf("(") >= 0) {
      var exp = "(" + shortcut_municipio + ")";
      var re = new RegExp(exp, 'g');
      if (choice.match(re)) {
        choice = (choice.substring(0, choice.indexOf(exp)-1)).trim();
        where_clause = " WHERE 'PARTIDO' = '" + choice + "'";
        area_choice = 'P';
      }
      else {
        exp = "(" + shortcut_localidad + ")";
        re = new RegExp(exp, 'g');
        if (choice.match(re)) {
          choice = (choice.substring(0, choice.indexOf(exp)-1)).trim();
          where_clause = " WHERE 'LOCALIDAD' = '" + choice + "'";
          area_choice = 'L';
        }
        else {
          where_clause = " WHERE 'PARTIDO' = '" + choice + "'";
          area_choice = 'P';
        }
      }
    }
    else {
      where_clause = " WHERE 'PARTIDO' = '" + choice + "'";
      area_choice = 'P';
    }
    
    queryText = encodeURIComponent("SELECT * FROM " + dataSourceEncryptedID + where_clause);
    query = new google.visualization.Query(dataSourceUrl + queryText);

	query.send(function(response) {
    	var numRows = response.getDataTable().getNumberOfRows();
      	// Partido or Localidad not found in data source.
      	if (!numRows) {
        	var msg = "La selecci&oacute;n " + "'" + choice + "'" + " no se pudo encontrar.";
        	bootstrap_alert.warning(msg);
        	clearThis(document.getElementById("search_part_txt"));
        	return;
      	}

      	if (response.getDataTable().getValue(0, 3) &&
          	!isEmpty(response.getDataTable().getValue(0, 3)) &&
          	!isBlank(response.getDataTable().getValue(0, 3))) {
        	polygonBoundary = response.getDataTable().getValue(0, 3);
        	filter.criteria['partido'] = { value: response.getDataTable().getValue(0, 5) };
        	// Evaluate the focus of a polygon in selected area for center map.
        	if (polygonBoundary) {
          		lat_lng = getLatLngFocusFromPolygonBoundary(polygonBoundary);
        	}
        	else {
          	// set default
          		lat_lng = barrios_bsas;
        	}
        	map.setCenter(lat_lng);
        	map.setZoom(12); // antes era 11
      	}
     
		if (area_choice) {
      		// Set where clause for map and get numbers for info text.
      		where_clause_area_map = null;

      		// Reset barrio info.
      		removeBarrioInfo();
      		filter.criteria['barrio'] = { value: null };

      		switch(area_choice.toUpperCase()) {
        		case 'P':
          			filter.criteria['municipio'] = { value: choice };
          			filter.criteria['partido'] = { value: choice };
          			filter.criteria['selected_area'] = { value: 'municipio' };
          			where_clause_area_map = "'PARTIDO' = " + "'" + choice + "'";
          			queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID + " WHERE " + where_clause_area_map;
          			getFamilyNumber(escala["municipio"], queryText);
          		break;
        	
        		case 'L':
          			filter.criteria['municipio'] = { value: filter.criteria['partido'].value };
          			filter.criteria['localidad'] = { value: choice };
          			filter.criteria['selected_area'] = { value: 'localidad' };
          			where_clause_area_map = "'LOCALIDAD' = " + "'" + choice + "'";
          			queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID + " WHERE " + where_clause_area_map;
          			getFamilyNumber(escala["localidad"], queryText);
          		break;
      		}

      		// Reinit selection for 'Barrio' search field.
      		partidoFilter = true;
      		initSearchFieldBarrio();
			
      		// Reinit layer.
      		initLayer.setOptions( {
        		suppressInfoWindows: true, // Because we have a separate listener for that.
        		query: {
          			select: 'Poligon',
          			from: dataSourceEncryptedID
        		},
        		styles: [ {
          			polygonOptions: {
            			fillColor: "#1e90ff",     // Color del plano - #ff0000 rojo de Google.
            			fillOpacity: 0.5,         // Opacidad del plano
            			strokeColor: "#000000",   // Color del margen
            			strokeOpacity: 0.5,       // Opacidad del margen
            			strokeWeight: 1           // Grosor del margen
          			},
          		where: where_clause_area_map, polygonOptions: { fillColor: "#1e90ff" }
        		} ]
      		} );
      		partidoFilter = true;
    	}
  		
  		if (partidoFilter === true) {
    		drawSupplyCharts(escala["municipio"], "map_page");
  		}
  		else {
    		setViewToMetropolitana();
  		}
    } );

//     if (area_choice) {
//       // Set where clause for map and get numbers for info text.
//       where_clause_area_map = null;
// 
//       // Reset barrio info.
//       removeBarrioInfo();
//       filter.criteria['barrio'] = { value: null };
// 
//       switch(area_choice.toUpperCase()) {
//         case 'P':
//           filter.criteria['municipio'] = { value: choice };
//           filter.criteria['partido'] = { value: choice };
//           filter.criteria['selected_area'] = { value: 'municipio' };
//           where_clause_area_map = "'PARTIDO' = " + "'" + choice + "'";
//           queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID + " WHERE " + where_clause_area_map;
//           getFamilyNumber(escala["municipio"], queryText);
//           break;
//         case 'L':
//           filter.criteria['municipio'] = { value: filter.criteria['partido'].value };
//           filter.criteria['localidad'] = { value: choice };
//           filter.criteria['selected_area'] = { value: 'localidad' };
//           where_clause_area_map = "'LOCALIDAD' = " + "'" + choice + "'";
//           queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID + " WHERE " + where_clause_area_map;
//           getFamilyNumber(escala["localidad"], queryText);
//           break;
//         //default:
//         // not set...
//       }
// 
//       // Reinit selection for 'Barrio' search field.
//       partidoFilter = true;
//       // delete queryText;
//       // queryText = encodeURIComponent(
//       //   "SELECT 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO' " +
//       //   "FROM " + dataSourceEncryptedID +
//       //   " WHERE " + where_clause_area_map +
//       //   " GROUP BY 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO'");
//       // initSearchFieldBarrio(queryText);
//       initSearchFieldBarrio();
// 
//       // Reinit layer.
//       initLayer.setOptions({
//         suppressInfoWindows: true, // Because we have a separate listener for that.
//         query: {
//           select: 'Poligon',
//           from: dataSourceEncryptedID
//         },
//         styles: [ {
//           polygonOptions: {
//             fillColor: "#1e90ff",     // Color del plano - #ff0000 rojo de Google.
//             fillOpacity: 0.5,         // Opacidad del plano
//             strokeColor: "#000000",   // Color del margen
//             strokeOpacity: 0.5,       // Opacidad del margen
//             strokeWeight: 1           // Grosor del margen
//           },
//           where: where_clause_area_map, polygonOptions: { fillColor: "#1e90ff" }
//         } ]
//       } );
//       partidoFilter = true;
//     }

//    return true;
  }
}

/*
 * Find Barrio data via text search.
 *
 */
function findBarrioData() {
	// Init - alert message box should be closed.
  	$(".alert").alert('close');
  	var latlngArr = [];
  	var lat_lng, lat, lng;
  	var comma1, comma2;

  	// Check text search field for manually search first.
  	var barrio = document.getElementById('search_barrio_txt').value;

  	// Is search field empty?
  	if (!barrio) { return false; }
  	if (isEmpty(barrio) || isBlank(barrio)) { return false; }

	// Seems to be we have data to view...
  	if (barrio && !isEmpty(barrio) && !isBlank(barrio)) {
    	// Extract parentheses, if necessary.
    	if (barrio.indexOf("(") >= 0) {
      		barrio = (barrio.substring(0, barrio.indexOf("(")-1)).trim();
    	}
    	queryText = encodeURIComponent("SELECT * FROM " + dataSourceEncryptedID + " WHERE 'NOMBRE DEL BARRIO' = '" + barrio + "'");
    	query = new google.visualization.Query(dataSourceUrl + queryText);

		// Callback
    	query.send( function(response) {
      		var numRows = response.getDataTable().getNumberOfRows();
      		// Barrio not found in data source.
      		if (!numRows) {
        		var msg = "El barrio " + "'" + barrio + "'" + " no se pudo encontrar.";
        		bootstrap_alert.warning(msg);
        		clearThis(document.getElementById("search_barrio_txt"));
        		return;
      		}

      		// Get numbers for info text.
      		filter.criteria['barrio'] = { value: barrio };
      		filter.criteria['selected_area'] = { value: 'barrio' };

      		queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID +
                  		" WHERE 'NOMBRE DEL BARRIO' = '" + barrio + "'";
      		getFamilyNumber(escala["barrio"], queryText);

      		// Extract polygon data from table.
      		var polygonBoundary = response.getDataTable().getValue(0, 3);
      		lat_lng = getLatLngFocusFromPolygonBoundary(polygonBoundary);

      		// e only has four properties, "infoWindowHtml", "latLng", "pixelOffset" and "row".
      		var e = {
        		infoWindowHtml: null,
        		latLng: lat_lng,
        		pixelOffset: null,
        		row : []
      		};

			e.row['NOMBRE DEL BARRIO'] = { value: response.getDataTable().getValue(0, 1) };
      		e.row['OTRO NOMBRE DEL BARRIO'] = { value: response.getDataTable().getValue(0, 2) };
      		e.row['PARTIDO'] = { value: response.getDataTable().getValue(0, 5) };
      		e.row['LOCALIDAD'] = { value: response.getDataTable().getValue(0, 6) };
      		e.row['NRO DE FLIAS'] = { value: response.getDataTable().getValue(0, 10) };
      		e.row['AÑO DE CONFORMACIÓN DEL BARRIO'] = { value: response.getDataTable().getValue(0, 7) };
      		e.row['RED CLOACAL'] = { value: response.getDataTable().getValue(0, 15) };
      		e.row['AGUA'] = { value: response.getDataTable().getValue(0, 16) };
      		e.row['ACCESO A LA ENERGÍA'] = { value: response.getDataTable().getValue(0, 14) };
      		e.row['GAS'] = { value: response.getDataTable().getValue(0, 18) };
      		e.row['DESAGÜES PLUVIALES'] = { value: response.getDataTable().getValue(0, 19) };
      		e.row['ALUMBRADO PÚBLICO'] = { value: response.getDataTable().getValue(0, 20) };
      		e.row['RECOLECCIÓN DE RESIDUOS'] = { value: response.getDataTable().getValue(0, 21) };

      		// Triggering'click'-event listener to display barrio map marker and data.
      		google.maps.event.trigger(initLayer, 'click', e);
      		barrioFilter = true;
    	} );
		return true;
	}
}

function initSearchFieldBarrio() {
  	//
  	// Autocompletition via jQuery for Barrio search field.
  	//
	$('#search_barrio_txt').autocomplete( {
	    //minLength: function() { if (partidoFilter === false) return 2; else return 1; },
		source: function(request, response) {
    		//console.log("request = %s", request.term);

      		if (partidoFilter === false) {
        		var query = "SELECT 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO', 'PARTIDO', 'LOCALIDAD'" +
            		        "FROM " + dataSourceEncryptedID +
                		    " WHERE 'NOMBRE DEL BARRIO' CONTAINS IGNORING CASE '" + request.term + "'" +
// 	                    	" WHERE 'NOMBRE DEL BARRIO' like '%" + request.term + "%'"+
                    		" GROUP BY 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO', 'PARTIDO', 'LOCALIDAD'";
      		}
      		else {
        		var query = "SELECT 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO', 'PARTIDO', 'LOCALIDAD'" +
            		        "FROM " + dataSourceEncryptedID +
                		    " WHERE 'NOMBRE DEL BARRIO' CONTAINS IGNORING CASE '" + request.term + "'" +
//	                      	" WHERE 'NOMBRE DEL BARRIO' like '%" + request.term + "%'"+
                    		" AND " + where_clause_area_map +
                    		" GROUP BY 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO', 'PARTIDO', 'LOCALIDAD'";
      		}
      		
			// Prepare query string.
			var encodedQuery = encodeURIComponent(query);

    		// Construct the URL.
    		var url = [urlEndpoint];
    		url.push('?sql=' + encodedQuery);
    		url.push('&key=' + API_KEY);
    		url.push('&callback=?');

    		$.ajax( {
    			type: "GET",
    			url: url.join(''),
    			dataType: 'jsonp',
				contentType: "application/json",
    			error: function () { 
    				console.error("initSearchFieldBarrio(): Error in json-p call. Query was " + queryUrl);
    			},
        		success: function(data) {
          			var result = $.map(data.rows, function(row) {
          
 						//console.log(row[0].length);
// 						console.log("row = %s", row[0]);
          				
						barrio_issel.attr['nombre'] = { value: row[0] };
            			//console.log("barrio_issel.attr['nombre'] = %s", barrio_issel.attr['nombre'].value);

            			return {
              				// Total query information for barrio.
              				label: row[0] + (row[1] ? ", " + row[1] : "") + (row[2] ? ", " + row[2] : "") + (row[3] ? ", " + row[3] : ""),
              				// and Barrio name only for search/autocomplete.
        					//value: row[0].toLowerCase()
              				value: row[0]
            			};
          			}); // $.map...
          			response (result);
        		} // success...
      		}); // $.ajax...
    	} // source...
	}); // $().autocomplete...
}

function initSearchFieldPartido() {
  //
  // Autocompletition via jQuery for Partido/Localidad search field.
  //
  // Retrieve the unique names of 'municipios' using GROUP BY workaround.
 queryText = encodeURIComponent(
            "SELECT 'PARTIDO', 'LOCALIDAD' " +
            'FROM ' + dataSourceEncryptedID + " GROUP BY 'PARTIDO', 'LOCALIDAD'");
  query = new google.visualization.Query(dataSourceUrl + queryText);

  query.send(function(response) {
    if (response.isError()) {
      alert('initSearchFieldPartido(): Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      return;
    }

    var numRows = response.getDataTable().getNumberOfRows();
    // Create the list of results for display of autocomplete.
    var results = [];
    for(var i=0; i<numRows; i++) {
      // Get 'Municipio' and 'Localidad' too for searching.
      if (response.getDataTable().getValue(i, 1)) {
        results.push(response.getDataTable().getValue(i, 0) + " (" + shortcut_municipio +")");
        results.push(response.getDataTable().getValue(i, 1) + " (" + shortcut_localidad +")");

      }
      else {
        results.push(response.getDataTable().getValue(i, 0) + " (" + shortcut_municipio +")");
      }
    }
    // Strip all duplicates elements from array away.
    var unique_results = results.unique();

    // Use the results to create the autocomplete options.
    $('#search_part_txt').autocomplete( {
      source: unique_results,
      minLength: 2,
//      maxHeight: 100,
      autoFill: true,
      zIndex: 4000
    } );
  } );
}

function removeAllPartidoSelections() {
  //
  // Remove all selection criterias from objects.
  // Returns to starting position.
  //

  partidoFilter = false;

  deleteOverlays();
  initLayer.setMap(null);
  delete initLayer;
  initMapLayer();
  initLayer.setMap(map);
  map.setCenter(barrios_bsas);
  map.setZoom(10);
  delete queryText;

  //removeBarrioInfo();
  //initSearchFieldBarrio();
  removeAllBarrioSelections();

  initSearchFieldPartido();
  clearThis(document.getElementById('search_part_txt'));

  // Remove filter.
  filter.criteria['municipio'] = { value: null };
  filter.criteria['partido'] = { value: null };
  filter.criteria['localidad'] = { value: null };
  if (filter.criteria['selected_area'].value != 'barrio') {
    filter.criteria['selected_area'] = { value: null };
  }

  // Show metropolitana data (all data).
  setViewToMetropolitana();
}

function removeAllBarrioSelections() {
  //
  // Remove all selection criterias from objects.
  // Returns to starting position.
  //
  
  barrioFilter = false;

  deleteOverlays();

  if (partidoFilter === false) {
    map.setCenter(barrios_bsas);
    map.setZoom(10);
  }

  removeBarrioInfo();

  initSearchFieldBarrio();
  clearThis(document.getElementById('search_barrio_txt'));

  // Remove filter.
  filter.criteria['barrio'] = { value: null };
  if (filter.criteria['selected_area'].value == 'barrio') {
    filter.criteria['selected_area'] = { value: null };
  }
}

/**
 * Callback for filling data table.
 *
 * Currently, a jQuery table is used with a 'dataTables' extension.
 * For details see: http://www.datatables.net/index
 */
function dataTableHandler(response) {
	// get columns and rows
  	var cols = response.columns;
  	var rows = response.rows;
  
  $(document).ready(function() {
    var oTable = $('#table_container').dataTable( {
      //
      // Positions of various controls end elements.

      "sDom": 'T<"clear">lfip<"clear">rtS<"clear">ip<"clear">',
      //
      // Menu buttons
      "oTableTools": {
        "sSwfPath": "/lib/DataTables/extras/TableTools/media/swf/copy_csv_xls_pdf.swf",
        "aButtons": [
          // {
          //   "sExtends": "copy",
          //   "sButtonText": "Copiar al clipboard"
          // },
          {
            "sExtends": "csv",
            "sButtonText": "Guardar como CSV archivo",
            "sFileName": "techo_catastro_argentina.csv",
            "sFieldSeperator": ";"
          }
        ]
      },
      //
      // Translations
      "oLanguage": {
        "sLengthMenu": "Mostrar _MENU_ registros por página",
        "sZeroRecords": "No he encontrado nada - lo siento",
        "sInfo": "Mostrando _START_ a _END_ de _TOTAL_ registros",
        "sInfoEmpty": "Mostrando 0 a 0 de 0 registros",
        "sInfoFiltered": "(filtrado de los registros totales _MAX_)",
        "sSearch": "Búsqueda:",
        "oPaginate": {
          "sFirst": "&Lt;",
          //"sFirst": "primero",
          "sPrevious": "&lt;",
          //"sPrevious": "anterior",
          "sNext": "&gt;",
          //"sNext": "próximo",
          "sLast": "&Gt;"
          //"sLast": "último"
        }
      },
      // Enable jQuery UI ThemeRoller support.
      //"bJQueryUI": true,
      //
      // DataTables features different built-in pagination interaction
      // methods which present different page controls to the end user.
      "sPaginationType": "full_numbers",
      //
      // Enable or disable automatic column width calculation.
      "bAutoWidth": false,
      //
      // Enable or disable the display of a 'processing' indicator
      // when the table is being processed.
      "bProcessing": true,
      //
      // Enable horizontal scrolling.
      "sScrollX": "100%",
      //
      // This property can be used to force a DataTable to use more
      // width than it might otherwise do when x-scrolling is enabled.
      //"sScrollXInner": "150%",
      //
      // Deferred rendering can provide DataTables with a huge speed
      // boost when you are using an Ajax or JS data source for the
      // table. This option, when set to true, will cause DataTables
      // to defer the creation of the table elements for each row until
      // they are needed for a draw - saving a significant amount of time.
      "bDeferRender": true,
      //
      // Changing the Show XXXX items per page drop-down - by default,
      // in the drop-down list are placed 10, 25, 50, and 100 items.
      "aLengthMenu": [[10, 15, 25, 50, 75, 100, 125, 150], [10, 15, 25, 50, 75, 100, 125, 150]],
      //
      // Define initial pagination settings
      "iDisplayLength": 15,
      "iDisplayStart": 0,
      //
      // Default sorting for 1st view.
      "aaSorting": [[ 1, "asc" ]],
      //
      // Table columns
      "aoColumnDefs": [
        { "bVisible": false, "sTitle": "CÓDIGO", "aTargets": [0] },
        { "bVisible": true, "sTitle": "BARRIO", "aTargets": [1] },
        { "bVisible": true, "sTitle": "OTRO DENOMINACI&Oacute;N", "aTargets": [2] },
        { "bVisible": false, "aTargets": [3] },
        { "bVisible": false, "aTargets": [4] },
        { "bVisible": true, "sTitle": cols[5], "aTargets": [5] },
        { "bVisible": true, "sTitle": cols[6], "aTargets": [6] },
        { "bVisible": true, "sTitle": cols[7], "aTargets": [7] },
        { "bVisible": true, "sTitle": cols[8], "aTargets": [8] },
        { "bVisible": true, "sTitle": cols[9], "aTargets": [9] },
        { "bVisible": true, "sTitle": cols[10], "aTargets": [10] },
        { "bVisible": true, "sTitle": cols[11], "aTargets": [11] },
        { "bVisible": true, "sTitle": cols[12], "aTargets": [12] },
        { "bVisible": true, "sTitle": cols[13], "aTargets": [13] },
        { "bVisible": true, "sTitle": cols[14], "aTargets": [14] },
        { "bVisible": true, "sTitle": cols[15], "aTargets": [15] },
        { "bVisible": true, "sTitle": cols[16], "aTargets": [16] },
        { "bVisible": true, "sTitle": cols[17], "aTargets": [17] },
        { "bVisible": true, "sTitle": cols[18], "aTargets": [18] },
        { "bVisible": true, "sTitle": cols[19], "aTargets": [19] },
        { "bVisible": true, "sTitle": cols[20], "aTargets": [20] },
        { "bVisible": true, "sTitle": cols[21], "aTargets": [21] },
        { "bVisible": true, "sTitle": cols[22], "aTargets": [22] },
        { "bVisible": true, "sTitle": cols[23], "aTargets": [23] },
        { "bVisible": true, "sTitle": cols[24], "aTargets": [24] },
        { "bVisible": true, "sTitle": cols[25], "aTargets": [25] },
        { "bVisible": true, "sTitle": cols[26], "aTargets": [26] },
        { "bVisible": true, "sTitle": cols[27], "aTargets": [27] }
      ],
      //
      // Table rows
      "aaData": rows,
      //
      // Setting 1st column to a fixed position.
      "oColReorder": {
        "iFixedColumns": 1
      }

    } ); // end dataTable()

    // Fixed column get an absolute width in pixels.
    new FixedColumns(oTable, {
    	"iLeftColumns": 2,
      	"iLeftWidth": 210 // 180
    } );
    
    // This function will make DataTables recalculate the column sizes.
    // This can be useful when the width of the table's parent element
    // changes (for example a window resize).
    // $(window).bind('resize', function () {
    //   oTable.fnAdjustColumnSizing();
    // } );

  } ); // end ready()
}

function removePartidoInfo() {
  //
  // Remove all dependent texts of these from HTML-Objects.
  //
  var missing = "-";
}

function removeBarrioInfo() {
  //
  // Remove all dependent texts of these from HTML-Objects.
  //
  var missing = "-";

  var barrio_id = document.getElementById('barrio_id');
  barrio_id.innerHTML = " ";

  var other_name_barrio_id = document.getElementById('other_name_barrio_id');
  other_name_barrio_id.innerHTML = missing;

  var partido_id = document.getElementById('partido_id');
  partido_id.innerHTML = missing;

  var localidad_id = document.getElementById('localidad_id');
  localidad_id.innerHTML = missing;

  var families_id = document.getElementById('families_id');
  families_id.innerHTML = missing;

  var start_year_id = document.getElementById('start_year_id');
  start_year_id.innerHTML = missing;

  var sewage_id = document.getElementById('sewage_id');
  sewage_id.innerHTML = missing;

  var water_id = document.getElementById('water_id');
  water_id.innerHTML = missing;

  var electrical_id = document.getElementById('electrical_id');
  electrical_id.innerHTML = missing;

  var gas_id = document.getElementById('gas_id');
  gas_id.innerHTML = missing;

  var drains_id = document.getElementById('drains_id');
  drains_id.innerHTML = missing;

  var street_lighting_id = document.getElementById('street_lighting_id');
  street_lighting_id.innerHTML = missing;

  var waste_collection_id = document.getElementById('waste_collection_id');
  waste_collection_id.innerHTML = missing;
}

function showBarrioInfo(e) {
  //
  // Shows detailed information about a barrio.
  //
  var missing = "-";
  var no_info = "?";

  var barrio = e.row['NOMBRE DEL BARRIO'].value;
  var other_name_barrio = e.row['OTRO NOMBRE DEL BARRIO'].value;
  var partido = e.row['PARTIDO'].value;
  var localidad = e.row['LOCALIDAD'].value;
  var families = e.row['NRO DE FLIAS'].value;
  var start_year = e.row['AÑO DE CONFORMACIÓN DEL BARRIO'].value;
  var sewage = e.row['RED CLOACAL'].value;
  var water = e.row['AGUA'].value;
  var electrical = e.row['ACCESO A LA ENERGÍA'].value;
  var gas = e.row['GAS'].value;
  var drains = e.row['DESAGÜES PLUVIALES'].value;
  var street_lighting = e.row['ALUMBRADO PÚBLICO'].value;
  var waste_collection = e.row['RECOLECCIÓN DE RESIDUOS'].value;

  var barrio_id = document.getElementById('barrio_id');
  if (barrio)
    barrio_id.innerHTML = barrio;
  else
    barrio_id.innerHTML = missing;

  var other_name_barrio_id = document.getElementById('other_name_barrio_id');
  if (other_name_barrio)
    other_name_barrio_id.innerHTML = other_name_barrio;
  else
    other_name_barrio_id.innerHTML = missing;

  var partido_id = document.getElementById('partido_id');
  if (partido)
    partido_id.innerHTML = partido;
  else
    partido_id.innerHTML = missing;

  var localidad_id = document.getElementById('localidad_id');
  if (localidad)
    localidad_id.innerHTML = localidad;
  else
    localidad_id.innerHTML = missing;

  var families_id = document.getElementById('families_id');
  if (families)
    families_id.innerHTML = parseInt(families, 10).format();
  else
    families_id.innerHTML = missing;

  var start_year_id = document.getElementById('start_year_id');
  if (start_year)
    start_year_id.innerHTML = start_year;
  else
      start_year_id.innerHTML = missing;

  var sewage_id = document.getElementById('sewage_id');
  if (sewage)
    sewage_id.innerHTML = sewage;
  else
    sewage_id.innerHTML = missing;

  var water_id = document.getElementById('water_id');
  if (water)
    water_id.innerHTML = water;
  else
    water_id.innerHTML = missing;

  var electrical_id = document.getElementById('electrical_id');
  if (electrical)
    electrical_id.innerHTML = electrical;
  else
    electrical_id.innerHTML = missing;

  var gas_id = document.getElementById('gas_id');
  if (gas)
    gas_id.innerHTML = gas;
  else
    gas_id.innerHTML = missing;

  var drains_id = document.getElementById('drains_id');
  if (drains) {
    if (drains.toUpperCase() == 'SI')
      drains = true;
    else
      drains = false;
    drains_id.innerHTML = setYesNoHTMLMarker(drains);
  }
  else {
    drains_id.innerHTML = no_info;
  }

  var street_lighting_id = document.getElementById('street_lighting_id');
  if (street_lighting) {
    if (street_lighting.toUpperCase() == 'SI')
      street_lighting = true;
    else
      street_lighting = false;
    street_lighting_id.innerHTML = setYesNoHTMLMarker(street_lighting);
  }
  else {
    street_lighting_id.innerHTML = no_info;
  }

  var waste_collection_id = document.getElementById('waste_collection_id');
  if (waste_collection) {
    if (waste_collection.toUpperCase() == 'SI')
      waste_collection = true;
    else
      waste_collection = false;
    waste_collection_id.innerHTML = setYesNoHTMLMarker(waste_collection);
  }
  else {
    waste_collection_id.innerHTML = no_info;
  }

  // Get numbers for info text.
  filter.criteria['municipio'] = { value: partido};
  filter.criteria['partido'] = { value: partido};
  filter.criteria['localidad'] = { value: localidad};
  filter.criteria['barrio'] = { value: barrio};
  filter.criteria['selected_area'] = { value: 'barrio'};

  queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID +
              " WHERE 'NOMBRE DEL BARRIO' = '" + barrio + "'";
  getFamilyNumber(escala["barrio"], queryText);
}

function setYesNoHTMLMarker(bool) {
  //
  // Show different images in response to good/bad criteria.
  //
  if (bool)
//    result = '<img src="/images/up.png"/>';
//    result = '<i class="icon-thumbs-up"></i>';
    result = 'S&iacute;';
  else
//    result = '<img src="/images/down.png"/>';
//    result = '<i class="icon-thumbs-down"></i>';
    result = 'No';
  return result;
}

function placeMarker(map, location, marker_icon, marker_shadow) {
  //
  // Add markers to the map
  // Marker sizes are expressed as a Size of X,Y
  // where the origin of the image (0,0) is located
  // in the top left of the image.

  // Origins, anchor positions and coordinates of the marker
  // increase in the X direction to the right and in
  // the Y direction down.
  var image = new google.maps.MarkerImage(marker_icon,
      // The size of the marker.
      new google.maps.Size(32, 32),
      // The origin for this image.
      new google.maps.Point(0, 0),
      // The anchor for this image.
      new google.maps.Point(10, 32));
  var shadow = new google.maps.MarkerImage(marker_shadow,
      // The shadow image is larger in the horizontal dimension.
      new google.maps.Size(49, 32),
      new google.maps.Point(0, 0),
      new google.maps.Point(18, 32));
      // Shapes define the clickable region of the icon.
      // The type defines an HTML <area> element 'poly' which
      // traces out a polygon as a series of X,Y points. The final
      // coordinate closes the poly by connecting to the first
      // coordinate.
  var shape = {
      coord: [1, 1, 1, 20, 18, 20, 18 , 1],
      type: 'poly'
  };

  // Delete current ('old') marker.
  deleteOverlays();
  // Create new marker.
  var marker = new google.maps.Marker( {
    position: location,
    icon: image,
    shadow: shadow,
//    shape: shape,
    map: map
  } );
  // Set marker to map.
  markers.push(marker);
  // Set marker to the map's center.
  map.setCenter(location);

  return marker;
}

function deleteOverlays() {
  //
  // Deletes all markers in the array by removing references to them.
  //
  var i;
  if (markers) {
    for (i=0; i<markers.length; i++) {
      markers[i].setMap(null);
    }
    markers.length = 0;
  }
}

function drawSupplyCharts(view, page) {
  //
  // Prepare charts with data.
  //
  // Init charts
  var charts = {
    // 1. Desagües cloacales
    sewage: [],
    // 2. Red pública
    water: [],
    // 3. Sistema eléctrico
    electrical: [],
    // 4. Red de gas
    gas: []
  };

  // Prepare charts with values.
  //
  // Prepare queries in response of escala.
  // Order of case-statement (switch) is important!!! From barrio to metropolitana!
  var where_clause;
  var chart_base;

// 	console.log("filter.criteria['selected_area'].value = " + filter.criteria['selected_area'].value);
// 	console.log("filter.criteria['municipio'].value = " + filter.criteria['municipio'].value);
// 	console.log("filter.criteria['partido'].value = " + filter.criteria['partido'].value);
// 	console.log("filter.criteria['localidad'].value = " + filter.criteria['localidad'].value);
	
  if (escala["barrio"] && filter.criteria['selected_area'].value == 'barrio' && filter.criteria['partido'].value !== null) {
//   	where_clause = " WHERE 'LOCALIDAD' = '" + filter.criteria['localidad'].value + "'";
//   	chart_base = filter.criteria['localidad'].value;
	// changed 21/03/13 13:00
    where_clause = " WHERE 'PARTIDO' = '" + filter.criteria['partido'].value + "'";
    chart_base = filter.criteria['partido'].value;
  }
  else if (escala["barrio"] && filter.criteria['barrio'].value !== null && filter.criteria['selected_area'].value == 'localidad') {
// 	where_clause = " WHERE 'LOCALIDAD' = '" + filter.criteria['localidad'].value + "'";
// 	chart_base = filter.criteria['localidad'].value;
	// changed 21/03/13 12:56
    where_clause = " WHERE 'PARTIDO' = '" + filter.criteria['partido'].value + "'";
    chart_base = filter.criteria['partido'].value;
  }
  else if (escala["barrio"] && filter.criteria['barrio'].value !== null && filter.criteria['selected_area'].value == 'municipio') {
    where_clause = " WHERE 'PARTIDO' = '" + filter.criteria['partido'].value + "'";
    chart_base = filter.criteria['partido'].value;
  }
  else if(escala["localidad"] && filter.criteria['selected_area'].value == 'localidad') {
    where_clause = " WHERE 'LOCALIDAD' = '" + filter.criteria['localidad'].value + "'";
    chart_base = filter.criteria['localidad'].value;
  }
  else if(escala["municipio"] && filter.criteria['selected_area'].value == 'municipio') {
    where_clause = " WHERE 'PARTIDO' = '" + filter.criteria['partido'].value + "'";
    chart_base = filter.criteria['partido'].value;
  }
  else if(escala["metropolitana"]) {
    where_clause = null;
    chart_base = "Metropolitana";
  }
  else {
    where_clause = null;
    chart_base = "Metropolitana";
  }

  if (where_clause) {
    charts.sewage.query = { value: "SELECT 'RED CLOACAL' FROM " + dataSourceEncryptedID + where_clause };
    charts.water.query = { value: "SELECT 'AGUA' FROM " + dataSourceEncryptedID  + where_clause };
    charts.electrical.query = { value: "SELECT 'ACCESO A LA ENERGÍA' FROM " + dataSourceEncryptedID  + where_clause };
    charts.gas.query = { value: "SELECT 'GAS' FROM " + dataSourceEncryptedID  + where_clause };
  }
  else {
    charts.sewage.query = { value: "SELECT 'RED CLOACAL' FROM " + dataSourceEncryptedID };
    charts.water.query = { value: "SELECT 'AGUA' FROM " + dataSourceEncryptedID };
    charts.electrical.query = { value: "SELECT 'ACCESO A LA ENERGÍA' FROM " + dataSourceEncryptedID };
    charts.gas.query = { value: "SELECT 'GAS' FROM " + dataSourceEncryptedID };
  }

  charts.sewage.chartType = { value: "PieChart" };
  charts.sewage.containerID = { value: "sewage_chart_div" };
  charts.sewage.dataSourceUrl = { value: dataSourceUrl };
  // Brown tones.
  charts.sewage.colors = { value: ['#8A4B08', '#61380B', '#B45F04', '#DF7401', '#FF8000'] };

  charts.water.chartType = { value: "PieChart" };
  charts.water.containerID = { value: "water_chart_div" };
  charts.water.dataSourceUrl = { value: dataSourceUrl };
  // Blue tones
  charts.water.colors = { value: ['#2E9AFE', '#81BEF7', '#045FB4', '#0B3861', '#0000FF'] };

  charts.electrical.chartType = { value: "PieChart" };
  charts.electrical.containerID = { value: "electrical_chart_div" };
  charts.electrical.dataSourceUrl = { value: dataSourceUrl };
  // Yellow/Orange tones
//  charts.electrical.colors = { value: ['#FFBF00', '#FFCC00', '#FF8000', '#FFD700', '#FFA500'] };
  charts.electrical.colors = { value: ['#ffcc00', '#ff9933', '#ffcc66', '#ffcc33', '#ff9900'] };

  charts.gas.chartType = { value: "PieChart" };
  charts.gas.containerID = { value: "gas_chart_div" };
  charts.gas.dataSourceUrl = { value: dataSourceUrl };
  // Red tones.
  charts.gas.colors = { value: ['#FF0000', '#FA5858', '#8A0808', '#FE2E2E', '#F78181'] };

  // Legend for charts only for map page.
  if (page == 'map_page') {
    var info_text_charts = document.getElementById('info_text_charts');
    info_text_charts.innerHTML = "Diagramas para <strong>" + chart_base + "</strong>";
  }

  // Draw charts.
  var chartObject;
  for(var chart in charts) {
    switch(page) {
      case 'index_page':
        chartObject = {
          containerID: charts[chart].containerID.value,
          dataSourceUrl: charts[chart].dataSourceUrl.value,
          query: charts[chart].query.value,
          chartType: charts[chart].chartType.value,
          options: {
            width: 500,
            height: 240,
            colors: charts[chart].colors.value,
            chartArea: {left:20,top:6,width:"100%",height:"85%"}
          }
        };
        break;

      case 'map_page':
        chartObject = {
          containerID: charts[chart].containerID.value,
          dataSourceUrl: charts[chart].dataSourceUrl.value,
          query: charts[chart].query.value,
          chartType: charts[chart].chartType.value,
          options: {
            areaOpacity: 0.0,
            backgroundColor: { fill:'transparent' },
            width: 350,
            height: 130,
            colors: charts[chart].colors.value,
            chartArea: {left:10,top:6,width:"75%",height:"85%"}
          }
        };
        break;

      //default:
      // not set...
    }
    draw_chart(chartObject);
  }
}

function draw_chart(chartObject) {
  //
  // Draws a chart on given page.
  //
  google.visualization.drawChart( {
    "containerId": chartObject["containerID"],
    "dataSourceUrl": chartObject["dataSourceUrl"],
    "query": chartObject["query"],
    "chartType": chartObject["chartType"],
    "options": chartObject["options"]
  } );
}

function setQuery(dataSourceUrl, sqlString) {
  //
  // Create query string ready for use in a callback.
  //
  var result;

  var query = new google.visualization.Query(dataSourceUrl);
  query.setQuery(sqlString);
  result = query;

  return result;
}

function getFamilyNumber(escala, queryText) {
  //
  // Get and show info texts.
  //
  var info_text_escala = document.getElementById('info_text_escala');
  var query = setQuery(dataSourceUrl, queryText);

  query.send(function(response) {
    if (response.isError()) {
      alert('getFamilyNumber(): Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      return;
    }
    var results = [];
    var numRows = response.getDataTable().getNumberOfRows();
    // Search criteria not found in data source.
    if (!numRows) {
        var msg = "La selecci&oacute;n no se pudo encontrar.";
        bootstrap_alert.warning(msg);
        return;
    }
    for(var i=0; i<numRows; i++) {
      results.push(response.getDataTable().getValue(i, 0));
      results.push(response.getDataTable().getValue(i, 1));

    }
    var html;

    // Distinction of singular and plural use of texts in response to numbers.
    var villa_text = "villas y asentamientos";
    var familia_text = "familias";

    if (parseInt(results[1], 10).format() == '1') {
      villa_text = "villa y asentamiento";
    }

    if (parseInt(results[0], 10).format() == '1') {
      familia_text = "familia";
    }

    // Set info texts.
    switch(escala) {
      // metropolitana
      case 1:
        html = "En la regi&oacute;n <strong>Metropolitana</strong> de Buenos Aires hay&nbsp;" +
        "<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        "&nbsp;" + villa_text + ", en los que residen&nbsp;" +
        "<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        "&nbsp;" + familia_text + ".";
        break;
      // municipio
      case 2:
        html = "En el municipio de <strong>" + filter.criteria['municipio'].value + "</strong> hay&nbsp;" +
        "<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        "&nbsp;" + villa_text + ", en los que residen&nbsp;" +
        "<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        "&nbsp;" + familia_text + ".";
        break;
      // localidad
      case 3:
        html = "En la localidad de <strong>" + filter.criteria['localidad'].value +
        "</strong> del municipio de <strong>" + filter.criteria['municipio'].value + "</strong> hay&nbsp;" +
        "<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        "&nbsp;" + villa_text + ", en los que residen&nbsp;" +
        "<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        "&nbsp;" + familia_text + ".";
        break;
      // barrio
      case 4:
        html = "En el barrio de <strong>" + filter.criteria['barrio'].value +
        "</strong> en la localidad de <strong>" + filter.criteria['localidad'].value +
        "</strong> del partido de <strong>" + filter.criteria['partido'].value + "</strong> hay&nbsp;" +
        "<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        "&nbsp;" + villa_text + ", en los que residen&nbsp;" +
        "<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        "&nbsp;" + familia_text + ".";
        break;
      //default:
      // not set...
    }
    info_text_escala.innerHTML = html;
  } );
}

function setQueryUrl() {
  queryUrl.push('?sql=' + queryEncoded);
  queryUrl.push('&key=' + apiKey);
  queryUrl.push('&callback=?');
}

/////////////////////////////////////////////////////////////////////
// Public functions for global using.
/////////////////////////////////////////////////////////////////////

// A simple alert message via bootstrap.
bootstrap_alert = function() {};
bootstrap_alert.warning = function(msg) {
  $('#alert_placeholder').html(
  '<div class="alert fade in"><button type="button" class="close" data-dismiss="alert">&times;</button><i class="icon-thumbs-down"></i>&nbsp;<span>'+msg+'</span></div>')
};

function isEmpty(str) {
  //
  // For checking if a string is empty, null or undefined.
  //
  return (!str || 0 === str.length);
}

function isBlank(str) {
  //
  // For checking if a string is blank, null or undefined.
  //
  return (!str || /^\s*$/.test(str));
}

function clearThis(target) {
  //
  // Clears text in a text field, when the user clicks on it.
  //
  target.value= "";
}

function doAction(e, obj) {
  var keyCode = e ? (e.which ? e.which : e.keyCode) : event.keyCode;
  // For enter...
  if (keyCode == 13) {
    if (obj.id == 'search_part_txt') {
      setViewToPartido();
      return false;
    }
    if (obj.id == 'search_barrio_txt') {
      setViewToBarrio();
      return false;
    }
  }
  return true;
}

function techoBtnOnMouseOver(obj) {
  var id = obj.id;
  if (id == 'clear_search_part_txt' || id == 'clear_search_barrio_txt') {
    document.getElementById(id).style.backgroundColor='#0092dd';
    document.getElementById(id).style.cursor='pointer';
  }
  return false;
}

function techoBtnOnMouseOut(obj) {
  var id = obj.id;
  if (id == 'clear_search_part_txt' || id == 'clear_search_barrio_txt') {
    document.getElementById(id).style.backgroundColor='transparent';
    document.getElementById(id).style.cursor='default';
  }
  return false;
}

/////////////////////////////////////////////////////////////////////
// Prototypes for global using.
/////////////////////////////////////////////////////////////////////

Array.prototype.unique = function() {
  //
  // Strips duplicates in an array away.
  //
  var obj = {};
  var tmp = [];
  var i;
  for(i = 0 ; i < this.length; i++) obj[this[i]] = true;
  for(i in obj) tmp[tmp.length] = i;
  return tmp;
};

Number.decPoint = ',';
Number.thousand_sep = '.';

Number.prototype.format = function(k, fixLength) {
  //
  // Usage: <number_obj>.format([, number]  [, bool]  )
  //
  // The function is a prototype extension of the Number object, that it can be
  // applied as a method of all the numbers. The call <number_obj>.format() expects
  // two parameters to identify the following:
  // number (optional)
  // The number of decimal places to which the number is to be rounded (default: 0)
  // bool (optional)
  // This parameter determines whether the formatted number should have a fixed
  // number of decimal places. If true, then any missing bodies will extend with zero.
  // Examples:
  // var myNumber = 12345678;
  // myNumber.format() => Result: 12.345.678
  // myNumber.format(2) => Result: 12.345.678
  // myNumber.format(2, true) => Result: 12.345.678,00
  //
  if (!k) {
    k = 0;
  }
  var result = '';

  // Round
  var f = Math.pow(10, k);
  var numb = '' + parseInt( this * f + ( .5 * ( this > 0 ? 1 : -1 ) ) ) / f;

  // Evaluate comma.
  var idx = numb.indexOf('.');

  // Insert missing zeros.
  if (fixLength && k) {
    numb += (idx == -1 ? '.' : '') + f.toString().substring(1);
  }

  // Evaluate decimal places.
  idx = numb.indexOf('.');
  if (idx == -1) {
    idx = numb.length;
  }
  else {
    result = Number.decPoint + numb.substr(idx + 1, k);
  }

  // Set thousands separator.
  while(idx > 0) {
    if (idx - 3 > 0) {
      result = Number.thousand_sep + numb.substring( idx - 3, idx) + result;
    }
    else {
      result = numb.substring(0, idx) + result;
    }
    idx -= 3;
  }

  return result;
};
