/** The product name, tagline and footer details live here only; rename or re-link in one place. */
export const brand = {
  name: "AlgoMigo",
  /** How to say it. */
  pronunciation: "Al-go-MEE-go",
  tagline: "Your friendly companion for mastering DSA.",
  description:
    "AlgoMigo helps you learn data structures and algorithms by watching them run: step-by-step visualizations, everyday stories, and synchronized Java, Python, C++ and C code.",
  country: "India",
  /**
   * Social links shown in the footer. A link with an empty string is not shown.
   * Replace these with the real profile addresses once the accounts exist.
   */
  social: {
    github: "https://github.com",
    linkedin: "https://www.linkedin.com",
    x: "https://x.com",
    instagram: "https://www.instagram.com",
    youtube: "https://www.youtube.com",
  },
  /** Shown as a mailto link in the footer when not empty. */
  contactEmail: "",
} as const;
