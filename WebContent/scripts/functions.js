/*
 * INITIALIZATION
 */
function initialize() {
	initMap();
	changeContentSize();
	sliderChanged();
	initNyro();
	initDatePickers();
	initCategoryPickers();
}

/*
 * Initialization of NyroModal popup plugin
 * All elements of the class "nyroModal" will be provided with the nyroModal functionality
 */
function initNyro() {
	var options = {
		 showCloseButton: false,
		 sizes: {w:$(document).width()}
	};
	$('.nyroModal').nyroModal(options);
}

/*
 * Initialization of google date picker plugin
 * Two date pickers are initiated
 * - id: datepickerFrom
 * - id: datepickerTo
 */
function initDatePickers() {
	var pickerSettings = {
		dateFormat: "dd.mm.yy",
		maxDate: "+0d"
	};

	$( "#datepickerFrom" ).datepicker(pickerSettings);
	$( "#datepickerTo" ).datepicker(pickerSettings);
}

function initCategoryPickers() {
	$("#categorySelector").multiselect(); 
}

/*
 * SEARCH FUNCTIONALITY
 */
function search() {
	setLoadingStarted();
	
	// Open popup
	$('#callLoadingDiv').nmCall();
	
	// Clear old Results
	resultsArray = new Array();
	visibleResults = 0;
	$("#resultsContent").html("");
	hideRelationships();
	for(var i=0; i<myMarkers.length; i++)
		myMarkers[i].setMap(null);
	myMarkers = new Array();
	
	// query string
	var data = "?";
	
	// save input elements as variables
	var queryInput = $("div.searchInput *[name=query]");
	var timeFromInput = $("#datepickerFrom");
	var timeToInput = $("#datepickerTo");
	var locInput = $("#locInput");
	var firstElement = true;
	
	// Add query input
	if(queryInput.val().trim()!="") {
		data += ((firstElement)?"":"&") +"query="+queryInput.val().trim();
		firstElement = false;
	} 
	
	// Add time input
	if($("#enableTimeCheckbox").attr("checked") && timeFromInput.val()!=null && timeFromInput.val().trim()!="" && timeToInput.val()!=null && timeToInput.val().trim()!="") {
		data += ((firstElement)?"":"&") +"timeFrom=" + timeFromInput.datepicker("getDate").getTime()
		+ "&timeTo=" + (timeToInput.datepicker("getDate").getTime() + oneDayInMS);
		firstElement = false;
	}
	
	// Add location input
	if($("#enableLocCheckbox").attr("checked") && locInput.val() != null && locInput.val().trim() != "") {
		data += ((firstElement)?"":"&") +"lat=" + mapLocation.lat()
		+ "&lng=" + mapLocation.lng();
		firstElement = false;
		
		if($("div.searchInput *[name=locRangeText] span").html() != "") {
			data += ((firstElement)?"":"&") +"distance="+parseFloat(parseFloat(currentRange)/parseFloat(1000));
		}
	} 
	
	// Add category input
	var catInput = $("#categorySelector").val();
	if($("#enableCategoryCheckbox").attr("checked") && catInput != null && catInput != "") {
		data += ((firstElement)?"":"&") +"categories=" + catInput;
		firstElement = false;
	}
	
	// Request
	requestDataViaAjax(data, 10);
}

/*
 * PARSING (HTTP-RESPONSE --> results-Array)
 */
function parseXMLResponse(data) {
	// ID-Counter (starting at 0, proceeding with offset)
	var idCount=visibleResults;
	
	// For each result in data
	$(data).find("result").each(function() {
		// Constitute result element
		var result = new Object();
		result.id = idCount;
		result.title = $(this).find("title").text();
		result.url = $(this).find("url").text();
		result.category = $(this).find("category").text();
		result.releaseDate = $(this).find("releaseDate").text();
		result.releaseAddress_city = $(this).find("releaseAddress city").text();
		result.latLng = new google.maps.LatLng($(this).find("releaseAddress lat").text(),$(this).find("releaseAddress lng").text());
		result.releaseAddress_distanceInKM = parseFloat($(this).find("releaseAddress distanceInKM").text()).toFixed(3);
		result.summary = $(this).find("summary").text().replace(/\[\/b\]/g,"</b>").replace(/\[b\]/g,"<b>");
	
		var addresses = new Array();
		$(this).find("content addresses address").each(function() {
			var address = new Object();
			address.street = $(this).find("street").text();
			address.houseNumber = $(this).find("houseNumber").text();
			address.zipCode = $(this).find("zipCode").text();
			address.city = $(this).find("city").text();
			address.latLng = new google.maps.LatLng($(this).find("lat").text(), $(this).find("lng").text());
			address.distanceInKM = $(this).find("distanceInKM").text();
			address.amount = 1;
			addresses.push(address);
		});
		result.addresses = addresses;
		
		var dates = new Array();
		$(this).find("content dates date").each(function() {
			dates.push($(this).text());
		});
		result.dates = dates;

		// push into arra
		idCount++;
		resultsArray.push(result);
	});
}

