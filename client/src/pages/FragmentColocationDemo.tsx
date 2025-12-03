import { useQuery, gql } from '@apollo/client';

/**
 * Fragment Colocation Demo
 * 
 * Demonstrates the REAL benefit of fragments:
 * Component data requirements live WITH the component (colocation)
 * 
 * Benefits:
 * ✅ Components are self-documenting
 * ✅ Easy to see what data each component needs
 * ✅ Components are portable - move them anywhere
 * ✅ No over-fetching - only request what you need
 * 
 * This is NOT about re-render optimization!
 * This is about code organization and maintainability.
 */

// ========== WITHOUT Fragment Colocation ==========
// Problem: Component data needs are disconnected from the component

function UserAvatarWithoutFragment({ displayName, avatarUrl }: { readonly displayName: string; readonly avatarUrl: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src={avatarUrl} alt={displayName} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
      <span style={{ fontWeight: 'bold' }}>{displayName}</span>
      <small style={{ marginLeft: '8px', color: '#999' }}>(no fragment)</small>
    </div>
  );
}

function PostStatsWithoutFragment({ likeCount, commentCount }: { readonly likeCount: number; readonly commentCount: number }) {
  return (
    <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '14px' }}>
      <span>❤️ {likeCount}</span>
      <span>💬 {commentCount}</span>
      <small style={{ marginLeft: '8px', color: '#999' }}>(hardcoded)</small>
    </div>
  );
}

function PostCardWithoutFragment({ post }: { readonly post: any }) {
  return (
    <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '12px', border: '2px solid #f44336' }}>
      <UserAvatarWithoutFragment displayName={post.author.displayName} avatarUrl={post.author.avatarUrl} />
      <p style={{ margin: '12px 0' }}>{post.content}</p>
      <PostStatsWithoutFragment likeCount={post.likeCount} commentCount={post.commentCount} />
    </div>
  );
}

// Parent query must know ALL nested component needs - tightly coupled!
const GET_POSTS_WITHOUT_FRAGMENTS = gql`
  query GetPostsWithoutFragments {
    feed(first: 2) {
      edges {
        node {
          id
          content
          likeCount
          commentCount
          author {
            id
            displayName
            avatarUrl
          }
        }
      }
    }
  }
`;

// ========== WITH Fragment Colocation ==========
// Solution: Each component declares its own data needs

const USER_AVATAR_FRAGMENT = gql`
  fragment UserAvatarData on User {
    id
    displayName
    avatarUrl
  }
`;

function UserAvatarWithFragment({ displayName, avatarUrl }: { readonly displayName: string; readonly avatarUrl: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src={avatarUrl} alt={displayName} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
      <span style={{ fontWeight: 'bold' }}>{displayName}</span>
      <small style={{ marginLeft: '8px', color: '#4caf50' }}>✓ fragment</small>
    </div>
  );
}
// Export fragment so parent queries can include it
UserAvatarWithFragment.fragments = { user: USER_AVATAR_FRAGMENT };

const POST_STATS_FRAGMENT = gql`
  fragment PostStatsData on Post {
    id
    likeCount
    commentCount
  }
`;

function PostStatsWithFragment({ likeCount, commentCount }: { readonly likeCount: number; readonly commentCount: number }) {
  return (
    <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '14px' }}>
      <span>❤️ {likeCount}</span>
      <span>💬 {commentCount}</span>
      <small style={{ marginLeft: '8px', color: '#4caf50' }}>✓ colocated</small>
    </div>
  );
}
PostStatsWithFragment.fragments = { post: POST_STATS_FRAGMENT };

const POST_CARD_FRAGMENT = gql`
  fragment PostCardData on Post {
    id
    content
    ...PostStatsData
    author {
      ...UserAvatarData
    }
  }
  ${POST_STATS_FRAGMENT}
  ${USER_AVATAR_FRAGMENT}
`;

function PostCardWithFragment({ post }: { readonly post: any }) {
  return (
    <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '12px', border: '2px solid #4caf50' }}>
      <UserAvatarWithFragment displayName={post.author.displayName} avatarUrl={post.author.avatarUrl} />
      <p style={{ margin: '12px 0' }}>{post.content}</p>
      <PostStatsWithFragment likeCount={post.likeCount} commentCount={post.commentCount} />
    </div>
  );
}
PostCardWithFragment.fragments = { post: POST_CARD_FRAGMENT };

// Parent query just references the composed fragment - loosely coupled!
const GET_POSTS_WITH_FRAGMENTS = gql`
  query GetPostsWithFragments {
    feed(first: 2) {
      edges {
        node {
          ...PostCardData
        }
      }
    }
  }
  ${POST_CARD_FRAGMENT}
`;

// ========== Page Component ==========

