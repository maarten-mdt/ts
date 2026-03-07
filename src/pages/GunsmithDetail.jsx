import { useParams, Link } from 'react-router-dom'

export default function GunsmithDetail() {
  const { slug } = useParams()
  return (
    <div>
      <Link to="/gunsmiths" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
        ← Back to gunsmiths
      </Link>
      <h1 className="text-2xl font-bold text-stone-100">Gunsmith: {slug}</h1>
      <p className="mt-2 text-stone-500">Placeholder — detail, reviews, and "Claim this listing" will go here.</p>
    </div>
  )
}
