/**
 * Fund Value Calculator
 * Calculates total fund value based on:
 * - Base fund value (non-silver portion)
 * - Silver holdings (in Troy ounces) × Current silver spot price
 */

export interface FundParams {
  baseFundValue: number; // EUR
  silverTroyOunces: number;
}

export interface FundValue {
  totalValue: number; // Total fund value in EUR
  silverValue: number; // Value of silver portion in EUR
  basePortion: number; // Non-silver portion in EUR
  silverPrice: number; // Current silver price in USD/oz
  timestamp: number;
}

const EUR_TO_USD = 1.08; // Approximate exchange rate

export class FundValueCalculator {
  private baseFundValue: number;
  private silverTroyOunces: number;
  private onValueUpdate: (value: FundValue) => void;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastSilverPrice: number = 31.25; // Default silver price USD/oz

  constructor(
    fundParams: FundParams,
    onValueUpdate: (value: FundValue) => void
  ) {
    this.baseFundValue = fundParams.baseFundValue;
    this.silverTroyOunces = fundParams.silverTroyOunces;
    this.onValueUpdate = onValueUpdate;
    console.log('FundValueCalculator Initialized:', fundParams);
  }

  async start() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      console.log('FundValueCalculator - Cleared existing interval');
    }

    const updateValue = async () => {
      try {
        // Fetch current silver spot price
        const response = await fetch('/api/silver-price');
        const data = await response.json();

        if (data.success && data.silverPrice) {
          this.lastSilverPrice = data.silverPrice;
        }

        // Calculate silver value in EUR
        const silverValueUSD = this.silverTroyOunces * this.lastSilverPrice;
        const silverValueEUR = silverValueUSD / EUR_TO_USD;

        // Calculate total fund value
        const totalValue = this.baseFundValue + silverValueEUR;

        const fundValue: FundValue = {
          totalValue,
          silverValue: silverValueEUR,
          basePortion: this.baseFundValue,
          silverPrice: this.lastSilverPrice,
          timestamp: Date.now(),
        };

        console.log('FundValueCalculator - Update:', {
          baseFund: this.baseFundValue,
          silverOz: this.silverTroyOunces,
          silverPriceUSD: this.lastSilverPrice,
          silverValueEUR: silverValueEUR,
          totalValue: totalValue,
        });

        this.onValueUpdate(fundValue);
      } catch (error) {
        console.error('FundValueCalculator - Error updating value:', error);

        // Fallback calculation with last known silver price
        const silverValueUSD = this.silverTroyOunces * this.lastSilverPrice;
        const silverValueEUR = silverValueUSD / EUR_TO_USD;
        const totalValue = this.baseFundValue + silverValueEUR;

        this.onValueUpdate({
          totalValue,
          silverValue: silverValueEUR,
          basePortion: this.baseFundValue,
          silverPrice: this.lastSilverPrice,
          timestamp: Date.now(),
        });
      }
    };

    console.log('FundValueCalculator - Starting interval (every 2 seconds)');
    await updateValue(); // Initial update
    this.updateInterval = setInterval(updateValue, 2000); // Update every 2 seconds

    // Pause when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
          console.log('FundValueCalculator - Paused due to tab inactivity');
        }
      } else {
        if (!this.updateInterval) {
          console.log('FundValueCalculator - Resuming due to tab activity');
          this.updateInterval = setInterval(updateValue, 2000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('FundValueCalculator - Stopped interval');
    }
  }

  updateParams(fundParams: FundParams) {
    this.baseFundValue = fundParams.baseFundValue;
    this.silverTroyOunces = fundParams.silverTroyOunces;
    console.log('FundValueCalculator - Updated parameters:', fundParams);
  }
}
