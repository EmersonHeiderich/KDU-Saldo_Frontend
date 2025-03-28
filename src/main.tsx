// src/main.tsx

import React from 'react'; // Import React
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Import global base styles
import './App.css'; // Import global app styles (including variables)

// Find the root element
const container = document.getElementById('root');

// Ensure the container exists before creating the root
if (container) {
  // Create a root
  const root = createRoot(container);

  // Initial render
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.error('Failed to find the root element. Make sure your index.html has a <div id="root"></div>.');
}