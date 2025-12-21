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
          setFundMessage("Fund parameters updated successfully");
          // Also update the legacy price input
          setPriceInput(baseSharePrice);
          onPriceUpdate(baseSharePrice);

          // Clear message after 3 seconds
          setTimeout(() => setFundMessage(""), 3000);
        } else {
          setFundMessage("Error updating fund parameters");
        }
      } catch (error) {
        console.error('Error updating fund parameters:', error);
        setFundMessage("Error updating fund parameters");
      }
    } else {
      setFundMessage("Please enter valid numbers");
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Live Status */}
        <div>
          <h3 className="text-2xl font-light mb-6">Live Status</h3>
          <div className="bg-gray-50 p-8 rounded-2xl">
            <div className="mb-8">
              <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Current Share Price</p>
              <div className="text-5xl font-light">
                {currentPrice.toFixed(4)} <span className="text-xl text-gray-400">EUR</span>
              </div>
              <p className="text-gray-400 text-sm mt-2 font-light">
                Fluctuates ±€0.01-0.05 around base
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Base Price</p>
              <div className="text-3xl font-light text-gray-800">
                {baseSharePrice.toFixed(2)} <span className="text-lg text-gray-400">EUR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div>
          <h3 className="text-2xl font-light mb-6">Fund Parameters</h3>
          <div className="space-y-8">
            <div className="group">
              <label className="block text-gray-500 text-sm uppercase tracking-wider mb-2 group-focus-within:text-black transition-colors">
                Base Share Price (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={baseSharePrice}
                onChange={(e) => setBaseSharePrice(parseFloat(e.target.value))}
                className="w-full text-3xl font-light border-b border-gray-200 py-2 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-200"
              />
            </div>

            <div className="group">
              <label className="block text-gray-500 text-sm uppercase tracking-wider mb-2 group-focus-within:text-black transition-colors">
                Base Fund Value (EUR)
              </label>
              <input
                type="number"
                step="1000"
                value={baseFundValue}
                onChange={(e) => setBaseFundValue(parseFloat(e.target.value))}
                className="w-full text-3xl font-light border-b border-gray-200 py-2 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-200"
              />
              <p className="text-xs text-gray-400 mt-1">Non-silver portion of the fund</p>
            </div>

            <div className="group">
              <label className="block text-gray-500 text-sm uppercase tracking-wider mb-2 group-focus-within:text-black transition-colors">
                Silver Holdings (Troy Oz)
              </label>
              <input
                type="number"
                step="100"
                value={silverTroyOunces}
                onChange={(e) => setSilverTroyOunces(parseFloat(e.target.value))}
                className="w-full text-3xl font-light border-b border-gray-200 py-2 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-200"
              />
            </div>

            <div className="group">
              <label className="block text-gray-500 text-sm uppercase tracking-wider mb-2 group-focus-within:text-black transition-colors">
                Silver Price (USD/Oz)
              </label>
              <input
                type="number"
                step="0.01"
                value={silverPriceUSD}
                onChange={(e) => setSilverPriceUSD(parseFloat(e.target.value))}
                className="w-full text-3xl font-light border-b border-gray-200 py-2 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-200"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handleFundParamsUpdate}
                className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-all active:scale-95 text-sm uppercase tracking-wider font-medium"
              >
                Update Parameters
              </button>

              {fundMessage && (
                <span className={`text-sm ${fundMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                  {fundMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};