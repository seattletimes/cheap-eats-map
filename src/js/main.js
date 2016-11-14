// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");

var geolocation = require("./lib/geolocation");
var dot = require("./lib/dot");
var $ = require("./lib/qsa");

var mapElement = document.querySelector("leaflet-map");
var map = mapElement.map;
var L = mapElement.leaflet;
var detailPanel = document.querySelector(".detail-panel");
var maxZoom = 14;

var locationMarker = L.circle();
var displayLayer = L.featureGroup();

var categoryMap = {};
var lookup = {};
var selected = [];

var detailTemplate = dot.compile(require("./_detail.html"));
var introTemplate = dot.compile(require("./_intro.html"));

var reset = function() {
  var categories = Object.keys(categoryMap);
  var top = window.eats.filter(l => selected.length ? selected.some(s => s in l.categories): true).slice(0, 5);
  detailPanel.innerHTML = introTemplate({ categories, selected, top });
  detailPanel.classList.add("empty");
  map.fitBounds(displayLayer.getBounds(), { maxZoom });
};

var setLocation = function(location) {
  detailPanel.innerHTML = detailTemplate({ location });
  detailPanel.classList.remove("empty");
}

var clickedMarker = function(e) {
  var marker = e.target;
  var location = marker.data;
  setLocation(location);
};

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
      map.fitBounds(bounds, { maxZoom });
      locateMe.querySelector("label").innerHTML = "Clear";
    });
  }
});

window.eats.forEach(function(location, i) {
  location.id = i;
  lookup[i] = location;
  var types = location.type.split(/,\s*/);
  location.categories = {};
  types.forEach(t => {
    location.categories[t] = true;
    if (!categoryMap[t]) categoryMap[t] = [];
    categoryMap[t].push(location);
  });
  var marker = L.marker([location.lat, location.long], {
    icon: L.divIcon({
      className: "restaurant"
    })
  });
  var [month, day, year] = location.review_date.split("/").map(Number);
  location.date = new Date(year, month - 1, day);
  marker.addEventListener("click", clickedMarker);
  marker.bindPopup(`<div class="restaurant-popup"><h1>${location.name}</h1></div>`);
  marker.data = location;
  location.marker = marker;
  marker.addTo(displayLayer);
});

window.eats.sort((a, b) => b.date - a.date);

detailPanel.addEventListener("change", function(e) {
  var checked = $("input:checked", detailPanel).map(el => el.id);
  selected = checked;
  window.eats.forEach(function(location) {
    var match = selected.length ? selected.some(s => s in location.categories) : true;
    if (match) {
      displayLayer.addLayer(location.marker);
    } else {
      displayLayer.removeLayer(location.marker);
    }
  });
  reset();
});

detailPanel.addEventListener("click", function(e) {
  if (e.target.classList.contains("back")) {
    reset();
  } else if (e.target.classList.contains("reset")) {
    selected = [];
    reset();
  } else if (e.target.hasAttribute("data-marker")) {
    var id = e.target.getAttribute("data-marker") * 1;
    var location = lookup[id];
    setLocation(location);
    map.setView(location.marker.getLatLng(), 14);
  }
});

displayLayer.addTo(map);
map.fitBounds(displayLayer.getBounds(), { maxZoom });
reset();