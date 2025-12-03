import { useState } from 'react';

/**
 * DataLoader Performance Demo
 * 
 * This demonstrates DataLoader's DATABASE optimization:
 * Without DataLoader = N+1 problem (1 query for posts + N queries for each author)
 * With DataLoader = 2 queries total (1 for posts + 1 batched for all authors)
 * 
 * 🚀 THE BIGGEST PERFORMANCE WIN!
 */

export function DataLoaderDemoPage() {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>DataLoader: The Biggest Performance Win</h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Eliminates the N+1 query problem - reduces database load by 90%+
        </p>
      </header>

      {/* The N+1 Problem Explained */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#ffebee', borderRadius: '8px', border: '2px solid #f44336' }}>
        <h2 style={{ marginTop: 0, color: '#f44336' }}>❌ The N+1 Problem</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          <strong>Scenario:</strong> Load 10 posts, each post has an author.
        </p>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '4px', marginTop: '16px', fontFamily: 'monospace', fontSize: '14px' }}>
          <div style={{ color: '#d32f2f' }}>Query 1: SELECT * FROM posts LIMIT 10</div>
          <div style={{ color: '#d32f2f', marginTop: '4px' }}>Query 2: SELECT * FROM users WHERE id = 'user1'</div>
          <div style={{ color: '#d32f2f' }}>Query 3: SELECT * FROM users WHERE id = 'user2'</div>
          <div style={{ color: '#d32f2f' }}>Query 4: SELECT * FROM users WHERE id = 'user3'</div>
          <div style={{ color: '#999' }}>... 7 more queries ...</div>
          <div style={{ color: '#d32f2f' }}>Query 11: SELECT * FROM users WHERE id = 'user10'</div>
        </div>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336', marginTop: '16px', marginBottom: 0 }}>
          Result: 11 database queries for 10 posts! 💥
        </p>
      </div>

      {/* DataLoader Solution */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '2px solid #4caf50' }}>
        <h2 style={{ marginTop: 0, color: '#4caf50' }}>✅ DataLoader Solution</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          <strong>Same scenario:</strong> Load 10 posts, each post has an author.
        </p>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '4px', marginTop: '16px', fontFamily: 'monospace', fontSize: '14px' }}>
          <div style={{ color: '#388e3c' }}>Query 1: SELECT * FROM posts LIMIT 10</div>
          <div style={{ color: '#388e3c', marginTop: '8px' }}>Query 2: SELECT * FROM users WHERE id IN ('user1', 'user2', 'user3', ..., 'user10')</div>
        </div>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50', marginTop: '16px', marginBottom: 0 }}>
          Result: 2 database queries for 10 posts! ✨
        </p>
      </div>

      {/* Real Example from Server Logs */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
        <h2 style={{ marginTop: 0 }}>📊 Real Server Logs from This App</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Check your terminal running <code>npm run dev</code> - you'll see DataLoader in action:
        </p>
        <div style={{ backgroundColor: '#000', color: '#0f0', padding: '16px', borderRadius: '4px', marginTop: '16px', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre' }}>
{`[DataLoader] Batched like count for 5 posts
[DataLoader] Batched comment count for 5 posts
[DataLoader] Batched user load for 3 IDs: [
  '692dc8268db081ca882ff033',
  '692dc8268db081ca882ff032',
  '692dc8268db081ca882ff034'
]`}
        </div>
        <p style={{ fontSize: '14px', marginTop: '16px', color: '#666' }}>
          These 3 user lookups happened in a single MongoDB query instead of 3 separate queries!
        </p>
      </div>

      {/* Show Comparison Button */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <button
          onClick={() => setShowComparison(!showComparison)}
          style={{
            padding: '16px 32px',
            backgroundColor: '#2196f3',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          {showComparison ? 'Hide' : 'Show'} Performance Comparison
        </button>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2>Performance Impact by Scale</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Scenario</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Without DataLoader</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>With DataLoader</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Improvement</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>10 posts + authors</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#f44336' }}>11 queries</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#4caf50' }}>2 queries</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>82% fewer</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>50 posts + authors + likes + comments</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#f44336' }}>151 queries</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#4caf50' }}>4 queries</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>97% fewer</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>100 posts (full feed)</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#f44336' }}>301 queries</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#4caf50' }}>4 queries</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>99% fewer</td>
              </tr>
              <tr style={{ backgroundColor: '#fff3cd' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>Production scale (1000 posts)</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#f44336', fontWeight: 'bold' }}>3001 queries 💥</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#4caf50', fontWeight: 'bold' }}>4 queries ✨</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>99.9% fewer</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Code Example */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2>How DataLoader Works</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
          DataLoader collects all pending lookups in a single "tick" and batches them:
        </p>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', overflowX: 'auto' }}>
<pre>{`// Without DataLoader - N+1 problem
const posts = await Post.find().limit(10);
for (const post of posts) {
  post.author = await User.findById(post.authorId);  // 😱 10 queries!
}

// With DataLoader - Automatic batching
const userLoader = new DataLoader(async (ids) => {
  // This executes ONCE with all IDs
  return await User.find({ _id: { $in: ids } });
});

const posts = await Post.find().limit(10);
for (const post of posts) {
  post.author = await userLoader.load(post.authorId);  // ✨ Batched!
}
// Result: All 10 users fetched in a single query!`}</pre>
        </div>
      </div>

      {/* When to Use */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h2>🎯 When to Use DataLoader</h2>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196f3', marginTop: '16px' }}>
          ✅ ALWAYS - This is non-negotiable!
        </div>
        <ul style={{ fontSize: '16px', lineHeight: '1.8', marginTop: '16px' }}>
          <li><strong>Any GraphQL server</strong> with relational data</li>
          <li><strong>Any resolver</strong> that loads related entities</li>
          <li><strong>Production applications</strong> (required, not optional)</li>
          <li><strong>Development/staging</strong> (catch N+1 issues early)</li>
        </ul>
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '2px solid #ffc107' }}>
          <strong>⚠️ Warning:</strong> Without DataLoader, your database will be overwhelmed at scale. 
          This is the #1 GraphQL performance killer in production!
        </div>
      </div>

      {/* Summary */}
      <div style={{ padding: '24px', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
        <h2>📚 Key Takeaways</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
          <div>
            <h3 style={{ color: '#7b1fa2' }}>What DataLoader Does:</h3>
            <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
              <li>Batches database queries</li>
              <li>Eliminates N+1 problem</li>
              <li>Caches per-request</li>
              <li>Reduces DB load by 90%+</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: '#7b1fa2' }}>Performance Impact:</h3>
            <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
              <li>10 posts: 11 → 2 queries</li>
              <li>100 posts: 301 → 4 queries</li>
              <li>1000 posts: 3001 → 4 queries</li>
              <li><strong>99.9% reduction!</strong></li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#c8e6c9', borderRadius: '4px', textAlign: 'center' }}>
          <strong style={{ fontSize: '20px', color: '#2e7d32' }}>
            🏆 DataLoader is THE most important GraphQL optimization!
          </strong>
        </div>
      </div>
    </div>
  );
}
