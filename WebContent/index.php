<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<title>Sniffer GeoNews</title>
		<meta name="description" content="Sniffer GeoNews">
		<meta name="keywords" content="Sniffer">
		<meta name="author" content="Dennis Hoeting">
		<meta name="editor" content="Notepad++">
		<link rel="stylesheet"href="style/styles.css" />
		<!-- plugins -->
		<script type="text/javascript" src="scripts/jquery-1.7.2.js"></script>
		<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?sensor=false"></script>
		<!--<script type='text/javascript' src='http://code.google.com/apis/gears/gears_init.js'></script>-->
		<link rel="stylesheet" href="scripts/jquery.nyroModal/styles/nyroModal.css" type="text/css" media="screen" />
		<script type="text/javascript" src="scripts/jquery.nyroModal/js/jquery.nyroModal.custom.js"></script>
		<link rel="stylesheet" href="http://code.jquery.com/ui/1.8.21/themes/base/jquery-ui.css" type="text/css" media="all" />
		<link rel="stylesheet" href="http://static.jquery.com/ui/css/demo-docs-theme/ui.theme.css" type="text/css" media="all" />
		<script src="scripts/jquery-ui.js" type="text/javascript"></script>
		<script src="scripts/jquery.multiselect.js" type="text/javascript"></script>
		<link rel="stylesheet" href="scripts/jquery.multiselect.css" type="text/css" media="all" />
		<!--[if IE 6]>
			<script type="text/javascript" src="scripts/jquery.nyroModal/js/jquery.nyroModal-ie6.min.js"></script>
		<![endif]-->
	</head>
	<body onload="initialize();" onresize="changeContentSize();">
		<a id="callMultiPowDiv" class="nyroModal" href="#multiPowDiv"></a>
		<div id="multiPowDiv">
			<div class="0"></div>
			<div class="1"></div>
			<div class="2"></div>
			<div class="3"></div>
			<div class="4"></div>
		</div>
			<div class="head">
				<div class="headline">Sniffer GeoNews</div>
				<div class="search">
					<div class="searchInput">
						<input name="query" type="text" />
						<button name="submit" id="sniffItButton"><img src="img\paw.png" alt="" />&nbsp;Sniff it!</button><br />
						<label name="locLabel">Location:</label>
						<input id="enableLocCheckbox" type="checkbox" />&nbsp;
						<input id="locInput" type="text" disabled="disabled" /><br />
						<input id="enableTimeCheckbox"  type="checkbox" />&nbsp;
						<label><b>Time:</b></label>
						<label>From</label>
						<input type="text" id="datepickerFrom" size="8" disabled="disabled" /> 
						<label>to</label>
						<input type="text" id="datepickerTo" size="8" disabled="disabled" /><br />
						<input id="enableCategoryCheckbox" type="checkbox" />&nbsp;
						<label>Category:</label>&nbsp;
						<select id="categorySelector" title="Basic example" multiple="multiple" name="category" size="5" disabled="disabled">
							<option value="Auto">Auto</option>
							<option value="Bildung%20und%20Beruf">Bildung und Beruf</option>
							<option value="Computer">Computer</option>
							<option value="Haus%20und%20Garten">Haus und Garten</option>
							<option value="Kultur">Kultur</option>
							<option value="Panorama">Panorama</option>
							<option value="Politik">Politik</option>
							<option value="Reise">Reise</option>
							<option value="Sport">Sport</option>
							<option value="Wirtschaft">Wirtschaft</option>
						</select>
					</div>
				</div>
			</div>
			<div class="content">
				<div id="map"></div>
				<div id="results">
					<h1>Results</h1>
					<small>awaiting results ...<br /></small>
					Sort by <a href="#" class="sortById">textRelevance</a> | <a href="#" class="sortByDate">date</a><span class="sortByDistanceLink"> | <a href="#" class="sortByDisance">distance</span><br />
					<a href="#" class="resultOverview">Overview</a>&nbsp;|&nbsp;<a href="#" class="resultDetail">Detail View</a>
					<hr />
					<div class="resultsOverview">
						<div id="resultsContent">
							<!-- Results -->
						</div>
						<div id="moreResults"></div>
					</div>
					<div class="resultsDetail">
						<div class="title"><b><span></span></b></div>
						<div class="date">Date:<span></span></div>
						<div class="location">Location: <span></span></div>
						<div class="category">Category: <span></span></div>
						<div class="summary"><span></span></div>
						<div class="link"><span></span></div>
						<hr />
						<h3>Relationships</h3>
						<div class="addresses"></div>
						<div class="dates"></div>
					</div>
				</div>
			</div>
	</body>
	<!-- own stuff -->
	<script type="text/javascript" src="scripts/functions.js"></script>
	<script type="text/javascript" src="scripts/variables.js"></script>
	<script type="text/javascript" src="scripts/controlHandlers.js"></script>
	<script type="text/javascript" src="scripts/ajax.js"></script>
	<script type="text/javascript" src="scripts/googleMapsScripts.js"></script>
</html>