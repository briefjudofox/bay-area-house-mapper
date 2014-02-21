var map;
var bufferLayer;
$(document).ready(function () {
    initDropZone();
    initSlider();
    initBufferToggles();

    //Map Configs
    var config = {
        tileUrl: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        tileAttrib: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        initLatLng: new L.LatLng(37.8044, -122.2708),
        initZoom: 11,
        minZoom: 1,
        maxZoom: 17
    };

    //BART Icon
    var bartIcon = L.icon({
        iconUrl: 'images/pin-bart.png',
        iconSize: [20, 50]
    })

    //Casual Carpool Icon
    var carIcon = L.icon({
        iconUrl: 'images/pin-car.png',
        iconSize: [20, 50]
    });

    //Init Map
    map = L.map('map', {minZoom: config.minZoom, maxZoom: config.maxZoom});

    //Add Base Map
    map.addLayer(new L.TileLayer(config.tileUrl, {attribution: config.tileAttrib}));

    //Add Default Buffers Around BART Stations
    addBufferLayer([bartStations], 1.0);

    //Add Bart Stations
    L.geoJson([bartStations], {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: bartIcon});
        }
    }).addTo(map);

    //Add Casual Carpool Pickups
    L.geoJson([casualCarpoolLocations], {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: carIcon});
        }
    }).addTo(map);

    map.setView(config.initLatLng, config.initZoom);

});

/**
 * Takes an array of geojson points and a radius in miles.  Buffers
 * of radius in miles are added around the points and unioned to
 * create a multi-polygon which is added to the map.
 * @param Array of geoJSON
 * @param radius
 */
function addBufferLayer(geoJSON, radius) {
    if (bufferLayer) bufferLayer.clearLayers();
    var dd = (1609.34 * radius) / ((Math.PI / 180) * 6378137);
    var reader = new jsts.io.GeoJSONReader();
    var writer = new jsts.io.GeoJSONWriter();
    var geoms = [];
    for (var i = 0; i < geoJSON.length; i++) {
        geoms.push(reader.read(geoJSON[i]));
    }
    var polys = [];
    for (var j = 0; j < geoms.length; j++) {
        for (var i = 0; i < geoms[j].features.length; i++) {
            polys.push( geoms[j].features[i].geometry.buffer(dd, 5));
        }
    }
    var union = new jsts.operation.union.CascadedPolygonUnion(polys).union();
    bufferLayer = L.geoJson(writer.write(union)).addTo(map);
}

function initBufferToggles(){
    $('#bartChkBx,#casCarChkBx').change(function(e){
        var bufLayers = getBufferLayers();
        //if both false turn off layer and disable slider
        if(bufLayers.length == 0){
            if(bufferLayer) bufferLayer.clearLayers();
            //$('#bufferSlider').data('slider').picker.off();
            return;
        }
        //$('#bufferSlider').data('slider').picker.on();
        var bufDist = $('#bufferSlider').data('slider').getValue();
        addBufferLayer(bufLayers,bufDist);
    });
}

/**
 * Returns geojson representations of the point layers to buffer
 * based on the buffer check boxes.
 * @returns {Array}
 */
function getBufferLayers(){
    var bufToggles = $('#bartChkBx,#casCarChkBx');
    var bufLayers = [];
    if(bufToggles[0].checked) bufLayers.push(bartStations);
    if(bufToggles[1].checked) bufLayers.push(casualCarpoolLocations);
    return bufLayers;
}

/**
 * Initializes the buffer radius slider and assigns event handlers.
 */
function initSlider(){
    $('#bufferSlider').slider({
        min:.1,
        max: 5.0,
        step:.1,
        value: 1.0,
        formater: function (val){return val.toFixed(2);}
    }).on('slideStop',function (evt){
            var bufLayers = getBufferLayers();
            if(bufLayers.length == 0) return;
            addBufferLayer(bufLayers,evt.value);
        }).on('slide',function(evt){
            $('#bufDistLbl').html(evt.value.toFixed(2));
        });
}

/**
 * Initializes the drop area where you can drag and drop a CSV of
 * locations (e.g. Redfin exports)
 */
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

/**
 * Adds parsed CSV points (JSON) to the map if lat long is present
 * @param parseResult
 */
function addToMap(parseResult){
    var rows = parseResult.results.rows;
   // var circle;
   //Casual Carpool Icon
    var houseIcon = L.icon({
        iconUrl: 'images/pin-house.png',
        iconSize: [20, 50]
    });
    for(var i = 0; i < rows.length; i++){
        if(rows[i].LONGITUDE && rows[i].LATITUDE){
            L.marker([Number(rows[i].LATITUDE),Number(rows[i].LONGITUDE)], {icon: houseIcon}).addTo(map).
                bindPopup(rows[i].ADDRESS + ' - ' + rows[i]["LIST PRICE"]);

/*            circle = L.circle([Number(rows[i].LATITUDE),Number(rows[i].LONGITUDE)],50, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
            }).addTo(map).bindPopup(rows[i].ADDRESS + ' - ' + rows[i]["LIST PRICE"]);*/
        }

    }
}
