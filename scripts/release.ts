#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface CommitInfo {
  hash: string;
  shortHash: string;
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
  raw: string;
}

interface ParsedArgs {
  bump?: 'major' | 'minor' | 'patch';
  explicitVersion?: string;
  dryRun: boolean;
  skipChecks: boolean;
  allowDirty: boolean;
  yes: boolean;
  help: boolean;
}

function parseCliArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {
    dryRun: false,
    skipChecks: false,
    allowDirty: false,
    yes: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run' || arg === '-d') {
      result.dryRun = true;
    } else if (arg === '--patch' || arg === '-p') {
      result.bump = 'patch';
    } else if (arg === '--minor' || arg === '-m') {
      result.bump = 'minor';
    } else if (arg === '--major') {
      result.bump = 'major';
    } else if (arg === '--skip-checks') {
      result.skipChecks = true;
    } else if (arg === '--allow-dirty') {
      result.allowDirty = true;
    } else if (arg === '--yes' || arg === '-y') {
      result.yes = true;
    } else if (arg === '--version') {
      result.explicitVersion = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }

  return result;
}

function printHelp() {
  console.log(`
Usage: bun run scripts/release.ts [options]

Options:
  --patch, -p        Bump patch version (e.g. 0.1.0 -> 0.1.1)
  --minor, -m        Bump minor version (e.g. 0.1.0 -> 0.2.0)
  --major            Bump major version (e.g. 0.1.0 -> 1.0.0)
  --version <x.y.z>  Specify explicit target version
  --dry-run, -d      Simulate release without modifying files, git, or tags
  --skip-checks      Skip pre-flight verification gates (format, lint, checks)
  --allow-dirty      Allow running with uncommitted working directory changes
  --yes, -y          Skip interactive confirmation prompt
  --help, -h         Show this help message
`);
}

function runCommand(
  cmd: string,
  args: string[],
  options?: { silent?: boolean; cwd?: string },
): { stdout: string; stderr: string; status: number } {
  const res = spawnSync(cmd, args, {
    cwd: options?.cwd || process.cwd(),
    encoding: 'utf-8',
    stdio: options?.silent ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe'],
  });

  return {
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
    status: res.status ?? 1,
  };
}

function getLatestTag(): string | null {
  const res = runCommand('git', ['tag', '--sort=-v:refname'], { silent: true });
  if (res.status === 0 && res.stdout) {
    const tags = res.stdout.split('\n').filter(t => /^v?\d+\.\d+\.\d+/.test(t.trim()));
    if (tags.length > 0) {
      return tags[0].trim();
    }
  }
  return null;
}

function getRepoUrl(): string | null {
  const res = runCommand('git', ['remote', 'get-url', 'origin'], { silent: true });
  if (res.status === 0 && res.stdout) {
    let url = res.stdout.trim();
    if (url.startsWith('git@github.com:')) {
      url = url.replace('git@github.com:', 'https://github.com/').replace(/\.git$/, '');
      return url;
    }
    if (url.startsWith('https://github.com/')) {
      return url.replace(/\.git$/, '');
    }
  }
  return null;
}

function parseCommits(latestTag: string | null): CommitInfo[] {
  const range = latestTag ? `${latestTag}..HEAD` : 'HEAD';
  const res = runCommand('git', ['log', range, '--format=%H%x00%s'], { silent: true });

  if (res.status !== 0 || !res.stdout) {
    return [];
  }

  const lines = res.stdout.split('\n').filter(Boolean);
  const commits: CommitInfo[] = [];

  for (const line of lines) {
    const [hash, subject] = line.split('\0');
    if (!hash || !subject) continue;

    // Conventional commit regex: type(scope)!: message OR type!: message OR type(scope): message
    const match = subject.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?(!)?:\s*(.*)$/);
    if (match) {
      const [, type, scope, breakingBang, cleanSubject] = match;
      commits.push({
        hash,
        shortHash: hash.substring(0, 7),
        type: type.toLowerCase(),
        scope: scope ? scope.toLowerCase() : undefined,
        breaking: Boolean(breakingBang),
        subject: cleanSubject || subject,
        raw: subject,
      });
    } else {
      commits.push({
        hash,
        shortHash: hash.substring(0, 7),
        type: 'other',
        breaking: false,
        subject,
        raw: subject,
      });
    }
  }

  return commits;
}

