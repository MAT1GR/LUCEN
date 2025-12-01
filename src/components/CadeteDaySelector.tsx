import React, { useState, useEffect } from 'react';

interface DayOption {
  value: string;
  label: string;
}

interface CadeteDaySelectorProps {
  onDaySelect: (day: DayOption | null) => void;
  selectedDay: DayOption | null;
}

const getRosarioTime = () => {
  const now = new Date();
  const utcOffset = -3 * 60; // Argentina is UTC-3
  return new Date(now.getTime() + utcOffset * 60 * 1000);
};

const generateDeliveryDays = (): DayOption[] => {
  const options: DayOption[] = [];
  const now = getRosarioTime();
  let daysAdded = 0;
  let i = 2; // Start from 2 days from now

  while (daysAdded < 4) { // Generate next 4 valid days
    const date = new Date(now.getTime());
    date.setUTCDate(date.getUTCDate() + i);
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday

    if (dayOfWeek !== 0) { // Skip Sundays
      const daysOfWeekLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = daysOfWeekLabels[dayOfWeek];
      const label = `${dayName} ${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
      
      options.push({
        value: date.toISOString().split('T')[0],
        label: label,
      });
      daysAdded++;
    }
    i++;
  }

  return options;
};

export const CadeteDaySelector: React.FC<CadeteDaySelectorProps> = ({ onDaySelect, selectedDay }) => {
  const [days, setDays] = useState<DayOption[]>(generateDeliveryDays());

  return (
    <div className="space-y-2 pt-4">
      <h3 className="text-md font-medium text-gris-oscuro mb-2">Elegí el día de entrega:</h3>
      {days.map((day) => (
        <label
          key={day.value}
          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer has-[:checked]:bg-arena/30 has-[:checked]:border-black"
        >
          <div className="flex items-center">
            <input
              type="radio"
              name="cadeteDay"
              value={day.value}
              checked={selectedDay?.value === day.value}
              onChange={() => onDaySelect(day)}
              className="h-4 w-4 text-black focus:ring-black"
            />
            <span className="ml-3 text-sm text-gris-oscuro flex flex-col">
              <span>{day.label}</span>
              <span className="text-xs text-gray-500">De 08:00 a 11:00 hs</span>
            </span>
          </div>
        </label>
      ))}
    </div>
  );
};
