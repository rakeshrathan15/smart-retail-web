import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

export interface LatLng {
  lat: number
  lng: number
}

/** Hyderabad, used until the shop owner sets a location. */
const DEFAULT_CENTER: LatLng = { lat: 17.385, lng: 78.4867 }

// A CSS pin instead of Leaflet's image icon, which needs extra bundler setup.
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#dc2626;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

/**
 * OpenStreetMap with a pin for the shop. Tap or click the map, or drag the pin, to move it;
 * "Use my current location" asks the browser for the position.
 */
export function LocationPicker({ value, onChange }: { value: LatLng | null; onChange: (value: LatLng) => void }) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flyTo, setFlyTo] = useState<LatLng | null>(null)

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('This browser cannot share your location. Tap the map instead.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude }
        setLocating(false)
        setFlyTo(point)
        onChange(point)
      },
      () => {
        setLocating(false)
        setError('Could not get your location. Allow location access, or tap your shop on the map.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <div className="space-y-2">
      {/* `isolate` keeps Leaflet's high z-index layers inside this box, below the sticky site header. */}
      <div className="isolate h-72 overflow-hidden rounded-lg ring-1 ring-slate-300">
        <MapContainer center={value ?? DEFAULT_CENTER} zoom={value ? 17 : 12} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ClickToPlace onPick={onChange} />
          <FlyTo point={flyTo} />
          {value && <DraggablePin value={value} onChange={onChange} />}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-md bg-white px-3 py-1.5 font-medium text-brand ring-1 ring-brand hover:bg-brand-light disabled:opacity-50"
        >
          {locating ? 'Finding you…' : '📍 Use my current location'}
        </button>
        <span className="text-slate-500">
          {value ? `Pin at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Tap your shop on the map to place the pin'}
        </span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function ClickToPlace({ onPick }: { onPick: (value: LatLng) => void }) {
  useMapEvents({ click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }) })
  return null
}

function FlyTo({ point }: { point: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (point) map.flyTo(point, 17)
  }, [map, point])
  return null
}

function DraggablePin({ value, onChange }: { value: LatLng; onChange: (value: LatLng) => void }) {
  const handlers = useMemo(
    () => ({
      dragend: (event: L.DragEndEvent) => {
        const { lat, lng } = (event.target as L.Marker).getLatLng()
        onChange({ lat, lng })
      },
    }),
    [onChange],
  )
  return <Marker position={value} draggable icon={pinIcon} eventHandlers={handlers} />
}
