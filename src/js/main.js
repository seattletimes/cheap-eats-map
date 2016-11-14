// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");

var geolocation = require("./lib/geolocation");

var mapElement = document.querySelector("leaflet-map");
var map = mapElement.map;
var L = mapElement.leaflet;
var detailPanel = document.querySelector(".detail-panel");
var dot = require("./lib/dot");

var locationMarker = L.circle();

var restaurantLayer = L.featureGroup();

var detailTemplate = dot.compile(require("./_detail.html"));

var showRestaurant = function(e) {
  var marker = e.target;
  var location = marker.data;
  detailPanel.innerHTML = detailTemplate({ location });
  detailPanel.classList.remove("empty");
}

var locateMe = document.querySelector(".locate-me");
locateMe.addEventListener("click", function() {
  if (locationMarker._map) {
    map.removeLayer(locationMarker);
    locateMe.querySelector("label").innerHTML = "Locate me";
  } else {
    geolocation.gps(function(err, coords, event) {
      locationMarker.setLatLng(coords);
      locationMarker.setRadius(event.coords.accuracy);
      locationMarker.addTo(map);
      var bounds = locationMarker.getBounds();
      map.fitBounds(bounds);
      locateMe.querySelector("label").innerHTML = "Clear";
    });
  }
});

window.eats.forEach(function(location) {
  var marker = L.marker([location.lat, location.long], {
    icon: L.divIcon({
      className: "restaurant"
    })
  });
  marker.addEventListener("click", showRestaurant);
  marker.bindPopup(`<div class="restaurant-popup"><h1>${location.name}</h1></div>`)
  marker.data = location;
  marker.addTo(restaurantLayer);
});

restaurantLayer.addTo(map);
map.fitBounds(restaurantLayer.getBounds());