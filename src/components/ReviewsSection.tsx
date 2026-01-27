import React, { useState, useEffect } from "react";
import { Star, Send, X } from "lucide-react";
import { Review } from "../../server/types";

interface ReviewsSectionProps {
  productId: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Header Stats (Calculate locally for now to match UI)
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/reviews/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to load reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          title,
          rating,
          comment,
          user_name: name,
          user_email: email,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTitle("");
        setComment("");
        setName("");
        setEmail("");
        setRating(5);
        fetchReviews();
        setTimeout(() => {
            setSuccess(false);
            setIsFormOpen(false);
        }, 2000);
      } else {
        alert("Error al enviar la reseña.");
      }
    } catch (error) {
      console.error("Error submitting review", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="reviews-section" className="py-8 mt-8 border-t border-gray-100">
      
      {/* 1. Header Resumen (Estilo ejemplo.png) */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b border-gray-100 gap-4">
        
        {/* Izquierda: Promedio y Estrellas */}
        <div className="flex items-center gap-4">
           <span className="text-4xl font-black text-black">{averageRating}</span>
           <div>
              <div className="flex text-yellow-400 mb-1">
                 {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={20} 
                      fill={star <= Math.round(Number(averageRating)) ? "currentColor" : "none"} 
                      className={star <= Math.round(Number(averageRating)) ? "text-yellow-400" : "text-gray-200"}
                    />
                 ))}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                (basado en {reviews.length} opiniones)
              </p>
           </div>
        </div>

        {/* Derecha: Botón "Agregar una opinión" */}
        <div>
           <button 
             onClick={() => setIsFormOpen(true)}
             className="text-gray-500 hover:text-black underline text-sm font-medium transition-colors"
           >
             Agregar una opinión
           </button>
        </div>
      </div>


      {/* 2. Formulario (Modal / Expandable) */}
      {isFormOpen && (
        <div className="bg-gray-50 p-6 rounded-sm mb-8 animate-fade-in-up border border-gray-100 relative">
            <button 
                onClick={() => setIsFormOpen(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
                <X size={20} />
            </button>

            <h4 className="text-lg font-bold uppercase tracking-wide mb-6 text-center">
               Escribir reseña
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                <div className="flex flex-col items-center mb-6">
                    <label className="text-xs font-bold uppercase mb-2 text-gray-500">Tu calificación</label>
                    <div className="flex gap-2 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                        key={star}
                        size={32}
                        className={`transition-colors ${
                            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        }`}
                        onClick={() => setRating(star)}
                        />
                    ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-200 p-3 text-sm rounded-sm focus:outline-none focus:border-black"
                        placeholder="Nombre *"
                    />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-200 p-3 text-sm rounded-sm focus:outline-none focus:border-black"
                        placeholder="Email *"
                    />
                </div>

                <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-200 p-3 text-sm rounded-sm focus:outline-none focus:border-black"
                    placeholder="Título de la opinión *"
                />

                <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-200 p-3 text-sm rounded-sm focus:outline-none focus:border-black resize-none"
                    placeholder="Escribí tu opinión..."
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white font-bold uppercase tracking-widest py-4 text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                    {isSubmitting ? "Enviando..." : (
                    <>
                        Enviar Reseña <Send size={16} />
                    </>
                    )}
                </button>
                
                {success && (
                    <p className="text-green-600 text-center text-sm font-bold mt-2">
                    ¡Gracias por tu opinión!
                    </p>
                )}
            </form>
        </div>
      )}


      {/* 3. Listado de Reseñas */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
               
               {/* Header de la reseña individual */}
               <div className="flex justify-between items-start mb-2">
                  <div className="flex text-yellow-400 text-xs gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <Star
                        key={i}
                        size={14}
                        fill={i < review.rating ? "currentColor" : "none"}
                        className={i < review.rating ? "text-yellow-400" : "text-gray-200"}
                        />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">por {review.user_name}</span>
               </div>

               <h4 className="font-bold text-sm text-black mb-1">
                  {review.title}
               </h4>
               
               <p className="text-sm text-gray-600 leading-relaxed">
                  {review.comment}
               </p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 opacity-50">
            <p className="text-sm">Aún no hay opiniones.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ReviewsSection;
