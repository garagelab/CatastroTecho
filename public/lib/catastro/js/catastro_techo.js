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

/**
 * Checks if browser supports cookies.
 * 
 * @return {boolean}
 *             True if browser supports cookies, false if not.
 */

function supportsCookies() {
    var cookieEnabled = navigator.cookieEnabled;
    
    // When cookieEnabled flag is present and false then cookies are disabled.
    // Thanks to IE we can't trust the value "true".
    if (cookieEnabled === false) return false;

    // Internet Explorer is lying to us. So we have to set a test cookie
    // in this browser (We also do it for strange browsers not supporting
    // the cookieEnabled flag). But we only do this when no cookies are
    // already set (because that would mean cookies are enabled)
    if (!document.cookie && (cookieEnabled == null || /*@cc_on!@*/false))
    {
        // Try to set a test cookie. If not set then cookies are disabled
        document.cookie = "testcookie=1";
        if (!document.cookie) return false;
        
        // Remove test cookie
        document.cookie = "testcookie=; expires=" + new Date(0).toUTCString();
    }

    // Well, at least we couldn't find out if cookies are disabled, so we
    // assume they are enabled.
    return true;
}

// Load the Visualization API library and the chart libraries using 'Spanish' locale.
google.load('visualization', '1', { 'packages' : ['table', 'corechart'], 'language': 'es' } );

//*******************************************************************
// GLOBAL VARIABLES
//*******************************************************************
//

// Query components
var query;
var queryText;

var where_clause;
var where_clause_area_map;
var barrio;
var map;
var initLayer;
var markers = [];
var techo_marker = "../images/marker_techo1.png";
var techo_marker_shadow = "../images/shadow_blue_marker.png";

var partidoFilter = false;
var barrioFilter = false;

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
	getCurrentDatasource();
	
	var argentina = new google.maps.LatLng(-38.416097, -63.616672);

  	map = new google.maps.Map(document.getElementById('map_index_page'), {
    	center: argentina,
    	zoom: 4,
    	minZoom: 2,
    	mapTypeId: google.maps.MapTypeId.ROADMAP,
    	streetViewControl: false
  	} );
    
  	var circle = {};
  	for(var key in datasources.table) {
  		// Check, if key really exists in associative array - to be safe!
  		if(!datasources.table.hasOwnProperty(key)) {
  			continue;
  		}
  		
  		var marker = placeMarker(
  			map, 
  			datasources.table[key].center_lat_lng, 
  			techo_marker, 
  			techo_marker_shadow,
  			false
  		);
  		
//  		marker.setTitle(datasources.table[key].name + ' (' + key + ')');
  		marker.setTitle(key);

		// Add a marker label.
        var mapLabel = new MapLabel({
          text: datasources.table[key].name,
          position: new google.maps.LatLng(34.03, -118.235),
          map: map,
          fontSize: 12,
          fontColor: "#191970",
          fontFamily: "sans-serif",
          strokeWeight: 5,
          strokeColor: "#ffffff",
          minZoom: 4,
          maxZoom: 12,	
          align: 'center'
        });
        mapLabel.set('position', datasources.table[key].center_lat_lng);

  		// Add a Circle overlay to the map.
  		circle[key] = new google.maps.Circle( {
    		map: map,
    		fillColor: '#d75857', //#0000ff
    		fillOpacity: 0.5,
    		strokeColor: '#1e90ff',
    		strokeOpacity: 0.5,
    		strokeWeight: 1,
    		//radius: 1836.55489862987
    		radius: 100000 // 100 km
  		});

  		// Bind marker to label and circle and set listeners for clicking.
		marker.bindTo('map', mapLabel);
        marker.bindTo('position', mapLabel);
  		circle[key].bindTo('center', marker, 'position');
		addSelectionListener(marker, circle[key]);
  	}
}

/**
 * Selection listeners in overview map page.
 *
 * Don't move these listeners into for loop to initMapIndexPage()
 * because they will not work correctly. 
 */
