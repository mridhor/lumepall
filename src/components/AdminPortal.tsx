import React, { useState, useEffect } from 'react';

interface AdminPortalProps {
  currentPrice: number;
  onPriceUpdate: (price: number) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentPrice, onPriceUpdate }) => {
  const [priceInput, setPriceInput] = useState(currentPrice);
  const [baseFundValue, setBaseFundValue] = useState(500000);
  const [silverTroyOunces, setSilverTroyOunces] = useState(5000);
  const [message, setMessage] = useState("");
  const [fundMessage, setFundMessage] = useState("");

  // Fetch current fund parameters on mount
  useEffect(() => {
    const fetchFundParams = async () => {
      try {
        const response = await fetch('/api/fund-params');
        const data = await response.json();
        if (data.success) {
          setBaseFundValue(data.base_fund_value);
          setSilverTroyOunces(data.silver_troy_ounces);
        }
      } catch (error) {
        console.error('Failed to fetch fund parameters:', error);
      }
    };
    fetchFundParams();
  }, []);

  const handlePriceUpdate = () => {
    if (!isNaN(priceInput) && priceInput > 0) {
      onPriceUpdate(priceInput);
      setMessage("Snobol price updated.");
    } else {
      setMessage("Please enter a valid number.");
    }
  };

  const handleFundParamsUpdate = async () => {
    if (!isNaN(baseFundValue) && baseFundValue >= 0 && !isNaN(silverTroyOunces) && silverTroyOunces >= 0) {
      try {
        const response = await fetch('/api/fund-params', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base_fund_value: baseFundValue,
            silver_troy_ounces: silverTroyOunces,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setFundMessage("Fund parameters updated successfully!");
        } else {
          setFundMessage("Error updating fund parameters.");
        }
      } catch (error) {
        console.error('Error updating fund parameters:', error);
        setFundMessage("Error updating fund parameters.");
      }
    } else {
      setFundMessage("Please enter valid numbers.");
    }
  };

  return (
    <div style={{ padding: "1.5rem", border: "1px solid gray", borderRadius: "8px", maxWidth: "600px" }}>
      <h2 style={{ marginBottom: "1rem" }}>🛠 Admin Panel</h2>

      {/* Share Price Section */}
      <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #ddd" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Share Price</h3>
        <p>📈 Live Share Price: <strong>{currentPrice.toFixed(4)} EUR</strong></p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem" }}>
          <label>
            Edit Base Price:
            <input
              type="number"
              step="0.0001"
              value={priceInput}
              onChange={(e) => setPriceInput(parseFloat(e.target.value))}
              style={{ marginLeft: "0.5rem", padding: "0.5rem", width: "120px" }}
            />
          </label>
          <button onClick={handlePriceUpdate} style={{ padding: "0.5rem 1rem" }}>
            Update Price
          </button>
        </div>
        {message && <p style={{ marginTop: "0.5rem", color: "green", fontSize: "0.9rem" }}>{message}</p>}
      </div>

      {/* Fund Parameters Section */}
      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>Fund Parameters</h3>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
          Set the base fund value and silver holdings. Total fund value will fluctuate based on silver spot price.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ display: "flex", flexDirection: "column" }}>
            Base Fund Value (EUR):
            <input
              type="number"
              step="1000"
              value={baseFundValue}
              onChange={(e) => setBaseFundValue(parseFloat(e.target.value))}
              style={{ marginTop: "0.25rem", padding: "0.5rem", width: "200px" }}
            />
            <span style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
              Non-silver portion of the fund
            </span>
          </label>

          <label style={{ display: "flex", flexDirection: "column" }}>
            Silver Holdings (Troy Ounces):
            <input
              type="number"
              step="100"
              value={silverTroyOunces}
              onChange={(e) => setSilverTroyOunces(parseFloat(e.target.value))}
              style={{ marginTop: "0.25rem", padding: "0.5rem", width: "200px" }}
            />
            <span style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
              Physical silver held in Troy ounces
            </span>
          </label>

          <button
            onClick={handleFundParamsUpdate}
            style={{ padding: "0.5rem 1rem", marginTop: "0.5rem", width: "fit-content" }}
          >
            Update Fund Parameters
          </button>
        </div>

        {fundMessage && <p style={{ marginTop: "0.5rem", color: "green", fontSize: "0.9rem" }}>{fundMessage}</p>}
      </div>
    </div>
  );
};