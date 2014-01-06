package de.mir.searcher;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.de.GermanAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.queryParser.MultiFieldQueryParser;
import org.apache.lucene.search.ChainedFilter;
import org.apache.lucene.search.Filter;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.MatchAllDocsQuery;
import org.apache.lucene.search.NumericRangeFilter;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.QueryWrapperFilter;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.highlight.Highlighter;
import org.apache.lucene.search.highlight.QueryScorer;
import org.apache.lucene.search.highlight.SimpleHTMLFormatter;
import org.apache.lucene.search.highlight.TokenSources;
import org.apache.lucene.spatial.geohash.GeoHashDistanceFilter;
import org.apache.lucene.spatial.geohash.GeoHashUtils;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;

import de.mir.model.Address;
import de.mir.model.SearchResult;

/**
 * Searcher with different search functions.
 * @author tlottmann
 */
public class Searcher {
	private static final String INDEX_PATH = "index";
	private static final Version VERSION = Version.LUCENE_36;
	private static final Analyzer ANALYZER = new GermanAnalyzer(VERSION);
	/** Number of fragments for the dynamic result summary */
	private static final int MAX_SUMMARY_FRAGMENTS = 3;
	/** Separator for the dynamic summary fragments */
	private static final String SUMMARY_SEPATATOR = "...";
	/** If we have no match in the content, we will use a static summary */
	private static final int STATIC_SUMMARY_MAX_CHARS = 150;
	
	private static Searcher instance;
	
	/** Separator for fields with more items, e.g. all_dates */
	private static final String SEPARATOR_MULTI_FIELDS = "\\|";
	private static final Pattern SEPARATOR_MULTI_FIELD_PATTERN = 
			Pattern.compile("[\\w\\.\\-\\s]*" +SEPARATOR_MULTI_FIELDS);
	
	/* Apache Lucene field names */
	private static final String FIELD_ID = "id";
	private static final String FIELD_TITLE = "title";
	private static final String FIELD_CONTENT = "content";
	private static final String FIELD_HEADLINES = "headlines";
	private static final String FIELD_META_DATA = "metadata";
	private static final String FIELD_RELEASE_DATE = "releasedate";
	private static final String FIELD_RELEASE_CITY = "releasecity";
	private static final String FIELD_RELEASE_LAT_LNG = "release_lat_lng";
	private static final String FIELD_CATEGORY = "category";
	private static final String FIELD_ALL_CITY_NAMES = "all_content_citynames";
	private static final String FIELD_ALL_LAT = "all_content_lat_as_string";
	private static final String FIELD_ALL_LNG = "all_content_lng_as_string";
	private static final String FIELD_ALL_STREETNAMES = "all_content_streetnames";
	private static final String FIELD_ALL_HOUSENUMBERS = "all_content_housenumbers";
	private static final String FIELD_ALL_ZIPCODES = "all_content_zipcodes";
	private static final String FIELD_ALL_DATES = "all_content_dates_as_string";
	private static final String FIELD_LAT_LNG = "lat_lng";
	private static final String FIELD_DATES = "dates";
	/** Set search fields and boosts here: */
	private static final String[][] MULTI_QUERY_FIELDS_WITH_BOOSTS = {{FIELD_TITLE, "1.0"}, {FIELD_META_DATA, "1.0"}, {FIELD_CONTENT, "1.0"}, {FIELD_HEADLINES, "1.0"}};
	private static final String[] MULTI_QUERY_FIELDS = new String[MULTI_QUERY_FIELDS_WITH_BOOSTS.length];
	private static final Map<String, Float> MULTI_QUERY_FIELD_BOOSTS;
	
