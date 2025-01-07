import React, { useState, useEffect } from "react";

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } else {
      throw new Error("No results found for the given address.");
    }
  } catch (error) {
    console.error("Error fetching geocoding data:", error);
    return null;
  }
}

const ReportFormModal = ({ isOpen, onClose, onSubmit, initialData, isEdit }) => {
  const [locationName, setLocationName] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [emergencyInfo, setEmergencyInfo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [comments, setComments] = useState("");
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [header, setHeader] = useState("Report an Emergency");
  const [submitBtnText, setSubmitBtnText] = useState("Submit");

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setLocationName(initialData?.locationName || "");
      setReporterName(initialData?.reporterName || "");
      setReporterPhone(initialData?.reporterPhone || "");
      setEmergencyInfo(initialData?.emergencyInfo || "");
      setImageUrl(initialData?.imageUrl || "");
      setComments(initialData?.comments || "");
      setCoords(initialData?.coords || { lat: "", lng: "" });
      setErrors({});
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isEdit) {
      setHeader("Edit Emergency");
      setSubmitBtnText("Confirm Changes");
    }
    else {
      setHeader("Report an Emergency");
      setSubmitBtnText("Submit");
    }
  }, [isEdit]);

  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

  const validateFields = () => {
    const newErrors = {};

    if (!locationName.trim())
      newErrors.locationName = "Location Name is required.";
    if (!reporterName.trim())
      newErrors.reporterName = "Reporter Name is required.";
    if (!reporterPhone.trim() || !phoneRegex.test(reporterPhone))
      newErrors.reporterPhone =
        "Reporter Phone is required and must follow the format 123-456-7890.";
    if (!emergencyInfo.trim())
      newErrors.emergencyInfo = "Emergency Info is required.";

    // Validate coordinates
    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);

    if (coords.lat && (isNaN(lat) || lat < -90 || lat > 90)) {
      newErrors.lat = "Latitude must be a number between -90 and 90.";
    }

    if (coords.lng && (isNaN(lng) || lng < -180 || lng > 180)) {
      newErrors.lng = "Longitude must be a number between -180 and 180.";
    }

    if ((coords.lat && !coords.lng) || (!coords.lat && coords.lng)) {
      if (!coords.lat)
        newErrors.lat = "Latitude is required if Longitude is filled.";
      if (!coords.lng)
        newErrors.lng = "Longitude is required if Latitude is filled.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);
    let finalCoords = null;

    // Uses manual coords if they're provided
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      finalCoords = { lat, lng };
    } else {
        // Geocode the location name if coords haven't been provided
        finalCoords = await geocodeAddress(locationName);
    }

    onSubmit({
      locationName,
      reporterName,
      reporterPhone,
      emergencyInfo,
      imageUrl: imageUrl || null,
      comments: comments || "No additional comments",
      coords: finalCoords ? [finalCoords.lat, finalCoords.lng] : null,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal create-report-modal">
      <div className="modal-content">
        <h2>{header}</h2>
        <div>
          <label>Location Name:*</label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
          <small className="error">{errors.locationName || " "}</small>
        </div>
        <div>
          <label>Reporter Name:*</label>
          <input
            type="text"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
          />
          <small className="error">{errors.reporterName || " "}</small>
        </div>
        <div>
          <label>Reporter Phone (format: 123-456-7890):*</label>
          <input
            type="text"
            value={reporterPhone}
            onChange={(e) => setReporterPhone(e.target.value)}
          />
          <small className="error">{errors.reporterPhone || " "}</small>
        </div>
        <div>
          <label>Emergency Info (ie. fire, assault, robbery, etc):*</label>
          <textarea
            value={emergencyInfo}
            onChange={(e) => setEmergencyInfo(e.target.value)}
          />
          <small className="error">{errors.emergencyInfo || " "}</small>
        </div>
        <div>
          <label>Image URL:</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div>
          <label>Additional Comments (ie. context, situation details):</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>
        <div>
          <label>Latitude:</label>
          <input
            type="text"
            value={coords.lat}
            onChange={(e) =>
              setCoords((prevCoords) => ({
                ...prevCoords,
                lat: e.target.value,
              }))
            }
          />
          <small className="error">{errors.lat || " "}</small>
        </div>
        <div>
          <label>Longitude:</label>
          <input
            type="text"
            value={coords.lng}
            onChange={(e) =>
              setCoords((prevCoords) => ({
                ...prevCoords,
                lng: e.target.value,
              }))
            }
          />
          <small className="error">{errors.lng || " "}</small>
        </div>

        <button onClick={handleSubmit}>{submitBtnText}</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default ReportFormModal;
