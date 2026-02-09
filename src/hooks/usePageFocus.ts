import { useEffect, useRef } from 'react';

export const usePageFocus = (focusedTitle: string, unfocusedTitle1: string, unfocusedTitle2: string) => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const titles = [unfocusedTitle1, unfocusedTitle2];
    let titleIndex = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        titleIndex = 0; // Reset index
        document.title = titles[titleIndex];

        intervalRef.current = window.setInterval(() => {
          titleIndex = (titleIndex + 1) % titles.length;
          document.title = titles[titleIndex];
        }, 1000); // Change every 1 second
      } else {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        document.title = focusedTitle; // Use the provided focusedTitle
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set initial focused title when component mounts if not hidden
    if (!document.hidden) {
        document.title = focusedTitle;
    } else {
        // If already hidden, trigger the alternating title
        handleVisibilityChange();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      // Restore the focusedTitle when component unmounts, if not already visible
      if (document.hidden) {
        document.title = focusedTitle;
      }
    };
  }, [focusedTitle, unfocusedTitle1, unfocusedTitle2]); // Add focusedTitle to dependency array
};