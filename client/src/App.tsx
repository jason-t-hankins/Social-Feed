import { Feed } from './components';

/**
 * App Component
 * 
 * Main application component for the Social Feed Dashboard.
 */
function App() {
  return (
    <div className="app" style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '32px',
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '32px', color: '#333' }}>
          Social Feed Dashboard
        </h1>
        <p style={{ margin: '8px 0 0', color: '#666' }}>
          Demonstrating UseFragment vs DataLoader + HTTP Batching
        </p>
      </header>

      <main>
        <Feed />
      </main>

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
    </div>
  );
}

export default App;
