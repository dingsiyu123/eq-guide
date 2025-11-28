'use client';

import React, { useState } from 'react';
import Home from '../views/Home';
import OnlineMouthpiece from '../views/OnlineMouthpiece';
import OfflineRescue from '../views/OfflineRescue';
import EQArena from '../views/EQArena';
import { Page } from '../types';

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [pageParams, setPageParams] = useState<any>(null);

  const handleNavigate = (page: Page, params?: any) => {
    setCurrentPage(page);
    if (params) setPageParams(params);
  };

  const customStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      
      {currentPage === Page.HOME && (
        <Home onNavigate={handleNavigate} />
      )}
      
      {currentPage === Page.ONLINE && (
        <OnlineMouthpiece 
            onBack={() => setCurrentPage(Page.HOME)} 
            initialParams={pageParams} 
        />
      )}

      {currentPage === Page.OFFLINE && (
        <OfflineRescue 
            onBack={() => setCurrentPage(Page.HOME)} 
            initialParams={pageParams}
        />
      )}

      {currentPage === Page.ARENA && (
        <EQArena onBack={() => setCurrentPage(Page.HOME)} />
      )}
    </>
  );
}