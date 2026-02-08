import { expect } from 'chai';
import {
  parseDiff,
  calculateDiffStats,
  isLargeDiff,
  generateCompactDiffSummary,
  processDiffIntelligently,
  buildPrompt,
  estimateTokens,
  FileChange,
} from '../gemini';

// ---------------------------------------------------------------------------
// Test data: realistic git diff strings
// ---------------------------------------------------------------------------

const SINGLE_FILE_ADD_DIFF = `diff --git a/src/utils.ts b/src/utils.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/utils.ts
@@ -0,0 +1,5 @@
+export function add(a: number, b: number): number {
+  return a + b;
+}
+
+export const VERSION = '1.0.0';
`;

const SINGLE_FILE_MODIFY_DIFF = `diff --git a/src/config.ts b/src/config.ts
index abc1234..def5678 100644
--- a/src/config.ts
+++ b/src/config.ts
@@ -1,4 +1,4 @@
 export interface Config {
-  model: string;
+  model: 'gpt-4' | 'gemini';
   language: 'en' | 'es';
 }
`;

const DELETED_FILE_DIFF = `diff --git a/src/old-module.ts b/src/old-module.ts
deleted file mode 100644
index abc1234..0000000
--- a/src/old-module.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-export function deprecated() {
-  return 'old';
-}
`;

const RENAMED_FILE_DIFF = `diff --git a/src/helpers.ts b/src/utils/helpers.ts
similarity index 90%
rename from src/helpers.ts
rename to src/utils/helpers.ts
index abc1234..def5678 100644
--- a/src/helpers.ts
+++ b/src/utils/helpers.ts
@@ -1,3 +1,4 @@
 export function format(text: string): string {
   return text.trim();
 }
+export function capitalize(s: string): string { return s[0].toUpperCase() + s.slice(1); }
`;

const BINARY_FILE_DIFF = `diff --git a/icon.png b/icon.png
new file mode 100644
index 0000000..abc1234
Binary files /dev/null and b/icon.png differ
`;

const MULTIPLE_FILES_DIFF = `diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +1,4 @@
 const x = 1;
+const y = 2;
 const z = 3;
 export { x, z };
diff --git a/src/b.ts b/src/b.ts
index 3333333..4444444 100644
--- a/src/b.ts
+++ b/src/b.ts
@@ -1,2 +1,2 @@
-import { x } from './a';
+import { x, y } from './a';
 console.log(x);
`;

const MULTIPLE_HUNKS_DIFF = `diff --git a/src/app.ts b/src/app.ts
index aaa1111..bbb2222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,4 +1,5 @@
 import express from 'express';
+import cors from 'cors';

 const app = express();

@@ -10,3 +11,7 @@
 app.get('/', (req, res) => {
   res.send('Hello');
 });
+
+app.get('/health', (req, res) => {
+  res.json({ status: 'ok' });
+});
`;

// ---------------------------------------------------------------------------
// parseDiff()
// ---------------------------------------------------------------------------

