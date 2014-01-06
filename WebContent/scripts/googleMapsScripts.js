/*
 * INITIALIZE MAP
 */
function initMap() {
 	// Fallback location: Oldenburg
	oldenburg = new google.maps.LatLng(53.146848, 8.180931);
	mapLocation = oldenburg;
	
	// Options
	myOptions = {
		zoom: 15,
		center: mapLocation,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		backgroundColor: "#D0F4DB",
		maxZoom: MAX_ZOOM,
		minZoom: MIN_ZOOM,
		streetViewControl: false
	};

	// Initialize map
	myMap = new google.maps.Map(document.getElementById("map"), myOptions);
	
	// Add custom controls
	var toggleRelationshipsInMapDiv = document.createElement('DIV');
	var toggleRelationships = new ToggleRelationshipsControl(toggleRelationshipsInMapDiv, myMap);
	toggleRelationshipsInMapDiv.index = 1;
	myMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(toggleRelationshipsInMapDiv);


	// Add custom controls
	rangeSliderDiv = document.createElement('DIV');
	var rangeSlider = new RangeSliderControl(rangeSliderDiv, myMap);
	rangeSliderDiv.index = 1;
}

/*
 * INITIALIZE GEOCODING
 */
function initGeoLocation() {
	// get geocoder
	var geocoder = new google.maps.Geocoder();
	
	if (navigator.geolocation) {
		// Try W3C Geolocation method (Preferred)
		navigator.geolocation.getCurrentPosition(
			function(position) {
				handleSuccess(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
			}, function() {
				handleNoGeolocation();
			});
	} else if (google.gears) {
		// Try Google Gears Geolocation
		var geo = google.gears.factory.create('beta.geolocation');
		geo.getCurrentPosition(
			function(position) {
				handleSuccess(new google.maps.LatLng(position.latitude, position.longitude));
			}, function() {
				handleNoGeolocation();
			});
	} else {
		// Browser doesn't support Geolocation
		handleNoGeolocation();
	}
	
	/*
	 * Exception, no geocoding possible
	 */
	function handleNoGeolocation() {
		mapLocation = oldenburg;
		contentString = "Error: The Geolocation service failed.";
		initialized = true;
	}
	
	/*
	 * Jeah
	 * Geolocation succeeded
	 */
	function handleSuccess(userLocation) {
		// set location
		mapLocation = userLocation;
		
		// set marker
		if(!userPositionMarker) {
			userPositionMarker = new google.maps.Marker({
			    position: mapLocation,
			    map: myMap,
			    title: "Your position!",
			    draggable: true
			  });
		
			google.maps.event.addListener(userPositionMarker, "dragend", function() {
				mapLocation = this.getPosition();
				drawCircle(calcCircleRadius());
			});
		}
		
		// Extend bounds
		if(currentViewIsOverview) {
			markerBounds.extend(mapLocation);
			myMap.fitBounds(markerBounds);
		} else {
			relationshipBounds.extend(mapLocation);
			myMap.fitBounds(relationshipBounds);
		}

		// Get address
		if (geocoder) {
			geocoder.geocode({
				'latLng' : mapLocation
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					$("#locInput").val(
							results[0].address_components[2].short_name 
							+ " " + results[0].formatted_address);
				}
			});
		}
		
		// Draw circle
		drawCircle(calcCircleRadius());
		
		initialized = true;
	}
}

/*
 * Draw the range circle
 */
function drawCircle(size) {
	// Only once
	if(myCircle && myMap) {
		myCircle.setRadius(parseInt(size));
		myCircle.setCenter(mapLocation);
		if(myCircle.getMap() == null) myCircle.setMap(myMap);
	} else {
		myCircle = new google.maps.Circle({
			center : mapLocation,
			clickable : false,
			map: myMap,
			strokeOpacity: 0.8,
			strokeWeight: 1,
			fillOpacity : 0.3,
			fillColor : "#000000",
			radius : parseInt(size)
		});
	}
}

/*
 * Hide the range circle
 */
function hideCircle() {
	myCircle.setMap(null);
}

/*
 * Calculate optimal circle size
 */
function calcCircleRadius() {
	/* Calc max radius: */
	var latLng1 = myMap.getBounds().getNorthEast();
	var latLng2 = myMap.getBounds().getSouthWest();
	var distance = distanceInMeter(latLng1.lat(), latLng1.lng(), 
			latLng2.lat(), latLng2.lng());
	
	var maxRadius = distance * 0.22; // 22% fits very well..
	// TODO zoom level 0 und 1 passen hier fuer nicht ganz..
	var radInM =  ((currentSliderValue) / MAX_SLIDER_VALUE) * maxRadius;
	currentRange = Math.round(radInM);
	return radInM;
}

/*
 * HELPER FUNCTION
 * Calculate distance between two points
 */
