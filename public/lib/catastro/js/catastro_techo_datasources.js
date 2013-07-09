/**
 * Project:		Catastro Techo
 *
 * Subject:		Datasources/Database
 * Code type:	Business coding
 * Copyright:	2013 Techo http://www.techo.org/ All Rights Reserved.
 * @author		Andreas Hempfling <andreas.hempfling@gmail.com>
 *
 */

// Google API key for project 'TechoCatastro'. User data access is not need therefor.
var API_KEY = 'AIzaSyCQ3Kiec1Vz_flwDFJxqahORuIES0WVxmw';

// Google API V1.0 URL Endpoint
var urlEndpoint = 'https://www.googleapis.com/fusiontables/v1/';

var center_lat_lng;

// Table columns (header information: id, name, type).
var tbl_cols = {};

// Datasources - fusion tablas de google
var datasources = { table : [] };

// Actually used datasource.
var current_datasource;

// Data filters (municipio equal to departamento, partido).
var data_filter = { provincia: null, municipio: null, localidad: null, barrio: null };

// View levels (municipio equal to departamento, partido).
var view_level = { provincia: 1, municipio: 2, localidad: 3, barrio: 4 };

var reporting_level = null;

/////////////////////////////////////////////////////////////////////
// TABLE SECTION BEGIN >>>
// ADD NEW TABLES HERE...
/////////////////////////////////////////////////////////////////////

//*******************************************************************
// Córdoba 2011
//*******************************************************************
center_lat_lng = new google.maps.LatLng(-31.396439, -64.179486);
datasources.table['cordoba_2011'] = {
	key:	'cordoba_2011',
	id:		'17P_q8RIm8-T2iW0Nij_6dIBhnL50z2O-UicNVaU',
	type:	'fusion_table',
	name:	'Catastro Córdoba',
	year:	'2011',
	provincia:	'Córdoba',
	startZoom:  12,
	sql_main_grp:	"'BARRIO', 'OTRA DENOMINACIÓN', 'DEPARTAMENTO', 'LOCALIDAD'",
	sql_barrio_search_grp:	"'CÓDIGO', 'BARRIO', 'OTRA DENOMINACIÓN', 'DEPARTAMENTO', 'LOCALIDAD'",
	sql_municipio:	"'DEPARTAMENTO'",
	col_no_municipio: 4,
	alias_municipio: 'departamento',
	search_part_txt_label: 'departamento o localidad',
	shortcut_municipio: 'dpto.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	center_lat_lng,
	filter: data_filter
};

//*******************************************************************
// Buenos Aires 2011
//*******************************************************************
center_lat_lng = new google.maps.LatLng(-34.672747, -58.41774);
datasources.table['buenos_aires_2011'] = {
	key:	'buenos_aires_2011',
	id:		'1_fEVSZmIaCJzDQoOgTY7pIcjBLng1MFOoeeTtYY',
	type:	'fusion_table',
	name:	'Catastro Buenos Aires',
	year:	'2011',
	provincia:	'Buenos Aires',
	startZoom:	10,
	sql_main_grp:	"'BARRIO', 'OTRA DENOMINACIÓN', 'PARTIDO', 'LOCALIDAD'",
	sql_barrio_search_grp:	"'CÓDIGO', 'BARRIO', 'OTRA DENOMINACIÓN', 'PARTIDO', 'LOCALIDAD'",
	sql_municipio:	"'PARTIDO'",
	col_no_municipio: 5,
	alias_municipio: 'partido',
	search_part_txt_label: 'municipio o localidad',
	shortcut_municipio: 'mpio.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	center_lat_lng,
	filter: data_filter
};

/////////////////////////////////////////////////////////////////////
// <<< END OF TABLE SECTION
/////////////////////////////////////////////////////////////////////


// Interfaces

/**
 *
 *
 */
