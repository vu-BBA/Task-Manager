import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import TopBar  from './TopBar';

export default function AppLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-layout">
      {!isMobile && <Sidebar />}
      <div className="main-content">
        {!isMobile && <TopBar />}
        <Outlet />
      </div>
      {isMobile && <MobileNav />}
    </div>
  );
}