/*
 * RESULT PRINTING (results-Array --> HTML)
 */
function printCurrentResults(oldQuery) {
	setLoadingEnded();
	
	// Save query
	lastQuery = oldQuery;
	
	// Container
	var container = $("#resultsContent");
	container.html("");
	visibleResults = 0;
	
	// iterate through stored results
	for(var i=0; i<resultsArray.length; i++) {
		// Constitute result div
		var resultDiv = $('<div class="resultDiv"></div>');
		resultDiv.css("margin","5px");
		resultDiv.css("text-align","left");
		resultDiv.css("cursor","pointer");
		resultDiv.attr("name", resultsArray[i].id);
		
		var titleDiv = $('<div>');
		titleDiv.html('<b>'+resultsArray[i].title+'</b>');
		titleDiv.css('white-space', 'nowrap');
		titleDiv.css('width', '100%');
		titleDiv.css('overflow', 'hidden');
		titleDiv.css('text-overflow', 'ellipsis');	
		titleDiv.children("a").click(function(e) {
			e.preventDefault();
		});
		titleDiv.appendTo(resultDiv);
		
		var dateDiv = $('<div>');
		dateDiv.html('Date: ' + formatDate(resultsArray[i].releaseDate));
		dateDiv.appendTo(resultDiv);
		
		var locDiv = $('<div>');
		locDiv.html('Location: ' + resultsArray[i].releaseAddress_city);
		locDiv.appendTo(resultDiv);
		
		var catDiv = $('<div>');
		catDiv.html('Category: ' + resultsArray[i].category);
		catDiv.appendTo(resultDiv);
		
		var sumDiv = $('<div>');
		sumDiv.html(resultsArray[i].summary);
		sumDiv.appendTo(resultDiv);
		
		var linkDiv = $('<div>');
		linkDiv.html('<a href="'+resultsArray[i].url+'">[go to source]</a></b>');
		linkDiv.css("text-align", "right");
		linkDiv.appendTo(resultDiv);
		
		container.append(resultDiv);
		container.append("<hr />");
		

		// Register Listeners
		resultDiv.hover(
				//hover
				function() {
					$(this).css('background', 'white');
					//setInfoWindow('<b>'+resultsArray[$(this).attr('name')].title+'</b><br />'+resultsArray[$(this).attr('name')].summary, resultsArray[$(this).attr('name')].latLng);
					myMarkers[$(this).attr("markerId")].setAnimation(google.maps.Animation.BOUNCE);
					showRelationships($(this).attr('name'), "#ff0000");
				},
				//Hover Out
				function() {
					$(this).css('background', '');
					//unsetInfoWindow();
					myMarkers[$(this).attr("markerId")].setAnimation(null);
					if(currentViewIsOverview && !allRelationshipsShown) {
						hideRelationships();
					}
				}
			);
		
		resultDiv.click(function() {
			switchToDetailsView(parseInt($(this).attr('name')));
		});	
		
		// Update
		visibleResults++;
		
		// Show on Map if not already done
		var containmentId = myMarkers.containsMarkerAt(resultsArray[i].latLng);
		var newAmount = 0;
		if(containmentId>=0) {
			newAmount = myMarkers[containmentId].amount;
			newAmount++;
			myMarkers[containmentId].amount = newAmount;
//			myMarkers[containmentId].getIcon().scaledSize = new google.maps.Size(10*newAmount, 10*newAmount);
//			myMarkers[containmentId].getIcon().size = new google.maps.Size(10*newAmount, 10*newAmount);
			resultDiv.attr("markerId", containmentId);
			continue;
		}
		resultDiv.attr("markerId", myMarkers.length);
		
		var marker = new google.maps.Marker({
		    position: resultsArray[i].latLng,
		    map: myMap,
		    //title: resultsArray[i].title,
		    title: "Click for details",
		  });
		marker.setIcon(new google.maps.MarkerImage("img/AdvancedPaw.png"));
		marker.amount = 1;
		myMarkers.push(marker);

		// Extend bounds
		markerBounds.extend(resultsArray[i].latLng);
	
	}
	
	// Print <more> link using the old query and limit
	var moreLink = $('<a>');
	moreLink.attr('href', '#');
	moreLink.html("get more");
	moreLink.click(
			function(e) {
				e.preventDefault();
				setLoadingStarted();
				requestDataViaAjax(oldQuery, MESSAGE_REQUEST_LIMIT);
			});
	$("#moreResults").html(moreLink);

	// Enable view
	switchToOverview();
}

