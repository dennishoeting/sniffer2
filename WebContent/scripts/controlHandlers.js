$("div.searchInput *[name=submit]").click(function(e) {
	e.preventDefault();
	search();
});


$("#locRange").change(function() {
	if(!$("#locRange").prop("disabled")) drawCircle(calcCircleRadius());
});

$("a.resultOverview").click(function(e) {
	e.preventDefault();
	switchToOverview();
});

$("a.resultDetail").click(function(e) {
	e.preventDefault();
	switchToDetailsView(currentResultInDetail.id);
});

$('div.searchInput *[name=query]').keyup(function(e) {
    if(e.keyCode==13){
    	search();
    }
});

$("#enableLocCheckbox").bind('change', function(e) {
	e.preventDefault();
	$("#locRange").prop("disabled", !$(this).attr("checked"));
	$("#locInput").prop("disabled", !$(this).attr("checked"));	
	if($(this).attr("checked")) {
		if(!initialized) 
			initGeoLocation();
		if(userPositionMarker) 
			userPositionMarker.setMap(myMap);
		if(rangeSliderDiv)
			myMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(rangeSliderDiv);
		drawCircle(currentRange);
		$("span.sortByDistanceLink").css("display", "inline");
	} else if(userPositionMarker) {
		userPositionMarker.setMap(null);
		myMap.controls[google.maps.ControlPosition.TOP_RIGHT].pop(rangeSliderDiv);
		hideCircle();
		$("span.sortByDistanceLink").css("display", "none");
	}
});

$("#enableTimeCheckbox").bind('change', function(e) {
	$("#datepickerFrom").prop("disabled", !$(this).attr("checked"));
	$("#datepickerTo").prop("disabled", !$(this).attr("checked"));
});

$("#enableCategoryCheckbox").bind('change', function(e) {
	$("#categorySelector").multiselect($(this).attr("checked") ? "enable" : "disable");
});

$(".sortByDate").click(function(e) {
	e.preventDefault();
	
	sortByDate(dateSortDirectionAsc);
	dateSortDirectionAsc = !dateSortDirectionAsc;

	$("#resultsContent").html("");
	printCurrentResults(lastQuery);
});

$(".sortById").click(function(e) {
	e.preventDefault();
	
	sortById(idSortDirectionAsc);
	idSortDirectionAsc = !idSortDirectionAsc;

	$("#resultsContent").html("");
	printCurrentResults(lastQuery);
});

$(".sortByDisance").click(function(e) {
	e.preventDefault();
	
	sortByDistance(distanceSortDirectionAsc);
	distanceSortDirectionAsc = !distanceSortDirectionAsc;

	$("#resultsContent").html("");
	printCurrentResults(lastQuery);
});



