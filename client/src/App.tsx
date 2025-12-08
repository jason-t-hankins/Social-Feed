import { useState } from 'react';
import { Feed } from './components';
import { BatchingDemoPage } from './demos/01-http-batching';
import { FragmentDemoPage } from './demos/02-usefragment';
import { PublicCachingDemoPage } from './demos/03-public-caching';
import {
  ApproachComparisonPage,
  PropsHttpLinkPage,
  PropsBatchLinkPage,
  FragmentHttpLinkPage,
  FragmentBatchLinkPage,
} from './demos/04-full-comparison';

type Page = 'feed' | 'approach-comparison' | 'batching-demo' | 'usefragment' | 'public-caching' |
  'props-httplink' | 'props-batchlink' | 'fragment-httplink' | 'fragment-batchlink';

/**
 * App Component
 * 
 * Main application component for the Social Feed Dashboard.
 * Includes navigation to test/demo pages.
 */
function App() {
  const [currentPage, setCurrentPage] = useState<Page>('approach-comparison');

  const navButtonStyle = (page: Page) => ({
    padding: '12px 24px',
    backgroundColor: currentPage === page ? '#007bff' : '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: currentPage === page ? 'bold' : 'normal',
  });

  return (
    <div className="app" style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '32px',
        padding: '24px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '32px', color: '#333' }}>
          GraphQL Optimization Patterns
        </h1>
        <p style={{ margin: '8px 0 16px', color: '#666' }}>
          Client, Server, and Network Layer Optimization Demos
        </p>

        <nav style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage('approach-comparison')} style={navButtonStyle('approach-comparison')}>
            ⚡ Full Comparison
          </button>
          <button onClick={() => setCurrentPage('props-httplink')} style={navButtonStyle('props-httplink')}>
            1. Props + HttpLink
          </button>
          <button onClick={() => setCurrentPage('props-batchlink')} style={navButtonStyle('props-batchlink')}>
            2. Props + BatchLink
          </button>
          <button onClick={() => setCurrentPage('fragment-httplink')} style={navButtonStyle('fragment-httplink')}>
            3. Fragment + HttpLink
          </button>
          <button onClick={() => setCurrentPage('fragment-batchlink')} style={navButtonStyle('fragment-batchlink')}>
            4. Fragment + BatchLink
          </button>
          <button onClick={() => setCurrentPage('batching-demo')} style={navButtonStyle('batching-demo')}>
            🚀 HTTP Batching
          </button>
          <button onClick={() => setCurrentPage('usefragment')} style={navButtonStyle('usefragment')}>
            ✨ useFragment
          </button>
          <button onClick={() => setCurrentPage('public-caching')} style={navButtonStyle('public-caching')}>
            🌐 Public Caching
          </button>
          <button onClick={() => setCurrentPage('feed')} style={navButtonStyle('feed')}>
            📱 Feed Demo
          </button>
        </nav>
      </header>

      <main>
        {currentPage === 'feed' && <Feed />}
        {currentPage === 'batching-demo' && <BatchingDemoPage />}
        {currentPage === 'usefragment' && <FragmentDemoPage />}
        {currentPage === 'public-caching' && <PublicCachingDemoPage />}
        {currentPage === 'approach-comparison' && <ApproachComparisonPage />}
        {currentPage === 'props-httplink' && <PropsHttpLinkPage />}
        {currentPage === 'props-batchlink' && <PropsBatchLinkPage />}
        {currentPage === 'fragment-httplink' && <FragmentHttpLinkPage />}
        {currentPage === 'fragment-batchlink' && <FragmentBatchLinkPage />}
      </main>

      {currentPage === 'feed' && (
        <footer style={{ 
          textAlign: 'center', 
          marginTop: '32px', 
          padding: '16px',
          color: '#888',
          fontSize: '14px'
        }}>
          <p>
            Open your browser DevTools Network tab to observe GraphQL batching.
            <br />
            Check the server console to see DataLoader batching in action.
          </p>
        </footer>
      )}
    </div>
  );
}

export default App;
