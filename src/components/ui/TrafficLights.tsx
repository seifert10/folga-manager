import React from 'react';

interface TrafficLightsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
}

export const TrafficLights: React.FC<TrafficLightsProps> = ({
  onClose,
  onMinimize,
  onMaximize,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
      />
      <button
        type="button"
        onClick={onMinimize}
        aria-label="Minimizar"
        className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
      />
      <button
        type="button"
        onClick={onMaximize}
        aria-label="Expandir"
        className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
      />
    </div>
  );
};

export default TrafficLights;
