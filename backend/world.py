"""The fixed list of 195 countries (193 UN members + Vatican City + Palestine)
and the continent each one belongs to.

The frontend has a copy of this same list in frontend/lib/worldCountries.ts.
If you change one, change the other.
"""
import unicodedata


CONTINENTS = [
    "Africa",
    "Asia",
    "Europe",
    "North America",
    "South America",
    "Oceania",
]

# Country name -> continent
COUNTRY_CONTINENTS = {
    # Africa (54)
    "Algeria": "Africa",
    "Angola": "Africa",
    "Benin": "Africa",
    "Botswana": "Africa",
    "Burkina Faso": "Africa",
    "Burundi": "Africa",
    "Cabo Verde": "Africa",
    "Cameroon": "Africa",
    "Central African Republic": "Africa",
    "Chad": "Africa",
    "Comoros": "Africa",
    "Democratic Republic of the Congo": "Africa",
    "Djibouti": "Africa",
    "Egypt": "Africa",
    "Equatorial Guinea": "Africa",
    "Eritrea": "Africa",
    "Eswatini": "Africa",
    "Ethiopia": "Africa",
    "Gabon": "Africa",
    "Gambia": "Africa",
    "Ghana": "Africa",
    "Guinea": "Africa",
    "Guinea-Bissau": "Africa",
    "Ivory Coast": "Africa",
    "Kenya": "Africa",
    "Lesotho": "Africa",
    "Liberia": "Africa",
    "Libya": "Africa",
    "Madagascar": "Africa",
    "Malawi": "Africa",
    "Mali": "Africa",
    "Mauritania": "Africa",
    "Mauritius": "Africa",
    "Morocco": "Africa",
    "Mozambique": "Africa",
    "Namibia": "Africa",
    "Niger": "Africa",
    "Nigeria": "Africa",
    "Republic of the Congo": "Africa",
    "Rwanda": "Africa",
    "Sao Tome and Principe": "Africa",
    "Senegal": "Africa",
    "Seychelles": "Africa",
    "Sierra Leone": "Africa",
    "Somalia": "Africa",
    "South Africa": "Africa",
    "South Sudan": "Africa",
    "Sudan": "Africa",
    "Tanzania": "Africa",
    "Togo": "Africa",
    "Tunisia": "Africa",
    "Uganda": "Africa",
    "Zambia": "Africa",
    "Zimbabwe": "Africa",
    # Asia (48)
    "Afghanistan": "Asia",
    "Armenia": "Asia",
    "Azerbaijan": "Asia",
    "Bahrain": "Asia",
    "Bangladesh": "Asia",
    "Bhutan": "Asia",
    "Brunei": "Asia",
    "Cambodia": "Asia",
    "China": "Asia",
    "Cyprus": "Asia",
    "Georgia": "Asia",
    "India": "Asia",
    "Indonesia": "Asia",
    "Iran": "Asia",
    "Iraq": "Asia",
    "Israel": "Asia",
    "Japan": "Asia",
    "Jordan": "Asia",
    "Kazakhstan": "Asia",
    "Kuwait": "Asia",
    "Kyrgyzstan": "Asia",
    "Laos": "Asia",
    "Lebanon": "Asia",
    "Malaysia": "Asia",
    "Maldives": "Asia",
    "Mongolia": "Asia",
    "Myanmar": "Asia",
    "Nepal": "Asia",
    "North Korea": "Asia",
    "Oman": "Asia",
    "Pakistan": "Asia",
    "Palestine": "Asia",
    "Philippines": "Asia",
    "Qatar": "Asia",
    "Saudi Arabia": "Asia",
    "Singapore": "Asia",
    "South Korea": "Asia",
    "Sri Lanka": "Asia",
    "Syria": "Asia",
    "Tajikistan": "Asia",
    "Thailand": "Asia",
    "Timor-Leste": "Asia",
    "Turkey": "Asia",
    "Turkmenistan": "Asia",
    "United Arab Emirates": "Asia",
    "Uzbekistan": "Asia",
    "Vietnam": "Asia",
    "Yemen": "Asia",
    # Europe (44)
    "Albania": "Europe",
    "Andorra": "Europe",
    "Austria": "Europe",
    "Belarus": "Europe",
    "Belgium": "Europe",
    "Bosnia and Herzegovina": "Europe",
    "Bulgaria": "Europe",
    "Croatia": "Europe",
    "Czechia": "Europe",
    "Denmark": "Europe",
    "Estonia": "Europe",
    "Finland": "Europe",
    "France": "Europe",
    "Germany": "Europe",
    "Greece": "Europe",
    "Hungary": "Europe",
    "Iceland": "Europe",
    "Ireland": "Europe",
    "Italy": "Europe",
    "Latvia": "Europe",
    "Liechtenstein": "Europe",
    "Lithuania": "Europe",
    "Luxembourg": "Europe",
    "Malta": "Europe",
    "Moldova": "Europe",
    "Monaco": "Europe",
    "Montenegro": "Europe",
    "Netherlands": "Europe",
    "North Macedonia": "Europe",
    "Norway": "Europe",
    "Poland": "Europe",
    "Portugal": "Europe",
    "Romania": "Europe",
    "Russia": "Europe",
    "San Marino": "Europe",
    "Serbia": "Europe",
    "Slovakia": "Europe",
    "Slovenia": "Europe",
    "Spain": "Europe",
    "Sweden": "Europe",
    "Switzerland": "Europe",
    "Ukraine": "Europe",
    "United Kingdom": "Europe",
    "Vatican City": "Europe",
    # North America (23)
    "Antigua and Barbuda": "North America",
    "Bahamas": "North America",
    "Barbados": "North America",
    "Belize": "North America",
    "Canada": "North America",
    "Costa Rica": "North America",
    "Cuba": "North America",
    "Dominica": "North America",
    "Dominican Republic": "North America",
    "El Salvador": "North America",
    "Grenada": "North America",
    "Guatemala": "North America",
    "Haiti": "North America",
    "Honduras": "North America",
    "Jamaica": "North America",
    "Mexico": "North America",
    "Nicaragua": "North America",
    "Panama": "North America",
    "Saint Kitts and Nevis": "North America",
    "Saint Lucia": "North America",
    "Saint Vincent and the Grenadines": "North America",
    "Trinidad and Tobago": "North America",
    "United States": "North America",
    # South America (12)
    "Argentina": "South America",
    "Bolivia": "South America",
    "Brazil": "South America",
    "Chile": "South America",
    "Colombia": "South America",
    "Ecuador": "South America",
    "Guyana": "South America",
    "Paraguay": "South America",
    "Peru": "South America",
    "Suriname": "South America",
    "Uruguay": "South America",
    "Venezuela": "South America",
    # Oceania (14)
    "Australia": "Oceania",
    "Fiji": "Oceania",
    "Kiribati": "Oceania",
    "Marshall Islands": "Oceania",
    "Micronesia": "Oceania",
    "Nauru": "Oceania",
    "New Zealand": "Oceania",
    "Palau": "Oceania",
    "Papua New Guinea": "Oceania",
    "Samoa": "Oceania",
    "Solomon Islands": "Oceania",
    "Tonga": "Oceania",
    "Tuvalu": "Oceania",
    "Vanuatu": "Oceania",
}


