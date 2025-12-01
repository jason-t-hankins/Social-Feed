
# UseFragment vs HTTP Batch + DataLoader for GraphQL Optimization

## Context and Problem Statement
The Social-Feed project must optimize GraphQL data fetching for both developer experience and backend efficiency. Should we use colocated fragments (`useFragment`), HTTP batching with DataLoader, or a hybrid? We also need to consider Apollo Persisted Queries (APQ) and real-world performance via A/B testing.

## Decision Drivers
- Minimize N+1 queries and network/database load
- Maximize developer experience and maintainability
- Compatibility with APQ and batching
- Real-world performance (A/B test results)

## Considered Options
- UseFragment (fragment colocation)
- HTTP Batch + Facebook DataLoader
- Hybrid approach (combine both)

## Decision Outcome
Chosen option: "Hybrid approach", because it allows modular UI development (via fragments) and backend efficiency (via batching/DataLoader). A/B tests and APQ compatibility are documented in [docs/USEFRAGMENT_VS_DATALOADER.md](../USEFRAGMENT_VS_DATALOADER.md).

## Consequences
- Good: Improved performance, maintainability, and modularity
- Bad: Increased complexity in query composition and debugging

## Validation
- A/B tests on real screens
- Review of APQ and batching compatibility
- Code review and performance monitoring

## Pros and Cons of the Options
### UseFragment
- Good: Modular, colocated data requirements, easy to reason about
- Bad: Can lead to N+1 queries if not paired with batching/DataLoader

### HTTP Batch + DataLoader
- Good: Efficient backend/database access, solves N+1
- Bad: Can make query composition and cache management harder

### Hybrid approach
- Good: Combines best of both, flexible
- Bad: More moving parts, requires discipline

## More Information
See [docs/USEFRAGMENT_VS_DATALOADER.md](../USEFRAGMENT_VS_DATALOADER.md) for detailed evaluation, test results, and guidance. Revisit if Apollo or community best practices change.
