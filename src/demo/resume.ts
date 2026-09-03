/**
 * The demo person, and the resume they uploaded.
 *
 * SWAP THIS. Everything the demo shows on its first screen comes from here, so
 * changing the person is one file. The real app takes a pasted resume or an
 * uploaded PDF; this is a stand-in shaped like what one contains.
 */

export interface DemoIdentity {
  name: string;
  location: string;
  school: string;
  year: string;
  email: string;
}

export interface ResumeSection {
  heading: string;
  entries: Array<{
    title: string;
    meta?: string;
    detail?: string;
    bullets?: string[];
  }>;
}

export const DEMO_IDENTITY: DemoIdentity = {
  name: "Jordan Avery",
  location: "Zionsville, Indiana",
  school: "Zionsville Community High School",
  year: "Senior, class of 2027",
  email: "jordan.avery@example.com",
};

export const DEMO_RESUME: ResumeSection[] = [
  {
    heading: "Education",
    entries: [
      {
        title: "Zionsville Community High School",
        meta: "2023 - 2027",
        detail: "Senior. Coursework in computer science, physics and engineering design.",
      },
    ],
  },
  {
    heading: "Leadership",
    entries: [
      {
        title: "Cofounder, Careers in STEM Outreach",
        meta: "2025 - present",
        bullets: [
          "Built the organisation to 150+ active members across three schools.",
          "Run monthly sessions pairing students with working engineers.",
        ],
      },
      {
        title: "Co-President, Technology Student Association chapter",
        meta: "2026 - present",
        bullets: [
          "Lead a 40-person chapter through state and national competition cycles.",
          "Took two teams to state finals in software development.",
        ],
      },
    ],
  },
  {
    heading: "Robotics",
    entries: [
      {
        title: "Programming lead, VEX Robotics competition team",
        meta: "2024 - present",
        bullets: [
          "Wrote the autonomous routines the team competes on.",
          "Maintain a shared code library other teams in the region now borrow from.",
          "Taught six newer members to write and debug their own autonomous code.",
        ],
      },
    ],
  },
  {
    heading: "Skills",
    entries: [
      {
        title: "Technical",
        detail: "C++, Python, Git, CAD, embedded debugging, control tuning.",
      },
      {
        title: "Other",
        detail: "Teaching and curriculum design, running events, technical writing.",
      },
    ],
  },
];
