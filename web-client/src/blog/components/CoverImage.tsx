import { Corners } from '../../components/home/Corners'

// A Post's cover: one <img> in a blueprint frame with the duotone overlay,
// cropped to 16:7.
export function CoverImage({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="blueprint duotone m-0 aspect-[16/7] w-full">
      <img src={src} alt={alt} className="absolute inset-0 block h-full w-full object-cover" />
      <Corners />
    </figure>
  )
}
