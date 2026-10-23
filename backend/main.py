"""Travel Wrapped backend: countries, trips, stats, and the yearly recap.

Run it with:  uvicorn main:app --reload --port 8000

Database: on your laptop (and in the tests) this uses a local SQLite file.
When DATABASE_URL is set (on Vercel), it uses Postgres instead. The SQL
below is written so the same queries work on both.

Workspaces: there are no user accounts yet. Instead, each browser makes up a
random id and sends it in an "X-Workspace-Id" header. Every query below is
filtered by that id, so each browser only sees (and can only change) its own data.
"""

import os
import sqlite3
from datetime import date

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sample_data import SAMPLE_COUNTRIES, SAMPLE_TRIPS
from world import CONTINENTS, continent_of, find_country

# The project plan says to use 195 as the total number of countries.
TOTAL_COUNTRIES = 195

# If DATABASE_URL is set (it is on Vercel), we use Postgres.
# Otherwise we use a local SQLite file.
DATABASE_URL = os.environ.get("DATABASE_URL")
USE_POSTGRES = bool(DATABASE_URL)

# Where the SQLite database file lives. Tests point this at a temporary file
# so they never touch the real data.
DB_PATH = os.environ.get("DB_PATH", "travel.db")

# Rows saved before workspaces existed belong to this workspace.
DEFAULT_WORKSPACE = "default"

# Shared workspaces that "Clear my data" is never allowed to wipe:
# "default" (old data) and "demo" (the public demo link).
PROTECTED_WORKSPACES = [DEFAULT_WORKSPACE, "demo"]

