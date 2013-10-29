/**
 * Project:		Relevamiento Techo (formerly Catastro Techo)
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

// Detect Microsoft Internet Explorer.
var ver = getInternetExplorerVersion();
if (ver != -1) {
	var MS_IE = true;
	var MS_IE_VERSION = ver;
}
else {
// Following two lines for test only!!!
// 	var MS_IE = true;
// 	var MS_IE_VERSION = 8; // -1

	var MS_IE = false;
	var MS_IE_VERSION = ver; // -1
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

var barrio;
var map;
var mini_map;
var mini_map_circles = [];
var initLayer;
var initMiniLayer;
var markers = [];
var techo_marker = "../images/marker_techo1.png";
var techo_marker_shadow = "../images/shadow_blue_marker.png";

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
 * Initialize map page (overview) at index page.
 *
 */
function initMapIndexPage() {
	Session.clear(); // Initialize session data store.
	getCurrentDatasource();
	
	var argentina = new google.maps.LatLng(-34.669564,-64.361218);

  	map = new google.maps.Map(document.getElementById('map_index_page'), {
    	center: argentina,
    	zoom: 5, // before 4
    	minZoom: 2,
    	mapTypeId: google.maps.MapTypeId.HYBRID,
    	streetViewControl: false,
    	overviewMapControl: true,
    	mapTypeControlOptions: {
        	style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        	position: google.maps.ControlPosition.LEFT_TOP
    	},    	
		zoomControlOptions: {
      		style: google.maps.ZoomControlStyle.SMALL,
      		position: google.maps.ControlPosition.TOP_LEFT
    	},
    	panControl: true,
    	panControlOptions: {
        	position: google.maps.ControlPosition.TOP_LEFT
    	},
	    overviewMapControlOptions: {
	    	opened: true,
        	position: google.maps.ControlPosition.BOTTOM,
		}
  	} );
	    
  	var circle = {};
  	var lat_lng;
  	for(var key in datasources.table) {
  		// Check, if key really exists in associative array - to be safe!
  		if(!datasources.table.hasOwnProperty(key)) {
  			continue;
  		}

		// Only temporary filter solution.
  		if (datasources.table[key].key.indexOf("2013") == -1) {
  			continue;
  		}
  		
  		lat_lng = new google.maps.LatLng(datasources.table[key].center_lat_lng[0],
  										datasources.table[key].center_lat_lng[1]);

		// Special proceeding for IE 8.
 		if (MS_IE && MS_IE_VERSION < 9) {

 			var ie_img_label = document.createElement("img");
     		ie_img_label.src = "../images/" + datasources.table[key].ie_img_label;

			var marker = new MarkerWithLabel({
    			position: lat_lng,
    			icon: techo_marker,
    			clickable: true,        
    			draggable: false,
    			// We use 'crossImage' only as a container for the key!
    			// It's a misuse!!! here as a quick workaround for IE nightmares.
    			crossImage: key,
    			map: map,
    			labelContent: ie_img_label,
//     			labelContent: datasources.table[key].name,
    			labelAnchor: new google.maps.Point(10, 5), // x, y
    			labelClass: "init-page-marker-with-label",
    			labelInBackground: false
			});
		}
		else {
  			var marker = placeMarker(
  				map,
  				lat_lng,
  				techo_marker, 
  				techo_marker_shadow,
  				false
  			);
  		
//  		marker.setTitle(datasources.table[key].name + ' (' + key + ')');
  			marker.setTitle(key);
		}
		
		// Not for IE 8.
 		if ((MS_IE && MS_IE_VERSION > 8) || (!MS_IE && MS_IE_VERSION == -1)) {
			// Add a marker label.
        	var mapLabel = new MapLabel({
          		text: datasources.table[key].name,
          		position: new google.maps.LatLng(34.03, -118.235),
          		map: map,
          		fontSize: 12,
          		fontColor: "#ffffff",     //#191970
          		fontFamily: "sans-serif",
          		strokeWeight: 5,
          		strokeColor: "#000",
          		minZoom: 4,
          		maxZoom: 12,	
          		align: 'center'
        	});

        	mapLabel.set('position', lat_lng);
		}
		
  		// Add a Circle overlay to the map.
  		circle[key] = new google.maps.Circle( {
    		map: map,							// Former values below...
    		fillColor: '#0092dd', 				//#0000ff #d75857 #0092dd (Techo)
    		fillOpacity: 0.5,  					// 0.5 0.35
    		strokeColor: '#0092dd', 			// #1e90ff #ff0000
    		strokeOpacity: 0.8, 				// 0.5
    		strokeWeight: 0.5, 					// 1
    		radius: 100000  					// 100 km
  		});

  		// Bind marker to label and circle and set listeners for clicking.
  		if ((MS_IE && MS_IE_VERSION > 8) || (!MS_IE && MS_IE_VERSION == -1)) { // Excluding IE 8 here.
			marker.bindTo('map', mapLabel);
        	marker.bindTo('position', mapLabel);
        }
  		circle[key].bindTo('center', marker, 'position');
		addSelectionListener(marker, circle[key]);
  	}
  	map.setCenter(argentina);
}

/**
 * Selection listeners in overview map page.
 *
 * Don't move these listeners into for loop to initMapIndexPage()
 * because they will not work correctly. 
 */
function addSelectionListener(marker, circle) {
	// Special proceeding for IE 8.
 	if (MS_IE && MS_IE_VERSION < 9) {
		google.maps.event.addListener(marker, "click", function (e) {
  			var datasource_key = this.crossImage; //crossImage is only a container for key!
			setCurrentDatasource(datasource_key);
    		window.location.href = "/content/mapa-de-barrios";
		});

  		google.maps.event.addListener(circle, 'click', function() {
  			var datasource_key = marker.crossImage; //crossImage is only a container for key!
			setCurrentDatasource(datasource_key);
    		window.location.href = "/content/mapa-de-barrios";
  		});
	}
	else {
  		google.maps.event.addListener(marker, 'click', function() {
  			var datasource_key = marker.getTitle();
			setCurrentDatasource(datasource_key);
    		window.location.href = "/content/mapa-de-barrios";
  		});

  		google.maps.event.addListener(circle, 'click', function() {
  			var datasource_key = marker.getTitle();
			setCurrentDatasource(datasource_key);
    		window.location.href = "/content/mapa-de-barrios";
  		});
  	}
}

/**
 * Set new data view.
 *
 */
function setViewToDatasource(datasource_key) {
	// No need setting new datasource.
	if (current_datasource.key == datasource_key) { return; }	
	setCurrentDatasource(datasource_key);

	
 	// Refresh current page after changing datasource.
// 	window.location.reload(true);
	initMapBarriosPage();
}

/**
 * Initialize map page with barrios.
 *
 */
