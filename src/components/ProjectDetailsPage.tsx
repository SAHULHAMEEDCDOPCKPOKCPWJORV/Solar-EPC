import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { COUNTRIES_DATA } from '../utils/locations';
import {
  ProjectType,
  ExecutionModel,
  ModuleMountingType,
  FoundationType,
  InverterConfig,
  WorkingCalendarType,
  ProjectDetails,
  ProjectScopeItem
} from '../types';
import {
  SunMedium,
  Calendar,
  MapPin,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  Info,
  Building2,
  FolderOpen
} from 'lucide-react';
import { format, addMonths } from 'date-fns';

const DEFAULT_SCOPES: ProjectScopeItem[] = [
  { id: 'sc-1', name: 'Project Development and Approvals', category: 'Pre-Construction', included: true },
  { id: 'sc-2', name: 'Land Acquisition and Handover', category: 'Civil & Site', included: true },
  { id: 'sc-3', name: 'Site Survey and Geotechnical Investigation', category: 'Civil & Site', included: true },
  { id: 'sc-4', name: 'Engineering and Design', category: 'Engineering', included: true },
  { id: 'sc-5', name: 'Procurement and Logistics', category: 'Supply Chain', included: true },
  { id: 'sc-6', name: 'Civil Construction & Roads', category: 'Civil & Site', included: true },
  { id: 'sc-7', name: 'Module Mounting & Solar PV Installation', category: 'Installation', included: true },
  { id: 'sc-8', name: 'Electrical Installation & Cabling', category: 'Installation', included: true },
  { id: 'sc-9', name: 'Transformer and Substation Works', category: 'Grid', included: true },
  { id: 'sc-10', name: 'Transmission Line and Interconnection', category: 'Grid', included: true },
  { id: 'sc-11', name: 'Testing and Commissioning', category: 'Commissioning', included: true },
  { id: 'sc-12', name: 'Documentation and Commercial Handover', category: 'Handover', included: true }
];

