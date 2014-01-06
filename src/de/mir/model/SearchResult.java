package de.mir.model;

import java.io.Serializable;
import java.util.Date;
import java.util.List;
/**
 * A search result.
 * @author tlottmann
 */
public class SearchResult implements Serializable{
	private static final long serialVersionUID = 8125493455234918617L;
	private String url, title, summary, category;
	private Address releaseAddress;
	private Date releaseDate;
	private List<Address> addressList;
	private List<Date> dateList;

	public SearchResult() {}
	
	/**
	 * 
	 * @param url
	 * @param title
	 * @param releaseAddress
	 * @param releaseDate
	 * @param addressList
	 * @param dateList
	 * @param summary
	 */
	public SearchResult(String url, String title, Address releaseAddress, Date releaseDate, 
			List<Address> addressList, List<Date> dateList, String summary, String category) {
		this.url = url;
		this.title = title;
		this.releaseAddress = releaseAddress;
		this.releaseDate = releaseDate;
		this.addressList = addressList;
		this.dateList = dateList;
		this.summary = summary;
		this.category = category;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public Address getReleaseAddress() {
		return releaseAddress;
	}

	public void setReleaseAddress(Address releaseAddress) {
		this.releaseAddress = releaseAddress;
	}

	public Date getReleaseDate() {
		return releaseDate;
	}

	public void setReleaseDate(Date releaseDate) {
		this.releaseDate = releaseDate;
	}

	public List<Address> getAddressList() {
		return addressList;
	}

	public void setAddressList(List<Address> addressList) {
		this.addressList = addressList;
	}

	public List<Date> getDateList() {
		return dateList;
	}

	public void setDateList(List<Date> dateList) {
		this.dateList = dateList;
	}

	public String getSummary() {
		return summary;
	}

	public void setSummary(String summary) {
		this.summary = summary;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((summary == null) ? 0 : summary.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		SearchResult other = (SearchResult) obj;
		if (summary == null) {
			if (other.summary != null)
				return false;
		} else if (!summary.equals(other.summary))
			return false;
		return true;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}
}