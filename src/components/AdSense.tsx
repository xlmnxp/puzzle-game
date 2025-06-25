import React, { useEffect, useRef } from 'react';

const AdSense: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAd = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    };

    const refreshAd = () => {
      if (adRef.current) {
        adRef.current.innerHTML = '';
        const newAd = document.createElement('ins');
        newAd.className = 'adsbygoogle';
        newAd.style.display = 'block';
        newAd.style.width = '100%';
        newAd.style.height = '90px';
        newAd.setAttribute('data-ad-client', 'ca-pub-1605296800226956');
        newAd.setAttribute('data-ad-slot', '5055309384');
        newAd.setAttribute('data-full-width-responsive', 'true');
        adRef.current.appendChild(newAd);
        loadAd();
      }
    };

    loadAd();

    let intervalId = setInterval(function () {
      const refreshTime = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // Random time between 5000ms and 10000ms
      refreshAd();
      // Schedule the next refresh
      setTimeout(() => {
        clearInterval(intervalId);
        intervalId = setInterval(arguments.callee, refreshTime);
      }, refreshTime);
    }, 5000); // Initial refresh after 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div ref={adRef} className="fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 py-2 text-center z-50">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '90px' }}
        data-ad-client="ca-pub-1605296800226956"
        data-ad-slot="5055309384"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdSense;