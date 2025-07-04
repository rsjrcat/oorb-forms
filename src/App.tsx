import React from 'react';
import { Routes, Route } from 'react-router-dom';

import OorbFormsApp from './components/forms/OorbFormsApp';
import FormRenderer from './components/forms/FormRenderer';

const App = () => {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Public form route (no navbar/footer) */}
        <Route path="/form/:shareUrl" element={<FormRenderer />} />
        
        {/* Main app routes (with navbar/footer) */}
        <Route path="/*" element={
          <>
            <main>
              <Routes>
                <Route path="/oorb-forms" element={<OorbFormsApp />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </div>
  );
};

export default App;