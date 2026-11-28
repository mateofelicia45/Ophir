import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import PageLayout from './components/PageLayout.jsx';
import { usePassage } from './context/PassageContext.jsx';
import { readerPath } from './modules/reader/useReaderUrl.js';

// Lazy loaded modules
const HomePage = lazy(() => import('./modules/home/HomePage.jsx'));
const GospelPage = lazy(() => import('./modules/gospel/GospelPage.jsx'));
const ReaderPage = lazy(() => import('./modules/reader/ReaderPage.jsx'));
const CrossRefsPage = lazy(() => import('./modules/crossrefs/CrossRefsPage.jsx'));
const InterlinearPage = lazy(() => import('./modules/interlinear/InterlinearPage.jsx'));
const ConcordancePage = lazy(() => import('./modules/concordance/ConcordancePage.jsx'));
const DictionariesPage = lazy(() => import('./modules/study/DictionariesPage.jsx'));
const HermeneuticsPage = lazy(() => import('./modules/hermeneutics/HermeneuticsPage.jsx'));
const PlansPage = lazy(() => import('./modules/plans/PlansPage.jsx'));
const HarmonyPage = lazy(() => import('./modules/harmony/HarmonyPage.jsx'));
const VariantsPage = lazy(() => import('./modules/variants/VariantsPage.jsx'));
const DevotionalPage = lazy(() => import('./modules/devotional/DevotionalPage.jsx'));
const ChildrenPage = lazy(() => import('./modules/children/ChildrenPage.jsx'));
const TheologyPage = lazy(() => import('./modules/theology/TheologyPage.jsx'));
const TimelinePage = lazy(() => import('./modules/timeline/TimelinePage.jsx'));
const NotesPage = lazy(() => import('./modules/notes/NotesPage.jsx'));
const AtlasPage = lazy(() => import('./modules/atlas/AtlasPage.jsx'));
const AssistantPage = lazy(() => import('./modules/ai/AssistantPage.jsx'));

// /lector sin capítulo: lleva al pasaje actual (o a Génesis 1).
function ReaderRedirect() {
  const { passage } = usePassage();
  return <Navigate to={readerPath(passage)} replace />;
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar className={mobileOpen ? 'mobile-open' : ''} />
        {mobileOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
        <main className="main-area">
          <header className="mobile-header">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              ☰
            </button>
          </header>
          <Suspense fallback={<div className="loading-screen">Cargando módulo...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/evangelio" element={<PageLayout title="El Evangelio"><GospelPage /></PageLayout>} />
              {/* /lector lleva al pasaje actual */}
              <Route path="/lector" element={<ReaderRedirect />} />
              <Route path="/lector/:bookId/:chapter" element={<ReaderPage />} />
              <Route path="/atlas" element={<AtlasPage />} />
              <Route path="/referencias" element={<PageLayout title="Referencias Cruzadas"><CrossRefsPage /></PageLayout>} />
              <Route path="/interlineal" element={<InterlinearPage />} />
              <Route path="/concordancia" element={<PageLayout title="Concordancia Strong"><ConcordancePage /></PageLayout>} />
              <Route path="/diccionarios" element={<PageLayout title="Diccionarios y Recursos"><DictionariesPage /></PageLayout>} />
              <Route path="/hermeneutica" element={<PageLayout title="Hermenéutica Bíblica"><HermeneuticsPage /></PageLayout>} />
              <Route path="/planes" element={<PageLayout title="Planes de Lectura"><PlansPage /></PageLayout>} />
              <Route path="/harmonia" element={<PageLayout title="Armonía Evangélica"><HarmonyPage /></PageLayout>} />
              <Route path="/variantes" element={<PageLayout title="Variantes Textuales"><VariantsPage /></PageLayout>} />
              <Route path="/devocional" element={<PageLayout title="Devocional Diario"><DevotionalPage /></PageLayout>} />
              <Route path="/infantil" element={<PageLayout title="Ministerio Infantil"><ChildrenPage /></PageLayout>} />
              <Route path="/teologia" element={<PageLayout title="Teología Sistemática"><TheologyPage /></PageLayout>} />
              <Route path="/linea-tiempo" element={<PageLayout title="Línea de Tiempo"><TimelinePage /></PageLayout>} />
              <Route path="/notas" element={<NotesPage />} />
              <Route path="/asistente" element={<PageLayout title="Asistente de Estudio"><AssistantPage /></PageLayout>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}