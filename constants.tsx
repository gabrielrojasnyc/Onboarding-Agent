// constants.tsx
import React from 'react';
import { AgentConfig, Task, AgentTone, AgentAvatar, MapLocation } from './types';

// Agent Avatars for Personalization
export const RobotIcon1: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M12 8V4H8" />
    <rect x="4" y="12" width="16" height="8" rx="2" />
    <path d="M6 12V8a2 2 0 012-2h4a2 2 0 012 2v4" />
    <circle cx="8.5" cy="16.5" r=".5" fill="currentColor" />
    <circle cx="15.5" cy="16.5" r=".5" fill="currentColor" />
  </svg>
);

export const RobotIcon2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
    <path d="M12 8V6" />
    <path d="M12 18v-2" />
  </svg>
);

export const RobotIcon3: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <rect x="7" y="9" width="10" height="7" rx="2" />
    <circle cx="10" cy="12.5" r="0.5" fill="currentColor" />
    <circle cx="14" cy="12.5" r="0.5" fill="currentColor" />
    <path d="M15 9V7a1 1 0 0 0-1-1h-1" />
  </svg>
);

export const RobotIcon4: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M16.5 7.5L18 6" />
    <path d="M7.5 7.5L6 6" />
    <path d="M12 20.5V19" />
    <path d="M4 14.5h16" />
    <path d="M17.5 14.5a5.5 5.5 0 10-11 0" />
  </svg>
);

export const AGENT_AVATARS: AgentAvatar[] = [
  { id: 'avatar1', component: RobotIcon1 },
  { id: 'avatar2', component: RobotIcon2 },
  { id: 'avatar3', component: RobotIcon3 },
  { id: 'avatar4', component: RobotIcon4 },
];

// Agent Tones for Personalization
export const AGENT_TONES: AgentTone[] = [
  {
    id: 'friendly',
    label: 'Friendly & Casual',
    description: 'A relaxed and encouraging tone.',
    promptValue: 'Friendly, casual, and encouraging'
  },
  {
    id: 'professional',
    label: 'Clear & Professional',
    description: 'A direct and efficient tone.',
    promptValue: 'Clear, professional, and direct'
  }
];

// Task Icons
const SafetyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 13.2V8.5a2 2 0 0 0-2-2h-3.5a1.5 1.5 0 0 1-3 0H8a2 2 0 0 0-2 2v4.7c0 2.5 1.2 4.8 3.2 6.3 1.8 1.3 4.2 1.3 6 0 2-1.5 3.2-3.8 3.2-6.3Z"/></svg>
);

const FacilityMapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.106 11.233a1 1 0 0 0-1.298 1.402l2.45 3.674a1 1 0 0 0 1.62-.288l2.91-5.642a1 1 0 0 0-.21-1.258l-4.32-3.952a1 1 0 0 0-1.383.053L12 6.516"/><path d="m12 6.516-1.57-2.355a1 1 0 0 0-1.382-.054L4.72 8.058a1 1 0 0 0-.21 1.258l2.91 5.642a1 1 0 0 0 1.62.288l2.45-3.674a1 1 0 0 0-1.298-1.402Z"/><path d="M12 22v-3.5"/><path d="M12 6.5V2"/></svg>
);

const TimeClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="12" x2="12" y1="2" y2="4"/><path d="M12 18V12h-2"/><path d="M16 4h-2"/><path d="M8 4H6"/></svg>
);

const SupervisorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const LunchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2v8"/><path d="M15 5H9"/><path d="M2 12h20"/><path d="M7 12a5 5 0 0 1 5 5v5H7v-5a5 5 0 0 1 0-5Z"/><path d="M17 12a5 5 0 0 0-5 5v5h5v-5a5 5 0 0 0 0-5Z"/></svg>
);

const DocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const DirectDepositIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="12" x="2" y="6" rx="2"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M6 12h.01M18 12h.01"/>
    </svg>
);

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
);

export const PriorityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 6.5a4.5 4.5 0 0 0-5.4 1.4 4.5 4.5 0 0 0-1.4 5.4 4.5 4.5 0 0 0 5.4 1.4 4.5 4.5 0 0 0 1.4-5.4Z"/>
    <path d="M12 18c-3 0-5-2-5-5s2-5 5-5 5 2 5 5-2 5-5 5Z"/>
    <path d="M12 4V2"/>
    <path d="m18.5 5.5.8-.8"/>
    <path d="m5.5 5.5-.8-.8"/>
  </svg>
);


// Chat UI Icons
export const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
);

export const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
);


export const ThinkingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="4" cy="12" r="2" className="animate-[pulse_1.5s_ease-in-out_infinite]" />
    <circle cx="12" cy="12" r="2" className="animate-[pulse_1.5s_ease-in-out_0.25s_infinite]" />
    <circle cx="20" cy="12" r="2" className="animate-[pulse_1.5s_ease-in-out_0.5s_infinite]" />
  </svg>
);

