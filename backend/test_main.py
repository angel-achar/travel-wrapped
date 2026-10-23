"""Tests for the Travel Wrapped API. Run with:  pytest"""

import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    # Point the app at a brand-new database file for every test,
    # so tests don't affect each other or the real travel.db.
    monkeypatch.setattr(main, "DB_PATH", str(tmp_path / "test.db"))
    return TestClient(main.app)


def test_starts_empty(client):
    response = client.get("/api/countries")
    assert response.status_code == 200
    assert response.json() == []


def test_add_country(client):
    response = client.post(
        "/api/countries",
        json={"name": " Japan ", "visited_date": "2025-03-14", "cities": "Tokyo, Kyoto"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Japan"  # extra spaces trimmed
    assert data["visited_date"] == "2025-03-14"
    assert data["cities"] == ["Tokyo", "Kyoto"]

    # It should now show up in the list.
    countries = client.get("/api/countries").json()
    assert [c["name"] for c in countries] == ["Japan"]


def test_cities_can_be_a_list(client):
    response = client.post("/api/countries", json={"name": "Peru", "cities": ["Lima", "Cusco"]})
    assert response.json()["cities"] == ["Lima", "Cusco"]


def test_blank_name_rejected(client):
    response = client.post("/api/countries", json={"name": "   "})
    assert response.status_code == 400


def test_duplicate_rejected(client):
    client.post("/api/countries", json={"name": "France"})
    # Same name, different capitalization, still counts as a duplicate.
    response = client.post("/api/countries", json={"name": "france"})
    assert response.status_code == 409
    assert len(client.get("/api/countries").json()) == 1


def test_delete_country(client):
    new_id = client.post("/api/countries", json={"name": "Mexico"}).json()["id"]

    response = client.delete(f"/api/countries/{new_id}")
    assert response.status_code == 204
    assert client.get("/api/countries").json() == []

    # Deleting it again should say "not found".
    assert client.delete(f"/api/countries/{new_id}").status_code == 404


def test_stats_percent(client):
    for name in ["Japan", "France", "Mexico"]:
        client.post("/api/countries", json={"name": name})

    stats = client.get("/api/stats").json()
    assert stats["countries_visited"] == 3
    # 3 / 195 * 100 = 1.538... which rounds to 1.5
    assert stats["percent_of_world"] == 1.5


# ---------- Country list validation ----------


def test_country_must_be_in_the_list(client):
    response = client.post("/api/countries", json={"name": "Narnia"})
    assert response.status_code == 400
    assert "Narnia" in response.json()["detail"]


def test_country_name_is_saved_with_official_spelling(client):
    response = client.post("/api/countries", json={"name": "  south korea "})
    assert response.status_code == 201
    assert response.json()["name"] == "South Korea"
    assert response.json()["continent"] == "Asia"


def test_world_list_has_195_countries():
    import world

    assert len(world.COUNTRY_CONTINENTS) == 195
    for continent in world.COUNTRY_CONTINENTS.values():
        assert continent in world.CONTINENTS


# ---------- Workspaces ----------

ALICE = {"X-Workspace-Id": "alice-123"}
BOB = {"X-Workspace-Id": "bob-456"}


def test_workspaces_do_not_see_each_other(client):
    client.post("/api/countries", json={"name": "Japan"}, headers=ALICE)
    client.post("/api/trips", json=trip_body(), headers=ALICE)

    assert len(client.get("/api/countries", headers=ALICE).json()) == 1
    assert client.get("/api/countries", headers=BOB).json() == []
    assert client.get("/api/trips", headers=BOB).json() == []
    assert client.get("/api/stats", headers=BOB).json()["countries_visited"] == 0


def test_same_country_allowed_in_two_workspaces(client):
    assert client.post("/api/countries", json={"name": "Japan"}, headers=ALICE).status_code == 201
    assert client.post("/api/countries", json={"name": "Japan"}, headers=BOB).status_code == 201
    # ...but still not twice in the same workspace.
    assert client.post("/api/countries", json={"name": "japan"}, headers=BOB).status_code == 409


def test_cannot_change_another_workspaces_rows(client):
    country_id = client.post("/api/countries", json={"name": "Peru"}, headers=ALICE).json()["id"]
    trip_id = client.post("/api/trips", json=trip_body(), headers=ALICE).json()["id"]

    # Bob gets "not found" for Alice's rows, as if they didn't exist.
    assert client.delete(f"/api/countries/{country_id}", headers=BOB).status_code == 404
    assert client.get(f"/api/trips/{trip_id}", headers=BOB).status_code == 404
    assert client.put(f"/api/trips/{trip_id}", json=trip_body(), headers=BOB).status_code == 404
    assert client.delete(f"/api/trips/{trip_id}", headers=BOB).status_code == 404

    # Alice's data is untouched.
    assert client.get(f"/api/trips/{trip_id}", headers=ALICE).status_code == 200


def test_bad_workspace_id_rejected(client):
    response = client.get("/api/countries", headers={"X-Workspace-Id": "no spaces!"})
    assert response.status_code == 400


# ---------- Trips ----------


def trip_body(**changes):
    """A valid trip. Pass keyword arguments to change any field."""
    body = {
        "title": "Spring in Japan",
        "start_date": "2025-03-14",
        "end_date": "2025-03-24",
        "countries": ["Japan"],
        "cities": "Tokyo, Kyoto",
        "hotels": ["Park Hyatt"],
        "restaurants": "",
        "activities": "Hiking, Temples",
        "notes": "Cherry blossoms!",
    }
    for key, value in changes.items():
        body[key] = value
    return body


def test_create_and_get_trip(client):
    response = client.post("/api/trips", json=trip_body(), headers=ALICE)
    assert response.status_code == 201
    trip = response.json()
    assert trip["title"] == "Spring in Japan"
    assert trip["days"] == 11  # March 14 to 24, counting both days
    assert trip["countries"] == ["Japan"]
    assert trip["continents"] == ["Asia"]
    assert trip["cities"] == ["Tokyo", "Kyoto"]
    assert trip["restaurants"] == []
    assert trip["activities"] == ["Hiking", "Temples"]

    fetched = client.get(f"/api/trips/{trip['id']}", headers=ALICE).json()
    assert fetched == trip


def test_trip_countries_are_added_to_been_list(client):
    client.post("/api/trips", json=trip_body(countries=["france", "Italy"]), headers=ALICE)
    names = [c["name"] for c in client.get("/api/countries", headers=ALICE).json()]
    assert names == ["France", "Italy"]


def test_one_country_trip_adds_its_cities_to_been(client):
    # New country: created with the trip's date and cities.
    client.post("/api/trips", json=trip_body(), headers=ALICE)
    japan = client.get("/api/countries", headers=ALICE).json()[0]
    assert japan["visited_date"] == "2025-03-14"
    assert japan["cities"] == ["Tokyo", "Kyoto"]

    # Existing country: new cities are added, repeats are skipped.
    client.post("/api/trips", json=trip_body(title="Back again", cities="kyoto, Osaka"), headers=ALICE)
    japan = client.get("/api/countries", headers=ALICE).json()[0]
    assert japan["cities"] == ["Tokyo", "Kyoto", "Osaka"]


def test_multi_country_trip_does_not_guess_cities(client):
    client.post("/api/trips", json=trip_body(countries=["France", "Italy"], cities="Paris, Rome"), headers=ALICE)
    for country in client.get("/api/countries", headers=ALICE).json():
        assert country["cities"] == []


def test_countries_list_their_trips(client):
    first = client.post("/api/trips", json=trip_body(title="Spring", start_date="2024-03-01", end_date="2024-03-05"), headers=ALICE).json()
    second = client.post("/api/trips", json=trip_body(title="Fall", start_date="2025-10-01", end_date="2025-10-05"), headers=ALICE).json()
    japan = client.get("/api/countries", headers=ALICE).json()[0]
    assert [t["id"] for t in japan["trips"]] == [second["id"], first["id"]]  # newest first
    assert japan["trips"][0]["title"] == "Fall"


def test_country_notes_can_be_added_and_edited(client):
    added = client.post("/api/countries", json={"name": "Peru", "notes": " Machu Picchu! "}, headers=ALICE).json()
    assert added["notes"] == "Machu Picchu!"
    assert [t["title"] for t in added["trips"]] == ["Trip to Peru"]

    updated = client.put(
        f"/api/countries/{added['id']}",
        json={"visited_date": "2024-06-01", "cities": "Lima, Cusco", "notes": "Go back for the food."},
        headers=ALICE,
    ).json()
    assert updated["notes"] == "Go back for the food."
    assert updated["cities"] == ["Lima", "Cusco"]
    assert updated["visited_date"] == "2024-06-01"

    # Other workspaces can't edit it.
    assert client.put(f"/api/countries/{added['id']}", json={"notes": "hi"}, headers=BOB).status_code == 404
    assert client.put(f"/api/countries/{added['id']}", json={"notes": "x" * 2001}, headers=ALICE).status_code == 400


def test_trip_validation(client):
    bad_bodies = [
        trip_body(title="   "),  # blank title
        trip_body(start_date="2025-03-24", end_date="2025-03-14"),  # end before start
        trip_body(countries=[]),  # no countries
        trip_body(countries=["Atlantis"]),  # not a real country
    ]
    for body in bad_bodies:
        assert client.post("/api/trips", json=body, headers=ALICE).status_code == 400

    # Missing field and bad date format are caught by Pydantic (422).
    body = trip_body()
    del body["title"]
    assert client.post("/api/trips", json=body, headers=ALICE).status_code == 422
    assert client.post("/api/trips", json=trip_body(start_date="March 1"), headers=ALICE).status_code == 422

    assert client.get("/api/trips", headers=ALICE).json() == []


def test_one_day_trip_is_allowed(client):
    response = client.post(
        "/api/trips", json=trip_body(start_date="2025-05-01", end_date="2025-05-01"), headers=ALICE
    )
    assert response.status_code == 201
    assert response.json()["days"] == 1


def test_update_trip(client):
    trip_id = client.post("/api/trips", json=trip_body(), headers=ALICE).json()["id"]
    response = client.put(
        f"/api/trips/{trip_id}",
        json=trip_body(title="Japan + Korea", countries=["Japan", "South Korea"]),
        headers=ALICE,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Japan + Korea"
    assert response.json()["countries"] == ["Japan", "South Korea"]

    # Bad edits are rejected the same way as bad new trips.
    bad = client.put(f"/api/trips/{trip_id}", json=trip_body(end_date="2020-01-01"), headers=ALICE)
    assert bad.status_code == 400


def test_delete_trip(client):
    trip_id = client.post("/api/trips", json=trip_body(), headers=ALICE).json()["id"]
    assert client.delete(f"/api/trips/{trip_id}", headers=ALICE).status_code == 204
    assert client.get(f"/api/trips/{trip_id}", headers=ALICE).status_code == 404
    assert client.delete(f"/api/trips/{trip_id}", headers=ALICE).status_code == 404


def test_trips_listed_newest_first(client):
    client.post("/api/trips", json=trip_body(title="Old", start_date="2020-01-01", end_date="2020-01-02"), headers=ALICE)
    client.post("/api/trips", json=trip_body(title="New", start_date="2024-01-01", end_date="2024-01-02"), headers=ALICE)
    titles = [t["title"] for t in client.get("/api/trips", headers=ALICE).json()]
    assert titles == ["New", "Old"]


# ---------- Stats, Wrapped, sample data ----------


def test_stats_by_continent_and_trips(client):
    client.post("/api/countries", json={"name": "Japan", "cities": "Tokyo"}, headers=ALICE)
    client.post("/api/countries", json={"name": "Thailand"}, headers=ALICE)
    client.post("/api/countries", json={"name": "France"}, headers=ALICE)
    # 2 trips: 11 days + 3 days. Kyoto is a new city; Tokyo is a repeat.
    client.post("/api/trips", json=trip_body(), headers=ALICE)
    client.post(
        "/api/trips",
        json=trip_body(countries=["Peru"], start_date="2024-01-01", end_date="2024-01-03", cities="Lima"),
        headers=ALICE,
    )

    stats = client.get("/api/stats", headers=ALICE).json()
    assert stats["countries_visited"] == 4  # Japan, Thailand, France + Peru from the trip
    assert stats["percent_of_world"] == 2.1  # 4 / 195 * 100 = 2.05 -> 2.1
    assert stats["continents_visited"] == 3
    assert stats["top_continent"] == "Asia"
    # Each added country also gets a 1-day trip: 3 of those + the 2 trips above.
    assert stats["total_trips"] == 5
    assert stats["total_trip_days"] == 17
    assert stats["cities_visited"] == 3  # Tokyo, Kyoto, Lima

    counts = {}
    for item in stats["by_continent"]:
        counts[item["continent"]] = item["countries"]
    assert counts == {
        "Africa": 0,
        "Asia": 2,
        "Europe": 1,
        "North America": 0,
        "South America": 1,
        "Oceania": 0,
    }


def test_empty_stats(client):
    stats = client.get("/api/stats", headers=ALICE).json()
    assert stats["countries_visited"] == 0
    assert stats["top_continent"] is None
    assert stats["total_trips"] == 0


def test_wrapped_for_a_year(client):
    client.post("/api/trips", json=trip_body(), headers=ALICE)  # 2025, Japan, 11 days
    client.post(
        "/api/trips",
        json=trip_body(title="Paris", countries=["France"], start_date="2025-07-01", end_date="2025-07-04"),
        headers=ALICE,
    )
    client.post(
        "/api/trips",
        json=trip_body(title="Old trip", countries=["Peru"], start_date="2023-01-01", end_date="2023-01-30"),
        headers=ALICE,
    )

    wrapped = client.get("/api/wrapped?year=2025", headers=ALICE).json()
    assert wrapped["year"] == 2025
    assert wrapped["available_years"] == [2025, 2023]
    assert wrapped["trips_taken"] == 2
    assert wrapped["days_traveled"] == 15
    assert wrapped["countries"] == ["Japan", "France"]
    assert wrapped["longest_trip"]["title"] == "Spring in Japan"
    assert wrapped["personality"] == "Explorer"

    # Without a year, it picks the most recent year that has trips.
    assert client.get("/api/wrapped", headers=ALICE).json()["year"] == 2025

    # The 30-day trip in 2023 makes that year a "Slow Traveler" year.
    assert client.get("/api/wrapped?year=2023", headers=ALICE).json()["personality"] == "Slow Traveler"


def test_wrapped_with_no_trips(client):
    wrapped = client.get("/api/wrapped?year=2019", headers=ALICE).json()
    assert wrapped["trips_taken"] == 0
    assert wrapped["longest_trip"] is None
    assert wrapped["top_destination"] is None
    assert wrapped["available_years"] == []


def test_sample_data_seeds_an_empty_workspace_once(client):
    result = client.post("/api/sample-data", headers=ALICE).json()
    assert result["seeded"] is True
    assert result["trips_added"] >= 5
    assert result["countries_added"] >= 8

    stats = client.get("/api/stats", headers=ALICE).json()
    assert stats["continents_visited"] == 6
    assert stats["total_trips"] == result["trips_added"]

    # Clicking it again doesn't duplicate anything.
    again = client.post("/api/sample-data", headers=ALICE).json()
    assert again["seeded"] is False
    assert client.get("/api/stats", headers=ALICE).json()["total_trips"] == result["trips_added"]

    # Bob's workspace is still empty.
    assert client.get("/api/trips", headers=BOB).json() == []


def test_clear_workspace(client):
    client.post("/api/sample-data", headers=ALICE)
    client.post("/api/sample-data", headers=BOB)

    assert client.delete("/api/workspace", headers=ALICE).status_code == 204
    assert client.get("/api/countries", headers=ALICE).json() == []
    assert client.get("/api/trips", headers=ALICE).json() == []
    # Only Alice's data was removed.
    assert len(client.get("/api/trips", headers=BOB).json()) > 0

    # The shared "default" (no header) and "demo" workspaces can't be cleared.
    assert client.delete("/api/workspace").status_code == 400
    assert client.delete("/api/workspace", headers={"X-Workspace-Id": "demo"}).status_code == 400


def test_old_database_is_upgraded(tmp_path, monkeypatch):
    """A database made by the old version (no workspace_id column, global
    unique index) should be upgraded without losing its rows."""
    import sqlite3

    db_file = str(tmp_path / "old.db")
    old = sqlite3.connect(db_file)
    old.execute(
        "CREATE TABLE countries (id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "name TEXT NOT NULL, visited_date TEXT, cities TEXT NOT NULL DEFAULT '')"
    )
    old.execute("CREATE UNIQUE INDEX countries_name_lower ON countries (LOWER(name))")
    old.execute("INSERT INTO countries (name, visited_date) VALUES ('Hawaii', '2025-12-12')")
    old.commit()
    old.close()

    monkeypatch.setattr(main, "DB_PATH", db_file)
    client = TestClient(main.app)

    # The old row is kept, in the "default" workspace (no header).
    rows = client.get("/api/countries").json()
    assert [r["name"] for r in rows] == ["Hawaii"]
    assert rows[0]["continent"] == "Unknown"
    # New workspaces don't see it, and can add their own countries.
    assert client.get("/api/countries", headers=ALICE).json() == []
    assert client.post("/api/countries", json={"name": "Japan"}, headers=ALICE).status_code == 201


def test_country_names_are_forgiving(client):
    cases = {
        "usa": "United States",
        "U.S.A.": "United States",
        "  the uk ": "United Kingdom",
        "England": "United Kingdom",
        "Korea": "South Korea",
        "Côte d'Ivoire": "Ivory Coast",
        "czech republic": "Czechia",
        "The Gambia": "Gambia",
        "guinea bissau": "Guinea-Bissau",
        "St Lucia": "Saint Lucia",
        "Bosnia & Herzegovina": "Bosnia and Herzegovina",
    }
    for typed, official in cases.items():
        assert main.find_country(typed) == official, typed

    added = client.post("/api/countries", json={"name": "usa"}, headers=ALICE).json()
    assert added["name"] == "United States"
    assert added["continent"] == "North America"

    trip = client.post("/api/trips", json=trip_body(countries=["england"]), headers=ALICE).json()
    assert trip["countries"] == ["United Kingdom"]

    # Still rejects things that aren't countries.
    assert client.post("/api/countries", json={"name": "Narnia"}, headers=ALICE).status_code == 400


def test_adding_a_country_also_adds_a_trip(client):
    added = client.post(
        "/api/countries",
        json={"name": "Kenya", "visited_date": "2025-08-01", "cities": "Nairobi", "notes": "Safari!"},
        headers=ALICE,
    ).json()
    trips = client.get("/api/trips", headers=ALICE).json()
    assert len(trips) == 1
    trip = trips[0]
    assert trip["title"] == "Trip to Kenya"
    assert trip["countries"] == ["Kenya"]
    assert trip["start_date"] == trip["end_date"] == "2025-08-01"
    assert trip["cities"] == ["Nairobi"]
    assert trip["notes"] == "Safari!"
    assert added["trips"][0]["id"] == trip["id"]

    # No date given: the trip is dated today.
    client.post("/api/countries", json={"name": "Ghana"}, headers=ALICE)
    ghana_trip = next(t for t in client.get("/api/trips", headers=ALICE).json() if t["countries"] == ["Ghana"])
    assert ghana_trip["start_date"] == main.date.today().isoformat()
    ghana = next(c for c in client.get("/api/countries", headers=ALICE).json() if c["name"] == "Ghana")
    assert ghana["visited_date"] == main.date.today().isoformat()


def test_deleting_a_trip_removes_countries_only_it_visited(client):
    first = client.post("/api/trips", json=trip_body(countries=["France", "Italy"]), headers=ALICE).json()
    client.post("/api/trips", json=trip_body(title="Rome again", countries=["Italy"]), headers=ALICE)

    assert client.delete(f"/api/trips/{first['id']}", headers=ALICE).status_code == 204
    names = [c["name"] for c in client.get("/api/countries", headers=ALICE).json()]
    assert names == ["Italy"]  # France was only on the deleted trip; Italy has another trip

    assert client.delete("/api/trips/9999", headers=ALICE).status_code == 404


def test_removing_a_country_updates_its_trips(client):
    client.post("/api/trips", json=trip_body(title="Euro", countries=["France", "Italy"]), headers=ALICE)
    client.post("/api/trips", json=trip_body(title="Paris", countries=["France"]), headers=ALICE)
    france = next(c for c in client.get("/api/countries", headers=ALICE).json() if c["name"] == "France")

    assert client.delete(f"/api/countries/{france['id']}", headers=ALICE).status_code == 204
    trips = client.get("/api/trips", headers=ALICE).json()
    assert [(t["title"], t["countries"]) for t in trips] == [("Euro", ["Italy"])]  # Paris trip gone

    # Other workspaces can't delete it.
    italy = client.get("/api/countries", headers=ALICE).json()[0]
    assert client.delete(f"/api/countries/{italy['id']}", headers=BOB).status_code == 404
