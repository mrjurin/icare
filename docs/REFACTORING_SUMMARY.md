# Data Organization Refactoring - Executive Summary

## Current vs Target Structure

### Current Structure (Incomplete)
```
┌─────────────┐
│ Parliament  │ (orphaned, only linked to localities)
└─────────────┘
       │ (missing link)
       ▼
┌─────────────┐
│    DUN      │
└─────────────┘
       │
       ▼
┌─────────────┐
│    Zone     │ (requires dunId but form doesn't collect it - BUG)
└─────────────┘
       │
       ▼
┌─────────────┐
│  Village    │ (should be under Cawangan)
└─────────────┘
```

### Target Structure (Complete Hierarchy)
```
┌─────────────┐
│ Parliament  │
└─────────────┘
       │ has many
       ▼
┌─────────────┐
│    DUN      │ (needs parliamentId)
└─────────────┘
       │ has many
       ▼
┌─────────────┐
│    Zone     │ (needs dunId selection in form)
└─────────────┘
       │ has many
       ▼
┌─────────────┐
│  Cawangan   │ (NEW - needs to be created)
└─────────────┘
       │ has many
       ▼
┌─────────────┐
│  Village    │ (needs to link to cawanganId instead of zoneId)
└─────────────┘
```

## Key Issues Found

### 🔴 Critical Issues

1. **Zone Creation Bug**
   - Database requires `dunId` (NOT NULL)
   - But `createZone()` function doesn't accept `dunId`
   - Form doesn't have DUN dropdown
   - **Impact**: Zone creation will fail or use wrong DUN

2. **Missing Cawangan Entity**
   - No table exists for Cawangan
   - Villages directly under Zones
   - **Impact**: Cannot properly organize villages by cawangan

### 🟡 Important Issues

3. **Missing Parliament → DUN Link**
   - DUNs not linked to Parliament
   - Parliament only used for localities (reference data)
   - **Impact**: Cannot filter/organize by Parliament

4. **Incomplete Hierarchy in UI**
   - Forms don't show full hierarchy
   - Reports may not filter correctly
   - **Impact**: Poor user experience, incomplete data organization

## Database Schema Changes Required

### 1. Add Parliament to DUNs
```sql
ALTER TABLE duns ADD COLUMN parliament_id INTEGER REFERENCES parliaments(id);
CREATE INDEX duns_parliament_idx ON duns(parliament_id);
```

### 2. Create Cawangan Table
```sql
CREATE TABLE cawangan (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code VARCHAR(20),
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX cawangan_zone_idx ON cawangan(zone_id);
CREATE INDEX cawangan_name_idx ON cawangan(name);
```

### 3. Migrate Villages to Cawangan
```sql
-- Step 1: Create default cawangan for each zone
INSERT INTO cawangan (zone_id, name, code)
SELECT id, name || ' - Default Cawangan', code || '-C1'
FROM zones;

-- Step 2: Add cawangan_id to villages
ALTER TABLE villages ADD COLUMN cawangan_id INTEGER REFERENCES cawangan(id);

-- Step 3: Link villages to default cawangan
UPDATE villages v
SET cawangan_id = (
  SELECT c.id FROM cawangan c WHERE c.zone_id = v.zone_id LIMIT 1
);

-- Step 4: Make cawangan_id NOT NULL and remove zone_id
ALTER TABLE villages ALTER COLUMN cawangan_id SET NOT NULL;
-- Keep zone_id temporarily for backward compatibility, remove later
```

## Code Changes Required

### Priority 1: Fix Zone Creation Bug
- [ ] Update `CreateZoneInput` type to include `dunId: number`
- [ ] Update `createZone()` to require and use `dunId`
- [ ] Add DUN dropdown to `ZoneFormModal`
- [ ] Load DUNs list in zone form

### Priority 2: Add Parliament → DUN Link
- [ ] Add `parliamentId` to `duns` table schema
- [ ] Update DUN actions to include parliament
- [ ] Add parliament dropdown to DUN forms
- [ ] Update queries to filter by parliament

### Priority 3: Create Cawangan Entity
- [ ] Create `cawangan` table migration
- [ ] Create `src/lib/actions/cawangan.ts`
- [ ] Create cawangan UI components
- [ ] Update villages to use `cawanganId`

### Priority 4: Update Related Entities
- [ ] Decide: Should households link to zone or cawangan?
- [ ] Update role assignments if needed
- [ ] Update AIDS program assignments
- [ ] Update profiles if needed
- [ ] Update staff assignments if needed

## Migration Strategy

### Phase 1: Fix Immediate Bugs (Week 1)
1. Fix zone creation to require DUN
2. Add parliament → DUN relationship
3. Update all forms to show hierarchy

### Phase 2: Add Cawangan (Week 2)
1. Create cawangan table
2. Create default cawangan for each zone
3. Migrate villages to cawangan
4. Update all village-related code

### Phase 3: Update Related Systems (Week 3)
1. Update access control
2. Update reports
3. Update imports/exports
4. Update UI navigation

### Phase 4: Testing & Cleanup (Week 4)
1. Test all CRUD operations
2. Test access control
3. Test reports
4. Remove deprecated fields
5. Update documentation

## Estimated Impact

### Files to Create
- 3 migration files
- 1 action file (`cawangan.ts`)
- 3 UI component files
- **Total: ~7 new files**

### Files to Modify
- `src/db/schema.ts` (major changes)
- `src/lib/actions/zones.ts` (fix bug + add cawangan methods)
- `src/lib/actions/villages.ts` (change to cawanganId)
- `src/lib/utils/accessControl.ts` (add cawangan access)
- All zone/village UI components (~10 files)
- Reports (~5 files)
- **Total: ~20 files**

### Database Changes
- 1 new table (cawangan)
- 1 new column (duns.parliament_id)
- 1 column change (villages.zone_id → villages.cawangan_id)
- Multiple index updates

## Risk Assessment

### Low Risk ✅
- Adding parliament to DUNs (new optional field initially)
- Creating cawangan table (new entity)

### Medium Risk ⚠️
- Migrating villages to cawangan (data migration)
- Updating all village queries (many files)

### High Risk 🔴
- Zone creation bug fix (may break existing functionality)
- Access control changes (security impact)

## Questions to Answer Before Implementation

1. **Households**: Should they link to zone or cawangan?
   - Recommendation: Keep at zone level (zones are larger administrative units)

2. **Cawangan Required?**: Can zones exist without cawangan?
   - Recommendation: Yes, allow empty zones initially

3. **Migration Strategy**: How to handle existing villages?
   - Recommendation: Create 1 default cawangan per zone, migrate all villages

4. **Backward Compatibility**: Keep `villages.zone_id` temporarily?
   - Recommendation: Yes, keep for 1-2 releases, then remove

5. **Role Assignments**: Add `cawanganId` field?
   - Recommendation: Yes, for ketua cawangan roles

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Answer questions** above
3. **Prioritize** which phase to start with
4. **Create tickets** for each phase
5. **Start with Phase 1** (fix zone creation bug - critical)
