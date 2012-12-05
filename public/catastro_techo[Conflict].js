/*
  Project:    Catastro Techo
  Subject:    Geographic Information System
  Objective:  Establish an interactive, web-based platform with information
              and analysis for the comprehensive description of the geometric
              location, structures, people and infrastructure of all the poor
              districts of the Buenos Aires province.
  Code type:  Business coding
  Copyright:  2012 Techo http://www.techo.org/ All Rights Reserved.
  Author:     Written by Andreas Hempfling <andreas.hempfling@gmail.com>.
              from 09/2012 to 12/2012.
*/

/////////////////////////////////////////////////////////////////////
// Init all necessary stuff.
/////////////////////////////////////////////////////////////////////

// Load the Visualization API library and the chart libraries using 'Spanish' locale.
google.load('visualization', '1', { 'packages' : ['table', 'corechart'], 'language': 'es' } );

// Data source
// Google Fusion Table
// Url
var dataSourceUrl = 'http://www.google.com/fusiontables/gvizdata?tq=';
// Numeric ID - Notice: Table have to be 'public'.
var dataSourceNumericID = '2338632';
// Encrypted ID
var dataSourceEncryptedID ='1ePInQ8wuWBsfXcXczd0j3bp7qFFw2v-tXn_g_Rw';
// API key to identify the project. User data access is not need therefor.
var apiKey = 'AIzaSyCWCIwiL5K8HWRhsaxQtHJ6dKRoojCv7ig';
// Query components
var query;
var queryText;
var queryUrl = ['https://www.googleapis.com/fusiontables/v1/query'];
var queryEncoded;

// Filter criteria
var filter = {
  criteria : []
};

filter.criteria['region'] = { value: 'metropolitania'};
filter.criteria['provincia'] = { value: 'buenos aires'};
filter.criteria['municipio'] = { value: null};
filter.criteria['partido'] = { value: null};
filter.criteria['localidad'] = { value: null};
filter.criteria['barrio'] = { value: null};

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

/////////////////////////////////////////////////////////////////////
//  Initializers for web pages.
/////////////////////////////////////////////////////////////////////

function initIndexPage() {
  //
  // Initialize index.html page when it is called.
  // by function setOnLoadCallback() at the page.

  // Draw supply charts
  // 1. Desagües cloacales
  // no cuenta con desagües cloacales / have no sewage
  // 2. Red pública
  // tiene acceso al agua potable a través de la red pública / have access to potable water through the public network
  // 3. Sistema eléctrico
  // tiene conexión regular al sistema eléctrico / have regular connection to the electrical system
  // 4. Red de gas
  // tiene acceso a la red de gas / have access to the gas network
  drawSupplyCharts(escala["metropolitana"], "index_page");
}

function initMapBarriosPage() {
  //
  // Initialize map page with barrios for first use.
  //
  map = new google.maps.Map(document.getElementById('map_canvas'), {
    center: barrios_bsas,
    zoom: 10,
    minZoom: 9,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: false
  } );

  initMapLayer();
  initLayer.setMap(map);

  // Init 'Barrio' search field.
  initSearchFieldBarrio();

  // Init 'Partido' search field.
  initSearchFieldPartido();

  // Show metropolitana data (all data).
  setViewToMetropolitana();
}

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
  //
  //

}

function initTableBarriosPage() {
  //
  // Initialize table page.
  //
  options = {'pageSize': 25};
  changeTableData();
}

/////////////////////////////////////////////////////////////////////
//
/////////////////////////////////////////////////////////////////////

