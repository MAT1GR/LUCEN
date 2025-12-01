import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export const SettingsTab: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<SiteSettings>({});
    const [isSaving, setIsSaving] = useState(false);
    
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetch('/api/settings').then(res => res.json()).then(setSettings);
    }, []);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        // Se transforma el estado para que coincida con el formato esperado por el backend
        const settingsToSave = Object.entries(settings).reduce((acc, [key, settingObj]) => {
            acc[key] = settingObj.value;
            return acc;
        }, {} as Record<string, string>);

        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsToSave),
        });
        setIsSaving(false);
        alert('Configuración guardada.');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
            return;
        }
        if (!user) {
            setPasswordMessage({ type: 'error', text: 'No se pudo identificar al usuario.' });
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    oldPassword,
                    newPassword
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setPasswordMessage({ type: 'success', text: data.message });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setPasswordMessage({ type: 'error', text: 'Ocurrió un error al conectar con el servidor.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: {
                ...prev[name], // Mantiene las propiedades existentes como 'type'
                value: value,
            },
        }));
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-6">Configuración de la Tienda</h2>
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Información General</h3>
                    <InputField label="Nombre del Sitio" name="site_name" value={settings.site_name?.value || ''} onChange={handleChange} />
                    <InputField label="Email de Contacto" name="contact_email" value={settings.contact_email?.value || ''} onChange={handleChange} />
                    <InputField label="Teléfono de Contacto" name="contact_phone" value={settings.contact_phone?.value || ''} onChange={handleChange} />
                    <InputField label="Número de WhatsApp" name="contact_whatsapp" placeholder="543413981584" value={settings.contact_whatsapp?.value || ''} onChange={handleChange} />

                    <h3 className="text-lg font-semibold border-b pb-2 pt-4">Datos de Transferencia Bancaria</h3>
                    <InputField label="CVU/CBU" name="transfer_cvu" value={settings.transfer_cvu?.value || ''} onChange={handleChange} />
                    <InputField label="Alias" name="transfer_alias" value={settings.transfer_alias?.value || ''} onChange={handleChange} />
                    <InputField label="Titular de la cuenta" name="transfer_titular" value={settings.transfer_titular?.value || ''} onChange={handleChange} />

                    <h3 className="text-lg font-semibold border-b pb-2 pt-4">Costos de Envío</h3>
                    <InputField label="Costo de Envío (Cadete en Rosario)" type="number" name="shipping_cost_cadete" value={settings.shipping_cost_cadete?.value || ''} onChange={handleChange} />
                    <InputField label="Costo de Envío (Correo Argentino)" type="number" name="shipping_cost_correo" value={settings.shipping_cost_correo?.value || ''} onChange={handleChange} />

                    <button onClick={handleSaveSettings} disabled={isSaving} className="px-6 py-2 bg-[#D8A7B1] text-white rounded hover:bg-[#c69ba5] !mt-6">
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-6">Cambiar Contraseña</h2>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <InputField label="Contraseña Actual" type="password" value={oldPassword} onChange={(e:any) => setOldPassword(e.target.value)} required />
                        <InputField label="Nueva Contraseña" type="password" value={newPassword} onChange={(e:any) => setNewPassword(e.target.value)} required />
                        <InputField label="Confirmar Nueva Contraseña" type="password" value={confirmPassword} onChange={(e:any) => setConfirmPassword(e.target.value)} required />
                        {passwordMessage.text && (
                            <div className={`p-3 rounded text-sm ${
                                passwordMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {passwordMessage.text}
                            </div>
                        )}
                        <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#D8A7B1] text-white rounded hover:bg-[#c69ba5]">
                            {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, ...props }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border rounded" />
    </div>
);