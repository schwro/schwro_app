import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * ResponsiveTabs - Responsywny komponent zakładek
 * Na desktop pokazuje wszystkie zakładki w jednej linii
 * Na mobile pokazuje dropdown z aktualną zakładką
 */
export default function ResponsiveTabs({ tabs, activeTab, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Zamknij dropdown przy kliknięciu poza
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];
  const IconComponent = activeTabData?.icon;

  return (
    <div className={className}>
      {/* Mobile dropdown */}
      <div ref={dropdownRef} className="lg:hidden relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent size={18} className="text-pink-600 dark:text-pink-400" />}
            <span className="font-medium text-gray-800 dark:text-gray-200">{activeTabData?.label}</span>
          </div>
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onChange(tab.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {TabIcon && <TabIcon size={18} />}
                    <span className="font-medium">{tab.label}</span>
                  </div>
                  {isActive && <Check size={18} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop tabs */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 inline-flex gap-2 flex-wrap">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`px-4 xl:px-6 py-2.5 rounded-xl font-medium transition text-sm flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {TabIcon && <TabIcon size={16} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
