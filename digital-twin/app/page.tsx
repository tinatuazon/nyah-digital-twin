import type React from "react"
import { GlobeIcon, CodeIcon, BriefcaseIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectCard } from "@/components/project-card"
import { getAllProjects } from "@/lib/projects"
import { ExperienceCard } from "@/components/experience-card"
import { EnhancedScrollIndicator } from "@/components/enhanced-scroll-indicator"
import { AnimatedSection } from "@/components/animated-section"
import { EnhancedProfile } from "@/components/enhanced-profile"
import { CredentialsSection } from "@/components/credentials-section"
import { PortfolioHeader } from "@/components/portfolio-header"
import { getExperienceInfo, getTechnicalSkillsInfo } from "@/lib/data"

const SkillTagComponent = ({ children }: { children: React.ReactNode }) => {
  return <div className="px-2 py-1 bg-secondary border border-border rounded-full text-xs font-medium text-secondary-foreground">{children}</div>
}

export default function Home() {
  const projects = getAllProjects()
  const experienceInfo = getExperienceInfo()
  const technicalSkills = getTechnicalSkillsInfo()

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-foreground">
      {/* Clean minimalist background */}
      <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-0"></div>

      {/* Header */}
      <PortfolioHeader />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-32 pb-20 min-h-[80vh] flex items-center">
          <AnimatedSection animation="fade-up" className="max-w-4xl">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-sm font-medium text-blue-600 dark:text-cyan-400 tracking-wide uppercase">AI & Robotics Specialist</span>
              </div>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="block text-gray-900 dark:text-white">Nyah</span>
                <span className="block text-gray-900 dark:text-white">Ostonal</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl">
                4th year IT student at St. Paul University Philippines, passionate about building intelligent robotics systems and AI applications.
              </p>
              <div className="flex gap-4 pt-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-black text-white rounded-full px-8">
                  View Projects
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 border-2">
                  Contact Me
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-20 space-y-32">

          {/* Projects Section */}
          <AnimatedSection animation="fade-up" id="projects">
            <div className="space-y-8">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">Featured Work</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-2 text-gray-900 dark:text-white">Projects</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {projects.slice(0, 4).map((project, index) => (
                  <AnimatedSection key={project.slug} animation="fade-up" delay={100 * (index + 1)}>
                    <ProjectCard project={project} />
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Skills Section */}
          <AnimatedSection animation="fade-up" id="skills">
            <div className="space-y-8">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">Expertise</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-2 text-gray-900 dark:text-white">Skills</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-cyan-400 transition-all duration-300">
                  <CodeIcon className="w-8 h-8 mb-4 text-blue-600 dark:text-cyan-400" />
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">AI & Machine Learning</h3>
                  <p className="text-gray-600 dark:text-gray-400">TensorFlow, PyTorch, OpenCV, YOLO, Computer Vision, NLP</p>
                </div>
                <div className="p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-cyan-400 transition-all duration-300">
                  <GlobeIcon className="w-8 h-8 mb-4 text-blue-600 dark:text-cyan-400" />
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Robotics</h3>
                  <p className="text-gray-600 dark:text-gray-400">Arduino, Raspberry Pi, ROS, Servo Motors, Sensor Integration</p>
                </div>
                <div className="p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-cyan-400 transition-all duration-300">
                  <BriefcaseIcon className="w-8 h-8 mb-4 text-blue-600 dark:text-cyan-400" />
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Development</h3>
                  <p className="text-gray-600 dark:text-gray-400">Python, C++, JavaScript, Git, Jupyter, VS Code</p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* About Section */}
          <AnimatedSection animation="fade-up" id="about">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">About Me</span>
                  <h2 className="text-4xl md:text-5xl font-bold mt-2 text-gray-900 dark:text-white">Student & Innovator</h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  Currently pursuing my Bachelor's degree in Information Technology with a specialization in AI & Robotics at St. Paul University Philippines. I'm passionate about creating intelligent systems that bridge the gap between artificial intelligence and physical robotics.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  Through coursework and personal projects, I've developed skills in computer vision, machine learning, and robotics control systems. I'm always eager to learn and apply cutting-edge technologies to solve real-world problems.
                </p>
              </div>
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Education</h3>
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-white font-medium">Bachelor of Information Technology</p>
                    <p className="text-gray-600 dark:text-gray-400">Major in AI & Robotics Track</p>
                    <p className="text-gray-600 dark:text-gray-400">St. Paul University Philippines</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">4th Year • Expected 2026</p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Status</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-400">🎓 Full-time student</p>
                    <p className="text-gray-600 dark:text-gray-400">💼 Open to internships</p>
                    <p className="text-gray-600 dark:text-gray-400">🔬 Active in research projects</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Contact Section */}
          <AnimatedSection animation="fade-up" id="contact">
            <div className="text-center space-y-8 py-20">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">Get In Touch</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-2 text-gray-900 dark:text-white">Let's Connect</h2>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Interested in collaborating on AI & Robotics projects? Feel free to reach out!
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-black text-white rounded-full px-8">
                  Email Me
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 border-2">
                  LinkedIn
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-zinc-800 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} Nyah Ostonal. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">GitHub</a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">LinkedIn</a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">Email</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Scroll to Top Button */}
      <EnhancedScrollIndicator />
    </main>
  )
}
