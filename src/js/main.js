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
var listOffset = 0;
var listLength = 10;

var locationMarker = L.circle();
var displayLayer = L.featureGroup();

var categoryMap = {};
var lookup = {};
var selected = [];

var detailTemplate = dot.compile(require("./_detail.html"));
var introTemplate = dot.compile(require("./_intro.html"));

var byDate = (a, b) => b.date - a.date;
var byName = (a, b) => b.name < a.name ? 1 : -1;

var reset = function() {
  var categories = Object.keys(categoryMap).sort();
  var results = [];

  var eats = window.eats.slice();
  eats.sort(selected.length ? byName : byDate);

  eats.forEach(function(location) {
    var match = selected.length ? selected.some(s => s in location.categories) : true;
    if (match) {
      displayLayer.addLayer(location.marker);
      results.push(location);
    } else {
      displayLayer.removeLayer(location.marker);
    }
  });
  if (listOffset > results.length) {
    listOffset = 0;
  }
  if (listOffset < 0) {
    listOffset = 0;
  }
  detailPanel.innerHTML = introTemplate({ categories, selected, results, listOffset, listLength });
  map.fitBounds(displayLayer.getBounds(), { maxZoom });
  if (selected.length) {
    detailPanel.classList.add("filtered");
  } else {
    detailPanel.classList.remove("filtered");
  }
};

var setLocation = function(location) {
  detailPanel.innerHTML = detailTemplate({ location });
};

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

  if (location.website && location.website.indexOf("://") == -1) {
    location.website = "http://" + location.website;
  }

  var size = 16;
  var marker = L.marker([location.lat, location.long], {
    icon: L.divIcon({
      className: `restaurant ${location.picks ? "featured" : ""}`,
      iconSize: [size, size],
      html: location.picks ? "&bigstar;" : ""
    })
  });
  if (location.review_date) {
    var [month, day, year] = location.review_date.split("/").map(Number);
    location.date = new Date(year, month - 1, day);
  }
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
  listOffset = 0;
  reset();
});

detailPanel.addEventListener("click", function(e) {
  if (e.target.classList.contains("back")) {
    reset();
    map.closePopup();
  } else if (e.target.classList.contains("reset")) {
    listOffset = 0;
    selected = [];
    reset();
  } else if (e.target.classList.contains("paginate")) {
    if (e.target.classList.contains("next")) {
      listOffset += listLength;
    } else {
      listOffset -= listLength;
    }
    reset();
  } else if (e.target.hasAttribute("data-marker")) {
    var id = e.target.getAttribute("data-marker") * 1;
    var location = lookup[id];
    location.marker.openPopup();
    setLocation(location);
    map.setView(location.marker.getLatLng(), 14);
  }
});

displayLayer.addTo(map);
map.fitBounds(displayLayer.getBounds(), { maxZoom });
reset();