function addSelectionListener(marker, circle) {

  	google.maps.event.addListener(marker, 'click', function() {
		setCurrentDatasource(datasources.table[marker.getTitle()]);
    	window.location.href = "/content/mapa-de-barrios";
  	});

  	google.maps.event.addListener(circle, 'click', function() {
		setCurrentDatasource(datasources.table[marker.getTitle()]);
    	window.location.href = "/content/mapa-de-barrios";
  	});
}

/**
 * Set new data view.
 *
 */
function setViewToDatasource(datasource_key) {
	// No need setting new datasource.
	if (current_datasource.key == datasource_key) { return; }
	
	setCurrentDatasource(datasources.table[datasource_key]);
 	// Refresh current page after changing datasource.
 	window.location.reload(true);
}

/**
 * Initialize map page with barrios for first use.
 *
 */
function initMapBarriosPage() {    
	getCurrentDatasource();
	var search_part_txt_label = document.getElementById('search_part_txt_label');
  	search_part_txt_label.innerHTML = '<i class="icon-filter"></i>&nbsp;' + 
  		current_datasource.search_part_txt_label;
  	
  	map = new google.maps.Map(document.getElementById('map_canvas'), {
    	center: current_datasource.center_lat_lng,
    	zoom: current_datasource.startZoom,
    	minZoom: 2, // 9
    	mapTypeId: google.maps.MapTypeId.ROADMAP,
    	streetViewControl: false
  	} );

  	initMapLayer();
  	initLayer.setMap(map);

  	// Show province data (all data).
  	setViewToProvincia();

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
	getCurrentDatasource();
	var header = document.getElementById('header_table_barrio_page');
  	header.innerHTML = "Informaci&oacute;n completa de cada villa y asentamiento de " + 
  		current_datasource.provincia + " " + current_datasource.year;
	getFusionTableData('select * from ' + current_datasource.id, dataTableHandler);
}

/////////////////////////////////////////////////////////////////////
// User interactions 
/////////////////////////////////////////////////////////////////////

/**
 * Set/reset to province data (all).
 *
 */
function setViewToProvincia() {
  current_datasource.filter['provincia'] = current_datasource.provincia;

  // Init numbers of villas and families.
  queryText = "SELECT sum(" + current_datasource.sql_families + ") as familias, count(" + current_datasource.sql_barrio + ") FROM " + current_datasource.id;
  getFamilyNumber(view_level['provincia'], queryText);

  drawSupplyCharts(view_level['provincia'], "map_page");
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
      from: current_datasource.id
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
//   google.maps.event.addListener(initLayer, 'click', function(e) {
//     placeMarker(map, e.latLng, techo_marker, techo_marker_shadow, true);
//     showBarrioInfo(e);
//     drawSupplyCharts(view_level["barrio"], "map_page");
//   } );
  
  addBarrioListener(initLayer);
}

/**
 * Barrio listener.
 *
 * A listener to the initLayer that constructs a map marker and
 * afterwards shows barrio data for information.
 */
function addBarrioListener(initLayer) {

	google.maps.event.addListener(initLayer, 'click', function(e) {
    	placeMarker(map, e.latLng, techo_marker, techo_marker_shadow, true);
		showBarrioInfo(e);
    	drawSupplyCharts(view_level["barrio"], "map_page");
  	} );
}

/*
 * Evaluate focus (midpoint) from a given polygon boundary.
 *
 */