export const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

// Map Icons
const WorkstationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const FirstAidIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/><path d="M12 10.5V12h1.5"/></svg>
);
const ExitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M17 16l4-4-4-4"/><path d="M21 12H9"/></svg>
);
const EntranceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/>
    <path d="M13 16h- аспекты 1a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1"/>
    <path d="m9 12 2-2-2-2"/>
  </svg>
);
export const UserLocationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="12" r="8" fillOpacity="0.3" className="text-blue-500" />
    <circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2" className="text-blue-600"/>
  </svg>
);


export const FacilityFloorPlan: React.FC = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full absolute inset-0 text-[5px] font-sans" strokeWidth="0.5" stroke="#475569">
      <g fill="#f1f5f9" stroke="#94a3b8">
        {/* Roads */}
        <path d="M0 20 H30 C40 20 40 10 50 10 H220 C230 10 230 0 240 0 H260 C270 0 270 10 280 10 H350" fill="none" stroke="#d4d4d8" strokeWidth="12" />
        <path d="M350 10 V 290 H340 L330 290 C320 290 320 300 310 300 H 20 C 10 300 10 290 0 290 V 20" fill="none" stroke="#d4d4d8" strokeWidth="12" />
        <path d="M30 20 V 160 H20" fill="none" stroke="#d4d4d8" strokeWidth="8" />
        <path d="M40 160 H200" fill="none" stroke="#d4d4d8" strokeWidth="8" />
      </g>

      {/* Main Building North */}
      <g id="main-building-north">
        <path d="M50 30 H220 L210 140 H60 Z" fill="#f8fafc"/>
        
        {/* Zone Yellow */}
        <path d="M60 100 H210 V 140 H60 Z" fill="#fef9c3" />
        <text x="135" y="120" textAnchor="middle" stroke="none" fill="#a16207">A100 Storage & Logistics</text>
        
        {/* Zones Green */}
        <rect x="60" y="30" width="80" height="70" fill="#f0fdf4" />
        <rect x="140" y="30" width="70" height="35" fill="#f0fdf4" />
        <rect x="140" y="65" width="70" height="35" fill="#f0fdf4" />
        
        {/* Zone dividers */}
        <path d="M140 30 V 100 M60 65 H 140" />

        {/* Labels for Green Zones */}
        <text x="100" y="48" textAnchor="middle" stroke="none" fill="#166534">A109 General Assembly</text>
        <text x="100" y="83" textAnchor="middle" stroke="none" fill="#166534">A106 Plastics/Seats</text>
        <text x="175" y="48" textAnchor="middle" stroke="none" fill="#166534">A101 Stamping</text>
        <text x="175" y="83" textAnchor="middle" stroke="none" fill="#166534">A102 Casting</text>
      </g>

      {/* Main Building South */}
      <g id="main-building-south">
        <rect x="50" y="170" width="150" height="110" fill="#f0fdf4" />
        <text x="80" y="225" textAnchor="middle" stroke="none" fill="#166534">A003 Body In White</text>
        <text x="145" y="185" textAnchor="middle" stroke="none" fill="#166534">A004 Paint</text>
        <text x="145" y="225" textAnchor="middle" stroke="none" fill="#166534">A006 Plastics</text>
        <text x="80" y="265" textAnchor="middle" stroke="none" fill="#166534">A009 General Assembly</text>

        {/* Zone dividers */}
        <path d="M110 170 V 280 M50 200 H 110 M50 250 H 200" />
      </g>

      {/* Battery/Drive Unit Building */}
      <g id="battery-building">
        <path d="M210 170 H 310 V 280 H 210 V 170 Z" fill="#f1f5f9" />
        <rect x="215" y="175" width="45" height="100" fill="#f0fdf4" />
        <rect x="265" y="175" width="40" height="50" fill="#fee2e2" />
        <rect x="265" y="230" width="40" height="45" fill="#f0fdf4" />
        <text x="237" y="225" textAnchor="middle" stroke="none" fill="#166534">Drive Unit / Battery Pack</text>
        <text x="285" y="200" textAnchor="middle" stroke="none" fill="#991b1b">A120 Battery Cell Expansion</text>
        <text x="285" y="255" textAnchor="middle" stroke="none" fill="#166534">Battery Cells</text>
      </g>

      {/* Other buildings */}
      <g id="other-buildings">
        <rect x="250" y="30" width="80" height="110" fill="#f1f5f9" />
        <rect x="280" y="40" width="40" height="30" fill="#fee2e2" />
        <text x="300" y="55" textAnchor="middle" stroke="none" fill="#991b1b">EB</text>
        <rect x="260" y="80" width="60" height="50" fill="#f0fdf4" />
        <text x="290" y="105" textAnchor="middle" stroke="none" fill="#166534">Logistics</text>
      </g>
    </svg>
);


