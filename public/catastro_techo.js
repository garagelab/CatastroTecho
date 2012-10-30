/*
  Project:    Catastro Techo
  Subject:    Geographic Information System
  Objective:  Establish an interactive, web-based platform with information
              and analysis for the comprehensive description of the geometric
              location, structures, people and infrastructure of all the poor
              districts of the Buenos Aires province.
  Copyright:  2012 Techo http://www.techo.org/ All Rights Reserved.
  Author:     Written by Andreas Hempfling <andreas.hempfling@gmail.com>.
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

var view_sequence = {
  "region" : "Region",
  "provincia" : "Provincia",
  "municipio" : "Municipio",
  "partido" : "Partido",
  "localidad" : "Localidad",
  "barrio" : "Barrio"
};

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

/////////////////////////////////////////////////////////////////////
//  Initializers for web pages.
/////////////////////////////////////////////////////////////////////

function initializeIndexPage() {
  //
  // Initialize index.html page when it is called.
  // by function setOnLoadCallback() at the page.

  // Get number of barrios and familias.
  getBarriosFamilias();

  // Get number of partidos.
  //getPartidos();

  // Draw supply charts
  // 1. Desagües cloacales
  // no cuenta con desagües cloacales / have no sewage
  // 2. Red pública
  // tiene acceso al agua potable a través de la red pública / have access to potable water through the public network
  // 3. Sistema eléctrico
  // tiene conexión regular al sistema eléctrico / have regular connection to the electrical system
  // 4. Red de gas
  // tiene acceso a la red de gas / have access to the gas network
  drawSupplyCharts(view_sequence["provincia"]);
}

function initializeMapBarriosPage() {
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

  initLayer.setMap(map);

  // Init Barrio search field.
  initAutoComplete();

  // A listener to the initLayer that constructs a map marker and
  // afterwards shows barrio data for information.
  google.maps.event.addListener(initLayer, 'click', function(e) {
    placeMarker(map, e.latLng, techo_marker, techo_marker_shadow);
    showBarrioInfo(e);
  } );
}

function initializeTableBarriosPage() {
  //
  //
  //
  options = {'pageSize': 25};
  changeTableData();
}

function findBarrioData() {
  //
  // Find Barrio via text search.
  //
  // Init - alert message box should be closed.
  $(".alert").alert('close');
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
        var msg = "El Barrio " + "'" + barrio + "'" + " no se pudo encontrar.";
        bootstrap_alert.warning(msg);
        clearThis(document.getElementById("search_txt"));
        return;
      }

      // Extract polygon data from table.
      var polygonBoundary = response.getDataTable().getValue(0, 2);

      // Extract polygon coordinates from xml structure.
      polygonBoundary = $(polygonBoundary).find("coordinates").text();
      polygonBoundary = polygonBoundary.replace(/\\n/g, " ");
      polygonBoundary = polygonBoundary.trim();

      console.log(polygonBoundary);

      // Each pair of coordinates is stored in an array element.
      var latlngArr = polygonBoundary.split(' ');

      var bounds = new google.maps.LatLngBounds();
      for(var i = 0; i < latlngArr.length; i++) {
        var comma1 = latlngArr[i].indexOf(',');
        var comma2 = latlngArr[i].lastIndexOf(',');
        var lat = latlngArr[i].substring(0, comma1-1);
        var lng = latlngArr[i].substring(comma1+1, comma2-1);
        bounds.extend(new google.maps.LatLng(lat, lng));
      }
      var lat_lng = bounds.getCenter();

      // CHECK !!!!!!!!!!!!!!!!!!!!!!!! - NOT YET CORRECT !!!!!!!!!!!!
      // CHECK !!!!!!!!!!!!!!!!!!!!!!!! - NOT YET CORRECT !!!!!!!!!!!!
      // CHECK !!!!!!!!!!!!!!!!!!!!!!!! - NOT YET CORRECT !!!!!!!!!!!!
      // Workaround - changes of coordinates lat to lng and vice versa.
      // Otherwise we get a wrong position.
      var latlngArr = polygonBoundary.split(',');
      var lat = latlngArr[1];
      var lng = latlngArr[0];
      var lat_lng = new google.maps.LatLng(lat, lng);

      // e only has four properties, "infoWindowHtml", "latLng", "pixelOffset" and "row".
      var e = {
        infoWindowHtml: null,
        latLng: lat_lng,
        pixelOffset: null,
        row : []
      }

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

      // Triggering'click'-event listener to display barrio map marker and data.
      google.maps.event.trigger(initLayer, 'click', e);

    } );
  }
}

function initAutoComplete() {
  //
  // Autocompletition via jQuery for Barrio search field.
  //
  // Retrieve the unique names of 'barrios' using GROUP BY workaround.
  queryText = encodeURIComponent(
            "SELECT 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO' " +
            'FROM ' + dataSourceNumericID + " GROUP BY 'NOMBRE DEL BARRIO', 'OTRO NOMBRE DEL BARRIO'");
  query = new google.visualization.Query(dataSourceUrl + queryText);

  query.send(function(response) {
    var numRows = response.getDataTable().getNumberOfRows();
    // Create the list of results for display of autocomplete.
    var results = [];
      for (var i = 0; i < numRows; i++) {
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
      minLength: 2,
      maxHeight:100,
      zIndex: 4000
    } );
  } );
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

function showBarrioInfo(e) {
  //
  //
  //

  var missing = "-";

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
    for (i in markers) {
      markers[i].setMap(null);
    }
    markers.length = 0;
  }
}

function drawSupplyCharts(view) {
  //
  //
  //

  // 1. Desagües cloacales
  query = "SELECT 'RED CLOACAL' FROM " + dataSourceNumericID;
  //query = "SELECT 'RED CLOACAL' FROM " + dataSourceNumericID + " " + "WHERE 'NRO DE FLIAS' > 0" + " " + "GROUP BY 'PARTIDO' ORDER BY 'NRO DE FLIAS' DESC";
  //query = "SELECT 'PARTIDO', count() FROM " + dataSourceEncryptedID + " GROUP BY 'PARTIDO'";

  var chartObject = {
    "containerID": "sewage_chart_div",
    "dataSourceUrl": dataSourceUrl,
    "query": query,
    "chartType": "PieChart",
    "options": {
      "width": 500,
      "height": 240,
      "chartArea": {left:20,top:6,width:"100%",height:"85%"}
//      "slices": {0: {color: 'blue'}, 3: {color: 'green'}},
    }
  };

  draw_chart(chartObject);

  // 2. Red pública
  query = "SELECT 'AGUA' FROM " + dataSourceNumericID;

  var chartObject = {
    "containerID": "water_chart_div",
    "dataSourceUrl": dataSourceUrl,
    "query": query,
    "chartType": "PieChart",
    "options": {
      "width": 500,
      "height": 240,
      "chartArea": {left:20,top:6,width:"100%",height:"85%"}
//      "slices": {0: {color: 'blue'}, 3: {color: 'green'}},
    }
  };

  draw_chart(chartObject);

  // 3. Sistema eléctrico
  query = "SELECT 'ACCESO A LA ENERGÍA' FROM " + dataSourceNumericID;

  var chartObject = {
    "containerID": "electrical_chart_div",
    "dataSourceUrl": dataSourceUrl,
    "query": query,
    "chartType": "PieChart",
    "options": {
      "width": 500,
      "height": 240,
      "chartArea": {left:20,top:6,width:"100%",height:"85%"}
//      "slices": {0: {color: 'blue'}, 3: {color: 'green'}},
    }
  };

  draw_chart(chartObject);


  // 4. Red de gas
 query = "SELECT 'GAS' FROM " + dataSourceNumericID;

  var chartObject = {
    "containerID": "gas_chart_div",
    "dataSourceUrl": dataSourceUrl,
    "query": query,
    "chartType": "PieChart",
    "options": {
      "width": 500,
      "height": 240,
      "chartArea": {left:20,top:6,width:"100%",height:"85%"}
//      "slices": {0: {color: 'blue'}, 3: {color: 'green'}},
    }
  };

  draw_chart(chartObject);


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

function getBarriosFamilias() {
  //
  //
  //
  query = "SELECT sum('NRO DE FLIAS') as familias, count('NOMBRE DEL BARRIO') FROM " + dataSourceEncryptedID;
  queryEncoded = encodeURIComponent(query);

  setQueryUrl();

  // Send JSONP request using jQuery
  $.ajax( {
    url: queryUrl.join(''),
    dataType: 'jsonp',
    cache: false,
    success: function (barrio_data) {
      var rows = barrio_data['rows'];
      var number_of_familias = document.getElementById('number_of_familias');
      var number_of_barrios = document.getElementById('number_of_barrios');
      for (var i in rows) {
        var familias = rows[i][0];
        var barrios = rows[i][1];
        number_of_familias.innerHTML = parseInt(familias, 10).format();
        number_of_barrios.innerHTML = parseInt(barrios, 10).format();
      }
    }
  } );
}

function setQueryUrl() {
  queryUrl.push('?sql=' + queryEncoded);
  queryUrl.push('&key=' + apiKey);
  queryUrl.push('&callback=?');
}

// A simple alert message via bootstrap.
bootstrap_alert = function() {}
bootstrap_alert.warning = function(msg) {
  $('#alert_placeholder').html(
  '<div class="alert fade in"><button type="button" class="close" data-dismiss="alert">&times;</button><i class="icon-thumbs-down"></i>&nbsp;<span>'+msg+'</span></div>')
}

function clearThis(target) {
  //
  // Clears text in a text field, when the user clicks on it.
  //
  target.value= "";
}

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
  if(!k) {
    k = 0;
  }
  var result = '';

  // Round
  var f = Math.pow(10, k);
  var numb = '' + parseInt( this * f + ( .5 * ( this > 0 ? 1 : -1 ) ) ) / f;

  // Evaluate comma.
  var idx = numb.indexOf('.');

  // Insert missing zeros.
  if(fixLength && k) {
    numb += (idx == -1 ? '.' : '') + f.toString().substring(1);
  }

  // Evaluate decimal places.
  idx = numb.indexOf('.');
  if(idx == -1) {
    idx = numb.length;
  }
  else {
    result = Number.decPoint + numb.substr(idx + 1, k);
  }

  // Set thousands separator.
  while(idx > 0) {
    if(idx - 3 > 0) {
      result = Number.thousand_sep + numb.substring( idx - 3, idx) + result;
    }
    else {
      result = numb.substring(0, idx) + result;
    }
    idx -= 3;
  }

  return result;
};