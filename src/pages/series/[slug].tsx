import { useRouter } from 'next/router'

export default function SeriesPage() {
  const router = useRouter()
  const { slug } = router.query

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Series: {slug}</h1>
      <p className="mt-2">Detail series will be here.</p>
    </div>
  )
}
