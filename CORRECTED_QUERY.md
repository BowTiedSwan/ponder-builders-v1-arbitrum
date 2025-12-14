# Corrected GraphQL Query for Ponder Schema

## Issues with Original Query

The original query has several incompatibilities with Ponder's generated schema:

1. **Type name**: Uses `BuildersProject` (capitalized) but Ponder generates `buildersProject` (lowercase)
2. **Enums**: Uses `BuildersProject_orderBy` and `OrderDirection` enums, but Ponder uses `String` types
3. **Pagination**: Uses `first`/`skip` but Ponder uses `limit`/`before`/`after`
4. **Return type**: Expects direct array but Ponder returns `buildersProjectPage!` with `items` field

## Corrected Query (Ponder-Compatible)

```graphql
# Fragment definition - Note: lowercase type name
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

# Query using fragment - Compatible with Ponder schema
query getBuildersProjects(
  $limit: Int = 1000
  $orderBy: String
  $orderDirection: String
  $before: String
  $after: String
) {
  buildersProjects(
    limit: $limit
    orderBy: $orderBy
    orderDirection: $orderDirection
    before: $before
    after: $after
  ) {
    items {
      ...BuilderProject
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

## Alternative: Query Matching Expected Schema Pattern

If you want to match the expected schema pattern more closely (using `first`/`skip`), you'll need to adapt it:

```graphql
# Fragment definition
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

# Query without offset (Ponder uses cursor-based pagination)
# Note: If you need offset pagination, use cursor-based with before/after instead
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
      ...BuilderProject
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

## Order By Values

Since Ponder uses `String` instead of enums, you need to pass the field name as a string:

**Valid `orderBy` values:**
- `"id"`
- `"name"`
- `"admin"`
- `"minimalDeposit"`
- `"totalStaked"`
- `"totalClaimed"`
- `"totalUsers"`
- `"startsAt"`
- `"claimLockEnd"`
- `"withdrawLockPeriodAfterDeposit"`

**Valid `orderDirection` values:**
- `"asc"`
- `"desc"`

## Example Usage

```graphql
query {
  buildersProjects(
    limit: 100
    orderBy: "totalStaked"
    orderDirection: "desc"
  ) {
    items {
      id
      name
      totalStaked
      totalUsers
    }
    totalCount
  }
}
```

## Notes

1. **Schema Regeneration**: After the changes to `ponder.schema.ts`, you need to regenerate the schema:
   ```bash
   ponder dev  # or ponder build
   ```
   This will update `totalUsers` from `Int!` to `BigInt!`.

2. **Type Compatibility**: The query uses lowercase `buildersProject` to match Ponder's generated schema. If you need to maintain compatibility with clients expecting `BuildersProject`, you may need:
   - A GraphQL schema transformation layer
   - Or update clients to use lowercase type names

3. **Pagination**: Ponder uses cursor-based pagination (`before`/`after`) rather than offset-based (`first`/`skip`). If you need offset-based pagination, you'll need to implement it client-side or use a wrapper.

4. **Field Types**: After regeneration, `totalUsers` will be `BigInt!` matching the expected schema.