function initMapBarriosPage() {
	getCurrentDatasource();
	var search_part_txt_label = document.getElementById('search_part_txt_label');
	
	// Special case for Buenos Aires.
	if ( current_datasource.name == 'Buenos Aires' ) {
  		search_part_txt_label.innerHTML = 
  			'<i class="icon-filter"></i>&nbsp;'+
			'<label class="radio inline">' +
  			'<input type="radio" name="bsas-territory" id="bsas-provincia" value="bsas-provincia">' +
			current_datasource.search_part_txt_label +
			'</label>' +
  			'<label class="radio inline">' +
  			'<input type="radio" name="bsas-territory" id="bsas-caba" value="bsas-caba">' +
  			'CABA' +
			'</label>';
  		document.getElementById('bsas-provincia').checked = true;
	}
	else {
  		search_part_txt_label.innerHTML = '<i class="icon-filter"></i>&nbsp;' + 
  		current_datasource.search_part_txt_label;
	}
	
  	map = new google.maps.Map(document.getElementById('map_canvas'), {
  		center: new google.maps.LatLng(current_datasource.center_lat_lng[0],
  										current_datasource.center_lat_lng[1]),
    	zoom: current_datasource.startZoom,
    	minZoom: 2, // 9
    	mapTypeId: google.maps.MapTypeId.HYBRID,
//    	mapTypeId: google.maps.MapTypeId.ROADMAP,
   		mapTypeControl: true,
    	mapTypeControlOptions: {
        	style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        	position: google.maps.ControlPosition.LEFT_TOP
    	},    	
//     	overviewMapControl: true,
// 	    overviewMapControlOptions: {
// 	    	opened: true,
//         	position: google.maps.ControlPosition.BOTTOM,
// 		},
		zoomControlOptions: {
      		style: google.maps.ZoomControlStyle.SMALL,
      		position: google.maps.ControlPosition.TOP_LEFT
    	},
    	panControl: true,
    	panControlOptions: {
        	position: google.maps.ControlPosition.TOP_LEFT
    	},
    	streetViewControl: false
  	} );

//   	mini_map = new google.maps.Map(document.getElementById('mini_map_canvas'), {
//   		center: new google.maps.LatLng(current_datasource.center_lat_lng[0],
//   										current_datasource.center_lat_lng[1]),
//     	zoom: 8,
//     	minZoom: 8,
// 		zoomControl: false,
//   		scaleControl: false,
//   		scrollwheel: false,
//   		disableDoubleClickZoom: true,    	
//     	mapTypeId: google.maps.MapTypeId.HYBRID,
//     	//mapTypeId: google.maps.MapTypeId.ROADMAP,
//     	mapTypeControl: false,
// 		zoomControl: false,
//     	streetViewControl: false
//   	} );

	// Bind the maps together
// 	mini_map.bindTo('center', map, 'center');

  	initMapLayer();
  	initLayer.setMap(map);
//   	initMiniMapLayer();
//   	initMiniLayer.setMap(mini_map);
  	
  	// Show province data (all data).
  	setViewToProvincia();

  	// Init 'Barrio' search field.
  	initSearchFieldBarrio();

  	// Init 'Partido' search field.
  	initSearchFieldPartido();
}

/** Initialize table page. */
function initTableBarriosPage() {
	getCurrentDatasource();
	var header = document.getElementById('header_table_barrios_page');
  	header.innerHTML = "Informaci&oacute;n completa de cada villa y asentamiento de " + 
  		current_datasource.provincia + " " + current_datasource.year;
  		
	// Notice workaround with where clause below. Reason is lack of performance without
	// because 'select *' is not as good. Better would be to get only necessary columns 
	// but table headings are very large, so an explicit listing is not possible with a 
	// 'GET' ajax call. => As a result we get an 'requested URI to large Error 414' here. 
 	getFusionTableData('select * from ' + current_datasource.id + 
 						' where ' + current_datasource.sql_codigo + " > 0", 
 						dataTableHandler);

//  	getFusionTableData("select " + 
//  						"'col0','col29','col30','col23','col24'," +
//  						"'col25','col26','col32','col40','col41'," +
//  						"'col42','col43','col61','col66','col54'," +
//  						"'col79','col85','col91','col87','col105'," +
//  						"'col106','col107','col108','col109','col110'," +
//  						"'col111','col112','col113'" +
//  						" from " + current_datasource.id + 
//  						" where " + current_datasource.sql_codigo + " > 0", 
//  						dataTableHandler);

	// View loading message.
	var loading_msg_txt = document.getElementById('loading-msg-txt');
  	loading_msg_txt.innerHTML = '<img src="/images/spinner-36x39.gif"/>&nbsp;Cargando datos...';

/*
  	getFusionTableData('select ' +
  						'"' + current_datasource.cols[0].name + '", ' + 
  						'"' + current_datasource.cols[29].name + '", ' + 
  						'"' + current_datasource.cols[30].name + '", ' + 
  						'"' + current_datasource.cols[23].name + '", ' + 
  						'"' + current_datasource.cols[24].name + '", ' + 
  						'"' + current_datasource.cols[25].name + '", ' + 
  						'"' + current_datasource.cols[26].name + '", ' + 
  						'"' + current_datasource.cols[32].name + '", ' + 
  						'"' + current_datasource.cols[40].name + '", ' + 
  						'"' + current_datasource.cols[41].name + '", ' + 
  						'"' + current_datasource.cols[42].name + '", ' + 
  						'"' + current_datasource.cols[43].name + '", ' + 
  						'"' + current_datasource.cols[61].name + '", ' + 
  						'"' + current_datasource.cols[66].name + '", ' + 
  						'"' + current_datasource.cols[54].name + '", ' + 
  						'"' + current_datasource.cols[79].name + '", ' + 
  						'"' + current_datasource.cols[85].name + '", ' + 
  						'"' + current_datasource.cols[91].name + '", ' + 
  						'"' + current_datasource.cols[87].name + '", ' + 
  						'"' + current_datasource.cols[105].name + '", ' + 
  						'"' + current_datasource.cols[106].name + '", ' + 
  						'"' + current_datasource.cols[107].name + '", ' + 
  						'"' + current_datasource.cols[108].name + '", ' + 
  						'"' + current_datasource.cols[109].name + '", ' + 
  						'"' + current_datasource.cols[110].name + '", ' + 
  						'"' + current_datasource.cols[111].name + '", ' + 
  						'"' + current_datasource.cols[112].name + '", ' + 
  						'"' + current_datasource.cols[113].name + '"' + 
  						' from ' + current_datasource.id +, dataTableHandler
  	);
*/

}

/////////////////////////////////////////////////////////////////////
// User interactions 
/////////////////////////////////////////////////////////////////////

/** Set/reset to province data (all). */
function setViewToProvincia() {
	current_datasource.filter.provincia = current_datasource.provincia;
	reporting_level = is_reporting_level.provincia;

  	// Init numbers of villas and families and charts.
  	queryText = "SELECT sum(" + current_datasource.sql_families + ") " + 
  				"as families, count(" + current_datasource.sql_barrio + ") " + 
  				"FROM " + current_datasource.id;
	
  	getFamilyNumber(reporting_level, queryText);

  	drawSupplyCharts(reporting_level, "map_page");
}

/** Set/reset to partido/localidad data. */
function setViewToPartido() {
  	findPartidoData();
}

/** Set/reset to barrio data. */
function setViewToBarrio() {
	findBarrioData();
}

/** Update Fusion Table Layer for mini map. */
function initMiniMapLayer() {
	initMiniLayer = new google.maps.FusionTablesLayer( {
    	suppressInfoWindows: true,
    	query: {
      		select: 'Poligon',
      		from: current_datasource.id
    	},
    	styles: [ {
      		polygonOptions: {
        		fillColor: "#FF3300",     // Color del plano.
        		fillOpacity: 0.5,         // Opacidad del plano
       			strokeColor: "#000000",   // Color del margen
        		strokeOpacity: 0.5,       // Opacidad del margen
        		strokeWeight: 2           // Grosor del margen
      		}
    	} ]
  	} );
}

/** Update Fusion Table Layer for main map. */
function initMapLayer() {  
  	initLayer = new google.maps.FusionTablesLayer( {
    	suppressInfoWindows: true, // Because we have a separate listener for that.
    	query: {
      		select: 'Poligon',
      		from: current_datasource.id
    	},
    	styles: [ {
      		polygonOptions: {
        		fillColor: polygon_color[current_datasource.year], // Color del plano
        		fillOpacity: 0.3,         // Opacidad del plano
        		strokeColor: "#000000",   // Color del margen
        		strokeOpacity: 0.5,       // Opacidad del margen
        		strokeWeight: 1           // Grosor del margen
      		}
    	} ]
  	} );
  	addBarrioListener(initLayer);
}

/**
 * Barrio listener
 *
 * A listener to the initLayer that constructs a map marker and
 * afterwards shows barrio data for information.
 */
function addBarrioListener(initLayer) {
	google.maps.event.addListener(initLayer, 'click', function(e) {
    	placeMarker(map, e.latLng, techo_marker, techo_marker_shadow, true);
		map.setZoom(14); // Zoom in this barrio.
		reporting_level = is_reporting_level.barrio;
		showBarrioInfo(e);
  	} );
}

/** Evaluate focus (midpoint) from a given polygon boundary. */
function getLatLngFocusFromPolygonBoundary(polygonBoundary) {
  	var result;

  	var latlngArr = [];
  	var lat_lng, lat, lng;
  	var comma1, comma2;

  	// Extract polygon coordinates from xml structure.
  	polygonBoundary = $(polygonBoundary).find("coordinates").text();
  	polygonBoundary = polygonBoundary.replace(/\\n/g, " ");
  	if (!MS_IE) {
  		polygonBoundary = polygonBoundary.trim();
	}
  	// Each pair of coordinates is stored in an array element.
  	latlngArr = polygonBoundary.split(' ');

	// Create a polygon boundary with given polygons.		
	var bounds = new google.maps.LatLngBounds();
	for(var i=0; i<latlngArr.length; i++) {
		// New logic since  18/09/2013.
		var elem = latlngArr[i];
  		var latlngArrTmp = elem.split(',');
      	bounds.extend(new google.maps.LatLng(latlngArrTmp[0], latlngArrTmp[1]));
//       	Former logic			
//       	comma1 = latlngArr[i].indexOf(',');
//       	comma2 = latlngArr[i].lastIndexOf(',');
//       	lat = latlngArr[i].substring(0, comma1-1);
//       	lng = latlngArr[i].substring(comma1+1);
//       	lng = latlngArr[i].substring(comma1+1, comma2-1);      
//       	bounds.extend(new google.maps.LatLng(lat, lng));
    }

	// Get midpoint coordinates from polygon boundary.
	lat_lng = bounds.getCenter();

	// Changes of coordinates lat to lng and vice versa (in move to result).
  	// Otherwise we get a wrong position here.
	var focus = lat_lng.toString();
  	var latlngArrTmp = focus.split(',');
  	lat = latlngArrTmp[1].substring(1, latlngArrTmp[1].indexOf(')')-1);
  	lng = latlngArrTmp[0].substring(latlngArrTmp[0].indexOf('(')+1);
  	result = new google.maps.LatLng(lat, lng);
  	
  	return result;
}

/** Find municipio/departamento data for selected municipio/departamento name. */
function findPartidoData() {	
	var latlngArr = [];
  	var lat_lng, lat, lng;
  	var comma1, comma2;
  	var polygonBoundary;
  	var where_clause;

	if (!current_datasource.filter.municipio && !current_datasource.filter.localidad) {
		// Creates a double call of getFamilyNumber!
		// But if we commend these out we get a negative side effect.
		// Side effect is: We need this after clearing barrio search and reinit provincia
		// view (For text in the middle above on screen). This would no longer work.
		setViewToProvincia();
  		return;
  	} 

	// Create where clause.
	if (current_datasource.filter.municipio) {
		reporting_level = is_reporting_level.municipio;
		where_clause = where_mpio_name__eq__selected_name;
	}
	if (current_datasource.filter.localidad) {
		reporting_level = is_reporting_level.localidad;
		where_clause = where_loc_name__eq__selected_name;
	}
    
    queryText = encodeURIComponent("SELECT * FROM " + current_datasource.id + where_clause);
  	query = new google.visualization.Query(urlVizData + queryText);
    
	query.send(function(response) {
	    if (response.isError()) {
      		console.error('Function: findPartidoData() Error-msg: ' + 
      			response.getMessage() + ' ' + response.getDetailedMessage());
      		return;
    	}

    	var numRows = response.getDataTable().getNumberOfRows();

      	// Municipio/Localidad not found in data source.
      	if (!numRows) {
        	var msg = "La selecci&oacute;n " + "'" + choice + "'" + " no se pudo encontrar.";
        	clearThis(document.getElementById("search_part_txt"));
        	return;
      	}
      	
		// Get polygon data.
      	if (response.getDataTable().getValue(0, current_datasource.col_no_polygon) &&
          	!isEmpty(response.getDataTable().getValue(0, current_datasource.col_no_polygon)) &&
          	!isBlank(response.getDataTable().getValue(0, current_datasource.col_no_polygon))) {
        	polygonBoundary = response.getDataTable().getValue(0, current_datasource.col_no_polygon);
        	// Evaluate the focus of a polygon in selected area for center map.
        	if (polygonBoundary) {
          		lat_lng = getLatLngFocusFromPolygonBoundary(polygonBoundary);
        	}
        	else {
          	// set default
  			lat_lng = new google.maps.LatLng(current_datasource.center_lat_lng[0],
  										current_datasource.center_lat_lng[1]);          	
        	}
        	
        	map.setCenter(lat_lng);
        	map.setZoom(current_datasource.partidoZoom);
        	
  			// Add a Circle overlay to the mini map.
//   			var mini_map_circle_options = {
//       			strokeColor: '#FF0000',
//       			strokeOpacity: 0.8,
//       			strokeWeight: 2,
//       			fillColor: '#FF0000',
//       			fillOpacity: 0.35,
//       			map: mini_map,
//       			center: lat_lng,
//       			radius: 7000 // 7000 m
//     		};
//     		mini_map_circles.push(new google.maps.Circle(mini_map_circle_options));    		
      	}
     
      	// Reset barrio info.
      	removeBarrioInfo();
      	current_datasource.filter.barrio_id = null;
  		current_datasource.filter.barrio_name = null;

		// Get family data.
        queryText = "SELECT sum(" + current_datasource.sql_families + ") " + 
        			"as families, count() FROM " + current_datasource.id + 
					where_clause;
					
        getFamilyNumber(reporting_level, queryText);

      	// Reinit selection for 'Barrio' search field.
      	initSearchFieldBarrio();
      	
      	// Reinit layer.
      	initLayer.setOptions( {
        	suppressInfoWindows: true, // Because we have a separate listener for that.
        	query: {
          		select: 'Poligon',
          		from: current_datasource.id
        	},
        		
   			styles: [ 
   				{
   					// All polygons without where clause.
    				polygonOptions: { 
    					fillColor: polygon_color_not_selected_area, // Color del plano
            			fillOpacity: 0.5,         	// Opacidad del plano
            			strokeColor: "#000000",   	// Color del margen
            			strokeOpacity: 0.5,       	// Opacidad del margen
            			strokeWeight: 1           	// Grosor del margen
    				}
  				}, 
  				{
    				where: where_clause_area_map,
    					polygonOptions: { 
    						fillColor: polygon_color_selected_area,	// Color del plano
            				fillOpacity: 0.5,         				// Opacidad del plano
            				strokeColor: "#000000",   				// Color del margen
            				strokeOpacity: 0.5,       				// Opacidad del margen
            				strokeWeight: 1           				// Grosor del margen
            			}
  				} 
  			]      		
      	} );
    	drawSupplyCharts(reporting_level, "map_page");
    } );
}

