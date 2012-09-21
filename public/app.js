window.maps = {};

var TECHO = {
  view: 'map',

  layers: {
    cuenca: {}
  },

  arrayToPoints: function(ary) {
    var points = [];

    for (var i = 0; i < ary.length; i++) {
      points.push(new google.maps.LatLng(ary[i][1], ary[i][0]));
    }

    return points;
  },

  arrayToPolygon: function(ary, polygonOptions) {
    polygonOptions.paths = TECHO.arrayToPoints(ary);

    return new google.maps.Polygon(polygonOptions);
  }
};

function initializeMap() {

  var mapaBase = new google.maps.LatLng(-34.672747,-58.41774);
  var mapStyles = [
              {
                featureType: "poi.business",
                stylers: [
                  { visibility: "off" }
                ]
              },{
                featureType: "road",
                elementType: "labels",
                stylers: [
                  { visibility: "off" }
                ]
              },{
                featureType: "road",
                elementType: "labels",
                stylers: [
                  { visibility: "on" }
                ]
              },{
                featureType: "road",
                elementType: "geometry",
                stylers: [
                  { visibility: "simplified" },
                  { lightness: 80 }
                ]
              },{
                featureType: "transit.line",
                stylers: [
                  { visibility: "off" }
                ]
              },{
                featureType: "transit.station.bus",
                stylers: [
                  { visibility: "off" }
                ]
              }
            ];
  window.map = new google.maps.Map(document.getElementById('map'), {
    center: mapaBase,
    zoom: 12,
    minZoom: 9,
    mapTypeId: 'roadmap',
    streetViewControl: false,
	styles: mapStyles
  });

  var everything = [[-90, -90], [-90, 90], [90, -90], [-90, -90]];
/*
  var cuenca = new google.maps.Polygon({
    paths: [TECHO.arrayToPoints(everything), TECHO.arrayToPoints(window.cuenca)],
    strokeWeight: 0,
    strokeOpacity: 0.2,
    fillColor: "#000000",
    fillOpacity: 0.1
  });

  cuenca.setMap(map);
*/
  refresh();
}

function refresh() {
  $.each(Layer.find('*'), function() { this.conditions = []; });

  var $filters = $(".filter");

  $filters.filter("[data-facet]").each(function() {
    var $all = $("input", this);
    var $checked = $all.filter(":checked");
    var layers = Layer.find(this.parentNode.getAttribute('data-target-layer'));

    if ($checked.length > 0 && $checked.length != $all.length) {
      var values = $.map($checked, function(e) { return "'" + e.getAttribute('value') + "'"; });
      var field = this.getAttribute('data-facet');
      $.each(layers, function() { this.conditions.push("'" + field + "' IN (" + values.join(", ") + ")"); });
    }

    var $meter = $('.meter > div', this);

    if ($meter.length > 0) {
      var field = this.getAttribute('data-facet');
      var values = $meter.slider('values');

      $.each(layers, function() {
        this.conditions.push("'" + field + "' <= " + (1.0 - values[0] / 10.0));
        this.conditions.push("'" + field + "' >= " + (1.0 - values[1] / 10.0));
      });
    }
  });

  $filters.find('*[data-boolean-filter]').each(function() {
    var $this = $(this);
    var value = $this.find('.ui-slider').slider('value');
    var layers = Layer.find(this.parentNode.getAttribute('data-target-layer'));

    if (value != 0) {
      var field = this.getAttribute('data-boolean-filter');

      $.each(layers, function() {
        this.conditions.push("'" + field + "' = '" + (value == 1 ? 'SI' : 'NO') + "'");
      });
    }
  });

  $filters.filter('.range-filter').each(function() {
    var $this = $(this);
    var values = $this.find('.ui-slider').slider('values');
    var layers = Layer.find(this.parentNode.getAttribute('data-target-layer'));

    var field = this.getAttribute('data-facet');

    var result = $this.data('result');

    if (result) {
      values = result.text().split("–");
    }

    $.each(layers, function() {
      this.conditions.push("'" + field + "' >= " + values[0]);
      this.conditions.push("'" + field + "' <= " + values[1]);
    });
  });

  $filters.find('.chart').each(function() {
    var $this = $(this);
    var x = $this.data('x');
    var y = $this.data('y');

    var layer = Layer.find('industrias')[0];

    if (x && y) {
      var xp = unsnap2(x);
      var yp = unsnap2(y);

      layer.conditions.push('semaforo_riesgo >= ' + xp[0] + ' AND semaforo_riesgo < ' + xp[1]);
      layer.conditions.push('semaforo_legal >= '  + yp[0] + ' AND semaforo_legal < '  + yp[1]);

      console.log(layer.conditions)
    }
  });

  if (TECHO.view == 'map') {
    $.each(Layer.find(layersOnMap), function() { this.refreshMap(map); });
  }
  else {
    $.each(Layer.find(layersOnMap), function() {
      if ($('#' + this.name + '-table_wrapper').is(':visible')) {
        this.refreshTable($('#' + this.name + '-table'));
      }
    });
  }
}

