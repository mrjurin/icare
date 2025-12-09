# Data Organization Refactoring Plan

## Current State Analysis

### Current Hierarchy
```
Parliament (orphaned - only linked to localities)
  └── (missing link)
      └── DUN
          └── Zone
              └── Village (should be under Cawangan)
```

### Issues Identified

1. **Missing Parliament → DUN Relationship**
   - `duns` table has no `parliamentId` field
   - Parliament exists but is not part of the main hierarchy
   - Only linked to `localities` (reference data)

2. **Missing Cawangan Entity**
   - No `cawangan` table exists
   - Villages are directly linked to Zones
   - Should be: Zone → Cawangan → Village

3. **Incomplete Hierarchy**
   - Current: Parliament (orphaned) → DUN → Zone → Village
   - Required: Parliament → DUN → Zone → Cawangan → Village

4. **Zone Creation Missing DUN Selection**
   - `zones` table requires `dunId` (NOT NULL constraint)
   - But `createZone()` function doesn't accept `dunId` parameter
   - `ZoneFormModal` doesn't have DUN selection dropdown
   - This is a bug that needs fixing

## Target Structure

```
Parliament
  └── has many DUN
      └── has many Zone
          └── has many Cawangan
              └── has many Village
```

## Refactoring Steps

### Phase 1: Add Parliament → DUN Relationship

**1.1 Database Schema Changes**
- Add `parliamentId` field to `duns` table
- Add foreign key constraint
- Add index for performance
- Migration: `0018_add_parliament_to_duns.sql`

**1.2 Schema File Updates**
- Update `src/db/schema.ts`:
  - Add `parliamentId` to `duns` table definition
  - Update `dunsRelations` to include parliament relation
  - Add `parliamentsRelations` to include duns relation

**1.3 Data Migration**
- Create migration script to populate `parliamentId` for existing DUNs
- May need manual mapping or import from SPR data

**1.4 Code Updates**
- Update DUN actions/queries to include parliament filtering
- Update forms to show parliament selection when creating/editing DUNs
- Update UI components to display parliament → DUN hierarchy
- **Fix Zone Creation Bug**: Update `createZone()` to require `dunId`
- **Fix Zone Form**: Add DUN selection dropdown to `ZoneFormModal`
- Update `CreateZoneInput` type to include `dunId`

### Phase 2: Create Cawangan Entity

**2.1 Database Schema Changes**
- Create new `cawangan` table with:
  - `id` (primary key)
  - `zoneId` (foreign key to zones)
  - `name` (required)
  - `code` (optional)
  - `description` (optional)
  - `isActive` (boolean, default true)
  - `createdAt`, `updatedAt` timestamps
- Migration: `0019_add_cawangan_table.sql`

**2.2 Update Villages Table**
- Change `villages.zoneId` → `villages.cawanganId`
- Add migration to:
  1. Create `cawangan` table
  2. Create default cawangan for each zone (or migrate existing data)
  3. Update villages to link to cawangan instead of zone
  4. Drop old `zoneId` column (or keep for backward compatibility initially)
- Migration: `0020_move_villages_to_cawangan.sql`

**2.3 Schema File Updates**
- Add `cawangan` table definition
- Update `villages` table to reference `cawangan` instead of `zones`
- Add relations:
  - `zonesRelations`: add `cawangan: many(cawangan)`
  - `cawanganRelations`: add `zone: one(zones)`, `villages: many(villages)`
  - `villagesRelations`: change from `zone` to `cawangan`

**2.4 Code Updates**
- Create `src/lib/actions/cawangan.ts`:
  - `getCawangan()`
  - `getCawanganById()`
  - `createCawangan()`
  - `updateCawangan()`
  - `deleteCawangan()`
  - `getCawanganByZone()`
- Update `src/lib/actions/villages.ts`:
  - Change all `zoneId` references to `cawanganId`
  - Update access control logic
- Update `src/lib/actions/zones.ts`:
  - Add methods to get cawangan for zones
- Create UI components:
  - `src/app/[locale]/(admin)/admin/cawangan/page.tsx`
  - `src/app/[locale]/(admin)/admin/cawangan/CawanganTable.tsx`
  - `src/app/[locale]/(admin)/admin/cawangan/CawanganFormModal.tsx`

### Phase 3: Update Related Entities

**3.1 Households**
- Currently linked to `zoneId`
- Consider if households should link to `cawanganId` or stay at zone level
- Decision needed: Should households be at zone or cawangan level?