	static {
		MULTI_QUERY_FIELD_BOOSTS = new HashMap<String, Float>();
		for(int i = 0; i < MULTI_QUERY_FIELDS_WITH_BOOSTS.length; i++) {
			MULTI_QUERY_FIELD_BOOSTS.put(MULTI_QUERY_FIELDS_WITH_BOOSTS[i][0], 
					Float.valueOf(MULTI_QUERY_FIELDS_WITH_BOOSTS[i][1]));
			MULTI_QUERY_FIELDS[i] = MULTI_QUERY_FIELDS_WITH_BOOSTS[i][0];
		}
	}
	
	private Searcher() {}

	public static Searcher getInstance() {
		if(instance == null) {
			instance = new Searcher();
		}
		
		return instance;
	}
	
	/**
	 * Search without terms.
	 * @return
	 */
	public List<SearchResult> searchWithoutTerms() {
		return this.searchWithoutTerms(null);
	}
	
	/**
	 * Search without terms.
	 * @param filter, null if not needed.
	 * @return
	 */
	public List<SearchResult> searchWithoutTerms(Filter filter) {
		
		List<SearchResult> searchResultList = new ArrayList<SearchResult>();
		IndexSearcher searcher = null;
		Directory index = null;
		IndexReader indexReader = null;
		Query query = null;
		try {
			index = FSDirectory.open(new File(INDEX_PATH));
			indexReader = IndexReader.open(index);
			searcher = new IndexSearcher(indexReader);

            query = new MatchAllDocsQuery();
            TopDocs rs = null;
            if(filter != null) {
    			rs = searcher.search(query, filter, searcher.maxDoc());
            } else {
    			rs = searcher.search(query, searcher.maxDoc());
            }
			
            /* Build the resultset */
            for(int i = 0; i < rs.scoreDocs.length; i++) {
				Document documentLucene = searcher.doc(rs.scoreDocs[i].doc);

				Date releaseDate = new Date(Long.valueOf(documentLucene.getFieldable(FIELD_RELEASE_DATE).stringValue()));
				
				double[] latLngArray = GeoHashUtils.decode(documentLucene.getFieldable(FIELD_RELEASE_LAT_LNG).stringValue());
				Address releaseAddress = new Address("", "", "", documentLucene.getFieldable(FIELD_RELEASE_CITY).stringValue(),
						"" +latLngArray[0], "" +latLngArray[1]);
				
				
				List<Date> dateList = new ArrayList<Date>();
				for(String date : this.separateText(documentLucene.getFieldable(FIELD_ALL_DATES).stringValue())) {
					dateList.add(new Date(Long.valueOf(date.trim())));
				}
				
				List<Address> addressList = new ArrayList<Address>();
				
				List<String> allLatList = this.separateText(documentLucene.getFieldable(FIELD_ALL_LAT).stringValue());
				List<String> allLngList = this.separateText(documentLucene.getFieldable(FIELD_ALL_LNG).stringValue());
				List<String> allHousenumbersList = this.separateText(documentLucene.getFieldable(FIELD_ALL_HOUSENUMBERS).stringValue());
				List<String> allStreetnamesList = this.separateText(documentLucene.getFieldable(FIELD_ALL_STREETNAMES).stringValue());
				List<String> allCitynamesList = this.separateText(documentLucene.getFieldable(FIELD_ALL_CITY_NAMES).stringValue());
				List<String> allZipcodesList = this.separateText(documentLucene.getFieldable(FIELD_ALL_ZIPCODES).stringValue());
				
				/* All lists have the same size */
				for(int j = 0; j < allLatList.size(); j++) {
					addressList.add(new Address(allHousenumbersList.get(j), allStreetnamesList.get(j), allZipcodesList.get(j),
							allCitynamesList.get(j), allLatList.get(j), allLngList.get(j)));
				}
				
				/* Result summary */
			    String text = documentLucene.get(FIELD_CONTENT);
			    String summary = text.substring(0, STATIC_SUMMARY_MAX_CHARS >= text.length() ? text.length() : STATIC_SUMMARY_MAX_CHARS);
			    
			    if(!summary.endsWith(SUMMARY_SEPATATOR)) {
			    	summary += (SUMMARY_SEPATATOR);
			    }
			    
			    SearchResult searchResult = new SearchResult(documentLucene.getFieldable(FIELD_ID).stringValue(), 
						documentLucene.getFieldable(FIELD_TITLE).stringValue(), releaseAddress, releaseDate, addressList, dateList, summary.trim(), documentLucene.getFieldable(FIELD_CATEGORY).stringValue());
			    
			    if(!searchResultList.contains(searchResult)) {
					searchResultList.add(searchResult);
			    }
			}
			
		} catch(Exception e) {
			e.printStackTrace();
		} finally {
			try {
				searcher.close();
			} catch(Exception e) {}
			try {
				indexReader.close();
			} catch(Exception e) {}
			try {
				index.close();
			} catch(Exception e) {}
		}
		
		Collections.sort(searchResultList, new Comparator<SearchResult>() {
			@Override
			public int compare(SearchResult o1, SearchResult o2) {
				if(o1.getReleaseDate().after(o2.getReleaseDate())) {
					return -1;
				} else if(o1.getReleaseDate().equals(o2.getReleaseDate())) {
					return 0;
				} else {
					return 1;
				}
			}
		});
		
		return searchResultList;
	}
	