function distanceInMeter(lat1, lon1, lat2, lon2) {
	var R = 6371;
	var dLat = (lat2-lat1) * Math.PI / 180;
	var dLon = (lon2-lon1) * Math.PI / 180;
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
		Math.sin(dLon/2) * Math.sin(dLon/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c;
	return d * 1000;
}  

function ToggleRelationshipsControl(controlDiv, map) {
	  // Set CSS styles for the DIV containing the control
	  // Setting padding to 5 px will offset the control
	  // from the edge of the map
	  controlDiv.style.padding = '5px';

	  // Set CSS for the control border
	  var controlUI = document.createElement('DIV');
	  controlUI.style.backgroundColor = 'white';
	  controlUI.style.borderStyle = 'solid';
	  controlUI.style.borderWidth = '2px';
	  controlUI.style.cursor = 'pointer';
	  controlUI.style.textAlign = 'center';
	  controlUI.title = 'Click to toggle representation of relationships in Map';
	  controlDiv.appendChild(controlUI);

	  // Set CSS for the control interior
	  var controlText = document.createElement('DIV');
	  controlText.style.fontFamily = 'Arial,sans-serif';
	  controlText.style.fontSize = '13px';
	  controlText.style.paddingLeft = '4px';
	  controlText.style.paddingRight = '4px';
	  controlText.style.paddingTop = '2px';
	  controlText.style.paddingBottom = '2px';
	  controlText.innerHTML = 'Toggle Relatonships';
	  controlUI.appendChild(controlText);

	  // Setup the click event listeners: simply set the map to Chicago
	  google.maps.event.addDomListener(controlUI, 'click', function() {
	    if(!currentViewIsOverview) {return;}
		  if(!allRelationshipsShown) {
	    	for(var i=0; i<myMarkers.length; i++) {
	    		var counter = 0;
	    		for(var j=0; j<myMarkers.length; j++)
	    			if(distanceInMeter(resultsArray[i].latLng.lat(), resultsArray[i].latLng.lng(), resultsArray[j].latLng.lat(), resultsArray[j].latLng.lng()) < LOCATION_EQUALITY_EDGE) {
	    				counter++;
	    			}
	    			
	    		for(var j=0; j<myMarkers.length; j++)
	    			if(distanceInMeter(resultsArray[i].latLng.lat(), resultsArray[i].latLng.lng(), resultsArray[j].latLng.lat(), resultsArray[j].latLng.lng()) < LOCATION_EQUALITY_EDGE) {
	    				showRelationships(j, getColor(j, counter));
	    			}
	    	}
	    	allRelationshipsShown = true;
	    } else {
	    	hideRelationships();
	    	allRelationshipsShown = false;
	    }
	  });
}

function RangeSliderControl(controlDiv, map) {
	// Set CSS styles for the DIV containing the control
	  // Setting padding to 5 px will offset the control
	  // from the edge of the map
	  controlDiv.style.padding = '5px';

	  // Set CSS for the control border
	  var controlUI = document.createElement('DIV');
	  controlUI.style.backgroundColor = 'white';
	  controlUI.style.borderStyle = 'solid';
	  controlUI.style.borderWidth = '2px';
	  controlUI.style.marginTop = '2px';
	  controlUI.style.cursor = 'pointer';
	  controlUI.style.textAlign = 'center';
	  controlUI.title = 'Click to toggle representation of relationships in Map';
	  controlDiv.appendChild(controlUI);
	  
	  var table = document.createElement('TABLE');
	  controlUI.appendChild(table);

	  var tr = document.createElement('TR');
	  table.appendChild(tr);
	  
	  var td1 = document.createElement('TD');
	  tr.appendChild(td1);
	  var td2 = document.createElement('TD');
	  tr.appendChild(td2);
	  var td3 = document.createElement('TD');
	  tr.appendChild(td3);
	  
	  var rangeText = document.createElement('DIV');
	  rangeText.innerHTML = "Range:";
	  td1.appendChild(rangeText);
	  
	  var sliderDiv = document.createElement('DIV');
	  sliderDiv.id = "slider-vertical";
	  sliderDiv.style.width = "200px";
	  td2.appendChild(sliderDiv);

	  var rangeValue = document.createElement('DIV');
	  rangeValue.innerHTML = "<b>0m</b>";
	  rangeValue.style.width = "100px";
	  td3.appendChild(rangeValue);
	  
	  $(sliderDiv).slider({
		  orientation: "horizontal",
		  range: "min",
		  min: 0,
		  max: MAX_SLIDER_VALUE,
		  value: currentSliderValue,
		  slide: function( event, ui ) {
			  currentSliderValue = ui.value;
			  if(!$("#locRange").prop("disabled")) drawCircle(calcCircleRadius());
			  rangeValue.innerHTML = "<b>"+currentRange + "m</b>";
		  }
	  });

	  rangeValue.innerHTML = 0 + "m";
}