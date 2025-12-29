
export enum Language {
  HE = 'he',
  EN = 'en'
}

export enum TabId {
  WASTE = 'waste',
  SECURITY = 'security',
  IRRIGATION = 'irrigation',
  TRANSPORT = 'transport',
  BUSINESS = 'business',
  ARNONA = 'arnona',
  WATER = 'water',
  MOKED = 'moked',
  MONDAY = 'monday',
  SALESFORCE = 'salesforce'
}

export type ChartStyle = 'default' | 'modern';

export interface KPIData {
  id: string;
  title: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
  status: 'good' | 'warning' | 'critical' | 'neutral';
}

export interface MapMarker {
  lat: number;
  lng: number;
  type: string;
  status: 'good' | 'warning' | 'critical';
  title: string;
}

export interface MapPolygon {
  positions: [number, number][];
  color: string;
  label?: string;
}

export interface MapPath {
  path: [number, number][];
  color: string;
  dashed?: boolean;
  label?: string;
}

export interface MapVehicle {
  id: string;
  startPos: [number, number];
  endPos: [number, number];
  type: string; // 'truck', 'car', 'patrol'
  color: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
  [key: string]: string | number | undefined;
}

export interface ChartConfig {
  title: string;
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut';
}

export interface MondayTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low' | 'completed';
  tags: string[];
  budget?: string;
  progress?: number;
}

export interface MondayBoard {
  id: string;
  title: string;
  emoji: string;
  color: string;
  stats: string;
  columns: {
    title: string;
    tasks: MondayTask[];
  }[];
}

export interface SalesforceCase {
  id: string;
  subject: string;
  status: 'New' | 'Working' | 'Escalated' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  origin: string;
  createdDate: string;
  account: string;
}

export interface DashboardSectionData {
  kpis: KPIData[];
  mainChart: ChartConfig;
  secondaryChart: ChartConfig;
  thirdChart: ChartConfig;
  fourthChart: ChartConfig;
  mapMarkers: MapMarker[];
  mapPolygons?: MapPolygon[];
  mapPaths?: MapPath[];
  mapVehicles?: MapVehicle[];
  mapTitle: string;
  mondayBoards?: MondayBoard[];
  salesforceCases?: SalesforceCase[];
}
