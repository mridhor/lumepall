import React, { useState, useEffect } from 'react';

interface AdminPortalProps {
  currentPrice: number;
  onPriceUpdate: (price: number) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentPrice, onPriceUpdate }) => {
  const [priceInput, setPriceInput] = useState(currentPrice);
  const [baseFundValue, setBaseFundValue] = useState(500000);
  const [silverTroyOunces, setSilverTroyOunces] = useState(5000);
  const [silverPriceUSD, setSilverPriceUSD] = useState(31.25);
  const [baseSharePrice, setBaseSharePrice] = useState(1.80);
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
          setSilverPriceUSD(data.silver_price_usd || 31.25);
          setBaseSharePrice(data.base_share_price || 1.80);
          setPriceInput(data.base_share_price || 1.80);
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
    if (!isNaN(baseFundValue) && baseFundValue >= 0 &&
        !isNaN(silverTroyOunces) && silverTroyOunces >= 0 &&
        !isNaN(silverPriceUSD) && silverPriceUSD > 0 &&
        !isNaN(baseSharePrice) && baseSharePrice > 0) {
      try {
        const response = await fetch('/api/fund-params', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base_fund_value: baseFundValue,
            silver_troy_ounces: silverTroyOunces,
            silver_price_usd: silverPriceUSD,
            base_share_price: baseSharePrice,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setFundMessage("Fund parameters updated successfully!");
          // Also update the legacy price input
          setPriceInput(baseSharePrice);
          onPriceUpdate(baseSharePrice);
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

      {/* Share Price Section - Moved to Fund Parameters */}
      <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #ddd" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Share Price (Live with Fluctuation)</h3>
        <p>📈 Current Price: <strong>{currentPrice.toFixed(4)} EUR</strong></p>
        <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
          This price fluctuates ±€0.01 to ±€0.05 around your base price every second
        </p>
      </div>

      {/* Fund Parameters Section */}
      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>Fund Parameters</h3>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
          Set all fund parameters including base share price, fund value, and silver holdings.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ display: "flex", flexDirection: "column" }}>
            Base Share Price (EUR):
            <input
              type="number"
              step="0.01"
              value={baseSharePrice}
              onChange={(e) => setBaseSharePrice(parseFloat(e.target.value))}
              style={{ marginTop: "0.25rem", padding: "0.5rem", width: "200px" }}
            />
            <span style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
              Share price will fluctuate ±€0.01-0.05 around this base
            </span>
          </label>

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

          <label style={{ display: "flex", flexDirection: "column" }}>
            Silver Price (USD per Troy Ounce):
            <input
              type="number"
              step="0.01"
              value={silverPriceUSD}
              onChange={(e) => setSilverPriceUSD(parseFloat(e.target.value))}
              style={{ marginTop: "0.25rem", padding: "0.5rem", width: "200px" }}
            />
            <span style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
              Current silver spot price (set manually)
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