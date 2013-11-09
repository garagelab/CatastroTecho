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

// Google Visualization API Query Language URL
var urlVizData = 'http://www.google.com/fusiontables/gvizdata?tq=';

// Datasources - fusion tablas de google
var datasources = { table: [] };

// Actually used datasource.
var current_datasource;

// Data filters (municipio equal to departamento, partido).
var data_filter = { 
	provincia: null, 
	municipio: null, 
	localidad: null, 
	barrio_id: null, 
	barrio_name: null 
};

// Reporting levels (municipio equal to departamento, partido).
var is_reporting_level = { 
	provincia: "provincia", 
	municipio: "municipio", 
	localidad: "localidad",
	barrio: "barrio"
};

// Current reporting level.
var reporting_level = null;

var municipios_cache = new Array();
var barrios_cache = new Array();

// Where clauses.
var where_mpio_name__eq__selected_name;
var where_loc_name__eq__selected_name;
var where_barrio_id__eq__selected_id;
var where_clause_area_map;
var where_clause;

// Current selected barrio record (table row).
var issel_barrio = {	// is selected...
	infoWindowHtml: null,
    latLng: null,
    pixelOffset: null,
    row : []
};

// Color of polygons changes every year.
// #1e90ff (blue tone) was the default during test phase.
// #ff0000 Google default (red).
var polygon_color = {
	"2011": "#00FF00", // green
//	"2013": "#1e90ff", // blue
	"2013": "#E54DE5", // red
// 	"2013": "#ff0000", // red
};

var polygon_color_selected_area = "#ff0000";
var polygon_color_not_selected_area = "#ffffff";

 
var placeholder = "ingresa el nombre y pulse enter...";

var image_barrios_path = "/images_barrios";

// Init charts
var charts = {
	sewage: [],		// 1. Desagües cloacales
	water: [],		// 2. Red pública
	electrical: [],	// 3. Sistema eléctrico
	gas: []			// 4. Red de gas
};

var sewage_txt = {
	1: 'Red cloacal',
	2: 'Cámara séptica',
	3: 'Pozo ciego',
	4: 'Otro'
};

var water_txt = {
	1:  'Agua corriente',
	2:  'Conexión irregular',
	3:  'Agua de pozo',
	4:  'Camión Cisterna',
	5:  'Otro'
};

var electrical_txt = {
	1:  'Red pública regular',
	2:  'Medidor comunitario',
	3:  'Red pública irregular',
	4:  'No tiene',
};

var gas_txt = {
	1:  'Gas natural',
	2:  'Gas en garrafa',
	3:  'Leña o carbón',
	4:  'Otro'
};

/////////////////////////////////////////////////////////////////////
// TERRITORIES SECTION BEGIN >>>
// ADD NEW TERRITORIES HERE.
/////////////////////////////////////////////////////////////////////
var territories = [
	{ id: 'buenos_aires_2011', text: 'Buenos Aires', year: '2011' },
	{ id: 'cordoba_2011', text: 'Córdoba', year: '2011' },
	{ id: 'buenos_aires_2013', text: 'Buenos Aires', year: '2013' },
	{ id: 'cordoba_2013', text: 'Córdoba', year: '2013' },
	{ id: 'rosario_2013', text: 'Rosario', year: '2013' },
	{ id: 'salta_2013', text: 'Salta', year: '2013' },
	{ id: 'rio_negro_neuquen_2013', text: 'Río Negro y Neuquén', year: '2013' },
	{ id: 'posadas_2013', text: 'Posadas', year: '2013' }
];
/////////////////////////////////////////////////////////////////////
// <<< END OF TERRITORIES SECTION
/////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////
// TABLE SECTION BEGIN >>>
// ADD NEW TABLES HERE => AT BOTTOM !!!!
/////////////////////////////////////////////////////////////////////

//*******************************************************************
// Buenos Aires 2011
//*******************************************************************
datasources.table['buenos_aires_2011'] = {
	key:	'buenos_aires_2011',
	id:		'1_fEVSZmIaCJzDQoOgTY7pIcjBLng1MFOoeeTtYY',
	type:	'fusion_table',
	name:	'Buenos Aires',
	year:	'2011',
	provincia:	'Buenos Aires',
	ie_img_label: 'buenos_aires_ie_label.jpg',
	startZoom:	10,
	partidoZoom: 12,
	provincia_prefix_text: "En la Provincia de <strong>Buenos Aires</strong> hay",
	ciudad_prefix_text: "y en la Ciudad de <strong>Buenos Aires</strong> hay ",
	sql_main_grp:	"'BARRIO', 'OTRA DENOMINACIÓN', 'PARTIDO', 'LOCALIDAD'",
	sql_barrio_search_grp:	"'CÓDIGO', 'BARRIO', 'OTRA DENOMINACIÓN', 'PARTIDO', 'LOCALIDAD', 'PROVINCIA'",
	sql_municipio:	"'PARTIDO'",
	sql_localidad: "'LOCALIDAD'",
	sql_codigo: "'CÓDIGO'",
	sql_barrio: "'BARRIO'",
	sql_other_name_barrio: "'OTRA DENOMINACIÓN'",
	sql_partido: "'PARTIDO'",
	sql_families: "'NRO DE FLIAS'",
	alias_municipio: 'municipio',
	alias_localidad: "localidad",
	cols: {},
	col_no_barrio: 1,
	col_no_other_name_barrio: 2, 
	col_no_provincia: 3,
	col_no_departamento: 4,
	col_no_municipio_partido_comuna: 5,
	col_no_municipio: 5,
	col_no_partido: 5,
	col_no_localidad: 6,
	col_no_families: 10,
	col_no_start_year: 9, // AÑO DE CONFORMACIÓN DEL BARRIO
	col_no_sewage: 17, // RED CLOACAL
	col_no_water: 18, // AGUA
	col_no_electrical: 16, // ACCESO A LA ENERGÍA
	col_no_gas: 19, // GAS
	col_no_drains: 20, // DESAGÜES PLUVIALES
	col_no_street_lighting: 21, // ALUMBRADO PÚBLICO
	col_no_waste_collection: 22, // RECOLECCIÓN DE RESIDUOS
	col_no_polygon: 7,
	search_part_txt_label: 'partido o localidad',
	shortcut_municipio: 'pdo.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	[-34.672747,-58.41774], 
	filter: data_filter,
	img_path: image_barrios_path + '/bsas'
};