/** Find barrio data for selected barrio id. */
function findBarrioData() {
  	var latlngArr = [];
  	var lat_lng, lat, lng;
  	var comma1, comma2;
  	var codigo;

  	if (!current_datasource.filter.barrio_id) { return false; } 
	
	// In 2011 tables barrio id is defined as string so we have to prepare query string.
	if (current_datasource.year == '2011') {
		codigo = "'" + current_datasource.filter.barrio_id.toString() + "'";
	}
	else {
		codigo = parseInt(current_datasource.filter.barrio_id);
	}

    queryText = encodeURIComponent(
    		"SELECT * FROM " + 
    			current_datasource.id + 
    		" WHERE " + current_datasource.sql_codigo + " = " + codigo);
  	query = new google.visualization.Query(urlVizData + queryText);

	// Callback
    query.send( function(response) {
    	if (response.isError()) {
    		console.error('Function: findBarrioData()\n Error-msg: ' + 
    			response.getMessage() + ' ' + response.getDetailedMessage()
    		);
      		return;
    	}
    	
      	var numRows = response.getDataTable().getNumberOfRows();
      	// Barrio not found in data source.
      	if (!numRows) {
        	var msg = "El barrio " + "'" + barrio + "'" + " no se pudo encontrar.";
        	clearThis(document.getElementById("search_barrio_txt"));
        	return;
      	}

      	// Get numbers for info text.
      	reporting_level = is_reporting_level.barrio;
      	queryText = "SELECT sum(" + current_datasource.sql_families + ") " + 
      				"as families, count() FROM " + current_datasource.id +
    				" WHERE " + current_datasource.sql_codigo + " = " + codigo;

		// Theres no need for this call. We have to test and observe this.....
//     	getFamilyNumber(reporting_level, queryText);

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
		
		e.row[current_datasource.cols[0].name] = { value: response.getDataTable().getValue(0, 0) }; // barrio id
		e.row[current_datasource.cols[current_datasource.col_no_barrio].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_barrio) };
    	e.row[current_datasource.cols[current_datasource.col_no_other_name_barrio].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_other_name_barrio) };

    	e.row[current_datasource.cols[current_datasource.col_no_municipio].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_municipio) };
    	e.row[current_datasource.cols[current_datasource.col_no_localidad].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_localidad) };
    	e.row[current_datasource.cols[current_datasource.col_no_departamento].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_departamento) };
    	e.row[current_datasource.cols[current_datasource.col_no_partido].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_partido) };

    	e.row[current_datasource.cols[current_datasource.col_no_families].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_families) };
    	e.row[current_datasource.cols[current_datasource.col_no_start_year].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_start_year) };

    	e.row[current_datasource.cols[current_datasource.col_no_sewage].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_sewage) };
    	e.row[current_datasource.cols[current_datasource.col_no_water].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_water) };
    	e.row[current_datasource.cols[current_datasource.col_no_electrical].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_electrical) };
    	e.row[current_datasource.cols[current_datasource.col_no_gas].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_gas) };

		if ( current_datasource.year != '2011' ) {
			// Sewage
			e.row[current_datasource.cols[61].name] = { value: response.getDataTable().getValue(0, 61) };
			e.row[current_datasource.cols[62].name] = { value: response.getDataTable().getValue(0, 62) };
			e.row[current_datasource.cols[63].name] = { value: response.getDataTable().getValue(0, 63) };
			e.row[current_datasource.cols[64].name] = { value: response.getDataTable().getValue(0, 64) };
		
			// Water
			e.row[current_datasource.cols[67].name] = { value: response.getDataTable().getValue(0, 67) };
			e.row[current_datasource.cols[68].name] = { value: response.getDataTable().getValue(0, 68) };
			e.row[current_datasource.cols[69].name] = { value: response.getDataTable().getValue(0, 69) };
			e.row[current_datasource.cols[70].name] = { value: response.getDataTable().getValue(0, 70) };
			e.row[current_datasource.cols[71].name] = { value: response.getDataTable().getValue(0, 71) };

			// Electrical
			e.row[current_datasource.cols[55].name] = { value: response.getDataTable().getValue(0, 55) };
			e.row[current_datasource.cols[56].name] = { value: response.getDataTable().getValue(0, 56) };
			e.row[current_datasource.cols[57].name] = { value: response.getDataTable().getValue(0, 57) };
			e.row[current_datasource.cols[58].name] = { value: response.getDataTable().getValue(0, 58) };

			// Gas
			e.row[current_datasource.cols[80].name] = { value: response.getDataTable().getValue(0, 80) };
			e.row[current_datasource.cols[81].name] = { value: response.getDataTable().getValue(0, 81) };
			e.row[current_datasource.cols[82].name] = { value: response.getDataTable().getValue(0, 82) };
			e.row[current_datasource.cols[83].name] = { value: response.getDataTable().getValue(0, 83) };
		}
    	
    	e.row[current_datasource.cols[current_datasource.col_no_drains].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_drains) };
    	e.row[current_datasource.cols[current_datasource.col_no_street_lighting].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_street_lighting) };
    	e.row[current_datasource.cols[current_datasource.col_no_waste_collection].name] = { value: response.getDataTable().getValue(0, current_datasource.col_no_waste_collection) };

		issel_barrio.LatLng = null;
		issel_barrio.row = [];
		issel_barrio.LatLng = lat_lng;
		issel_barrio.row = e.row;
		
    	// Triggering'click'-event listener to display barrio map marker and data.
    	google.maps.event.trigger(initLayer, 'click', e);
    } );
	return true;
}

