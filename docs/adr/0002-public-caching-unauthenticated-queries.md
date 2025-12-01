
# Public Caching for Unauthenticated Queries (No JWT, Comcast, APQ)

## Context and Problem Statement
How should we cache public GraphQL queries for unauthenticated users, given the absence of JWTs and the need for compatibility with Comcast and Apollo Persisted Queries (APQ)?

## Decision Drivers
- Reduce backend load for public data
- Ensure fast response times for unauthenticated users
- Avoid leaking private data
- Compatibility with Comcast and APQ

## Considered Options
- Enable public caching for unauthenticated queries
- No caching (always fetch from backend)
- Partial caching (cache only some queries)

## Decision Outcome
Chosen option: "Enable public caching for unauthenticated queries", because it provides the best performance and scalability for public data, with careful separation from authenticated flows.

## Consequences
- Good: Faster responses, reduced backend load
- Bad: Must ensure no private data is cached

## Validation
- Review cache keys and logic
- Test with Comcast and APQ
- Code review

## Pros and Cons of the Options
### Enable public caching
- Good: Performance, scalability
- Bad: Risk of accidental data leaks if not careful

### No caching
- Good: Simplicity, no risk of leaks
- Bad: Poor performance, unnecessary backend load

### Partial caching
- Good: Flexibility
- Bad: Complexity, risk of inconsistent behavior

## More Information
Revisit if Comcast or APQ requirements change. Documented in onboarding and code comments.
