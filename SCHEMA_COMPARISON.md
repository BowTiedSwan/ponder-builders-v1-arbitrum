# Schema Compatibility Analysis

## Overview

This document compares the current Ponder schema (`generated/schema.graphql`) with the expected schema documented in `GRAPHQL_SUBGRAPH_SCHEMA.md`.

## Summary

**Status: ⚠️ PARTIALLY COMPATIBLE with BREAKING CHANGES**

The current schema has the core fields needed but includes several breaking changes and type mismatches that would prevent direct compatibility with existing GraphQL clients expecting the documented schema.

---

## Detailed Comparison

### 1. BuildersProject Entity

#### Field Type Mismatches (BREAKING)

| Field | Expected Type | Current Type | Status |
|-------|--------------|--------------|--------|
| `id` | `Bytes!` | `String!` | ❌ BREAKING |
| `admin` | `Bytes!` | `String!` | ❌ BREAKING |
| `totalUsers` | `BigInt!` | `Int!` | ❌ BREAKING |

#### Extra Fields (Non-breaking additions)

| Field | Type | Notes |
|-------|------|-------|
| `chainId` | `Int!` | Not in expected schema |
| `contractAddress` | `String!` | Not in expected schema |
| `createdAt` | `Int!` | Not in expected schema |
| `createdAtBlock` | `BigInt!` | Not in expected schema |

#### Matching Fields ✅

- `name: String!`
- `minimalDeposit: BigInt!`
- `totalStaked: BigInt!`
- `totalClaimed: BigInt!`
- `startsAt: BigInt!`
- `claimLockEnd: BigInt!`
- `withdrawLockPeriodAfterDeposit: BigInt!`

#### Relationship Differences

- **Expected**: Users accessed via `buildersUsers` query with `where: { buildersProject_: { id: $projectId } }`
- **Current**: Users accessed via `users` field on `buildersProject` type (nested relationship)

---

### 2. BuildersUser Entity

#### Field Type Mismatches (BREAKING)

| Field | Expected Type | Current Type | Status |
|-------|--------------|--------------|--------|
| `id` | `Bytes!` | `String!` | ❌ BREAKING |
| `address` | `Bytes!` | `String!` | ❌ BREAKING |
| `buildersProject` | `BuildersProject` (relationship) | `buildersProjectId: String!` + `project: buildersProject` | ⚠️ Different pattern |

#### Extra Fields (Non-breaking additions)

| Field | Type | Notes |
|-------|------|-------|
| `buildersProjectId` | `String!` | Explicit foreign key field |
| `lastDeposit` | `BigInt!` | Not in expected schema |
| `virtualDeposited` | `BigInt!` | Not in expected schema |
| `chainId` | `Int!` | Not in expected schema |

#### Matching Fields ✅

- `staked: BigInt!`
- `claimed: BigInt!`
- `claimLockEnd: BigInt!`
- `lastStake: BigInt!`

#### Relationship Differences

- **Expected**: `buildersProject` field provides direct relationship
- **Current**: `project` field provides relationship (different name)

---

### 3. Counter Entity

#### Field Type Mismatches (BREAKING)

| Field | Expected Type | Current Type | Status |
|-------|--------------|--------------|--------|
| `totalBuildersProjects` | `BigInt!` | `Int!` | ❌ BREAKING |
| `totalSubnets` | `BigInt!` | `Int!` | ❌ BREAKING |

#### Extra Fields (Non-breaking additions)

| Field | Type | Notes |
|-------|------|-------|
| `totalStaked` | `BigInt!` | Not in expected schema |
| `totalUsers` | `Int!` | Not in expected schema |
| `lastUpdated` | `Int!` | Not in expected schema |

#### Matching Fields ✅

- `id: String!`

---

### 4. Additional Entities (Not in Expected Schema)

The current schema includes entities that are **not documented** in the expected schema:

1. **stakingEvent** - Event history tracking
2. **morTransfer** - MOR token transfer tracking
3. **dynamicSubnet** - Dynamic subnet tracking

These are **additions** and don't break compatibility, but they're not part of the documented schema.