function refreshVisibleEntities() {
  $('#layers header input').each(function() {
    var layer = Layer.find(this.parentNode.parentNode.getAttribute('data-layer-name'))[0];

    if (TECHO.view == 'map') {
      if (this.checked) layer.show(map);
      else layer.hide();
    }
    else {
      if (this.checked) {
        var $table = $('#' + layer.name + '-table_wrapper');
        $table.show().siblings().hide();
      }
    }
  });
}

var bubble = null;

var COLUMNS = {
  barrios: [
    {sName: "semaforo_riesgo_absoluto", sTitle: "Semáforo (Riesgo)", asSorting: ["desc", "asc"]},
    {sName: "semaforo_legal_absoluto", sTitle: "Semáforo (Legal)", asSorting: ["desc", "asc"]},
    {sName: "razon_social", sTitle: "Razón social", fnRender: function(o) {
      return '<a href="/industrias/' + o.aData[3] + '">' + o.aData[o.iDataColumn] + '</a>';
    }},
    {sName: "cuit", sTitle: "CUIT"},
    {sName: "curt", sTitle: "CURT"},
    {sName: "localidad_real", sTitle: "Localidad"},
    {sName: "partido_real", sTitle: "Partido"},
    {sName: "sitio_web", sTitle: "URL"},
    {sName: "personal_fabrica", sTitle: "Personal fábrica"},
    {sName: "personal_oficina", sTitle: "Personal oficina"},
    {sName: "superficie_total", sTitle: "Sup. total"},
    {sName: "superficie_cubierta", sTitle: "Sup. cubierta"},
    {sName: "consumo_electricidad", sTitle: "Consumo eléctrico"},
    {sName: "actividad_1", sTitle: "Actividad 1"},
    {sName: "actividad_2", sTitle: "Actividad 2"},
    {sName: "actividad_3", sTitle: "Actividad 3"},
    {sName: "actividad_4", sTitle: "Actividad 4"},
    {sName: "actividad_5", sTitle: "Actividad 5"},
    {sName: "location", sTitle: "Dirección"},
    // {sName: "residuos_liquidos", sTitle: "Res. líquidos"},
    {sName: "emisiones_gaseosas", sTitle: "Emisiones gaseosas"},
    {sName: "residuos_patogenicos", sTitle: "Res. patogénicos"},
    {sName: "residuos_peligrosos", sTitle: "Res. peligrosos"},
    {sName: "residuos_solidos", sTitle: "Res. sólidos"},
    {sName: "tratamiento_de_efluentes", sTitle: "Trata efluentes líquidos"},
  ],
};

function fillTable($table, cols, rows) {
  var dataTable = $table.dataTable();

  dataTable.fnClearTable();
  dataTable.fnAddData(rows);
}

function Layer(name, source) {
  var layer = this;

  this.name = name;
  this.source = source;
  this.visible = true;

  this.ftLayer = new google.maps.FusionTablesLayer({
    suppressInfoWindows: true
  });

  return this;
}

