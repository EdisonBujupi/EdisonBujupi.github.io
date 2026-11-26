// Technical references listed under /resources/.
// To add a resource, add an item below. A category page is generated only when the category has at least one item.
// Category descriptions are also used as meta descriptions and must be 50 to 200 characters long.

export interface ResourceCategory {
  slug: string;
  name: string;
  description: string;
}

export interface ResourceItem {
  title: string;
  url: string;
  description: string;
  category: string;
}

export const resourceCategories: ResourceCategory[] = [
  {
    slug: 'wazuh-documentation',
    name: 'Wazuh documentation',
    description: 'Official Wazuh documentation used for writing and testing custom detection rules.',
  },
  {
    slug: 'linux-auditing',
    name: 'Linux auditing',
    description: 'References for recording process execution on Linux with auditd and forwarding the events to Wazuh.',
  },
  {
    slug: 'mitre-attack',
    name: 'MITRE ATT&CK',
    description: 'MITRE ATT&CK technique pages for the behaviour covered by the detection rules in the articles.',
  },
];

export const resources: ResourceItem[] = [
  {
    title: 'Custom rules (rule ID range 100000 to 120000)',
    url: 'https://documentation.wazuh.com/current/user-manual/ruleset/rules/custom.html',
    description: 'How to write and place your own rules, and which ID range is reserved for them.',
    category: 'wazuh-documentation',
  },
  {
    title: 'Monitoring execution of malicious commands with auditd',
    url: 'https://documentation.wazuh.com/4.14/proof-of-concept-guide/audit-commands-run-by-user.html',
    description: 'The official guide that uses auditd with Wazuh.',
    category: 'linux-auditing',
  },
  {
    title: 'MITRE ATT&CK T1059: Command and Scripting Interpreter',
    url: 'https://attack.mitre.org/techniques/T1059/',
    description: 'Covers shells and interpreters. Running one is not an attack by itself.',
    category: 'mitre-attack',
  },
  {
    title: 'MITRE ATT&CK T1105: Ingress Tool Transfer',
    url: 'https://attack.mitre.org/techniques/T1105/',
    description: 'Covers bringing tools onto a system, for example with curl.',
    category: 'mitre-attack',
  },
];

export const resourcesIn = (slug: string) => resources.filter((r) => r.category === slug);

// Categories that have at least one item, in the order listed above.
export const activeResourceCategories = resourceCategories.filter((c) => resourcesIn(c.slug).length > 0);
