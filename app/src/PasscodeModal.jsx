import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js'; 

const PasscodeModal = ({isOpen, onClose, onVerified, initData}) => {
  const [storedHash, setStoredHash] = useState('');
  const [inputPasscode, setInputPasscode] = useState('');
  const [isVerified, setIsVerified] = useState(null);
  const [closeBtnText, setCloseBtnText] = useState("Cancel");
  
  useEffect(() => {
    if (initData) {
      console.log("reset modal called");
      setInputPasscode(initData?.passcode || "");
      setIsVerified(null);
      setCloseBtnText("Cancel");
    }
  }, [isOpen, initData]);

  // Hashes a passcode using MD5
  const hashPasscode = (passcode) => {
    return CryptoJS.MD5(passcode).toString();
  };

  // Stores the hashed passcode
  const storePasscode = (passcode) => {
    const hash = hashPasscode(passcode);
    setStoredHash(hash); // Simulates storage
    // alert('Passcode stored securely.');
  };

  // Verifies if the provided passcode matches the stored hash
  const verifyPasscode = (providedPasscode) => {
    const hash = hashPasscode(providedPasscode);
    setIsVerified(hash === "15472cd29f632e34f039403f2e635f66"); // hash for 'passcode'
    if (hash === "15472cd29f632e34f039403f2e635f66") {
      setCloseBtnText("Close");
      onVerified();
    }
  };
  
  const closeModal = () => {
    onClose();
    setIsVerified(null);
    setCloseBtnText("Cancel");
    setInputPasscode("");
  }
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal passcode-modal">
        <h2>Verify Passcode</h2>
      <div className="modal-content">
        {!isVerified && <div>
          <label>Passcode: </label>
          <input
            type="password"
            value={inputPasscode}
            // placeholder="Enter passcode"
            onChange={(e) => setInputPasscode(e.target.value)}
          />
        </div>}
        <div className="modal-verify">
          {isVerified !== null && (
            <div>
              {isVerified ? (
                <p style={{ color: 'green' }}>Access granted: passcode matches!</p>
              ) : (
                <p style={{ color: 'red' }}>Access denied: incorrect passcode.</p>
              )}
            </div>
          )}
        </div>
        {!isVerified && <button onClick={() => verifyPasscode(inputPasscode)}>
          Verify Passcode
        </button>}
        <button onClick={() => closeModal()}>
          {closeBtnText}
        </button>
      </div>
    </div>
  );
};

export default PasscodeModal;
