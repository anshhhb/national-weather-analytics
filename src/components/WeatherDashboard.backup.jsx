import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { weatherReports, eventTypes, trustLevels } from "../data/mockData";
import "./WeatherDashboard.css";

// Color per event type — keep this map in sync everywhere a chart or map
// pin needs to color by event_type, so the legend stays consistent app-wide.
const EVENT_COLORS = {
  Rainfall: "#378ADD",
  Thunderstorm: "#534AB7",
  Flooding: "#0C447C",
  Heatwave: "#D85A30",
  Fog: "#888780",
  "Dust Storm": "#BA7517",
  "Strong Wind": "#0F6E56",
};

const TRUST_COLORS = {
  Verified: "#3B6D11",
  "Needs Review": "#854F0B",
  "Likely Fake": "#A32D2D",
};

export default function WeatherDashboard() {
  const [eventFilter, setEventFilter] = useState("All");
  const [trustFilter, setTrustFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");

  const states = useMemo(
    () => Array.from(new Set(weatherReports.filter(r => r.location).map(r => r.location.state))).sort(),
    []
  );

  const filtered = useMemo(() => {
    return weatherReports.filter(r => {
      if (eventFilter !== "All" && r.event_type !== eventFilter) return false;
      if (trustFilter !== "All" && r.trust_score !== trustFilter) return false;
      if (stateFilter !== "All" && (!r.location || r.location.state !== stateFilter)) return false;
      return true;
    });
  }, [eventFilter, trustFilter, stateFilter]);

  const totalReports = filtered.length;
  const verifiedCount = filtered.filter(r => r.trust_score === "Verified").length;
  const flaggedCount = filtered.filter(r => r.trust_score !== "Verified").length;

  // Chart 1 — reports per day
  const byDate = useMemo(() => {
    const counts = {};
    filtered.forEach(r => { counts[r.date] = (counts[r.date] || 0) + 1; });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [filtered]);

  // Chart 2 — event type breakdown
  const byEventType = useMemo(() => {
    const counts = {};
    filtered.forEach(r => { counts[r.event_type] = (counts[r.event_type] || 0) + 1; });
    return eventTypes.map(type => ({ type, count: counts[type] || 0 })).filter(d => d.count > 0);
  }, [filtered]);

  // Chart 3 — trust score split
  const byTrust = useMemo(() => {
    const counts = {};
    filtered.forEach(r => { counts[r.trust_score] = (counts[r.trust_score] || 0) + 1; });
    return trustLevels.map(level => ({ name: level, value: counts[level] || 0 })).filter(d => d.value > 0);
  }, [filtered]);

  return (
    <div className="wd-root">
      <header className="wd-header">
        <h1>National Weather Reports Dashboard</h1>
        <p>Live citizen weather reports, verified and categorized in real time.</p>
      </header>

      <div className="wd-filters">
        <label>
          Event type
          <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
            <option>All</option>
            {eventTypes.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Verification
          <select value={trustFilter} onChange={e => setTrustFilter(e.target.value)}>
            <option>All</option>
            {trustLevels.map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>
          State
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option>All</option>
            {states.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="wd-summary">
        <div className="wd-metric">
          <span className="wd-metric-label">Total reports</span>
          <span className="wd-metric-value">{totalReports}</span>
        </div>
        <div className="wd-metric">
          <span className="wd-metric-label">Verified</span>
          <span className="wd-metric-value wd-success">{verifiedCount}</span>
        </div>
        <div className="wd-metric">
          <span className="wd-metric-label">Needs review / flagged</span>
          <span className="wd-metric-value wd-danger">{flaggedCount}</span>
        </div>
      </div>

      <div className="wd-main-grid">
        <div className="wd-card wd-map-card">
          <h2>Geographic map view</h2>
          <MapContainer center={[22.5, 80]} zoom={4.3} scrollWheelZoom={false} style={{ height: 320, width: "100%", borderRadius: 8 }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.filter(r => r.location).map(r => (
              <CircleMarker
                key={r.id}
                center={[r.location.lat, r.location.lng]}
                radius={8}
                pathOptions={{ color: EVENT_COLORS[r.event_type] || "#888", fillOpacity: 0.8 }}
              >
                <Popup>
                  <strong>{r.event_type}</strong> — {r.location.state}<br />
                  {r.text}<br />
                  <em>{r.trust_score}</em>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="wd-side-charts">
          <div className="wd-card">
            <h2>Event type breakdown</h2>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={byEventType} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="type" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {byEventType.map(d => <Cell key={d.type} fill={EVENT_COLORS[d.type] || "#888"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="wd-card">
            <h2>Trust score split</h2>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={byTrust} dataKey="value" nameKey="name" innerRadius={30} outerRadius={55}>
                  {byTrust.map(d => <Cell key={d.name} fill={TRUST_COLORS[d.name]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="wd-card">
        <h2>Reports over time</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={byDate}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#378ADD" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="wd-card">
        <h2>Admin panel — all reports</h2>
        <div className="wd-table-wrap">
          <table className="wd-table">
            <thead>
              <tr>
                <th>Date</th><th>Text</th><th>State</th><th>Event</th><th>Trust</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td className="wd-text-cell">{r.text}</td>
                  <td>{r.location ? r.location.state : "—"}</td>
                  <td>{r.event_type}</td>
                  <td><span className={`wd-badge wd-badge-${r.trust_score.replace(/\s/g, "")}`}>{r.trust_score}</span></td>
                  <td className="wd-actions">
                    <button className="wd-btn">Approve</button>
                    <button className="wd-btn wd-btn-ghost">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