//*******************************************************************
// Córdoba 2011
//*******************************************************************
datasources.table['cordoba_2011'] = {
	key:	'cordoba_2011',
	id:		'17P_q8RIm8-T2iW0Nij_6dIBhnL50z2O-UicNVaU',
	type:	'fusion_table',
	name:	'Córdoba',
	year:	'2011',
	provincia:	'Córdoba',
	ie_img_label: 'cordoba_ie_label.jpg',
	startZoom:  12,
	partidoZoom: 12,
	provincia_prefix_text: "En la Provincia de <strong>Córdoba</strong> hay",
	ciudad_prefix_text: "",
	sql_main_grp:	"'BARRIO', 'OTRA DENOMINACIÓN', 'DEPARTAMENTO', 'LOCALIDAD'",
	sql_barrio_search_grp:	"'CÓDIGO', 'BARRIO', 'OTRA DENOMINACIÓN', 'DEPARTAMENTO', 'LOCALIDAD', 'PROVINCIA'",
	sql_municipio:	"'DEPARTAMENTO'",
	sql_localidad: "'LOCALIDAD'",
	sql_codigo: "'CÓDIGO'",
	sql_barrio: "'BARRIO'",
	sql_other_name_barrio: "'OTRA DENOMINACIÓN'",
	sql_partido: "'DEPARTAMENTO'",
	sql_families: "'NRO DE FLIAS'",
	alias_municipio: 'departamento',
	alias_localidad: "localidad",
	cols: {},
	col_no_barrio: 1,
	col_no_other_name_barrio: 2, 
	col_no_provincia: 3,
	col_no_departamento: 4,
	col_no_municipio_partido_comuna: 4,
	col_no_municipio: 4,
	col_no_partido: 5,
	col_no_localidad: 6,
	col_no_families: 10,
	col_no_start_year: 9, // AÑO DE CONFORMACIÓN DEL BARRIO
	col_no_sewage: 17, // RED CLOACAL
	col_no_water: 18, // AGUA
	col_no_electrical: 16, // ACCESO A LA ENERGÍA
	col_no_gas: 19, // GAS
	col_no_drains: 20, // DESAGÜES PLUVIALES
	col_no_street_lighting: 21, // ALUMBRADO PÚBLICO
	col_no_waste_collection: 22, // RECOLECCIÓN DE RESIDUOS
	col_no_polygon: 7,
	search_part_txt_label: 'departamento o localidad',
	shortcut_municipio: 'dpto.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	[-31.40039,-64.228233],
	filter: data_filter,
	img_path: image_barrios_path + '/cordoba'
};

//*******************************************************************
// Buenos Aires 2013
//*******************************************************************
datasources.table['buenos_aires_2013'] = {
	key:	'buenos_aires_2013',
	id:		'1KJW4OtVXG7tJcJSFDl5kqA2OsqiEcDQ25kFpzmU',
	type:	'fusion_table',
	name:	'Buenos Aires',
	year:	'2013',
	provincia:	'Buenos Aires',
	ie_img_label: 'buenos_aires_ie_label.jpg',
	startZoom:	10,
	partidoZoom: 12,
	provincia_prefix_text: "En la Provincia de <strong>Buenos Aires</strong> hay",
	ciudad_prefix_text: "y en la Ciudad de <strong>Buenos Aires</strong> hay",
	sql_main_grp:	"'1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad'",
	sql_barrio_search_grp:	"'id', '1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad', 'Provincia'",
	sql_municipio: "'Departamento'",
	sql_localidad: "'Localidad'",
	sql_codigo: "'id'",
	sql_barrio: "'1. Nombre del barrio'",
	sql_other_name_barrio: "'2. Otros nombres del barrio'",
	sql_partido: "'Municipio/Partido/Comuna'",
	sql_families: "'4. ¿ Cúantas familias viven aproximadamente en el barrio actualmente?'",
	alias_municipio: 'partido',
	alias_localidad: "localidad",
	cols: {},
	col_no_barrio: 29,
	col_no_other_name_barrio: 30,
	col_no_provincia: 23,
	col_no_departamento: 24,
	col_no_municipio_partido_comuna: 25,
	col_no_municipio: 25,
	col_no_partido: 25,
	col_no_localidad: 26,
	col_no_families: 32,
	col_no_start_year: 40, // AÑO DE CONFORMACIÓN DEL BARRIO
	col_no_sewage: 61, // RED CLOACAL
	col_no_water: 67, // AGUA
	col_no_electrical: 55, // ACCESO A LA ENERGÍA
	col_no_gas: 80, // GAS
	col_no_drains: 86, // DESAGÜES PLUVIALES
	col_no_street_lighting: 94, // ALUMBRADO PÚBLICO
	col_no_waste_collection: 90, // RECOLECCIÓN DE RESIDUOS
	col_no_polygon: 196,
	search_part_txt_label: 'partido o localidad',
	shortcut_municipio: 'pdo.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	[-34.672747,-58.41774],
	filter: data_filter,
	img_path: image_barrios_path + '/bsas'
};

