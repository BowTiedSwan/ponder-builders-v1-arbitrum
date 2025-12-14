# Working GraphQL Query for Ponder Index

## Complete Working Query

This query works with the Ponder index schema:

```graphql
# Fragment definition - MUST use lowercase type name
fragment BuilderProject on buildersProject {
  admin
  claimLockEnd
  id
  minimalDeposit
  name
  startsAt
  totalClaimed
  totalStaked
  totalUsers
  withdrawLockPeriodAfterDeposit
  __typename
}

# Query - Note: No $offset variable (Ponder doesn't support offset/skip)
query getBuildersProjects(
  $limit: Int = 1000
  $orderBy: String
  $orderDirection: String
) {
  buildersProjects(
    limit: $limit
    orderBy: $orderBy
    orderDirection: $orderDirection
  ) {
    items {
      ...BuilderProject  # Fragment name is capitalized, type is lowercase
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

## Key Points

1. **Fragment Type**: `on buildersProject` (lowercase) - matches Ponder's generated type
2. **Fragment Name**: `BuilderProject` (capitalized) - can be any name you want
3. **Fragment Spread**: `...BuilderProject` (capitalized) - must match fragment name
4. **No Offset**: Removed `$offset` variable - Ponder uses cursor-based pagination only
5. **Access Items**: Use `.items` to access the array of results

## Common Errors Fixed

### Error 1: Unused Variable `$offset`
**Problem**: Ponder doesn't support `offset` or `skip` parameters
**Solution**: Remove `$offset` variable. Use cursor-based pagination with `before`/`after` if needed.

### Error 2: Fragment Name Mismatch
**Problem**: Fragment spread `...builderProject` doesn't match fragment name `BuilderProject`
**Solution**: Use `...BuilderProject` (capitalized) to match the fragment definition.

## Cursor-Based Pagination Example

If you need pagination, use cursors:

```graphql
query getBuildersProjectsPaginated(
  $limit: Int = 100
  $after: String  # Cursor from previous page
  $orderBy: String = "totalStaked"
  $orderDirection: String = "desc"
) {
  buildersProjects(
    limit: $limit
    after: $after
    orderBy: $orderBy
    orderDirection: $orderDirection
  ) {
    items {
      ...BuilderProject
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor  # Use this for next page
    }
    totalCount
  }
}
```

## Testing in GraphQL Playground

1. Copy the complete query above (including fragment)
2. Paste into GraphQL playground
3. Set variables (optional):
   ```json
   {
     "limit": 10,
     "orderBy": "totalStaked",
     "orderDirection": "desc"
   }
   ```
4. Execute query

## Expected Response Structure

```json
{
  "data": {
    "buildersProjects": {
      "items": [
        {
          "id": "0x...",
          "name": "Project Name",
          "admin": "0x...",
          "totalStaked": "1000000000000000000",
          "totalUsers": "5",
          ...
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "hasPreviousPage": false,
        "startCursor": "...",
        "endCursor": "..."
      },
      "totalCount": 100
    }
  }
}
```
