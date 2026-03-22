import { Zap } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-forge-violet/10 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-6 w-6 text-forge-violet animate-bounce" />
          </div>
        </div>
        <div className="flex gap-1">
          {[0, 0.15, 0.3].map((delay, i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-forge-violet/40 animate-bounce"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
