// Site-wide settings: identity, links, SEO defaults, navigation, referral links and optional services.
// Other files read these values instead of hard-coding them.

export const site = {
  name: 'Edison',
  title: 'Edison | Cybersecurity Research & Engineering',
  tagline: 'Real investigations. Technical evidence. Reproducible findings.',
  description:
    'Independent cybersecurity research notes by Edison: detection engineering, security monitoring with Wazuh, incident investigation and documented lab experiments.',
  // Canonical public address. Must match `site` in astro.config.mjs.
  url: 'https://edisonbujupi.github.io',
  locale: 'en',
  author: {
    name: 'Edison Bujupi',
    jobTitle: 'Cybersecurity engineer',
    // Optional author image path, relative to the site root. Empty: no image is referenced.
    image: '',
  },
};

// Public profile links. An empty value is not rendered anywhere.
export const social = {
  github: 'https://github.com/EdisonBujupi',
  linkedin: '',
};

export const nav = [
  { label: 'Research', href: '/research/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Wazuh Ambassador', href: '/wazuh-ambassador/' },
  { label: 'Resources', href: '/resources/' },
  { label: 'About', href: '/about/' },
];

// Tracking links that every approved Wazuh Ambassador contribution must include.
export const wazuhLinks = {
  home: 'https://wazuh.com/?utm_source=ambassadors&utm_medium=referral&utm_campaign=ambassadors+program',
  ambassadors:
    'https://wazuh.com/ambassadors-program/?utm_source=ambassadors&utm_medium=referral&utm_campaign=ambassadors+program',
};

// Optional referral links. An entry is rendered only when url, label and description are all set.
// With no active entry, the /recommended/ page and its navigation item are not generated.
export const referrals: { id: string; url: string; label: string; description: string; disclosure: string }[] = [
  { id: 'referral-1', url: '', label: '', description: '', disclosure: '' },
  { id: 'referral-2', url: '', label: '', description: '', disclosure: '' },
];
export const activeReferrals = referrals.filter((r) => r.url && r.label && r.description);
export const referralDisclosure =
  'Some links on this page are referral links. If you use them, I may receive a benefit. I only list resources that I consider relevant to the topic.';

// Optional third-party services. An empty value adds no tag and loads no script.
export const services = {
  googleSiteVerification: '', // Google Search Console verification meta tag content
  bingSiteVerification: '', // Bing Webmaster Tools verification meta tag content
  plausibleDomain: '', // domain registered in Plausible Analytics
  ga4MeasurementId: '', // Google Analytics 4 measurement ID
};

export const categories = [
  { slug: 'detection-engineering', name: 'Detection Engineering', description: 'Rules, logic and tuning that turn raw events into alerts worth reading.' },
  { slug: 'wazuh-security-monitoring', name: 'Wazuh & Security Monitoring', description: 'Wazuh configuration, decoders, rules and monitoring experiments.' },
  { slug: 'dfir', name: 'Digital Forensics & Incident Response', description: 'Evidence collection, timelines and investigation methodology.' },
  { slug: 'network-security', name: 'Network Security', description: 'Traffic analysis, segmentation and network-level controls.' },
  { slug: 'threat-detection-analysis', name: 'Threat Detection & Analysis', description: 'Mapping behaviour to techniques and checking what is really detectable.' },
  { slug: 'infrastructure-security', name: 'Infrastructure Security', description: 'Hardening and configuration of systems that security tools depend on.' },
  { slug: 'technical-experiments', name: 'Technical Experiments', description: 'Small, documented experiments with a clear question and a recorded result.' },
] as const;
export type CategorySlug = (typeof categories)[number]['slug'];
