import React, { useState, useEffect } from 'react';

interface Subscriber {
  name: string;
  phone?: string;
  email?: string;
}

const SubscribersTab: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de suscriptores.');
        }
        const data: Subscriber[] = await response.json();
        setSubscribers(data);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error inesperado.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Suscriptores para Notificaciones de Drops</h2>
      
      {loading && <p>Cargando suscriptores...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3">
                  Contacto (Teléfono/Email)
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length > 0 ? (
                subscribers.map((subscriber, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {subscriber.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {subscriber.phone || subscriber.email}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center">
                    No hay suscriptores todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscribersTab;
