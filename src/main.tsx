import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';
import { SettingsProvider } from './hooks/useSettings.tsx';

// SIMPLEMENTE HEMOS QUITADO LAS ETIQUETAS <React.StrictMode> QUE ENVOLVÍAN A <App />
createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </HelmetProvider>
);

// JavaScript for countdown timer
function getNextThursdayDate() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(21, 0, 0, 0); // Set to 9 PM

  // If it's Thursday but past 9 PM, calculate for the next week's Thursday
  if (dayOfWeek === 4 && now.getHours() >= 21) {
    nextThursday.setDate(nextThursday.getDate() + 7);
  }
  return nextThursday;
}

const countdownDate = getNextThursdayDate().getTime();

const timer = setInterval(() => {
  const now = new Date().getTime();
  const distance = countdownDate - now;

  const daysElement = document.getElementById("days");
  const hoursElement = document.getElementById("hours");
  const minutesElement = document.getElementById("minutes");
  const secondsElement = document.getElementById("seconds");

  if (daysElement) daysElement.innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
  if (hoursElement) hoursElement.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
  if (minutesElement) minutesElement.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
  if (secondsElement) secondsElement.innerText = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');

  if (distance < 0) clearInterval(timer);
}, 1000);