function getLatLngFocusFromPolygonBoundary(polygonBoundary) {
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
      	lng = latlngArr[i].substring(comma1+1, comma2-1);      
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
  $(".alert").alert('close');

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
      var exp = "(" + current_datasource.shortcut_municipio + ")";
      var re = new RegExp(exp, 'g');
      if (choice.match(re)) {
        choice = (choice.substring(0, choice.indexOf(exp)-1)).trim();
        where_clause = " WHERE " + current_datasource.sql_municipio + " = '" + choice + "'";
        area_choice = 'P';
      }
      else {
        exp = "(" + current_datasource.shortcut_localidad + ")";
        re = new RegExp(exp, 'g');
        if (choice.match(re)) {
          choice = (choice.substring(0, choice.indexOf(exp)-1)).trim();
          where_clause = " WHERE " + current_datasource.sql_localidad + " = '" + choice + "'";
          area_choice = 'L';
        }
        else {
        	where_clause = " WHERE " + current_datasource.sql_municipio + " = '" + choice + "'";
          area_choice = 'P';
        }
      }
    }
    else {
    	where_clause = " WHERE " + current_datasource.sql_municipio + " = '" + choice + "'";
      area_choice = 'P';
    }
    
    queryText = encodeURIComponent("SELECT * FROM " + current_datasource.id + where_clause);
  	query = new google.visualization.Query(urlVizData + queryText);
    
	query.send(function(response) {
	    if (response.isError()) {
      		alert('Function: findPartidoData()\n Error-msg: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      		return;
    	}

    	var numRows = response.getDataTable().getNumberOfRows();
      	// Partido or Localidad not found in data source.
      	if (!numRows) {
        	var msg = "La selecci&oacute;n " + "'" + choice + "'" + " no se pudo encontrar.";
        	bootstrap_alert.warning(msg);
        	clearThis(document.getElementById("search_part_txt"));
        	return;
      	}

      	if (response.getDataTable().getValue(0, current_datasource.col_no_polygon) &&
          	!isEmpty(response.getDataTable().getValue(0, current_datasource.col_no_polygon)) &&
          	!isBlank(response.getDataTable().getValue(0, current_datasource.col_no_polygon))) {
        	polygonBoundary = response.getDataTable().getValue(0, current_datasource.col_no_polygon);
        	current_datasource.filter['municipio'] = response.getDataTable().getValue(0, current_datasource.col_no_municipio);
        	// Evaluate the focus of a polygon in selected area for center map.
        	if (polygonBoundary) {
          		lat_lng = getLatLngFocusFromPolygonBoundary(polygonBoundary);
        	}
        	else {
          	// set default
          		lat_lng = current_datasource.center_lat_lng;
        	}
        	map.setCenter(lat_lng);
        	map.setZoom(12); // antes era 11
      	}
     
		if (area_choice) {
      		// Set where clause for map and get numbers for info text.
      		where_clause_area_map = null;

      		// Reset barrio info.
      		removeBarrioInfo();
      		current_datasource.filter['barrio'] = null;

      		switch(area_choice.toUpperCase()) {
        		case 'P':
          			current_datasource.filter['municipio'] = choice;
          			reporting_level = 'municipio';
                    where_clause_area_map = current_datasource.sql_municipio + " = " + "'" + choice + "'";
          			queryText = "SELECT sum(" + current_datasource.sql_families + ") as familias, count() FROM " + current_datasource.id + " WHERE " + where_clause_area_map;
          			getFamilyNumber(view_level["municipio"], queryText);
          		break;
        	
        		case 'L':
          			current_datasource.filter['localidad'] = choice;
          			reporting_level = 'localidad';
          			where_clause_area_map = current_datasource.sql_localidad + " = " + "'" + choice + "'";
          			queryText = "SELECT sum(" + current_datasource.sql_families + ") as familias, count() FROM " + current_datasource.id + " WHERE " + where_clause_area_map;
          			getFamilyNumber(view_level["localidad"], queryText);
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
          			from: current_datasource.id
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
    		drawSupplyCharts(view_level["municipio"], "map_page");
  		}
  		else {
    		setViewToProvincia();
  		}
    } );

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
  	var codigo;
  	var has_codigo = false;

  	// Check text search field for manually search first.
  	var barrio = document.getElementById('search_barrio_txt').value;
  	  	
  	// Is search field empty?
  	if (!barrio) { return false; }
  	if (isEmpty(barrio) || isBlank(barrio)) { return false; }

	// Seems to be we have data to view...
  	if (barrio && !isEmpty(barrio) && !isBlank(barrio)) {
    	// Extract parentheses, if necessary.
    	if (barrio.indexOf("(") >= 0) {
      		codigo = (barrio.substring(barrio.indexOf("(")+1, barrio.indexOf(")"))).trim();
      		has_codigo = true;
      		barrio = (barrio.substring(0, barrio.indexOf("(")-1)).trim();
    	}
    	if (has_codigo) {
    		queryText = encodeURIComponent("SELECT * FROM " + current_datasource.id + " WHERE " + current_datasource.sql_codigo + " = '" + codigo + "'");
    	}
    	else {
    		queryText = encodeURIComponent("SELECT * FROM " + current_datasource.id + " WHERE " + current_datasource.sql_barrio + " = '" + barrio + "'");
    	}
  		query = new google.visualization.Query(urlVizData + queryText);

		// Callback
    	query.send( function(response) {
    		if (response.isError()) {
      			alert('Function: findBarrioData()\n Error-msg: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      			return;
    		}
    	
      		var numRows = response.getDataTable().getNumberOfRows();
      		// Barrio not found in data source.
      		if (!numRows) {
        		var msg = "El barrio " + "'" + barrio + "'" + " no se pudo encontrar.";
        		bootstrap_alert.warning(msg);
        		clearThis(document.getElementById("search_barrio_txt"));
        		return;
      		}

      		// Get numbers for info text.
      		current_datasource.filter['barrio'] = barrio;
      		reporting_level = 'barrio';

    		if (has_codigo) {
      			queryText = "SELECT sum(" + current_datasource.sql_families + ") as familias, count() FROM " + current_datasource.id +
                  			" WHERE " + current_datasource.sql_codigo + " = '" + codigo + "'";
    		}
    		else {
      			queryText = "SELECT sum(" + current_datasource.sql_families + ") as familias, count() FROM " + current_datasource.id +
                  			" WHERE " + current_datasource.sql_barrio + " = '" + barrio + "'";
      		}
      		getFamilyNumber(view_level["barrio"], queryText);

      		// Extract polygon data from table.
      		var polygonBoundary = response.getDataTable().getValue(0, current_datasource.col_no_polygon);
      		lat_lng = getLatLngFocusFromPolygonBoundary(polygonBoundary);

      		// e only has four properties, "infoWindowHtml", "latLng", "pixelOffset" and "row".
      		var e = {
        		infoWindowHtml: null,
        		latLng: lat_lng,
        		pixelOffset: null,
        		row : []
      		};

			e.row[current_datasource.cols[current_datasource.col_no_barrio].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_barrio) };
      		e.row[current_datasource.cols[current_datasource.col_no_other_name_barrio].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_other_name_barrio) };
      		e.row[current_datasource.cols[current_datasource.col_no_municipio].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_municipio) };
      		e.row[current_datasource.cols[current_datasource.col_no_localidad].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_localidad) };
      		e.row[current_datasource.cols[current_datasource.col_no_families].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_families) };
      		e.row[current_datasource.cols[current_datasource.col_no_start_year].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_start_year) };
      		e.row[current_datasource.cols[current_datasource.col_no_sewage].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_sewage) };
      		e.row[current_datasource.cols[current_datasource.col_no_water].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_water) };
      		e.row[current_datasource.cols[current_datasource.col_no_electrical].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_electrical) };
      		e.row[current_datasource.cols[current_datasource.col_no_gas].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_gas) };
      		e.row[current_datasource.cols[current_datasource.col_no_drains].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_drains) };
      		e.row[current_datasource.cols[current_datasource.col_no_street_lighting].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_street_lighting) };
      		e.row[current_datasource.cols[current_datasource.col_no_waste_collection].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_waste_collection) };

      		// Triggering'click'-event listener to display barrio map marker and data.
      		google.maps.event.trigger(initLayer, 'click', e);
      		barrioFilter = true;
    	} );
		return true;
	}
}

