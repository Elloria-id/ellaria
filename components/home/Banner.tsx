'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BannerProps {
  banners: Array<{
    id: string
    title?: string
    image: string
    link?: string
  }>
}

export function Banner({ banners }: BannerProps) {
  const [current, setCurrent] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    if (banners.length === 0 || isHovering) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [banners.length, isHovering])

  const goToSlide = (index: number) => {
    setCurrent(index)
  }

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length)
  }

  if (banners.length === 0) return null

  return (
    <div
      className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden rounded-xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-500 ${
            index === current ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-100'
          }`}
        >
          <a href={banner.link || '#'}>
            <img
              src={banner.image}
              alt={banner.title || `Banner ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {banner.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <h2 className="text-white text-xl md:text-2xl font-bold">
                  {banner.title}
                </h2>
              </div>
            )}
          </a>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-white/10 transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-white/10 transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === current ? 'bg-primary' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
