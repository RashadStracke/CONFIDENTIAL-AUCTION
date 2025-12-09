/**
 * @chapter: automation
 * FHEVM Documentation Generator Script
 *
 * Automatically generates documentation from code annotations.
 * Parses @chapter tags in comments and creates GitBook-compatible markdown.
 *
 * Usage:
 *   npx ts-node scripts/generate-docs.ts [--output=docs] [--format=gitbook]
 *
 * Features:
 *   - Extracts documentation from JSDoc/TSDoc comments
 *   - Generates chapter-based documentation
 *   - Creates table of contents
 *   - Supports cross-references
 *   - Generates API reference
 */

import * as fs from "fs";
import * as path from "path";

interface ChapterSection {
  chapter: string;
  title: string;
  items: DocumentationItem[];
}

interface DocumentationItem {
  name: string;
  type: "function" | "contract" | "test" | "script";
  chapter: string;
  description: string;
  file: string;
  lineNumber: number;
  content: string;
}

interface DocumentationConfig {
  outputDir: string;
  format: "gitbook" | "markdown";
  sourceDir: string;
}

/**
 * Parse command line arguments
 */
function parseArguments(args: string[]): DocumentationConfig {
  let outputDir = "docs";
  let format: "gitbook" | "markdown" = "gitbook";
  let sourceDir = ".";

  for (const arg of args) {
    if (arg.startsWith("--output=")) {
      outputDir = arg.replace("--output=", "");
    } else if (arg.startsWith("--format=")) {
      format = arg.replace("--format=", "") as "gitbook" | "markdown";
    } else if (arg.startsWith("--source=")) {
      sourceDir = arg.replace("--source=", "");
    }
  }

  return { outputDir, format, sourceDir };
}

/**
 * Extract documentation from JSDoc comments
 */
function extractDocumentation(
  content: string,
  filePath: string
): DocumentationItem[] {
  const items: DocumentationItem[] = [];

  // Regex to match JSDoc blocks and chapter tags
  const docBlockRegex =
    /\/\*\*\s*([\s\S]*?)\*\/\s*(?:function|contract|describe|it|interface|type)\s+(\w+)/g;
  const chapterRegex = /@chapter:\s*([a-z\-]+)/;
  const descRegex = /@description:\s*([^\n]+)/;

  let match;
  let lineNumber = 1;

  while ((match = docBlockRegex.exec(content)) !== null) {
    const docBlock = match[1];
    const name = match[2];

    const chapterMatch = docBlock.match(chapterRegex);
    const descMatch = docBlock.match(descRegex);

    if (chapterMatch) {
      const chapter = chapterMatch[1];
      const description = descMatch ? descMatch[1].trim() : docBlock.split("\n")[0].trim();

      items.push({
        name,
        type: "function",
        chapter,
        description,
        file: filePath,
        lineNumber,
        content: docBlock.trim(),
      });
    }

    lineNumber += match[0].split("\n").length;
  }

  return items;
}

/**
 * Recursively scan directory for TypeScript/Solidity files
 */
function scanDirectory(dir: string): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".tsx", ".sol", ".js"];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    // Skip node_modules and hidden directories
    if (entry.name.startsWith(".") || entry.name === "node_modules") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath));
    } else if (
      extensions.some((ext) => entry.name.endsWith(ext))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Collect all documentation from source files
 */
function collectDocumentation(sourceDir: string): DocumentationItem[] {
  const allItems: DocumentationItem[] = [];
  const files = scanDirectory(sourceDir);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const items = extractDocumentation(content, file);
    allItems.push(...items);
  }

  return allItems;
}

/**
 * Group documentation by chapter
 */
function groupByChapter(items: DocumentationItem[]): ChapterSection[] {
  const chapters = new Map<string, DocumentationItem[]>();

  for (const item of items) {
    if (!chapters.has(item.chapter)) {
      chapters.set(item.chapter, []);
    }
    chapters.get(item.chapter)!.push(item);
  }

  const sections: ChapterSection[] = [];
  for (const [chapter, items] of chapters) {
    sections.push({
      chapter,
      title: chapterToTitle(chapter),
      items,
    });
  }

  return sections.sort((a, b) => a.chapter.localeCompare(b.chapter));
}