/*
 * VIEW SWITCHING 
 */
function switchToDetailsView(id) {
	// hide old relationships (mouse over)
	hideRelationships();
	
	// set current detail result
	currentResultInDetail = resultsArray[id];
	
	// if showing, hide popup
	if($.nmTop())
		$.nmTop().close();
	
	// hide overview markers
	for(var i=0; i<myMarkers.length; i++) myMarkers[i].setMap(null);
	
	// Show detail view link
	$("a.resultDetail").css("visibility", "visible");
	
	// Show detail view and hide overview
	$("div.resultsOverview").css("display", "none");
	$("div.resultsDetail").css("display", "block");
	
	// Fill detail view
	$("div.resultsDetail").attr("name", currentResultInDetail.id);
	$("div.resultsDetail div.title span").html("<b>"+currentResultInDetail.title+"</b>");
	$("div.resultsDetail div.date span").html(formatDate(currentResultInDetail.releaseDate));
	$("div.resultsDetail div.location span").html(currentResultInDetail.releaseAddress_city);
	$("div.resultsDetail div.category span").html(currentResultInDetail.category);
	$("div.resultsDetail div.summary span").html(currentResultInDetail.summary);
	$("div.resultsDetail div.link span").html("<a href=\""+currentResultInDetail.url+"\">[go to source]</a>");
	$("div.resultsDetail div.link").css("text-align", "right");
	
	// Clear old relationships
	$("div.resultsDetail div.addresses").html("");
	
	// Process relationships
	relationshipsArray = new Array();
	for(var i=0; i<currentResultInDetail.addresses.length; i++) {	
		var containmentId = relationshipsArray.containsPosition(currentResultInDetail.addresses[i].latLng);
		if(containmentId>=0) {
			relationshipsArray[containmentId].amount++;
			continue;
		}
		currentResultInDetail.addresses[i].amount = 1;
		relationshipsArray.push(currentResultInDetail.addresses[i]);
	}

	polylineArray = new Array();
	relationshipMarkers = new Array();
	relationshipBounds = new google.maps.LatLngBounds();
	for(var i=0; i<relationshipsArray.length; i++) {	
		// Self-reference
		if(distanceInMeter(
				currentResultInDetail.latLng.lat(), currentResultInDetail.latLng.lng(), 
				relationshipsArray[i].latLng.lat(), relationshipsArray[i].latLng.lng()) 
					< LOCATION_EQUALITY_EDGE){
			var resultDiv = $('<div class="resultDiv"></div>');
			resultDiv.css("margin","5px");
			resultDiv.css("text-align","left");
			resultDiv.css("cursor","pointer");
			resultDiv.html("Self-references: " + relationshipsArray[i].amount);

			// Add to relationships
			$("div.resultsDetail div.addresses").prepend("<hr />");
			$("div.resultsDetail div.addresses").prepend(resultDiv);
			
			
				
				// Show on Map 
				var marker = new google.maps.Marker({
				    position: relationshipsArray[i].latLng,
				    map: myMap,
				    title: "Relationship position"
				  });
				marker.setIcon(new google.maps.MarkerImage("img/AdvancedPaw.png"));
				relationshipMarkers.push(marker);
				
//				// Register listeners
//				resultDiv.hover(
//						function() {
//							//Hover
//							$(this).css('background', 'white');
//							//setInfoWindow("<b>"+relationshipsArray[$(this).attr("name")].city+"</b>", relationshipsArray[$(this).attr("name")].latLng);
//							marker.setAnimation(google.maps.Animation.BOUNCE);
//						},
//						function() {
//							//Hover Out
//							$(this).css('background', '');
//							//unsetInfoWindow();
//							marker.setAnimation(null);
//						}
//					);
				
				resultDiv.click(function() {
					myMap.panTo(currentResultInDetail.latLng);
					myMap.setZoom(MAX_ZOOM);
				});	
			
			continue;
		}
		
		// Constitute relationship divs
		var resultDiv = $('<div class="resultDiv"></div>');
		resultDiv.css("margin","5px");
		resultDiv.css("text-align","left");
		resultDiv.css("cursor","pointer");
		resultDiv.attr("name", i);
		var streetDiv = $('<div>');
		streetDiv.html(relationshipsArray[i].street+" "+relationshipsArray[i].houseNumber);
		streetDiv.css('white-space', 'nowrap');
		streetDiv.css('width', '100%');
		streetDiv.css('overflow', 'hidden');
		streetDiv.css('text-overflow', 'ellipsis');		
		streetDiv.appendTo(resultDiv);
		var cityDiv = $('<div>');
		cityDiv.html(relationshipsArray[i].zipCode + " " + relationshipsArray[i].city);
		cityDiv.appendTo(resultDiv);
		var distanceDiv = $('<div>');
		if(relationshipsArray[i].distanceInKM)
			distanceDiv.html('Distance: ' + parseFloat(relationshipsArray[i].distanceInKM).toFixed(3));
		distanceDiv.appendTo(resultDiv);
		var amountDiv = $('<div>');
		var amount = relationshipsArray[i].amount;
		amountDiv.html("Referenced " + (amount>1?(amount>2?amount + " times":"twice"):"once"));
		amountDiv.appendTo(resultDiv);

		// Add to relationships
		$("div.resultsDetail div.addresses").append(resultDiv);
		$("div.resultsDetail div.addresses").append("<hr />");
		
		// Show on Map 
		var marker = new google.maps.Marker({
		    position: relationshipsArray[i].latLng,
		    map: myMap,
		    title: "Relationship position"
		  });
		marker.setIcon(new google.maps.MarkerImage("img/AdvancedPaw2.png"));
		relationshipMarkers.push(marker);

		google.maps.event.addListener(relationshipMarkers[i], "click", function() {
			openPopupForMarker(this.getPosition());
		});
		
		// Draw relationship lines
		var polylineOptions = {
				map: myMap,
				path: [currentResultInDetail.latLng, relationshipsArray[i].latLng],
				strokeColor: "#0000ff",
				strokeWeight: relationshipsArray[i].amount
		};
		var polyline = new google.maps.Polyline(polylineOptions);
		polylineArray.push(polyline);

		// Extend bounds
		relationshipBounds.extend(relationshipsArray[i].latLng);
		
		// Register listeners
		resultDiv.hover(
				function() {
					//Hover
					$(this).css('background', 'white');
					//setInfoWindow("<b>"+relationshipsArray[$(this).attr("name")].city+"</b>", relationshipsArray[$(this).attr("name")].latLng);
					relationshipMarkers[$(this).attr("name")].setAnimation(google.maps.Animation.BOUNCE);
				},
				function() {
					//Hover Out
					$(this).css('background', '');
					//unsetInfoWindow();
					relationshipMarkers[$(this).attr("name")].setAnimation(null);
				}
			);
		
		resultDiv.click(function() {
			myMap.panTo(relationshipsArray[$(this).attr("name")].latLng);
			myMap.setZoom(MAX_ZOOM);
		});	
	}
	
	var marker = new google.maps.Marker({
	    position: currentResultInDetail.latLng,
	    map: myMap,
	    title: "Release position"
	  });
	marker.setIcon(new google.maps.MarkerImage("img/AdvancedPaw.png"));
	relationshipMarkers.push(marker);
	

	google.maps.event.addListener(marker, "click", function() {
		openPopupForMarker(this.getPosition());
	});
	
	// Extend bounds
	relationshipBounds.extend(currentResultInDetail.latLng);
	
	// Set bounds
	myMap.fitBounds(relationshipBounds);
	
	// max zoom: 13 (if only one point in bounds)
	//if(myMap.getZoom()>MAX_ZOOM) myMap.setZoom(MAX_ZOOM);

	// Affirm overview is gone
	currentViewIsOverview = false;
}

