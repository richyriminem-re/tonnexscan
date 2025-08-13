import React from 'react';

interface SplashScreenProps {
  isVisible: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020F25] text-white">
      <div className="splash-content flex flex-col items-center space-y-6">
        {/* App Icon */}
        <div className="splash-icon">
          <img 
            src="/icon-192x192.png" 
            alt="TONNEX SCAN" 
            className="w-24 h-24 sm:w-32 sm:h-32"
          />
        </div>
        
        {/* Credit Text */}
        <div className="splash-credit">
          <p className="text-sm sm:text-base font-medium tracking-wide text-white/90">
            THIS APP WAS VISIONED AND DESIGNED BY RICHY
          </p>
        </div>
      </div>
    </div>
  );
};