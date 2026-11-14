import { useState } from "react";
import "./App.css";

type Weather = {
  name: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  code: number
}

function describe(code: number) {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly cloudy'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Unknown'
}

export default function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function searchCity() {
    if (city.trim() === '') return
    setLoading(true)
    setError('')
    setWeather(null)
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1`
      );
      if (!geoRes.ok) throw new Error('Geocoding request failed')
      const geo = await geoRes.json()
      if (!geo.results) {
        setError('City not found')
        return
      }
      const place = geo.results[0]

      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m`
      )
      if (!wRes.ok) throw new Error('Weather request failed')
      const w = await wRes.json()
      setWeather({
        name: place.name,
        country: place.country,
        temperature: w.current.temperature_2m,
        feelsLike: w.current.apparent_temperature,
        humidity: w.current.relative_humidity_2m,
        wind: w.current.wind_speed_10m,
        code: w.current.weather_code,
      })
    } catch {
      setError('Could not load weather. Check your internet.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="app">
      <h1>Weather App</h1>

      <form className="search-form"
        onSubmit={(e) => { e.preventDefault(); searchCity() }}>
        <input value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter a city"
          aria-label="City" />
        <button className="btn btn-primary" disabled={loading}>Search</button>
      </form>

      <div aria-live="polite">
        {loading && <p className="status">Loading...</p>}
        {error && (
          <div className="alert alert-danger" role="alert">{error}</div>
        )}
        {weather && (
          <section className="result"><h2>{weather.name}, {weather.country}</h2>
            <p className="temp">{Math.round(weather.temperature)}°C</p>
            <p className="condition">{describe(weather.code)}</p>
            <dl className="details">
              <div>
                <dt>Feels Like</dt>
                <dd>{Math.round(weather.feelsLike)}°C</dd>
              </div>
              <div>
                <dt>Humidity</dt>
                <dd>{Math.round(weather.humidity)}%</dd>
              </div>
              <div>
                <dt>Wind</dt>
                <dd>{weather.wind} km/h</dd>
              </div>
            </dl>
          </section>
        )}
      </div>

    </main>
  )
}