/*
 * VIEW SWITCHING
 */
function switchToOverview() {
	// Hide relationships (from detail view)
	hideRelationships();
	
	// Hide detail view, show overview
	$("a.resultDetail").css("visibility", "hidden");
	$("div.resultsDetail").css("display", "none");
	$("div.resultsOverview").css("display", "block");
	
	// Hide old markers
	relationshipsArray = null;
	currentResultInDetail = null;
	for(var i=0; i<relationshipMarkers.length; i++) {
		relationshipMarkers[i].setMap(null);
	}
	
	// Show new markers
	for(var i=0; i<myMarkers.length; i++) {
		myMarkers[i].setMap(myMap);
		
		// Clear listeners
		google.maps.event.clearInstanceListeners(myMarkers[i]);
		
		// Add listeners
		google.maps.event.addListener(myMarkers[i], "click", function() {
			openPopupForMarker(this.getPosition());
		});
		
		google.maps.event.addListener(myMarkers[i], "mouseover", function() {
			var counter = 0;
			for(var j=0; j<myMarkers.length; j++)
				if(distanceInMeter(this.getPosition().lat(), this.getPosition().lng(), resultsArray[j].latLng.lat(), resultsArray[j].latLng.lng()) < LOCATION_EQUALITY_EDGE) {
					counter++;
					}
			
			for(var j=0; j<myMarkers.length; j++)
				if(distanceInMeter(this.getPosition().lat(), this.getPosition().lng(), resultsArray[j].latLng.lat(), resultsArray[j].latLng.lng()) < LOCATION_EQUALITY_EDGE) {
					showRelationships(j, getColor(j, counter));}
					}
				
		);
		
		google.maps.event.addListener(myMarkers[i], "mouseout", function() {
			if(!allRelationshipsShown) hideRelationships();
		});
	}
	
	// Fit to bounsd
	myMap.fitBounds(markerBounds);
	//if(myMap.getZoom()>MAX_ZOOM) myMap.setZoom(MAX_ZOOM);
	
	// Affirm overview
	currentViewIsOverview = true;
}

