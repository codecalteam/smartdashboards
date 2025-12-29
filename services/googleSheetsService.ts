
import { DashboardSectionData, TabId, Language, KPIData, ChartConfig, MapMarker, MapPolygon, MapPath, MapVehicle } from '../types';
import { getDashboardData } from '../constants';

// The verified Google Sheet ID provided by the user
const SHEET_ID = '1CH2wgmdSSnuWw4bsDwyz8JHCHYmv4IGCGxONMGqpfpw'; 
export const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

// Published CSV URLs for each sheet (provided by user)
const PUBLISHED_SHEETS = {
  KPIs: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZBwjB5eAIaQhOl3kcGfwzTagBYrKHQiFL7PafOyELwTmVF0JurUF68HfL17ahFnF1rkhgMu9h7oU/pub?gid=0&single=true&output=csv',
  Charts: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZBwjB5eAIaQhOl3kcGfwzTagBYrKHQiFL7PafOyELwTmVF0JurUF68HfL17ahFnF1rkhgMu9h7oU/pub?gid=1665417322&single=true&output=csv',
  MapMarkers: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZBwjB5eAIaQhOl3kcGfwzTagBYrKHQiFL7PafOyELwTmVF0JurUF68HfL17ahFnF1rkhgMu9h7oU/pub?gid=1518465214&single=true&output=csv',
  MapPolygons: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZBwjB5eAIaQhOl3kcGfwzTagBYrKHQiFL7PafOyELwTmVF0JurUF68HfL17ahFnF1rkhgMu9h7oU/pub?gid=53034239&single=true&output=csv',
  MapPaths: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZBwjB5eAIaQhOl3kcGfwzTagBYrKHQiFL7PafOyELwTmVF0JurUF68HfL17ahFnF1rkhgMu9h7oU/pub?gid=1385560923&single=true&output=csv',
  MapVehicles: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZBwjB5eAIaQhOl3kcGfwzTagBYrKHQiFL7PafOyELwTmVF0JurUF68HfL17ahFnF1rkhgMu9h7oU/pub?gid=888862943&single=true&output=csv',
  MondayBoards: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZBwjB5eAIaQhOl3kcGfwzTagBYrKHQiFL7PafOyELwTmVF0JurUF68HfL17ahFnF1rkhgMu9h7oU/pub?gid=1465579381&single=true&output=csv',
  Salesforce: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZBwjB5eAIaQhOl3kcGfwzTagBYrKHQiFL7PafOyELwTmVF0JurUF68HfL17ahFnF1rkhgMu9h7oU/pub?gid=711441212&single=true&output=csv',
};

/**
 * Robust CSV parser that handles quotes and comma normalization.
 */
const parseCSV = (text: string): Record<string, string>[] => {
  if (!text || text.includes('<!DOCTYPE') || text.includes('<html')) return [];
  
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  
  // Normalize headers to UPPERCASE to handle case-insensitivity in the sheet
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toUpperCase());
  
  return lines.slice(1).map(line => {
    // Advanced split to handle commas inside quotes
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      let val = values[i] || '';
      row[h] = val.replace(/^"|"$/g, '').trim();
    });
    return row;
  });
};

/**
 * Parses coordinate strings from "lat,lng;lat,lng" or individual lat/lng columns.
 */
const parseCoords = (str: string): [number, number][] => {
  if (!str) return [];
  return str.split(';')
    .map(pair => {
      const parts = pair.split(',');
      if (parts.length !== 2) return null;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      return isNaN(lat) || isNaN(lng) ? null : [lat, lng] as [number, number];
    })
    .filter((p): p is [number, number] => p !== null);
};

/**
 * Fetch a published sheet by its name (KPIs, Charts, MapMarkers, etc.)
 */
const fetchPublishedSheet = async (sheetName: keyof typeof PUBLISHED_SHEETS): Promise<string> => {
  const url = PUBLISHED_SHEETS[sheetName];
  if (!url) {
    console.warn(`No published URL for sheet "${sheetName}"`);
    return '';
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
        return text;
      } else {
        console.warn(`Published sheet "${sheetName}" returned HTML (may be invalid)`);
      }
    } else {
      console.warn(`Published sheet "${sheetName}" returned status ${res.status}`);
    }
  } catch (e) {
    console.warn(`Failed to fetch published sheet "${sheetName}":`, e);
  }
  return '';
};

/**
 * Fallback fetch using gviz endpoint and proxies (for any sheets not in PUBLISHED_SHEETS)
 */
