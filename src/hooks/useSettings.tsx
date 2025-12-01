import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define la forma de los settings
interface SiteSettingsData {
    [key: string]: string;
}

// Define el contexto
interface SettingsContextType {
    settings: SiteSettingsData;
    loading: boolean;
    error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Define el proveedor del contexto
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SiteSettingsData>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (!response.ok) {
                    throw new Error('Failed to fetch settings');
                }
                const data = await response.json();
                
                // Transforma la estructura de { key: { value: '...' } } a { key: '...' }
                const flattenedSettings = Object.entries(data).reduce((acc, [key, settingObj]: [string, any]) => {
                    acc[key] = settingObj.value;
                    return acc;
                }, {} as SiteSettingsData);

                setSettings(flattenedSettings);
            } catch (err: any) {
                setError(err.message);
                console.error("Failed to fetch settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const value = { settings, loading, error };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