export function FragmentColocationDemoPage() {
  const { data: dataWithout, loading: loadingWithout } = useQuery(GET_POSTS_WITHOUT_FRAGMENTS);
  const { data: dataWith, loading: loadingWith } = useQuery(GET_POSTS_WITH_FRAGMENTS);

  if (loadingWithout || loadingWith) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  const postsWithout = dataWithout?.feed?.edges || [];
  const postsWith = dataWith?.feed?.edges || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>Fragment Colocation Demo</h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Demonstrates code organization benefits of fragments
        </p>
      </header>

      {/* Explanation */}
      <div style={{ marginBottom: '32px', padding: '24px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
        <h2 style={{ marginTop: 0 }}>💡 What This Demonstrates</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Fragment colocation is about <strong>code organization</strong>, not performance magic.
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          Both sides render the same data with identical performance. The difference is in <strong>maintainability</strong>:
        </p>
        <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <li><strong>Left (Bad):</strong> Parent query hardcodes all nested fields. If UserAvatar needs a new field, you must update every parent query.</li>
          <li><strong>Right (Good):</strong> Each component declares its needs. Adding fields to UserAvatar automatically updates all queries that use it.</li>
        </ul>
      </div>

      {/* Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* LEFT: WITHOUT Fragments */}
        <div>
          <div style={{ padding: '16px', backgroundColor: '#ffebee', borderRadius: '8px', marginBottom: '16px' }}>
            <h2 style={{ color: '#f44336', margin: '0 0 8px 0' }}>❌ WITHOUT Fragment Colocation</h2>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Tightly coupled - parent must know every nested field
            </p>
          </div>
          
          {postsWithout.map((edge: any) => (
            <PostCardWithoutFragment key={edge.node.id} post={edge.node} />
          ))}

          {/* Code Example */}
          <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>The Problem:</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto', margin: 0 }}>
{`query GetPosts {
  feed {
    edges {
      node {
        id
        content
        likeCount      # 😞 Parent must know
        commentCount   # 😞 PostStats needs
        author {
          id
          displayName  # 😞 Parent must know
          avatarUrl    # 😞 UserAvatar needs
        }
      }
    }
  }
}`}
            </pre>
            <p style={{ fontSize: '14px', color: '#f44336', marginTop: '12px', marginBottom: 0 }}>
              🚨 Need to add "username" to UserAvatar? Update 50+ queries!
            </p>
          </div>
        </div>

        {/* RIGHT: WITH Fragments */}
        <div>
          <div style={{ padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px', marginBottom: '16px' }}>
            <h2 style={{ color: '#4caf50', margin: '0 0 8px 0' }}>✅ WITH Fragment Colocation</h2>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Loosely coupled - parent just references fragment
            </p>
          </div>

          {postsWith.map((edge: any) => (
            <PostCardWithFragment key={edge.node.id} post={edge.node} />
          ))}

          {/* Code Example */}
          <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>The Solution:</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto', margin: 0 }}>
{`# Component declares its needs
fragment UserAvatarData on User {
  displayName
  avatarUrl
}

# Parent just references it
query GetPosts {
  feed {
    edges {
      node {
        ...PostCardData  # ✨ Automatic!
      }
    }
  }
}`}
            </pre>
            <p style={{ fontSize: '14px', color: '#4caf50', marginTop: '12px', marginBottom: 0 }}>
              ✅ Add "username" to fragment → ALL queries updated automatically!
            </p>
          </div>
        </div>
      </div>

      {/* When to Use */}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
        <h2>🎯 When Fragment Colocation Shines</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
          <thead>
            <tr style={{ backgroundColor: '#c3e6cb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Scenario</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Use Fragments?</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Reusable component library</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>✅ Yes</td>
              <td style={{ padding: '12px' }}>Components are self-documenting and portable</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Large team (5+ developers)</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>✅ Yes</td>
              <td style={{ padding: '12px' }}>Prevents breaking changes when components evolve</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Complex nested components</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>✅ Yes</td>
              <td style={{ padding: '12px' }}>Parent doesn't need to know child data needs</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Simple single-use page</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>⚠️ Optional</td>
              <td style={{ padding: '12px' }}>Fragments add overhead for one-off components</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #b1dfbb' }}>
              <td style={{ padding: '12px' }}>Prototype/MVP</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>❌ No</td>
              <td style={{ padding: '12px' }}>Optimize for speed, not maintainability</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h2>📊 Key Takeaways</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
          <div>
            <h3 style={{ color: '#2196f3' }}>What Fragments ARE For:</h3>
            <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
              <li>Code organization</li>
              <li>Component portability</li>
              <li>Preventing over-fetching</li>
              <li>Team scalability</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: '#f44336' }}>What Fragments are NOT For:</h3>
            <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
              <li>❌ Preventing re-renders</li>
              <li>❌ Performance optimization</li>
              <li>❌ Reducing network requests</li>
              <li>❌ Database query batching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