/**
 * Autocompletion via jQuery for Barrio search field.
 *
 */
function initSearchFieldBarrio() {
	
	//console.debug('initSearchFieldBarrio()');

	var barrios = {};
	
    if (partidoFilter === false) {
		barrios =  barrios_cache;
    }
    else {
		barrios =  barrios_cache;

// 		for (var i in barrios_cache.data) {
// 			if(barrios_cache.data.hasOwnProperty(i)) {
// 				var entry = data_cache[i];
// 			barrios_cache.data[i] = { 
// 				key: 		entry[0], 
// 				value: 		entry[1],	// Barrio
// 				name2:		entry[2],
// 				municipio:	entry[3],
// 				localidad:	entry[4],
// 				provincia:	entry[5],
// 				label:		entry[1] + ', ' + entry[2] + ', ' + entry[3] + ', ' + entry[4]  + ', ' + entry[0] 
// 			};
// 		}
// 	}
	
	}
	
	$('#search_barrio_txt').autocomplete( {	    
		source: function(request, response) { 
        	var re = $.ui.autocomplete.escapeRegex(request.term);

			//console.debug('initSearchFieldBarrio() - re ' + re);

        	var matcher = new RegExp( "^" + re, "i" );

			//console.debug('initSearchFieldBarrio() - matcher ' + matcher);

//        	var matcher = new RegExp( $.ui.autocomplete.escapeRegex( request.term ), "i" );


//    		response($.grep(barrios_cache.data, function(item) {
    		response($.grep(barrios.data, function(item) {
    			return matcher.test(item.value); 
    		}));


//         	response( $.grep( barrios_cache, function( value ) {
//           		value = value.key || value.barrio || value;
//           		console.debug("value = "+ value);
//           		return matcher.test( value );
//         	}) );

		},
		minLength: function() { if (partidoFilter === false) return 2; else return 1; },
		select: function( event, ui ) {
        	$("#search_barrio_txt").val( ui.item.value );
//         	$("#project-id").val( ui.item.value );
//         	$("#project-description").html( ui.item.desc );
//         	$("#project-icon").attr( "src", "images/" + ui.item.icon );
 
        	return false;
      	}
		
// 		source: function(request, response) {
//     		//console.debug("request = %s", request.term);
// 
//       		if (partidoFilter === false) {
//         		var query = "SELECT " + current_datasource.sql_barrio_search_grp +
//             		        "FROM " + current_datasource.id +
// //                		    " WHERE 'BARRIO' CONTAINS IGNORING CASE '" + request.term + "'" +
// // 	                    	" WHERE 'BARRIO' like '" + request.term + "'" +
//  	                    	" WHERE 'BARRIO' STARTS WITH '" + request.term + "'" +
//                     		" GROUP BY " + current_datasource.sql_barrio_search_grp;
//       		}
//       		else {
//         		var query = "SELECT " + current_datasource.sql_barrio_search_grp +
//             		        "FROM " + current_datasource.id +
//                 		    " WHERE 'BARRIO' CONTAINS IGNORING CASE '" + request.term + "'" +
//                     		" AND " + where_clause_area_map +
//                     		" GROUP BY " + current_datasource.sql_barrio_search_grp;
//       		}
//       		
// 			// Prepare query string.
// 			var encodedQuery = encodeURIComponent(query);
// 
//     		// Construct the URL.
//     		var urlType = urlEndpoint + 'query';
//     		var url = [urlType];
//     		url.push('?sql=' + encodedQuery);
//     		url.push('&key=' + API_KEY);
//     		url.push('&callback=?');
// 
//     		$.ajax( {
//     			type: "GET",
//     			url: url.join(''),
//     			dataType: 'jsonp',
// 				contentType: "application/json",
//     			error: function () { 
//     				console.error("initSearchFieldBarrio(): Error in json-p call.");
//     			},
//         		success: function(data) {
//           			var result = $.map(data.rows, function(row) {
// // 						console.debug($);
//             			
//             			return {
//               				// Total query information for barrio.
//               				label: row[1] + (row[2] ? ", " + row[2] : "") + (row[3] ? ", " + row[3] : "") + (row[4] ? ", " + row[4] : "") + (row[0] ? ", " + row[0] : ""),
//               				// Barrio name and Código (unique key) only for search/autocomplete.
//         					//value: Código (unique key) for selection.
//               				value: row[1] + " (" + row[0] + ")"
//             			};
//           			}); // $.map...
//           			response (result);
//         		} // success...
//       		}); // $.ajax...
//     	} // source...
	}); // $().autocomplete...

    // Overrides the default autocomplete filter function to search only from the beginning of the string
//     $.ui.autocomplete.filter = function (array, term) {
//         var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(term), "i");
// 		//var matcher = new RegExp("\\b" + $.ui.autocomplete.escapeRegex(term), "i");
//         return $.grep(array, function (value) {
//             return matcher.test(value.label || value.value || value);
//         });
//     };
	
}