/**
 * Convert chapter name to title case
 */
function chapterToTitle(chapter: string): string {
  return chapter
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate GitBook-style SUMMARY.md
 */
function generateSummary(sections: ChapterSection[]): string {
  let summary = `# Table of Contents

* [Introduction](README.md)
* [API Reference](api-reference.md)

`;

  for (const section of sections) {
    summary += `## ${section.title}\n\n`;
    for (const item of section.items) {
      const filename = `chapters/${section.chapter}/${item.name}.md`;
      summary += `* [${item.name}](${filename})\n`;
    }
    summary += "\n";
  }

  return summary;
}

/**
 * Generate introduction README
 */
function generateIntroduction(): string {
  const intro = `# FHEVM Example Documentation

Welcome to the comprehensive documentation for FHEVM examples.

## Overview

This documentation is auto-generated from code annotations using the \`generate-docs.ts\` script.
Each example is organized by chapter, making it easy to find specific FHEVM concepts and patterns.

## How to Use This Documentation

1. **By Chapter**: Browse documentation organized by FHEVM concepts
   - Basic operations
   - Encryption and decryption
   - Access control
   - Advanced patterns

2. **By API Reference**: Complete function reference with examples

3. **Search**: Use search functionality to find specific topics

## Chapters

- **basic-operations**: Fundamental FHEVM smart contract operations
- **encryption**: FHE encryption and decryption patterns
- **access-control**: Permission management with encrypted data
- **advanced-patterns**: Complex FHEVM use cases
- **anti-patterns**: Common mistakes to avoid
- **input-proof**: Input validation and proof handling
- **automation**: Scripting and automation tools

## Key Concepts

### Fully Homomorphic Encryption (FHE)
Allows computation on encrypted data without decryption, maintaining privacy while enabling smart contract functionality.

### Encrypted Types
- \`euint8\` - Encrypted 8-bit unsigned integer
- \`euint16\` - Encrypted 16-bit unsigned integer
- \`euint32\` - Encrypted 32-bit unsigned integer
- \`euint64\` - Encrypted 64-bit unsigned integer
- \`ebool\` - Encrypted boolean

### Key Operations
- \`FHE.add()\` - Encrypted addition
- \`FHE.sub()\` - Encrypted subtraction
- \`FHE.gt()\` - Encrypted greater-than comparison
- \`FHE.eq()\` - Encrypted equality comparison
- \`FHE.select()\` - Conditional selection on encrypted data

## Getting Started

1. Choose a chapter relevant to your use case
2. Review the examples and test cases
3. Check the implementation patterns
4. Follow the security best practices outlined

## Testing

Each example includes comprehensive test suites demonstrating correct usage.

\`\`\`bash
npm run test
\`\`\`

## References

- [FHEVM Official Documentation](https://docs.zama.ai/fhevm)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/)

---

Generated by \`generate-docs.ts\`
`;

  return intro;
}

/**
 * Generate API reference documentation
 */
function generateAPIReference(items: DocumentationItem[]): string {
  let api = `# API Reference

## Functions and Contracts

`;

  const grouped = new Map<string, DocumentationItem[]>();
  for (const item of items) {
    const key = path.basename(item.file, path.extname(item.file));
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  }

  for (const [source, items] of grouped) {
    api += `### ${source}\n\n`;
    for (const item of items) {
      api += `#### \`${item.name}()\`\n\n`;
      api += `**Chapter**: \`${item.chapter}\`\n\n`;
      api += `**Description**: ${item.description}\n\n`;
      api += `**Location**: ${item.file}:${item.lineNumber}\n\n`;
      api += "---\n\n";
    }
  }

  return api;
}

/**
 * Generate chapter-specific documentation
 */
function generateChapterDoc(section: ChapterSection): string {
  let doc = `# ${section.title}

## Overview
Documentation for FHEVM patterns related to **${section.chapter}**.

## Topics

`;

  for (const item of section.items) {
    doc += `### ${item.name}\n\n`;
    doc += `${item.description}\n\n`;
    doc += `**File**: \`${item.file}:${item.lineNumber}\`\n\n`;
    doc += "---\n\n";
  }

  return doc;
}

/**
 * Create documentation directory structure
 */
function createDirectoryStructure(outputDir: string): void {
  const dirs = [outputDir, path.join(outputDir, "chapters")];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Write documentation files
 */
function writeDocumentation(
  outputDir: string,
  sections: ChapterSection[],
  allItems: DocumentationItem[]
): void {
  // Write README
  const intro = generateIntroduction();
  fs.writeFileSync(path.join(outputDir, "README.md"), intro);

  // Write API Reference
  const apiRef = generateAPIReference(allItems);
  fs.writeFileSync(path.join(outputDir, "api-reference.md"), apiRef);

  // Write SUMMARY for GitBook
  const summary = generateSummary(sections);
  fs.writeFileSync(path.join(outputDir, "SUMMARY.md"), summary);

  // Write chapter documentation
  for (const section of sections) {
    const chapterDir = path.join(outputDir, "chapters", section.chapter);
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }

    const chapterDoc = generateChapterDoc(section);
    fs.writeFileSync(path.join(chapterDir, "README.md"), chapterDoc);

    // Write individual item documentation
    for (const item of section.items) {
      const itemDoc = `# ${item.name}

## Chapter
\`${item.chapter}\`

## Description
${item.description}

## Location
File: \`${item.file}\`
Line: \`${item.lineNumber}\`

## Implementation

\`\`\`
${item.content}
\`\`\`

---
Generated by \`generate-docs.ts\`
`;

      fs.writeFileSync(
        path.join(chapterDir, `${item.name}.md`),
        itemDoc
      );
    }
  }
}

/**
 * Log generation summary
 */
function logSummary(outputDir: string, sections: ChapterSection[]): void {
  console.log("\n" + "=".repeat(60));
  console.log("✓ Documentation Generated Successfully");
  console.log("=".repeat(60));
  console.log(`\nOutput Directory: ${outputDir}`);
  console.log(`\nChapters Generated: ${sections.length}`);

  for (const section of sections) {
    console.log(`  - ${section.title} (${section.items.length} items)`);
  }

  console.log(`\nFiles Created:`);
  console.log(`  ✓ README.md - Introduction and overview`);
  console.log(`  ✓ SUMMARY.md - GitBook table of contents`);
  console.log(`  ✓ api-reference.md - Complete API reference`);
  console.log(`  ✓ chapters/ - Chapter-based documentation`);

  console.log(`\nNext Steps:`);
  console.log(`  1. Review generated documentation in ${outputDir}/`);
  console.log(`  2. Publish to GitBook or similar platform`);
  console.log(`  3. Share with development team`);

  console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    console.log("Generating Documentation...\n");

    // Parse configuration
    const config = parseArguments(process.argv.slice(2));
    console.log(`Output directory: ${config.outputDir}`);
    console.log(`Source directory: ${config.sourceDir}`);
    console.log(`Format: ${config.format}\n`);

    // Create directory structure
    console.log("Creating output directories...");
    createDirectoryStructure(config.outputDir);

    // Collect documentation
    console.log("Scanning source files for documentation...");
    const allItems = collectDocumentation(config.sourceDir);
    console.log(`Found ${allItems.length} documented items\n`);

    // Group by chapter
    console.log("Organizing by chapter...");
    const sections = groupByChapter(allItems);

    // Generate documentation
    console.log("Writing documentation files...");
    writeDocumentation(config.outputDir, sections, allItems);

    // Log summary
    logSummary(config.outputDir, sections);
  } catch (error) {
    console.error("Error generating documentation:", error);
    process.exit(1);
  }
}

// Execute
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
