# Schema Fixes Applied

## Overview

This document summarizes the changes made to align the current Ponder schema with the expected schema documented in `GRAPHQL_SUBGRAPH_SCHEMA.md`.

## Changes Made

### 1. ✅ Fixed Field Types: Int → BigInt

**buildersProject table:**
- `totalUsers`: Changed from `t.integer()` to `t.bigint()` to match expected `BigInt!` type

**counters table:**
- `totalBuildersProjects`: Changed from `t.integer()` to `t.bigint()` to match expected `BigInt!` type
- `totalSubnets`: Changed from `t.integer()` to `t.bigint()` to match expected `BigInt!` type

### 2. ✅ Fixed Relationship Field Name

**buildersUserRelations:**
- Changed relationship field name from `project` to `buildersProject` to match expected schema
- This affects GraphQL queries: `buildersUser.buildersProject` instead of `buildersUser.project`

### 3. ✅ Updated Code References

**src/index.ts:**
- Updated `totalUsers` initialization: `0` → `0n`
- Updated `totalUsers` assignment: `existingUsers[0].count` → `BigInt(existingUsers[0].count)`
- Updated `totalBuildersProjects` initialization: `0` → `0n`
- Updated `totalSubnets` initialization: `0` → `0n`
- Updated `totalBuildersProjects` increment: `counter.totalBuildersProjects + 1` → `BigInt(counter.totalBuildersProjects) + 1n`

## Remaining Considerations

### Bytes vs String Type

**Status:** ⚠️ Note for future consideration

The expected schema uses `Bytes!` type for addresses/IDs, but Ponder's `t.hex()` generates `String!` in GraphQL. However, according to the documentation:
- `Bytes` is "represented as hex string" (line 487 of GRAPHQL_SUBGRAPH_SCHEMA.md)
- Functionally, `String` (hex) and `Bytes` are equivalent in JSON responses

**Impact:** GraphQL clients that strictly validate types may expect `Bytes!` but receive `String!`. However, since both are represented as hex strings, most clients should work fine.

**Recommendation:** Monitor client compatibility. If strict type checking is required, consider:
1. Using a GraphQL schema customization layer
2. Documenting that addresses are hex strings
3. Checking if Ponder supports Bytes scalar type customization

### Extra Fields Not in Expected Schema

**Status:** ✅ Kept for internal tracking

The following fields are kept in the schema but are not part of the documented expected schema:

**buildersProject:**
- `chainId` (Int)
- `contractAddress` (String/hex)
- `createdAt` (Int)
- `createdAtBlock` (BigInt)

**buildersUser:**
- `buildersProjectId` (explicit foreign key)
- `lastDeposit` (BigInt)
- `virtualDeposited` (BigInt)
- `chainId` (Int)

**counters:**
- `totalStaked` (BigInt)
- `totalUsers` (Int)
- `lastUpdated` (Int)

**Rationale:** These fields provide useful metadata and don't break compatibility. They're simply not queried by clients expecting the documented schema.

### Additional Entities

**Status:** ✅ Kept (not in expected schema)

The following entities exist but are not documented in the expected schema:
- `stakingEvent` - Event history tracking
- `morTransfer` - MOR token transfer tracking  
- `dynamicSubnet` - Dynamic subnet tracking

**Rationale:** These are additive and don't interfere with the documented schema.

## Compatibility Status

### ✅ Fixed Issues
- [x] `totalUsers` type: `Int` → `BigInt`
- [x] `totalBuildersProjects` type: `Int` → `BigInt`
- [x] `totalSubnets` type: `Int` → `BigInt`
- [x] Relationship field name: `project` → `buildersProject`

### ⚠️ Remaining Considerations
- [ ] `Bytes` vs `String` type (functional compatibility, but type name differs)
- [ ] Extra fields (non-breaking, but not in documented schema)

## Testing Recommendations

1. **Verify GraphQL Schema Generation:**
   ```bash
   # After running ponder dev, check generated/schema.graphql
   # Verify totalUsers, totalBuildersProjects, totalSubnets are BigInt
   # Verify buildersProject relationship field exists
   ```

2. **Test GraphQL Queries:**
   ```graphql
   query TestSchema {
     buildersProjects {
       id
       totalUsers  # Should be BigInt
       admin
     }
     buildersUsers {
       buildersProject {  # Should work (not "project")
         id
         name
       }
     }
     counters {
       totalBuildersProjects  # Should be BigInt
       totalSubnets  # Should be BigInt
     }
   }
   ```

3. **Verify Type Conversions:**
   - Ensure BigInt values are properly serialized as strings in JSON responses
   - Verify integer counts are correctly converted to BigInt in all code paths

## Migration Notes

If deploying to an existing database with data:

1. **Data Migration Required:**
   - `totalUsers` in `buildersProject` table: Convert existing `INTEGER` values to `BIGINT`
   - `totalBuildersProjects` in `counters` table: Convert existing `INTEGER` values to `BIGINT`
   - `totalSubnets` in `counters` table: Convert existing `INTEGER` values to `BIGINT`

2. **Schema Migration:**
   ```sql
   -- Example migration (adjust based on your database)
   ALTER TABLE builders_project ALTER COLUMN total_users TYPE BIGINT;
   ALTER TABLE counters ALTER COLUMN total_builders_projects TYPE BIGINT;
   ALTER TABLE counters ALTER COLUMN total_subnets TYPE BIGINT;
   ```

3. **Code Compatibility:**
   - All code now uses BigInt for these fields
   - Ensure any external code reading these values handles BigInt/string conversion

## Summary

The schema has been updated to match the expected schema for:
- ✅ Field types (Int → BigInt for counts)
- ✅ Relationship field names (`buildersProject`)

The schema remains compatible with the documented expected schema, with some additional fields and entities that don't interfere with the documented interface.