/*
 * HELPER FUNCTION
 * If user window size changes
 */
function changeContentSize() {
	// Calculate appropriate height
	var height = $(document).height();
	var headerHeight = $("div.head").css("height");
	var resultHeight = parseInt(height) - parseInt(headerHeight);
	
	// Set height
	$("#results").css("height", resultHeight);
	$("#map").css("height", resultHeight);
	
	// Calculate appropriate width
	var width = $(document).width();
	var resultWidth = $("#results").css("width");
	var mapWidth = parseInt(width) - parseInt(resultWidth);
	
	// Set width
	$("#map").css("width", mapWidth);
}

/*
 * Called if the range slider is used
 */
function sliderChanged() {
	// Update span
	$("span.rangeSlider").html($("input.rangeSlider").attr("value") + " m");
	
	// Exception: slider is max
	if($("input.rangeSlider").attr("value") == $("input.rangeSlider").attr("max")) {
		$("span.rangeSlider").html("infinity");
	}
	
	// Draw
	drawCircle($("input.rangeSlider").attr("value"));
}

/*
 * HELPER FUNCTION
 * To get appropriate date representation
 */
function formatDate(ms) {
	// Construct date object
	var date = new Date();
	date.setTime(ms);
	
	// Exclude string representation
	// Eg. 30.06.2012
	var day = date.getDate();
	if(day<10) day = "0"+day;
	var month = date.getMonth()+1;
	if(month<10) month = "0"+month;
	var year =  date.getFullYear();
	return day + "." + month + "." + year;
}   

/*
 * Called if marker in overview is clicked
 */
