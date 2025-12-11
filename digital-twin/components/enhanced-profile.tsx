"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SocialLinks } from "@/components/social-links"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, MapPin, Mail, Phone, Languages, Clock, Briefcase } from "lucide-react"
import { getPersonalInfo, getAboutInfo } from "@/lib/data"

export function EnhancedProfile() {
  const [activeTab, setActiveTab] = useState("about")

  const personalInfo = getPersonalInfo()
  const aboutInfo = getAboutInfo()

  return (
    <Card className="bg-white/95 dark:bg-card/70 border border-gray-200 dark:border-border backdrop-blur-sm col-span-1 flex flex-col shadow-sm">
      <CardContent className="p-0">
        {/* Profile Header - Improved mobile layout */}
        <div className="bg-gradient-to-r from-slate-100 to-gray-50 dark:from-muted/50 dark:to-card/50 p-4 sm:p-6 flex flex-col items-center border-b border-gray-200 dark:border-border">
          <div className="flex flex-col sm:flex-col items-center w-full">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-4 border-2 border-primary/20 ring-4 ring-muted/50">
              <Image
                src={personalInfo.avatar || "/nyah_pfp.jpg"}
                alt={personalInfo.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{personalInfo.name}</h2>
              <p className="text-sm text-primary mb-1">{personalInfo.title}</p>
              <div className="flex items-center justify-center text-xs text-muted-foreground mb-3">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{personalInfo.location}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {personalInfo.badges.map((badge, index) => (
              <Badge key={index} variant="outline" className="bg-slate-100 dark:bg-muted/50 hover:bg-slate-200 dark:hover:bg-muted border-gray-300 dark:border-muted">
                {badge}
              </Badge>
            ))}
          </div>

          <SocialLinks socialLinks={personalInfo.social} />
        </div>

        {/* Tabbed Content - Mobile optimized */}
        <Tabs defaultValue="about" className="w-full" onValueChange={setActiveTab}>
          <div className="border-b border-border">
            <TabsList className="w-full bg-transparent border-b border-border rounded-none h-auto p-0">
              <TabsTrigger
                value="about"
                className={`flex-1 rounded-none border-b-2 px-2 sm:px-4 py-2 text-xs sm:text-sm transition-colors
                  ${activeTab === "about"
                    ? "border-primary bg-gradient-to-r from-blue-50 to-blue-100 dark:from-[#22d3ee]/30 dark:to-[#22d3ee]/10 text-primary"
                    : "border-transparent bg-transparent text-muted-foreground"}
                `}
              >
                <User className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${activeTab === "about" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={activeTab === "about" ? "text-primary" : "text-muted-foreground"}>About</span>
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className={`flex-1 rounded-none border-b-2 px-2 sm:px-4 py-2 text-xs sm:text-sm transition-colors
                  ${activeTab === "contact"
                    ? "border-primary bg-gradient-to-r from-blue-50 to-blue-100 dark:from-[#22d3ee]/30 dark:to-[#22d3ee]/10 text-primary"
                    : "border-transparent bg-transparent text-muted-foreground"}
                `}
              >
                <Mail className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${activeTab === "contact" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={activeTab === "contact" ? "text-primary" : "text-muted-foreground"}>Contact</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="about" className="p-4 sm:p-6 space-y-4 sm:space-y-6 focus:outline-none">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <User className="w-4 h-4 mr-2 text-primary" />
                About Me
              </h3>
              <p className="text-sm text-foreground">{aboutInfo.bio}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-primary" />
                Professional Focus
              </h3>
              <div className="space-y-2">
                {aboutInfo.focus.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <Languages className="w-4 h-4 mr-2 text-primary" />
                Languages
              </h3>
              <div className="space-y-3">
                {aboutInfo.languages.map((language, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{language.name}</span>
                      <span className="text-xs text-muted-foreground">{language.proficiency}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                        style={{ width: `${language.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="p-4 sm:p-6 space-y-4 focus:outline-none">
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Email</h4>
                  <a
                    href={`mailto:${personalInfo.email}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors break-all"
                  >
                    {personalInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Phone</h4>
                  <a
                    href={`tel:${personalInfo.phone}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {personalInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Location</h4>
                  <p className="text-sm text-muted-foreground">{personalInfo.location}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Working Hours</h4>
                  <p className="text-sm text-muted-foreground">{personalInfo.workingHours}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Profile Footer - Availability Status */}
        <div className="p-3 sm:p-4 border-t border-border flex items-center justify-center">
          <div className="flex items-center">
            <span
              className={`w-2 h-2 ${personalInfo.availableForWork ? "bg-green-500" : "bg-red-500"} rounded-full mr-2`}
            ></span>
            <span className="text-xs text-muted-foreground">
              {personalInfo.availableForWork ? "Available for new projects" : "Not available for new projects"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
