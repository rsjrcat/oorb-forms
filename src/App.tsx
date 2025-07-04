import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import EnhancedOorbFormsApp from './components/forms/EnhancedOorbFormsApp';
import FormRenderer from './components/forms/FormRenderer';

const App = () => {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Public form route (no header) */}
        <Route path="/form/:shareUrl" element={<FormRenderer />} />
        
        {/* Main app routes (with header) */}
        <Route path="/*" element={
          <>
            <Header />
            <main>
              <Routes>
                <Route path="/oorb-forms" element={<EnhancedOorbFormsApp />} />
                <Route path="/" element={<EnhancedOorbFormsApp />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </div>
  );
};

export default App;