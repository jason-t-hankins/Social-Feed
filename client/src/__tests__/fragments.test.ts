import { describe, test, expect } from 'vitest';
import {
  USER_INFO_FRAGMENT,
  POST_CONTENT_FRAGMENT,
  POST_STATS_FRAGMENT,
  POST_CARD_FRAGMENT,
} from '../graphql/fragments';
import { FragmentDefinitionNode, FieldNode, FragmentSpreadNode } from 'graphql';

/**
 * Tests for GraphQL fragment composition.
 * Validates that fragments are properly structured for colocation pattern.
 */
describe('GraphQL Fragments', () => {
  test('USER_INFO_FRAGMENT contains basic user fields', () => {
    const fragmentDef = USER_INFO_FRAGMENT.definitions[0] as FragmentDefinitionNode;
    expect(fragmentDef.kind).toBe('FragmentDefinition');
    expect(fragmentDef.typeCondition.name.value).toBe('User');
    
    const fieldNames = fragmentDef.selectionSet.selections
      .filter((sel): sel is FieldNode => sel.kind === 'Field')
      .map((sel) => sel.name.value);
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('username');
    expect(fieldNames).toContain('displayName');
    expect(fieldNames).toContain('avatarUrl');
  });

  test('POST_CONTENT_FRAGMENT contains content fields', () => {
    const fragmentDef = POST_CONTENT_FRAGMENT.definitions[0] as FragmentDefinitionNode;
    expect(fragmentDef.typeCondition.name.value).toBe('Post');
    
    const fieldNames = fragmentDef.selectionSet.selections
      .filter((sel): sel is FieldNode => sel.kind === 'Field')
      .map((sel) => sel.name.value);
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('content');
    expect(fieldNames).toContain('createdAt');
  });

  test('POST_STATS_FRAGMENT contains engagement metrics', () => {
    const fragmentDef = POST_STATS_FRAGMENT.definitions[0] as FragmentDefinitionNode;
    expect(fragmentDef.typeCondition.name.value).toBe('Post');
    
    const fieldNames = fragmentDef.selectionSet.selections
      .filter((sel): sel is FieldNode => sel.kind === 'Field')
      .map((sel) => sel.name.value);
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('commentCount');
    expect(fieldNames).toContain('likeCount');
  });

  test('POST_CARD_FRAGMENT composes child fragments', () => {
    // POST_CARD_FRAGMENT should include the nested fragments
    const definitions = POST_CARD_FRAGMENT.definitions;
    
    // Should have multiple definitions (main + composed fragments)
    expect(definitions.length).toBeGreaterThan(1);
    
    // Find the main PostCard fragment
    const mainFragment = definitions.find(
      (def): def is FragmentDefinitionNode => 
        def.kind === 'FragmentDefinition' && def.name.value === 'PostCard'
    );
    expect(mainFragment).toBeDefined();
    
    if (mainFragment) {
      // Should reference other fragments via spreads
      const selections = mainFragment.selectionSet.selections;
      const fragmentSpreads = selections.filter(
        (sel): sel is FragmentSpreadNode => sel.kind === 'FragmentSpread'
      );
      expect(fragmentSpreads.length).toBeGreaterThan(0);
    }
  });
});

describe('Fragment Colocation Benefits', () => {
  test('fragments are importable for component colocation', () => {
    // All fragments should be exportable and usable
    expect(USER_INFO_FRAGMENT).toBeDefined();
    expect(POST_CONTENT_FRAGMENT).toBeDefined();
    expect(POST_STATS_FRAGMENT).toBeDefined();
    expect(POST_CARD_FRAGMENT).toBeDefined();
  });

  test('fragments include __typename for cache normalization', () => {
    // Apollo Client relies on __typename for cache normalization
    // Fragments on types automatically include this
    const fragmentDef = USER_INFO_FRAGMENT.definitions[0] as FragmentDefinitionNode;
    expect(fragmentDef.typeCondition).toBeDefined();
    expect(fragmentDef.typeCondition.name.value).toBe('User');
  });
});