function initSearchFieldPartido() {
	//
  	// Autocompletition via jQuery for Partido/Localidad search field.
  	//
  	// Retrieve the unique names of 'municipios' using GROUP BY workaround.
 	queryText = encodeURIComponent(
            "SELECT " + current_datasource.sql_municipio + ", " + current_datasource.sql_localidad +
            'FROM ' + current_datasource.id + " GROUP BY " + current_datasource.sql_municipio + ", " + current_datasource.sql_localidad);
  	query = new google.visualization.Query(urlVizData + queryText);

  query.send(function(response) {
    if (response.isError()) {
      alert('Function: initSearchFieldPartido()\n Error-msg: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      return;
    }

    var numRows = response.getDataTable().getNumberOfRows();
    // Create the list of results for display of autocomplete.
    var results = [];
    for(var i=0; i<numRows; i++) {
      // Get 'Municipio' and 'Localidad' too for searching.
      if (response.getDataTable().getValue(i, 1)) {
        results.push(response.getDataTable().getValue(i, 0) + " (" + current_datasource.shortcut_municipio +")");
        results.push(response.getDataTable().getValue(i, 1) + " (" + current_datasource.shortcut_localidad +")");
      }
      else {
        results.push(response.getDataTable().getValue(i, 0) + " (" + current_datasource.shortcut_municipio +")");
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
  map.setCenter(current_datasource.center_lat_lng);
  map.setZoom(current_datasource.startZoom);
  delete queryText;

  //removeBarrioInfo();
  //initSearchFieldBarrio();
  removeAllBarrioSelections();

  initSearchFieldPartido();
  clearThis(document.getElementById('search_part_txt'));

  	// Remove filter.
	resetFilter();
  
	if (reporting_level != 'barrio') {
    	reporting_level = null;
  	}

  	// Show province data (all data).
  	setViewToProvincia();
}

function removeAllBarrioSelections() {
  //
  // Remove all selection criterias from objects.
  // Returns to starting position.
  //
  
  barrioFilter = false;

  deleteOverlays();

  if (partidoFilter === false) {
    map.setCenter(current_datasource.center_lat_lng);
    map.setZoom(current_datasource.startZoom);
  }

  removeBarrioInfo();

  initSearchFieldBarrio();
  clearThis(document.getElementById('search_barrio_txt'));

  // Remove filter.
  current_datasource.filter['barrio'] = null;
  if (reporting_level == 'barrio') {
    reporting_level = null;
  }
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

  var barrio = e.row[current_datasource.cols[current_datasource.col_no_barrio].name].value;
  var other_name_barrio = e.row[current_datasource.cols[current_datasource.col_no_other_name_barrio].name].value;
  var partido = e.row[current_datasource.cols[current_datasource.col_no_municipio].name].value;
  var localidad = e.row[current_datasource.cols[current_datasource.col_no_localidad].name].value;
  var families = e.row[current_datasource.cols[current_datasource.col_no_families].name].value;
  var start_year = e.row[current_datasource.cols[current_datasource.col_no_start_year].name].value;
  var sewage = e.row[current_datasource.cols[current_datasource.col_no_sewage].name].value;
  var water = e.row[current_datasource.cols[current_datasource.col_no_water].name].value;
  var electrical = e.row[current_datasource.cols[current_datasource.col_no_electrical].name].value;
  var gas = e.row[current_datasource.cols[current_datasource.col_no_gas].name].value;
  var drains = e.row[current_datasource.cols[current_datasource.col_no_drains].name].value;
  var street_lighting = e.row[current_datasource.cols[current_datasource.col_no_street_lighting].name].value;
  var waste_collection = e.row[current_datasource.cols[current_datasource.col_no_waste_collection].name].value;
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
  current_datasource.filter['municipio'] = partido;
  current_datasource.filter['localidad'] = localidad;
  current_datasource.filter['barrio'] = barrio;
  reporting_level = 'barrio';

  queryText = "SELECT sum(" + current_datasource.sql_families + ") as familias, count() FROM " + current_datasource.id +
              " WHERE " + current_datasource.sql_barrio + " = '" + barrio + "'";
  getFamilyNumber(view_level["barrio"], queryText);
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

function placeMarker(map, location, marker_icon, marker_shadow, to_stack) {
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
  if (to_stack == true) {
  	markers.push(marker);
  }
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

function drawSupplyCharts(view_level, page) {
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
  // Prepare queries in response of view level.
  // Order of case-statement (switch) is important!!! From barrio to provincia!
  var where_clause;
  var chart_base;
  
  if (view_level == 4 && reporting_level == 'barrio' && current_datasource.filter['municipio'] !== null) {
    where_clause = " WHERE " + current_datasource.sql_municipio + " = " + "'" + current_datasource.filter['municipio'] + "'";
    chart_base = current_datasource.filter['municipio'];
  }
  else if (view_level == 4 && current_datasource.filter['barrio'] !== null && reporting_level == 'localidad') {
    where_clause = " WHERE " + current_datasource.sql_municipio + " = " + "'" + current_datasource.filter['municipio'] + "'";
    chart_base = current_datasource.filter['municipio'];
  }
  else if (view_level == 4 && current_datasource.filter['barrio'] !== null && reporting_level == 'municipio') {
    where_clause = " WHERE " + current_datasource.sql_municipio + " = " + "'" + current_datasource.filter['municipio'] + "'";
    chart_base = current_datasource.filter['municipio'];
  }
  else if(view_level == 3 && reporting_level == 'localidad') {
    where_clause = " WHERE " + current_datasource.sql_localidad + " = '" + current_datasource.filter['localidad'] + "'";
    chart_base = current_datasource.filter['localidad'];
  }
  else if(view_level == 2 && reporting_level == 'municipio') {
    where_clause = " WHERE " + current_datasource.sql_municipio + " = " + "'" + current_datasource.filter['municipio'] + "'";
    chart_base = current_datasource.filter['municipio'];
  }
  else if(view_level == 1) {
    where_clause = null;
    chart_base = "Provincia";
  }
  else {
    where_clause = null;
    chart_base = "Provincia";
  }

  if (where_clause) {
    charts.sewage.query = { value: "SELECT 'RED CLOACAL' FROM " + current_datasource.id + where_clause };
    charts.water.query = { value: "SELECT 'AGUA' FROM " + current_datasource.id  + where_clause };
    charts.electrical.query = { value: "SELECT 'ACCESO A LA ENERGÍA' FROM " + current_datasource.id  + where_clause };
    charts.gas.query = { value: "SELECT 'GAS' FROM " + current_datasource.id  + where_clause };
  }
  else {
    charts.sewage.query = { value: "SELECT 'RED CLOACAL' FROM " + current_datasource.id };
    charts.water.query = { value: "SELECT 'AGUA' FROM " + current_datasource.id };
    charts.electrical.query = { value: "SELECT 'ACCESO A LA ENERGÍA' FROM " + current_datasource.id };
    charts.gas.query = { value: "SELECT 'GAS' FROM " + current_datasource.id };
  }

  charts.sewage.chartType = { value: "PieChart" };
  charts.sewage.containerID = { value: "sewage_chart_div" };
  charts.sewage.dataSourceUrl = { value: urlVizData };
  // Brown tones.
  charts.sewage.colors = { value: ['#8A4B08', '#61380B', '#B45F04', '#DF7401', '#FF8000'] };

  charts.water.chartType = { value: "PieChart" };
  charts.water.containerID = { value: "water_chart_div" };
  charts.water.dataSourceUrl = { value: urlVizData };
  // Blue tones
  charts.water.colors = { value: ['#2E9AFE', '#81BEF7', '#045FB4', '#0B3861', '#0000FF'] };

  charts.electrical.chartType = { value: "PieChart" };
  charts.electrical.containerID = { value: "electrical_chart_div" };
  charts.electrical.dataSourceUrl = { value: urlVizData };
  // Yellow/Orange tones
//  charts.electrical.colors = { value: ['#FFBF00', '#FFCC00', '#FF8000', '#FFD700', '#FFA500'] };
  charts.electrical.colors = { value: ['#ffcc00', '#ff9933', '#ffcc66', '#ffcc33', '#ff9900'] };

  charts.gas.chartType = { value: "PieChart" };
  charts.gas.containerID = { value: "gas_chart_div" };
  charts.gas.dataSourceUrl = { value: urlVizData };
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

function getFamilyNumber(view_level, queryText) {
  //
  // Get and show info texts.
  //
  var info_text_view_level = document.getElementById('info_text_view_level');
  query = new google.visualization.Query(urlVizData + queryText);

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
    switch(view_level) {
      // provincia
      case 1:
        html = "En la <strong>provincia</strong> de " + current_datasource.provincia + " hay&nbsp;" +
        "<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        "&nbsp;" + villa_text + ", en los que residen&nbsp;" +
        "<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        "&nbsp;" + familia_text + ".";
        break;
      // municipio
      case 2:
        html = "En el municipio de <strong>" + current_datasource.filter['municipio'] + "</strong> hay&nbsp;" +
        "<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        "&nbsp;" + villa_text + ", en los que residen&nbsp;" +
        "<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        "&nbsp;" + familia_text + ".";
        break;
      // localidad
      case 3:
        html = "En la localidad de <strong>" + current_datasource.filter['localidad'] +
        "</strong> del municipio de <strong>" + current_datasource.filter['municipio'] + "</strong> hay&nbsp;" +
        "<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        "&nbsp;" + villa_text + ", en los que residen&nbsp;" +
        "<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        "&nbsp;" + familia_text + ".";
        break;
      // barrio
      case 4:
        html = "En el barrio de <strong>" + current_datasource.filter['barrio'] +
        "</strong> en la localidad de <strong>" + current_datasource.filter['localidad'] +
        "</strong> del " + current_datasource.alias_municipio + " de <strong>" + current_datasource.filter['municipio'] + "</strong> hay&nbsp;" +
        "<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        "&nbsp;" + villa_text + ", en los que residen&nbsp;" +
        "<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        "&nbsp;" + familia_text + ".";
        break;
      //default:
      // not set...
    }
    info_text_view_level.innerHTML = html;
  } );
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

$(document).ready(function() {
	$('.dropdown-toggle').dropdown();
});
