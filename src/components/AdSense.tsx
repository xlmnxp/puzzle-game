import React, { useEffect } from 'react';

const AdSense: React.FC = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className="w-full bg-gray-100 py-2 text-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '250px', maxWidth: '728px', width: '100%', height: '90px' }}
        data-ad-client="ca-pub-1605296800226956" // Replace with your actual AdSense publisher ID
        data-ad-slot="5055309384" // Replace with your actual ad slot ID
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdSense;