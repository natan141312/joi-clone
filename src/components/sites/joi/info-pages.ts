// Content for /info/[slug]. Original placeholder copy for this app; replace with your own policies.
export const INFO_PAGES: Record<string, { title: string; body: string[] }> = {
  "generate-videos": {
    title: "Generate videos",
    body: ["Video generation is not available yet in this build.", "Characters can already send pictures when image generation (Stable Diffusion) is configured."],
  },
  creators: {
    title: "Meet the creators",
    body: ["Community characters are made by people using Create AI. Browse them on Explore with the Community creator filter."],
  },
  affiliate: {
    title: "Become an affiliate",
    body: ["The affiliate program is not set up in this build. Add your program details and sign-up link here."],
  },
  "creator-partnership": {
    title: "Creator partnership",
    body: ["Creator partnerships are not set up in this build. Describe your partnership terms and contact address here."],
  },
  "advisory-board": {
    title: "Advisory board",
    body: ["Add information about your advisory board here."],
  },
  safety: {
    title: "Safety",
    body: [
      "All characters must be fictional adults (18+). Characters based on real people are not allowed.",
      "Image generation always excludes minors through a negative prompt, and character ages are validated on the server.",
      "Report a problem through Support.",
    ],
  },
  support: {
    title: "Support",
    body: ["Need help? Add your support email or contact form here."],
  },
  complaints: {
    title: "Complaints policy",
    body: ["Describe how users can file complaints and how quickly you respond."],
  },
  terms: {
    title: "Terms of Service",
    body: ["Write your terms of service here. This project ships without legal text."],
  },
  privacy: {
    title: "Privacy Policy",
    body: ["Chats and characters are stored by this app's server. Describe what you collect, why, and how long you keep it."],
  },
  "2257": {
    title: "18 U.S.C. 2257 statement",
    body: ["All characters in this app are AI-generated fictional adults. No real persons are depicted. Add your compliance statement here."],
  },
  refunds: {
    title: "Refund policy",
    body: ["This build has no payments. Add your refund policy here if you add paid plans."],
  },
};
