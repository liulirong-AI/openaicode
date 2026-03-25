#!/usr/bin/env bun
import fs from "fs"
import path from "path"

const skillsDir = "D:\\AIcode\\workspace\\openaicode\\.opencode\\skills"

const skillDirs = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "browse" && d.name !== "test" && d.name !== "docs")
  .map((d) => d.name)

const replacements = [
  [/allowed-tools:\s*\n\s*- AskUserQuestion/g, "allowed-tools:\n  - question"],
  [/AskUserQuestion Format/g, "Question Tool Format"],
  [/AskUserQuestion call/g, "question tool call"],
  [/AskUserQuestion calls/g, "question tool calls"],
  [/Use AskUserQuestion/g, "Use the question tool"],
  [/ask a follow-up AskUserQuestion/g, "ask a follow-up question"],
  [/AskUserQuestion\(/g, "question("],
  [/AskUserQuestion\[/g, "question["],
  [/- AskUserQuestion/g, "- question"],
  [/AskUserQuestion/g, "question"],
]

let totalChanges = 0

for (const skillName of skillDirs) {
  const skillPath = path.join(skillsDir, skillName, "SKILL.md")
  if (!fs.existsSync(skillPath)) continue

  let content = fs.readFileSync(skillPath, "utf8")
  let changes = 0

  for (const [pattern, replacement] of replacements) {
    const matches = content.match(pattern)
    if (matches) {
      content = content.replace(pattern, replacement)
      changes += matches.length
    }
  }

  if (changes > 0) {
    fs.writeFileSync(skillPath, content)
    console.log(`${skillName}: ${changes} changes`)
    totalChanges += changes
  }
}

console.log(`\nTotal: ${totalChanges} changes across ${skillDirs.length} skills`)