//*******************************************************************
// Córdoba 2013
//*******************************************************************
datasources.table['cordoba_2013'] = {
	key:	'cordoba_2013',
	id:		'1Tu94Wa-59lBYTsZZNGYonV-vFcqAn0VS2cLKYXo',
	type:	'fusion_table',
	name:	'Córdoba',
	year:	'2013',
	provincia:	'Córdoba',
	ie_img_label: 'cordoba_ie_label.jpg',
	startZoom:  12,
	partidoZoom: 13,
	provincia_prefix_text: "En la Provincia de <strong>Córdoba</strong> hay",
	ciudad_prefix_text: "",
	sql_main_grp:	"'1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad'",
	sql_barrio_search_grp:	"'id', '1. Nombre del barrio', '2. Otros nombres del barrio', 'Departamento', 'Localidad', 'Provincia'",
	sql_municipio: "'Departamento'",
	sql_localidad: "'Localidad'",
	sql_codigo: "'id'",
	sql_barrio: "'1. Nombre del barrio'",
	sql_other_name_barrio: "'2. Otros nombres del barrio'",
	sql_partido: "'Municipio/Partido/Comuna'",
	sql_families: "'4. ¿ Cúantas familias viven aproximadamente en el barrio actualmente?'",
	alias_municipio: 'departamento',
	alias_localidad: "localidad",
	cols: {},
	col_no_barrio: 29,
	col_no_other_name_barrio: 30,
	col_no_provincia: 23,
	col_no_departamento: 24,
	col_no_municipio_partido_comuna: 25,
	col_no_municipio: 25,
	col_no_partido: 25,
	col_no_localidad: 26,
	col_no_families: 32,
	col_no_start_year: 40, // AÑO DE CONFORMACIÓN DEL BARRIO
	col_no_sewage: 61, // RED CLOACAL
	col_no_water: 67, // AGUA
	col_no_electrical: 55, // ACCESO A LA ENERGÍA
	col_no_gas: 80, // GAS
	col_no_drains: 86, // DESAGÜES PLUVIALES
	col_no_street_lighting: 94, // ALUMBRADO PÚBLICO
	col_no_waste_collection: 90, // RECOLECCIÓN DE RESIDUOS
	col_no_polygon: 196,
	search_part_txt_label: 'departamento o localidad',
	shortcut_municipio: 'dpto.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	[-31.40039,-64.228233],
	filter: data_filter,
	img_path: image_barrios_path + '/cordoba'
};

//*******************************************************************
// Rosario, Santa Fe 2013
//*******************************************************************
datasources.table['rosario_2013'] = {
	key:	'rosario_2013',
	id:		'1kq6OYlRQRZGH1rEI6I4wx8BVQl99K7uhdDiQ_pU',
	type:	'fusion_table',
	name:	'Rosario',
	year:	'2013',
	provincia:	'Santa Fe',
	ie_img_label: 'rosario_ie_label.jpg',
	startZoom:  12,
	partidoZoom: 12,
	provincia_prefix_text: "En el <strong>Gran Rosario</strong> hay",
	ciudad_prefix_text: "",
	sql_main_grp:	"'1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad'",
	sql_barrio_search_grp:	"'id', '1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad', 'Provincia'",
	sql_municipio: "'Departamento'",
	sql_localidad: "'Localidad'",
	sql_codigo: "'id'",
	sql_barrio: "'1. Nombre del barrio'",
	sql_other_name_barrio: "'2. Otros nombres del barrio'",
	sql_partido: "'Municipio/Partido/Comuna'",
	sql_families: "'4. ¿ Cúantas familias viven aproximadamente en el barrio actualmente?'",
	alias_municipio: 'departamento',
	alias_localidad: "localidad",
	cols: {},
	col_no_barrio: 29,
	col_no_other_name_barrio: 30,
	col_no_provincia: 23,
	col_no_departamento: 24,
	col_no_municipio_partido_comuna: 25,
	col_no_municipio: 25,
	col_no_partido: 25,
	col_no_localidad: 26,
	col_no_families: 32,
	col_no_start_year: 40, // AÑO DE CONFORMACIÓN DEL BARRIO
	col_no_sewage: 61, // RED CLOACAL
	col_no_water: 67, // AGUA
	col_no_electrical: 55, // ACCESO A LA ENERGÍA
	col_no_gas: 80, // GAS
	col_no_drains: 86, // DESAGÜES PLUVIALES
	col_no_street_lighting: 94, // ALUMBRADO PÚBLICO
	col_no_waste_collection: 90, // RECOLECCIÓN DE RESIDUOS
	col_no_polygon: 196,
	search_part_txt_label: 'departamento o localidad',
	shortcut_municipio: 'dpto.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	[-32.948615,-60.722049],
	filter: data_filter,
	img_path: image_barrios_path + '/rosario'
};

