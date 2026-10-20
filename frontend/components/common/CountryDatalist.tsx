import { WORLD_COUNTRIES } from "@/lib/worldCountries";

// A <datalist> gives an <input list="..."> a built-in, searchable dropdown of
// suggestions. As you type "jap", the browser suggests "Japan".
export default function CountryDatalist({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {WORLD_COUNTRIES.map((country) => (
        <option key={country.name} value={country.name}>
          {country.continent}
        </option>
      ))}
    </datalist>
  );
}