describe('parseDiff', () => {
  it('should parse a single new file addition', () => {
    const files = parseDiff(SINGLE_FILE_ADD_DIFF);
    expect(files).to.have.lengthOf(1);
    const f = files[0];
    expect(f.path).to.equal('src/utils.ts');
    expect(f.isNew).to.be.true;
    expect(f.isDeleted).to.be.false;
    expect(f.isRenamed).to.be.false;
    expect(f.isBinary).to.be.false;
    expect(f.additions).to.equal(5);
    expect(f.deletions).to.equal(0);
    expect(f.changes.filter(c => c.type === 'addition')).to.have.lengthOf(5);
  });

  it('should parse a single file modification', () => {
    const files = parseDiff(SINGLE_FILE_MODIFY_DIFF);
    expect(files).to.have.lengthOf(1);
    const f = files[0];
    expect(f.path).to.equal('src/config.ts');
    expect(f.isNew).to.be.false;
    expect(f.isDeleted).to.be.false;
    expect(f.additions).to.equal(1);
    expect(f.deletions).to.equal(1);
  });

  it('should parse a deleted file', () => {
    const files = parseDiff(DELETED_FILE_DIFF);
    expect(files).to.have.lengthOf(1);
    const f = files[0];
    expect(f.path).to.equal('src/old-module.ts');
    expect(f.isDeleted).to.be.true;
    expect(f.deletions).to.equal(3);
    expect(f.additions).to.equal(0);
  });

  it('should parse a renamed file', () => {
    const files = parseDiff(RENAMED_FILE_DIFF);
    expect(files).to.have.lengthOf(1);
    const f = files[0];
    expect(f.path).to.equal('src/utils/helpers.ts');
    expect(f.isRenamed).to.be.true;
    expect(f.oldPath).to.equal('src/helpers.ts');
    expect(f.additions).to.equal(1);
  });

  it('should parse a binary file', () => {
    const files = parseDiff(BINARY_FILE_DIFF);
    expect(files).to.have.lengthOf(1);
    const f = files[0];
    expect(f.path).to.equal('icon.png');
    expect(f.isBinary).to.be.true;
    expect(f.isNew).to.be.true;
    expect(f.additions).to.equal(0);
    expect(f.deletions).to.equal(0);
    expect(f.changes).to.have.lengthOf(0);
  });

  it('should parse multiple files', () => {
    const files = parseDiff(MULTIPLE_FILES_DIFF);
    expect(files).to.have.lengthOf(2);
    expect(files[0].path).to.equal('src/a.ts');
    expect(files[1].path).to.equal('src/b.ts');
    expect(files[0].additions).to.equal(1);
    expect(files[1].additions).to.equal(1);
    expect(files[1].deletions).to.equal(1);
  });

  it('should parse multiple hunks in a single file', () => {
    const files = parseDiff(MULTIPLE_HUNKS_DIFF);
    expect(files).to.have.lengthOf(1);
    const f = files[0];
    expect(f.path).to.equal('src/app.ts');
    expect(f.additions).to.equal(5);
    expect(f.deletions).to.equal(0);
  });

  it('should return empty array for empty input', () => {
    expect(parseDiff('')).to.deep.equal([]);
  });
});

// ---------------------------------------------------------------------------
// calculateDiffStats()
// ---------------------------------------------------------------------------

describe('calculateDiffStats', () => {
  it('should return zeroes for empty array', () => {
    const stats = calculateDiffStats([]);
    expect(stats.totalFiles).to.equal(0);
    expect(stats.totalAdditions).to.equal(0);
    expect(stats.totalDeletions).to.equal(0);
    expect(stats.totalChanges).to.equal(0);
  });

  it('should calculate stats for a single file', () => {
    const files = parseDiff(SINGLE_FILE_ADD_DIFF);
    const stats = calculateDiffStats(files);
    expect(stats.totalFiles).to.equal(1);
    expect(stats.totalAdditions).to.equal(5);
    expect(stats.totalDeletions).to.equal(0);
    expect(stats.totalChanges).to.equal(5);
  });

  it('should calculate stats for multiple files', () => {
    const files = parseDiff(MULTIPLE_FILES_DIFF);
    const stats = calculateDiffStats(files);
    expect(stats.totalFiles).to.equal(2);
    expect(stats.totalAdditions).to.equal(2);
    expect(stats.totalDeletions).to.equal(1);
    expect(stats.totalChanges).to.equal(3);
  });

  it('should sum additions and deletions correctly across many files', () => {
    const combined = SINGLE_FILE_ADD_DIFF + DELETED_FILE_DIFF + MULTIPLE_FILES_DIFF;
    const files = parseDiff(combined);
    const stats = calculateDiffStats(files);
    expect(stats.totalFiles).to.equal(4);
    expect(stats.totalAdditions).to.equal(5 + 0 + 2);
    expect(stats.totalDeletions).to.equal(0 + 3 + 1);
    expect(stats.totalChanges).to.equal(stats.totalAdditions + stats.totalDeletions);
  });
});

// ---------------------------------------------------------------------------
// estimateTokens()
// ---------------------------------------------------------------------------

describe('estimateTokens', () => {
  it('should estimate tokens based on character count', () => {
    // 100 chars / 2.5 = 40 tokens
    const text = 'a'.repeat(100);
    expect(estimateTokens(text)).to.equal(40);
  });

  it('should round up', () => {
    // 7 chars / 2.5 = 2.8 → 3
    expect(estimateTokens('abcdefg')).to.equal(3);
  });

  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).to.equal(0);
  });
});