function bumpSemver(current: string, bump: 'major' | 'minor' | 'patch'): string {
  const clean = current.replace(/^v/, '');
  const [major, minor, patch] = clean.split('.').map(n => Number.parseInt(n, 10) || 0);

  if (clean === '0.0.0') {
    if (bump === 'major') return '1.0.0';
    if (bump === 'minor') return '0.1.0';
    return '0.0.1';
  }

  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

function determineRecommendedBump(commits: CommitInfo[]): 'major' | 'minor' | 'patch' {
  if (commits.length === 0) return 'patch';

  const hasBreaking = commits.some(
    c => c.breaking || c.raw.includes('BREAKING CHANGE') || c.subject.includes('BREAKING CHANGE'),
  );
  if (hasBreaking) return 'major';

  const hasFeature = commits.some(c => c.type === 'feat');
  if (hasFeature) return 'minor';

  return 'patch';
}

function generateChangelogSection(
  version: string,
  commits: CommitInfo[],
  repoUrl: string | null,
): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const lines: string[] = [`## [${version}] - ${dateStr}`, ''];

  const categories: Record<string, { title: string; types: string[] }> = {
    breaking: { title: '⚠️ Breaking Changes', types: [] },
    feat: { title: 'Features', types: ['feat'] },
    fix: { title: 'Bug Fixes', types: ['fix'] },
    perf: { title: 'Performance Improvements', types: ['perf'] },
    refactor: { title: 'Refactoring', types: ['refactor'] },
    ui: { title: 'UI & Styling', types: ['style'] },
    docs: { title: 'Documentation', types: ['docs'] },
    maintenance: { title: 'Maintenance & Tooling', types: ['chore', 'build', 'ci'] },
  };

  const breakingCommits = commits.filter(c => c.breaking);
  if (breakingCommits.length > 0) {
    lines.push(`### ${categories.breaking.title}`);
    for (const c of breakingCommits) {
      const scopePrefix = c.scope ? `**${c.scope}**: ` : '';
      const commitLink = repoUrl
        ? `([${c.shortHash}](${repoUrl}/commit/${c.hash}))`
        : `(${c.shortHash})`;
      lines.push(`- ${scopePrefix}${c.subject} ${commitLink}`);
    }
    lines.push('');
  }

  for (const [key, cat] of Object.entries(categories)) {
    if (key === 'breaking') continue;

    const matchedCommits = commits.filter(c => !c.breaking && cat.types.includes(c.type));

    if (matchedCommits.length > 0) {
      lines.push(`### ${cat.title}`);
      for (const c of matchedCommits) {
        const scopePrefix = c.scope ? `**${c.scope}**: ` : '';
        const commitLink = repoUrl
          ? `([${c.shortHash}](${repoUrl}/commit/${c.hash}))`
          : `(${c.shortHash})`;
        lines.push(`- ${scopePrefix}${c.subject} ${commitLink}`);
      }
      lines.push('');
    }
  }

  // Fallback for other commits if non-empty
  const otherCommits = commits.filter(
    c => !c.breaking && !Object.values(categories).some(cat => cat.types.includes(c.type)),
  );

  if (otherCommits.length > 0) {
    lines.push('### Other Changes');
    for (const c of otherCommits) {
      const commitLink = repoUrl
        ? `([${c.shortHash}](${repoUrl}/commit/${c.hash}))`
        : `(${c.shortHash})`;
      lines.push(`- ${c.subject} ${commitLink}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function updatePackageJson(filePath: string, newVersion: string, dryRun: boolean) {
  const fullPath = resolve(process.cwd(), filePath);
  if (!existsSync(fullPath)) return;

  const content = readFileSync(fullPath, 'utf-8');
  const pkg = JSON.parse(content);
  pkg.version = newVersion;

  if (!dryRun) {
    writeFileSync(fullPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
  }
}

async function main() {
  const args = parseCliArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  console.log('🚀 Cuan Release Automation');
  console.log('────────────────────────────────────────');

  // Check working tree clean
  if (!args.allowDirty && !args.dryRun) {
    const statusRes = runCommand('git', ['status', '--porcelain'], { silent: true });
    if (statusRes.stdout.length > 0) {
      console.error(
        '❌ Error: Git working tree contains uncommitted changes. Commit or stash them, or use --allow-dirty.',
      );
      process.exit(1);
    }
  }

  // Read root version
  const rootPkgPath = resolve(process.cwd(), 'package.json');
  const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
  const currentVersion = rootPkg.version || '0.0.0';

  const latestTag = getLatestTag();
  const repoUrl = getRepoUrl();
  console.log(`📦 Current Package Version: ${currentVersion}`);
  console.log(`🏷️  Latest Git Tag:         ${latestTag || '(none)'}`);
  if (repoUrl) {
    console.log(`🌐 Repository:             ${repoUrl}`);
  }

  // Parse commits
  const commits = parseCommits(latestTag);
  console.log(`📝 Analyzed Commits:        ${commits.length} since last release`);

  // Target version calculation
  let targetVersion: string;
  if (args.explicitVersion) {
    targetVersion = args.explicitVersion.replace(/^v/, '');
  } else {
    const recommendedBump = determineRecommendedBump(commits);
    const chosenBump = args.bump || recommendedBump;
    targetVersion = bumpSemver(currentVersion, chosenBump);
    console.log(`📈 Recommended Bump:       ${recommendedBump.toUpperCase()} -> v${targetVersion}`);
    if (args.bump && args.bump !== recommendedBump) {
      console.log(`⚙️  Overridden Bump:        ${args.bump.toUpperCase()} -> v${targetVersion}`);
    }
  }

  const tagName = `v${targetVersion}`;

  // Pre-flight checks
  if (!args.skipChecks) {
    console.log('\n🔍 Running pre-flight verification gates...');

    console.log('  1/3 Checking code formatting...');
    const fmt = runCommand('bun', ['run', 'format:check'], { silent: true });
    if (fmt.status !== 0) {
      console.error('❌ Formatting check failed. Run "bun run format" and try again.');
      process.exit(1);
    }

    console.log('  2/3 Running Biome linter...');
    const lint = runCommand('bun', ['run', 'lint'], { silent: true });
    if (lint.status !== 0) {
      console.error('❌ Lint check failed. Fix errors and try again.');
      process.exit(1);
    }

    console.log('  3/3 Executing Moonrepo workspace checks & tests...');
    const moon = runCommand('bunx', ['moon', 'check', '--all'], { silent: true });
    if (moon.status !== 0) {
      console.error('❌ Moon check failed. Run "bunx moon check --all" locally to debug.');
      process.exit(1);
    }

    console.log('✅ All verification gates passed!');
  } else {
    console.log('⚠️  Skipping pre-flight verification gates (--skip-checks).');
  }

  // Generate changelog entry
  const changelogSection = generateChangelogSection(targetVersion, commits, repoUrl);

  if (args.dryRun) {
    console.log('\n📄 [DRY-RUN] Generated Changelog Section:');
    console.log('────────────────────────────────────────');
    console.log(changelogSection);
    console.log('────────────────────────────────────────');
    console.log(`✨ [DRY-RUN] Target version v${targetVersion} would be tagged.`);
    process.exit(0);
  }

  // Update package.json files
  console.log(`\n✏️  Updating versions to ${targetVersion}...`);
  const packagesToUpdate = [
    'package.json',
    'core/package.json',
    'web/package.json',
    'landing/package.json',
  ];

  for (const pkgPath of packagesToUpdate) {
    updatePackageJson(pkgPath, targetVersion, false);
    console.log(`  - Updated ${pkgPath}`);
  }

  // Update CHANGELOG.md
  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
  let newChangelogContent = '';
  if (existsSync(changelogPath)) {
    const existingContent = readFileSync(changelogPath, 'utf-8');
    const headerMatch = existingContent.match(/^# Changelog\n\n(?:[^\n]+\n\n)?/);
    if (headerMatch) {
      const header = headerMatch[0];
      const rest = existingContent.slice(header.length);
      newChangelogContent = `${header}${changelogSection}\n\n${rest}`;
    } else {
      newChangelogContent = `# Changelog\n\nAll notable changes to Cuan are documented in this file.\n\n${changelogSection}\n\n${existingContent}`;
    }
  } else {
    newChangelogContent = `# Changelog\n\nAll notable changes to Cuan are documented in this file.\n\n${changelogSection}\n`;
  }

  writeFileSync(changelogPath, newChangelogContent, 'utf-8');
  console.log('  - Updated CHANGELOG.md');

  // Format updated files using Biome so formatting remains pristine
  runCommand('bun', ['run', 'format'], { silent: true });

  // Stage changes
  console.log('\n📌 Staging release changes in git...');
  const filesToStage = [...packagesToUpdate, 'CHANGELOG.md'];
  runCommand('git', ['add', ...filesToStage], { silent: true });

  // Git Commit
  const commitMsg = `chore(release): ${tagName}`;
  const commitRes = runCommand('git', ['commit', '-m', commitMsg], { silent: true });
  if (commitRes.status !== 0) {
    console.error(`❌ Git commit failed: ${commitRes.stderr}`);
    process.exit(1);
  }
  console.log(`  - Committed: "${commitMsg}"`);

  // Git Tag
  const tagRes = runCommand('git', ['tag', '-a', tagName, '-m', `Release ${tagName}`], {
    silent: true,
  });
  if (tagRes.status !== 0) {
    console.error(`❌ Git tag failed: ${tagRes.stderr}`);
    process.exit(1);
  }
  console.log(`  - Tagged: ${tagName}`);

  console.log('\n🎉 Release successfully marked and tagged!');
  console.log('────────────────────────────────────────');
  console.log('Next step: push commit and tag to trigger automated CI/CD deployment:');
  console.log(`\n  git push origin main && git push origin ${tagName}\n`);
}

main().catch(err => {
  console.error('Unhandled error during release:', err);
  process.exit(1);
});
