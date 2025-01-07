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
import PasscodeModal from "./PasscodeModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls modal visibility
  const [initialReportData, setInitialReportData] = useState(null); // Resets modal data
  const [isModalEdit, setIsModalEdit] = useState(false);
  const [reportToEdit, setReportToEdit] = useState(null);
  const markerRefs = useRef({}); // Reference to marker popups
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false); // Controls passcode modal visibility
  const [reportToDelete, setReportToDelete] = useState(null);
  const [initialPasscode, setInitialPasscode] = useState(null);

  const generateTimestamp = () => {
    const now = new Date();
    return {
      raw: now.toISOString(),
      display: now.toLocaleString(),
    };
  };

  const handleAddReport = () => {
    setInitialReportData({
      locationName: "",
      reporterName: "",
      reporterPhone: "",
      emergencyInfo: "",
      imageUrl: "",
      comments: "",
      coords: { lat: "", lng: "" },
    });
    setIsModalOpen(true); // Open modal
    setIsPasscodeModalOpen(false);
    setIsModalEdit(false);
  };

  const handleReportSubmit = (report) => {
    if (isModalEdit) {
      console.log("editting");
      const updatedReports = reports.slice();

      if (!reports) {
        return;
      }

      const idx = reportToEdit;
      updatedReports[idx] = {
        ...updatedReports[idx],
        ...report,
      };
      console.log(updatedReports[idx]);
      setReports(updatedReports);

      setReportToEdit(null);
    }
    else {
      setReports((prevReports) => [
        ...prevReports,
        {
          ...report,
          timestamp: generateTimestamp(),
          status: "OPEN",
        },
      ]);
    }
    setIsModalOpen(false); // Close the modal after submission
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
  
  const handleDeleteReport = (idx) => {
    setInitialPasscode({pass: ""});
    setIsPasscodeModalOpen(true);
    setReportToDelete(idx);
    setIsModalOpen(false);
  };
  
  const deleteReport = () => {
    const newReportList = reports.filter((report, idx) => idx !== reportToDelete)
    setReports(newReportList);
  }

  const handleEditReport = (idx, report) => {
    setInitialReportData({
      locationName: report.locationName,
      reporterName: report.reporterName,
      reporterPhone: report.reporterPhone,
      emergencyInfo: report.emergencyInfo,
      imageUrl: report.imageUrl,
      comments: report.comments,
      coords: { lat: report.coords[0], lng: report.coords[1]},
    });
    setReportToEdit(idx);
    setIsModalOpen(true);
    setIsPasscodeModalOpen(false);
    setIsModalEdit(true);
  }
  
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

        {/* <button
          onClick={() => setIsPasscodeModalOpen(true)}
          className="add-report-button"
        >
          test passcode
        </button> */}

        <ReportFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleReportSubmit}
          initialData={initialReportData}
          isEdit={isModalEdit}
        />

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
              <br />
              <button className="button-delete" onClick={() => handleDeleteReport(idx)}>DELETE</button>
              <button className="button-edit" onClick={() => handleEditReport(idx, report)}>EDIT</button>
            </li>
          ))}
        </ul>
        <PasscodeModal 
          isOpen = {isPasscodeModalOpen}
          onClose={() => {
            setIsPasscodeModalOpen(false);
            setReportToDelete(null);
          }}
          onVerified={() => deleteReport()}
          initData={initialPasscode}
        />
      </div>
    </div>
  );
};

export default MapComponent;
