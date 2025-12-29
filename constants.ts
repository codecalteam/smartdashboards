
import { TabId, DashboardSectionData, KPIData, Language, MondayBoard, SalesforceCase } from './types';

export const CITY_CENTER: [number, number] = [31.899, 35.011];

const createPolygon = (center: [number, number], offset: number): [number, number][] => {
  return [
    [center[0] + offset, center[1] + offset],
    [center[0] - offset, center[1] + offset],
    [center[0] - offset, center[1] - offset],
    [center[0] + offset, center[1] - offset]
  ];
};

export const getDashboardData = (tab: TabId, lang: Language = Language.HE): DashboardSectionData => {
  const isHebrew = lang === Language.HE;

  const months = isHebrew 
    ? ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצ']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const getMonthData = (base: number) => 
    months.map(m => ({ name: m, value: Math.floor(base + Math.random() * (base * 0.3)) }));

  switch (tab) {
    case TabId.SALESFORCE:
      return {
        kpis: [
          { id: 'sf1', title: isHebrew ? 'סה"כ קריאות שירות' : 'Total Service Cases', value: '1,248', delta: isHebrew ? '+12% החודש' : '+12% this month', trend: 'up', status: 'neutral' },
          { id: 'sf2', title: isHebrew ? 'זמן סגירה ממוצע' : 'Avg Closing Time', value: '4.2h', delta: isHebrew ? '-0.5h שיפור' : '-0.5h improvement', trend: 'up', status: 'good' },
          { id: 'sf3', title: isHebrew ? 'קריאות בטיפול' : 'Active Cases', value: '156', delta: isHebrew ? '12 בהסלמה' : '12 escalated', trend: 'down', status: 'warning' },
          { id: 'sf4', title: isHebrew ? 'שביעות רצון (CSAT)' : 'CSAT Score', value: '4.8/5', delta: isHebrew ? 'יעד: 4.5' : 'Target: 4.5', trend: 'up', status: 'good' },
        ],
        mainChart: {
          title: isHebrew ? 'קריאות שירות לאורך זמן' : 'Service Cases Over Time',
          type: 'area',
          data: getMonthData(100)
        },
        secondaryChart: {
          title: isHebrew ? 'מקורות פנייה' : 'Case Origin',
          type: 'pie',
          data: [
            { name: isHebrew ? 'טלפון' : 'Phone', value: 45 },
            { name: isHebrew ? 'אימייל' : 'Email', value: 25 },
            { name: isHebrew ? 'ווב' : 'Web', value: 20 },
            { name: isHebrew ? 'אפליקציה' : 'App', value: 10 }
          ]
        },
        thirdChart: {
          title: isHebrew ? 'סטטוס קריאות' : 'Case Status',
          type: 'bar',
          data: [
            { name: isHebrew ? 'חדש' : 'New', value: 30 },
            { name: isHebrew ? 'בטיפול' : 'Working', value: 85 },
            { name: isHebrew ? 'מוסלם' : 'Escalated', value: 12 },
            { name: isHebrew ? 'סגור' : 'Closed', value: 120 }
          ]
        },
        fourthChart: {
          title: isHebrew ? 'עדיפות' : 'Priority Distribution',
          type: 'doughnut',
          data: [
            { name: isHebrew ? 'גבוהה' : 'High', value: 15 },
            { name: isHebrew ? 'בינונית' : 'Medium', value: 45 },
            { name: isHebrew ? 'נמוכה' : 'Low', value: 40 }
          ]
        },
        // Fix: Changed 'isHe' to 'isHebrew' to match the variable defined at the start of the function
        mapTitle: isHebrew ? 'מפת קריאות שירות (Salesforce)' : 'Service Cases Map (Salesforce)',
        mapMarkers: [
          { lat: 31.901, lng: 35.013, type: 'case', status: 'critical', title: 'פנסי רחוב מקולקלים' },
          { lat: 31.895, lng: 35.008, type: 'case', status: 'warning', title: 'פינוי גזם לא בוצע' },
          { lat: 31.905, lng: 35.020, type: 'case', status: 'good', title: 'ניקוי פארק' }
        ],
        salesforceCases: [
          { id: 'SF-001', subject: isHebrew ? 'תקלה בתשתית ביוב' : 'Sewage Infrastructure Failure', status: 'Working', priority: 'High', origin: 'Phone', createdDate: '2023-11-20', account: 'Neighborhood A' },
          { id: 'SF-002', subject: isHebrew ? 'בקשה לגיזום עצים' : 'Tree Trimming Request', status: 'New', priority: 'Medium', origin: 'Web', createdDate: '2023-11-21', account: 'City Center' },
          { id: 'SF-003', subject: isHebrew ? 'פנס רחוב מהבהב' : 'Flickering Street Light', status: 'Closed', priority: 'Low', origin: 'App', createdDate: '2023-11-19', account: 'South Gate' }
        ]
      };

    case TabId.MONDAY:
      return {
        kpis: [
          { id: 'mon1', title: isHebrew ? 'פרויקטים פעילים' : 'Active Projects', value: '24', delta: isHebrew ? '+3 החודש' : '+3 this month', trend: 'up', status: 'neutral' },
          { id: 'mon2', title: isHebrew ? 'משימות שהושלמו' : 'Completed Tasks', value: '89%', delta: isHebrew ? 'בזמן' : 'On time', trend: 'up', status: 'good' },
          { id: 'mon3', title: isHebrew ? 'משימות בפיגור' : 'Delayed Tasks', value: '7', delta: isHebrew ? 'דורשות מעקב' : 'Requires follow-up', trend: 'down', status: 'warning' },
          { id: 'mon4', title: isHebrew ? 'צוותים פעילים' : 'Active Teams', value: '8', delta: isHebrew ? 'תכנון עירוני' : 'Urban Planning', trend: 'neutral', status: 'neutral' },
        ],
        mainChart: {
          title: isHebrew ? 'התקדמות חודשית' : 'Monthly Progress',
          type: 'line',
          data: getMonthData(50)
        },
        secondaryChart: {
          title: isHebrew ? 'חלוקת משימות לפי סטטוס' : 'Task Status',
          type: 'doughnut',
          data: [
            { name: isHebrew ? 'הושלם' : 'Done', value: 42 },
            { name: isHebrew ? 'בתהליך' : 'In Progress', value: 28 },
            { name: isHebrew ? 'באישור' : 'Approval', value: 15 },
            { name: isHebrew ? 'בפיגור' : 'Delayed', value: 15 }
          ]
        },
        thirdChart: {
          title: isHebrew ? 'משימות לפי צוות' : 'Tasks by Team',
          type: 'bar',
          data: [
            { name: isHebrew ? 'תשתיות' : 'Infra', value: 12 },
            { name: isHebrew ? 'תכנון' : 'Planning', value: 18 },
            { name: isHebrew ? 'סביבה' : 'Env', value: 9 }
          ]
        },
        fourthChart: {
          title: isHebrew ? 'חלוקת תקציבים' : 'Budget Share',
          type: 'pie',
          data: [
            { name: isHebrew ? 'תשתיות' : 'Infra', value: 35 },
            { name: isHebrew ? 'סביבה' : 'Env', value: 22 },
            { name: isHebrew ? 'חינוך' : 'Edu', value: 43 }
          ]
        },
        mapTitle: isHebrew ? 'מפת פרויקטים' : 'Project Map',
        mapMarkers: [],
        mondayBoards: [
          {
            id: 'infra',
            title: isHebrew ? 'פרויקטי תשתיות' : 'Infrastructure Projects',
            emoji: '🛣️',
            color: '#3b82f6',
            stats: isHebrew ? '12 משימות • 3 צוותים' : '12 Tasks • 3 Teams',
            columns: [
              {
                title: isHebrew ? 'לעשות' : 'To Do',
                tasks: [
                  { id: 't1', title: isHebrew ? 'שיפוץ כביש מרכזי' : 'Road Renovation', assignee: 'Dana Levi', dueDate: '20/12', priority: 'high', tags: [isHebrew ? 'דחוף' : 'Urgent'], budget: '₪ 2.5M' },
                  { id: 't2', title: isHebrew ? 'התקנת תאורה' : 'Smart Lighting', assignee: 'Moshe Cohen', dueDate: '15/01', priority: 'medium', tags: [isHebrew ? 'טכנולוגיה' : 'Tech'] }
                ]
              },
              {
                title: isHebrew ? 'בתהליך' : 'In Progress',
                tasks: [
                  { id: 't3', title: isHebrew ? 'שדרוג צמתים' : 'Junction Upgrade', assignee: 'Sarah A', dueDate: '10/12', priority: 'medium', tags: ['75%'], progress: 75 }
                ]
              }
            ]
          }
        ]
      };
    
    case TabId.WASTE:
    default:
      return {
        kpis: [
          { id: 'w1', title: isHebrew ? 'תקן טיפול פניות' : 'SLA Compliance', value: '98.8%', delta: isHebrew ? '+0.6% החודש' : '+0.6% This Month', trend: 'up', status: 'good' },
          { id: 'w2', title: isHebrew ? 'שביעות רצון' : 'Satisfaction', value: '72%', delta: isHebrew ? 'לפי סקרים' : 'Surveys', trend: 'neutral', status: 'neutral' },
          { id: 'w3', title: isHebrew ? 'חיסכון משקל אשפה' : 'Waste Weight Savings', value: isHebrew ? '₪ 166k' : '₪ 166k', delta: isHebrew ? '+2,075 דקות' : '+2,075 mins', trend: 'up', status: 'good' },
          { id: 'w4', title: isHebrew ? 'חיסכון טיאוט' : 'Sweeping Savings', value: isHebrew ? '₪ 48k' : '₪ 48k', delta: isHebrew ? '1,044 טון' : '1,044 tons', trend: 'up', status: 'good' },
        ],
        mainChart: {
          title: isHebrew ? 'תחזית נפח פחי מיחזור' : 'Recycling Bin Volume Forecast',
          type: 'area',
          data: getMonthData(65)
        },
        secondaryChart: {
          title: isHebrew ? 'חריגות עצירה' : 'Stop Anomalies',
          type: 'bar',
          data: isHebrew 
            ? [{ name: 'א', value: 14 }, { name: 'ב', value: 18 }, { name: 'ג', value: 22 }, { name: 'ד', value: 17 }, { name: 'ה', value: 19 }, { name: 'ו', value: 11 }]
            : [{ name: 'Sun', value: 14 }, { name: 'Mon', value: 18 }, { name: 'Tue', value: 22 }, { name: 'Wed', value: 17 }, { name: 'Thu', value: 19 }, { name: 'Fri', value: 11 }]
        },
        thirdChart: {
           title: isHebrew ? 'תלונות לפי שכונה' : 'Complaints by Neighborhood',
           type: 'bar',
           data: isHebrew 
             ? [{name: 'מרכז', value: 45}, {name: 'צפון', value: 30}, {name: 'דרום', value: 55}, {name: 'מזרח', value: 20}]
             : [{name: 'Center', value: 45}, {name: 'North', value: 30}, {name: 'South', value: 55}, {name: 'East', value: 20}]
        },
        fourthChart: {
           title: isHebrew ? 'סוגי אשפה (טון)' : 'Waste Types (Tons)',
           type: 'pie',
           data: isHebrew 
             ? [{name: 'ביתי', value: 600}, {name: 'גזם', value: 300}, {name: 'מיחזור', value: 150}, {name: 'זכוכית', value: 50}]
             : [{name: 'Household', value: 600}, {name: 'Green', value: 300}, {name: 'Recycle', value: 150}, {name: 'Glass', value: 50}]
        },
        mapTitle: isHebrew ? 'מיקומי פחים ונקודות איסוף' : 'Bin Locations & Pickup Points',
        mapMarkers: [
          { lat: 31.900, lng: 35.012, type: 'bin', status: 'good', title: isHebrew ? 'פח מיחזור' : 'Recycling Bin' },
          { lat: 31.893, lng: 35.007, type: 'bin', status: 'warning', title: isHebrew ? 'איסוף נייר' : 'Paper Pickup' },
          { lat: 31.905, lng: 35.018, type: 'bin', status: 'critical', title: isHebrew ? 'איסוף פלסטיק' : 'Plastic Pickup' },
        ],
        mapPolygons: [
          { positions: createPolygon([31.895, 35.010], 0.005), color: '#22c55e', label: 'Zone A' },
          { positions: [
            [31.902, 35.014], // near truck2 start
            [31.900, 35.012], // truck1 start
            [31.898, 35.010], // truck3 start
            [31.891, 35.005], // truck3 end
            [31.893, 35.007], // truck1 end
            [31.895, 35.009], // truck2 end
            [31.902, 35.014]  // close polygon
          ], color: '#8b5cf6', label: 'Truck Routes' }
        ],
        mapPaths: [
          { path: [[31.900, 35.012], [31.898, 35.011], [31.895, 35.010], [31.893, 35.007]], color: '#f59e0b', dashed: false, label: 'Truck 1 Route' },
          { path: [[31.902, 35.014], [31.900, 35.013], [31.897, 35.011], [31.895, 35.009]], color: '#3b82f6', dashed: false, label: 'Truck 2 Route' },
          { path: [[31.898, 35.010], [31.896, 35.008], [31.893, 35.006], [31.891, 35.005]], color: '#10b981', dashed: false, label: 'Truck 3 Route' }
        ],
        mapVehicles: [
          { id: 'truck1', startPos: [31.900, 35.012], endPos: [31.893, 35.007], type: 'garbage', color: '#f59e0b' },
          { id: 'truck2', startPos: [31.902, 35.014], endPos: [31.895, 35.009], type: 'garbage', color: '#3b82f6' },
          { id: 'truck3', startPos: [31.898, 35.010], endPos: [31.891, 35.005], type: 'garbage', color: '#10b981' }
        ]
      };
  }
};