//*******************************************************************
// Salta 2013
//*******************************************************************
datasources.table['salta_2013'] = {
	key:	'salta_2013',
	id:		'10rvyZWQVl9lUvPm2BGalAIDMd2Xioc87cu5rl_A',
	type:	'fusion_table',
	name:	'Salta',
	year:	'2013',
	provincia:	'Salta',
	ie_img_label: 'salta_ie_label.jpg',
	startZoom:  12,
	partidoZoom: 13,
	provincia_prefix_text: "En los territorios relevados de la Provincia de <strong>Salta</strong> hay",
	ciudad_prefix_text: "",
	sql_main_grp:	"'1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad'",
	sql_barrio_search_grp:	"'id', '1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad', 'Provincia'",
	sql_municipio: "'Departamento'",
	sql_localidad: "'Localidad'",
	sql_codigo: "'id'",
	sql_barrio: "'1. Nombre del barrio'",
	sql_other_name_barrio: "'2. Otros nombres del barrio'",
	sql_partido: "'Municipio/Partido/Comuna'",
	sql_localidad: "'Localidad'",
	sql_families: "'4. ¿ Cúantas familias viven aproximadamente en el barrio actualmente?'",
	alias_municipio: 'departamento',
	alias_localidad: "localidad",
	cols: {},
	col_no_barrio: 29,
	col_no_other_name_barrio: 30,
	col_no_provincia: 23,
	col_no_departamento: 24,
	col_no_municipio_partido_comuna: 25,
	col_no_municipio: 25,
	col_no_partido: 25,
	col_no_localidad: 26,
	col_no_families: 32,
	col_no_start_year: 40, // AÑO DE CONFORMACIÓN DEL BARRIO
	col_no_sewage: 61, // RED CLOACAL
	col_no_water: 67, // AGUA
	col_no_electrical: 55, // ACCESO A LA ENERGÍA
	col_no_gas: 80, // GAS
	col_no_drains: 86, // DESAGÜES PLUVIALES
	col_no_street_lighting: 94, // ALUMBRADO PÚBLICO
	col_no_waste_collection: 90, // RECOLECCIÓN DE RESIDUOS
	col_no_polygon: 196,
	search_part_txt_label: 'departamento o localidad',
	shortcut_municipio: 'dpto.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	[-24.775517,-65.410246],
	filter: data_filter,
	img_path: image_barrios_path + '/salta'
};

//*******************************************************************
// Río Negro y Neuquén 2013
//*******************************************************************
datasources.table['rio_negro_neuquen_2013'] = {
	key:	'rio_negro_neuquen_2013',
	id:		'1rSuFqqgGtywBw_Hw_qHBwTjXeNUY4LrY2SEkYhU',
	type:	'fusion_table',
	name:	'Río Negro y Neuquén',
	year:	'2013',
	provincia:	'Río Negro y Neuquén',
	ie_img_label: 'rio_negro_neuquen_ie_label.jpg',
	startZoom:  12,
	partidoZoom: 12,
	provincia_prefix_text: "En el Alto Valle de <strong>Río Negro y Neuquén</strong> hay",
	ciudad_prefix_text: "",
	sql_main_grp:	"'1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad'",
	sql_barrio_search_grp:	"'id', '1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad', 'Provincia'",
	sql_municipio: "'Departamento'",
	sql_localidad: "'Localidad'",
	sql_codigo: "'id'",
	sql_barrio: "'1. Nombre del barrio'",
	sql_other_name_barrio: "'2. Otros nombres del barrio'",
	sql_partido: "'Municipio/Partido/Comuna'",
	sql_families: "'4. ¿ Cúantas familias viven aproximadamente en el barrio actualmente?'",
	alias_municipio: 'departamento',
	alias_localidad: "localidad",
	cols: {},
	col_no_barrio: 29,
	col_no_other_name_barrio: 30,
	col_no_provincia: 23,
	col_no_departamento: 24,
	col_no_municipio_partido_comuna: 25,
	col_no_municipio: 25,
	col_no_partido: 25,
	col_no_localidad: 26,
	col_no_families: 32,
	col_no_start_year: 40, // AÑO DE CONFORMACIÓN DEL BARRIO
	col_no_sewage: 61, // RED CLOACAL
	col_no_water: 67, // AGUA
	col_no_electrical: 55, // ACCESO A LA ENERGÍA
	col_no_gas: 80, // GAS
	col_no_drains: 86, // DESAGÜES PLUVIALES
	col_no_street_lighting: 94, // ALUMBRADO PÚBLICO
	col_no_waste_collection: 90, // RECOLECCIÓN DE RESIDUOS
	col_no_polygon: 196,
	search_part_txt_label: 'departamento o localidad',
	shortcut_municipio: 'dpto.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	[-38.943659,-68.113569],
	filter: data_filter,
	img_path: image_barrios_path + '/nqn_rn'
};

//*******************************************************************
// Posadas 2013
//*******************************************************************
datasources.table['posadas_2013'] = {
	key:	'posadas_2013',
	id:		'1IrVpWor4zkUSv3nY8VMuM4Vaq6WSinBnFRzndhE',
	type:	'fusion_table',
	name:	'Posadas',
	year:	'2013',
	provincia:	'Misiones',
	ie_img_label: 'posadas_ie_label.jpg',
	startZoom:  12,
	partidoZoom: 12,
	provincia_prefix_text: "En el departamento Capital de <strong>Misiones</strong> hay",
	ciudad_prefix_text: "",
	sql_main_grp:	"'1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad'",
	sql_barrio_search_grp:	"'id', '1. Nombre del barrio', '2. Otros nombres del barrio', 'Municipio/Partido/Comuna', 'Localidad', 'Provincia'",
	sql_municipio: "'Departamento'",
	sql_localidad: "'Localidad'",
	sql_codigo: "'id'",
	sql_barrio: "'1. Nombre del barrio'",
	sql_other_name_barrio: "'2. Otros nombres del barrio'",
	sql_partido: "'Municipio/Partido/Comuna'",
	sql_families: "'4. ¿ Cúantas familias viven aproximadamente en el barrio actualmente?'",
	alias_municipio: 'departamento',
	alias_localidad: "localidad",
	cols: {},
	col_no_barrio: 29,
	col_no_other_name_barrio: 30,
	col_no_provincia: 23,
	col_no_departamento: 24,
	col_no_municipio_partido_comuna: 25,
	col_no_municipio: 25,
	col_no_partido: 25,
	col_no_localidad: 26,
	col_no_families: 32,
	col_no_start_year: 40, // AÑO DE CONFORMACIÓN DEL BARRIO
	col_no_sewage: 61, // RED CLOACAL
	col_no_water: 67, // AGUA
	col_no_electrical: 55, // ACCESO A LA ENERGÍA
	col_no_gas: 80, // GAS
	col_no_drains: 86, // DESAGÜES PLUVIALES
	col_no_street_lighting: 94, // ALUMBRADO PÚBLICO
	col_no_waste_collection: 90, // RECOLECCIÓN DE RESIDUOS
	col_no_polygon: 196,
	search_part_txt_label: 'departamento o localidad',
	shortcut_municipio: 'dpto.',
	shortcut_localidad: 'loc.',
	center_lat_lng:	[-27.387316,-55.928834],
	filter: data_filter,
	img_path: image_barrios_path + '/posadas'
};

