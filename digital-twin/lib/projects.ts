export interface ProjectGalleryImage {
  url: string
  caption?: string
}

export interface RelatedProject {
  slug: string
  title: string
  category: string
  image: string
}

export interface Project {
  id: number
  slug: string
  title: string
  category: string
  shortDescription: string
  description: string[]
  features: string[]
  technologies: string[]
  coverImage: string
  thumbnailImage: string
  gallery?: ProjectGalleryImage[]
  client?: string
  timeline: string
  role: string
  liveUrl?: string
  githubUrl?: string
  relatedProjects?: RelatedProject[]
}

const projects: Project[] = [
  {
    id: 1,
    slug: "ai-object-detection-robot",
    title: "AI-Powered Object Detection Robot",
    category: "AI & Robotics",
    shortDescription: "A mobile robot using Raspberry Pi and deep learning to detect and classify objects in real time.",
    description: [
      "Designed and programmed a mobile robot using Raspberry Pi and Python to detect and classify objects in real time using a pre-trained deep learning model (YOLO). This project demonstrates the practical application of computer vision and AI in autonomous robotics.",
      "Integrated camera module, motor control, and obstacle avoidance for autonomous navigation. The robot can identify objects while moving through its environment, making decisions based on what it detects.",
      "The system combines multiple technologies including OpenCV for image processing, TensorFlow for running the YOLO model, and custom Python scripts for motor control and coordination. Demonstrated at university robotics fair with successful obstacle detection and avoidance.",
    ],
    features: [
      "Real-time object detection using YOLO deep learning model",
      "Autonomous navigation with obstacle avoidance",
      "Camera module integration for live video processing",
      "Motor control system for mobile platform",
      "Object classification with visual feedback",
      "Integration of AI model with hardware sensors",
    ],
    technologies: ["Python", "Raspberry Pi", "OpenCV", "YOLO", "TensorFlow"],
    coverImage: "/placeholder.jpg",
    thumbnailImage: "/placeholder.jpg",
    gallery: [
      { url: "/placeholder.jpg", caption: "Robot detecting objects in real-time" },
      { url: "/placeholder.jpg", caption: "Autonomous navigation system" },
      { url: "/placeholder.jpg", caption: "Camera and sensor integration" },
      { url: "/placeholder.jpg", caption: "University robotics fair demonstration" },
    ],
    timeline: "Academic Year 2024-2025",
    role: "Student Developer",
    githubUrl: "",
    relatedProjects: [
      {
        slug: "student-services-chatbot",
        title: "Chatbot for Student Services",
        category: "AI & NLP",
        image: "/placeholder.jpg",
      },
      {
        slug: "gesture-robotic-arm",
        title: "Gesture-Controlled Robotic Arm",
        category: "AI & Robotics",
        image: "/placeholder.jpg",
      },
    ],
  },
  {
    id: 2,
    slug: "student-services-chatbot",
    title: "Chatbot for Student Services",
    category: "AI & NLP",
    shortDescription:
      "An AI chatbot using natural language processing to answer student queries about university services and events.",
    description: [
      "Developed an AI chatbot to answer common student queries about university services, schedules, and events. The chatbot uses natural language processing to understand student questions and provide accurate, helpful responses.",
      "Integrated with a web interface for easy access, making it convenient for students to get information quickly without waiting for administrative staff. The system significantly improved response times for common inquiries.",
      "The chatbot was built using Flask for the backend API and a responsive web interface using HTML, CSS, and JavaScript. The NLP engine uses NLTK to process natural language and match questions to appropriate responses.",
    ],
    features: [
      "Natural language understanding using NLTK",
      "Web-based interface for easy student access",
      "Real-time response to common university queries",
      "Information about services, schedules, and events",
      "Reduced administrative workload",
      "24/7 availability for student inquiries",
    ],
    technologies: ["Python", "NLTK", "Flask", "HTML/CSS", "JavaScript"],
    coverImage: "/placeholder.jpg",
    thumbnailImage: "/placeholder.jpg",
    gallery: [
      { url: "/placeholder.jpg", caption: "Chatbot web interface" },
      { url: "/placeholder.jpg", caption: "Natural language processing in action" },
      { url: "/placeholder.jpg", caption: "Student query response system" },
      { url: "/placeholder.jpg", caption: "Administrative dashboard" },
    ],
    timeline: "Academic Year 2023-2024",
    role: "Lead Programmer",
    githubUrl: "",
    relatedProjects: [
      {
        slug: "ai-object-detection-robot",
        title: "AI-Powered Object Detection Robot",
        category: "AI & Robotics",
        image: "/placeholder.jpg",
      },
      {
        slug: "gesture-robotic-arm",
        title: "Gesture-Controlled Robotic Arm",
        category: "AI & Robotics",
        image: "/placeholder.jpg",
      },
    ],
  },
  {
    id: 3,
    slug: "gesture-robotic-arm",
    title: "Gesture-Controlled Robotic Arm",
    category: "AI & Robotics",
    shortDescription:
      "A robotic arm controlled by hand gestures using Arduino and machine learning for gesture recognition.",
    description: [
      "Built a robotic arm controlled by hand gestures using Arduino and a machine learning model for gesture recognition. This project demonstrates the integration of AI with physical robotics for intuitive human-machine interaction.",
      "The system uses an accelerometer to capture hand movement data, which is then processed by a machine learning model trained using scikit-learn. The model recognizes specific gestures and translates them into commands for the robotic arm.",
      "The robotic arm is capable of performing basic pick-and-place tasks, making it suitable for educational demonstrations. The project showcases practical applications of gesture recognition in robotics and was well-received at the campus technology expo.",
    ],
    features: [
      "Hand gesture recognition using machine learning",
      "Real-time gesture-to-command translation",
      "Arduino-based servo motor control",
      "Accelerometer sensor integration",
      "Basic pick-and-place task capabilities",
      "Educational demonstration platform",
    ],
    technologies: ["Arduino", "Python", "scikit-learn", "Servo Motors", "Accelerometer"],
    coverImage: "/placeholder.jpg",
    thumbnailImage: "/placeholder.jpg",
    gallery: [
      { url: "/placeholder.jpg", caption: "Robotic arm performing pick-and-place task" },
      { url: "/placeholder.jpg", caption: "Gesture recognition system" },
      { url: "/placeholder.jpg", caption: "Arduino control system" },
      { url: "/placeholder.jpg", caption: "Campus technology expo demonstration" },
    ],
    timeline: "Academic Year 2023-2024",
    role: "Project Team Member",
    githubUrl: "",
    relatedProjects: [
      {
        slug: "ai-object-detection-robot",
        title: "AI-Powered Object Detection Robot",
        category: "AI & Robotics",
        image: "/placeholder.jpg",
      },
      {
        slug: "student-services-chatbot",
        title: "Chatbot for Student Services",
        category: "AI & NLP",
        image: "/placeholder.jpg",
      },
    ],
  },
]

export { projects }

// Add these functions after the projects array export

export function getAllProjects(): Project[] {
  return projects
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

export function getRelatedProjects(currentSlug: string, limit = 2): RelatedProject[] {
  const currentProject = getProjectBySlug(currentSlug)
  if (!currentProject || !currentProject.relatedProjects) {
    // If no related projects defined, return random projects
    return projects
      .filter((project) => project.slug !== currentSlug)
      .slice(0, limit)
      .map((project) => ({
        slug: project.slug,
        title: project.title,
        category: project.category,
        image: project.thumbnailImage,
      }))
  }

  return currentProject.relatedProjects.slice(0, limit)
}