Layer.bubble = new google.maps.InfoWindow();

Layer.prototype.hide = function() {
  this.visible = false;
  this.ftLayer.setMap(null);
}

Layer.prototype.show = function(map) {
  this.visible = true;
  this.ftLayer.setMap(map);
}

Layer.prototype.getBubbleHTML = function(row) {
  return $('#' + this.name + '-bubble-template').tmpl(row).get(0);
}

Layer.prototype.refreshMap = function(map) {
  Layer.bubble.close();

  var options = {
    query: {
      select: 'Poligono',
      from: this.source
    }
  }

  if (this.conditions.length > 0) options.query.where = this.conditions.join(" AND ");

  this.ftLayer.setOptions(options);

  if (this.visible) {
    this.show(map);
  }

  var layer = this;

  google.maps.event.addListener(this.ftLayer, 'click', function(e) {
    Layer.bubble.close();

    Layer.bubble.setContent(layer.getBubbleHTML(e.row));
    Layer.bubble.setPosition(e.latLng);

    Layer.bubble.open(map);
    $(document.body).trigger('bubble.maps', Layer.bubble);
  });
}

Layer.prototype.getMap = function() {
  return this.ftLayer.getMap();
}

Layer.prototype.getColumns = function() {
  return COLUMNS[this.name];
}

Layer.prototype.refreshTable = function($table) {
  this.query(function(table) {
    fillTable($table, table.cols, table.rows);
  });
}

Layer.prototype.query = function(callback) {
  var cols = $.map(this.getColumns(), function(e) { return "'" + e.sName + "'"; });

  var sql = 'select ' + cols.join(', ') + ' from ' + this.source;

  if (this.conditions.length > 0) {
    sql += ' where ' + this.conditions.join(' AND ');
  }

  $.getJSON('http://fusiontables.googleusercontent.com/fusiontables/api/query?sql=' + encodeURIComponent(sql) + '&jsonCallback=?')
    .success(function(res) {
      callback(res.table);
    });
}

Layer.layers = {};
Layer.all = [];

Layer.add = function(name, source) {
  var layer = new Layer(name, source);

  Layer.layers[name] = layer;
  Layer.all.push(layer);

  return layer;
}

Layer.find = function(name) {
  if (name == '*') return Layer.all;

  var layers = name.split(',');

  for (var i = 0, l = layers.length; i < l; i++) {
    layers[i] = Layer.layers[layers[i]];
  }

  return layers;
}

Layer.stringToLatLng = function(string) {
  var parts = string.split(' ');

  return new google.maps.LatLng(parseFloat(parts[0]), parseFloat(parts[1]));
}