# Websites allowed to call this API (see CORS below). On Vercel we add the
# deployed frontend's URL through the ALLOWED_ORIGINS setting.
ALLOWED_ORIGINS = ["http://localhost:3000"] + [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app = FastAPI(title="Travel Wrapped API")

# CORS: the browser blocks requests from one origin (localhost:3000, the
# Next.js app) to another (localhost:8000, this API) unless the API says
# it's allowed. This tells the browser our frontend is allowed.
# allow_headers=["*"] also allows our custom X-Workspace-Id header.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Database helpers ----------


def sql(query: str) -> str:
    """SQLite uses ? for placeholders but Postgres uses %s, so swap them."""
    return query.replace("?", "%s") if USE_POSTGRES else query


# Remembers which database we already set up, so we only run the
# CREATE TABLE / ALTER TABLE statements once instead of on every request.
setup_done_for = None


def get_connection():
    """Open a connection to the database (and set up the tables the first time)."""
    global setup_done_for

    if USE_POSTGRES:
        # Only imported when needed, so local runs don't require it.
        import psycopg
        from psycopg.rows import dict_row

        # dict_row lets us read columns by name, e.g. row["name"].
        conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        database_name = DATABASE_URL
    else:
        conn = sqlite3.connect(DB_PATH)
        # row_factory lets us read columns by name, e.g. row["name"].
        conn.row_factory = sqlite3.Row
        database_name = DB_PATH

    if setup_done_for != database_name:
        create_tables(conn)
        setup_done_for = database_name
    return conn


def add_column_if_missing(conn, table: str, column: str, definition: str):
    """Add a column to a table that already exists (used to upgrade old databases)."""
    if USE_POSTGRES:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {definition}")
        return

    # SQLite doesn't support "ADD COLUMN IF NOT EXISTS", so we look at the
    # table's current columns first.
    columns = conn.execute(f"PRAGMA table_info({table})").fetchall()
    for existing in columns:
        if existing["name"] == column:
            return
    conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def create_tables(conn):
    """Create the tables if they don't exist, and upgrade older versions.

    Everything here is safe to run more than once, and nothing here deletes data.
    """
    if USE_POSTGRES:
        id_column = "id SERIAL PRIMARY KEY"
    else:
        id_column = "id INTEGER PRIMARY KEY AUTOINCREMENT"

    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS countries (
            {id_column},
            name TEXT NOT NULL,
            visited_date TEXT,
            cities TEXT NOT NULL DEFAULT '',
            workspace_id TEXT NOT NULL DEFAULT 'default'
        )
        """
    )
    # Databases made before workspaces existed don't have this column yet.
    # Old rows get 'default', so they stay in a workspace no new browser uses.
    add_column_if_missing(conn, "countries", "workspace_id", "TEXT NOT NULL DEFAULT 'default'")
    # Notes were added later, so older databases get an empty notes column.
    add_column_if_missing(conn, "countries", "notes", "TEXT NOT NULL DEFAULT ''")

    # The old index said "no two rows with the same name anywhere". Now the
    # rule is "no duplicates inside one workspace", so we swap the index.
    # (Dropping an index never deletes rows.)
    conn.execute("DROP INDEX IF EXISTS countries_name_lower")
    # LOWER(name) makes "Japan" and "japan" count as the same country.
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS countries_workspace_name "
        "ON countries (workspace_id, LOWER(name))"
    )

    # Lists (countries, cities, ...) are stored as comma-separated text,
    # the same way the countries table stores cities.
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS trips (
            {id_column},
            workspace_id TEXT NOT NULL,
            title TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            countries TEXT NOT NULL DEFAULT '',
            cities TEXT NOT NULL DEFAULT '',
            hotels TEXT NOT NULL DEFAULT '',
            restaurants TEXT NOT NULL DEFAULT '',
            activities TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT ''
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS trips_workspace ON trips (workspace_id)")
    conn.commit()


def split_list(text: str) -> list[str]:
    """Turn "Tokyo,Kyoto" from the database back into ["Tokyo", "Kyoto"]."""
    if not text:
        return []
    return text.split(",")


def clean_list(items: list[str] | str | None) -> list[str]:
    """Accept a list or a comma-separated string, and tidy it up."""
    if items is None:
        return []
    if isinstance(items, str):
        items = items.split(",")
    # Trim spaces and drop empty entries (e.g. from "Tokyo, ,Kyoto").
    cleaned = []
    for item in items:
        # Commas would break our comma-separated storage, so swap them out.
        item = item.replace(",", " ").strip()
        if item:
            cleaned.append(item)
    return cleaned


def trip_days(start_date: str, end_date: str) -> int:
    """How many days a trip lasted, counting both the first and last day."""
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    return (end - start).days + 1


# ---------- Workspace ----------


def get_workspace(x_workspace_id: str | None = Header(default=None)) -> str:
    """Read the X-Workspace-Id header that every request from the frontend sends.

    FastAPI calls this for any endpoint that has `workspace: str = Depends(get_workspace)`.
    If the header is missing, we fall back to the "default" workspace.
    """
    if x_workspace_id is None or x_workspace_id.strip() == "":
        return DEFAULT_WORKSPACE

    workspace = x_workspace_id.strip()
    if len(workspace) > 64:
        raise HTTPException(status_code=400, detail="Workspace id is too long.")
    for ch in workspace:
        if not (ch.isalnum() or ch in "-_"):
            raise HTTPException(
                status_code=400,
                detail="Workspace id can only use letters, numbers, - and _.",
            )
    return workspace


# ---------- Typed request and response shapes ----------
# Pydantic checks these for us. A missing field or a bad date (not
# YYYY-MM-DD) is rejected automatically with a 422 error. The response
# models also show up in the API docs at /docs.


class CountryCreate(BaseModel):
    """What the frontend sends when adding a country."""

    name: str
    visited_date: date | None = None
    cities: list[str] | str | None = None
    notes: str | None = None


class CountryUpdate(BaseModel):
    """What the frontend sends when editing a country (the name can't change)."""

    visited_date: date | None = None
    cities: list[str] | str | None = None
    notes: str | None = None


class CountryTrip(BaseModel):
    """A short version of a trip, shown under each country on the Been page."""

    id: int
    title: str
    start_date: str


class Country(BaseModel):
    id: int
    name: str
    continent: str
    visited_date: str | None
    cities: list[str]
    notes: str
    trips: list[CountryTrip]


class TripInput(BaseModel):
    """What the frontend sends when creating or editing a trip."""

    title: str
    start_date: date
    end_date: date
    countries: list[str]
    cities: list[str] | str | None = None
    hotels: list[str] | str | None = None
    restaurants: list[str] | str | None = None
    activities: list[str] | str | None = None
    notes: str | None = None


class Trip(BaseModel):
    id: int
    title: str
    start_date: str
    end_date: str
    days: int
    countries: list[str]
    continents: list[str]
    cities: list[str]
    hotels: list[str]
    restaurants: list[str]
    activities: list[str]
    notes: str


class ContinentCount(BaseModel):
    continent: str
    countries: int


class Stats(BaseModel):
    countries_visited: int
    total_countries: int
    percent_of_world: float
    cities_visited: int
    continents_visited: int
    by_continent: list[ContinentCount]
    top_continent: str | None
    total_trips: int
    total_trip_days: int


class LongestTrip(BaseModel):
    id: int
    title: str
    days: int


class Wrapped(BaseModel):
    year: int
    available_years: list[int]
    trips_taken: int
    days_traveled: int
    countries: list[str]
    continents: list[str]
    cities: list[str]
    top_destination: str | None
    longest_trip: LongestTrip | None
    personality: str
    personality_reason: str


class SeedResult(BaseModel):
    seeded: bool
    countries_added: int
    trips_added: int


# ---------- Turning database rows into JSON ----------


def row_to_country(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "continent": continent_of(row["name"]),
        "visited_date": row["visited_date"],
        "cities": split_list(row["cities"]),
        "notes": row["notes"],
        "trips": [],
    }


def row_to_trip(row) -> dict:
    countries = split_list(row["countries"])

    # The trip's continents, without repeats, e.g. France + Italy -> ["Europe"].
    continents = []
    for country in countries:
        continent = continent_of(country)
        if continent not in continents:
            continents.append(continent)

    return {
        "id": row["id"],
        "title": row["title"],
        "start_date": row["start_date"],
        "end_date": row["end_date"],
        "days": trip_days(row["start_date"], row["end_date"]),
        "countries": countries,
        "continents": continents,
        "cities": split_list(row["cities"]),
        "hotels": split_list(row["hotels"]),
        "restaurants": split_list(row["restaurants"]),
        "activities": split_list(row["activities"]),
        "notes": row["notes"],
    }


# ---------- Shared logic (used by the endpoints and by the sample data) ----------


def official_country_name(name: str) -> str:
    """Check a country against the list of 195 and return its official spelling."""
    if name.strip() == "":
        raise HTTPException(status_code=400, detail="Country name is required.")
    official = find_country(name)
    if official is None:
        raise HTTPException(
            status_code=400,
            detail=f'"{name.strip()}" isn\'t in our list of 195 countries. '
            "Pick one from the suggestions.",
        )
    return official


def find_existing_country(conn, workspace: str, name: str):
    """Return the row for this country in this workspace, or None."""
    return conn.execute(
        sql("SELECT * FROM countries WHERE workspace_id = ? AND LOWER(name) = LOWER(?)"),
        (workspace, name),
    ).fetchone()


def insert_country(
    conn, workspace: str, name: str, visited_date: str | None, cities: list[str], notes: str = ""
):
    # The placeholders let the database insert values safely
    # (this prevents SQL injection). RETURNING * hands back the new row.
    return conn.execute(
        sql(
            "INSERT INTO countries (workspace_id, name, visited_date, cities, notes) "
            "VALUES (?, ?, ?, ?, ?) RETURNING *"
        ),
        (workspace, name, visited_date, ",".join(cities), notes),
    ).fetchone()


def check_country_notes(notes: str | None) -> str:
    cleaned = notes.strip() if notes else ""
    if len(cleaned) > 2000:
        raise HTTPException(status_code=400, detail="Notes must be 2000 characters or less.")
    return cleaned


def merge_cities(existing: list[str], new: list[str]) -> list[str]:
    """Add new cities to a list, skipping ones already there (ignoring capitals)."""
    merged = list(existing)
    seen = [city.lower() for city in existing]
    for city in new:
        if city.lower() not in seen:
            merged.append(city)
            seen.append(city.lower())
    return merged


def trips_by_country(conn, workspace: str) -> dict:
    """Map each country name to the trips that went there, newest first."""
    rows = conn.execute(
        sql("SELECT id, title, start_date, countries FROM trips WHERE workspace_id = ? ORDER BY start_date DESC, id DESC"),
        (workspace,),
    ).fetchall()
    result = {}
    for row in rows:
        for name in split_list(row["countries"]):
            result.setdefault(name.lower(), []).append(
                {"id": row["id"], "title": row["title"], "start_date": row["start_date"]}
            )
    return result


def country_with_trips(conn, workspace: str, row) -> dict:
    country = row_to_country(row)
    country["trips"] = trips_by_country(conn, workspace).get(row["name"].lower(), [])
    return country


def check_trip(trip: TripInput) -> dict:
    """Validate a trip and return its cleaned-up values, ready to save."""
    title = trip.title.strip()
    if title == "":
        raise HTTPException(status_code=400, detail="Trip title is required.")
    if len(title) > 100:
        raise HTTPException(status_code=400, detail="Trip title must be 100 characters or less.")
    if trip.end_date < trip.start_date:
        raise HTTPException(status_code=400, detail="End date can't be before the start date.")

    countries = []
    for name in trip.countries:
        official = official_country_name(name)
        if official not in countries:
            countries.append(official)
    if len(countries) == 0:
        raise HTTPException(status_code=400, detail="Add at least one country.")

    notes = trip.notes.strip() if trip.notes else ""

    return {
        "title": title,
        "start_date": trip.start_date.isoformat(),
        "end_date": trip.end_date.isoformat(),
        "countries": ",".join(countries),
        "cities": ",".join(clean_list(trip.cities)),
        "hotels": ",".join(clean_list(trip.hotels)),
        "restaurants": ",".join(clean_list(trip.restaurants)),
        "activities": ",".join(clean_list(trip.activities)),
        "notes": notes,
    }


def mark_trip_countries_as_been(conn, workspace: str, values: dict):
    """Saving a trip also adds its countries to the Been list (if they're not there yet).

    If the trip is to just one country, its cities are added to that country too.
    (With several countries we can't tell which city belongs where, so we skip cities.)
    """
    countries = split_list(values["countries"])
    trip_cities = split_list(values["cities"]) if len(countries) == 1 else []
    for name in countries:
        existing = find_existing_country(conn, workspace, name)
        if existing is None:
            insert_country(conn, workspace, name, values["start_date"], trip_cities)
        elif trip_cities:
            merged = merge_cities(split_list(existing["cities"]), trip_cities)
            conn.execute(
                sql("UPDATE countries SET cities = ? WHERE id = ?"),
                (",".join(merged), existing["id"]),
            )


def insert_trip(conn, workspace: str, values: dict):
    new_row = conn.execute(
        sql(
            "INSERT INTO trips (workspace_id, title, start_date, end_date, countries, "
            "cities, hotels, restaurants, activities, notes) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
        ),
        (
            workspace,
            values["title"],
            values["start_date"],
            values["end_date"],
            values["countries"],
            values["cities"],
            values["hotels"],
            values["restaurants"],
            values["activities"],
            values["notes"],
        ),
    ).fetchone()
    mark_trip_countries_as_been(conn, workspace, values)
    return new_row


def count_rows(conn, table: str, workspace: str) -> int:
    row = conn.execute(
        sql(f"SELECT COUNT(*) AS total FROM {table} WHERE workspace_id = ?"), (workspace,)
    ).fetchone()
    return row["total"]


def pick_personality(trips_taken: int, continents: int, countries: int, longest_days: int):
    """A fun label for the Wrapped page, picked with simple rules (checked in order)."""
    if trips_taken == 0:
        return "Homebody", "No trips this year. There's always next year!"
    if continents >= 3:
        return "Globetrotter", f"You set foot on {continents} continents this year."
    if trips_taken >= 4:
        return "Frequent Flyer", f"You packed your bags {trips_taken} times this year."
    if longest_days >= 14:
        return "Slow Traveler", f"Your longest trip lasted {longest_days} days."
    if countries == 1:
        return "Deep Diver", "You went all in on one country."
    return "Explorer", f"You explored {countries} countries this year."


# ---------- Country endpoints ----------


@app.get("/api/countries", response_model=list[Country])
def list_countries(workspace: str = Depends(get_workspace)):
    conn = get_connection()
    try:
        rows = conn.execute(
            sql("SELECT * FROM countries WHERE workspace_id = ? ORDER BY LOWER(name)"),
            (workspace,),
        ).fetchall()
        trips = trips_by_country(conn, workspace)
        countries = []
        for row in rows:
            country = row_to_country(row)
            country["trips"] = trips.get(row["name"].lower(), [])
            countries.append(country)
        return countries
    finally:
        conn.close()


@app.post("/api/countries", status_code=201, response_model=Country)
def add_country(country: CountryCreate, workspace: str = Depends(get_workspace)):
    # Must be one of the 195 countries (case-insensitive). We save the
    # official spelling, so "japan" is stored as "Japan".
    name = official_country_name(country.name)
    cities = clean_list(country.cities)
    # No date given: use today, so the country and its new trip match.
    visited_date = country.visited_date.isoformat() if country.visited_date else date.today().isoformat()
    notes = check_country_notes(country.notes)

    conn = get_connection()
    try:
        # Check for a duplicate first so we can send a friendly message.
        existing = find_existing_country(conn, workspace, name)
        if existing:
            raise HTTPException(
                status_code=409, detail=f"You already added {existing['name']}."
            )

        new_row = insert_country(conn, workspace, name, visited_date, cities, notes)
        # Keep Been and Trips in sync: every country you add also gets a trip.
        trip_date = visited_date
        insert_trip(
            conn,
            workspace,
            {
                "title": f"Trip to {name}",
                "start_date": trip_date,
                "end_date": trip_date,
                "countries": name,
                "cities": ",".join(cities),
                "hotels": "",
                "restaurants": "",
                "activities": "",
                "notes": notes,
            },
        )
        conn.commit()
        return country_with_trips(conn, workspace, new_row)
    finally:
        conn.close()


@app.put("/api/countries/{country_id}", response_model=Country)
def update_country(country_id: int, country: CountryUpdate, workspace: str = Depends(get_workspace)):
    visited_date = country.visited_date.isoformat() if country.visited_date else None
    cities = clean_list(country.cities)
    notes = check_country_notes(country.notes)

    conn = get_connection()
    try:
        updated = conn.execute(
            sql(
                "UPDATE countries SET visited_date = ?, cities = ?, notes = ? "
                "WHERE id = ? AND workspace_id = ? RETURNING *"
            ),
            (visited_date, ",".join(cities), notes, country_id, workspace),
        ).fetchone()
        if updated is None:
            raise HTTPException(status_code=404, detail="Country not found.")
        conn.commit()
        return country_with_trips(conn, workspace, updated)
    finally:
        conn.close()


@app.delete("/api/countries/{country_id}", status_code=204)
def delete_country(country_id: int, workspace: str = Depends(get_workspace)):
    conn = get_connection()
    try:
        # "AND workspace_id = ?" means you can only delete your own rows.
        cursor = conn.execute(
            sql("DELETE FROM countries WHERE id = ? AND workspace_id = ?"),
            (country_id, workspace),
        )
        conn.commit()
        # rowcount is how many rows were deleted. 0 means that id didn't
        # exist (or belongs to another workspace, which looks the same to you).
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Country not found.")
    finally:
        conn.close()


# ---------- Trip endpoints ----------


@app.get("/api/trips", response_model=list[Trip])
def list_trips(workspace: str = Depends(get_workspace)):
    conn = get_connection()
    try:
        rows = conn.execute(
            sql(
                "SELECT * FROM trips WHERE workspace_id = ? "
                "ORDER BY start_date DESC, id DESC"
            ),
            (workspace,),
        ).fetchall()
        return [row_to_trip(row) for row in rows]
    finally:
        conn.close()


@app.post("/api/trips", status_code=201, response_model=Trip)
def create_trip(trip: TripInput, workspace: str = Depends(get_workspace)):
    values = check_trip(trip)
    conn = get_connection()
    try:
        new_row = insert_trip(conn, workspace, values)
        conn.commit()
        return row_to_trip(new_row)
    finally:
        conn.close()


@app.get("/api/trips/{trip_id}", response_model=Trip)
def get_trip(trip_id: int, workspace: str = Depends(get_workspace)):
    conn = get_connection()
    try:
        row = conn.execute(
            sql("SELECT * FROM trips WHERE id = ? AND workspace_id = ?"),
            (trip_id, workspace),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Trip not found.")
        return row_to_trip(row)
    finally:
        conn.close()


@app.put("/api/trips/{trip_id}", response_model=Trip)
def update_trip(trip_id: int, trip: TripInput, workspace: str = Depends(get_workspace)):
    values = check_trip(trip)
    conn = get_connection()
    try:
        updated = conn.execute(
            sql(
                "UPDATE trips SET title = ?, start_date = ?, end_date = ?, countries = ?, "
                "cities = ?, hotels = ?, restaurants = ?, activities = ?, notes = ? "
                "WHERE id = ? AND workspace_id = ? RETURNING *"
            ),
            (
                values["title"],
                values["start_date"],
                values["end_date"],
                values["countries"],
                values["cities"],
                values["hotels"],
                values["restaurants"],
                values["activities"],
                values["notes"],
                trip_id,
                workspace,
            ),
        ).fetchone()
        if updated is None:
            raise HTTPException(status_code=404, detail="Trip not found.")
        mark_trip_countries_as_been(conn, workspace, values)
        conn.commit()
        return row_to_trip(updated)
    finally:
        conn.close()


@app.delete("/api/trips/{trip_id}", status_code=204)
def delete_trip(trip_id: int, workspace: str = Depends(get_workspace)):
    conn = get_connection()
    try:
        cursor = conn.execute(
            sql("DELETE FROM trips WHERE id = ? AND workspace_id = ?"),
            (trip_id, workspace),
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Trip not found.")
    finally:
        conn.close()


# ---------- Insights ----------


@app.get("/api/stats", response_model=Stats)
def get_stats(workspace: str = Depends(get_workspace)):
    conn = get_connection()
    try:
        country_rows = conn.execute(
            sql("SELECT * FROM countries WHERE workspace_id = ?"), (workspace,)
        ).fetchall()
        trip_rows = conn.execute(
            sql("SELECT * FROM trips WHERE workspace_id = ?"), (workspace,)
        ).fetchall()
    finally:
        conn.close()

    # Count countries per continent, starting every continent at 0.
    per_continent = {}
    for continent in CONTINENTS:
        per_continent[continent] = 0
    for row in country_rows:
        continent = continent_of(row["name"])
        if continent in per_continent:
            per_continent[continent] += 1

    by_continent = []
    continents_visited = 0
    top_continent = None
    for continent in CONTINENTS:
        count = per_continent[continent]
        by_continent.append({"continent": continent, "countries": count})
        if count > 0:
            continents_visited += 1
        # Ties go to whichever continent comes first in the list.
        if count > 0 and (top_continent is None or count > per_continent[top_continent]):
            top_continent = continent

    # Unique cities from both the Been list and trips (ignoring capitals).
    cities = set()
    for row in country_rows:
        for city in split_list(row["cities"]):
            cities.add(city.lower())
    for row in trip_rows:
        for city in split_list(row["cities"]):
            cities.add(city.lower())

    total_trip_days = 0
    for row in trip_rows:
        total_trip_days += trip_days(row["start_date"], row["end_date"])

    count = len(country_rows)
    return {
        "countries_visited": count,
        "total_countries": TOTAL_COUNTRIES,
        "percent_of_world": round(count / TOTAL_COUNTRIES * 100, 1),
        "cities_visited": len(cities),
        "continents_visited": continents_visited,
        "by_continent": by_continent,
        "top_continent": top_continent,
        "total_trips": len(trip_rows),
        "total_trip_days": total_trip_days,
    }


@app.get("/api/wrapped", response_model=Wrapped)
def get_wrapped(year: int | None = None, workspace: str = Depends(get_workspace)):
    """The yearly recap. A trip counts toward the year it started in."""
    conn = get_connection()
    try:
        rows = conn.execute(
            sql("SELECT * FROM trips WHERE workspace_id = ? ORDER BY start_date"),
            (workspace,),
        ).fetchall()
    finally:
        conn.close()
    trips = [row_to_trip(row) for row in rows]

    # Every year that has at least one trip, newest first.
    available_years = []
    for trip in trips:
        trip_year = int(trip["start_date"][:4])
        if trip_year not in available_years:
            available_years.append(trip_year)
    available_years.sort(reverse=True)

    # No year asked for: show the most recent year with trips (or this year).
    if year is None:
        if available_years:
            year = available_years[0]
        else:
            year = date.today().year

    days_traveled = 0
    countries = []
    continents = []
    cities = []
    country_counts = {}  # how many trips went to each country
    longest = None
    trips_taken = 0

    for trip in trips:
        if int(trip["start_date"][:4]) != year:
            continue
        trips_taken += 1
        days_traveled += trip["days"]
        if longest is None or trip["days"] > longest["days"]:
            longest = trip
        for country in trip["countries"]:
            if country not in countries:
                countries.append(country)
            country_counts[country] = country_counts.get(country, 0) + 1
        for continent in trip["continents"]:
            if continent not in continents:
                continents.append(continent)
        for city in trip["cities"]:
            if city not in cities:
                cities.append(city)

    # Top destination = the country with the most trips (first one wins a tie).
    top_destination = None
    for country, count in country_counts.items():
        if top_destination is None or count > country_counts[top_destination]:
            top_destination = country

    longest_trip = None
    longest_days = 0
    if longest is not None:
        longest_trip = {"id": longest["id"], "title": longest["title"], "days": longest["days"]}
        longest_days = longest["days"]

    personality, reason = pick_personality(
        trips_taken, len(continents), len(countries), longest_days
    )

    return {
        "year": year,
        "available_years": available_years,
        "trips_taken": trips_taken,
        "days_traveled": days_traveled,
        "countries": countries,
        "continents": continents,
        "cities": cities,
        "top_destination": top_destination,
        "longest_trip": longest_trip,
        "personality": personality,
        "personality_reason": reason,
    }


# ---------- Workspace actions ----------


@app.post("/api/sample-data", response_model=SeedResult)
def load_sample_data(workspace: str = Depends(get_workspace)):
    """Fill an EMPTY workspace with demo countries and trips.

    If the workspace already has data, we leave it alone (so clicking twice
    doesn't make duplicates) and return seeded = false.
    """
    conn = get_connection()
    try:
        if count_rows(conn, "countries", workspace) > 0 or count_rows(conn, "trips", workspace) > 0:
            return {"seeded": False, "countries_added": 0, "trips_added": 0}

        for country in SAMPLE_COUNTRIES:
            insert_country(
                conn, workspace, country["name"], country["visited_date"], country["cities"]
            )
        for trip in SAMPLE_TRIPS:
            # Run the sample trips through the same validation as real ones.
            values = check_trip(TripInput(**trip))
            insert_trip(conn, workspace, values)

        countries_added = count_rows(conn, "countries", workspace)
        conn.commit()
        return {
            "seeded": True,
            "countries_added": countries_added,
            "trips_added": len(SAMPLE_TRIPS),
        }
    finally:
        conn.close()


@app.delete("/api/workspace", status_code=204)
def clear_workspace(workspace: str = Depends(get_workspace)):
    """Delete every country and trip in YOUR workspace (used by "Clear my data")."""
    # Safety check: never wipe a shared workspace, e.g. "default" (a request
    # that forgot the header) or "demo" (which everyone with the demo link uses).
    if workspace in PROTECTED_WORKSPACES:
        raise HTTPException(status_code=400, detail=f"The {workspace} workspace can't be cleared.")

    conn = get_connection()
    try:
        conn.execute(sql("DELETE FROM trips WHERE workspace_id = ?"), (workspace,))
        conn.execute(sql("DELETE FROM countries WHERE workspace_id = ?"), (workspace,))
        conn.commit()
    finally:
        conn.close()
