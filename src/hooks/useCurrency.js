import { useState, useEffect } from 'react';

export const useCurrency = () => {
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({ EUR: 0.85, INR: 83.12 });

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRates({
        EUR: data.rates.EUR,
        INR: data.rates.INR
      });
    } catch (error) {
      console.warn('Failed to fetch exchange rates, using defaults:', error);
    }
  };

  const convertCurrency = (usdValue) => {
    if (!usdValue || displayCurrency === 'USD') return usdValue;
    const rate = exchangeRates[displayCurrency];
    return usdValue * (rate || 1);
  };

  const formatCurrency = (value) => {
    const convertedValue = convertCurrency(value);
    
    if (displayCurrency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedValue);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedValue);
    }
  };

  useEffect(() => {
    if (displayCurrency !== 'USD') {
      fetchExchangeRates();
    }
  }, [displayCurrency]);

  return {
    displayCurrency,
    setDisplayCurrency,
    convertCurrency,
    formatCurrency,
    fetchExchangeRates
  };
};
