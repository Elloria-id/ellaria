type Props = {
  title: string
  coverUrl?: string
}

export default function SeriesCard({ title, coverUrl }: Props) {
  return (
    <div className="w-40">
      <div className="h-56 bg-gray-100 rounded-md overflow-hidden">
        <img src={coverUrl || '/placeholder.png'} alt={title} className="w-full h-full object-cover" />
      </div>
      <h3 className="mt-2 text-sm font-medium">{title}</h3>
    </div>
  )
}
