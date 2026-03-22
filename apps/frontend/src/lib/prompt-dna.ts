// Deterministic generative art from prompt content
// Color palette derived from content, patterns from sentence structure

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0
  }
  return Math.abs(hash)
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0
    return (s >>> 0) / 0xFFFFFFFF
  }
}

const CATEGORY_PALETTES: Record<string, string[]> = {
  CODING: ['#3B82F6', '#60A5FA', '#1D4ED8', '#93C5FD', '#BFDBFE'],
  WRITING: ['#22C55E', '#4ADE80', '#15803D', '#86EFAC', '#BBF7D0'],
  BUSINESS: ['#A855F7', '#C084FC', '#7E22CE', '#D8B4FE', '#F3E8FF'],
  ANALYSIS: ['#EAB308', '#FACC15', '#A16207', '#FDE047', '#FEF08A'],
  EDUCATION: ['#EC4899', '#F472B6', '#BE185D', '#F9A8D4', '#FCE7F3'],
  CREATIVITY: ['#FF6B2B', '#FF8C5A', '#CC4400', '#FFB07A', '#FFD4B8'],
  RESEARCH: ['#06B6D4', '#22D3EE', '#0E7490', '#67E8F9', '#CFFAFE'],
  ROLEPLAY: ['#F43F5E', '#FB7185', '#BE123C', '#FCA5A5', '#FFE4E6'],
  OTHER: ['#6B7280', '#9CA3AF', '#374151', '#D1D5DB', '#F3F4F6'],
}

export function generatePromptDNA(content: string, category = 'OTHER'): string {
  const seed = hashCode(content)
  const rand = seededRandom(seed)
  const palette = (CATEGORY_PALETTES[category] ?? CATEGORY_PALETTES.OTHER) as string[]

  // suppress unused warning — rand is used to advance state for consistency
  void rand()

  const size = 8 // 8x8 grid
  const cellSize = 8
  const svgSize = size * cellSize

  const cells: string[] = []

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Mirror left-right for symmetry (like a Rorschach)
      const mirrorCol = col < size / 2 ? col : size - 1 - col
      const localSeed = hashCode(`${seed}-${row}-${mirrorCol}`)
      const localRand = seededRandom(localSeed)

      const active = localRand() > 0.35
      const colorIndex = Math.floor(localRand() * palette.length)
      const opacity = 0.4 + localRand() * 0.6

      if (active) {
        cells.push(
          `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${palette[colorIndex]}" opacity="${opacity.toFixed(2)}"/>`
        )
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" shape-rendering="crispEdges">${cells.join('')}</svg>`
}