// ---------------------------------------------------------------------------
// isLargeDiff()
// ---------------------------------------------------------------------------

describe('isLargeDiff', () => {
  it('should return false for small diffs', () => {
    expect(isLargeDiff(SINGLE_FILE_ADD_DIFF)).to.be.false;
  });

  it('should return false for moderate multi-file diffs', () => {
    expect(isLargeDiff(MULTIPLE_FILES_DIFF)).to.be.false;
  });

  it('should return true when >50 files changed', () => {
    // Build a diff with 51 minimal files
    const manyFiles: FileChange[] = Array.from({ length: 51 }, (_, i) => ({
      path: `src/file${i}.ts`,
      additions: 1,
      deletions: 0,
      changes: [{ type: 'addition' as const, line: 'x', lineNumber: 1 }],
      isBinary: false,
      isNew: false,
      isDeleted: false,
      isRenamed: false,
    }));
    // Pass a short diff string (under token limit) but pre-parsed files > 50
    expect(isLargeDiff('short', manyFiles)).to.be.true;
  });

  it('should return true when >500 total changes', () => {
    const bigFile: FileChange[] = [{
      path: 'big.ts',
      additions: 300,
      deletions: 201,
      changes: [],
      isBinary: false,
      isNew: false,
      isDeleted: false,
      isRenamed: false,
    }];
    expect(isLargeDiff('short', bigFile)).to.be.true;
  });

  it('should return true when estimated tokens > 15000', () => {
    // 15000 tokens * 2.5 chars/token = 37500 chars needed
    const longDiff = 'a'.repeat(37501);
    const smallFiles: FileChange[] = [{
      path: 'x.ts',
      additions: 1,
      deletions: 0,
      changes: [],
      isBinary: false,
      isNew: false,
      isDeleted: false,
      isRenamed: false,
    }];
    expect(isLargeDiff(longDiff, smallFiles)).to.be.true;
  });
});

// ---------------------------------------------------------------------------
// generateCompactDiffSummary()
// ---------------------------------------------------------------------------

describe('generateCompactDiffSummary', () => {
  it('should include statistics header', () => {
    const files = parseDiff(MULTIPLE_FILES_DIFF);
    const summary = generateCompactDiffSummary(files);
    expect(summary).to.include('## Diff Summary');
    expect(summary).to.include('2 files changed');
    expect(summary).to.include('2 insertions(+)');
    expect(summary).to.include('1 deletion(-)');
  });

  it('should label new files', () => {
    const files = parseDiff(SINGLE_FILE_ADD_DIFF);
    const summary = generateCompactDiffSummary(files);
    expect(summary).to.include('**Status**: New file');
  });

  it('should label deleted files', () => {
    const files = parseDiff(DELETED_FILE_DIFF);
    const summary = generateCompactDiffSummary(files);
    expect(summary).to.include('**Status**: Deleted');
  });

  it('should label renamed files with old path', () => {
    const files = parseDiff(RENAMED_FILE_DIFF);
    const summary = generateCompactDiffSummary(files);
    expect(summary).to.include('**Status**: Renamed from `src/helpers.ts`');
  });

  it('should label binary files', () => {
    const files = parseDiff(BINARY_FILE_DIFF);
    const summary = generateCompactDiffSummary(files);
    expect(summary).to.include('**Type**: Binary file');
  });

  it('should truncate changes when exceeding maxLinesPerFile', () => {
    const files = parseDiff(SINGLE_FILE_ADD_DIFF);
    // The file has 5 additions, 4 non-empty → set maxLinesPerFile to 2
    const summary = generateCompactDiffSummary(files, 2);
    expect(summary).to.include('... and');
    expect(summary).to.include('more changes');
  });

  it('should not truncate when within maxLinesPerFile', () => {
    const files = parseDiff(SINGLE_FILE_ADD_DIFF);
    const summary = generateCompactDiffSummary(files, 100);
    expect(summary).to.not.include('... and');
  });

  it('should show singular form for 1 file and 1 insertion', () => {
    const files = parseDiff(SINGLE_FILE_MODIFY_DIFF);
    const summary = generateCompactDiffSummary(files);
    expect(summary).to.include('1 file changed');
    expect(summary).to.include('1 insertion(+)');
    expect(summary).to.include('1 deletion(-)');
  });
});

