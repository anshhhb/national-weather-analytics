import React, { useEffect, useMemo, useState } from "react";
import {
  getWeatherReports,
  getEventTypes,
  getTrustLevels,
} from "../api/weatherApi";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./WeatherDashboard.css";


export default function WeatherDashboard() {
  const [reports, setReports] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [trustLevels, setTrustLevels] = useState([]);

  const [eventFilter, setEventFilter] = useState("All");
  const [trustFilter, setTrustFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    Promise.all([
      getWeatherReports(),
      getEventTypes(),
      getTrustLevels(),
    ])
      .then(([reportsResult, eventResult, trustResult]) => {
        setReports(reportsResult.data || []);
        setEventTypes(eventResult.data || []);
        setTrustLevels(trustResult.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);


  const states = useMemo(() => {
    return Array.from(
      new Set(
        reports
          .map((report) => report.state)
          .filter(Boolean)
      )
    ).sort();
  }, [reports]);


  const observationTypes = useMemo(() => {
    return Array.from(
      new Set(
        reports
          .map((report) => report.observation_type)
          .filter(Boolean)
      )
    ).sort();
  }, [reports]);


  const filtered = useMemo(() => {
    return reports.filter((report) => {
      if (
        eventFilter !== "All" &&
        report.observation_type !== eventFilter
      ) {
        return false;
      }

      if (
        trustFilter !== "All" &&
        report.trust_score !== trustFilter
      ) {
        return false;
      }

      if (
        stateFilter !== "All" &&
        report.state !== stateFilter
      ) {
        return false;
      }

      return true;
    });
  }, [reports, eventFilter, trustFilter, stateFilter]);


  const totalReports = filtered.length;

  const verifiedCount = filtered.filter(
    (report) => report.trust_score === "Verified"
  ).length;

  const flaggedCount = filtered.filter(
    (report) => report.trust_score !== "Verified"
  ).length;


  const byDate = useMemo(() => {
    const counts = {};

    filtered.forEach((report) => {
      const date = report.timestamp?.slice(0, 10);

      if (!date) return;

      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count,
      }));
  }, [filtered]);


  const byObservationType = useMemo(() => {
    const counts = {};

    filtered.forEach((report) => {
      const type = report.observation_type;

      if (!type) return;

      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);


  if (loading) {
    return (
      <div className="wd-root">
        <h1>National Weather Analytics Dashboard</h1>
        <p>Loading real IMD observations...</p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="wd-root">
        <h1>National Weather Analytics Dashboard</h1>
        <p>Unable to load weather data.</p>
        <p>{error}</p>
      </div>
    );
  }


  return (
    <div className="wd-root">

      <header className="wd-header">
        <h1>National Weather Analytics Dashboard</h1>
        <p>
          Real-time weather observations from the
          India Meteorological Department.
        </p>
      </header>


      <div className="wd-filters">

        <label>
          Observation type
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option>All</option>

            {observationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>


        <label>
          Verification
          <select
            value={trustFilter}
            onChange={(e) => setTrustFilter(e.target.value)}
          >
            <option>All</option>

            {trustLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}

            {!trustLevels.includes("Unknown") && (
              <option value="Unknown">
                Unknown
              </option>
            )}
          </select>
        </label>


        <label>
          State
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option>All</option>

            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>

      </div>


      <div className="wd-summary">

        <div className="wd-metric">
          <span className="wd-metric-label">
            IMD observations
          </span>

          <span className="wd-metric-value">
            {totalReports}
          </span>
        </div>


        <div className="wd-metric">
          <span className="wd-metric-label">
            Verified
          </span>

          <span className="wd-metric-value wd-success">
            {verifiedCount}
          </span>
        </div>


        <div className="wd-metric">
          <span className="wd-metric-label">
            Unverified / unknown
          </span>

          <span className="wd-metric-value wd-danger">
            {flaggedCount}
          </span>
        </div>

      </div>


      <div className="wd-main-grid">

        <div className="wd-card wd-map-card">

          <h2>IMD Observation Locations</h2>

          <MapContainer
            center={[22.5, 80]}
            zoom={4.3}
            scrollWheelZoom={false}
            style={{
              height: 320,
              width: "100%",
              borderRadius: 8,
            }}
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {filtered
              .filter(
                (report) =>
                  report.latitude !== null &&
                  report.longitude !== null
              )
              .map((report) => (

                <CircleMarker
                  key={report.id}
                  center={[
                    report.latitude,
                    report.longitude,
                  ]}
                  radius={6}
                >

                  <Popup>

                    <strong>
                      {report.observation_type || "Observation"}
                    </strong>

                    <br />

                    Value:{" "}
                    {report.value ?? "N/A"}{" "}
                    {report.unit || ""}

                    <br />

                    Station:{" "}
                    {report.station_id || "N/A"}

                    <br />

                    Time:{" "}
                    {report.timestamp || "N/A"}

                  </Popup>

                </CircleMarker>

              ))}
          </MapContainer>

        </div>


        <div className="wd-side-charts">

          <div className="wd-card">

            <h2>Observation Types</h2>

            <ResponsiveContainer
              width="100%"
              height={220}
            >

              <BarChart
                data={byObservationType.slice(0, 10)}
                layout="vertical"
                margin={{ left: 10 }}
              >

                <XAxis type="number" />

                <YAxis
                  type="category"
                  dataKey="type"
                  width={130}
                  tick={{ fontSize: 10 }}
                />

                <Tooltip />

                <Bar dataKey="count" />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      <div className="wd-card">

        <h2>Observations Over Time</h2>

        <ResponsiveContainer
          width="100%"
          height={200}
        >

          <LineChart data={byDate}>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="count"
              stroke="#378ADD"
              strokeWidth={2}
              dot={{ r: 3 }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>


      <div className="wd-card">

        <h2>Real IMD Observations</h2>

        <div className="wd-table-wrap">

          <table className="wd-table">

            <thead>

              <tr>
                <th>Time</th>
                <th>Observation</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Station</th>
                <th>Latitude</th>
                <th>Longitude</th>
              </tr>

            </thead>


            <tbody>

              {filtered.map((report) => (

                <tr key={report.id}>

                  <td>
                    {report.timestamp || "—"}
                  </td>

                  <td>
                    {report.observation_type || "—"}
                  </td>

                  <td>
                    {report.value ?? "—"}
                  </td>

                  <td>
                    {report.unit || "—"}
                  </td>

                  <td>
                    {report.station_id || "—"}
                  </td>

                  <td>
                    {report.latitude ?? "—"}
                  </td>

                  <td>
                    {report.longitude ?? "—"}
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