/////////////////////////////////////////////////////////////////////
// <<< END OF TABLE SECTION
/////////////////////////////////////////////////////////////////////

// Interfaces

/**
 * Set current datasource
 *
 * We use an easy to handle cookie-less session technique for storing data.
 * This method is only suitable for storing temporary JavaScript session-only data.
 * It should never be used for user specific or confidential information, logging, 
 * debugging, or other similar purposes.
 */
function setCurrentDatasource(datasource_key) {
	if (datasource_key === undefined) {
 		// Set the default datasource and year.
 		datasource_key = 'buenos_aires_2013';
 		Session.set("sel_year", "2013");
 	}
 	
 	// Store values in session
	Session.set("current_datasource", datasources.table[datasource_key]);
	// Set current datasource.
	current_datasource = Session.get("current_datasource");
	
	// Query preparation
 	data_filter['provincia'] = null;
	data_filter['municipio'] = null;
	data_filter['localidad'] = null;
	data_filter['barrio'] = null;			
}

/**
 * Get current datasource
 *
 * We use an easy to handle cookie-less session technique for storing data.
 * This method is only suitable for storing temporary JavaScript session-only data.
 * It should never be used for user specific or confidential information, logging, 
 * debugging, or other similar purposes.
 */
function getCurrentDatasource() {
	// Get current datasource.
	current_datasource = Session.get("current_datasource");
	
	if (current_datasource === undefined) {
		setCurrentDatasource();	// Set the default datasource.
	}

	// Get all table columns.
	getFusionTableColumns(current_datasource.id, columnTableHandler);

	// Filling data cache.
	//getFusionTableData("select " + current_datasource.sql_barrio_search_grp + " from " + current_datasource.id, setDataCache);	

 	current_datasource.filter['provincia'] = current_datasource.provincia;
	
	var sel_year = Session.get("sel_year");
	return current_datasource;
}

/** Filter resetter */
function resetFilter(level) {
	if (level === undefined) { 
 		current_datasource.filter.provincia = null;
		current_datasource.filter.municipio = null;
		current_datasource.filter.localidad = null;
		current_datasource.filter.barrio_id = null;
		current_datasource.filter.barrio_name = null;

		where_mpio_name__eq__selected_name = null;
		where_loc_name__eq__selected_name = null;
		where_barrio_id__eq__selected_id = null;
		where_clause_area_map = null;
		return;
	}
	
	if (level in data_filter) {
		current_datasource.filter[level] = null;
	}
}

/* Set image (path only) from current selected barrio and shows it on screen. */
function setBarrioImage(barrio_id) {
	var image = current_datasource.img_path + '/' + barrio_id + '.jpg';
	$('#img-barrio')
		.error( function () {
				// Image id not found. Looking for another image with suffix '_1'.
				var image = current_datasource.img_path + '/' + barrio_id + '_1' + '.jpg';
				$('#img-barrio')
					.error( function () {
						setBarrioDummyImage(); 
					})
					.attr('src', image);
		})
		.attr('src', image);
}

