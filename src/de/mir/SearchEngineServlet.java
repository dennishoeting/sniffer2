package de.mir;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import de.mir.model.Address;
import de.mir.model.SearchResult;
import de.mir.searcher.Searcher;

/**
 * Search Engine Servlet for practical project in MIR.
 * @author tlottmann
 */
public class SearchEngineServlet extends HttpServlet {
	private static final long serialVersionUID = 5529142640904041032L;
	private static final double KM_IN_MILES = 0.621371192;
	
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		this.processRequest(req, resp);
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		this.processRequest(req, resp);
	}
	
	/**
	 * Processes the requests.
	 * @param request
	 * @param response
	 * @throws ServletException
	 * @throws IOException
	 */
	private void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
		List<SearchResult> resultList = null;
        response.setContentType("text/xml;charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<?xml version='1.0' encoding='UTF-8'?>");
        out.println("<results>");
        
        try {
        	/* Try to get parameters: */
            String queryString = null;
            Double lat = null;
            Double lng = null;
            Double distanceInKM = null;
            Date timeFrom = null;
            Date timeTo = null;
            Integer limit = null;
            Integer offset = null;
            String categories = null;
            
            queryString = request.getParameter("query");
            categories = request.getParameter("categories");
            
            /* Location stuff: */
            try {
            	lat = Double.valueOf(request.getParameter("lat"));
            	lng = Double.valueOf(request.getParameter("lng"));
            	distanceInKM = Double.valueOf(request.getParameter("distance"));
            } catch(Exception e) {}
            
            /* Time stuff: */
            try {
            	timeFrom = new Date(Long.valueOf(request.getParameter("timeFrom")));
            	timeTo = new Date(Long.valueOf(request.getParameter("timeTo")));
            } catch(Exception e) {}
            
            /* offset */
            try {
            	offset = Integer.valueOf(request.getParameter("offset"));
            } catch(Exception e) {}
            
            /* limit */
            try {
            	limit = Integer.valueOf(request.getParameter("limit"));
            } catch(Exception e) {}
            
            /* Search without query */
            if(queryString == null || queryString.trim().length() == 0) {
            	
            	/* Distance search */
            	if(lat != null && lng != null && distanceInKM != null) {
            		
            		if(timeFrom == null && timeTo == null) {
            			resultList = Searcher.getInstance().searchWithoutTerms(lat, lng, this.kmToMiles(distanceInKM));
            		} else {
                		resultList = Searcher.getInstance().searchWithoutTerms(timeFrom, timeTo);
            		}
            	
            	/* Only time search */
            	} else if(timeFrom != null && timeTo != null){
            		resultList = Searcher.getInstance().searchWithoutTerms(timeFrom, timeTo);
            	
            	/* Without everything */
            	} else {
            		resultList = Searcher.getInstance().searchWithoutTerms();
            	}
            	
            /*
             * Distance search:
             */	
            } else if(lat != null && lng != null && distanceInKM != null) {
            	
            	/* Distance and time search */
            	if(timeFrom != null && timeTo != null) {
            		
            		resultList = Searcher.getInstance().search(queryString, lat, 
            				lng, this.kmToMiles(distanceInKM), timeFrom, timeTo);
            		
            	/* Only distance */	
            	} else {
            		resultList = Searcher.getInstance().search(queryString, lat, 
            				lng, this.kmToMiles(distanceInKM));
            	}
            	
            	
            } else if(timeFrom != null && timeTo != null) {
            	
            	resultList = Searcher.getInstance().search(queryString, timeFrom, timeTo);
            	
            /* Only query */	
            } else {
            	resultList = Searcher.getInstance().search(queryString);
            }
            
            /* Consider offset and limit */
            int i = offset != null ? offset : 0;
            int maxLoops = limit != null ? (limit + i) : resultList.size();
            if(maxLoops > resultList.size()) {
            	maxLoops = resultList.size();
            }
            
            /* Consider category */
            if(categories != null && categories.trim().length() > 0) {
            	List<SearchResult> tmpSearchResultList = new ArrayList<SearchResult>();
            	
            	String[] categoriesArray = categories.split(",");
            	
            	for(SearchResult result : resultList) {
            		for(int j = 0; j < categoriesArray.length; j++) {
                		if(result.getCategory().equalsIgnoreCase(categoriesArray[j].trim())) {
                			tmpSearchResultList.add(result);
                		}
            		}
            	}
            	
            	resultList = tmpSearchResultList;
            }
            
            for(; i < maxLoops; i++) {
            	
            	SearchResult result = resultList.get(i);
            	
            	boolean distanceInScope = distanceInKM != null ? false : true;
            	
            	StringBuilder stringBuilder = new StringBuilder();
            	
            	stringBuilder.append("\t<result>\n");
            	
            	stringBuilder.append("\t\t<title>" +result.getTitle().replaceAll("&", "&amp;") +"</title>\n");
            	stringBuilder.append("\t\t<url>" +result.getUrl().replaceAll("&", "&amp;") +"</url>\n");
            	stringBuilder.append("\t\t<releaseDate>" +result.getReleaseDate().getTime() +"</releaseDate>\n");
            	stringBuilder.append("\t\t<category>" +result.getCategory() +"</category>");
            	stringBuilder.append("\t\t<releaseAddress>\n");
            	stringBuilder.append("\t\t\t<city>" +(result.getReleaseAddress().getCity().length() > 1 ? 
            									("" +result.getReleaseAddress().getCity().charAt(0)).toUpperCase() 
            									+result.getReleaseAddress().getCity().substring(1) 
            									: result.getReleaseAddress().getCity())
            									+"</city>\n");
            	stringBuilder.append("\t\t\t<lat>" +result.getReleaseAddress().getLat() +"</lat>\n");
            	stringBuilder.append("\t\t\t<lng>" +result.getReleaseAddress().getLng() +"</lng>\n");
            	stringBuilder.append("\t\t\t<distanceInKM>");
            	if(lat != null && lng != null) {
            		double distance = this.getDistanceInKM(lat, lng, Double.valueOf(result.getReleaseAddress().getLat()), 
            				Double.valueOf(result.getReleaseAddress().getLng()));
            		
            		if(distanceInKM != null && distance <= distanceInKM) {
            			distanceInScope = true;
            		}
            		stringBuilder.append(distance);
            	}
            	stringBuilder.append("</distanceInKM>\n");
            	stringBuilder.append("\t\t</releaseAddress>\n");
            	
            	stringBuilder.append("\t\t<content>\n");
            	
            	stringBuilder.append("\t\t\t<addresses>\n");
            	for(Address address : result.getAddressList()) {
            		stringBuilder.append("\t\t\t\t<address>\n");
            		stringBuilder.append("\t\t\t\t\t<street>" +
                	(address.getStreetname().length() > 1 ? 
                				("" +address.getStreetname().charAt(0)).toUpperCase() 
                				+address.getStreetname().substring(1) : "")  +"</street>\n");
            		stringBuilder.append("\t\t\t\t\t<houseNumber>" +address.getHousenumber() +"</houseNumber>\n");
            		stringBuilder.append("\t\t\t\t\t<zipCode>" +address.getZipcode() +"</zipCode>\n");
            		stringBuilder.append("\t\t\t\t\t<city>" +(address.getCity().length() > 1 ?
                									("" +address.getCity().charAt(0)).toUpperCase() 
                									+address.getCity().substring(1) : address.getCity()) 
                									+"</city>\n");
                	stringBuilder.append("\t\t\t\t\t<lat>" +address.getLat() +"</lat>\n");
                	stringBuilder.append("\t\t\t\t\t<lng>" +address.getLng() +"</lng>\n");
                	
                	stringBuilder.append("\t\t\t\t\t<distanceInKM>");
                	if(lat != null && lng != null) {
                		double distance = this.getDistanceInKM(lat, lng, Double.valueOf(address.getLat()), 
                				Double.valueOf(address.getLng()));
                		
                		if(distanceInKM != null && distance <= distanceInKM) {
                			distanceInScope = true;
                		}
                		stringBuilder.append(distance);
                		
                	}
                	stringBuilder.append("</distanceInKM>\n");
                	
                	stringBuilder.append("\t\t\t\t</address>\n");
            	}
            	stringBuilder.append("\t\t\t</addresses>\n");
            	
            	stringBuilder.append("\t\t\t<dates>\n");
            	for(Date date : result.getDateList()) {
            		stringBuilder.append("\t\t\t\t<date>" +date.getTime() +"</date>\n");
            	}
            	stringBuilder.append("\t\t\t</dates>\n");
            	
            	stringBuilder.append("\t\t</content>\n");
            	
            	stringBuilder.append("\t\t<summary>" 
            			+result.getSummary().replaceAll("&", "&amp;").replaceAll("\"", "").replaceAll("\\?", "").replaceAll("\"", "")
            				.replaceAll("<B>", "[b]").replaceAll("</B>", "[/b]").replaceAll("<", "").replaceAll(">", "")
            			+"</summary>");
            	
            	stringBuilder.append("\t</result>\n");
            	
            	if(distanceInScope) {
            		out.println(stringBuilder.toString());
            	}
            }
        } catch(Exception e) {
        	e.printStackTrace();
        } finally {
            out.println("</results>");
        }
	}
	
	/**
	 * Computes KM to miles.
	 * @param km
	 * @return
	 */
	private Double kmToMiles(double km) {
		return km * KM_IN_MILES;
	}
	
	/**
	 * Computes the distance between the two points in km.
	 */
	private double getDistanceInKM(double myLat, double myLng, double hisLat, double hisLng) {
		
		if((myLat == hisLat) && (myLng == hisLng)) {
			return 0.0;
		}
		
		double f = 1 / 298.257223563;
		double a = 6378.137;
		double F = ((myLat + hisLat)/2)*(Math.PI/180);
		double G = ((myLat - hisLat)/2)*(Math.PI/180);
		double l = ((myLng - hisLng)/2)*(Math.PI/180);
		double S = Math.pow(Math.sin(G), 2) * Math.pow(Math.cos(l), 2) + Math.pow(Math.cos(F), 2) * Math.pow(Math.sin(l), 2);
		double C = Math.pow(Math.cos(G), 2) * Math.pow(Math.cos(l), 2) + Math.pow(Math.sin(F), 2) * Math.pow(Math.sin(l), 2);
		double w = Math.atan(Math.sqrt(S/C));
		double D = 2 * w * a;
		double R = Math.sqrt(S*C)/w;
		double H1 = (3*R-1)/(2*C);
		double H2 = (3*R+1)/(2*S);
		
		double distance = D * (1 + f*H1*Math.pow(Math.sin(F), 2) * Math.pow(Math.cos(G), 2) - f*H2*Math.pow(Math.cos(F), 2)*Math.pow(Math.sin(G), 2)); 
		
		return distance;
	}
}