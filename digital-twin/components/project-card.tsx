import Image from "next/image"
import Link from "next/link"

interface ProjectCardProps {
  project: {
    title: string
    category: string
    thumbnailImage: string
    slug: string
    shortDescription?: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`} className="block group">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-cyan-400 transition-all duration-300">
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={project.thumbnailImage || "/placeholder.svg"}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <span className="text-xs font-medium text-blue-400 dark:text-cyan-400 mb-2 block">{project.category}</span>
          <h3 className="font-bold text-xl mb-1">{project.title}</h3>
          {project.shortDescription && (
            <p className="text-sm text-gray-300 line-clamp-2">{project.shortDescription}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
