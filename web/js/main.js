var map;
var bufferLayer;
$(document).ready(function () {
    initDropZone();
    initSlider();

  var config = {
      tileUrl : 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      tileAttrib : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      initLatLng : new L.LatLng(37.8044,-122.2708),
      initZoom : 11,
      minZoom : 1,
      maxZoom : 17
  };

  map = L.map('map', {minZoom: config.minZoom, maxZoom: config.maxZoom});

  bufferLayer = addBufferLayer(bartStations,1.0);
  map.addLayer(new L.TileLayer(config.tileUrl, {attribution: config.tileAttrib}));

    var bartIcon = L.icon({
        iconUrl: 'images/bart.png',
        iconSize: [40, 32],
        iconAnchor: [20, 16]
    })

    var pinIcon = L.icon({
        iconUrl: 'images/marker-icon.png'
    });

    //Bart Stations
    L.geoJson([bartStations], {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: bartIcon});
        }
    }).addTo(map);

    //Casual Carpool Pickups
    L.geoJson([casualCarpoolLocations], {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: pinIcon});
        }
    }).addTo(map);

    map.setView(config.initLatLng, config.initZoom);

  });

function addBufferLayer(geoJSON,radius){
    if(bufferLayer) bufferLayer.clearLayers();
    var dd = (1609.34 * radius)/((Math.PI/180) * 6378137);
    var reader = new jsts.io.GeoJSONReader();
    var writer = new jsts.io.GeoJSONWriter();
    var geom = reader.read(geoJSON);

    //CascadedPolygonUnion
     var polys = [];
     for(var i = 0; i <  geom.features.length; i++){
         polys.push(geom.features[i].geometry.buffer(dd,5));
     }
     var union = new jsts.operation.union.CascadedPolygonUnion(polys).union();
     return L.geoJson(writer.write(union)).addTo(map);
}

function initSlider(){
    $('#bufferSlider').slider({
        min:.1,
        max: 5.0,
        step:.1,
        value: 1.0
    }).on('slideStop',function (evt){
            bufferLayer = addBufferLayer(bartStations,evt.value);
        });
}
 function initDropZone(){
    var dz = $("#dropZone");
    dz.on('dragenter',function (e){
       e.stopPropagation();
       e.preventDefault();
       dz.toggleClass('drop-zone-hover');
    });
    dz.on('dragover',
        function (e) {
            e.stopPropagation();
            e.preventDefault();
        });
    dz.on('dragleave',
        function (e) {
            e.stopPropagation();
            e.preventDefault();
            dz.toggleClass('drop-zone-hover');
        });
    dz.on('drop',
        function (e) {
            e.stopPropagation();
            e.preventDefault();
            dz.toggleClass('drop-zone-hover');
            var files = e.originalEvent.dataTransfer.files;

            // files is a FileList of File objects. List some properties.
            for (var i = 0, f; f = files[i]; i++) {
                //console.log(f.name + ' - ' + f.type + ' - ' + f.size);
                //@TODO check file type here
                var reader = new FileReader();
                  reader.onload = function() {
                    //console.log(this.result);
                      var res = $.parse(this.result)
                      addToMap(res);
                     // console.log(res);
                  }
                  reader.readAsText(f);
            }
      });
 }


function addToMap(parseResult){
    var rows = parseResult.results.rows;
    var circle;
    for(var i = 0; i < rows.length; i++){
        if(rows[i].LONGITUDE && rows[i].LATITUDE){
            //console.log(rows[i]);
            circle = L.circle([Number(rows[i].LATITUDE),Number(rows[i].LONGITUDE)],50, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
            }).addTo(map).bindPopup(rows[i].ADDRESS + ' - ' + rows[i]["LIST PRICE"]);
        }

    }
}