$(function() {
  var $sidebar = $('#sidebar');

  window.layersOnMap = $.makeArray($('#layers li').map(function() { return this.getAttribute('data-layer-name'); })).join(',');

  $('.filter').delegate('input', 'click', function(e) {
    refresh();
    e.stopPropagation();
  });

  $('.filter').delegate('label', 'click', function(e) {
    $(this).siblings().find('input').attr('checked', false);
    $(this).find('input').attr('checked', true);
    refresh();
    e.stopPropagation();
    e.preventDefault();
  });

  var $booleans = $('.filter *[data-boolean-filter]')

  $booleans.wrapInner('<span />');

  $booleans.append('<div class="tristate" />').find('div').slider({
    max: 1,
    min: -1,
    change: function(_, ui) {
      refresh();
    }
  });

  $booleans.find('span').click(function() {
    var $this = $(this);
    var $slider = $this.siblings('div');

    var value = $slider.slider('option', 'value') + 1;
    var max = $slider.slider('option', 'max');

    if (value > max) value = $slider.slider('option', 'min');

    $slider.slider('option', 'value', value);
  });

  $('.filter *[data-states-filter]').each(function() {
    var $this = $(this);

    var $lis = $this.find('li');

    $lis.each(function(index) {
      var $li = $(this);
      $li.css('bottom', (($lis.length - index - 1) * 100 / $lis.length) + '%');
    });

    var $slider = $('<div />').appendTo($this).slider({
      min: 0,
      max: 3,
      orientation: 'vertical',
      change: function(_, ui) {
        refresh();
      }
    });
  });

  $('.views a[href="#view=map"]').click(function() {
    $sidebar.find('header input').each(function() {
      this.type = 'checkbox';
      this.checked = true;
    });

    $(this).addClass('active');
    $(this).siblings().removeClass('active');
    $('#map').show();
    $('#table').hide();
    TECHO.view = 'map';
    refresh();
  });

  $('.views a[href="#view=table"]').click(function() {
    $sidebar.find('header input')
      .each(function() { this.type = 'radio'; })
      .filter(':first').attr('checked', true);

    $(this).addClass('active');
    $(this).siblings().removeClass('active');
    $('#map').hide();
    $('#table').show();
    TECHO.view = 'table';
    refreshVisibleEntities();
    refresh();
  });


  $('#table table').each(function() {
    var layer = Layer.find(this.id.split('-')[0])[0];

    $(this).dataTable({
      bJQueryUI: true,
      sScrollY: '100%',
      sScrollX: '100%',
      aoColumns: layer.getColumns(),
      aLengthMenu: [[25, 50, 100, -1], [25, 50, 100, "Todos"]],
      iDisplayLength: 25,
      oLanguage: {
        'sProcessing':   'Procesando...',
        'sLengthMenu':   'Mostrar _MENU_ registros por página',
        'sZeroRecords':  'No se encontraron resultados',
        // 'sInfo':         '_START_-_END_/<big>_TOTAL_</big> registros en total',
        'sInfo':         '_TOTAL_ registros',
        'sInfoEmpty':    'No hay registros',
        'sInfoFiltered': '(filtrado de _MAX_ registros en total)',
        'sInfoPostFix':  '',
        'sSearch':       'Filtrar por texto libre:',
        'sUrl':          '',
        'oPaginate': {
          'sFirst':    'Primero',
          'sPrevious': 'Anterior',
          'sNext':     'Siguiente',
          'sLast':     'Último'
        }
      }
    });
  });

  $('.dataTables_info').each(function() {
    $(this).prependTo(this.parentNode.parentNode.firstChild)
  });

  $('.dataTables_paginate').each(function() {
    $(this).prependTo(this.parentNode.parentNode.firstChild)
  });

  $('.dataTables_scrollBody').wrap('<div class="dataTables_scrollBodyWrapper" />');

  $sidebar.delegate('input', 'click', function(e) {
    refreshVisibleEntities();
    refresh();
  });

  $sidebar.delegate('li > header', 'click', function(e) {
    var $li = $(this).parent();

    if ($li.hasClass('disabled')) return;

    var $input = $li.find('input');

    if (e.target == $input[0]) return;

    var current = $sidebar.data('current');

    if (current && current[0][0] != $li[0]) {
      current[1].css('height', 0);
    }

    var $panel = $($li.find('a').attr('href'));

    if (parseInt($panel.css('height')) > 0) {
      $panel.css('height', 0);
    }
    else {
      $sidebar.data('current', [$li, $panel]);
      $input.attr('checked', true);
      refreshVisibleEntities();
      refresh();
      $panel.css('height', $panel.data('height'));
    }

    return false;
  });

  $('<div>').appendTo('.filter .meter').slider({
    max: 10,
    min: 0,
    range: true,
    values: [0, 10],
    change: function(_, ui) {
      refresh();
    }
  });

  $('.filter.range-filter').each(function() {
    var max = parseInt(this.getAttribute('data-max'));
    var min = parseInt(this.getAttribute('data-min'));
    var $this = $(this);

    $this.data('result', $this.find('.result'));

    $this.data('updateValues', function(values) {
      var caption = values.join('–');
      $this.data('result').text(caption);
    });

    $('<div>').prependTo($('div', this)).slider({
      max: 100,
      min: 0,
      step: parseInt(this.getAttribute('data-step')),
      range: true,
      values: [0, 100],
      slide: function(_, ui) {
        var values = $.map(ui.values, function(e) { return Math.pow(e, 3) * max / Math.pow(100.0, 3) });
        $(this.parentNode.parentNode).data('updateValues')(values);
      },
      change: function(_, ui) {
        refresh();
      }
    });

    $this.data('updateValues')([min, max]);
  });

  $('.zoomed-map').each(function() {
    var type = (this.getAttribute('data-map-type') || 'roadmap').toUpperCase();
    var zoom = parseInt(this.getAttribute('data-zoom') || 15);

    var map = new google.maps.Map(this, {
      zoom: zoom,
      mapTypeControl: false,
      navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
      mapTypeId: google.maps.MapTypeId[type]
    });

    $(this).data('map', map);

    if (this.getAttribute('data-table-id')) {
      var table = this.getAttribute('data-table-id');
      var filter = this.getAttribute('data-filter');

      map.setCenter(Layer.stringToLatLng(this.getAttribute('data-center')));

      var layer = new google.maps.FusionTablesLayer({
        suppressInfoWindows: true,
        map: map
      });

      layer.setOptions({
        query: {
          select: 'Poligono',
          from: table,
          where: filter
        }
      });
    }
    else{
      var lat = parseFloat(this.getAttribute('data-lat'));
      var lng = parseFloat(this.getAttribute('data-lng'));

      var latlng = new google.maps.LatLng(lat, lng);

      map.setCenter(latlng);

      var marker = new google.maps.Marker({
        map: map,
        position: latlng
      });
    }
  });

  $('.image-slider').each(function() {
    var $this = $(this);
    var $images = $this.find('img');
    var $last = $($images.get(-1));

    $this.css({
      position: 'relative',
      height: $last.height()
    });

    $images.css({
      position: 'absolute',
      left: 0,
      top: 0
    });

    $images.filter(':not(:last-child)').css('opacity', 0);

    var max = $images.length - 1;

    $('<div>').appendTo(this).slider({
      min: 0,
      max: max,
      value: max,
      slide: function(_, ui) {
        var value = ui.value;
        var previous = $this.data('previousValue') || max;

        if (typeof(previous) != 'undefined') $($images.get(previous)).css('opacity', 0);
        $($images.get(value)).css('opacity', 1);

        $this.data('previousValue', value);
      }
    });
  });
});

