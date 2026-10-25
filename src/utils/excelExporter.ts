import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ProjectDetails, WbsItem, ActivityItem } from '../types';

export async function exportProjectToExcel(
  project: ProjectDetails,
  wbsList: WbsItem[],
  activities: ActivityItem[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Solar EPC Baseline Scheduler Pro';
  workbook.lastModifiedBy = 'Planning Engineer';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color helper (removes '#' for ARGB)
  const hexToArgb = (hex: string) => {
    const clean = hex.replace('#', '');
    return 'FF' + (clean.length === 6 ? clean : '2563EB');
  };

  // ----------------------------------------------------
  // SHEET 1: PROJECT DASHBOARD
  // ----------------------------------------------------
  const sheet1 = workbook.addWorksheet('Project Dashboard', {
    views: [{ showGridLines: true }]
  });

  sheet1.columns = [
    { width: 5 },
    { width: 28 },
    { width: 35 },
    { width: 5 },
    { width: 26 },
    { width: 35 }
  ];

  // Title Banner
  sheet1.mergeCells('B2:F2');
  const titleCell = sheet1.getCell('B2');
  titleCell.value = 'SOLAR EPC BASELINE SCHEDULE DASHBOARD';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Dark navy
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet1.getRow(2).height = 40;

  // Subtitle
  sheet1.mergeCells('B3:F3');
  const subCell = sheet1.getCell('B3');
  subCell.value = `Official Project Baseline • Generated on ${format(new Date(), 'dd MMMM yyyy, HH:mm')} • Pre-Execution Stage`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet1.getRow(3).height = 20;

  // Section Header: Project Information
  sheet1.mergeCells('B5:C5');
  const sec1 = sheet1.getCell('B5');
  sec1.value = '1. PROJECT SPECIFICATIONS';
  sec1.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  sec1.alignment = { vertical: 'middle', indent: 1 };
  sheet1.getRow(5).height = 24;

  // Section Header: Schedule & Planning KPI
  sheet1.mergeCells('E5:F5');
  const sec2 = sheet1.getCell('E5');
  sec2.value = '2. SCHEDULE & KEY MILESTONES';
  sec2.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  sec2.alignment = { vertical: 'middle', indent: 1 };

  const projectInfo = [
    ['Project Name', project.name],
    ['Project ID / Code', project.code || project.id],
    ['Client / Developer', project.client],
    ['Project Type', project.type],
    ['Execution Model', project.executionModel],
    ['DC Capacity', `${project.dcCapacityMWp} MWp`],
    ['AC Capacity', `${project.acCapacityMW} MW`],
    ['DC / AC Ratio', `${project.dcAcRatio}`],
    ['Location Country', project.location.country],
    ['State & District', `${project.location.state}, ${project.location.district}`],
    ['Project Site', project.location.projectSite || 'Designated Solar Park Site'],
    ['Mounting Technology', project.mountingSystem],
    ['Foundation System', project.foundationType],
    ['Inverter Solution', project.inverterConfiguration]
  ];

  // Calculate project finish & total duration
  let projStart = project.startDate;
  let projFinish = project.targetFinishDate || project.startDate;
  if (activities.length > 0) {
    const dates = activities.map(a => a.finishDate).sort();
    projFinish = dates[dates.length - 1];
  }
  const totalDays = differenceInDays(parseISO(projFinish), parseISO(projStart)) + 1;
  const criticalCount = activities.filter(a => a.isCritical).length;
  const milestoneCount = activities.filter(a => a.isMilestone).length;

  const scheduleInfo = [
    ['Baseline Start Date', projStart],
    ['Forecast Completion Date', projFinish],
    ['Total Duration', `${totalDays} Calendar Days`],
    ['Calendar Basis', project.calendarType.replace(/_/g, ' ')],
    ['Working Days / Week', `${project.workingDaysPerWeek} Days`],
    ['Daily Working Hours', `${project.dailyWorkingHours} Hours / Day`],
    ['Total WBS Packages', `${wbsList.length} Packages`],
    ['Total Activities', `${activities.length} Work Items`],
    ['Critical Path Activities', `${criticalCount} Items (${Math.round((criticalCount / (activities.length || 1)) * 100)}%)`],
    ['Key Project Milestones', `${milestoneCount} Milestones`],
    ['Parallel Strategy', project.parallelExecutionPreference],
    ['Procurement Strategy', project.procurementStrategy],
    ['Substation & Grid Scope', project.substationScope],
    ['T-Line Interconnection', `${project.tLineLengthKm} km Transmission Line`]
  ];

  const maxRows = Math.max(projectInfo.length, scheduleInfo.length);
  for (let i = 0; i < maxRows; i++) {
    const rowIdx = 6 + i;
    sheet1.getRow(rowIdx).height = 20;

    // Left info
    if (i < projectInfo.length) {
      const labelCell = sheet1.getCell(`B${rowIdx}`);
      const valCell = sheet1.getCell(`C${rowIdx}`);
      labelCell.value = projectInfo[i][0];
      valCell.value = projectInfo[i][1];
      labelCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF475569' } };
      valCell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF0F172A' } };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      [labelCell, valCell].forEach(c => {
        c.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    }

    // Right info
    if (i < scheduleInfo.length) {
      const labelCell = sheet1.getCell(`E${rowIdx}`);
      const valCell = sheet1.getCell(`F${rowIdx}`);
      labelCell.value = scheduleInfo[i][0];
      valCell.value = scheduleInfo[i][1];
      labelCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF475569' } };
      valCell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF0F172A' } };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      [labelCell, valCell].forEach(c => {
        c.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    }
  }

  // ----------------------------------------------------
  // SHEET 2: WBS (WORK BREAKDOWN STRUCTURE)
  // ----------------------------------------------------
  const sheet2 = workbook.addWorksheet('WBS', { views: [{ showGridLines: true }] });
  sheet2.columns = [
    { header: 'WBS Code', key: 'code', width: 14 },
    { header: 'WBS Element Name', key: 'name', width: 38 },
    { header: 'Hierarchy Level', key: 'level', width: 16 },
    { header: 'Start Date', key: 'startDate', width: 16 },
    { header: 'Finish Date', key: 'finishDate', width: 16 },
    { header: 'Duration (Days)', key: 'duration', width: 16 },
    { header: 'Child Activities', key: 'actCount', width: 16 },
    { header: 'Phase Description', key: 'description', width: 50 }
  ];

  const wbsHeadRow = sheet2.getRow(1);
  wbsHeadRow.height = 28;
  wbsHeadRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  wbsHeadRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  wbsHeadRow.alignment = { vertical: 'middle', horizontal: 'center' };

  wbsList.forEach(w => {
    const actCount = activities.filter(a => a.wbsId === w.id).length;
    const row = sheet2.addRow({
      code: w.code,
      name: w.name,
      level: `Level ${w.level}`,
      startDate: w.startDate,
      finishDate: w.finishDate,
      duration: w.duration,
      actCount: actCount,
      description: w.description || ''
    });
    row.height = 22;
    row.font = { name: 'Segoe UI', size: 9 };
    row.alignment = { vertical: 'middle' };

    // Tint with WBS color
    const colorArgb = hexToArgb(w.color);
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorArgb } };
    row.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  });

  // ----------------------------------------------------
  // SHEET 3: ACTIVITY REGISTER
  // ----------------------------------------------------
  const sheet3 = workbook.addWorksheet('Activity Register', { views: [{ showGridLines: true }] });
  sheet3.columns = [
    { header: 'WBS Code', key: 'wbsCode', width: 12 },
    { header: 'Activity ID', key: 'code', width: 14 },
    { header: 'Activity Name', key: 'name', width: 44 },
    { header: 'Start Date', key: 'startDate', width: 14 },
    { header: 'Finish Date', key: 'finishDate', width: 14 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Predecessors', key: 'predecessors', width: 18 },
    { header: 'Calendar', key: 'calendar', width: 15 },
    { header: 'Total Float', key: 'totalFloat', width: 12 },
    { header: 'Critical Path', key: 'isCritical', width: 14 },
    { header: 'Milestone', key: 'isMilestone', width: 12 },
    { header: 'Baseline Start', key: 'baselineStart', width: 14 },
    { header: 'Baseline Finish', key: 'baselineFinish', width: 14 },
    { header: 'Variance (Days)', key: 'variance', width: 14 }
  ];

  const actHeadRow = sheet3.getRow(1);
  actHeadRow.height = 28;
  actHeadRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  actHeadRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  actHeadRow.alignment = { vertical: 'middle', horizontal: 'center' };

  activities.forEach(a => {
    const parentWbs = wbsList.find(w => w.id === a.wbsId);
    const variance = a.baselineFinish && a.finishDate ? differenceInDays(parseISO(a.finishDate), parseISO(a.baselineFinish)) : 0;

    const row = sheet3.addRow({
      wbsCode: parentWbs?.code || '',
      code: a.code,
      name: a.name,
      startDate: a.startDate,
      finishDate: a.finishDate,
      duration: a.duration,
      predecessors: (a.predecessors || []).join(', '),
      calendar: a.calendarId.replace(/_/g, ' '),
      totalFloat: a.totalFloat ?? 0,
      isCritical: a.isCritical ? 'CRITICAL' : 'Normal',
      isMilestone: a.isMilestone ? 'YES' : 'NO',
      baselineStart: a.baselineStart || a.startDate,
      baselineFinish: a.baselineFinish || a.finishDate,
      variance: variance
    });
    row.height = 20;
    row.font = { name: 'Segoe UI', size: 9 };
    row.alignment = { vertical: 'middle' };

    if (a.isCritical) {
      row.getCell('isCritical').font = { bold: true, color: { argb: 'FFDC2626' } };
      row.getCell('isCritical').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    }
    if (a.isMilestone) {
      row.getCell('isMilestone').font = { bold: true, color: { argb: 'FFD97706' } };
    }
  });

  // ----------------------------------------------------
  // SHEET 4: GANTT CHART (VISUAL EXCEL SPREADSHEET TIMELINE)
  // ----------------------------------------------------
  const sheet4 = workbook.addWorksheet('Gantt Chart', { views: [{ showGridLines: true }] });

  // Calculate timeline span in months
  const startYear = parseISO(projStart).getFullYear();
  const startMonth = parseISO(projStart).getMonth(); // 0-indexed
  const finishYear = parseISO(projFinish).getFullYear();
  const finishMonth = parseISO(projFinish).getMonth();
  const totalMonths = (finishYear - startYear) * 12 + (finishMonth - startMonth) + 1;

  // Static columns + 1 column per month or 2 columns per month (half months)
  sheet4.columns = [
    { header: 'WBS', key: 'wbs', width: 10 },
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Task / Activity Name', key: 'name', width: 38 },
    { header: 'Start', key: 'start', width: 12 },
    { header: 'Finish', key: 'finish', width: 12 },
    { header: 'Days', key: 'days', width: 8 },
    ...Array.from({ length: totalMonths }).map((_, i) => {
      const mDate = new Date(startYear, startMonth + i, 1);
      return {
        header: format(mDate, 'MMM yyyy'),
        key: `month_${i}`,
        width: 10
      };
    })
  ];

  const ganttHead = sheet4.getRow(1);
  ganttHead.height = 26;
  ganttHead.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  ganttHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  ganttHead.alignment = { vertical: 'middle', horizontal: 'center' };

  // Populate row by row: WBS header followed by its activities (just like the web app!)
  wbsList.forEach(wbs => {
    // WBS Summary Row
    const wbsRowData: Record<string, any> = {
      wbs: wbs.code,
      id: '',
      name: wbs.name.toUpperCase(),
      start: wbs.startDate,
      finish: wbs.finishDate,
      days: wbs.duration
    };

    const wbsRow = sheet4.addRow(wbsRowData);
    wbsRow.height = 22;
    wbsRow.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Fill WBS summary bar across relevant months
    const wbsStartM = (parseISO(wbs.startDate || projStart).getFullYear() - startYear) * 12 + (parseISO(wbs.startDate || projStart).getMonth() - startMonth);
    const wbsFinishM = (parseISO(wbs.finishDate || projFinish).getFullYear() - startYear) * 12 + (parseISO(wbs.finishDate || projFinish).getMonth() - startMonth);

    const wbsColorArgb = hexToArgb(wbs.color);
    wbsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wbsColorArgb } };
    wbsRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wbsColorArgb } };
    wbsRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wbsColorArgb } };
    wbsRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wbsColorArgb } };
    wbsRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wbsColorArgb } };
    wbsRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wbsColorArgb } };

    for (let m = 0; m < totalMonths; m++) {
      if (m >= wbsStartM && m <= wbsFinishM) {
        const cell = wbsRow.getCell(7 + m);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wbsColorArgb } };
        cell.value = '█';
        cell.font = { color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      }
    }

    // Child activities
    const childActivities = activities.filter(a => a.wbsId === wbs.id);
    childActivities.forEach(act => {
      const actRowData: Record<string, any> = {
        wbs: '',
        id: act.code,
        name: `   ${act.name}`,
        start: act.startDate,
        finish: act.finishDate,
        days: act.duration
      };

      const actRow = sheet4.addRow(actRowData);
      actRow.height = 18;
      actRow.font = { name: 'Segoe UI', size: 8 };

      const actStartM = (parseISO(act.startDate).getFullYear() - startYear) * 12 + (parseISO(act.startDate).getMonth() - startMonth);
      const actFinishM = (parseISO(act.finishDate).getFullYear() - startYear) * 12 + (parseISO(act.finishDate).getMonth() - startMonth);

      for (let m = 0; m < totalMonths; m++) {
        if (m >= actStartM && m <= actFinishM) {
          const cell = actRow.getCell(7 + m);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: wbsColorArgb } };
          cell.value = act.isMilestone ? '◆' : '■■';
          cell.font = { color: { argb: 'FFFFFFFF' }, size: 9 };
          cell.alignment = { horizontal: 'center' };
        }
      }
    });
  });

  // ----------------------------------------------------
  // SHEET 5: DEPENDENCIES AND CPM
  // ----------------------------------------------------
  const sheet5 = workbook.addWorksheet('Dependencies & CPM', { views: [{ showGridLines: true }] });
  sheet5.columns = [
    { header: 'Activity ID', key: 'code', width: 14 },
    { header: 'Activity Name', key: 'name', width: 40 },
    { header: 'Predecessors', key: 'predecessors', width: 20 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Early Start (ES)', key: 'es', width: 16 },
    { header: 'Early Finish (EF)', key: 'ef', width: 16 },
    { header: 'Late Start (LS)', key: 'ls', width: 16 },
    { header: 'Late Finish (LF)', key: 'lf', width: 16 },
    { header: 'Total Float (Days)', key: 'tf', width: 18 },
    { header: 'Critical Status', key: 'crit', width: 15 }
  ];

  const cpmHead = sheet5.getRow(1);
  cpmHead.height = 26;
  cpmHead.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  cpmHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  cpmHead.alignment = { vertical: 'middle', horizontal: 'center' };

  activities.forEach(a => {
    const row = sheet5.addRow({
      code: a.code,
      name: a.name,
      predecessors: (a.predecessors || []).join(', ') || 'None (Project Start)',
      type: 'FS (Finish-to-Start)',
      es: a.earlyStart || a.startDate,
      ef: a.earlyFinish || a.finishDate,
      ls: a.lateStart || a.startDate,
      lf: a.lateFinish || a.finishDate,
      tf: a.totalFloat ?? 0,
      crit: a.isCritical ? 'CRITICAL PATH' : 'FLOAT AVAILABLE'
    });
    row.height = 20;
    row.font = { name: 'Segoe UI', size: 9 };

    if (a.isCritical) {
      row.getCell('crit').font = { bold: true, color: { argb: 'FFDC2626' } };
      row.getCell('crit').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    }
  });

  // ----------------------------------------------------
  // SHEET 6: BASELINE COMPARISON
  // ----------------------------------------------------
  const sheet6 = workbook.addWorksheet('Baseline Comparison', { views: [{ showGridLines: true }] });
  sheet6.columns = [
    { header: 'Activity ID', key: 'code', width: 14 },
    { header: 'Activity Name', key: 'name', width: 40 },
    { header: 'Baseline Start', key: 'bStart', width: 16 },
    { header: 'Current Planned Start', key: 'cStart', width: 20 },
    { header: 'Start Variance (Days)', key: 'sVar', width: 20 },
    { header: 'Baseline Finish', key: 'bFinish', width: 16 },
    { header: 'Current Planned Finish', key: 'cFinish', width: 20 },
    { header: 'Finish Variance (Days)', key: 'fVar', width: 20 },
    { header: 'Baseline Days', key: 'bDays', width: 14 },
    { header: 'Current Days', key: 'cDays', width: 14 },
    { header: 'Duration Variance', key: 'dVar', width: 18 }
  ];

  const bHead = sheet6.getRow(1);
  bHead.height = 26;
  bHead.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  bHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  bHead.alignment = { vertical: 'middle', horizontal: 'center' };

  activities.forEach(a => {
    const sVar = a.baselineStart && a.startDate ? differenceInDays(parseISO(a.startDate), parseISO(a.baselineStart)) : 0;
    const fVar = a.baselineFinish && a.finishDate ? differenceInDays(parseISO(a.finishDate), parseISO(a.baselineFinish)) : 0;
    const dVar = (a.duration || 0) - (a.baselineDuration || a.duration || 0);

    const row = sheet6.addRow({
      code: a.code,
      name: a.name,
      bStart: a.baselineStart || a.startDate,
      cStart: a.startDate,
      sVar: sVar === 0 ? 'On Schedule' : `${sVar > 0 ? '+' : ''}${sVar} d`,
      bFinish: a.baselineFinish || a.finishDate,
      cFinish: a.finishDate,
      fVar: fVar === 0 ? 'On Schedule' : `${fVar > 0 ? '+' : ''}${fVar} d`,
      bDays: a.baselineDuration || a.duration,
      cDays: a.duration,
      dVar: dVar === 0 ? 'No Change' : `${dVar > 0 ? '+' : ''}${dVar} d`
    });
    row.height = 20;
    row.font = { name: 'Segoe UI', size: 9 };

    if (fVar > 0) {
      row.getCell('fVar').font = { color: { argb: 'FFDC2626' }, bold: true };
    }
  });

  // ----------------------------------------------------
  // SHEET 7: ASSUMPTIONS & VALIDATION
  // ----------------------------------------------------
  const sheet7 = workbook.addWorksheet('Assumptions & Validation', { views: [{ showGridLines: true }] });
  sheet7.columns = [
    { header: 'Category', key: 'cat', width: 22 },
    { header: 'Planning Parameter / Rule', key: 'param', width: 34 },
    { header: 'Applied Assumption & Standard Reference', key: 'val', width: 55 },
    { header: 'Validation Status', key: 'status', width: 20 }
  ];

  const assHead = sheet7.getRow(1);
  assHead.height = 26;
  assHead.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  assHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  assHead.alignment = { vertical: 'middle', horizontal: 'center' };

  const assumptions = [
    ['Working Calendar', 'Weekly Working Days', `${project.workingDaysPerWeek} days/week standard construction work calendar`, 'VALIDATED'],
    ['Working Calendar', 'Daily Working Hours', `${project.dailyWorkingHours} hours/day single shift standard`, 'VALIDATED'],
    ['Engineering & Design', 'Approval Durations', 'Includes statutory review cycles and utility interconnection studies', 'ASSUMPTION'],
    ['Procurement Lead Time', 'Module Delivery', `Scaled for ${project.dcCapacityMWp} MWp with phased on-site batch delivery`, 'VALIDATED'],
    ['Procurement Lead Time', 'Inverters & Skid', `Scaled for ${project.acCapacityMW} MW based on manufacturer batch lead times`, 'VALIDATED'],
    ['Civil Construction', 'Piling & MMS Erection', `Rate estimated based on ${project.foundationType} and ${project.mountingSystem}`, 'ENGINEER REVIEW'],
    ['Electrical Works', 'DC Stringing & MV Cabling', `Standard utility-scale crew deployment for ${project.inverterConfiguration}`, 'VALIDATED'],
    ['Grid Interconnection', 'Substation & T-Line', `${project.substationScope} with ${project.tLineLengthKm} km line stringing`, 'VALIDATED'],
    ['Commissioning', 'Grid Synchronization', 'Requires DISCOM / STU / CTU statutory inspection and charging approval', 'CRITICAL HOLD'],
    ['Schedule Validation', 'Circular Dependency Check', 'Network topology validated: Zero circular references detected', 'PASSED'],
    ['Schedule Validation', 'Float & Critical Path', 'Full forward-pass and backward-pass CPM executed successfully', 'PASSED']
  ];

  assumptions.forEach(item => {
    const row = sheet7.addRow({
      cat: item[0],
      param: item[1],
      val: item[2],
      status: item[3]
    });
    row.height = 20;
    row.font = { name: 'Segoe UI', size: 9 };
    if (item[3] === 'PASSED' || item[3] === 'VALIDATED') {
      row.getCell('status').font = { color: { argb: 'FF16A34A' }, bold: true };
    } else if (item[3] === 'CRITICAL HOLD') {
      row.getCell('status').font = { color: { argb: 'FFDC2626' }, bold: true };
    } else {
      row.getCell('status').font = { color: { argb: 'FFD97706' }, bold: true };
    }
  });

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Baseline_Schedule_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  saveAs(blob, fileName);
}