/** Municipio/Localidad search */
function initSearchFieldPartido() {
	// Prepare query string.
	var query = "SELECT " + 
        current_datasource.sql_municipio + ", " + 
        current_datasource.sql_localidad + 
        'FROM ' + current_datasource.id + 
        " GROUP BY " + current_datasource.sql_municipio + ", " + 
        current_datasource.sql_localidad;		
	var encodedQuery = encodeURIComponent(query);

    // Construct the URL.
    var urlType = urlEndpoint + 'query';
    var url = [urlType];
    url.push('?sql=' + encodedQuery);
    url.push('&key=' + API_KEY);
    url.push('&callback=?');

	$('#search_part_txt').autocomplete( {
		source: function(request, response) { 
			// Send the JSONP request using jQuery.
  			$.ajax( {
    			type: "GET",
    			url: url.join(''),
    			dataType: 'jsonp',
				contentType: "application/json",
    			error: function () { 
    				console.error("getFusionTableData(): Error in json-p call. Query was " + url);
    			},
        		success: function(data) {
            		var re = $.ui.autocomplete.escapeRegex(request.term);
            		var matcher = new RegExp( "^" + re, "i" );
            		getMunicipios(data);
            		response($.grep(municipios_cache, function(item) {
            			return matcher.test(item.label);
            		}));
         		} // end success:
  			}); // end $.ajax
		}, // end source:
		minLength: 1,
		select: function(event, ui) {
			// Check if selected string is a municipio/departamento...
			if (ui.item.label.indexOf(current_datasource.shortcut_municipio) != -1) {
				current_datasource.filter.municipio = ui.item.id;
				// Prepare where clause for barrio search.			
				where_mpio_name__eq__selected_name = " WHERE " + 
					current_datasource.sql_municipio + " = " + 
    				"'" + current_datasource.filter.municipio + "'";

				where_clause_area_map = current_datasource.sql_municipio + " = " + 
    									"'" + current_datasource.filter.municipio + "'";
    		}
			// or a localidad.
			else {
				current_datasource.filter.localidad = ui.item.id;							
				// Prepare where clause for barrio search.			
				where_loc_name__eq__selected_name = " WHERE " + 
					current_datasource.sql_localidad + " = " + 
    				"'" + current_datasource.filter.localidad + "'";

				where_clause_area_map = current_datasource.sql_localidad + " = " + 
    									"'" + current_datasource.filter.localidad + "'";
			}			
			setViewToPartido();
		}
	});
}

/** Barrio search */
function initSearchFieldBarrio() {
	// Prepare query string.
	// In case of a selected municipio/departamento or localidad a where clause is set.
	// So only dependent barrios are selectable for users.
	var query = "SELECT " + 
        current_datasource.sql_barrio_search_grp + 
        'FROM ' + current_datasource.id;

    if (current_datasource.filter.municipio) {
		query = query + where_mpio_name__eq__selected_name;    	
    }

    if (current_datasource.filter.localidad) {
		query = query + where_loc_name__eq__selected_name;    	
    }
	
	var encodedQuery = encodeURIComponent(query);

    // Construct the URL.
    var urlType = urlEndpoint + 'query';
    var url = [urlType];
    url.push('?sql=' + encodedQuery);
    url.push('&key=' + API_KEY);
    url.push('&callback=?');
	
	$('#search_barrio_txt').autocomplete( {
		source: function(request, response) { 
			// Send the JSONP request using jQuery.
  			$.ajax( {
    			type: "GET",
    			url: url.join(''),
    			dataType: 'jsonp',
				contentType: "application/json",
    			error: function () { 
    				console.error("getFusionTableData(): Error in json-p call. Query was " + url);
    			},
        		success: function(data) {
            		var re = $.ui.autocomplete.escapeRegex(request.term);
            		var matcher = new RegExp( "^" + re, "i" );
            		getBarrios(data);
            		response($.grep(barrios_cache, function(item) {
            			return matcher.test(item.label);
            		}));
         		} // end success:
  			}); // end $.ajax
		}, // end source:
		minLength: 0,
		select: function(event, ui) {
			current_datasource.filter.barrio_id = ui.item.id;
			current_datasource.filter.barrio_name = ui.item.label;			
			setViewToBarrio();			
		}
	});
}

/**
 * Removes all selection criterias from dependent objects.
 * Returns to starting position.
 *
 */
function removeAllPartidoSelections() {	
	var partido_filter = document.getElementById('search_part_txt')
  	if (!partido_filter.value) { 
  		removeAllBarrioSelections();
  		return; 
  	}

  	deleteOverlays();
  	initLayer.setMap(null);
  	delete initLayer;
  	initMapLayer();
  	initLayer.setMap(map);
	var lat_lng = new google.maps.LatLng(current_datasource.center_lat_lng[0],
  										current_datasource.center_lat_lng[1]);
  	map.setCenter(lat_lng);
 	map.setZoom(current_datasource.startZoom);
 	
 	// Remove circle from mini map.
//  	deleteCirclesFromMiniMap();

  	delete queryText;

  	// Remove filter settings.
	resetFilter();

  	removeAllBarrioSelections();

  	initSearchFieldPartido();
  	clearThis(document.getElementById('search_part_txt'));

  
	if (reporting_level != is_reporting_level.barrio) {
    	reporting_level = null;
  	}
}

/**
 * Removes all selection criterias from dependent objects.
 * Returns to starting position.
 */
function removeAllBarrioSelections() {
  	deleteOverlays();

	// If nothing is selected, we have to recenter the map.
	if (!current_datasource.filter.municipio && !current_datasource.filter.localidad) {
  		var lat_lng = new google.maps.LatLng(current_datasource.center_lat_lng[0],
  											current_datasource.center_lat_lng[1]);

    	map.setCenter(lat_lng);
    	map.setZoom(current_datasource.startZoom);
  	}

  	removeBarrioInfo();

  	// Remove filter settings.
  	current_datasource.filter.barrio_id = null;
  	current_datasource.filter.barrio_name = null;

  	if (reporting_level == is_reporting_level.barrio) {
    	reporting_level = null;
  	}

  	initSearchFieldBarrio();
  	clearThis(document.getElementById('search_barrio_txt'));
  	
  	setViewToPartido();
}

/** Remove all dependent texts of these from HTML-Objects. */
function removePartidoInfo() {
	var missing = "-";
}

