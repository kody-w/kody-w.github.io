window.d365Simulation = {
  title: 'Frame-by-Frame Dynamics 365 Proof',
  frames: [
    {
      id: 'lead-captured',
      label: 'Frame 01 / Lead Captured',
      clock: 'Inbound demo request landed and crossed the routing threshold.',
      summary: 'The machine detects a new enterprise lead, opens the qualification queue, and records the first usable customer state.',
      note: 'This is the first durable frame: the lead now exists, the routing logic has fired, and the next operator can act without rediscovering context.',
      machine: {
        sales: 'lead-intake',
        service: 'standby',
        finance: 'not-engaged',
        success: 'not-engaged',
        automation: 'triage-running'
      },
      transitions: [
        { entity: 'lead:LE-1001', from: 'none', to: 'new', note: 'Website form created the first CRM record.' },
        { entity: 'queue:sales-qualification', from: 'idle', to: 'open', note: 'SDR tasking woke up automatically.' },
        { entity: 'automation:dedupe-check', from: 'none', to: 'complete', note: 'The machine confirmed this is net-new demand.' }
      ],
      entities: {
        accounts: [],
        leads: [
          { id: 'LE-1001', company: 'Northwind Health', stage: 'New', score: '78', owner: 'Maya Chen' }
        ],
        opportunities: [],
        cases: [],
        tasks: [
          { id: 'TASK-301', queue: 'Sales', title: 'Qualify inbound request', status: 'In Progress' },
          { id: 'TASK-302', queue: 'Ops', title: 'Enrich firmographic record', status: 'Ready' },
          { id: 'TASK-303', queue: 'Sales', title: 'Book discovery call', status: 'Ready' }
        ]
      },
      automations: [
        { id: 'AUTO-401', trigger: 'Web form submitted', action: 'Deduplicate against active accounts', status: 'Complete' },
        { id: 'AUTO-402', trigger: 'Lead score > 70', action: 'Assign SDR and wake qualification queue', status: 'Active' }
      ]
    },
    {
      id: 'lead-qualified',
      label: 'Frame 02 / Lead Qualified',
      clock: 'Discovery call completed and budget authority was confirmed.',
      summary: 'The system upgrades a lead into an account and opportunity, carrying forward all prior context instead of starting from zero.',
      note: 'The important move is continuity: the machine is not just storing activity, it is promoting state in a traceable way.',
      machine: {
        sales: 'qualified-pipeline',
        service: 'standby',
        finance: 'pre-sales-review',
        success: 'pre-handoff',
        automation: 'pipeline-creation'
      },
      transitions: [
        { entity: 'account:ACC-201', from: 'none', to: 'prospect', note: 'The machine now has a canonical customer record.' },
        { entity: 'opportunity:OPP-501', from: 'none', to: 'discover', note: 'Pipeline state became visible and forecastable.' },
        { entity: 'lead:LE-1001', from: 'new', to: 'qualified', note: 'Lead state was preserved instead of discarded.' }
      ],
      entities: {
        accounts: [
          { id: 'ACC-201', name: 'Northwind Health', lifecycle: 'Prospect', owner: 'Maya Chen', health: 'Watch' }
        ],
        leads: [
          { id: 'LE-1001', company: 'Northwind Health', stage: 'Qualified', score: '91', owner: 'Maya Chen' }
        ],
        opportunities: [
          { id: 'OPP-501', name: 'Unified Service Cloud', stage: 'Discover', amount: 180000, owner: 'Maya Chen', next: 'Architecture workshop' }
        ],
        cases: [],
        tasks: [
          { id: 'TASK-304', queue: 'Sales', title: 'Run architecture workshop', status: 'Ready' },
          { id: 'TASK-305', queue: 'Finance', title: 'Pre-sales pricing review', status: 'Ready' },
          { id: 'TASK-306', queue: 'Success', title: 'Draft onboarding assumptions', status: 'Ready' }
        ]
      },
      automations: [
        { id: 'AUTO-403', trigger: 'Lead marked Qualified', action: 'Create account and opportunity', status: 'Complete' },
        { id: 'AUTO-404', trigger: 'Enterprise opportunity opened', action: 'Start stakeholder map workflow', status: 'Active' }
      ]
    },
    {
      id: 'solution-design',
      label: 'Frame 03 / Solution Design',
      clock: 'Workshop outputs were approved and the machine moved the deal into structured solutioning.',
      summary: 'The system now coordinates cross-team design work, pricing, and implementation planning as a single visible state machine.',
      note: 'This is where the CRM stops being a contact log and starts acting like an operational control surface.',
      machine: {
        sales: 'solutioning',
        service: 'implementation-planning',
        finance: 'pricing-review',
        success: 'onboarding-design',
        automation: 'quote-prep'
      },
      transitions: [
        { entity: 'opportunity:OPP-501', from: 'discover', to: 'solutioning', note: 'Commercial state advanced after technical validation.' },
        { entity: 'queue:implementation-plan', from: 'idle', to: 'open', note: 'Service and success teams were pulled into the same frame.' },
        { entity: 'automation:quote-builder', from: 'idle', to: 'active', note: 'The machine started preparing proposal outputs.' }
      ],
      entities: {
        accounts: [
          { id: 'ACC-201', name: 'Northwind Health', lifecycle: 'Prospect', owner: 'Maya Chen', health: 'Warm' }
        ],
        leads: [
          { id: 'LE-1001', company: 'Northwind Health', stage: 'Qualified', score: '91', owner: 'Maya Chen' }
        ],
        opportunities: [
          { id: 'OPP-501', name: 'Unified Service Cloud', stage: 'Solutioning', amount: 220000, owner: 'Maya Chen', next: 'Finalize proposal scope' }
        ],
        cases: [],
        tasks: [
          { id: 'TASK-307', queue: 'Service', title: 'Draft migration plan', status: 'In Progress' },
          { id: 'TASK-308', queue: 'Finance', title: 'Approve pricing bands', status: 'Ready' },
          { id: 'TASK-309', queue: 'Success', title: 'Define adoption milestones', status: 'Ready' }
        ]
      },
      automations: [
        { id: 'AUTO-405', trigger: 'Solutioning stage entered', action: 'Generate proposal skeleton', status: 'Active' },
        { id: 'AUTO-406', trigger: 'Implementation planning opened', action: 'Create service work queue', status: 'Complete' }
      ]
    },
    {
      id: 'quote-approved',
      label: 'Frame 04 / Quote Approved',
      clock: 'Pricing approval and scope review completed, allowing the machine to publish a commercial offer.',
      summary: 'The CRM now behaves like a contract machine: quote, approvals, downstream tasks, and risk surfaces all live in one replayable frame.',
      note: 'This is where a static site starts to feel like Dynamics 365: forecast, approvals, and execution planning are all synchronized.',
      machine: {
        sales: 'proposal',
        service: 'pre-onboarding',
        finance: 'approval-complete',
        success: 'ready-for-handoff',
        automation: 'contract-routing'
      },
      transitions: [
        { entity: 'opportunity:OPP-501', from: 'solutioning', to: 'proposal', note: 'Revenue expectation became commercially concrete.' },
        { entity: 'finance:approval-state', from: 'review', to: 'approved', note: 'The quote can now leave internal review.' },
        { entity: 'automation:contract-router', from: 'idle', to: 'active', note: 'Legal and procurement work is now machine-triggered.' }
      ],
      entities: {
        accounts: [
          { id: 'ACC-201', name: 'Northwind Health', lifecycle: 'Prospect', owner: 'Maya Chen', health: 'Warm' }
        ],
        leads: [
          { id: 'LE-1001', company: 'Northwind Health', stage: 'Qualified', score: '91', owner: 'Maya Chen' }
        ],
        opportunities: [
          { id: 'OPP-501', name: 'Unified Service Cloud', stage: 'Proposal', amount: 240000, owner: 'Maya Chen', next: 'Finalize procurement' }
        ],
        cases: [],
        tasks: [
          { id: 'TASK-310', queue: 'Legal', title: 'Review statement of work', status: 'Ready' },
          { id: 'TASK-311', queue: 'Finance', title: 'Generate payment schedule', status: 'Ready' },
          { id: 'TASK-312', queue: 'Success', title: 'Prepare kickoff agenda', status: 'Ready' }
        ]
      },
      automations: [
        { id: 'AUTO-407', trigger: 'Quote approved', action: 'Send contract package to customer', status: 'Complete' },
        { id: 'AUTO-408', trigger: 'Proposal stage entered', action: 'Open legal and finance subtasks', status: 'Active' }
      ]
    },
    {
      id: 'deal-won-risk-opened',
      label: 'Frame 05 / Deal Won, Service Risk Opened',
      clock: 'The contract closed, but implementation telemetry detected a migration failure and opened a high-severity case.',
      summary: 'This is the useful part of the proof: revenue, onboarding, and incident response all coexist in one machine instead of living in disconnected tools.',
      note: 'A real business system has to carry both success and failure at the same time. The frame machine can do that visibly.',
      machine: {
        sales: 'closed-won',
        service: 'incident-response',
        finance: 'invoice-issued',
        success: 'onboarding-at-risk',
        automation: 'sla-watch'
      },
      transitions: [
        { entity: 'opportunity:OPP-501', from: 'proposal', to: 'closed-won', note: 'Revenue is now recognized as committed business.' },
        { entity: 'case:CASE-901', from: 'none', to: 'open-high', note: 'Implementation trouble became part of the same visible state.' },
        { entity: 'account:ACC-201', from: 'prospect', to: 'customer', note: 'The lifecycle advanced even as delivery risk appeared.' }
      ],
      entities: {
        accounts: [
          { id: 'ACC-201', name: 'Northwind Health', lifecycle: 'Customer', owner: 'Maya Chen', health: 'At Risk' }
        ],
        leads: [
          { id: 'LE-1001', company: 'Northwind Health', stage: 'Converted', score: '91', owner: 'Maya Chen' }
        ],
        opportunities: [
          { id: 'OPP-501', name: 'Unified Service Cloud', stage: 'Closed Won', amount: 240000, owner: 'Maya Chen', next: 'Track adoption risk' }
        ],
        cases: [
          { id: 'CASE-901', title: 'Migration batch failed', severity: 'High', status: 'Open', owner: 'Priya Patel' }
        ],
        tasks: [
          { id: 'TASK-313', queue: 'Service', title: 'Recover failed migration batch', status: 'In Progress' },
          { id: 'TASK-314', queue: 'Success', title: 'Call customer sponsor', status: 'Ready' },
          { id: 'TASK-315', queue: 'Finance', title: 'Hold expansion invoice', status: 'Ready' }
        ]
      },
      automations: [
        { id: 'AUTO-409', trigger: 'Closed Won', action: 'Create onboarding project', status: 'Complete' },
        { id: 'AUTO-410', trigger: 'High severity case opened', action: 'Wake SLA watch and executive alert', status: 'Active' }
      ]
    },
    {
      id: 'recovery-and-renewal',
      label: 'Frame 06 / Recovery and Renewal',
      clock: 'The incident was resolved, account health recovered, and the machine opened the renewal path from the same lineage.',
      summary: 'The proof closes the loop: the state machine absorbed delivery trouble, resolved it, and turned the same account into a renewal motion without breaking continuity.',
      note: 'This is why the frame model is useful. One visible system can hold demand, revenue, service risk, and future expansion in a single replayable history.',
      machine: {
        sales: 'renewal-open',
        service: 'stable',
        finance: 'billing-live',
        success: 'healthy-adoption',
        automation: 'renewal-scouting'
      },
      transitions: [
        { entity: 'case:CASE-901', from: 'open-high', to: 'resolved', note: 'Service state recovered without losing the incident history.' },
        { entity: 'account:ACC-201', from: 'at-risk', to: 'healthy', note: 'Customer health improved after the intervention landed.' },
        { entity: 'opportunity:OPP-611', from: 'none', to: 'renewal', note: 'The machine opened the next commercial motion from the same account state.' }
      ],
      entities: {
        accounts: [
          { id: 'ACC-201', name: 'Northwind Health', lifecycle: 'Customer', owner: 'Maya Chen', health: 'Healthy' }
        ],
        leads: [
          { id: 'LE-1001', company: 'Northwind Health', stage: 'Converted', score: '91', owner: 'Maya Chen' }
        ],
        opportunities: [
          { id: 'OPP-501', name: 'Unified Service Cloud', stage: 'Closed Won', amount: 240000, owner: 'Maya Chen', next: 'Protect expansion path' },
          { id: 'OPP-611', name: 'Renewal and Expansion', stage: 'Renewal', amount: 260000, owner: 'Maya Chen', next: 'Run executive business review' }
        ],
        cases: [
          { id: 'CASE-901', title: 'Migration batch failed', severity: 'High', status: 'Resolved', owner: 'Priya Patel' }
        ],
        tasks: [
          { id: 'TASK-316', queue: 'Success', title: 'Run executive business review', status: 'Ready' },
          { id: 'TASK-317', queue: 'Sales', title: 'Build renewal plan', status: 'Ready' },
          { id: 'TASK-318', queue: 'Finance', title: 'Confirm billing health', status: 'Done' }
        ]
      },
      automations: [
        { id: 'AUTO-411', trigger: 'Case resolved', action: 'Recalculate account health score', status: 'Complete' },
        { id: 'AUTO-412', trigger: 'Account health healthy for 14 days', action: 'Open renewal scouting motion', status: 'Active' }
      ]
    }
  ]
};