**3.2 Role Assignments**
- Currently has `zoneId` and `villageId`
- May need `cawanganId` field for cawangan-level roles
- Update `roleAssignments` table if needed

**3.3 AIDS Programs**
- `aidsProgramZones` table links programs to zones/villages
- May need `aidsProgramCawangan` table or update existing structure
- Update `aidsProgramAssignments` if ketua cawangan assignments need cawangan reference

**3.4 Profiles**
- Currently has `zoneId` and `villageId`
- May need `cawanganId` field

**3.5 Staff**
- Currently has `zoneId` for zone leaders
- May need `cawanganId` for ketua cawangan

### Phase 4: Update Access Control

**4.1 Access Control Logic**
- Update `src/lib/utils/accessControl.ts`:
  - Add cawangan-level access control
  - Update zone access to consider cawangan hierarchy
  - Add `getAccessibleCawanganIds()` function

**4.2 Role-Based Access**
- Zone leaders: access to their zone and all cawangan/villages within
- Ketua Cawangan: access to their cawangan and villages within
- Super Admin/ADUN: access to all

### Phase 5: Update UI Components

**5.1 Navigation & Breadcrumbs**
- Update navigation to show: Parliament → DUN → Zone → Cawangan → Village
- Add breadcrumb components showing full hierarchy

**5.2 Forms & Tables**
- Update all forms to show hierarchy dropdowns
- Update tables to display hierarchy columns
- Add filters for parliament/DUN/zone/cawangan

**5.3 Reports**
- Update reports to support filtering by cawangan
- Add cawangan-level statistics
- Update existing reports to include cawangan in hierarchy

### Phase 6: Data Migration Strategy

**6.1 Existing Data**
- Create default cawangan for each zone (1:1 initially)
- Migrate villages to link to default cawangan
- Allow manual reorganization after migration

**6.2 SPR Data Import**
- Update SPR import to populate parliament → DUN relationship
- Ensure cawangan data is created/imported correctly

**6.3 Backward Compatibility**
- Consider keeping `villages.zoneId` temporarily
- Add computed columns or views if needed
- Plan deprecation timeline

## Implementation Order

1. **Phase 1**: Add Parliament → DUN relationship (foundational)
2. **Phase 2**: Create Cawangan entity (core structure)
3. **Phase 3**: Update related entities (dependencies)
4. **Phase 4**: Update access control (security)
5. **Phase 5**: Update UI (user experience)
6. **Phase 6**: Data migration (data integrity)

## Files to Create/Modify

### New Files
- `drizzle/0018_add_parliament_to_duns.sql`
- `drizzle/0019_add_cawangan_table.sql`
- `drizzle/0020_move_villages_to_cawangan.sql`
- `src/lib/actions/cawangan.ts`
- `src/app/[locale]/(admin)/admin/cawangan/page.tsx`
- `src/app/[locale]/(admin)/admin/cawangan/CawanganTable.tsx`
- `src/app/[locale]/(admin)/admin/cawangan/CawanganFormModal.tsx`

### Files to Modify
- `src/db/schema.ts` (major changes)
- `src/lib/actions/villages.ts` (change zoneId to cawanganId)
- `src/lib/actions/zones.ts` (add cawangan methods)
- `src/lib/utils/accessControl.ts` (add cawangan access)
- All UI components referencing villages/zones
- Reports and statistics queries

## Testing Checklist

- [ ] Parliament → DUN relationship works
- [ ] DUN → Zone relationship still works
- [ ] Zone → Cawangan relationship works
- [ ] Cawangan → Village relationship works
- [ ] Access control respects hierarchy
- [ ] Forms allow creating/editing at each level
- [ ] Reports filter correctly by hierarchy
- [ ] Data migration preserves existing data
- [ ] SPR import populates hierarchy correctly
- [ ] UI displays full hierarchy correctly

## Risks & Considerations

1. **Data Loss Risk**: Migration must preserve all existing villages
2. **Breaking Changes**: Many queries will need updates
3. **Performance**: Additional joins may impact query performance
4. **User Training**: Users need to understand new hierarchy
5. **Rollback Plan**: Keep ability to rollback if issues arise

## Questions to Resolve

1. Should households link to zone or cawangan?
2. Should role assignments include cawanganId?
3. How to handle existing villages during migration?
4. Should cawangan be optional or required?
5. What happens to zones with no cawangan?