	/**
	 * Search only with date.
	 * @param dateFrom
	 * @param dateTo
	 * @return
	 */
	public List<SearchResult> searchWithoutTerms(Date dateFrom, Date dateTo) {
		Filter[] chain = {this.getNewDateRangeFilter(FIELD_DATES, dateFrom, dateTo), 
				this.getNewDateRangeFilter(FIELD_RELEASE_DATE, dateFrom, dateTo)};

		return this.searchWithoutTerms(new ChainedFilter(chain, ChainedFilter.OR));
	}
	
	/**
	 * Search only with distance.
	 * @param timeFrom
	 * @param timeTo
	 * @param lat
	 * @param lng
	 * @param distanceInMiles
	 * @return
	 */
	public List<SearchResult> searchWithoutTerms(double lat, double lng, double distanceInMiles) {
			Filter[] chain = {this.getNewGeoHashDistanceFilter(FIELD_LAT_LNG, lat, lng, distanceInMiles),
					this.getNewGeoHashDistanceFilter(FIELD_RELEASE_LAT_LNG, lat, lng, distanceInMiles)};
			
			return this.searchWithoutTerms(new ChainedFilter(chain, ChainedFilter.OR));
	}
	
	/**
	 * Search only with date and distance.
	 * @param timeFrom
	 * @param timeTo
	 * @param lat
	 * @param lng
	 * @param distanceInMiles
	 * @return
	 */
	public List<SearchResult> searchWithoutTerms(Date dateFrom, Date dateTo, double lat, double lng, double distanceInMiles) {
			Filter[] chain = {this.getNewDateRangeFilter(FIELD_DATES, dateFrom, dateTo), 
					this.getNewDateRangeFilter(FIELD_RELEASE_DATE, dateFrom, dateTo), 
					this.getNewGeoHashDistanceFilter(FIELD_LAT_LNG, lat, lng, distanceInMiles),
					this.getNewGeoHashDistanceFilter(FIELD_RELEASE_LAT_LNG, lat, lng, distanceInMiles)};
			
			return this.searchWithoutTerms(new ChainedFilter(chain, ChainedFilter.OR));
	}
	
	/**
	 * Search only with query.
	 * @param query
	 * @return
	 */
	public List<SearchResult> search(String query) {
		return this.search(query, null);
	}
	
	/**
	 * Distance search.
	 * @param query
	 * @param lat
	 * @param lng
	 * @param distanceInMiles
	 * @return
	 */
	public List<SearchResult> search(String query, double lat, double lng, double distanceInMiles) {
		Filter[] chain = {this.getNewGeoHashDistanceFilter(FIELD_LAT_LNG, lat, lng, distanceInMiles),
				this.getNewGeoHashDistanceFilter(FIELD_RELEASE_LAT_LNG, lat, lng, distanceInMiles)};
		
		return this.search(query, new ChainedFilter(chain, ChainedFilter.OR));
	}
	