# Common names people type, mapped to the official spelling. Keys are written
# the way normalize_name() leaves them (lowercase, no dots or apostrophes).
# Keep this in sync with ALIASES in frontend/lib/worldCountries.ts.
ALIASES = {
    "usa": "United States",
    "us": "United States",
    "united states of america": "United States",
    "america": "United States",
    "uk": "United Kingdom",
    "great britain": "United Kingdom",
    "britain": "United Kingdom",
    "england": "United Kingdom",
    "scotland": "United Kingdom",
    "wales": "United Kingdom",
    "northern ireland": "United Kingdom",
    "holland": "Netherlands",
    "korea": "South Korea",
    "republic of korea": "South Korea",
    "dprk": "North Korea",
    "uae": "United Arab Emirates",
    "emirates": "United Arab Emirates",
    "cote divoire": "Ivory Coast",
    "cote d ivoire": "Ivory Coast",
    "czech republic": "Czechia",
    "drc": "Democratic Republic of the Congo",
    "dr congo": "Democratic Republic of the Congo",
    "congo kinshasa": "Democratic Republic of the Congo",
    "congo": "Republic of the Congo",
    "congo brazzaville": "Republic of the Congo",
    "burma": "Myanmar",
    "swaziland": "Eswatini",
    "macedonia": "North Macedonia",
    "east timor": "Timor-Leste",
    "cape verde": "Cabo Verde",
    "vatican": "Vatican City",
    "holy see": "Vatican City",
    "turkiye": "Turkey",
    "bosnia": "Bosnia and Herzegovina",
    "trinidad": "Trinidad and Tobago",
    "russian federation": "Russia",
    "viet nam": "Vietnam",
    "lao pdr": "Laos",
    "federated states of micronesia": "Micronesia",
    "png": "Papua New Guinea",
    "nz": "New Zealand",
}


def normalize_name(name: str) -> str:
    """Make a country name easy to compare: "  The U.S.A. " -> "usa", "Côte d'Ivoire" -> "cote divoire"."""
    text = unicodedata.normalize("NFD", name)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))  # drop accents
    text = text.lower().replace("&", " and ").replace("-", " ")
    for ch in ".,'’":
        text = text.replace(ch, "")
    text = " ".join(text.split())  # trim and collapse spaces
    if text.startswith("the "):
        text = text[4:]
    if text.startswith("st "):
        text = "saint " + text[3:]
    return text


def find_country(name: str) -> str | None:
    """Return the official spelling of a country, or None if it's not in the list.

    Ignores capitals, extra spaces, accents, and punctuation, and understands
    common nicknames, so " usa " finds "United States".
    """
    wanted = normalize_name(name)
    if wanted == "":
        return None
    for country in COUNTRY_CONTINENTS:
        if normalize_name(country) == wanted:
            return country
    return ALIASES.get(wanted)


def continent_of(name: str) -> str:
    """Return the continent for a country, or "Unknown" for names not in the list
    (e.g. rows saved before we added validation)."""
    official = find_country(name)
    if official is None:
        return "Unknown"
    return COUNTRY_CONTINENTS[official]