/** Remove all dependent texts of these from HTML-Objects. */
function removeBarrioInfo() {
	var missing = "-";

	setBarrioDummyImage();

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

/** Shows detailed information about a barrio. */
function showBarrioInfo(e) {
	// Set selected barrio data.
	issel_barrio.LatLng = null;
	issel_barrio.row = [];
	issel_barrio.LatLng = e.lat_lng;
	issel_barrio.row = e.row;

	var missing = "-";
  	var no_info = "?";
  	var barrio_key = e.row[current_datasource.cols[0].name].value; // id or code!!!
  	var barrio = e.row[current_datasource.cols[current_datasource.col_no_barrio].name].value;
  	var other_name_barrio = e.row[current_datasource.cols[current_datasource.col_no_other_name_barrio].name].value;
  	var partido = e.row[current_datasource.cols[current_datasource.col_no_municipio].name].value;
  	var localidad = e.row[current_datasource.cols[current_datasource.col_no_localidad].name].value;
  	var families = e.row[current_datasource.cols[current_datasource.col_no_families].name].value;
  	var start_year = e.row[current_datasource.cols[current_datasource.col_no_start_year].name].value;

	var sewage = missing;
	var water = missing;
	var electrical = missing;
	var gas = missing;
	
	if (current_datasource.year == '2011') {
  		sewage = e.row[current_datasource.cols[current_datasource.col_no_sewage].name].value;
  		water = e.row[current_datasource.cols[current_datasource.col_no_water].name].value;
  		electrical = e.row[current_datasource.cols[current_datasource.col_no_electrical].name].value;
  		gas = e.row[current_datasource.cols[current_datasource.col_no_gas].name].value;
	}
	// Year 2013 and later.
	else {
		// Evaluate table columns.
		// Sewage
		var col61 = e.row[current_datasource.cols[61].name].value;
		var col62 = e.row[current_datasource.cols[62].name].value;
		var col63 = e.row[current_datasource.cols[63].name].value;
		var col64 = e.row[current_datasource.cols[64].name].value;
		
		if ( col61 == '1º lugar' ) sewage = sewage_txt[1];
		if ( col62 == '1º lugar' ) sewage = sewage_txt[2];
		if ( col63 == '1º lugar' ) sewage = sewage_txt[3];
		if ( col64 == '1º lugar' ) sewage = sewage_txt[4];
		
		// Water
		var col67 = e.row[current_datasource.cols[67].name].value;
		var col68 = e.row[current_datasource.cols[68].name].value;
		var col69 = e.row[current_datasource.cols[69].name].value;
		var col70 = e.row[current_datasource.cols[70].name].value;
		var col71 = e.row[current_datasource.cols[71].name].value;

		if ( col67 == '1º lugar' ) water = water_txt[1];
		if ( col68 == '1º lugar' ) water = water_txt[2];
		if ( col69 == '1º lugar' ) water = water_txt[3];
		if ( col70 == '1º lugar' ) water = water_txt[4];
		if ( col71 == '1º lugar' ) water = water_txt[5];

		// Electrical
		var col55 = e.row[current_datasource.cols[55].name].value;
		var col56 = e.row[current_datasource.cols[56].name].value;
		var col57 = e.row[current_datasource.cols[57].name].value;
		var col58 = e.row[current_datasource.cols[58].name].value;

		if ( col55 == '1º lugar' ) electrical = electrical_txt[1];
		if ( col56 == '1º lugar' ) electrical = electrical_txt[2];
		if ( col57 == '1º lugar' ) electrical = electrical_txt[3];
		if ( col58 == '1º lugar' ) electrical = electrical_txt[4];

		// Gas
		var col80 = e.row[current_datasource.cols[80].name].value;
		var col81 = e.row[current_datasource.cols[81].name].value;
		var col82 = e.row[current_datasource.cols[82].name].value;
		var col83 = e.row[current_datasource.cols[83].name].value;

		if ( col80 == '1º lugar' ) gas = gas_txt[1];
		if ( col81 == '1º lugar' ) gas = gas_txt[2];
		if ( col82 == '1º lugar' ) gas = gas_txt[3];
		if ( col83 == '1º lugar' ) gas = gas_txt[4];
	}
  	
  	var drains = e.row[current_datasource.cols[current_datasource.col_no_drains].name].value;
  	var street_lighting = e.row[current_datasource.cols[current_datasource.col_no_street_lighting].name].value;
  	var waste_collection = e.row[current_datasource.cols[current_datasource.col_no_waste_collection].name].value;
  	var barrio_id = document.getElementById('barrio_id');

	current_datasource.filter.barrio_id = barrio_key; // barrio id or code

	// In 2011 tables barrio id is defined as string so we have to prepare query string.
	var codigo;
	if (current_datasource.year == '2011') {
		codigo = "'" + current_datasource.filter.barrio_id.toString() + "'";
	}
	else {
		codigo = parseInt(current_datasource.filter.barrio_id);
	}

	
	setBarrioImage(codigo);
	
  	if (barrio)	barrio_id.innerHTML = barrio;
  	else		barrio_id.innerHTML = missing;
	
  	var other_name_barrio_id = document.getElementById('other_name_barrio_id');
  	if (other_name_barrio)	other_name_barrio_id.innerHTML = other_name_barrio;
  	else					other_name_barrio_id.innerHTML = missing;

  	var partido_id = document.getElementById('partido_id');
  	if (partido)	partido_id.innerHTML = partido;
  	else 			partido_id.innerHTML = missing;

  	var localidad_id = document.getElementById('localidad_id');
  	if (localidad)	localidad_id.innerHTML = localidad;
  	else			localidad_id.innerHTML = missing;

  	var families_id = document.getElementById('families_id');
  	if (families)	families_id.innerHTML = parseInt(families, 10).format();
  	else			families_id.innerHTML = missing;

  	var start_year_id = document.getElementById('start_year_id');
  	if (start_year)	start_year_id.innerHTML = start_year;
  	else			start_year_id.innerHTML = missing;

  	var sewage_id = document.getElementById('sewage_id');
  	if (sewage)	sewage_id.innerHTML = sewage;
  	else		sewage_id.innerHTML = missing;

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
//	current_datasource.filter.municipio = partido; // ???????????? CHECK!!!!!
//	current_datasource.filter.localidad = localidad;
	current_datasource.filter.barrio_name = barrio;

  	reporting_level = is_reporting_level.barrio;
  	queryText = "SELECT sum(" + current_datasource.sql_families + ") " + 
  				"as families, count() FROM " + current_datasource.id +
    			" WHERE " + current_datasource.sql_codigo + " = " + codigo + 
    			" AND " + current_datasource.sql_barrio + " = " + 
    				"'" + current_datasource.filter.barrio_name + "'";

  	getFamilyNumber(reporting_level, queryText);
}

/** Show different images in response to good/bad criteria. */
function setYesNoHTMLMarker(bool) {
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

/**
 * Add markers to the map
 * Marker sizes are expressed as a Size of X,Y
 * where the origin of the image (0,0) is located
 * in the top left of the image.
 */
function placeMarker(map, location, marker_icon, marker_shadow, to_stack) {
	// Origins, anchor positions and coordinates of the marker
  	// increase in the X direction to the right and in
  	// the Y direction down.
  	var image = new google.maps.MarkerImage(marker_icon,
    	// The size of the marker.
    	new google.maps.Size(32, 32),
    	// The origin for this image.
    	new google.maps.Point(0, 0),
    	// The anchor for this image.
    	new google.maps.Point(10, 32)
    );

  	var shadow = new google.maps.MarkerImage(marker_shadow,
    	// The shadow image is larger in the horizontal dimension.
      	new google.maps.Size(49, 32),
      	new google.maps.Point(0, 0),
      	new google.maps.Point(18, 32)
    );

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
		//shape: shape,
    	map: map
  	});

  	// Set marker to map.
  	if (to_stack == true) {
  		markers.push(marker);
  	}
  
  	// Set marker to the map's center.
  	map.setCenter(location);

  	return marker;
}