	/**
	 * Search with date limitation.
	 * @param query
	 * @param dateFrom
	 * @param dateTo
	 * @return
	 */
	public List<SearchResult> search(String query, Date dateFrom, Date dateTo) {
		Filter[] chain = {this.getNewDateRangeFilter(FIELD_DATES, dateFrom, dateTo), 
				this.getNewDateRangeFilter(FIELD_RELEASE_DATE, dateFrom, dateTo)};
		
		return this.search(query, new ChainedFilter(chain, ChainedFilter.OR));
	}
	
	/**
	 * Search with distance and date limitation.
	 * @param query
	 * @param lat
	 * @param lng
	 * @param distance
	 * @param startTime
	 * @param endTime
	 * @return
	 */
	public List<SearchResult> search(String query, double lat, double lng, double distanceInMiles, Date dateFrom, Date dateTo) {

		Filter[] datesChain = {this.getNewDateRangeFilter(FIELD_DATES, dateFrom, dateTo),
				this.getNewDateRangeFilter(FIELD_RELEASE_DATE, dateFrom, dateTo)};
		Filter datesFilter = new ChainedFilter(datesChain, ChainedFilter.OR);

		Filter[] geoChain = {this.getNewGeoHashDistanceFilter(FIELD_LAT_LNG, lat, lng, distanceInMiles),
				this.getNewGeoHashDistanceFilter(FIELD_RELEASE_LAT_LNG, lat, lng, distanceInMiles)};
		Filter geoFilter = new ChainedFilter(geoChain, ChainedFilter.OR);
		
		Filter[] chain = {datesFilter, geoFilter};
		
		return this.search(query, new ChainedFilter(chain, ChainedFilter.AND));
	}
	
	/**
	 * Returns a new numeric range filter for date values.
	 * @param field
	 * @param dateFrom
	 * @param dateTo
	 * @return
	 */
	private Filter getNewDateRangeFilter(String field, Date dateFrom, Date dateTo) {
		return NumericRangeFilter.newLongRange(field, dateFrom.getTime(), dateTo.getTime(), true, true);
	}
	
	/**
	 * Returns a new geo hash distance filter.
	 * @param field
	 * @param lat
	 * @param lng
	 * @param distanceInMiles
	 * @return
	 */
	private Filter getNewGeoHashDistanceFilter(String field, double lat, double lng, double distanceInMiles) {
		return new GeoHashDistanceFilter(new QueryWrapperFilter(new MatchAllDocsQuery()), 
				lat, lng, distanceInMiles, field);
	}
	
