import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { PassageProvider } from './context/PassageContext.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/atlas.css';
import './styles/reader.css';
import './styles/notes.css';
import './styles/crossrefs.css';
import './styles/interlinear.css';
import './styles/timeline.css';
import './styles/theology.css';
import './styles/gospel.css';
import './styles/concordance.css';
import './styles/dictionaries.css';
import './styles/hermeneutics.css';
import './styles/devotional.css';
import './styles/children.css';
import './styles/votd.css';
import './styles/plans.css';
import './styles/harmony.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PassageProvider>
      <App />
    </PassageProvider>
  </StrictMode>
);
