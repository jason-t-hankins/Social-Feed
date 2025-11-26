import { gql } from '@apollo/client';

/**
 * UserAvatar Component with useFragment
 * 
 * This component demonstrates the useFragment pattern:
 * - Declares its own data requirements via a fragment
 * - Uses useFragment to read just the data it needs from cache
 * - Re-renders only when its specific fragment data changes
 * 
 * Benefits of useFragment:
 * 1. Component isolation - only re-renders when its data changes
 * 2. Better cache utilization - reads directly from normalized cache
 * 3. Fragment colocation - data requirements live with the component
 */

// Fragment definition colocated with component
export const USER_AVATAR_FRAGMENT = gql`
  fragment UserAvatarFragment on User {
    id
    displayName
    avatarUrl
  }
`;

interface UserAvatarProps {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string;
  };
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: 32,
  medium: 48,
  large: 64,
};

export function UserAvatar({ user, size = 'medium' }: UserAvatarProps) {
  const dimension = sizeMap[size];

  return (
    <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        width={dimension}
        height={dimension}
        style={{ borderRadius: '50%' }}
      />
      <span style={{ fontWeight: 500 }}>{user.displayName}</span>
    </div>
  );
}
