package de.mir.model;

import java.io.Serializable;

/**
 * Wrapps a post-address
 * @author tlottmann
 */
public class Address implements Serializable {
	private static final long serialVersionUID = -6611229927511098786L;
	private String housenumber, streetname, zipcode, city, lat, lng;
	
	/**
	 * 
	 * @param housenumber
	 * @param streetname
	 * @param zipcode
	 * @param city
	 * @param lat
	 * @param lng
	 */
	public Address(String housenumber, String streetname, String zipcode, String city, String lat, String lng) {
		this.housenumber = housenumber;
		this.streetname = streetname;
		this.zipcode = zipcode;
		this.city = city;
		this.lat = lat;
		this.lng = lng;
	}

	public String getHousenumber() {
		return housenumber;
	}

	public void setHousenumber(String housenumber) {
		this.housenumber = housenumber;
	}

	public String getStreetname() {
		return streetname;
	}

	public void setStreetname(String streetname) {
		this.streetname = streetname;
	}

	public String getZipcode() {
		return zipcode;
	}

	public void setZipcode(String zipcode) {
		this.zipcode = zipcode;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((city == null) ? 0 : city.hashCode());
		result = prime * result
				+ ((housenumber == null) ? 0 : housenumber.hashCode());
		result = prime * result
				+ ((streetname == null) ? 0 : streetname.hashCode());
		result = prime * result + ((zipcode == null) ? 0 : zipcode.hashCode());
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
		Address other = (Address) obj;
		if (city == null) {
			if (other.city != null)
				return false;
		} else if (!city.equals(other.city))
			return false;
		if (housenumber == null) {
			if (other.housenumber != null)
				return false;
		} else if (!housenumber.equals(other.housenumber))
			return false;
		if (streetname == null) {
			if (other.streetname != null)
				return false;
		} else if (!streetname.equals(other.streetname))
			return false;
		if (zipcode == null) {
			if (other.zipcode != null)
				return false;
		} else if (!zipcode.equals(other.zipcode))
			return false;
		return true;
	}

	public String getLat() {
		return lat;
	}

	public void setLat(String lat) {
		this.lat = lat;
	}

	public String getLng() {
		return lng;
	}

	public void setLng(String lng) {
		this.lng = lng;
	}

	public Address clone() {
		return new Address("" +this.getHousenumber(), "" +this.getStreetname(), "" +this.getZipcode(), 
				"" +this.getCity(), "" +this.getLat(), "" +this.getLng());
	}
}
