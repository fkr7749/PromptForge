export interface LintIssue {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  suggestion?: string
}

export interface LintResult {
  issues: LintIssue[]
  score: number // 0-100, higher is better
}

export function lintPrompt(content: string, declaredVariables: string[] = []): LintResult {
  const issues: LintIssue[] = []

  // Rule 1: Undefined variables
  const usedVars = [...content.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1] ?? '')
  const undeclared = usedVars.filter(v => v && !declaredVariables.includes(v))
  for (const v of undeclared) {
    issues.push({
      severity: 'error',
      code: 'UNDEFINED_VARIABLE',
      message: `Variable "{{${v}}}" is used but not declared`,
      suggestion: `Declare this variable in the Variables section, or replace {{${v}}} with literal text`,
    })
  }

  // Rule 2: Conflicting instructions
  const conflictPairs = [
    { a: /\b(be brief|be concise|keep it short|brief response)\b/i, b: /\b(be detailed|be comprehensive|thorough|in depth|exhaustive)\b/i, msg: 'Conflicting length instructions: brief vs detailed' },
    { a: /\b(formal tone|professional tone|formal language)\b/i, b: /\b(casual tone|informal|conversational|friendly tone)\b/i, msg: 'Conflicting tone: formal vs casual' },
    { a: /\bonly in english\b/i, b: /\btranslate\b/i, msg: 'Possible language conflict: English-only with translation instruction' },
  ]
  for (const pair of conflictPairs) {
    if (pair.a.test(content) && pair.b.test(content)) {
      issues.push({ severity: 'warning', code: 'CONFLICTING_INSTRUCTIONS', message: pair.msg, suggestion: 'Remove one of the conflicting instructions' })
    }
  }

  // Rule 3: Injection risk
  const injectionPatterns = [
    /ignore (all )?(previous|prior|above) instructions/i,
    /you are now/i,
    /forget your (previous |prior )?instructions/i,
    /DAN mode/i,
    /jailbreak/i,
    /pretend you (have no|don'?t have) (restrictions|limitations)/i,
  ]
  for (const pattern of injectionPatterns) {
    if (pattern.test(content)) {
      issues.push({ severity: 'error', code: 'INJECTION_RISK', message: 'Prompt contains potential injection attack patterns', suggestion: 'Remove phrases that attempt to override system instructions' })
      break
    }
  }

  // Rule 4: Missing output format
  const hasOutputFormat = /\b(respond (as|in|with)|output (as|in|format)|return (a |an )?(JSON|list|markdown|array|table|bullet|numbered)|provide (a |an )?(summary|list|table))\b/i.test(content)
  if (content.length > 200 && !hasOutputFormat) {
    issues.push({ severity: 'info', code: 'MISSING_OUTPUT_FORMAT', message: 'No output format specified', suggestion: 'Add output format instructions, e.g., "Respond as a JSON array" or "Format as a bulleted list"' })
  }

  // Rule 5: Missing task clarity (no imperative verb at start)
  const firstSentence = (content.split(/[.!?\n]/)[0] ?? '').trim()
  const hasImperative = /^(write|create|generate|analyze|summarize|explain|translate|convert|list|describe|provide|give|help|build|design|review|evaluate|compare|suggest|find|identify|extract|format|transform|check|fix|improve)\b/i.test(firstSentence)
  if (!hasImperative && content.length > 50) {
    issues.push({ severity: 'info', code: 'MISSING_TASK_CLARITY', message: 'Prompt may lack a clear task directive', suggestion: 'Start with a clear imperative verb: Write, Analyze, Generate, etc.' })
  }

  // Rule 6: Excessive length without structure
  const hasStructureMarkers = /#{1,3}\s|^\s*[-*]\s|\n\n/m.test(content)
  if (content.length > 2000 && !hasStructureMarkers) {
    issues.push({ severity: 'warning', code: 'EXCESSIVE_LENGTH', message: `Prompt is ${content.length} chars with no structure markers`, suggestion: 'Break long prompts into sections using ## headers or bullet points' })
  }

  // Rule 7: Duplicate instructions
  const sentences = content.split(/[.!?\n]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 20)
  const seen = new Set<string>()
  for (const s of sentences) {
    if (seen.has(s)) {
      issues.push({ severity: 'info', code: 'DUPLICATE_INSTRUCTION', message: 'Duplicate instruction detected', suggestion: 'Remove repeated sentences to reduce token usage' })
      break
    }
    seen.add(s)
  }

  // Calculate score: start at 100, deduct per issue
  const deductions = { error: 20, warning: 10, info: 3 }
  const score = Math.max(0, 100 - issues.reduce((s, i) => s + deductions[i.severity], 0))

  return { issues, score }
}
