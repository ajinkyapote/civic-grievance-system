import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";

const createColoredIcon = (color) =>
  new L.DivIcon({
    className: "custom-pin",
    html: `<div style="background-color:${color};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const statusColors = {
  OPEN: "#dc2626",
  REOPENED: "#dc2626",
  ASSIGNED: "#d97706",
  IN_PROGRESS: "#2563eb",
  RESOLVED: "#059669",
  CLOSED: "#059669",
};

function LocationClickHandler({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      if (onSelectLocation) {
        onSelectLocation({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        });
      }
    },
  });
  return null;
}

export default function IssueMap({
  selectedLocation = { lat: 19.0178, lng: 73.0991 },
  onSelectLocation = null,
  issues = [],
  onSelectIssue = null,
  height = "430px",
}) {
  const [showHotspots, setShowHotspots] = useState(true);
  const center = [selectedLocation.lat, selectedLocation.lng];

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowHotspots(!showHotspots)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
            showHotspots
              ? "bg-red-50 border-red-300 text-red-800"
              : "bg-white border-slate-300 text-slate-600"
          }`}
        >
          {showHotspots ? "Spatial Hotspot Zones: ON" : "Spatial Hotspot Zones: OFF"}
        </button>
      </div>

      <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <MapContainer center={center} zoom={15} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationClickHandler onSelectLocation={onSelectLocation} />

          {onSelectLocation && (
            <>
              <Marker position={center} icon={createColoredIcon("#1d4ed8")}>
                <Popup>
                  <div className="text-xs">
                    <strong>Selected Grievance Pin</strong>
                    <br />
                    {selectedLocation.lat}, {selectedLocation.lng}
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={center}
                radius={50}
                pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.15 }}
              />
            </>
          )}

          {/* Spatial Density Hotspot Rings for High-Volume Clusters */}
          {showHotspots &&
            issues
              .filter((i) => i.duplicateCount >= 2 && i.status !== "CLOSED" && i.status !== "RESOLVED")
              .map((issue) => (
                <Circle
                  key={`hotspot-${issue.id}`}
                  center={[issue.latitude, issue.longitude]}
                  radius={Math.min(180, 55 + issue.duplicateCount * 20)}
                  pathOptions={{
                    color: "#dc2626",
                    fillColor: "#ef4444",
                    fillOpacity: 0.18,
                    weight: 1,
                  }}
                />
              ))}

          {issues.map((issue) => (
            <Marker
              key={issue.id}
              position={[issue.latitude, issue.longitude]}
              icon={createColoredIcon(statusColors[issue.status] || "#475569")}
            >
              <Popup>
                <div className="text-xs space-y-1.5 min-w-[210px]">
                  <div className="font-mono font-bold text-blue-700">{issue.ticketCode}</div>
                  {issue.ward && (
                    <div className="text-[11px] font-semibold text-indigo-700">
                      {issue.ward.wardCode} • {issue.ward.wardName}
                    </div>
                  )}
                  <div className="font-bold text-slate-900">{issue.title}</div>
                  <div className="text-slate-600 line-clamp-2">{issue.description}</div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded font-semibold">{issue.category}</span>
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                      {issue.duplicateCount} Reports
                    </span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                      {issue.status}
                    </span>
                  </div>
                  {onSelectIssue && (
                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="mt-1.5 w-full bg-slate-900 text-white py-1 rounded text-[11px] font-semibold hover:bg-slate-800"
                    >
                      Inspect Audit Trail & Proof
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
