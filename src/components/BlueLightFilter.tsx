import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const data = [
  // This data is fine-tuned to look like the reference image
  { wavelength: 380, energy: 0, blockedEnergy: 0 },
  { wavelength: 400, energy: 5, blockedEnergy: 1 },
  { wavelength: 420, energy: 20, blockedEnergy: 2 },
  { wavelength: 430, energy: 60, blockedEnergy: 4 },
  { wavelength: 440, energy: 90, blockedEnergy: 5 },
  { wavelength: 450, energy: 98, blockedEnergy: 6 },
  { wavelength: 460, energy: 70, blockedEnergy: 5 },
  { wavelength: 470, energy: 40, blockedEnergy: 4 },
  { wavelength: 480, energy: 25, blockedEnergy: 10 },
  { wavelength: 500, energy: 30, blockedEnergy: 20 },
  { wavelength: 520, energy: 45, blockedEnergy: 35 },
  { wavelength: 540, energy: 60, blockedEnergy: 50 },
  { wavelength: 560, energy: 72, blockedEnergy: 65 },
  { wavelength: 580, energy: 70, blockedEnergy: 65 },
  { wavelength: 600, energy: 60, blockedEnergy: 55 },
  { wavelength: 620, energy: 50, blockedEnergy: 45 },
  { wavelength: 640, energy: 35, blockedEnergy: 30 },
  { wavelength: 660, energy: 20, blockedEnergy: 18 },
  { wavelength: 680, energy: 10, blockedEnergy: 9 },
  { wavelength: 720, energy: 0, blockedEnergy: 0 },
];

const BlueLightFilter: React.FC = () => {
  const [showWithoutGlasses, setShowWithoutGlasses] = useState(false);

  return (
    <div className="bg-white text-gray-800 font-sans py-4 px-4 md:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={() => setShowWithoutGlasses(true)}
            className={`rounded-md px-5 py-2.5 font-extrabold text-xs uppercase tracking-wider ${
              showWithoutGlasses ? 'bg-[#3E6F8F] text-white' : 'border border-[#3E6F8F] text-[#3E6F8F]'
            }`}
          >
            Sin Lentes
          </button>
          <button
            onClick={() => setShowWithoutGlasses(false)}
            className={`rounded-md px-5 py-2.5 font-extrabold text-xs uppercase tracking-wider ${
              !showWithoutGlasses ? 'bg-[#3E6F8F] text-white' : 'border border-[#3E6F8F] text-[#3E6F8F]'
            }`}
          >
            Con Lentes
          </button>
        </div>
      </div>

      <div className="w-full h-80 max-w-3xl mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: -20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={1.0} />
                <stop offset="30%" stopColor="#2dd4bf" stopOpacity={1.0} />
                <stop offset="55%" stopColor="#a3e635" stopOpacity={1.0} />
                <stop offset="70%" stopColor="#facc15" stopOpacity={1.0} />
                <stop offset="85%" stopColor="#fb923c" stopOpacity={1.0} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={1.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="wavelength"
              type="number"
              domain={[380, 720]}
              ticks={[400, 500, 600, 700]}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
            />
            <Area
              type="monotone"
              dataKey={showWithoutGlasses ? "energy" : "blockedEnergy"}
              stroke="transparent"
              fill="url(#chartGradient)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BlueLightFilter;