function setCurrentDatasource(datasource) {
	if (datasource === undefined) {
 		// Set the default datasource.
//		console.debug("setCurrentDatasource() => Setting Buenos Aires as default.");
 		current_datasource = datasources.table['buenos_aires_2011'];
 	}
 	else {
 		current_datasource = datasource;
 	}

	// Query preparation
 	data_filter['provincia'] = null;
	data_filter['municipio'] = null;
	data_filter['localidad'] = null;
	data_filter['barrio'] = null;
	
	// Set datasource cookie.
	document.cookie = "datasource=" + current_datasource.key + ";" + " path=/";
	
//	console.debug("setCurrentDatasource() => " + current_datasource.name + " (" + current_datasource.key + ")"); 
 }

/**
 *
 *
 */
function getCurrentDatasource() {
	if (document.cookie) {		
		// Get datasource cookie.
  		var cookie = document.cookie;
  		cookie_value = cookie.substr(cookie.indexOf('=')+1, cookie.length);
 		current_datasource = datasources.table[cookie_value];
	} 
	else {
//		console.debug("getCurrentDatasource() => Cookie not found!"); 	
 		// Set a default datasource.
		setCurrentDatasource();
	}

	getFusionTableColumns(current_datasource.id, columnTableHandler);

 	current_datasource.filter['provincia'] = current_datasource.provincia;

//	console.debug("getCurrentDatasource() => " + current_datasource.name + " (" + current_datasource.key + ")"); 
	return current_datasource;
}

/** */
function resetFilter(level) {
	if (level === undefined) { 
 		current_datasource.filter['provincia'] = null;
		current_datasource.filter['municipio'] = null;
		current_datasource.filter['localidad'] = null;
		current_datasource.filter['barrio'] = null;
		return;
	}
	
	if (level in data_filter) {
		current_datasource.filter[level] = null;
	}
}

/** */
function setFilter(level, value) {
	if (level in data_filter) {
		current_datasource.filter[level] = value;
	}
}

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
    var urlType = urlEndpoint + 'query';
    var url = [urlType];
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

/**
 * Retrieves a list of the specified table's columns.
 *
 * @return {json-p} Query result.
 */
function getFusionTableColumns(tbl_id, callback) {
    // Construct the URL.
    var urlType = urlEndpoint + 'tables';    
    var url = [urlType];
    url.push('/' + tbl_id);
    url.push('/columns');
    url.push('?key=' + API_KEY);
	url.push('&callback=?');

	// Send the JSONP request using jQuery.
  	$.ajax( {
    	type: "GET",
    	url: url.join(''),
    	dataType: 'jsonp',
		contentType: "application/json",
    	success: function(response) { callback(response); },
    	error: function () { 
    		console.error("getFusionTableColumns(): Error in json-p call. Query was " + url);
    	}
  	});

}


/**
 * Callback: Lists all columns in a given table.
 *
 */
function columnTableHandler(response) {
	// Get column list.
//	console.debug("totalItems: " + response.totalItems);
	tbl_cols = response.items;
//   	for(var i=0; i<tbl_cols.length; i++) {
// 		console.debug("column[" + i + "] = " + tbl_cols[i].name);  		
//   	}	
}

/**
 * Callback: Filling a data table (Columns and rows) from a given query result.
 *
 * Currently, a jQuery table is used with a 'dataTables' extension.
 * For details see: http://www.datatables.net/index
 */
function dataTableHandler(response) {
	// Get columns and rows
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
        { "bVisible": false, "sTitle": cols[0], "aTargets": [0] },
        { "bVisible": true, "sTitle": cols[1], "aTargets": [1] },
        { "bVisible": true, "sTitle": cols[2], "aTargets": [2] },
        { "bVisible": true, "sTitle": cols[3], "aTargets": [3] },
        { "bVisible": true, "sTitle": cols[4], "aTargets": [4] },
        { "bVisible": true, "sTitle": cols[5], "aTargets": [5] },
        { "bVisible": true, "sTitle": cols[6], "aTargets": [6] },
        { "bVisible": false, "aTargets": [7] },
        { "bVisible": false, "aTargets": [8] },
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
