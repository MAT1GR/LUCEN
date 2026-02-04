import React from 'react';
import { Eye, BrainCircuit, Bed, Check } from 'lucide-react';

const benefits = [
  {
    icon: <Eye size={28} className="text-blue-500" />,
    text: 'Prevent eye strain from screens',
  },
  {
    icon: <BrainCircuit size={28} className="text-blue-500" />,
    text: 'Reduce headaches & migraines',
  },
  {
    icon: <Bed size={28} className="text-blue-500" />,
    text: 'Blocks 99% of blue light',
  },
  {
    icon: <Check size={28} className="text-blue-500" />,
    text: 'One size fits most',
  },
];

const Benefits: React.FC = () => {
  return (
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-shrink-0">
                {benefit.icon}
              </div>
              <div className="ml-4">
                <p className="text-lg font-medium text-gray-900">{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Benefits;
