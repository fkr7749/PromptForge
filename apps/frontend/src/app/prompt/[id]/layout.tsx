import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: { title: true, description: true, category: true, author: { select: { username: true } } },
  })

  if (!prompt) return { title: 'Prompt Not Found \u2014 PromptForge' }

  const ogImageUrl = `/api/prompts/${id}/og-image`

  return {
    title: `${prompt.title} \u2014 PromptForge`,
    description: prompt.description,
    openGraph: {
      title: prompt.title,
      description: prompt.description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: prompt.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: prompt.title,
      description: prompt.description,
      images: [ogImageUrl],
    },
  }
}

export default function PromptLayout({ children }: Props) {
  return <>{children}</>
}