---

## Breaking Changes Summary

### Critical Breaking Changes

1. **Type Mismatches**:
   - `Bytes` → `String` for addresses/IDs (affects: `id`, `admin`, `address` fields)
   - `BigInt` → `Int` for counts (affects: `totalUsers`, `totalBuildersProjects`, `totalSubnets`)

2. **Field Name Differences**:
   - `buildersProject` → `project` (relationship field name)

3. **Query Pattern Differences**:
   - Expected uses nested filters: `buildersUsers(where: { buildersProject_: { id: $projectId } })`
   - Current uses direct relationship: `buildersProject.users`

### Impact Assessment

#### High Impact (Will Break Existing Clients)
- Type changes (`Bytes` → `String`, `BigInt` → `Int`) will cause GraphQL query failures
- Field name changes (`buildersProject` → `project`) will break nested queries

#### Medium Impact (May Require Client Updates)
- Extra fields are non-breaking but may confuse clients
- Different query patterns may require client refactoring

#### Low Impact (Enhancements)
- Additional entities (`stakingEvent`, `morTransfer`, `dynamicSubnet`) are additive
- Extra metadata fields (`chainId`, `createdAt`, etc.) don't break compatibility

---

## Compatibility Assessment

### Can Existing Queries Work? ❌ NO

**Example Query from Documentation:**
```graphql
query getBuildersProjects {
  buildersProjects {
    id          # Expected: Bytes, Got: String ✅ (works but different type)
    admin       # Expected: Bytes, Got: String ✅ (works but different type)
    totalUsers  # Expected: BigInt, Got: Int ❌ (type mismatch - may cause issues)
  }
}
```

**Example User Query:**
```graphql
query getBuildersProjectUsers($buildersProjectId: Bytes!) {
  buildersUsers(
    where: { buildersProject_: { id: $buildersProjectId } }
  ) {
    address     # Expected: Bytes, Got: String ✅ (works but different type)
    buildersProject {  # Expected: buildersProject, Got: project ❌ (field name mismatch)
      id
      name
    }
  }
}
```

---

## Recommendations

### Option 1: Align Current Schema with Expected Schema (Recommended)

To achieve full compatibility:

1. **Change field types**:
   - `id`, `admin`, `address` fields: `String` → `Bytes` (or keep as `String` but document as hex)
   - `totalUsers`, `totalBuildersProjects`, `totalSubnets`: `Int` → `BigInt`

2. **Rename relationship field**:
   - `project` → `buildersProject` in `buildersUser`

3. **Support nested filtering**:
   - Ensure `buildersUsers(where: { buildersProject_: { id: $projectId } })` works

### Option 2: Update Documentation

If the current schema is intentional:

1. Update `GRAPHQL_SUBGRAPH_SCHEMA.md` to reflect:
   - `String` types for addresses (as hex strings)
   - `Int` types for counts
   - `project` relationship field name
   - Additional fields and entities

### Option 3: Hybrid Approach

1. Keep current schema but add aliases/compatibility layer
2. Support both query patterns
3. Document differences clearly

---

## Migration Path

If migrating from expected schema to current schema:

1. **Update GraphQL queries**:
   - Change `Bytes` variables to `String`
   - Change `BigInt` count fields to `Int`
   - Update relationship field names (`buildersProject` → `project`)

2. **Update client code**:
   - Handle `String` instead of `Bytes` for addresses
   - Handle `Int` instead of `BigInt` for counts
   - Update nested query patterns

3. **Test thoroughly**:
   - Verify all queries work with new types
   - Check pagination and filtering
   - Validate relationship queries

---

## Conclusion

The schemas are **NOT fully compatible** due to:
- Type mismatches (`Bytes`/`String`, `BigInt`/`Int`)
- Field name differences (`buildersProject` vs `project`)
- Different query patterns

However, the **core data structure is similar**, and with appropriate type conversions and query updates, clients can be adapted to work with the current schema.

**Recommendation**: Decide whether to align the current schema with the documented schema or update the documentation to match the current implementation.