function openPopupForMarker(position) {
	// Make list of articles written here
	// and list of all articles about this location
	// and list of near articles
	var counter = 0;
	var cityName = null;
	
	// clear
	$('#multiPowDiv div').html("");
	
	// List of articles released here
	counter = 0;
	for(var i=0; i<resultsArray.length; i++) {
		if(distanceInMeter(position.lat(), position.lng(), resultsArray[i].latLng.lat(), resultsArray[i].latLng.lng()) < LOCATION_EQUALITY_EDGE) {
			if(!cityName) cityName = resultsArray[i].releaseAddress_city;
			
			$('#multiPowDiv .1').append('<a href="#" onclick="javascript:switchToDetailsView('+i+');">' + resultsArray[i].title + "("+resultsArray[i].category+")</a><br />");
			counter++;
		}
	}
	// Print header
	if(counter==1) 
		$('#multiPowDiv .1').prepend("<h2>One result released at this location</h2>");
	else
		$('#multiPowDiv .1').prepend("<h2>"+counter+" results released at this location</h2>");
	// Print split
	$('#multiPowDiv .1').append("<hr />");
	
	// List of articles about this lication
	counter = 0;
	for(var i=0; i<resultsArray.length; i++) {
		for(var j=0; j<resultsArray[i].addresses.length; j++) {
			if(distanceInMeter(position.lat(), position.lng(), resultsArray[i].addresses[j].latLng.lat(), resultsArray[i].addresses[j].latLng.lng()) < LOCATION_EQUALITY_EDGE) {
				if(!cityName) cityName = resultsArray[i].addresses[j].city;
				
				// ignorre self-references
				if(distanceInMeter(resultsArray[i].latLng.lat(), resultsArray[i].latLng.lng(), resultsArray[i].addresses[j].latLng.lat(), resultsArray[i].addresses[j].latLng.lng()) < LOCATION_EQUALITY_EDGE) {
					continue;
				}
				
				// Add to list
				$('#multiPowDiv .2').append('<a href="#" onclick="javascript:switchToDetailsView('+i+');">' + resultsArray[i].title + "("+resultsArray[i].releaseAddress_city+", "+resultsArray[i].category+")</a><br />");
				counter++;
			}
		}
	}
	// Print header
	if(counter==1) 
		$('#multiPowDiv .2').prepend("<h2>This location is referenced only once</h2>");
	else
		$('#multiPowDiv .2').prepend("<h2>This location is referenced "+counter+" times</h2>");
	// Print split
	$('#multiPowDiv .2').append("<hr />");
	
	// Add header
	$('#multiPowDiv .0').html("<h1>Relationships (" + cityName + ")</h1>");
	
	// Add footer
	$('#multiPowDiv .4').html("<small>Note that two locations with distance smaller than " + LOCATION_EQUALITY_EDGE + "m are considered the same.</small>");
	
	// Open popup
	$('#callMultiPowDiv').nmCall();
}

/*
 * Shows the relationships to the document with the given id
 */
function showRelationships(id, color) {
	// For each relationship
	for(var i=0; i<resultsArray[id].addresses.length; i++) {	
		if(distanceInMeter(
				resultsArray[id].latLng.lat(), resultsArray[id].latLng.lng(), 
				resultsArray[id].addresses[i].latLng.lat(), resultsArray[id].addresses[i].latLng.lng()) 
					< LOCATION_EQUALITY_EDGE) 
			continue;
		
		var containmentId = relationshipMarkers.containsMarkerAt(resultsArray[id].addresses[i].latLng);
		if(containmentId>=0) {
			relationshipMarkers[containmentId].amount++;
			
			// Draw relationship lines
			var polylineOptions = {
					map: myMap,
					path: [resultsArray[id].latLng, resultsArray[id].addresses[i].latLng],
					strokeColor: color,
					strokeWeight: relationshipMarkers[containmentId].amount
			};
			var polyline = new google.maps.Polyline(polylineOptions);
			polylineArray.push(polyline);
		}
	
		
		// Show on Map 
		var marker = new google.maps.Marker({
		    position: resultsArray[id].addresses[i].latLng,
		    map: myMap
		  });
		marker.setIcon(new google.maps.MarkerImage("img/AdvancedPaw2.png"));
		marker.amount = 1;
		relationshipMarkers.push(marker);
		
		// Draw relationship lines
		var polylineOptions = {
				map: myMap,
				path: [resultsArray[id].latLng, resultsArray[id].addresses[i].latLng],
				strokeColor: color,
				strokeWeight: 1
		};
		var polyline = new google.maps.Polyline(polylineOptions);
		polylineArray.push(polyline);
	}
}

/*
 * Hides all relationships
 */
