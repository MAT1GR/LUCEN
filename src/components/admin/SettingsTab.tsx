import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const SettingsTab: React.FC = () => {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

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

    return (
        <div className="space-y-8">
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
                        <button type="submit" disabled={isSaving} className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800">
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