export const ProjectDetailsPage: React.FC = () => {
  const { createAndGenerateProject, savedProjects, loadProjectFromStorage, showToast, setCurrentPage } = useProject();

  // Basic Details - Clean & Blank for Client Input
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Utility-Scale Solar PV');
  const [executionModel, setExecutionModel] = useState<ExecutionModel>('EPC');

  // Capacities - Clean & Blank for Client Input
  const [dcCapacityMWp, setDcCapacityMWp] = useState<string>('');
  const [acCapacityMW, setAcCapacityMW] = useState<string>('');
  const [includeBess, setIncludeBess] = useState<boolean>(false);
  const [bessMWh, setBessMWh] = useState<string>('');
  const [bessMW, setBessMW] = useState<string>('');
  const [gridInterconnectionKV, setGridInterconnectionKV] = useState<number>(220);

  // Cascading Location Selector - Dynamic Defaults
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Ramanathapuram (Kamuthi)');
  const [cityTown, setCityTown] = useState('');
  const [projectSite, setProjectSite] = useState('');

  // Schedule & Calendar Info
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetFinishDate, setTargetFinishDate] = useState(format(addMonths(new Date(), 12), 'yyyy-MM-dd'));
  const [calendarType, setCalendarType] = useState<WorkingCalendarType>('6_DAYS_WEEK');
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState<number>(6);
  const [dailyWorkingHours, setDailyWorkingHours] = useState<number>(8);
  const [parallelExecution, setParallelExecution] = useState<'Standard' | 'Aggressive Fast-Track' | 'Sequential Risk-Averse'>('Standard');
  const [procurementStrategy, setProcurementStrategy] = useState<'Early Long-Lead Orders' | 'Phased Just-In-Time' | 'Turnkey Package Supply'>('Early Long-Lead Orders');

  // Advanced Technical Inputs (Collapsible)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [mountingSystem, setMountingSystem] = useState<ModuleMountingType>('Single Axis Tracker (Horizontal)');
  const [foundationType, setFoundationType] = useState<FoundationType>('Driven Pre-galvanized Steel Piles');
  const [inverterConfig, setInverterConfig] = useState<InverterConfig>('Central Inverters (with MV Skid)');
  const [substationScope, setSubstationScope] = useState<'Full Pooling Substation' | 'Bay Extension at Existing Substation' | 'Compact Kiosk Substation' | 'Not Applicable'>('Full Pooling Substation');
  const [tLineLengthKm, setTLineLengthKm] = useState<number>(15);

  // Scopes List
  const [scopes, setScopes] = useState<ProjectScopeItem[]>(DEFAULT_SCOPES);
  const [customScopeInput, setCustomScopeInput] = useState('');

  // Selected Country data
  const currentCountryObj = COUNTRIES_DATA.find(c => c.name === country) || COUNTRIES_DATA[0];
  const currentStateObj = currentCountryObj.states.find(s => s.name === stateName) || currentCountryObj.states[0];

  // Auto update districts when state changes
  useEffect(() => {
    if (currentStateObj && !currentStateObj.districts.includes(district)) {
      setDistrict(currentStateObj.districts[0] || '');
    }
  }, [stateName, currentStateObj]);

  // Auto calculate DC/AC Ratio dynamically based on client input
  const numDc = parseFloat(dcCapacityMWp) || 0;
  const numAc = parseFloat(acCapacityMW) || 0;
  const dcAcRatio = numAc > 0 && numDc > 0 ? Number((numDc / numAc).toFixed(2)) : 0;

  const handleToggleScope = (scopeId: string) => {
    setScopes(prev => prev.map(s => (s.id === scopeId ? { ...s, included: !s.included } : s)));
  };

  const handleAddCustomScope = () => {
    if (!customScopeInput.trim()) return;
    const newScope: ProjectScopeItem = {
      id: `sc-custom-${Date.now()}`,
      name: customScopeInput.trim(),
      category: 'Custom Scope',
      included: true,
      isCustom: true
    };
    setScopes(prev => [...prev, newScope]);
    setCustomScopeInput('');
    showToast(`Added custom work package: ${newScope.name}`, 'info');
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      showToast('Please enter the Project Name.', 'error');
      return;
    }
    if (numDc <= 0) {
      showToast('Please enter a valid DC Capacity (MWp) greater than 0.', 'error');
      return;
    }
    if (numAc <= 0) {
      showToast('Please enter a valid AC Capacity (MW) greater than 0.', 'error');
      return;
    }

    const autoCode = projectId.trim() || `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newProject: ProjectDetails = {
      id: autoCode,
      name: projectName.trim(),
      code: autoCode,
      client: clientName.trim() || 'Client / Project Owner',
      type: projectType,
      executionModel,
      dcCapacityMWp: numDc,
      acCapacityMW: numAc,
      dcAcRatio: dcAcRatio || 1.25,
      includeBess,
      bessCapacityMWh: includeBess ? parseFloat(bessMWh) || 0 : undefined,
      bessPowerMW: includeBess ? parseFloat(bessMW) || 0 : undefined,
      gridInterconnectionKV: Number(gridInterconnectionKV),
      gridInterconnectionCapacityMW: numAc,
      location: {
        country,
        state: stateName,
        district,
        cityTown: cityTown.trim() || district,
        projectSite: projectSite.trim() || 'Designated Solar Project Site'
      },
      startDate,
      targetFinishDate,
      calendarType,
      workingDaysPerWeek,
      dailyWorkingHours,
      parallelExecutionPreference: parallelExecution,
      procurementStrategy,
      mountingSystem,
      foundationType,
      inverterConfiguration: inverterConfig,
      substationScope,
      tLineLengthKm: Number(tLineLengthKm),
      includeWaterSupply: true,
      includeInternalRoadsAndDrainage: true,
      scopes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeRevision: 1
    };

    createAndGenerateProject(newProject);
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#080e1a] text-slate-100 pb-28">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0c1527]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 shadow-md shadow-blue-500/20">
            <SunMedium className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Solar EPC <span className="text-blue-400 font-semibold">Baseline Scheduler</span>
            </h1>
            <p className="text-[11px] text-slate-400">Step 2: Project Parameters & Engineering Scope Formulation</p>
          </div>
        </div>

        {/* Existing Projects Dropdown */}
        {savedProjects.length > 0 && (
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <select
              onChange={(e) => {
                if (e.target.value) loadProjectFromStorage(e.target.value);
              }}
              defaultValue=""
              className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>Load Existing Project ({savedProjects.length})...</option>
              {savedProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.dcCapacityMWp} MWp)
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Baseline Generator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Configure Your Solar EPC Project
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Input the exact capacity, site location, timeline constraints, and scope breakdown. Our Primavera-grade CPM engine will dynamically formulate your Work Breakdown Structure (WBS), activity durations, critical path, and dependency network.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-8">
          {/* SECTION 1: BASIC PROJECT INFORMATION */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wide">
                1. Project Identity & Contracting Framework
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Project Name */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name (e.g. Solar PV Power Project)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Project ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Code / ID
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-slate-300 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Client / Offtaker / Developer
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client / developer name"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Solar Project Type
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Utility-Scale Solar PV">Utility-Scale Solar PV (Ground-Mounted)</option>
                  <option value="Ground-Mounted Solar PV">Ground-Mounted Captive / C&I</option>
                  <option value="Rooftop Solar PV">Commercial & Industrial Rooftop</option>
                  <option value="Floating Solar PV">Floating Solar PV (Reservoir / Lake)</option>
                  <option value="Solar PV with Battery Energy Storage">Solar PV + BESS Hybrid</option>
                  <option value="Solar PV with Associated Grid Infrastructure">Solar PV with Dedicated Substation & T-Line</option>
                  <option value="Other Solar EPC Project">Other Customized Solar EPC</option>
                </select>
              </div>

              {/* Execution Model */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  EPC Execution Model
                </label>
                <select
                  value={executionModel}
                  onChange={(e) => setExecutionModel(e.target.value as ExecutionModel)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EPC">Turnkey EPC (Engineering, Procurement & Construction)</option>
                  <option value="Engineering and Construction">Engineering and Construction (Owner-Supplied Modules)</option>
                  <option value="Design, Supply and Installation">Design, Supply and Installation (DSI)</option>
                  <option value="BOP (Balance of Plant)">Balance of Plant (Civil + Electrical BOP)</option>
                  <option value="Custom Execution Model">Custom Framework Agreement</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 2: CAPACITIES & ENERGY SPECIFICATIONS */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  2. Power Capacity & Electrical Dimensions
                </h3>
              </div>
              <div className="text-xs text-amber-400/90 bg-amber-400/10 px-3 py-1 rounded-full font-mono border border-amber-400/20">
                Calculated DC/AC Overload Ratio: <span className="font-bold">{dcAcRatio > 0 ? `${dcAcRatio}x` : '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* DC Capacity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  DC Installed Capacity (MWp) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 100"
                    value={dcCapacityMWp}
                    onChange={(e) => setDcCapacityMWp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">MWp</span>
                </div>
              </div>

              {/* AC Capacity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  AC Export Capacity (MW) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 80"
                    value={acCapacityMW}
                    onChange={(e) => setAcCapacityMW(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">MW</span>
                </div>
              </div>

              {/* Interconnection kV */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Grid Interconnection Voltage
                </label>
                <select
                  value={gridInterconnectionKV}
                  onChange={(e) => setGridInterconnectionKV(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={11}>11 kV Distribution Interconnection</option>
                  <option value={33}>33 kV Internal Pooling / Local Grid</option>
                  <option value={66}>66 kV Regional Substation</option>
                  <option value={110}>110 kV Substation</option>
                  <option value={132}>132 kV Transmission Grid</option>
                  <option value={220}>220 kV ISTS / STU Substation</option>
                  <option value={400}>400 kV Ultra High Voltage Grid</option>
                </select>
              </div>

              {/* BESS Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Battery Storage (BESS)
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBess}
                      onChange={(e) => setIncludeBess(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-slate-300">{includeBess ? 'BESS Included' : 'No Battery Scope'}</span>
                </div>
              </div>
            </div>

            {includeBess && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    BESS Energy Rating (MWh)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={bessMWh}
                    onChange={(e) => setBessMWh(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    BESS Continuous Power (MW)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={bessMW}
                    onChange={(e) => setBessMW(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>
            )}
          </section>

          {/* SECTION 3: CASCADING LOCATION SELECTOR (ALL 28 INDIAN STATES & 8 UTS ACCURATE DATA) */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  3. Project Geography & Site Location
                </h3>
                <p className="text-[11px] text-slate-400">
                  Comprehensive cascading selector supporting all 28 States & 8 Union Territories with verified districts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    const newCountry = e.target.value;
                    setCountry(newCountry);
                    const cObj = COUNTRIES_DATA.find(c => c.name === newCountry);
                    if (cObj && cObj.states.length > 0) {
                      setStateName(cObj.states[0].name);
                      setDistrict(cObj.states[0].districts[0] || '');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COUNTRIES_DATA.map(c => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* State / Territory */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  State / Union Territory
                </label>
                <select
                  value={stateName}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setStateName(newState);
                    const sObj = currentCountryObj.states.find(s => s.name === newState);
                    if (sObj && sObj.districts.length > 0) {
                      setDistrict(sObj.districts[0]);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentCountryObj.states.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  District
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentStateObj.districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* City / Taluk / Tehsil */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nearest City / Town / Taluk
                </label>
                <input
                  type="text"
                  value={cityTown}
                  onChange={(e) => setCityTown(e.target.value)}
                  placeholder="Enter nearest city or town"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Project Site Name */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Site Coordinates / Plot Identifier
                </label>
                <input
                  type="text"
                  value={projectSite}
                  onChange={(e) => setProjectSite(e.target.value)}
                  placeholder="Enter project site name, plot number or coordinates"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* SECTION 4: TIMELINE, CALENDAR & EXECUTION STRATEGY */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white uppercase tracking-wide">
                4. Schedule Calendar & Execution Constraints
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Planned Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Planned Project Start Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Target Finish Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target COD / Completion Date
                </label>
                <input
                  type="date"
                  value={targetFinishDate}
                  onChange={(e) => setTargetFinishDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Calendar Model */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Working Calendar Model
                </label>
                <select
                  value={calendarType}
                  onChange={(e) => {
                    const ct = e.target.value as WorkingCalendarType;
                    setCalendarType(ct);
                    setWorkingDaysPerWeek(ct === '7_DAYS_WEEK' ? 7 : ct === '6_DAYS_WEEK' ? 6 : ct === '5.5_DAYS_WEEK' ? 5.5 : 5);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="6_DAYS_WEEK">6 Days / Week (Standard Solar Site)</option>
                  <option value="5_DAYS_WEEK">5 Days / Week (Office & Engineering)</option>
                  <option value="5.5_DAYS_WEEK">5.5 Days / Week (Corporate Standard)</option>
                  <option value="7_DAYS_WEEK">7 Days / Week (Continuous Shift Acceleration)</option>
                </select>
              </div>

              {/* Parallel Execution Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Parallel Execution Preference
                </label>
                <select
                  value={parallelExecution}
                  onChange={(e) => setParallelExecution(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Standard">Standard Phased Parallelism</option>
                  <option value="Aggressive Fast-Track">Aggressive Fast-Track (Overlapping)</option>
                  <option value="Sequential Risk-Averse">Sequential Risk-Averse</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 5: ADVANCED TECHNICAL INPUTS (COLLAPSIBLE) */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    5. Engineering & Technical Parameters (Optional)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mounting structures, piling type, inverter technology, and substation interconnection scope
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                <span>{showAdvanced ? 'Hide Technical Parameters' : 'Show Technical Parameters'}</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvanced && (
              <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                {/* Module Mounting System */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Module Mounting System (MMS)
                  </label>
                  <select
                    value={mountingSystem}
                    onChange={(e) => setMountingSystem(e.target.value as ModuleMountingType)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
                  >
                    <option value="Fixed Tilt (South Oriented)">Fixed Tilt (South Oriented)</option>
                    <option value="Single Axis Tracker (Horizontal)">Single Axis Tracker (Horizontal 1P/2P)</option>
                    <option value="Seasonal Tilt">Seasonal Tilt (Manual Adjustable)</option>
                    <option value="Dual Axis Tracker">Dual Axis Tracker</option>
                    <option value="Rooftop Ballasted / Clamped">Rooftop Ballasted / Clamped</option>
                    <option value="Floating Pontoon System">Floating Pontoon System with Anchoring</option>
                  </select>
                </div>

                {/* Foundation Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Civil Foundation System
                  </label>
                  <select
                    value={foundationType}
                    onChange={(e) => setFoundationType(e.target.value as FoundationType)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
                  >
                    <option value="Driven Pre-galvanized Steel Piles">Driven Pre-galvanized Steel Piles (Hydraulic Ramming)</option>
                    <option value="Cast-in-situ Concrete Piles">Cast-in-situ Concrete Piles (Auger Drilled)</option>
                    <option value="Ground Screws / Helical Piles">Ground Screws / Helical Piles</option>
                    <option value="Precast Concrete Ballasts">Precast Concrete Ballasts</option>
                    <option value="Direct Embedment with Micropiling">Direct Embedment with Micropiling</option>
                  </select>
                </div>

                {/* Inverter Configuration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Inverter Configuration
                  </label>
                  <select
                    value={inverterConfig}
                    onChange={(e) => setInverterConfig(e.target.value as InverterConfig)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
                  >
                    <option value="Central Inverters (with MV Skid)">Central Inverters (with Integrated MV Skid)</option>
                    <option value="High-Power String Inverters (250kW+)">High-Power String Inverters (250kW+ / 350kW)</option>
                    <option value="Distributed String Inverters (100-150kW)">Distributed String Inverters (100-150kW)</option>
                    <option value="Microinverters">Microinverters (Rooftop Specialty)</option>
                  </select>
                </div>

                {/* Substation Scope */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pooling Substation Scope
                  </label>
                  <select
                    value={substationScope}
                    onChange={(e) => setSubstationScope(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
                  >
                    <option value="Full Pooling Substation">Full Pooling Substation (AIS / GIS Construction)</option>
                    <option value="Bay Extension at Existing Substation">Bay Extension at Existing Substation</option>
                    <option value="Compact Kiosk Substation">Compact Kiosk Substation</option>
                    <option value="Not Applicable">Not Applicable (By Utility / Client)</option>
                  </select>
                </div>

                {/* Transmission Line */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Transmission Line Distance (km)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={tLineLengthKm}
                      onChange={(e) => setTLineLengthKm(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">km</span>
                  </div>
                </div>

                {/* Procurement Strategy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Equipment Procurement Strategy
                  </label>
                  <select
                    value={procurementStrategy}
                    onChange={(e) => setProcurementStrategy(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
                  >
                    <option value="Early Long-Lead Orders">Early Long-Lead Orders (Fast Delivery)</option>
                    <option value="Phased Just-In-Time">Phased Just-In-Time Batch Deliveries</option>
                    <option value="Turnkey Package Supply">Turnkey Package Supply</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 6: WORK BREAKDOWN SCOPE PACKAGES */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    6. Project Work Packages & Scope Selectors
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Select the work packages included in your contract to generate matching WBS hierarchy and schedule activities
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {scopes.filter(s => s.included).length} of {scopes.length} Included
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {scopes.map(scope => (
                <div
                  key={scope.id}
                  onClick={() => handleToggleScope(scope.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    scope.included
                      ? 'bg-blue-950/40 border-blue-500/40 text-white shadow-sm shadow-blue-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      scope.included ? 'bg-blue-600 text-white' : 'border border-slate-700 bg-slate-800'
                    }`}
                  >
                    {scope.included && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${scope.included ? 'text-white' : 'text-slate-400'}`}>
                      {scope.name}
                    </p>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{scope.category}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Scope Adder */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-3">
              <input
                type="text"
                value={customScopeInput}
                onChange={(e) => setCustomScopeInput(e.target.value)}
                placeholder="Add custom scope package (e.g. SCADA & Weather Monitoring Station)..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomScope();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomScope}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
              >
                + Add Scope
              </button>
            </div>
          </section>

          {/* PRIMARY ACTION BUTTON: GENERATE BASELINE SCHEDULE */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/30 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Ready to Formulate Project Baseline</h4>
                <p className="text-xs text-slate-400">
                  Generates full CPM Critical Path, Activity Network, synchronized Gantt chart, and Excel export.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/30 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span>GENERATE BASELINE SCHEDULE</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