/* Set dummy (transparent) image as placeholder to barrio data. */
function setBarrioDummyImage() {
	var image = '/images/barrio_dummy.jpg';
	$('#img-barrio').attr('src', image);
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
 * Please note 'maxResults' query parameter below.
 * The list request only returns up to 50 results by default!
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
	url.push('&maxResults=200');

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

/** Callback: Lists all columns in a given table. */
function columnTableHandler(response) {
	current_datasource.cols = response.items;

//	begin checking >>>
//	Part below is only for checking and testing...
	// Get column list (total of all columns in the table).
	// Uncomment code below for check.
// 
// 	console.debug("totalItems: " + response.totalItems);  			// first line
// 	var tbl_cols = response.items;
// 	for(var i=0; i<tbl_cols.length; i++) {
// 		console.debug("column[" + i + "] = " + tbl_cols[i].name);  		
// 	}																// last line
// 
// <<< end checking
}

/** Callback: Get municipios/departamentos and localidades from current datasource. */
function getMunicipios(response) {
	municipios_cache = [];
	
	var current_datasource = Session.get("current_datasource");
	var municipio = current_datasource.shortcut_municipio;
	var localidad = current_datasource.shortcut_localidad;

	// Detect Microsoft Internet Explorer.
	var ver = getInternetExplorerVersion();

	var issel_radio_bsas = null;
	if ( current_datasource.name == 'Buenos Aires' ) {
		issel_radio_bsas = $('input[name=bsas-territory]:checked', '.radio').val();
	}
	
	// Apply responded data into municipio array.
	for (var i in response.rows) {
		var row = response.rows[i];

		// Not IE
		if (ver == -1) {
			row[0].trim();
			row[1].trim();
		}
		
		// Buenos Aires is also a special case and is proceeded later above.
		if ( current_datasource.name != 'Buenos Aires' ) {
			if (!row[0] == "") {
 				municipios_cache.push({ id: row[0], label: row[0] + " (" + municipio + ")"});
			}
		}

		if ( current_datasource.name != 'Buenos Aires' ) {
			if (!row[1] == "") {
				municipios_cache.push({ id: row[1], label: row[1] + " (" + localidad + ")"});			
			}
		}
		// Special case for Buenos Aires.
		else {
			switch( issel_radio_bsas ) {
				// Special case for CABA "Ciudad Autónoma de Buenos Aires".
				case 'bsas-caba':
					if ( !row[1] == "" ) {
						var caba_check = row[1].toLowerCase();
						if ( caba_check.substr(0, 6) == "comuna" ) { // Only CABA!
							municipios_cache.push({ id: row[1], label: row[1] + " (CABA)"});
						}
					}
				break;
				// Special case for "Provincia de Buenos Aires".
				case 'bsas-provincia':
					if ( !row[0] == "" ) {
 						municipios_cache.push({ id: row[0], label: row[0] + " (" + municipio + ")"});
					}
					if ( !row[1] == "" ) {					
						var caba_check = row[1].toLowerCase();
						if ( caba_check.substr(0, 6) != "comuna" ) { // All exept CABA!
							municipios_cache.push({ id: row[1], label: row[1] + " (" + localidad + ")"});									
						}
					}
				break;
			}
		}		
	}

	// Remove duplicates.
	var tmp_arr = {};
	for (var i=0; i<municipios_cache.length; i++) {
    	tmp_arr[municipios_cache[i]['label']] = municipios_cache[i];
	}
	municipios_cache = new Array();
	for (key in tmp_arr) {
    	municipios_cache.push(tmp_arr[key]);	
	}

	// Sort texts ascending.
	municipios_cache.sort(function(a, b){
 		var textA = a.label.toLowerCase(), textB = b.label.toLowerCase()
 		if (textA < textB) return -1
 		if (textA > textB)return 1
 		return 0 //default return value (no sorting)
	});		
}

/** Callback: Get barrios from current datasource. */
function getBarrios(response) {
	barrios_cache = [];

	// Detect Microsoft Internet Explorer.
	var ver = getInternetExplorerVersion();

	// Apply responded data into barrio array.
	for (var i in response.rows) {
		var row = response.rows[i];
		
		// Not IE
		if (ver == -1) {
			row[0].trim();
		}
		
		barrios_cache.push({ id: row[0], label: row[1]});
	}

	// Remove duplicates - there should be none because barrios id's must be unique!
	var tmp_arr = {};
	for (var i=0; i<barrios_cache.length; i++) {
    	tmp_arr[barrios_cache[i]['id']] = barrios_cache[i];
	}
	barrios_cache = new Array();
	for (key in tmp_arr) {
    	barrios_cache.push(tmp_arr[key]);	
	}
		
	// Sort texts ascending.
	barrios_cache.sort(function(a, b){
 		var textA = a.label.toLowerCase(), textB = b.label.toLowerCase()
 		if (textA < textB) return -1
 		if (textA > textB)return 1
 		return 0 //default return value (no sorting)
	});
}

/** Callback: Get data and draw 'sewage' chart. */
function set_sewage_chart(response) {  
	var total = [0, 0, 0, 0];
	
	// Count all relevant expressions for chart.
	for (var i in response.rows) {
		var row = response.rows[i];
		if (row[0] == '1º lugar') total[0]++;
		if (row[1] == '1º lugar') total[1]++;
		if (row[2] == '1º lugar') total[2]++;
		if (row[4] == '1º lugar') total[3]++;		
	}

	// Create and populate the data table.
  	var expression = [ sewage_txt[1], sewage_txt[2], sewage_txt[3], sewage_txt[4] ];
  	var total = [ total[0], total[1], total[2], total[3] ];

    // Create data table object  
    var dataTable = new google.visualization.DataTable();  

    // Define columns  
    dataTable.addColumn('string','Type');  
    dataTable.addColumn('number', 'Total');  

	// Fill rows with data.
	for(i=0; i<expression.length; i++) {
    	dataTable.addRow([expression[i], total[i]]);	
	}

	// Set chart values.
  	charts.sewage.containerID = { value: "sewage_chart_div" };
  	charts.sewage.dataTable = { value: dataTable };
  	charts.sewage.chartType = { value: "PieChart" };
  	// Brown tones.
  	charts.sewage.colors = { value: ['#8A4B08', '#61380B', '#B45F04', '#DF7401', '#FF8000'] };
	
	// Set chart object.
	var chart_object = {
    	"containerId": charts.sewage.containerID.value,
      	"dataTable": charts.sewage.dataTable.value,
      	"refreshInterval": 5,
      	"chartType": charts.sewage.chartType.value,
    	"options": {
            areaOpacity: 0.0,
            backgroundColor: { fill:'transparent' },
            width: 350,
            height: 130,
            colors: charts.sewage.colors.value,
            chartArea: {left:10,top:6,width:"75%",height:"85%"}
        }
    };

	// Draw chart.	
	var chart = google.visualization.drawChart( chart_object );
}

/** Callback: Get data and draw 'water' chart. */
function set_water_chart(response) {  
	var total = [0, 0, 0, 0, 0];
	
	// Count all relevant expressions for chart.
	for (var i in response.rows) {
		var row = response.rows[i];
		if (row[0] == '1º lugar') total[0]++;
		if (row[1] == '1º lugar') total[1]++;
		if (row[2] == '1º lugar') total[2]++;
		if (row[4] == '1º lugar') total[3]++;		
		if (row[5] == '1º lugar') total[4]++;		
	}

	// Create and populate the data table.
  	var expression = [ water_txt[1], water_txt[2], water_txt[3], water_txt[4], water_txt[5] ];
  	var total = [ total[0], total[1], total[2], total[3], total[4] ];

    // Create data table object  
    var dataTable = new google.visualization.DataTable();  

    // Define columns  
    dataTable.addColumn('string','Type');  
    dataTable.addColumn('number', 'Total');  

	// Fill rows with data.
	for(i=0; i<expression.length; i++) {
    	dataTable.addRow([expression[i], total[i]]);	
	}

	// Set chart values.
  	charts.water.containerID = { value: "water_chart_div" };
  	charts.water.dataTable = { value: dataTable };
  	charts.water.chartType = { value: "PieChart" };
  	// Blue tones
  	charts.water.colors = { value: ['#2E9AFE', '#81BEF7', '#045FB4', '#0B3861', '#0000FF'] };
	
	// Set chart object.
	var chart_object = {
    	"containerId": charts.water.containerID.value,
      	"dataTable": charts.water.dataTable.value,
      	"refreshInterval": 5,
      	"chartType": charts.water.chartType.value,
    	"options": {
            areaOpacity: 0.0,
            backgroundColor: { fill:'transparent' },
            width: 350,
            height: 130,
            colors: charts.water.colors.value,
            chartArea: {left:10,top:6,width:"75%",height:"85%"}
        }
    };

	// Draw chart.	
	var chart = google.visualization.drawChart( chart_object );
}

/** Callback: Get data and draw 'electrical' chart. */
function set_electrical_chart(response) {  
	var total = [0, 0, 0, 0];
	
	// Count all relevant expressions for chart.
	for (var i in response.rows) {
		var row = response.rows[i];
		if (row[0] == '1º lugar') total[0]++;
		if (row[1] == '1º lugar') total[1]++;
		if (row[2] == '1º lugar') total[2]++;
		if (row[4] == '1º lugar') total[3]++;		
	}

	// Create and populate the data table.
  	var expression = [ electrical_txt[1], electrical_txt[2], electrical_txt[3], electrical_txt[4] ];
  	var total = [ total[0], total[1], total[2], total[3] ];

    // Create data table object  
    var dataTable = new google.visualization.DataTable();  

    // Define columns  
    dataTable.addColumn('string','Type');  
    dataTable.addColumn('number', 'Total');  

	// Fill rows with data.
	for(i=0; i<expression.length; i++) {
    	dataTable.addRow([expression[i], total[i]]);	
	}

	// Set chart values.
  	charts.electrical.containerID = { value: "electrical_chart_div" };
  	charts.electrical.dataTable = { value: dataTable };
  	charts.electrical.chartType = { value: "PieChart" };
  	// Yellow/Orange tones
  	charts.electrical.colors = { value: ['#ffcc00', '#ff9933', '#ffcc66', '#ffcc33', '#ff9900'] };
	
	// Set chart object.
	var chart_object = {
    	"containerId": charts.electrical.containerID.value,
      	"dataTable": charts.electrical.dataTable.value,
      	"refreshInterval": 5,
      	"chartType": charts.electrical.chartType.value,
    	"options": {
            areaOpacity: 0.0,
            backgroundColor: { fill:'transparent' },
            width: 350,
            height: 130,
            colors: charts.electrical.colors.value,
            chartArea: {left:10,top:6,width:"75%",height:"85%"}
        }
    };

	// Draw chart.	
	var chart = google.visualization.drawChart( chart_object );
}

/** Callback: Get data and draw 'gas' chart. */
function set_gas_chart(response) {  
	var total = [0, 0, 0, 0];
	
	// Count all relevant expressions for chart.
	for (var i in response.rows) {
		var row = response.rows[i];
		if (row[0] == '1º lugar') total[0]++;
		if (row[1] == '1º lugar') total[1]++;
		if (row[2] == '1º lugar') total[2]++;
		if (row[4] == '1º lugar') total[3]++;		
	}

	// Create and populate the data table.
  	var expression = [ gas_txt[1], gas_txt[2], gas_txt[3], gas_txt[4] ];
  	var total = [ total[0], total[1], total[2], total[3] ];

    // Create data table object  
    var dataTable = new google.visualization.DataTable();  

    // Define columns  
    dataTable.addColumn('string','Type');  
    dataTable.addColumn('number', 'Total');  

	// Fill rows with data.
	for(i=0; i<expression.length; i++) {
    	dataTable.addRow([expression[i], total[i]]);	
	}

	// Set chart values.
  	charts.gas.containerID = { value: "gas_chart_div" };
  	charts.gas.dataTable = { value: dataTable };
  	charts.gas.chartType = { value: "PieChart" };
  	// Red tones.
  	charts.gas.colors = { value: ['#FF0000', '#FA5858', '#8A0808', '#FE2E2E', '#F78181'] };
	
	// Set chart object.
	var chart_object = {
    	"containerId": charts.gas.containerID.value,
      	"dataTable": charts.gas.dataTable.value,
      	"refreshInterval": 5,
      	"chartType": charts.gas.chartType.value,
    	"options": {
            areaOpacity: 0.0,
            backgroundColor: { fill:'transparent' },
            width: 350,
            height: 130,
            colors: charts.gas.colors.value,
            chartArea: {left:10,top:6,width:"75%",height:"85%"}
        }
    };

	// Draw chart.	
	var chart = google.visualization.drawChart( chart_object );
}

/**
 * Callback: Gets and stores selected data in an array for faster access. 
 *
 */
function setDataCache(response) {
	var data_cache = response.rows;

	for (var i in data_cache) {
		if(data_cache.hasOwnProperty(i)) {
			var entry = data_cache[i];
			barrios_cache.data[i] = { 
				key: 		entry[0],	// Código
				value: 		entry[1],	// Barrio
				name2:		entry[2],	// Otro denominación
				municipio:	entry[3],
				localidad:	entry[4],
				provincia:	entry[5],
				label:		entry[1] + ', ' + entry[2] + ', ' + entry[3] + ', ' + entry[4]
//				label:		entry[1] + ', ' + entry[2] + ', ' + entry[3] + ', ' + entry[4].toString()  + ', ' + entry[0] 
			};
		}
	}
}

/**
 * Callback: Filling a data table (Columns and rows) from a given query result.
 *
 * Currently, a jQuery table is used with a 'dataTables' extension.
 * For details see: http://www.datatables.net/index
 */
function dataTableHandler(response) {
  	var cols;
  	var rows = new Array();
  	var qry_table_view;
	
  	// Special case for 2011 data.
  	if (current_datasource.key.indexOf("2011") != -1) {
  		cols = response.columns;
  		
		for(var row=0; row<response.rows.length; row++) {
			rows[row] = new Array();
			for (var col=0; col<28; col++) {
				rows[row][col] = response.rows[row][col];
			}
		}	
  		
		qry_table_view = [
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
    	];    	
	}
	// Default column selection.
	else {
  		cols = response.columns;
		sel_cols = [
			0, 29, 30, 23, 24, 25, 26, 32, 40, 41, 42, 43, 61, 66, 54, 79, 85, 91, 87, 
			105, 106, 107, 108, 109, 110, 111, 112, 113
		];
		
		for(var row=0; row<response.rows.length; row++) {
			var entry = new Array();
			for (var col=0; col<sel_cols.length; col++) {
				entry.push(response.rows[row][sel_cols[col]]);
			}
			rows.push(entry);
		}	

		qry_table_view = [
        	{ "bVisible": false, "sTitle": cols[0], "aTargets": [0], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": "BARRIO", "aTargets": [1], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": "OTRA DENOMINACIÓN", "aTargets": [2], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": "PROVINCIA", "aTargets": [3], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": "DEPARTAMENTO", "aTargets": [4], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[25], "aTargets": [5], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[26], "aTargets": [6], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[32], "aTargets": [7], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[40], "aTargets": [8], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[41], "aTargets": [9], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[42], "aTargets": [10], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[43], "aTargets": [11], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[61], "aTargets": [12], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[66], "aTargets": [13], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[54], "aTargets": [14], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[79], "aTargets": [15], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[85], "aTargets": [16], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[91], "aTargets": [17], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[87], "aTargets": [18], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[105], "aTargets": [19], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[106], "aTargets": [20], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[107], "aTargets": [21], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[108], "aTargets": [22], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[109], "aTargets": [23], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[110], "aTargets": [24], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[111], "aTargets": [25], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[112], "aTargets": [26], sDefaultContent: "" },
        	{ "bVisible": true, "sTitle": cols[113], "aTargets": [27], sDefaultContent: "" }
    	];    	
	}
  
  // Check if flash is enabled for download csv files.
  var has_flash = has_flash_enabled();
  var btn_csv_txt = has_flash ? "Guardar como CSV archivo" : "Guardar como CSV archivo (se requiere Flash plugin pero no está instalado)";
  
  $(document).ready(function() {    
    var oTable = $('#table_container').dataTable( {
      //
      // Positions of various controls end elements.

      "sDom": 'T<"clear">lfip<"clear">rtS<"clear">ip<"clear">',
      //
      // Menu buttons
      "oTableTools": {
      	// flash must be enabled for this.
        "sSwfPath": "/lib/DataTables/extras/TableTools/media/swf/copy_csv_xls_pdf.swf",
        "aButtons": [
          // {
          //   "sExtends": "copy",
          //   "sButtonText": "Copiar al clipboard"
          // },
          {
            "sExtends": "csv",
            "sButtonText": btn_csv_txt,
            "sFileName": "techo_relevamiento_" + current_datasource.key + ".csv",
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
      "aoColumnDefs": qry_table_view,
//       [
//         { "bVisible": false, "sTitle": cols[0], "aTargets": [0] },
//         { "bVisible": true, "sTitle": cols[1], "aTargets": [1] },
//         { "bVisible": true, "sTitle": cols[2], "aTargets": [2] },
//         { "bVisible": true, "sTitle": cols[3], "aTargets": [3] },
//         { "bVisible": true, "sTitle": cols[4], "aTargets": [4] },
//         { "bVisible": true, "sTitle": cols[5], "aTargets": [5] },
//         { "bVisible": true, "sTitle": cols[6], "aTargets": [6] },
//         { "bVisible": false, "aTargets": [7] },
//         { "bVisible": false, "aTargets": [8] },
//         { "bVisible": true, "sTitle": cols[9], "aTargets": [9] },
//         { "bVisible": true, "sTitle": cols[10], "aTargets": [10] },
//         { "bVisible": true, "sTitle": cols[11], "aTargets": [11] },
//         { "bVisible": true, "sTitle": cols[12], "aTargets": [12] },
//         { "bVisible": true, "sTitle": cols[13], "aTargets": [13] },
//         { "bVisible": true, "sTitle": cols[14], "aTargets": [14] },
//         { "bVisible": true, "sTitle": cols[15], "aTargets": [15] },
//         { "bVisible": true, "sTitle": cols[16], "aTargets": [16] },
//         { "bVisible": true, "sTitle": cols[17], "aTargets": [17] },
//         { "bVisible": true, "sTitle": cols[18], "aTargets": [18] },
//         { "bVisible": true, "sTitle": cols[19], "aTargets": [19] },
//         { "bVisible": true, "sTitle": cols[20], "aTargets": [20] },
//         { "bVisible": true, "sTitle": cols[21], "aTargets": [21] },
//         { "bVisible": true, "sTitle": cols[22], "aTargets": [22] },
//         { "bVisible": true, "sTitle": cols[23], "aTargets": [23] },
//         { "bVisible": true, "sTitle": cols[24], "aTargets": [24] },
//         { "bVisible": true, "sTitle": cols[25], "aTargets": [25] },
//         { "bVisible": true, "sTitle": cols[26], "aTargets": [26] },
//         { "bVisible": true, "sTitle": cols[27], "aTargets": [27] }
//       ],
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

	// Delete loading message.
	var loading_msg_txt = document.getElementById('loading-msg-txt');
	loading_msg_txt.innerHTML = '';

  } ); // end ready()
}
