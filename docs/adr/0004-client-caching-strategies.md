
# Client-Side Only Caching Strategies (Public/Private, Field Variation)

## Context and Problem Statement
How should the frontend cache data, supporting both public and private data, and field-level cache variation? What tooling and proof-of-concept approaches are effective?

## Decision Drivers
- Fast client performance
- Support for both public and private data
- Flexibility for field-level cache variation
- Maintainability and tooling support

## Considered Options
- Field-level cache keys and strategies
- Global cache for all data
- No client-side caching

## Decision Outcome
Chosen option: "Field-level cache keys and strategies", because it provides the most flexibility and performance for varying data requirements.

## Consequences
- Good: Fast UI, flexible cache
- Bad: More complex cache management

## Validation
- Proof-of-concept implementations
- Code review and user testing

## Pros and Cons of the Options
### Field-level cache keys and strategies
- Good: Flexibility, performance
- Bad: Complexity

### Global cache for all data
- Good: Simplicity
- Bad: Not flexible for varying fields

### No client-side caching
- Good: Simplicity
- Bad: Poor performance

## More Information
Documented in code and onboarding. Revisit as frontend requirements evolve.
