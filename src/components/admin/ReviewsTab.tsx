import React, { useState, useEffect } from 'react';
import { Trash2, Star } from 'lucide-react';

// Define the Review type based on what the new API endpoint returns
interface Review {
  id: number;
  product_name: string;
  title: string;
  comment: string;
  rating: number;
  user_name: string;
  user_email: string;
  created_at: string;
}

const fetchReviews = async () => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch('/api/reviews/admin', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return res.json();
};

const deleteReview = async (id: number) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/reviews/admin/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Failed to delete review');
  }
};

const ReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchReviews();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      try {
        await deleteReview(id);
        setReviews(reviews.filter(r => r.id !== id));
      } catch (err) {
        alert('No se pudo eliminar la reseña.');
      }
    }
  };

  if (isLoading) return <div>Cargando reseñas...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-6">Gestionar Reseñas</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentario</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map(review => (
              <tr key={review.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{review.product_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{review.user_name}</div>
                  <div className="text-sm text-gray-500">{review.user_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{review.title}</div>
                  <div className="text-sm text-gray-500 truncate" style={{ maxWidth: '250px' }}>{review.comment}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(review.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewsTab;