function excerpt(s, size) {
  if (s.length > size) {
    return s.slice(0, 50) + "...";
  }

  return s;
}

function query(sql, cb) {
  url = 'http://www.google.com/fusiontables/api/query?sql=';
  var url = url + encodeURIComponent(sql) + '&jsonCallback=?';
  $.getJSON(url).success(function(res) { cb(res.table.cols, res.table.rows) });
}

function snap(n) {
  var d = n - parseInt(n * 10) / 10;

  if (d <= 0.03) return n - d;
  if (d <= 0.05) return n + 0.05 - d;
  if (d <= 0.07) return n + 0.05 - d;
  if (d <= 0.07) return n + 0.05 - d;
  return n + 0.1 - d;
}

function snap2(n) {
  // var d = n - parseInt(n * 10) / 10;

  // if (d <= 0.05) return n - parseFloat(d.toFixed(2));
  // return n + 0.1 - parseFloat(d.toFixed(2));
  return parseInt(n * 10) / 10;
}

function unsnap2(n) {
  n = parseFloat(n);
  return [n.toFixed(2), (n + 0.1).toFixed(2)];
}

function semaforo($chart) {
  if ($chart.length == 0) return;

  var rows = TECHO.industrias.semaforo;
  var data = {};

  for (var i = 0; i < rows.length; i++) {
    var x = rows[i][0],
        y = rows[i][1];

    x = snap2(x);
    y = snap2(y);

    if (!data[x])    data[x] = {};
    if (!data[x][y]) data[x][y] = 0;

    data[x][y] += 1;
  }

  var topmargin = 10;
  var stepsX = 11;
  var stepsY = 11;

  var width = $chart.innerWidth(),
      height = $chart.innerHeight(),
      leftgutter = 6,
      bottomgutter = 6,
      r = Raphael($chart[0], width, height),
      txt = {"font": '10px Fontin-Sans, Arial', stroke: "none", fill: "#666"},
      X = (width - leftgutter - 2) / stepsX,
      Y = (height - bottomgutter - 2 - topmargin) / stepsY,
      max = Math.round(X / 2) - 2;

  var vgradient = '90-#d11717:0-#e28418:25-#e2cf24:50-#89b71d:75-#10ad0d:100';
  var hgradient = '00-#d11717:0-#e28418:25-#e2cf24:50-#89b71d:75-#10ad0d:100';

  r.rect(6 + 2, height - 6, width - 6 - 2, 6, 3).attr({fill: hgradient, stroke: 'none'});
  r.rect(0, topmargin - R, 6, height - 6 - 2, 3).attr({fill: vgradient, stroke: 'none'});

  r.path('M ' + (leftgutter + 2) + ' ' + ((height - bottomgutter - 2) / 2) + ' L' + width + ' ' + ((height - bottomgutter - 2) / 2)).attr({stroke: '#ddd'});
  r.path('M ' + (leftgutter + 2 + ((width - leftgutter - 2) / 2)) + ' ' + 0 + ' L' + (leftgutter + 2 + ((width - leftgutter - 2) / 2)) + ' ' + (height - bottomgutter - 2)).attr({stroke: '#ddd'});

  var draw = (function (r, dx, dy, R, value, color, interactive, callback) {
    var dt = r.circle(dx + R, dy, R).attr({stroke: "none", fill: color});
    var bg;
    if (R < 6) {
      var bg = r.circle(dx + R, dy, 6).attr({stroke: "none", fill: "#000", opacity: .4}).hide();
    }
    var lbl = r.text(dx + R, dy, value)
        .attr({"font": '10px Fontin-Sans, Arial', stroke: "none", fill: "#fff"}).hide();
    var dot = r.circle(dx + R, dy, max).attr({stroke: "none", fill: "#000", opacity: 0});

    if (interactive) {
      dot[0].onmouseover = function () {
        var el = null;

        if (bg) {
          el = bg;
          bg.show();
        } else {
          var clr = Raphael.rgb2hsb(color);
          clr.b = .5;
          dt.attr("fill", Raphael.hsb2rgb(clr).hex);
          el = dt;
        }

        lbl.show();
      };
      dot[0].onmouseout = function () {
        if (bg) {
          bg.hide();
        } else {
          dt.attr("fill", color);
        }
        lbl.hide();
      };

      if (callback) {
        dot[0].onclick = callback;
      }
    }
  });

  var dots = [];

  var interactive = $chart.parent().hasClass('filter');

  for (x in data) {
    for (y in data[x]) {
      var count = data[x][y];

      var R = count && Math.min(Math.round(Math.sqrt(count / Math.PI) * 4), max);

      var f = 0;

      if (R) {
        var dx = leftgutter + X * (((1-x) * 10) + f) - R;
        var dy = topmargin + Y * ((y * 10) + f);

        if (interactive) {
          draw(r, dx, dy, R, count, '#ddd', true, (function(x, y) {
            return function() {
              $chart.data('x', x);
              $chart.data('y', y);
              refresh();
            }
          })(x, y)
          );
        }
        else {
          draw(r, dx, dy, R, count, '#ddd');
        }
      }
    }
  }

  if ($chart[0].getAttribute('data-x')) {
    var x = parseFloat($chart[0].getAttribute('data-x'));
    var y = parseFloat($chart[0].getAttribute('data-y'));

    var dx = leftgutter + X * (((1-x) * 10) + f) - R;
    var dy = topmargin + Y * ((y * 10) + f);
    draw(r, dx, dy, 3, 1, '#000000');
  }
}

$(function() {
  semaforo($('.chart'));

  $(document.body).bind('bubble.maps', function(_, element) {
    semaforo($('.chart', element.content));
  });
});
