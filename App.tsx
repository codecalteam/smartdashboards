
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Menu, X, Send, Layers, Activity, Users, Clock, 
  ExternalLink, BarChart3, 
  ArrowUpRight, ArrowDownRight, PieChart as PieIcon,
  Loader2, LineChart as LineIcon,
  TrendingUp, Map as MapIcon,
  Circle, Play, Database, CheckCircle2, AlertCircle,
  Briefcase, Cloud, ShieldCheck,
  Crosshair, Lock, Unlock
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

import { TabId, Language, DashboardSectionData, ChartStyle, KPIData, MondayTask, ChartConfig, SalesforceCase } from './types';
import { getDashboardData, CITY_CENTER } from './constants';
import { fetchSheetData, GOOGLE_SHEET_URL } from './services/googleSheetsService';
import { chatWithGemini } from './services/geminiService';

// --- Sub-components ---

const MovingVehicle = ({ vehicle, key }: { vehicle: any; key?: React.Key }) => {
  const [pos, setPos] = useState(vehicle.startPos);
  
    useEffect(() => {
      let frame = 0;
      // 80% slower: increase duration by factor of 5 (original 200-500ms, now 1000-2500ms)
      const duration = (200 + Math.random() * 300) * 5; 
      const interval = setInterval(() => {
        frame++;
        const t = (frame % duration) / duration;
        const lat = vehicle.startPos[0] + (vehicle.endPos[0] - vehicle.startPos[0]) * t;
        const lng = vehicle.startPos[1] + (vehicle.endPos[1] - vehicle.startPos[1]) * t;
        setPos([lat, lng]);
      }, 50);
      return () => clearInterval(interval);
    }, [vehicle]);

  // Choose icon based on vehicle type
  const getIcon = () => {
    let emoji = '🚗';
    if (vehicle.type === 'garbage') emoji = '🚛';
    else if (vehicle.type === 'patrol') emoji = '🚔';
    else if (vehicle.type === 'bus') emoji = '🚌';
    else if (vehicle.type === 'truck') emoji = '🚚';
    else if (vehicle.type === 'ambulance') emoji = '🚑';
    else if (vehicle.type === 'fire') emoji = '🚒';
    
    return L.divIcon({
      html: `<div style="font-size: 24px; transform: translate(-50%, -50%);">${emoji}</div>`,
      className: 'custom-vehicle-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <Marker 
      key={key}
      position={pos}
      icon={getIcon()}
    >
      <Popup className="custom-popup">
        <div className="text-xs font-bold">{vehicle.id}</div>
        <div className="text-[10px] text-slate-500">Type: {vehicle.type || 'vehicle'}</div>
      </Popup>
    </Marker>
  );
};

const ChartRenderer = ({ config, mode, color }: { config: ChartConfig, mode: string, color: string }) => {
  if (!config || !config.data || config.data.length === 0) return null;

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
  const chartType = mode || config.type;

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <AreaChart data={config.data}>
            <defs>
              <linearGradient id={`color-${config.title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#color-${config.title})`} strokeWidth={3} />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'pie':
      case 'doughnut':
        return (
          <PieChart>
            <Pie
              data={config.data}
              innerRadius={chartType === 'doughnut' ? 60 : 0}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {config.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(0,0,0,0.2)" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        );
      case 'line':
      default:
        return (
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
          </LineChart>
        );
    }
  };

  return <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>;
};

const DashboardCard = ({ config, className = "", color = "#3b82f6" }: { config: ChartConfig, className?: string, color?: string }) => {
  const [mode, setMode] = useState<string>(config.type);

  return (
    <div className={`bg-[#0c1424] border border-white/10 rounded-2xl p-3 flex flex-col transition-all hover:border-white/20 animate-fade-up ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{config.title}</h4>
        <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
          {[
            { id: 'line', icon: <LineIcon size={10} /> },
            { id: 'bar', icon: <BarChart3 size={10} /> },
            { id: 'pie', icon: <PieIcon size={10} /> },
            { id: 'area', icon: <TrendingUp size={10} /> }
          ].map(opt => (
            <button 
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`p-1 rounded-md transition-all ${mode === opt.id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[180px] border border-white/5 rounded-lg overflow-hidden">
        <ChartRenderer config={config} mode={mode} color={color} />
      </div>
    </div>
  );
};

const MondayBoardView = ({ board, lang, key }: { board: any, lang: Language; key?: React.Key }) => {
  const isHe = lang === Language.HE;
  return (
    <div key={key} className="bg-[#0c1424] border border-white/10 rounded-2xl overflow-hidden mb-6">
      <div className="p-4 flex justify-between items-center text-white" style={{ background: `linear-gradient(90deg, ${board.color}, transparent)` }}>
        <div className="flex items-center gap-2 font-bold">
          <span>{board.emoji}</span>
          <span>{board.title}</span>
        </div>
        <div className="text-xs bg-white/10 px-2 py-1 rounded-full">{board.stats}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-black/20">
        {board.columns.map((col: any, idx: number) => (
          <div key={idx} className="bg-slate-900/40 rounded-xl p-3 min-h-[300px] border border-white/5 kanban-column overflow-y-auto">
            <div className="text-xs font-bold text-slate-500 mb-4 pb-2 border-b border-white/5 uppercase tracking-widest">{col.title}</div>
            {col.tasks.map((task: MondayTask) => (
              <div key={task.id} className="bg-[#1e293b] p-3 rounded-lg mb-3 border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                <div className="text-sm font-medium mb-3 group-hover:text-amber-400 transition-colors">{task.title}</div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-2">
                  <div className="flex items-center gap-1"><Users size={10} /> {task.assignee}</div>
                  <div className="flex items-center gap-1"><Clock size={10} /> {task.dueDate}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    task.priority === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {task.priority === 'completed' ? (isHe ? 'הושלם' : 'Done') : (isHe ? 'עדיפות' : 'Priority')}
                  </span>
                  {task.budget && <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">{task.budget}</span>}
                  {task.tags.map(t => <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const SalesforceView = ({ cases, lang }: { cases: SalesforceCase[], lang: Language }) => {
  const isHe = lang === Language.HE;
  return (
    <div className="col-span-12 bg-[#0c1424] border border-white/10 rounded-2xl overflow-hidden shadow-xl animate-fade-up flex flex-col">
      <div className="p-4 bg-gradient-to-r from-sky-600 to-sky-800 text-white flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold">
          <Cloud size={18} />
          <span>{isHe ? 'Salesforce Service Cloud • קריאות שירות' : 'Salesforce Service Cloud • Cases'}</span>
        </div>
        <div className="text-xs bg-white/10 px-2 py-1 rounded-full">
          {cases.length} {isHe ? 'קריאות פעילות' : 'Active Cases'}
        </div>
      </div>
      <div className="overflow-x-auto flex-1 max-h-[400px]">
        <table className="w-full text-sm text-left rtl:text-right text-slate-300">
          <thead className="text-[10px] uppercase tracking-widest text-slate-500 bg-black/30 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">{isHe ? 'מספר קריאה' : 'Case Number'}</th>
              <th className="px-6 py-4">{isHe ? 'נושא' : 'Subject'}</th>
              <th className="px-6 py-4">{isHe ? 'סטטוס' : 'Status'}</th>
              <th className="px-6 py-4">{isHe ? 'עדיפות' : 'Priority'}</th>
              <th className="px-6 py-4">{isHe ? 'שכונה / חשבון' : 'Account'}</th>
              <th className="px-6 py-4">{isHe ? 'תאריך' : 'Date'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-sky-400">{c.id}</td>
                <td className="px-6 py-4 font-medium">{c.subject}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    c.status === 'Closed' ? 'bg-emerald-500/20 text-emerald-400' :
                    c.status === 'Escalated' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1 text-[10px] ${
                    c.priority === 'High' ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    <ShieldCheck size={12} />
                    {c.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{c.account}</td>
                <td className="px-6 py-4 text-slate-500">{c.createdDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.WASTE);
  const [lang, setLang] = useState<Language>(Language.HE);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [layoutStyle, setLayoutStyle] = useState<ChartStyle>('default');
  const [isDataSourceLive, setIsDataSourceLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardSectionData>(getDashboardData(TabId.WASTE, Language.HE));
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    {role: 'ai', text: lang === Language.HE ? "שלום! אני איינשטיין הדיגיטלי שלך 🤓 מה תרצה לדעת על הנתונים?" : "Hello! I am your digital Einstein 🤓 What would you like to know?"}
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapStatic, setIsMapStatic] = useState(false);

  // Ensure map resizes after container is fully rendered
  useEffect(() => {
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
        mapInstance.setView(CITY_CENTER, 14);
      }, 100);
    }
  }, [mapInstance]);

  // Toggle map interactivity
  useEffect(() => {
    if (mapInstance) {
      if (isMapStatic) {
        mapInstance.dragging.disable();
        mapInstance.touchZoom.disable();
        mapInstance.doubleClickZoom.disable();
        mapInstance.scrollWheelZoom.disable();
        mapInstance.boxZoom.disable();
        mapInstance.keyboard.disable();
      } else {
        mapInstance.dragging.enable();
        mapInstance.touchZoom.enable();
        mapInstance.doubleClickZoom.enable();
        mapInstance.scrollWheelZoom.enable();
        mapInstance.boxZoom.enable();
        mapInstance.keyboard.enable();
      }
    }
  }, [mapInstance, isMapStatic]);

  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.setView(CITY_CENTER, 14);
    }
  };

  const toggleMapStatic = () => {
    setIsMapStatic(!isMapStatic);
  };

  const isHe = lang === Language.HE;

  // Connection states
  const [sfConnected, setSfConnected] = useState(true);
  const [mondayConnected, setMondayConnected] = useState(true);

  // Sync data from Google Sheets or fallback to mock
  const syncData = useCallback(async (tab: TabId, l: Language) => {
    setIsLoading(true);
    const liveData = await fetchSheetData(tab, l);
    if (liveData) {
      setDashboardData(liveData);
      setIsDataSourceLive(true);
    } else {
      setDashboardData(getDashboardData(tab, l));
      setIsDataSourceLive(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    syncData(activeTab, lang);
  }, [activeTab, lang, syncData]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setChatInput("");
    setIsTyping(true);

    const context = JSON.stringify({
      activeTab,
      kpis: dashboardData.kpis,
      mainChartTitle: dashboardData.mainChart?.title,
      salesforceData: dashboardData.salesforceCases?.length || 0,
      mondayData: dashboardData.mondayBoards?.length || 0
    });

    const aiResponse = await chatWithGemini(userMsg, context);
    setIsTyping(false);
    setChatMessages(prev => [...prev, {role: 'ai', text: aiResponse}]);
  };

  const toggleSfConnection = () => {
    setSfConnected(!sfConnected);
    if (!sfConnected) {
       // Mock auth trigger
       console.log("Initiating Salesforce OAuth...");
    }
  };

  const toggleMondayConnection = () => {
    setMondayConnected(!mondayConnected);
  };

  return (
    <div className={`flex h-screen w-full ${isHe ? 'rtl' : 'ltr'}`}>
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-50 w-72 bg-gradient-to-b from-[#0b1220] to-[#0e1524] border-l border-white/5 p-6 transition-transform duration-300 transform lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : (isHe ? 'translate-x-full' : '-translate-x-full')}`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-green-400 flex items-center justify-center font-black text-slate-900">
            {isHe ? 'ע' : 'C'}
          </div>
          <h1 className="text-xl font-bold">{isHe ? 'עיר חכמה' : 'Smart City'}</h1>
        </div>

        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 px-2">{isHe ? 'תפריט ראשי' : 'MAIN MENU'}</div>
          <nav className="flex flex-col gap-1">
            {[
              { id: TabId.WASTE, labelHe: 'פינוי אשפה ומיחזור', labelEn: 'Waste & Recycling', icon: <Layers size={18} /> },
              { id: TabId.SECURITY, labelHe: 'ביטחון וחירום עירוני', labelEn: 'Security & Emergency', icon: <Activity size={18} /> },
              { id: TabId.IRRIGATION, labelHe: 'השקייה עירונית', labelEn: 'Urban Irrigation', icon: <TrendingUp size={18} /> },
              { id: TabId.TRANSPORT, labelHe: 'תחבורה עירונית', labelEn: 'Urban Transport', icon: <MapIcon size={18} /> },
              { id: TabId.BUSINESS, labelHe: 'קידום עסקים', labelEn: 'Business Dev', icon: <Briefcase size={18} /> },
              { id: TabId.ARNONA, labelHe: 'משלמי ארנונה', labelEn: 'Property Tax', icon: <Users size={18} /> },
              { id: TabId.WATER, labelHe: 'צריכת מים', labelEn: 'Water Usage', icon: <Activity size={18} /> },
              { id: TabId.MOKED, labelHe: 'מוקד 106 / פניות', labelEn: '106 Call Center', icon: <Clock size={18} /> },
              { id: TabId.MONDAY, labelHe: 'Monday Boards', labelEn: 'Monday Boards', icon: <BarChart3 size={18} /> },
              { id: TabId.SALESFORCE, labelHe: 'Salesforce Service', labelEn: 'Salesforce Service', icon: <Cloud size={18} /> },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === item.id ? 'bg-gradient-to-r from-emerald-500/20 to-sky-500/10 shadow-[0_0_0_1px_rgba(45,212,191,0.45)] text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                {item.icon}
                {isHe ? item.labelHe : item.labelEn}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 px-2">{isHe ? 'חיבורי נתונים' : 'DATA CONNECTORS'}</div>
          <div className="flex flex-col gap-2">
            <button onClick={toggleSfConnection} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-white/5 rounded-xl hover:border-white/10 transition-all text-left group">
              <div className={`w-8 h-8 rounded-lg bg-sky-500/10 border flex items-center justify-center text-sky-500 font-bold transition-all ${sfConnected ? 'border-sky-500/30' : 'border-slate-700 opacity-40'}`}>SF</div>
              <div className="flex-1">
                <div className="text-[11px] font-bold">Salesforce</div>
                <div className={`text-[9px] flex items-center gap-1 ${sfConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                   <span className="status-dot" style={{backgroundColor: sfConnected ? '#10b981' : '#f43f5e'}}></span>
                   {sfConnected ? (isHe ? 'מחובר' : 'Connected') : (isHe ? 'מנותק' : 'Disconnected')}
                </div>
              </div>
            </button>
            <button onClick={toggleMondayConnection} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-white/5 rounded-xl hover:border-white/10 transition-all text-left group">
              <div className={`w-8 h-8 rounded-lg bg-rose-500/10 border flex items-center justify-center text-rose-500 font-bold transition-all ${mondayConnected ? 'border-rose-500/30' : 'border-slate-700 opacity-40'}`}>M</div>
              <div className="flex-1">
                <div className="text-[11px] font-bold">Monday.com</div>
                <div className={`text-[9px] flex items-center gap-1 ${mondayConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                   <span className="status-dot" style={{backgroundColor: mondayConnected ? '#10b981' : '#f43f5e'}}></span>
                   {mondayConnected ? (isHe ? 'מחובר' : 'Connected') : (isHe ? 'מנותק' : 'Disconnected')}
                </div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="flex justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 bg-slate-800 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="text-sm">
              <span className="text-slate-500">{isHe ? 'תפריט ראשי' : 'Main Menu'} / </span>
              <span className="font-bold text-white uppercase tracking-wider">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDataSourceLive && (
              <a href={GOOGLE_SHEET_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400">
                <Database size={12} />
                {isHe ? 'מחובר לדאטה לייב מודיעין' : 'Live Data Connected'}
              </a>
            )}
            
            <div className="flex gap-1 bg-slate-900/80 p-1 rounded-full border border-white/10">
              <button 
                onClick={() => setLayoutStyle('default')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${layoutStyle === 'default' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {isHe ? 'סגנון רגיל' : 'Standard'}
              </button>
              <button 
                onClick={() => setLayoutStyle('modern')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${layoutStyle === 'modern' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {isHe ? 'סגנון מודרני' : 'Modern'}
              </button>
            </div>

            <div className="flex gap-1 bg-slate-900/80 p-1 rounded-full border border-white/10">
              <button onClick={() => setLang(Language.HE)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${lang === Language.HE ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>HE</button>
              <button onClick={() => setLang(Language.EN)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${lang === Language.EN ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>EN</button>
            </div>
            
            {isLoading && <Loader2 className="animate-spin text-slate-400" size={20} />}
          </div>
        </header>

        {/* Data Ticker (Stock Exchange Style) */}
        <div className="mb-6 bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live Insights</span>
            </div>
            <div className="ml-4 text-[10px] text-slate-500">Real‑time data updates</div>
          </div>
          <div className="relative overflow-hidden h-10">
            <div className="absolute inset-0 flex items-center">
              <div className="ticker-container animate-marquee whitespace-nowrap flex items-center">
                {(() => {
                  // Generate ticker messages based on current data
                  const messages = [];
                  // Add KPI insights
                  dashboardData.kpis.forEach(kpi => {
                    const trend = kpi.trend === 'up' ? '📈' : kpi.trend === 'down' ? '📉' : '➡️';
                    messages.push(`${kpi.title}: ${kpi.value} ${trend} ${kpi.delta}`);
                  });
                  // Add chart insights if available
                  if (dashboardData.mainChart?.title) {
                    messages.push(`${dashboardData.mainChart.title}: ${dashboardData.mainChart.data.length} data points`);
                  }
                  if (dashboardData.mapMarkers?.length) {
                    messages.push(`Active map markers: ${dashboardData.mapMarkers.length}`);
                  }
                  // Add tab-specific insights
                  switch (activeTab) {
                    case TabId.WASTE:
                      messages.push('Waste collection efficiency improved by 2% this month');
                      break;
                    case TabId.SECURITY:
                      messages.push('Security incidents down 15% compared to last week');
                      break;
                    case TabId.IRRIGATION:
                      messages.push('Water usage optimized across 3 districts');
                      break;
                    case TabId.TRANSPORT:
                      messages.push('Fleet electric vehicles increased to 37');
                      break;
                  }
                  // Duplicate messages to ensure continuous scroll
                  const duplicated = [...messages, ...messages];
                  return duplicated.map((msg, idx) => (
                    <span key={idx} className="mx-6 text-sm text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {msg}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardData.kpis.map((kpi) => (
            <div key={kpi.id} className="bg-[#0c1424] border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all shadow-lg animate-fade-up">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                {kpi.trend === 'up' ? <ArrowUpRight size={40} /> : <ArrowDownRight size={40} />}
              </div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{kpi.title}</h3>
              <div className={`text-3xl font-black mb-2 ${
                kpi.status === 'good' ? 'text-emerald-400' : 
                kpi.status === 'warning' ? 'text-amber-400' : 
                kpi.status === 'critical' ? 'text-rose-400' : 'text-white'
              }`}>{kpi.value}</div>
              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                {kpi.trend === 'up' ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingUp size={12} className="text-rose-500 rotate-180" />}
                {kpi.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Content Grid */}
        <div className={`dashboard-grid gap-4 ${layoutStyle === 'modern' ? 'modern-layout' : ''}`}>
          
          {activeTab === TabId.MONDAY ? (
            <div className="col-span-12">
              {dashboardData.mondayBoards?.map((board, bIdx) => (
                <MondayBoardView key={board.id || bIdx} board={board} lang={lang} />
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard config={dashboardData.mainChart} color="#10b981" />
                <DashboardCard config={dashboardData.secondaryChart} color="#3b82f6" />
                <DashboardCard config={dashboardData.thirdChart} color="#8b5cf6" />
                <DashboardCard config={dashboardData.fourthChart} color="#f59e0b" />
              </div>
            </div>
          ) : activeTab === TabId.SALESFORCE ? (
            <div className="col-span-12 grid grid-cols-12 gap-6">
               {!sfConnected ? (
                 <div className="col-span-12 p-20 bg-[#0c1424] border border-white/5 rounded-3xl flex flex-col items-center justify-center text-center">
                    <Cloud size={60} className="text-slate-700 mb-6" />
                    <h2 className="text-2xl font-bold mb-4">{isHe ? 'נדרש חיבור ל-Salesforce' : 'Salesforce Connection Required'}</h2>
                    <p className="text-slate-400 max-w-md mb-8">{isHe ? 'כדי לצפות בנתוני שירות, פרויקטים וקריאות CRM, יש להתחבר למערכת Salesforce של העירייה.' : 'To view service data, projects and CRM cases, please connect to the Municipal Salesforce instance.'}</p>
                    <button 
                      onClick={toggleSfConnection}
                      className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-xl transition-all flex items-center gap-2"
                    >
                      <Cloud size={18} />
                      {isHe ? 'התחבר עכשיו' : 'Connect Now'}
                    </button>
                 </div>
               ) : (
                 <>
                   <div className="col-span-12 lg:col-span-8">
                     <SalesforceView cases={dashboardData.salesforceCases || []} lang={lang} />
                   </div>
                   <div className="col-span-12 lg:col-span-4">
                     <DashboardCard config={dashboardData.secondaryChart} color="#3b82f6" className="h-full" />
                   </div>
                   <div className="col-span-12 lg:col-span-12">
                      <DashboardCard config={dashboardData.mainChart} color="#10b981" className="min-h-[350px]" />
                   </div>
                   <div className="col-span-12 lg:col-span-6">
                      <DashboardCard config={dashboardData.thirdChart} color="#8b5cf6" />
                   </div>
                   <div className="col-span-12 lg:col-span-6">
                      <DashboardCard config={dashboardData.fourthChart} color="#f59e0b" />
                   </div>
                 </>
               )}
            </div>
          ) : (
            <>
              <div className="card-map col-span-12 lg:col-span-6 bg-[#0c1424] border border-white/10 rounded-2xl overflow-hidden min-h-[300px] shadow-2xl">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapIcon size={14} /> {dashboardData.mapTitle}
                  </h4>
                </div>
                <div className="h-full w-full relative" style={{ minHeight: '300px' }}>
                  {!isMapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0c1424] z-10 rounded-b-2xl">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <span className="text-sm text-slate-400">Loading map...</span>
                      </div>
                    </div>
                  )}
                  {/* Map control buttons */}
                  <div className="absolute top-2 right-2 z-20 flex gap-2">
                    <button
                      onClick={handleRecenter}
                      className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-lg shadow-lg transition-all flex items-center justify-center text-white"
                      title="Center map"
                    >
                      <Crosshair size={16} />
                    </button>
                    <button
                      onClick={toggleMapStatic}
                      className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-lg shadow-lg transition-all flex items-center justify-center text-white"
                      title={isMapStatic ? "Unlock map (enable interaction)" : "Lock map (disable interaction)"}
                    >
                      {isMapStatic ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                  </div>
                  <MapContainer 
                    center={CITY_CENTER} 
                    zoom={14} 
                    style={{ height: '100%', width: '100%', borderRadius: '0 0 1rem 1rem' }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                    dragging={true}
                    doubleClickZoom={true}
                    touchZoom={true}
                    boxZoom={true}
                    keyboard={true}
                    inertia={true}
                    inertiaDeceleration={300}
                    inertiaMaxSpeed={1500}
                    easeLinearity={0.2}
                    preferCanvas={true}
                    whenCreated={setMapInstance}
                    whenReady={() => setIsMapLoaded(true)}
                  >
                    <TileLayer 
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      maxZoom={19}
                      minZoom={10}
                    />
                    
                    {dashboardData.mapMarkers.map((m, i) => (
                      <CircleMarker 
                        key={i} 
                        center={[m.lat, m.lng]} 
                        pathOptions={{ 
                          color: m.status === 'critical' ? '#f43f5e' : m.status === 'warning' ? '#f59e0b' : '#10b981', 
                          fillColor: m.status === 'critical' ? '#f43f5e' : m.status === 'warning' ? '#f59e0b' : '#10b981', 
                          fillOpacity: 0.3 
                        }}
                        radius={10}
                      >
                        <Popup className="custom-popup">
                          <div className="font-bold mb-1">{m.title}</div>
                          <div className="text-[10px] opacity-70">Status: {m.status}</div>
                        </Popup>
                      </CircleMarker>
                    ))}

                    {dashboardData.mapPolygons?.map((p, i) => (
                      <Polygon key={i} positions={p.positions} pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: 0.1 }} />
                    ))}

                    {dashboardData.mapPaths?.map((p, i) => (
                      <Polyline key={i} positions={p.path} pathOptions={{ color: p.color, dashArray: p.dashed ? '5, 10' : '' }} />
                    ))}

                    {dashboardData.mapVehicles?.map((v, vIdx) => <MovingVehicle key={v.id || vIdx} vehicle={v} />)}
                  </MapContainer>
                </div>
              </div>

              <DashboardCard config={dashboardData.mainChart} className="card-main col-span-12 lg:col-span-6" color="#10b981" />
              <DashboardCard config={dashboardData.secondaryChart} className="card-sub col-span-12 lg:col-span-4" color="#3b82f6" />
              <DashboardCard config={dashboardData.thirdChart} className="card-sub col-span-12 lg:col-span-4" color="#8b5cf6" />
              <DashboardCard config={dashboardData.fourthChart} className="card-sub col-span-12 lg:col-span-4" color="#f59e0b" />
            </>
          )}
        </div>
      </main>

      {/* Einstein Chat Bot */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
        {isChatOpen && (
          <div className="w-[350px] h-[500px] bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-up">
            <header className="p-4 bg-gradient-to-r from-emerald-600 to-sky-600 flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-2xl">🧠</div>
                <div>
                  <div className="text-sm font-bold text-white leading-none">Einstein AI</div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mt-1">Smart City Analytics</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-black/20 p-1.5 rounded-full transition-colors">
                <X size={18} className="text-white" />
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#0f172a] custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-white/5 flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-[#0c1424]">
              <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-all">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isHe ? "שאל את איינשטיין..." : "Ask Einstein..."}
                  className="flex-1 bg-transparent border-none rounded-xl px-4 py-2 text-xs text-white focus:outline-none placeholder:text-slate-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white hover:bg-emerald-500 transition-all shadow-lg disabled:opacity-30 disabled:grayscale"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-3xl shadow-2xl hover:scale-110 active:scale-95 transition-all einstein-bubble border-4 border-white/30"
        >
          🧠
        </button>
      </div>

    </div>
  );
}
