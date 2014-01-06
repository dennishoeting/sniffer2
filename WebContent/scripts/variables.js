// Array mit Ergebnissen
var resultsArray = null;
var relationshipsArray = null;
var visibleResults = 0;
var lastQuery = null;
var browserValid = false;
var currentViewIsOverview = true;
var currentResultInDetail = null;
var allRelationshipsShown = false;
var dateSortDirectionAsc = true;
var idSortDirectionAsc = true;
var distanceSortDirectionAsc = true;

// Constants
var oneDayInMS = 1000*60*60*24;
var MAX_ZOOM = 16;
var MIN_ZOOM = 5;
var MESSAGE_REQUEST_LIMIT = 10;
var LOCATION_EQUALITY_EDGE = 100; //in m
var MAX_SLIDER_VALUE = 100;
var currentSliderValue = 20;
var currentRange = 0;

// Map
var myMap;
var myOptions;
var mapLocation;
var myCircle;
var infowindow = new google.maps.InfoWindow();
var myMarkers = new Array();
var relationshipMarkers = new Array();
var polylineArray = new Array();
var markerBounds = new google.maps.LatLngBounds();
var relationshipBounds = new google.maps.LatLngBounds();
var initialized = false;
var rangeSliderDiv;
var userPositionMarker = null;
