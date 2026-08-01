import { useRouter } from 'next/router'

export default function ReaderPage() {
  const router = useRouter()
  const { chapterId } = router.query

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl">Reader - Chapter: {chapterId}</h1>
        <div className="mt-4">Reader content placeholder</div>
      </div>
    </div>
  )
}
