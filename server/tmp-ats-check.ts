import { runATSCheck } from "./src/services/resumeService.ts";

const sample = {
  personalInfo: {
    name: "Rizwan Alam",
    email: "rizwan@example.com",
    phone: "+1 437 997 4711",
    location: "Mississauga, ON",
    linkedin: "linkedin.com/in/rizwan",
    website: "",
    summary: "Enterprise Application Architect and Project Manager with 20 years of experience delivering cloud and enterprise applications."
  },
  experience: [
    {
      id: "exp-1",
      company: "Cognizant Technology",
      position: "Project Manager / Application Architect",
      startDate: "2021-10",
      endDate: "",
      isCurrentRole: true,
      description: "Led enterprise application modernization initiatives and data analytics programs.",
      achievements: ["Delivered cloud migrations", "Managed cross-functional teams", "Improved system reliability"]
    }
  ],
  education: [],
  skills: {
    technical: ["Azure", "AWS", "Enterprise Architecture", "Data Analytics", "Project Management"],
    soft: ["Leadership", "Stakeholder Management"],
    languages: ["English"],
    certifications: ["PMP"]
  },
  projects: [],
  awards: [],
  references: [],
};

const report = await runATSCheck(sample, "Enterprise Application Architect");
console.log(JSON.stringify(report, null, 2));
