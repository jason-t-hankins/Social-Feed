import { useState } from 'react';
import { Feed } from './components';
import { ApproachComparisonPage } from './pages/ApproachComparison';

type Page = 'feed' | 'approach-comparison';

/**
 * App Component
 * 
 * Main application component for the Social Feed Dashboard.
 * Includes navigation to test/demo pages.
 */
function App() {
  const [currentPage, setCurrentPage] = useState<Page>('feed');

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
          Social Feed Dashboard
        </h1>
        <p style={{ margin: '8px 0 16px', color: '#666' }}>
          Demonstrating UseFragment vs HTTP Batch + DataLoader
        </p>

        <nav style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentPage('feed')} style={navButtonStyle('feed')}>
            📱 Feed Demo
          </button>
          <button onClick={() => setCurrentPage('approach-comparison')} style={navButtonStyle('approach-comparison')}>
            ⚡ Approach Comparison Test
          </button>
        </nav>
      </header>

      <main>
        {currentPage === 'feed' && <Feed />}
        {currentPage === 'approach-comparison' && <ApproachComparisonPage />}
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
