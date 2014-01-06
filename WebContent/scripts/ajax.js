function requestDataViaAjax(data, limit) {
	var request = new XMLHttpRequest();
	request.open(
			'POST', 
			'/MIRSearchEngine/SearchEngine' 
				+ data 
				+ (data=="?"?"":"&") +"offset=" + visibleResults 
				+ "&limit=" + limit,
			true);
	
	request.onreadystatechange = function() {
		if (request.readyState == 4 && request.status == 200) {
			parseXMLResponse(request.responseXML);
			printCurrentResults(data);
		} else if(request.readyState == 4) {
			alert("state:" + request.readyState + " , status:" + request.status + "\nFetching data from hard disk....");
			//TEMP: req. data via file
			$.ajax({
		    type: "GET",
			url: "test.xml",
			dataType: "xml",
			success: 
				function(xml) {
					parseXMLResponse(xml);
					printCurrentResults(data);
				}
			});
		}
	};
	request.send(null);
}