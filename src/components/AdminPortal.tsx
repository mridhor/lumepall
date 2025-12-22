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
  const [baseSharePrice, setBaseSharePrice] = useState(1.824);
  const [message, setMessage] = useState("");
  const [fundMessage, setFundMessage] = useState("");

  // Fetch current fund compositions on mount
  useEffect(() => {
    const fetchFundParams = async () => {
      try {
        const response = await fetch('/api/fund-params');
        const data = await response.json();
        if (data.success) {
          setBaseFundValue(data.base_fund_value);
          setSilverTroyOunces(data.silver_troy_ounces);
          setSilverPriceUSD(data.silver_price_usd || 31.25);
          setBaseSharePrice(data.base_share_price || 1.824);
          setPriceInput(data.base_share_price || 1.824);
        }
      } catch (error) {
        console.error('Failed to fetch fund compositions:', error);
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
          setFundMessage("Fund compositions updated successfully. Reloading...");
          // Reload page to fetch fresh data from API/DB
          // This prevents stale/fallback values from being displayed
          setTimeout(() => {
            window.location.reload();
          }, 500); // Short delay to show success message
        } else {
          setFundMessage("Error updating fund compositions");
        }
      } catch (error) {
        console.error('Error updating fund compositions:', error);
        setFundMessage("Error updating fund compositions");
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
          <h3 className="text-xl font-medium mb-6">Live Status</h3>
          <div className="bg-gray-100 p-8 rounded-2xl border border-gray-200">
            <div className="mb-2">
              <p className="text-gray-600 text-xs uppercase tracking-wider mb-2 font-semibold">Current Share Price</p>
              <div className="text-4xl font-medium text-black">
                {currentPrice.toFixed(4)} <span className="text-lg text-gray-500 font-normal">EUR</span>
              </div>
            </div>

            {/* Fund Composition Visualization */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-xs uppercase tracking-wider mb-4 font-semibold">Fund Composition</p>

              {(() => {
                // Calculate values for visualization
                const silverValueEUR = (silverTroyOunces * silverPriceUSD); // Now EUR
                const totalFundValue = baseFundValue + silverValueEUR;
                const silverPercentage = totalFundValue > 0 ? (silverValueEUR / totalFundValue) * 100 : 0;
                const basePercentage = totalFundValue > 0 ? (baseFundValue / totalFundValue) * 100 : 0;

                return (
                  <div className="space-y-3">
                    {/* Stacked Bar Chart */}
                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      {/* Base Fund Segment (Dark) */}
                      <div
                        className="h-full bg-gray-800 transition-all duration-1000 ease-out"
                        style={{ width: `${basePercentage}%` }}
                      ></div>
                      {/* Silver Segment (Light) */}
                      <div
                        className="h-full bg-gray-300 transition-all duration-1000 ease-out"
                        style={{ width: `${silverPercentage}%` }}
                      ></div>
                    </div>

                    {/* Legend & Details */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                          <span className="text-gray-600 font-medium">Base Fund</span>
                        </div>
                        <div className="font-semibold text-base">{basePercentage.toFixed(1)}%</div>
                        <div className="text-gray-400">€{(baseFundValue / 1000).toFixed(1)}k</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span className="text-gray-600 font-medium">Silver Asset</span>
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        </div>
                        <div className="font-semibold text-base">{silverPercentage.toFixed(1)}%</div>
                        <div className="text-gray-400">€{(silverValueEUR / 1000).toFixed(1)}k</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div>
          <h3 className="text-xl font-medium mb-6">Fund Compositions</h3>
          <div className="space-y-6">
            <div className="group">
              <label className="block text-gray-600 text-xs uppercase tracking-wider mb-2 group-focus-within:text-black transition-colors font-semibold">
                Base Share Price (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={baseSharePrice}
                onChange={(e) => setBaseSharePrice(parseFloat(e.target.value))}
                className="w-full text-2xl font-normal border-b border-gray-300 py-2 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-300 text-black"
              />
            </div>

            <div className="group">
              <label className="block text-gray-600 text-xs uppercase tracking-wider mb-2 group-focus-within:text-black transition-colors font-semibold">
                Base Fund Value (EUR)
              </label>
              <input
                type="number"
                step="1000"
                value={baseFundValue}
                onChange={(e) => setBaseFundValue(parseFloat(e.target.value))}
                className="w-full text-2xl font-normal border-b border-gray-300 py-2 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-300 text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Non-silver portion of the fund</p>
            </div>

            <div className="group">
              <label className="block text-gray-600 text-xs uppercase tracking-wider mb-2 group-focus-within:text-black transition-colors font-semibold">
                Silver Holdings (Troy Oz)
              </label>
              <input
                type="number"
                step="100"
                value={silverTroyOunces}
                onChange={(e) => setSilverTroyOunces(parseFloat(e.target.value))}
                className="w-full text-2xl font-normal border-b border-gray-300 py-2 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-300 text-black"
              />
            </div>

            <div className="group">
              <label className="block text-gray-600 text-xs uppercase tracking-wider mb-2 group-focus-within:text-black transition-colors font-semibold">
                Silver Price (EUR/Oz)
              </label>
              <input
                type="number"
                step="0.01"
                value={silverPriceUSD}
                onChange={(e) => setSilverPriceUSD(parseFloat(e.target.value))}
                className="w-full text-2xl font-normal border-b border-gray-300 py-2 focus:border-black outline-none transition-colors bg-transparent placeholder-gray-300 text-black"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={handleFundParamsUpdate}
                className="bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-all active:scale-95 text-xs uppercase tracking-wider font-bold"
              >
                Update Compositions
              </button>

              {fundMessage && (
                <span className={`text-sm font-medium ${fundMessage.includes('Error') ? 'text-red-600' : 'text-green-700'}`}>
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