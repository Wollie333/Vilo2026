# Platform Legal Documents - Quick Reference

**Last Updated**: January 22, 2026

---

## 🚀 Quick Access

**URL**: `http://localhost:5173/admin/billing#legal-settings`

**Required Role**: `super_admin` or `saas_team_member`

**Tab Location**: Admin Billing Settings → Legal Settings tab

---

## 📄 Document Types

| Type | Label | Purpose |
|------|-------|---------|
| `terms_of_service` | Terms of Service | Platform terms for all users |
| `privacy_policy` | Privacy Policy | Data protection practices |
| `cookie_policy` | Cookie Policy | Cookie usage information |
| `acceptable_use` | Acceptable Use Policy | Platform usage rules |

---

## 🔌 API Quick Reference

### Admin Endpoints (Require Auth)

```bash
# List all documents
GET /api/admin/platform-legal/documents

# Get document by ID
GET /api/admin/platform-legal/documents/:id

# Get active document by type
GET /api/admin/platform-legal/documents/type/terms_of_service

# Get all versions
GET /api/admin/platform-legal/documents/type/terms_of_service/versions

# Create new version
POST /api/admin/platform-legal/documents
Body: {
  "document_type": "privacy_policy",
  "title": "Privacy Policy",
  "content": "<h1>...</h1>",
  "version": "1.1",
  "is_active": false
}

# Update document
PUT /api/admin/platform-legal/documents/:id
Body: { "title": "New Title", "content": "..." }

# Activate version
PUT /api/admin/platform-legal/documents/:id/activate

# Delete (soft delete)
DELETE /api/admin/platform-legal/documents/:id
```

### Public Endpoint (No Auth)

```bash
# Get active document (for signup/login pages)
GET /api/platform-legal/active/terms_of_service
```

---

## 💾 Database Queries

```sql
-- View all documents
SELECT document_type, title, version, is_active, created_at
FROM platform_legal_documents
ORDER BY document_type, created_at DESC;

-- Get active documents only
SELECT document_type, title, version
FROM platform_legal_documents
WHERE is_active = true;

-- Get version history for Terms of Service
SELECT version, title, is_active, created_at
FROM platform_legal_documents
WHERE document_type = 'terms_of_service'
ORDER BY created_at DESC;

-- Manually activate a version (use with caution!)
BEGIN;
  -- Deactivate all versions of this type
  UPDATE platform_legal_documents
  SET is_active = false
  WHERE document_type = 'privacy_policy';

  -- Activate specific version
  UPDATE platform_legal_documents
  SET is_active = true
  WHERE id = 'document-id-here';
COMMIT;
```

---

## 🎨 Frontend Code Snippets

### Load Active Document

```typescript
import * as platformLegalService from '@/services/platform-legal.service';

const terms = await platformLegalService.getPlatformLegalDocumentByType('terms_of_service');
console.log(terms.title, terms.version); // "Vilo Platform Terms of Service" "1.0"
```

### Load All Versions

```typescript
const versions = await platformLegalService.getPlatformLegalDocumentVersions('privacy_policy');
console.log(versions.length); // Number of versions
```

### Create New Version

```typescript
const newDoc = await platformLegalService.createPlatformLegalDocument({
  document_type: 'cookie_policy',
  title: 'Updated Cookie Policy',
  content: '<h1>Cookie Policy v2</h1><p>...</p>',
  version: '2.0',
  is_active: false,
  effective_date: '2026-03-01T00:00:00Z'
});
```

### Activate Version

```typescript
await platformLegalService.activatePlatformLegalDocument(documentId);
toast.success('Version activated successfully');
```

---

## 🔒 Access Control

### RLS Policies

**Public Read (Active Documents)**:
```sql
CREATE POLICY "Anyone can view active platform legal documents"
  ON platform_legal_documents FOR SELECT
  USING (is_active = true);
```