function hideRelationships() {
	// Hide lines
	for(var i=0; i<polylineArray.length; i++) {
		polylineArray[i].setMap(null);
	}
		
	// Hide markers
	for(var i=0; i<relationshipMarkers.length; i++) {
		relationshipMarkers[i].setMap(null);
	}

	// Clear
	relationshipsArray = new Array();
	relationshipMarkers = new Array();
	polylineArray = new Array();
}

/*
 * Returns a color, given two numbers id and number with
 * 0 <= id <= number
 */
function getColor(id, number) {
	/*
	 *  init
	 */
	var r=0, g=0, b=0;
	var max = 237,
		min = 50,
		offset = Math.abs(max-min);
	
	/*
	 * split color spectrum
	 */
	
	var partD = ((id/number)%1.0)*6;
	var part = parseInt(partD);
	var rest = partD%1.0;
	var delta = parseInt(rest*offset);
	
	/*
	 * calculate color
	 */
	switch(part) {
	case 0: 
		r=max;
		g=min+delta;
		b=min;
		break;
	case 1:  
		r=max-delta;
		g=max;
		b=min;
		break;
	case 2:  
		r=min;
		g=max;
		b=min+delta;
		break;
	case 3:  
		r=min;
		g=max-delta;
		b=max;
		break;
	case 4:  
		r=min+delta;
		g=min;
		b=max;
		break;
	case 5: 
	default:
		r=max;
		g=min;
		b=max-delta;
		break;
	}
	
	return "#"+decimalToHexString(r)+decimalToHexString(g)+decimalToHexString(b);
}

/*
 * Returns a hex-string, given a number 0 <= number < 256
 */
function decimalToHexString(number) {
    if (number < 0) {
        number = 0xFFFFFFFF + number + 1;
    }

    return number.toString(16).toUpperCase();
}

/*
 * Sort by Date
 */
function sortByDate(asc) {
	if(asc) {
		resultsArray.sort(DateSortFunctionAsc);
	} else {
		resultsArray.sort(DateSortFunctionDesc);
	}
	
	function DateSortFunctionAsc(a,b) {
		return a.releaseDate - b.releaseDate;
	}	
	function DateSortFunctionDesc(a,b) {
		return b.releaseDate - a.releaseDate;
	}
}

/*
 * Sort by TextRelevance
 */
function sortById(asc) {
	if(asc) {
		resultsArray.sort(DateSortFunctionAsc);
	} else {
		resultsArray.sort(DateSortFunctionDesc);
	}
	
	function DateSortFunctionAsc(a,b) {
		return a.id - b.id;
	}	
	function DateSortFunctionDesc(a,b) {
		return b.id - a.id;
	}
}

/*
 * Sort by TextRelevance
 */
function sortByDistance(asc) {
	if(asc) {
		resultsArray.sort(DateSortFunctionAsc);
	} else {
		resultsArray.sort(DateSortFunctionDesc);
	}
	
	function DateSortFunctionAsc(a,b) {
		return a.releaseAddress_distanceInKM - b.releaseAddress_distanceInKM;
	}	
	function DateSortFunctionDesc(a,b) {
		return b.releaseAddress_distanceInKM - a.releaseAddress_distanceInKM;
	}
}



/*
 * Returns the index of the existence of the same position or -1
 */
Array.prototype.containsPosition = function(position) {
	for(var i=0; i<this.length; i++) {
		if(distanceInMeter(
				this[i].latLng.lat(), this[i].latLng.lng(), 
				position.lat(), position.lng()) 
					< LOCATION_EQUALITY_EDGE){
			return i;}
	}
	return -1;
};

Array.prototype.containsMarkerAt = function(position) {
	for(var i=0; i<this.length; i++) {
		if(distanceInMeter(
				this[i].getPosition().lat(), this[i].getPosition().lng(), 
				position.lat(), position.lng()) 
					< LOCATION_EQUALITY_EDGE) 
			return i;
	}
	return -1;
};

function setLoadingStarted() {
	$("#moreResults").css("color", "red");
	$("#results h1").css("color", "red");
	$("#results small").css("visibility", "visible");
}

function setLoadingEnded() {
	$("#moreResults").css("color", "");
	$("#results h1").css("color", "");
	$("#results small").css("visibility", "hidden");
}
