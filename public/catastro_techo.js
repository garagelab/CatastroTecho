// Barrios Gran Buenos Aires - Test Prototipo

var dataSourceURL = 'http://www.google.com/fusiontables/gvizdata?tq=';
var dataSourceID = '5355203';
var query;

function initializeBarriosBsAsMap() {
  var barrios_bsas = new google.maps.LatLng(-34.672747,-58.41774);

  map = new google.maps.Map(document.getElementById('map_canvas'), {
    center: barrios_bsas,
    zoom: 10,
    minZoom: 9,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    streetViewControl: false,
//    styles: mapStyles
  } );

  layer = new google.maps.FusionTablesLayer( {
    suppressInfoWindows: true, // Because we have a separate listener for that.
    query: {
      select: 'Poligon',
      from: '5355203'
    },
    styles: [ {
      polygonOptions: {
      fillColor: "#1e90ff",     // Color del plano
      fillOpacity: 0.5,         // Opacidad del plano
      strokeColor: "#000000",   // Color del margen
      strokeOpacity: 0.5,       // Opacidad del margen     
      strokeWeight: 1           // Grosor del margen
      }
    }, {
/*    
    where: "PARTIDO = 'Escobar'",
      polygonOptions: {
        fillColor: "#FF0000"
      }
    }, {
    where: "population > 5",
      polygonOptions: {
        fillOpacity: 1.0
      }
*/
    } ]
  } );

  layer.setMap(map);

  var infoWindow = new google.maps.InfoWindow();

  // Add a click listener to the layer that creates a new infowindow
  google.maps.event.addListener(layer, 'click', function(e) {
    //e.infoWindowHtml = e.row['NOMBRE DEL BARRIO'].value + "<br>";
    var barrio = '<span style="color: #0092dd">' + e.row['NOMBRE DEL BARRIO'].value + '</span>';
    var partido = '<strong>Partido:</strong>&nbsp;' + e.row['PARTIDO'].value;
    var localidad = '<strong>Localidad:</strong>&nbsp;' + e.row['LOCALIDAD'].value;
    var ano_de_conf = '<strong>Año de conformación:</strong>&nbsp;' + e.row['AÑO DE CONFORMACIÓN DEL BARRIO'].value;

    var ano_de_mayor_creci = '<strong>Año de mayor crecimiento:</strong>&nbsp;' + e.row['AÑO DE MAYOR CRECIMIENTO'].value;
    var nro_de_flias = '<strong>Número de familias:</strong>&nbsp;' + e.row['NRO DE FLIAS'].value;
    var agua = '<strong>Agua:</strong>&nbsp;' + e.row['AGUA'].value;
    var prov_de_agua = '<strong>Próvision de agua:</strong>&nbsp;' + e.row['PROVISIÓN DE AGUA'].value;
    var gas = '<strong>Gas:</strong>&nbsp;' + e.row['GAS'].value;
    var desagues_pluviales = '<strong>Desagües pluviales:</strong>&nbsp;' + e.row['DESAGÜES PLUVIALES'].value;
    var alumbrado_publico = '<strong>Alumbrado público:</strong>&nbsp;' + e.row['ALUMBRADO PÚBLICO'].value;
    var recol_de_residuos = '<strong>Recolección de residuos:</strong>&nbsp;' + e.row['RECOLECCIÓN DE RESIDUOS'].value;

    infoWindow.setContent('<h4>' + barrio + '</h4>' + 
                          '<div>' + partido + '<br />' + 
                          '</div>' + localidad + '<br />' + 
                          '</div>' + ano_de_conf + '<br />' + 
                          '</div>' + ano_de_mayor_creci + '<br />' + 
                          '</div>' + nro_de_flias + '<br />' + 
                          '</div>' + agua + '<br />' + 
                          '</div>' + prov_de_agua + '<br />' + 
                          '</div>' + gas + '<br />' + 
                          '</div>' + desagues_pluviales + '<br />' + 
                          '</div>' + alumbrado_publico + '<br />' + 
                          '</div>' + recol_de_residuos + '<br />' + 
                          '</div>');
    infoWindow.setPosition(e.latLng);
    infoWindow.open(map);
//  google.maps.event.addListener(marker, 'click', function() {
//    infowindow.open(map, marker);
  } );
}
  
function initTable() {
  options = {'pageSize': 25};
  changeData();
}

function changeData(scorer) {
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
                                     FROM " + dataSourceID );
  query = new google.visualization.Query(dataSourceURL + queryText);
  
  //set the callback function
  query.send(getData);
}

// Define callback function, this is called when the results are returned
function getData(response) {
  var table = new google.visualization.Table(document.getElementById('table_div') );
  //var tableQueryWrapper = new TableQueryWrapper(query, container, options);
  var view = new google.visualization.DataView(response.getDataTable());
  view.setColumns([0, 1, 4, 5, 6, 8, 9, 15, 16, 17, 18, 19, 20]);
  table.draw(view, { showRowNumber: true } );
  //table.draw(response.getDataTable(), { showRowNumber: false, 'view': { 'columns': [1, 2, 3, 4] } } );
}
