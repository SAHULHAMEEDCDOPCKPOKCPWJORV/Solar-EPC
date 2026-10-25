export type PageState = 'LOGIN' | 'DETAILS' | 'WORKSPACE';

export type ProjectType = 
  | 'Utility-Scale Solar PV'
  | 'Rooftop Solar PV'
  | 'Ground-Mounted Solar PV'
  | 'Floating Solar PV'
  | 'Solar PV with Battery Energy Storage'
  | 'Solar PV with Associated Grid Infrastructure'
  | 'Other Solar EPC Project';

export type ExecutionModel = 
  | 'EPC'
  | 'Engineering and Construction'
  | 'Design, Supply and Installation'
  | 'BOP (Balance of Plant)'
  | 'Custom Execution Model';

export type ModuleMountingType = 
  | 'Fixed Tilt (South Oriented)'
  | 'Single Axis Tracker (Horizontal)'
  | 'Seasonal Tilt'
  | 'Dual Axis Tracker'
  | 'Rooftop Ballasted / Clamped'
  | 'Floating Pontoon System';

export type FoundationType = 
  | 'Driven Pre-galvanized Steel Piles'
  | 'Cast-in-situ Concrete Piles'
  | 'Ground Screws / Helical Piles'
  | 'Precast Concrete Ballasts'
  | 'Direct Embedment with Micropiling';

export type InverterConfig = 
  | 'Central Inverters (with MV Skid)'
  | 'High-Power String Inverters (250kW+)'
  | 'Distributed String Inverters (100-150kW)'
  | 'Microinverters';

export type WorkingCalendarType = '6_DAYS_WEEK' | '5.5_DAYS_WEEK' | '5_DAYS_WEEK' | '7_DAYS_WEEK';

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface DependencyLink {
  id: string;
  predecessorId: string; // Activity ID or code
  successorId: string;
  type: DependencyType;
  lagDays: number;
}

export interface WbsItem {
  id: string;
  code: string; // e.g., "1.0", "2.0"
  name: string;
  parentId?: string | null;
  level: number;
  color: string;
  description?: string;
  isExpanded?: boolean;
  startDate?: string;
  finishDate?: string;
  duration?: number;
}

export interface ActivityItem {
  id: string;
  wbsId: string;
  code: string; // e.g. "DEV-001", "LAND-001"
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  finishDate: string; // YYYY-MM-DD
  duration: number; // working days
  calendarId: string;
  predecessors: string[]; // e.g. ["1.1", "DEV-001"] or IDs
  predecessorLinks?: DependencyLink[];
  successors?: string[];
  dependencyType?: DependencyType;
  lag?: number;
  isMilestone: boolean;
  status: 'Not Started' | 'In Progress' | 'Completed';
  color: string;
  
  // CPM Calculations
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  totalFloat?: number;
  freeFloat?: number;
  isCritical?: boolean;

  // Baseline Comparison
  baselineStart?: string;
  baselineFinish?: string;
  baselineDuration?: number;
}

export interface ProjectScopeItem {
  id: string;
  name: string;
  category: string;
  included: boolean;
  isCustom?: boolean;
}

export interface ProjectLocation {
  country: string;
  state: string;
  district: string;
  cityTown: string;
  projectSite: string;
  coordinates?: string;
}

export interface ProjectDetails {
  id: string;
  name: string;
  code: string;
  client: string;
  type: ProjectType;
  customType?: string;
  executionModel: ExecutionModel;
  
  // Capacities
  dcCapacityMWp: number;
  acCapacityMW: number;
  dcAcRatio: number;
  bessCapacityMWh?: number;
  bessPowerMW?: number;
  gridInterconnectionKV?: number;
  gridInterconnectionCapacityMW?: number;

  // Location
  location: ProjectLocation;

  // Scheduling Constraints & Calendar
  startDate: string; // YYYY-MM-DD
  targetFinishDate?: string; // YYYY-MM-DD
  plannedDurationDays?: number;
  calendarType: WorkingCalendarType;
  workingDaysPerWeek: number;
  dailyWorkingHours: number;
  parallelExecutionPreference: 'Standard' | 'Aggressive Fast-Track' | 'Sequential Risk-Averse';
  procurementStrategy: 'Early Long-Lead Orders' | 'Phased Just-In-Time' | 'Turnkey Package Supply';
  
  // Technical Options
  mountingSystem: ModuleMountingType;
  foundationType: FoundationType;
  inverterConfiguration: InverterConfig;
  substationScope: 'Full Pooling Substation' | 'Bay Extension at Existing Substation' | 'Compact Kiosk Substation' | 'Not Applicable';
  tLineLengthKm: number;
  includeBess: boolean;
  includeWaterSupply: boolean;
  includeInternalRoadsAndDrainage: boolean;

  // Scopes
  scopes: ProjectScopeItem[];
  
  // Meta
  createdAt: string;
  updatedAt: string;
  activeRevision: number;
}

export interface BaselineSnapshot {
  id: string;
  version: string; // e.g. "v1.0 Baseline Approved"
  createdAt: string;
  createdBy: string;
  notes?: string;
  projectSnapshot: ProjectDetails;
  wbsSnapshot: WbsItem[];
  activitiesSnapshot: ActivityItem[];
}

export interface UserSession {
  email: string;
  isLoggedIn: boolean;
  rememberMe: boolean;
  loginTime: string;
}