const fetchWithFallback = async (sheetName: string): Promise<string> => {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(gvizUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(gvizUrl)}`,
    `https://cors-anywhere.herokuapp.com/${gvizUrl}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { 
        method: 'GET', 
        credentials: 'omit',
        signal: AbortSignal.timeout(8000) 
      });

      if (!res.ok) {
        console.warn(`Proxy ${proxyUrl} returned status ${res.status}`);
        continue;
      }

      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE') && !text.includes('<html') && !text.includes('error')) {
        return text;
      } else {
        console.warn(`Proxy ${proxyUrl} returned HTML (likely auth required)`);
      }
    } catch (e) {
      console.warn(`Proxy ${proxyUrl} failed:`, e);
    }
  }

  // If all proxies fail, try direct export (requires sheet published to web)
  const exportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
  try {
    const res = await fetch(exportUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE')) {
        return text;
      }
    }
  } catch (e) {
    console.warn(`Direct export also failed:`, e);
  }

  console.error(`All attempts to fetch sheet "${sheetName}" failed.`);
  return "";
};

export const fetchSheetData = async (activeTab: TabId, lang: Language): Promise<DashboardSectionData | null> => {
  if (!SHEET_ID) return null;

  try {
    const isRTL = lang === Language.HE;

    // Fetch all published sheets in parallel
    const [kpiText, chartText, markerText, polyText, pathText, vehicleText, mondayText, salesforceText] = await Promise.all([
      fetchPublishedSheet('KPIs'),
      fetchPublishedSheet('Charts'),
      fetchPublishedSheet('MapMarkers'),
      fetchPublishedSheet('MapPolygons'),
      fetchPublishedSheet('MapPaths'),
      fetchPublishedSheet('MapVehicles'),
      fetchPublishedSheet('MondayBoards'),
      fetchPublishedSheet('Salesforce')
    ]);

    const filterRows = (rows: any[]) => rows.filter(r => r.TAB_ID?.toLowerCase() === activeTab.toLowerCase());

    const kpisRaw = filterRows(parseCSV(kpiText));
    const chartsRaw = filterRows(parseCSV(chartText));
    const markersRaw = filterRows(parseCSV(markerText));
    const polysRaw = filterRows(parseCSV(polyText));
    const pathsRaw = filterRows(parseCSV(pathText));
    const vehiclesRaw = filterRows(parseCSV(vehicleText));
    // For Monday and Salesforce sheets, use all rows (they are dedicated to those tabs)
    const mondayRaw = parseCSV(mondayText);
    const salesforceRaw = parseCSV(salesforceText);

    // If we have no data at all, return null to fallback to mock data
    // For Salesforce and Monday tabs, we may have data only in their dedicated sheets
    if (activeTab !== TabId.SALESFORCE && activeTab !== TabId.MONDAY) {
      if (!kpisRaw.length && !chartsRaw.length) {
        return null;
      }
    }

    // Get mock data as a base (for any missing charts/maps)
    const mockData = getDashboardData(activeTab, lang);

    const processChart = (idx: string): ChartConfig => {
      const rows = chartsRaw.filter(r => r.CHART_INDEX === idx);
      if (!rows.length) {
        // Fallback to mock chart if available
        if (idx === '1' && mockData.mainChart) return mockData.mainChart;
        if (idx === '2' && mockData.secondaryChart) return mockData.secondaryChart;
        if (idx === '3' && mockData.thirdChart) return mockData.thirdChart;
        if (idx === '4' && mockData.fourthChart) return mockData.fourthChart;
        return { title: '', type: 'bar', data: [] };
      }
      return {
        title: isRTL ? rows[0].TITLE_HE : rows[0].TITLE_EN,
        type: (rows[0].TYPE?.toLowerCase() as any) || 'bar',
        data: rows.map(r => ({ 
          name: isRTL ? r.LABEL_HE : r.LABEL_EN, 
          value: parseFloat(r.VALUE) || 0 
        }))
      };
    };

    // Use live KPIs if available, otherwise mock
    const mergedKpis = kpisRaw.length > 0 ? kpisRaw.map(r => ({
        id: r.KPI_ID || Math.random().toString(),
        title: isRTL ? r.TITLE_HE : r.TITLE_EN,
        value: r.VALUE,
        delta: isRTL ? r.DELTA_HE : r.DELTA_EN,
        trend: (r.TREND?.toLowerCase() as any) || 'neutral',
        status: (r.STATUS?.toLowerCase() as any) || 'neutral'
      })) : mockData.kpis;

    // Process Salesforce cases
    const salesforceCases = salesforceRaw.length > 0 ? salesforceRaw.map(r => ({
      id: r.ID,
      subject: isRTL ? r.SUBJECT_HE || r.SUBJECT : r.SUBJECT_EN || r.SUBJECT,
      status: (r.STATUS as any) || 'New',
      priority: (r.PRIORITY as any) || 'Medium',
      origin: r.ORIGIN || 'Web',
      createdDate: r.CREATED_DATE || '2023-01-01',
      account: r.ACCOUNT || ''
    })) : mockData.salesforceCases;

    // Process Monday boards (group by BOARD_ID, then by COLUMN_TITLE)
    const mondayBoards: any[] = [];
    if (mondayRaw.length > 0) {
      const boardsMap = new Map<string, any>();
      for (const row of mondayRaw) {
        const boardId = row.BOARD_ID;
        if (!boardId) continue;
        if (!boardsMap.has(boardId)) {
          boardsMap.set(boardId, {
            id: boardId,
            title: isRTL ? row.BOARD_TITLE_HE || row.BOARD_TITLE : row.BOARD_TITLE_EN || row.BOARD_TITLE,
            emoji: row.BOARD_EMOJI || '📋',
            color: row.BOARD_COLOR || '#3b82f6',
            stats: row.BOARD_STATS || '',
            columns: []
          });
        }
        const board = boardsMap.get(boardId);
        const columnTitle = row.COLUMN_TITLE;
        let column = board.columns.find((c: any) => c.title === columnTitle);
        if (!column) {
          column = { title: columnTitle, tasks: [] };
          board.columns.push(column);
        }
        column.tasks.push({
          id: row.TASK_ID,
          title: isRTL ? row.TASK_TITLE_HE || row.TASK_TITLE : row.TASK_TITLE_EN || row.TASK_TITLE,
          assignee: row.TASK_ASSIGNEE,
          dueDate: row.TASK_DUE_DATE,
          priority: (row.TASK_PRIORITY?.toLowerCase() as any) || 'medium',
          tags: row.TASK_TAGS ? row.TASK_TAGS.split(',').map((t: string) => t.trim()) : [],
          budget: row.TASK_BUDGET,
          progress: row.TASK_PROGRESS ? parseInt(row.TASK_PROGRESS) : undefined
        });
      }
      mondayBoards.push(...boardsMap.values());
    } else {
      mondayBoards.push(...(mockData.mondayBoards || []));
    }

    return {
      kpis: mergedKpis,
      mainChart: processChart('1'),
      secondaryChart: processChart('2'),
      thirdChart: processChart('3'),
      fourthChart: processChart('4'),
      mapMarkers: markersRaw.length > 0 ? markersRaw.map(r => {
        const lat = parseFloat(r.LAT || (r.COORDS && r.COORDS.split(',')[0]));
        const lng = parseFloat(r.LNG || (r.COORDS && r.COORDS.split(',')[1]));
        return {
          lat,
          lng,
          type: r.TYPE,
          status: (r.STATUS?.toLowerCase() as any) || 'neutral',
          title: isRTL ? r.TITLE_HE : r.TITLE_EN
        };
      }).filter(m => !isNaN(m.lat)) : mockData.mapMarkers || [],
      mapPolygons: polysRaw.length > 0 ? polysRaw.map(r => ({ 
        positions: parseCoords(r.COORDS), 
        color: r.COLOR || '#3b82f6', 
        label: r.LABEL 
      })).filter(p => p.positions.length > 0) : mockData.mapPolygons || [],
      mapPaths: pathsRaw.length > 0 ? pathsRaw.map(r => ({ 
        path: parseCoords(r.COORDS), 
        color: r.COLOR || '#eab308', 
        dashed: r.DASHED === 'TRUE' 
      })).filter(p => p.path.length > 0) : mockData.mapPaths || [],
      mapVehicles: vehiclesRaw.length > 0 ? vehiclesRaw.map(r => {
        const sLat = parseFloat(r.START_LAT || (r.START && r.START.split(',')[0]));
        const sLng = parseFloat(r.START_LNG || (r.START && r.START.split(',')[1]));
        const eLat = parseFloat(r.END_LAT || (r.END && r.END.split(',')[0]));
        const eLng = parseFloat(r.END_LNG || (r.END && r.END.split(',')[1]));
        return {
          id: r.ID, 
          type: r.TYPE?.toLowerCase() || 'car', 
          color: r.COLOR || '#f59e0b',
          startPos: [sLat, sLng] as [number, number],
          endPos: [eLat, eLng] as [number, number]
        };
      }).filter(v => !isNaN(v.startPos[0])) : mockData.mapVehicles || [],
      mapTitle: mockData.mapTitle || (isRTL ? 'מפה חיה מסונכרנת' : 'Live Synced Map'),
      salesforceCases,
      mondayBoards
    };
  } catch (error) {
    console.error("Error syncing with Google Sheets API:", error);
    return null;
  }
};
