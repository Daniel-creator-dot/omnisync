import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface CompanySettings {
  company_name: string;
  currency: string;
  invoice_prefix: string;
  [key: string]: any;
}

interface SettingsContextType {
  settings: CompanySettings;
  loading: boolean;
  currencySymbol: string;
  formatCurrency: (amount: number | string | undefined) => string;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: 'Bytz360',
    currency: 'USD',
    invoice_prefix: 'INV-',
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.get('/settings/company');
      if (data && data.id) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const currencySymbol = settings.currency || 'GH₵';

  const formatCurrency = (amount: number | string | undefined) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount || 0;
    return `${currencySymbol}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        loading, 
        currencySymbol, 
        formatCurrency, 
        refreshSettings: fetchSettings 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
