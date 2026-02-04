import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const comparisonData = [
  { feature: 'Blocks 99% of blue light', us: true, them: false },
  { feature: 'Reduces eye strain', us: true, them: false },
  { feature: 'Helps Focus', us: true, them: false },
  { feature: 'Natural Deep Sleep', us: true, them: false },
  { feature: 'Affordable', us: true, them: false },
];

const ComparisonTable: React.FC = () => {
  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Red-y to compare?
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Night mode, competitors, melatonin... sleep teas just don't cut it.
        </p>
        <div className="mt-10">
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex justify-between font-semibold text-lg text-gray-900 border-b-2 border-gray-200 pb-4">
              <div className="w-1/2 text-left">Feature</div>
              <div className="w-1/4">Us</div>
              <div className="w-1/4">Them</div>
            </div>
            <div className="divide-y divide-gray-200">
              {comparisonData.map((item) => (
                <div key={item.feature} className="flex items-center justify-between py-4">
                  <div className="w-1/2 text-left text-base text-gray-700">{item.feature}</div>
                  <div className="w-1/4 flex justify-center">
                    {item.us ? <CheckCircle2 className="text-green-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
                  </div>
                  <div className="w-1/4 flex justify-center">
                    {item.them ? <CheckCircle2 className="text-green-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