/** Deletes all markers in the array by removing references to them. */
function deleteOverlays() {
	var i;
  	if (markers) {
    	for (i=0; i<markers.length; i++) {
      		markers[i].setMap(null);
    	}
    	markers.length = 0;
  	}
}

/** Delete all circles from mini map. */
function deleteCirclesFromMiniMap() {
	var i;
  	if (mini_map_circles) {
    	for (i=0; i<mini_map_circles.length; i++) {
      		mini_map_circles[i].setMap(null);
    	}
    	mini_map_circles.length = 0;
  	}
}

/** Prepare charts with data. */
function drawSupplyCharts(reporting_level, page) {
	// Prepare charts with values.
  	//
  	// Prepare queries in response of view level.
  	// Order of if-statements below is important!!! From barrio to provincia!
  	var where_clause;
  	var chart_base;
  
  	if (reporting_level == is_reporting_level.barrio && 
  		current_datasource.filter.municipio) {
    	where_clause = where_mpio_name__eq__selected_name;
    	chart_base = current_datasource.filter.municipio;
  	}
  	else if (reporting_level == is_reporting_level.localidad && 
  			current_datasource.filter.barrio_id) {
    		where_clause = where_loc_name__eq__selected_name;
    		chart_base = current_datasource.filter.municipio;
  	}
  	else if (reporting_level == is_reporting_level.municipio && 
  			current_datasource.filter.barrio_id) {
    	where_clause = where_mpio_name__eq__selected_name;
    	chart_base = current_datasource.filter.municipio;
  	}
  	else if(reporting_level == is_reporting_level.localidad) {
    	where_clause = where_loc_name__eq__selected_name; 
    	chart_base = current_datasource.filter.localidad;
  	}
  	else if(reporting_level == is_reporting_level.municipio) {
    	where_clause = where_mpio_name__eq__selected_name; 
    	chart_base = current_datasource.filter.municipio;
  	}
  	else if(reporting_level = is_reporting_level.provincia) {
    	where_clause = null;
    	chart_base = is_reporting_level.provincia;
  	}
  	else {
    	where_clause = null;
    	chart_base = is_reporting_level.provincia;
  	}
	
	if (current_datasource.key.indexOf("2013") == -1) { // 2011 only...
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
	  
	  // --------------------
	  // Proceeding for 2011.
	  // --------------------
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
// 			info_text_charts.innerHTML = "Diagramas para <strong>" + chart_base + "</strong>";
			info_text_charts.innerHTML = "Acceso a los servicios b&aacute;sicos";
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
	//	-----------------------------------------
	//	Proceeding for 2013 and following years.
	//	-----------------------------------------
	else {
	  	// Legend for charts only for map page.
	  	if (page == 'map_page') {
			var info_text_charts = document.getElementById('info_text_charts');
// 			info_text_charts.innerHTML = "Diagramas para <strong>" + chart_base + "</strong>";
			info_text_charts.innerHTML = "Acceso a los servicios b&aacute;sicos";
	  	}

		if (where_clause) {
			// Draw 'sewage' chart.
			getFusionTableData("select 'col61', 'col62', 'col63', 'col64' from " + current_datasource.id + where_clause, set_sewage_chart);
			// Draw 'water' chart.
			getFusionTableData("select 'col67', 'col68', 'col69', 'col70', 'col71' from " + current_datasource.id + where_clause, set_water_chart);
			// Draw 'electrical' chart.
			getFusionTableData("select 'col55', 'col56', 'col57', 'col58' from " + current_datasource.id + where_clause, set_electrical_chart);
			// Draw 'gas' chart.
			getFusionTableData("select 'col80', 'col81', 'col82', 'col83' from " + current_datasource.id + where_clause, set_gas_chart);
	  	}
	  	else {
			// Draw 'sewage' chart.
			getFusionTableData("select 'col61', 'col62', 'col63', 'col64' from " + current_datasource.id, set_sewage_chart);
			// Draw 'water' chart.
			getFusionTableData("select 'col67', 'col68', 'col69', 'col70', 'col71' from " + current_datasource.id, set_water_chart);
			// Draw 'electrical' chart.
			getFusionTableData("select 'col55', 'col56', 'col57', 'col58' from " + current_datasource.id, set_electrical_chart);
			// Draw 'gas' chart.
			getFusionTableData("select 'col80', 'col81', 'col82', 'col83' from " + current_datasource.id, set_gas_chart);
	  	}
	}
}

/** Draws a chart on given page. */
function draw_chart(chartObject) {
	var chart = google.visualization.drawChart( {
    	"containerId": chartObject["containerID"],
    	"dataSourceUrl": chartObject["dataSourceUrl"],
    	"query": chartObject["query"],
    	"chartType": chartObject["chartType"],
    	"options": chartObject["options"]
  	} );
}

/** 
 * Get and show info text of families.
 * Display depends on reporting level.
 * Levels are: Provincia, Municipio/Localidad and Barrio.
 *
 */
function getFamilyNumber(reporting_level, queryText) {
	
	// Special case for Buenos Aires.
	if ( (/^buenos_aires_2013/).test(current_datasource.key) && 
		reporting_level == is_reporting_level.provincia ) {
		queryText = "SELECT 'Departamento', sum(" + current_datasource.sql_families + ")" + 
					" as families, count() FROM " + current_datasource.id +
    				" GROUP BY 'Departamento'";	
	}

	var info_text_reporting_level = document.getElementById('info_text_reporting_level');
  	query = new google.visualization.Query(urlVizData + queryText);

  	query.send(function(response) {
    	if (response.isError()) {
			console.error('getFamilyNumber(): Error in query: ' + 
      						response.getMessage() + ' ' + 
      						response.getDetailedMessage()
      		);
      		return;
    	}

	    var	results = [];
	    
	    // Special case for Buenos Aires.
	    var tot_familias_caba = 0;
	    var tot_barrios_caba = 0;
	    var tot_familias_not_caba = 0;
	    var tot_barrios_not_caba = 0;
	    
    	var numRows = response.getDataTable().getNumberOfRows();
    	// Search criteria not found in data source.
    	if (!numRows) {
        	var msg = "La selecci&oacute;n no se pudo encontrar.";
        	return;
    	}
    
    	// Special case for Buenos Aires.
    	if ( (/^buenos_aires_2013/).test(current_datasource.key) && 
    			reporting_level == is_reporting_level.provincia ) {
    		for(var i=0; i<numRows; i++) {
    			if ( response.getDataTable().getValue(i, 0) != 'CABA' ) {
					tot_familias_not_caba += response.getDataTable().getValue(i, 1);
					tot_barrios_not_caba += response.getDataTable().getValue(i, 2);
    			}
    			// CABA
    			else {
					tot_familias_caba += response.getDataTable().getValue(i, 1);
					tot_barrios_caba += response.getDataTable().getValue(i, 2);  			
    			}
    		}
			
		}
		else {
    		for(var i=0; i<numRows; i++) {
      			results.push(response.getDataTable().getValue(i, 0));
      			results.push(response.getDataTable().getValue(i, 1));
    		}
    	}


		// Value tests:
// 		console.debug("getFamilyNumber() ->");
// 		console.debug("SQL query: " + queryText);
//      	console.debug("Reporting level: " + reporting_level);
//      	if ( (/^buenos_aires_2013/).test(current_datasource.key) && 
//     			reporting_level == is_reporting_level.provincia ) {
// 
//     			console.debug("Families/Barrios Bs As: " +
//     				tot_familias_not_caba + " " + 
//     				tot_barrios_not_caba + " " +
//     				tot_familias_caba + " " +
//     				tot_barrios_caba
//     			);
//     	}
//     	else {
// 			console.debug("Families: " + results[0]);
// 			console.debug("Barrios: " + results[1]);
// 		}
// 		console.debug("<- getFamilyNumber()");

    	
    	// Distinction of singular and plural use of texts in response to numbers.
    	var villa_text = "asentamientos informales";
    	var familia_text = "familias";
		var living_text = "residen";

    	// Special case for Buenos Aires.
    	var villa_caba_text = "asentamientos informales";
    	var familia_caba_text = "familias";
		var living_caba_text = "residen";
    	
    	var villa_not_caba_text = "asentamientos informales";
    	var familia_not_caba_text = "familias";
		var living_not_caba_text = "residen";

    	if ( (/^buenos_aires_2013/).test(current_datasource.key) && 
    			reporting_level == is_reporting_level.provincia ) {
			if ( parseInt(tot_barrios_not_caba, 10).format() == '1' ) {
				villa_not_caba_text = "asentamiento informal";
			}

			if ( parseInt(tot_familias_not_caba, 10).format() == '1' ) {
				living_not_caba_text = "reside";
				familia_not_caba_text = "familia";
			}

			if ( parseInt(tot_barrios_caba, 10).format() == '1' ) {
				villa_caba_text = "asentamiento informal";
			}

			if ( parseInt(tot_familias_caba, 10).format() == '1' ) {
				living_caba_text = "reside";
				familia_caba_text = "familia";
			}
		}
		else {		
			if ( parseInt(results[1], 10).format() == '1' ) {
				villa_text = "asentamiento informal";
			}

			if ( parseInt(results[0], 10).format() == '1' ) {
				living_text = "reside";
				familia_text = "familia";
			}
		}
		
		// Set info texts.
    	var html, municipio;
    	switch(reporting_level) {
    		// Provincia
      		case is_reporting_level.provincia:
    			// Special case for Buenos Aires.
      		    if ( (/^buenos_aires_2013/).test(current_datasource.key) ) {
					html = "En la Provinica de Buenos Aires hay <strong>" + 
					parseInt(tot_barrios_not_caba, 10).format() + 
					"</strong> asentamientos informales y en la " + 
					"Ciudad Aut&oacute;noma hay <strong>" + 
					parseInt(tot_barrios_caba, 10).format() + 
					"</strong>, en los que residen <strong>" + 
					parseInt(tot_familias_not_caba, 10).format() + 
					"</strong> y <strong>" + parseInt(tot_familias_caba, 10).format() + 
					"</strong> respectivamente.";
				}
				else {
					html = current_datasource.provincia_prefix_text + "&nbsp;" +
					"<strong>" + parseInt(results[1], 10).format() + "</strong>" +
					"&nbsp;" + villa_text + ", en los que " + living_text + "&nbsp;" +
					"<strong>" + parseInt(results[0], 10).format() + "</strong>" +
					"&nbsp;" + familia_text + ".";
				}
        	break;

			// Municipio => same level as localidad (synonymous).
      		case is_reporting_level.municipio:
        		html = "En el " + current_datasource.alias_municipio + " de " + 
        		"<strong>" + current_datasource.filter.municipio + "</strong> hay&nbsp;" +
        		"<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        		"&nbsp;" + villa_text + ", en los que " + living_text + "&nbsp;" +
        		"<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        		"&nbsp;" + familia_text + ".";
        	break;
      
			// Localidad => same level as municipio (synonymous).
      		case is_reporting_level.localidad:
        		html = "En la " + current_datasource.alias_localidad + " de " + 
        		"<strong>" + current_datasource.filter.localidad + "</strong> hay&nbsp;" +
        		"<strong>" + parseInt(results[1], 10).format() + "</strong>" +
        		"&nbsp;" + villa_text + ", en los que " + living_text + "&nbsp;" +
        		"<strong>" + parseInt(results[0], 10).format() + "</strong>" +
        		"&nbsp;" + familia_text + ".";
        	break;

			// Barrio			
			case is_reporting_level.barrio:
				html = "En el barrio <strong>" + 
				current_datasource.filter.barrio_name +
				"</strong>" + "&nbsp;de&nbsp;" + "<strong>" + 
				issel_barrio.row[current_datasource.cols[current_datasource.col_no_localidad].name].value + 
				"</strong>" + "&nbsp;" + living_text + ",&nbsp;aproximadamente,&nbsp;" +
				"<strong>" + parseInt(results[0], 10).format() + "</strong>" +
				"&nbsp;" + familia_text + ".";
        	break;
    	}
    	info_text_reporting_level.innerHTML = html;
  	});
}

/////////////////////////////////////////////////////////////////////
// Public functions for global using.
/////////////////////////////////////////////////////////////////////

/** For checking if a string is empty, null or undefined. */
function isEmpty(str) {
	return (!str || 0 === str.length);
}

/** For checking if a string is blank, null or undefined. */
function isBlank(str) {
	return (!str || /^\s*$/.test(str));
}

/** Clears text in a text field, when the user clicks on it. */
function clearThis(target) {
	target.value= "";
}

function doAction(e, obj) {
	var keyCode = e ? (e.which ? e.which : e.keyCode) : event.keyCode;
  	// For enter...
  	if (keyCode == 13) {
    	if (obj.id == 'search_part_txt') {
      		//setViewToPartido();
      		return false;
    	}

    	if (obj.id == 'search_barrio_txt') {
      		//setViewToBarrio();
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

/** Strips duplicates in an array away. */
// Array.prototype.unique = function() {
//   var obj = {};
//   var tmp = [];
//   var i;
//   for(i = 0 ; i < this.length; i++) obj[this[i]] = true;
//   for(i in obj) tmp[tmp.length] = i;
//   return tmp;
// };

Number.decPoint = ',';
Number.thousand_sep = '.';

/*
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
*/
Number.prototype.format = function(k, fixLength) {
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

/**
 * IE detection
 * Returns the version of Internet Explorer or -1 if not IE.
 *
 */
function getInternetExplorerVersion() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    	if (re.exec(ua) != null) {
        	rv = parseFloat( RegExp.$1 );
    	}
    }
    return rv;
}

/**
 * Copyright (c) Mozilla Foundation http://www.mozilla.org/
 * This code is available under the terms of the MIT License
 */
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function") {
            throw new TypeError();
        }

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this) {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}