	/**
	 * Search with filterlist.
	 * @param queryString
	 * @param filter, null if not requiered
	 * @return
	 */
	private List<SearchResult> search(String queryString, Filter filter) {
		List<SearchResult> searchResultList = new ArrayList<SearchResult>();
		IndexSearcher searcher = null;
		Directory index = null;
		IndexReader indexReader = null;
		Query query = null;
		try {

			index = FSDirectory.open(new File(INDEX_PATH));
			indexReader = IndexReader.open(index);
			searcher = new IndexSearcher(indexReader);

            query = new MultiFieldQueryParser(VERSION, MULTI_QUERY_FIELDS, ANALYZER, MULTI_QUERY_FIELD_BOOSTS).parse(queryString);
			Highlighter highlighter = new Highlighter(new SimpleHTMLFormatter(), new QueryScorer(query));
            TopDocs rs = null;
			if(filter != null) {
				rs = searcher.search(query, filter, searcher.maxDoc());
			} else {
				rs = searcher.search(query, searcher.maxDoc());
			}
			
            /* Build the resultset */
            for(int i = 0; i < rs.scoreDocs.length; i++) {
            	int id = rs.scoreDocs[i].doc;
				Document documentLucene = searcher.doc(rs.scoreDocs[i].doc);

				Date releaseDate = new Date(Long.valueOf(documentLucene.getFieldable(FIELD_RELEASE_DATE).stringValue()));
				
				double[] latLngArray = GeoHashUtils.decode(documentLucene.getFieldable(FIELD_RELEASE_LAT_LNG).stringValue());
				Address releaseAddress = new Address("", "", "", documentLucene.getFieldable(FIELD_RELEASE_CITY).stringValue(),
						"" +latLngArray[0], "" +latLngArray[1]);
				
				
				List<Date> dateList = new ArrayList<Date>();
				for(String date : this.separateText(documentLucene.getFieldable(FIELD_ALL_DATES).stringValue())) {
					dateList.add(new Date(Long.valueOf(date.trim())));
				}
				
				List<Address> addressList = new ArrayList<Address>();
				
				List<String> allLatList = this.separateText(documentLucene.getFieldable(FIELD_ALL_LAT).stringValue());
				List<String> allLngList = this.separateText(documentLucene.getFieldable(FIELD_ALL_LNG).stringValue());
				List<String> allHousenumbersList = this.separateText(documentLucene.getFieldable(FIELD_ALL_HOUSENUMBERS).stringValue());
				List<String> allStreetnamesList = this.separateText(documentLucene.getFieldable(FIELD_ALL_STREETNAMES).stringValue());
				List<String> allCitynamesList = this.separateText(documentLucene.getFieldable(FIELD_ALL_CITY_NAMES).stringValue());
				List<String> allZipcodesList = this.separateText(documentLucene.getFieldable(FIELD_ALL_ZIPCODES).stringValue());
				
				/* All lists have the same size */
				for(int j = 0; j < allLatList.size(); j++) {
					addressList.add(new Address(allHousenumbersList.get(j), allStreetnamesList.get(j), allZipcodesList.get(j),
							allCitynamesList.get(j), allLatList.get(j), allLngList.get(j)));
				}
				
				/* Result summary */
			    String text = documentLucene.get(FIELD_CONTENT);
			    TokenStream tokenStream = TokenSources.getAnyTokenStream(searcher.getIndexReader(), id, FIELD_CONTENT, ANALYZER);
			    String summary = highlighter.getBestFragments(tokenStream, text, MAX_SUMMARY_FRAGMENTS, SUMMARY_SEPATATOR);
			    
			    /* Check, if we found a dynamic summary in the content field */
			    if(text.equals(summary)) {
			    	summary = text.substring(0, STATIC_SUMMARY_MAX_CHARS >= text.length() ? text.length() : STATIC_SUMMARY_MAX_CHARS);
			    }
			    
			    if(!summary.endsWith(SUMMARY_SEPATATOR)) {
			    	summary += (SUMMARY_SEPATATOR);
			    }
			    
			    SearchResult searchResult = new SearchResult(documentLucene.getFieldable(FIELD_ID).stringValue(), 
						documentLucene.getFieldable(FIELD_TITLE).stringValue(), releaseAddress, releaseDate, addressList, dateList, summary.trim(), documentLucene.getFieldable(FIELD_CATEGORY).stringValue());
			    
			    if(!searchResultList.contains(searchResult)) {
					searchResultList.add(searchResult);
			    }
			}
			
		} catch(Exception e) {
			e.printStackTrace();
		} finally {
			try {
				searcher.close();
			} catch(Exception e) {}
			try {
				indexReader.close();
			} catch(Exception e) {}
			try {
				index.close();
			} catch(Exception e) {}
		}
		
		return searchResultList;
	}
	
	private List<String> separateText(String text) {
		List<String> stringList = new ArrayList<String>();
		
		Matcher matcher = SEPARATOR_MULTI_FIELD_PATTERN.matcher(text);
		while(matcher.find()) {
			stringList.add(matcher.group().replaceAll(SEPARATOR_MULTI_FIELDS, ""));
		}
		
		return stringList;
	}
}