function initMapLayer() {
  //
  // Updating Fusion Table Layer.
  //
  initLayer = new google.maps.FusionTablesLayer( {
    suppressInfoWindows: true, // Because we have a separate listener for that.
    query: {
      select: 'Poligon',
      from: dataSourceNumericID
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
      lng = latlngArr[i].substring(comma1+1, comma2-1);
      bounds.extend(new google.maps.LatLng(lat, lng));
    }

  lat_lng = bounds.getCenter();

  // CHECK !!!!!!!!!!!!!!!!!!!!!!!! - NOT YET CORRECT !!!!!!!!!!!!
  // CHECK !!!!!!!!!!!!!!!!!!!!!!!! - NOT YET CORRECT !!!!!!!!!!!!
  // CHECK !!!!!!!!!!!!!!!!!!!!!!!! - NOT YET CORRECT !!!!!!!!!!!!
  // Workaround - changes of coordinates lat to lng and vice versa.
  // Otherwise we get a wrong position here.
  latlngArr = polygonBoundary.split(',');
  lat = latlngArr[1];
  lng = latlngArr[0];
  lat_lng = new google.maps.LatLng(lat, lng);
  result = lat_lng;

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
    queryText = encodeURIComponent("SELECT * FROM " + dataSourceNumericID + where_clause);
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

      if (response.getDataTable().getValue(0, 2) &&
          !isEmpty(response.getDataTable().getValue(0, 2)) &&
          !isBlank(response.getDataTable().getValue(0, 2))) {
        polygonBoundary = response.getDataTable().getValue(0, 2);
        // Evaluate the focus of a polygon in selected area for center map.
        if (polygonBoundary) {
          lat_lng = getLatLngFocusFromPolygonBoundary(polygonBoundary);
        }
        else {
          // set default
          lat_lng = barrios_bsas;
        }
        map.setCenter(lat_lng);
        map.setZoom(11);
     }
    } );

    if (area_choice) {
      // Set where clause for map and get numbers for info text.
      var where_clause_area_map;
      switch(area_choice.toUpperCase()) {
        case 'P':
          filter.criteria['municipio'] = { value: choice};
          filter.criteria['partido'] = { value: choice};
          where_clause_area_map = "'PARTIDO' = " + "'" + choice + "'";
          queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID + " WHERE " + where_clause_area_map;
          getFamilyNumber(escala["municipio"], queryText);
          break;
        case 'L':
          filter.criteria['localidad'] = { value: choice};
          where_clause_area_map = "'LOCALIDAD' = " + "'" + choice + "'";
          queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID + " WHERE " + where_clause_area_map;
          getFamilyNumber(escala["localidad"], queryText);
          break;
        //default:
        // not set...
      }

      // Reinit selection for 'Barrio' search field.
      delete queryText;
      queryText = encodeURIComponent(
        "SELECT 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO' " +
        "FROM " + dataSourceNumericID +
        " WHERE " + where_clause_area_map +
        " GROUP BY 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO'");
      initSearchFieldBarrio(queryText);

      // Reinit layer.
      initLayer.setOptions({
        suppressInfoWindows: true, // Because we have a separate listener for that.
        query: {
          select: 'Poligon',
          from: dataSourceNumericID
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
  }
}

function findBarrioData() {
  //
  // Find Barrio via text search.
  //
  // Init - alert message box should be closed.
  $(".alert").alert('close');
  var latlngArr = [];
  var lat_lng, lat, lng;
  var comma1, comma2;

  // Check text search field for manually search first.
  var barrio = document.getElementById('search_txt').value;

  if (barrio) {
    // Extract parentheses, if necessary.
    if (barrio.indexOf("(") >= 0) {
      barrio = (barrio.substring(0, barrio.indexOf("(")-1)).trim();
    }
    queryText = encodeURIComponent(
            "SELECT * FROM " + dataSourceNumericID + " WHERE 'NOMBRE DEL BARRIO' = '" + barrio + "'");
    query = new google.visualization.Query(dataSourceUrl + queryText);

    query.send(function(response) {
      var numRows = response.getDataTable().getNumberOfRows();
      // Barrio not found in data source.
      if (!numRows) {
        var msg = "El barrio " + "'" + barrio + "'" + " no se pudo encontrar.";
        bootstrap_alert.warning(msg);
        clearThis(document.getElementById("search_txt"));
        return;
      }

      // Get numbers for info text.
      filter.criteria['barrio'] = { value: barrio};

      queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID +
                  " WHERE 'NOMBRE DEL BARRIO' = '" + barrio + "'";
      getFamilyNumber(escala["barrio"], queryText);

      // Extract polygon data from table.
      var polygonBoundary = response.getDataTable().getValue(0, 2);
      lat_lng = getLatLngFocusFromPolygonBoundary(polygonBoundary);

      // e only has four properties, "infoWindowHtml", "latLng", "pixelOffset" and "row".
      var e = {
        infoWindowHtml: null,
        latLng: lat_lng,
        pixelOffset: null,
        row : []
      };

      e.row['NOMBRE DEL BARRIO'] = { value: response.getDataTable().getValue(0, 0) };
      e.row['OTRO NOMBRE DEL BARRIO'] = { value: response.getDataTable().getValue(0, 1) };
      e.row['PARTIDO'] = { value: response.getDataTable().getValue(0, 4) };
      e.row['LOCALIDAD'] = { value: response.getDataTable().getValue(0, 5) };
      e.row['NRO DE FLIAS'] = { value: response.getDataTable().getValue(0, 9) };
      e.row['AÑO DE CONFORMACIÓN DEL BARRIO'] = { value: response.getDataTable().getValue(0, 6) };
      e.row['RED CLOACAL'] = { value: response.getDataTable().getValue(0, 14) };
      e.row['AGUA'] = { value: response.getDataTable().getValue(0, 15) };
      e.row['ACCESO A LA ENERGÍA'] = { value: response.getDataTable().getValue(0, 13) };
      e.row['GAS'] = { value: response.getDataTable().getValue(0, 17) };
      e.row['DESAGÜES PLUVIALES'] = { value: response.getDataTable().getValue(0, 18) };
      e.row['ALUMBRADO PÚBLICO'] = { value: response.getDataTable().getValue(0, 19) };
      e.row['RECOLECCIÓN DE RESIDUOS'] = { value: response.getDataTable().getValue(0, 20) };

      // Triggering'click'-event listener to display barrio map marker and data.
      google.maps.event.trigger(initLayer, 'click', e);
      barrioFilter = true;
    } );
  }
}

function initSearchFieldBarrio(queryText) {
  //
  // Autocompletition via jQuery for Barrio search field.
  //
  if (partidoFilter == false) {
    queryText = encodeURIComponent(
            "SELECT 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO' " +
            'FROM ' + dataSourceNumericID + " GROUP BY 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO'");
  }

  query = new google.visualization.Query(dataSourceUrl + queryText);

  query.send(function(response) {
    if (response.isError()) {
      alert('initSearchFieldBarrio(): Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
      return;
    }

    var numRows = response.getDataTable().getNumberOfRows();
    // Create the list of results for display of autocomplete.
    var results = [];
    for(var i=0; i<numRows; i++) {
      // Check for an 'Barrio' alias.
      if (response.getDataTable().getValue(i, 1)) {
        results.push(response.getDataTable().getValue(i, 0) + " (" +response.getDataTable().getValue(i, 1) +")");
      }
      else {
        results.push(response.getDataTable().getValue(i, 0));
      }
    }

    // Use the results to create the autocomplete options.
    $('#search_txt').autocomplete( {
      source: results,
      minLength: 1,
      maxHeight:100,
      zIndex: 4000
    } );
  } );
}

function initSearchFieldPartido() {
  //
  // Autocompletition via jQuery for Partido/Localidad search field.
  //
  // Retrieve the unique names of 'municipios' using GROUP BY workaround.
 queryText = encodeURIComponent(
            "SELECT 'PARTIDO', 'LOCALIDAD' " +
            'FROM ' + dataSourceNumericID + " GROUP BY 'PARTIDO', 'LOCALIDAD'");
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
      maxHeight:100,
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
  removeBarrioInfo();
  initSearchFieldBarrio();
  initSearchFieldPartido();
  clearThis(document.getElementById('search_part_txt'));
  filter.criteria['municipio'] = { value: null};
  filter.criteria['partido'] = { value: null};
  filter.criteria['localidad'] = { value: null};

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
  //initLayer.setMap(null);
  //delete initLayer;
  //initMapLayer();
  //initLayer.setMap(map);

  if (partidoFilter == false) {
    map.setCenter(barrios_bsas);
    map.setZoom(10);
  }

  removeBarrioInfo();

  if (queryText === undefined) {
    initSearchFieldBarrio();
  }
  else {
    initSearchFieldBarrio(queryText);
  }
  filter.criteria['barrio'] = { value: null};
  clearThis(document.getElementById('search_txt'));
}

function changeTableData(scorer) {
  // Set the query using the parameter
//  var whereClause = "";
//  if ( scorer ) {
//    whereClause =  " WHERE 'Scoring Team' = '" + scorer + "'";
//  }

/*
                                     'NOMBRE DEL BARRIO', \
                                     'OTRO NOMBRE DEL BARRIO', \
                                     'PARTIDO', \
                                     'LOCALIDAD', \
                                     'AÑO DE CONFORMACIÓN DEL BARRIO', \
                                     'MODALIDAD EN LA QUE SE CONSTITUYÓ EL BARRIO', \
                                     'AÑO DE MAYOR CRECIMIENTO', \
                                     'NRO DE FLIAS', \
                                     'AGUA', \
                                     'PROVISIÓN DE AGUA', \
                                     'GAS', \
                                     'DESAGÜES PLUVIALES', \
                                     'ALUMBRADO PÚBLICO', \
                                     'RECOLECCIÓN DE RESIDUOS' \

*/
  var queryText = encodeURIComponent("SELECT * \
                                     FROM " + dataSourceNumericID );
  query = new google.visualization.Query(dataSourceUrl + queryText);

  //set the callback function
  query.send(getData);
}

function getData(response) {
  //
  // Callback function, this is called when the results are returned
  //
  var table = new google.visualization.Table(document.getElementById('table_div') );
  //var tableQueryWrapper = new TableQueryWrapper(query, container, options);
  var view = new google.visualization.DataView(response.getDataTable());
  view.setColumns([0, 1, 4, 5, 6, 8, 9, 15, 16, 17, 18, 19, 20]);
  table.draw(view, { showRowNumber: true } );
  //table.draw(response.getDataTable(), { showRowNumber: false, 'view': { 'columns': [1, 2, 3, 4] } } );
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
  barrio_id.innerHTML = missing;

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

  queryText = "SELECT sum('NRO DE FLIAS') as familias, count() FROM " + dataSourceEncryptedID +
              " WHERE 'NOMBRE DEL BARRIO' = '" + barrio + "'";
  getFamilyNumber(escala["barrio"], queryText);
}

function setYesNoHTMLMarker(bool) {
  //
  // Show different images in response to good/bad criteria.
  //
  if (bool)
    result = '<img src="/images/up.png"/>';
  else
    result = '<img src="/images/down.png"/>';
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
  marker = new google.maps.Marker( {
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
}

function deleteOverlays() {
  //
  // Deletes all markers in the array by removing references to them.
  //
  var i;
  if (markers) {
    for (var i=0; i<markers.length; i++) {
      markers[i].setMap(null);
    }
    markers.length = 0;
  }
}

function drawSupplyCharts(view, page) {
  //
  //
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
  charts.sewage.query = { value: "SELECT 'RED CLOACAL' FROM " + dataSourceNumericID };
  charts.sewage.chartType = { value: "PieChart" };
  charts.sewage.containerID = { value: "sewage_chart_div" };
  charts.sewage.dataSourceUrl = { value: dataSourceUrl };

  charts.water.query = { value: "SELECT 'AGUA' FROM " + dataSourceNumericID };
  charts.water.chartType = { value: "PieChart" };
  charts.water.containerID = { value: "water_chart_div" };
  charts.water.dataSourceUrl = { value: dataSourceUrl };

  charts.electrical.query = { value: "SELECT 'ACCESO A LA ENERGÍA' FROM " + dataSourceNumericID };
  charts.electrical.chartType = { value: "PieChart" };
  charts.electrical.containerID = { value: "electrical_chart_div" };
  charts.electrical.dataSourceUrl = { value: dataSourceUrl };

  charts.gas.query = { value: "SELECT 'GAS' FROM " + dataSourceNumericID };
  charts.gas.chartType = { value: "PieChart" };
  charts.gas.containerID = { value: "gas_chart_div" };
  charts.gas.dataSourceUrl = { value: dataSourceUrl };

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
            width: 330,
            height: 140,
            chartArea: {left:20,top:6,width:"75%",height:"85%"}
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
  //
  //
  google.visualization.drawChart( {
    "containerId": chartObject["containerID"],
    "dataSourceUrl": chartObject["dataSourceUrl"],
    "query": chartObject["query"],
    "chartType": chartObject["chartType"],
    "options": chartObject["options"]
  } );
}

function getPartidos() {
  //
  //
  //
  query = "SELECT 'PARTIDO', count() FROM " + dataSourceEncryptedID + " GROUP BY 'PARTIDO'";
  queryEncoded = encodeURIComponent(query);

  setQueryUrl();

  // Send JSONP request using jQuery
  $.ajax( {
    url: queryUrl.join(''),
    dataType: 'jsonp',
    cache: false,
    success: function (partido_data) {
      var rows = partido_data['rows'];
      var elements = rows.length;
      var number_of_partidos = document.getElementById('number_of_partidos');
      number_of_partidos.innerHTML = elements.format();
    }
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

    if (parseInt(results[1], 10).format() == 1) {
      villa_text = "villa y asentamiento";
    }

    if (parseInt(results[0], 10).format() == 1) {
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