// Default Agent Configuration
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: 'Manny',
  persona: 'Manufacturing Onboarding Agent',
  avatarId: 'avatar3',
  toneId: 'friendly',
};

// New Hire Content
export const EMPLOYEE_DATA = {
  name: 'Alex',
  role: 'Assembly Line Technician',
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Get Safety Gear (PPE)',
    description: 'Find the PPE station and get your gear.',
    completed: false,
    priority: 'normal',
    icon: SafetyIcon,
  },
  {
    id: 'task-2',
    title: 'Facility Tour',
    description: 'Locate exits, first-aid, and your work station.',
    completed: false,
    priority: 'normal',
    icon: FacilityMapIcon,
  },
  {
    id: 'task-3',
    title: 'Clock-In/Out Procedure',
    description: 'Learn how to use the time clock system.',
    completed: false,
    priority: 'normal',
    icon: TimeClockIcon,
  },
  {
    id: 'task-7',
    title: 'Set Up Direct Deposit',
    description: 'Securely enter your bank details for payroll.',
    completed: false,
    priority: 'normal',
    icon: DirectDepositIcon,
  },
   {
    id: 'task-8',
    title: 'Upload I-9 Form',
    description: 'Submit your signed I-9 form for verification.',
    completed: false,
    priority: 'normal',
    icon: UploadIcon,
  },
  {
    id: 'task-4',
    title: 'Meet Your Supervisor',
    description: 'Introduce yourself to your shift supervisor.',
    completed: false,
    priority: 'normal',
    icon: SupervisorIcon,
  },
  {
    id: 'task-5',
    title: 'Find Lunch Nearby',
    description: 'Find a good place for lunch near the facility.',
    completed: false,
    priority: 'normal',
    icon: LunchIcon,
  },
  {
    id: 'task-6',
    title: 'Review Safety Document',
    description: 'Read the safety document and ask questions.',
    completed: false,
    priority: 'normal',
    icon: DocumentIcon,
  },
];

export const MAP_LOCATIONS: MapLocation[] = [
  {
    id: 'entrance',
    label: 'Main Entrance',
    description: 'This is the main entrance where you start your day.',
    coords: { x: 40, y: 165 },
    icon: EntranceIcon,
  },
  {
    id: 'workstation',
    label: 'Your Workstation',
    description: 'This is in General Assembly (A009). Keep it clean and organized!',
    coords: { x: 80, y: 265 },
    icon: WorkstationIcon,
  },
  {
    id: 'ppe',
    label: 'PPE Station',
    description: 'Grab your required Personal Protective Equipment here at the start of every shift.',
    coords: { x: 65, y: 155 },
    icon: SafetyIcon,
  },
  {
    id: 'first-aid',
    label: 'First-Aid Station',
    description: 'In case of minor injuries, you can find first-aid supplies here. Report all incidents.',
    coords: { x: 180, y: 155 },
    icon: FirstAidIcon,
  },
  {
    id: 'exit',
    label: 'Emergency Exit',
    description: 'This is a primary emergency exit. Know your evacuation routes!',
    coords: { x: 215, y: 35 },
    icon: ExitIcon,
  }
];

export const SAFETY_DOCUMENT = {
  title: 'Safety Protocol SH-01: General Workplace Safety',
  content: `All employees are required to adhere to the following safety protocols to ensure a safe and productive work environment. Failure to comply may result in disciplinary action.

1.  Personal Protective Equipment (PPE):
    *   Safety glasses are mandatory at all times on the facility floor.
    *   Hard hats must be worn in designated construction and overhead work zones.
    *   Steel-toed boots are required for all personnel working in the warehouse and on the assembly line.
    *   Gloves appropriate for the task must be worn when handling materials or operating machinery.

2.  Emergency Procedures:
    *   In case of fire, activate the nearest fire alarm pull station and evacuate immediately via the closest emergency exit. Do not use elevators.
    *   For medical emergencies, contact your supervisor and the designated first-aid responders at extension 555. Provide the location and nature of the injury.
    *   In the event of a chemical spill, evacuate the immediate area and notify a supervisor. Do not attempt to clean the spill unless you are trained to do so.

3.  Machinery Operation:
    *   Only trained and authorized personnel are permitted to operate machinery.
    *   Never bypass or disable safety guards or emergency stop buttons.
    *   Report any equipment malfunction or unusual noise to your supervisor immediately. Do not attempt to repair machinery yourself.

4.  Hazard Communication:
    *   Familiarize yourself with the Safety Data Sheets (SDS) for any chemicals you work with. These are located in the yellow binder near the shift supervisor's desk.
    *   Report any potential hazards, such as wet floors, blocked walkways, or frayed electrical cords, to your supervisor.

Your safety is our top priority. By following these guidelines, you help protect yourself and your colleagues.`
};