**Admin Management**:
```sql
CREATE POLICY "Super admins can manage platform legal documents"
  ON platform_legal_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'saas_team_member')
    )
  );
```

---

## 🐛 Common Issues

### Tab Not Visible
- Check user role: `SELECT name FROM user_types ut JOIN users u ON u.user_type_id = ut.id WHERE u.id = 'user-id';`
- Verify BillingSettingsPageRedesigned includes legal-settings tab

### Documents Not Loading
- Check migration ran: `SELECT COUNT(*) FROM platform_legal_documents;` (should be 4)
- Check RLS enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'platform_legal_documents';`

### API 401 Errors
- Verify token is valid and not expired
- Check user has correct role
- Test with curl: `curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/admin/platform-legal/documents`

### Version Activation Not Working
- Check only one version is active per type: `SELECT document_type, COUNT(*) FROM platform_legal_documents WHERE is_active = true GROUP BY document_type;`
- Each type should have count = 1

---

## 📝 Version Format

**Valid Formats**:
- `1.0` ✅
- `1.1` ✅
- `2.0.1` ✅
- `10.5.3` ✅

**Invalid Formats**:
- `v1.0` ❌
- `1` ❌
- `1.0.0.0` ❌
- `1.0-beta` ❌

**Regex**: `^\d+\.\d+(\.\d+)?$`

---

## 🔄 Typical Workflows

### Updating a Policy

1. Navigate to Legal Settings tab
2. Select document type
3. Click "Create New Version" (when implemented)
4. Edit content in WYSIWYG editor
5. Increment version (e.g., 1.0 → 1.1)
6. Set effective date (optional)
7. Save (creates as inactive)
8. Test new version
9. Click "Activate" when ready
10. Old version becomes inactive automatically

### Rolling Back to Previous Version

1. View version history
2. Find previous version
3. Click "Activate"
4. Confirm action
5. Previous version becomes active

### Creating First Version for New Document Type

1. Add new enum value to database
2. Update validators and types
3. Update frontend DOCUMENT_TYPES config
4. Run migration to seed initial document
5. Verify in Legal Settings tab

---

## 📊 Monitoring

### Check Document Status

```sql
-- Quick status check
SELECT
  document_type,
  COUNT(*) as total_versions,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_versions
FROM platform_legal_documents
GROUP BY document_type;
```

Expected result: 1 active version per type

### View Recent Changes

```sql
SELECT
  document_type,
  version,
  title,
  is_active,
  created_at,
  updated_at
FROM platform_legal_documents
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;
```

---

## 🎯 Best Practices

✅ **DO**:
- Increment version on every content change
- Set effective_date for future policy updates
- Test new versions before activating
- Keep version history for compliance
- Use descriptive titles

❌ **DON'T**:
- Delete documents (use soft delete)
- Activate untested versions
- Skip version increments
- Modify content without version change
- Use same version number twice

---

## 🚨 Emergency Procedures

### Revert to Previous Version (Urgent)

```sql
-- Find previous version ID
SELECT id, version, created_at
FROM platform_legal_documents
WHERE document_type = 'terms_of_service'
AND is_active = false
ORDER BY created_at DESC
LIMIT 1;

-- Activate it
BEGIN;
UPDATE platform_legal_documents SET is_active = false WHERE document_type = 'terms_of_service';
UPDATE platform_legal_documents SET is_active = true WHERE id = 'previous-version-id';
COMMIT;
```

### Temporarily Disable All Policies

```sql
-- Emergency disable (use with extreme caution!)
UPDATE platform_legal_documents SET is_active = false;
-- Re-enable specific version
UPDATE platform_legal_documents SET is_active = true WHERE id = 'safe-version-id';
```

---

## 📞 Support Contacts

**Implementation**: Claude AI Assistant
**Date**: January 22, 2026
**Documentation**: `PLATFORM_LEGAL_DOCS_IMPLEMENTATION.md`

For detailed documentation, see the full implementation guide.