// ---------------------------------------------------------------------------
// processDiffIntelligently()
// ---------------------------------------------------------------------------

describe('processDiffIntelligently', () => {
  it('should pass through small diffs unchanged', () => {
    const result = processDiffIntelligently(SINGLE_FILE_ADD_DIFF);
    expect(result.wasCompacted).to.be.false;
    expect(result.content).to.equal(SINGLE_FILE_ADD_DIFF);
    expect(result.stats.totalFiles).to.equal(1);
  });

  it('should compact large diffs', () => {
    // Create a diff large enough to trigger compaction (>15000 tokens)
    let hugeDiff = '';
    for (let i = 0; i < 100; i++) {
      hugeDiff += `diff --git a/src/file${i}.ts b/src/file${i}.ts
index 1111111..2222222 100644
--- a/src/file${i}.ts
+++ b/src/file${i}.ts
@@ -1,3 +1,10 @@
 const existing = true;
+const added1_${i} = 'value';
+const added2_${i} = 'value';
+const added3_${i} = 'value';
+const added4_${i} = 'value';
+const added5_${i} = 'value';
+const added6_${i} = 'value';
+const added7_${i} = 'value';
 export default existing;
`;
    }
    const result = processDiffIntelligently(hugeDiff);
    expect(result.wasCompacted).to.be.true;
    expect(result.content).to.include('## Diff Summary');
    expect(result.stats.totalFiles).to.equal(100);
  });

  it('should return correct stats regardless of compaction', () => {
    const result = processDiffIntelligently(MULTIPLE_FILES_DIFF);
    expect(result.stats.totalFiles).to.equal(2);
    expect(result.stats.totalAdditions).to.equal(2);
    expect(result.stats.totalDeletions).to.equal(1);
    expect(result.stats.totalChanges).to.equal(3);
  });
});

// ---------------------------------------------------------------------------
// buildPrompt()
// ---------------------------------------------------------------------------

describe('buildPrompt', () => {
  it('should include English instruction by default', () => {
    const prompt = buildPrompt('some diff', 'en');
    expect(prompt).to.include('ENGLISH');
    expect(prompt).to.not.include('SPANISH');
  });

  it('should include Spanish instruction when language is es', () => {
    const prompt = buildPrompt('some diff', 'es');
    expect(prompt).to.include('SPANISH');
    expect(prompt).to.not.include('ENGLISH');
  });

  it('should include the diff content in a code block', () => {
    const prompt = buildPrompt('my-diff-content', 'en');
    expect(prompt).to.include('```diff\nmy-diff-content\n```');
  });

  it('should include large commit context when compacted', () => {
    const stats = { totalFiles: 60, totalAdditions: 300, totalDeletions: 200, totalChanges: 500, estimatedTokens: 0 };
    const prompt = buildPrompt('summary', 'en', true, stats);
    expect(prompt).to.include('Large Commit Context');
    expect(prompt).to.include('60 files');
    expect(prompt).to.include('500 total changes');
    expect(prompt).to.include('COMPACT SUMMARY');
  });

  it('should not include large commit context when not compacted', () => {
    const prompt = buildPrompt('diff', 'en', false);
    expect(prompt).to.not.include('Large Commit Context');
    expect(prompt).to.not.include('COMPACT SUMMARY');
  });

  it('should include compacted analysis guidance for large diffs', () => {
    const stats = { totalFiles: 10, totalAdditions: 5, totalDeletions: 5, totalChanges: 10, estimatedTokens: 0 };
    const prompt = buildPrompt('diff', 'en', true, stats);
    expect(prompt).to.include('MAIN PURPOSE');
    expect(prompt).to.include('HIGH-LEVEL impact');
  });

  it('should include regular analysis guidance for normal diffs', () => {
    const prompt = buildPrompt('diff', 'en', false);
    expect(prompt).to.include('WHAT functions/components/features');
    expect(prompt).to.include('RELATIONSHIPS');
  });

  it('should include Conventional Commits rules', () => {
    const prompt = buildPrompt('diff', 'en');
    expect(prompt).to.include('Conventional Commits');
    expect(prompt).to.include('feat:');
    expect(prompt).to.include('fix:');
  });
});
