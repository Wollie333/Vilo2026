#!/usr/bin/env ts-node

/**
 * Schema Documentation Generator
 *
 * Automatically generates SCHEMA.md documentation from migration files.
 *
 * Features:
 * - Lists all tables with columns, types, constraints
 * - Generates Mermaid relationship diagrams
 * - Documents indexes and their purposes
 * - Tracks change history from migrations
 *
 * Usage:
 *   npm run schema:generate-docs
 *   ts-node scripts/generate-schema-docs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
}

interface Table {
  name: string;
  columns: Column[];
  indexes: string[];
  constraints: string[];
  description?: string;
  migrationNumber: string;
}

interface SchemaInfo {
  tables: Map<string, Table>;
  relationships: Array<{ from: string; to: string; type: string }>;
  migrationCount: number;
}

// ============================================================================
// Main Generator
// ============================================================================

async function generateSchemaDocs() {
  console.log('🔍 Analyzing migration files...\n');

  const migrationsDir = path.join(process.cwd(), 'backend/migrations');
  const schema = await analyzeMigrations(migrationsDir);

  console.log(`✅ Found ${schema.tables.size} tables across ${schema.migrationCount} migrations\n`);

  console.log('📝 Generating SCHEMA.md...\n');

  const markdown = generateMarkdown(schema);
  const outputPath = path.join(process.cwd(), 'SCHEMA.md');

  fs.writeFileSync(outputPath, markdown, 'utf-8');

  console.log(`✅ Schema documentation generated: ${outputPath}\n`);
  console.log(`📊 Summary:`);
  console.log(`   - Tables: ${schema.tables.size}`);
  console.log(`   - Relationships: ${schema.relationships.length}`);
  console.log(`   - Migrations analyzed: ${schema.migrationCount}`);
}

// ============================================================================
// Migration Analysis
// ============================================================================

async function analyzeMigrations(migrationsDir: string): Promise<SchemaInfo> {
  const schema: SchemaInfo = {
    tables: new Map(),
    relationships: [],
    migrationCount: 0,
  };

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const migrationNumber = file.split('_')[0];

    analyzeMigrationFile(content, migrationNumber, schema);
    schema.migrationCount++;
  }

  return schema;
}

function analyzeMigrationFile(content: string, migrationNumber: string, schema: SchemaInfo) {
  // Find CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const tableBody = match[2];

    if (!schema.tables.has(tableName)) {
      schema.tables.set(tableName, {
        name: tableName,
        columns: [],
        indexes: [],
        constraints: [],
        migrationNumber,
      });
    }

    const table = schema.tables.get(tableName)!;
    parseTableColumns(tableBody, table, schema);
  }

  // Find ALTER TABLE ADD COLUMN
  const alterRegex = /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+([\w\(\),\s]+)/gi;

  while ((match = alterRegex.exec(content)) !== null) {
    const tableName = match[1];
    const columnName = match[2];
    const columnType = match[3].trim();

    if (schema.tables.has(tableName)) {
      const table = schema.tables.get(tableName)!;
      table.columns.push({
        name: columnName,
        type: columnType,
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
      });
    }
  }

  // Find CREATE INDEX
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(?:public\.)?(\w+)/gi;

  while ((match = indexRegex.exec(content)) !== null) {
    const indexName = match[1];
    const tableName = match[2];

    if (schema.tables.has(tableName)) {
      const table = schema.tables.get(tableName)!;
      if (!table.indexes.includes(indexName)) {
        table.indexes.push(indexName);
      }
    }
  }
}

function parseTableColumns(tableBody: string, table: Table, schema: SchemaInfo) {
  const lines = tableBody.split(',').map((l) => l.trim());

  for (const line of lines) {
    // Skip constraint definitions
    if (
      line.match(/^CONSTRAINT/i) ||
      line.match(/^PRIMARY KEY/i) ||
      line.match(/^FOREIGN KEY/i) ||
      line.match(/^UNIQUE/i) ||
      line.match(/^CHECK/i)
    ) {
      continue;
    }

    // Parse column definition
    const columnMatch = line.match(/^(\w+)\s+([\w\(\),\s]+)/);
    if (columnMatch) {
      const columnName = columnMatch[1];
      const rest = columnMatch[2];

      const column: Column = {
        name: columnName,
        type: extractType(rest),
        nullable: !rest.includes('NOT NULL'),
        isPrimaryKey: rest.includes('PRIMARY KEY'),
        isForeignKey: rest.includes('REFERENCES'),
      };

      // Extract foreign key reference
      if (column.isForeignKey) {
        const refMatch = rest.match(/REFERENCES\s+(?:public\.)?(\w+)/);
        if (refMatch) {
          column.references = refMatch[1];
          schema.relationships.push({
            from: table.name,
            to: refMatch[1],
            type: 'belongs_to',
          });
        }
      }

      // Extract default value
      const defaultMatch = rest.match(/DEFAULT\s+([^\s,]+)/);
      if (defaultMatch) {
        column.defaultValue = defaultMatch[1];
      }

      table.columns.push(column);
    }
  }
}

function extractType(definition: string): string {
  // Extract base type (UUID, INTEGER, TEXT, VARCHAR(255), etc.)
  const typeMatch = definition.match(/^([\w\(\),\s]+?)(?:\s+(?:NOT\s+NULL|NULL|DEFAULT|PRIMARY|REFERENCES|UNIQUE|CHECK))/i);
  if (typeMatch) {
    return typeMatch[1].trim();
  }
  return definition.split(/\s+/)[0];
}

// ============================================================================
// Markdown Generation
// ============================================================================

function generateMarkdown(schema: SchemaInfo): string {
  const lines: string[] = [];

  // Header
  lines.push('# Database Schema - Vilo Platform');
  lines.push('');
  lines.push('**Auto-generated documentation**');
  lines.push(`**Generated**: ${new Date().toISOString().split('T')[0]}`);
  lines.push(`**Total Tables**: ${schema.tables.size}`);
  lines.push(`**Total Relationships**: ${schema.relationships.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table of Contents
  lines.push('## Table of Contents');
  lines.push('');
  const sortedTables = Array.from(schema.tables.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const table of sortedTables) {
    lines.push(`- [${table.name}](#${table.name.toLowerCase()})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Entity Relationship Diagram
  lines.push('## Entity Relationship Diagram');
  lines.push('');
  lines.push('```mermaid');
  lines.push('erDiagram');

  // Add relationships
  const addedRelationships = new Set<string>();
  for (const rel of schema.relationships) {
    const key = `${rel.from}-${rel.to}`;
    if (!addedRelationships.has(key)) {
      lines.push(`    ${rel.from} ||--o{ ${rel.to} : "has"`);
      addedRelationships.add(key);
    }
  }

  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table Details
  lines.push('## Table Details');
  lines.push('');

  for (const table of sortedTables) {
    lines.push(`### ${table.name}`);
    lines.push('');
    lines.push(`**Migration**: ${table.migrationNumber}`);
    lines.push('');

    // Columns table
    lines.push('| Column | Type | Nullable | Default | Notes |');
    lines.push('|--------|------|----------|---------|-------|');

    for (const col of table.columns) {
      const notes: string[] = [];
      if (col.isPrimaryKey) notes.push('PK');
      if (col.isForeignKey) notes.push(`FK → ${col.references}`);

      lines.push(
        `| ${col.name} | ${col.type} | ${col.nullable ? 'Yes' : 'No'} | ${col.defaultValue || '-'} | ${notes.join(', ') || '-'} |`
      );
    }

    lines.push('');

    // Indexes
    if (table.indexes.length > 0) {
      lines.push('**Indexes**:');
      for (const idx of table.indexes) {
        lines.push(`- \`${idx}\``);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  // Statistics
  lines.push('## Statistics');
  lines.push('');
  lines.push(`- **Total Tables**: ${schema.tables.size}`);
  lines.push(`- **Total Columns**: ${Array.from(schema.tables.values()).reduce((sum, t) => sum + t.columns.length, 0)}`);
  lines.push(`- **Total Indexes**: ${Array.from(schema.tables.values()).reduce((sum, t) => sum + t.indexes.length, 0)}`);
  lines.push(`- **Total Relationships**: ${schema.relationships.length}`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('**Note**: This documentation is auto-generated from migration files.');
  lines.push('To regenerate: `npm run schema:generate-docs`');
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Execute
// ============================================================================

generateSchemaDocs().catch((error) => {
  console.error('\n❌ Error generating schema documentation:', error);
  process.exit(1);
});
