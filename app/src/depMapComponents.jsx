import React, { useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReportFormModal from "./ReportFormModal";

// Fixing Leaflet's default icon paths for React
import markerIcon from "./locationPin.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

const MapComponent = () => {
  const [reports, setReports] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);
  const [sortBy, setSortBy] = useState("timestamp");
  const [highlightedReport, setHighlightedReport] = useState(null); // Tracks highlighted report
  const markerRefs = useRef({}); // Reference to marker popups

  const generateTimestamp = () => {
    const now = new Date();
    return {
      raw: now.toISOString(),
      display: now.toLocaleString(),
    };
  };

  const handleAddReport = () => {
    let locationName = "";
    while (!locationName) {
      locationName = prompt("Enter a name for this location:", "New Location");
      if (!locationName) alert("Location name is required.");
    }

    let reporterName = "";
    while (!reporterName) {
      reporterName = prompt("Enter the reporting person’s name:", "");
      if (!reporterName) alert("Reporter name is required.");
    }

    let reporterPhone = "";
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    while (!reporterPhone || !phoneRegex.test(reporterPhone)) {
      reporterPhone = prompt(
        "Enter the reporting person’s phone number (format: 123-456-7890):",
        ""
      );
      if (!reporterPhone || !phoneRegex.test(reporterPhone)) {
        alert("A valid phone number in the format 123-456-7890 is required.");
      }
    }

    let emergencyInfo = "";
    while (!emergencyInfo) {
      emergencyInfo = prompt(
        "Enter the nature of the emergency (e.g., fire, shooting, etc.):",
        "General"
      );
      if (!emergencyInfo) alert("Emergency information is required.");
    }

    const imageUrl =
      prompt("Enter an image URL for this location (optional):", "") || null;
    const comments =
      prompt("Enter additional comments or details (optional):", "") ||
      "No additional comments";

    const addCoordinates = confirm(
      "Do you want to add latitude and longitude for this report?"
    );
    let coords = null;

    if (addCoordinates) {
      const latInput = prompt("Enter latitude (e.g., 49.2827):", "");
      const lngInput = prompt("Enter longitude (e.g., -123.1207):", "");

      // Validate inputs
      const lat = parseFloat(latInput);
      const lng = parseFloat(lngInput);

      if (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        coords = [lat, lng];
      } else {
        alert(
          "Invalid coordinates entered. Coordinates must be valid numbers within latitude (-90 to 90) and longitude (-180 to 180) ranges. The report will be added without a pin."
        );
      }
    }

    setReports((prevReports) => [
      ...prevReports,
      {
        coords,
        locationName,
        imageUrl,
        reporterName,
        reporterPhone,
        emergencyInfo,
        comments,
        timestamp: generateTimestamp(),
        status: "OPEN",
      },
    ]);
  };

  const UpdateMapBounds = () => {
    const map = useMap();
    map.on("moveend", () => {
      const bounds = map.getBounds();
      if (bounds) {
        setMapBounds(bounds);
      }
    });
    return null;
  };

  const handleSort = (field) => {
    setSortBy(field);
    setReports((prevReports) => {
      const sortedReports = [...prevReports].sort((a, b) => {
        if (field === "timestamp") {
          return new Date(a.timestamp.raw) - new Date(b.timestamp.raw);
        }
        return a[field].localeCompare(b[field]);
      });
      return sortedReports;
    });
  };

  const isReportInBounds = (report) => {
    if (!mapBounds || !report.coords) return true;
    const [lat, lng] = report.coords;
    return mapBounds.contains([lat, lng]);
  };

  const handleListItemClick = (report, idx) => {
    if (report.coords) {
      setHighlightedReport(report.coords); // Highlight the clicked marker
      const map = useMap();
      map.flyTo(report.coords, 14); // Center the map on the marker

      // Open the popup
      const markerRef = markerRefs.current[idx];
      if (markerRef) {
        markerRef.openPopup();
      }
    } else {
      alert("This report does not have associated coordinates.");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* Map */}
      <div style={{ flex: 3 }}>
        <MapContainer
          center={[49.2827, -123.1207]} // Vancouver's coordinates
          zoom={10}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <UpdateMapBounds />
          {reports
            .filter((report) => report.coords)
            .map((report, idx) => (
              <Marker
                key={idx}
                position={report.coords}
                icon={
                  highlightedReport &&
                  report.coords[0] === highlightedReport[0] &&
                  report.coords[1] === highlightedReport[1]
                    ? new L.Icon({
                        iconUrl: markerIcon,
                        iconSize: [60, 60], // Slightly larger icon for highlight
                        iconAnchor: [30, 60],
                        popupAnchor: [0, -60],
                      })
                    : customIcon
                }
                ref={(ref) => (markerRefs.current[idx] = ref)} // Store marker ref
              >
                <Popup>
                  <b>{report.locationName}</b>
                  <br />
                  Lat: {report.coords[0].toFixed(5)}, Lng:{" "}
                  {report.coords[1].toFixed(5)}
                  <br />
                  <b>Reporting Person:</b> {report.reporterName}
                  <br />
                  <b>Phone:</b> {report.reporterPhone}
                  <br />
                  <b>Emergency:</b> {report.emergencyInfo}
                  <br />
                  <b>Time/Date:</b> {report.timestamp.display}
                  <br />
                  <b>Status:</b> {report.status}
                  <br />
                  <b>Comments:</b> {report.comments}
                  <br />
                  {report.imageUrl && (
                    <img
                      src={report.imageUrl}
                      alt="Location"
                      style={{
                        width: "200px",
                        height: "auto",
                        marginTop: "10px",
                      }}
                    />
                  )}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Emergency List */}
      <div
        id="emergency-list"
        style={{ flex: 1, padding: "10px", overflowY: "auto" }}
      >
        <h3>Emergency List</h3>

        <button onClick={handleAddReport} className="add-report-button">
          Add Report
        </button>

        <br />
        <div className="sort-buttons">
          <button onClick={() => handleSort("timestamp")}>Sort by Time</button>
          <button onClick={() => handleSort("locationName")}>
            Sort by Location
          </button>
          <button onClick={() => handleSort("emergencyInfo")}>
            Sort by Emergency Type
          </button>
        </div>
        <ul>
          {reports.filter(isReportInBounds).map((report, idx) => (
            <li
              key={idx}
              onClick={() => handleListItemClick(report, idx)}
              style={{
                cursor: "pointer",
                padding: "5px",
                borderRadius: "5px",
                background:
                  highlightedReport &&
                  report.coords &&
                  report.coords[0] === highlightedReport[0] &&
                  report.coords[1] === highlightedReport[1]
                    ? "#f0f8ff" // Light highlight color for selected item
                    : "transparent",
              }}
            >
              <b>{report.locationName}</b>
              <br />
              <b>Emergency:</b> {report.emergencyInfo}
              <br />
              <b>Time/Date:</b> {report.timestamp.display}
              <br />
              <b>Status:</b> {report.status}
              {!report.coords && <p>(No coordinates provided)</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
