/**
 * Gunsmith specialty taxonomy — matches server enum values
 */
export const SPECIALTY_LABELS = {
  // Rifle
  BARREL_WORK: 'Barrel work',
  BARREL_CONTOUR: 'Barrel contour',
  CHAMBERING: 'Chambering',
  ACTION_TRUING: 'Action truing',
  CHASSIS_FITTING: 'Chassis fitting',
  BEDDING: 'Bedding',
  BOLT_WORK: 'Bolt work',
  TRIGGER_JOBS_RIFLE: 'Trigger jobs (rifle)',
  MUZZLE_DEVICES: 'Muzzle devices',
  SUPPRESSOR_HOST_WORK: 'Suppressor host work',
  SCOPE_MOUNTING: 'Scope mounting',
  CERAKOTE_RIFLE: 'Cerakote (rifle)',
  STOCK_WORK_RIFLE: 'Stock work (rifle)',
  REBARREL: 'Rebarrel',
  RESTOCK: 'Restock',
  AR_BUILDS: 'AR builds',
  AR_TRIGGER: 'AR trigger',
  AR_BARREL: 'AR barrel',
  PRECISION_BUILD: 'Precision build',
  HUNTING_RIFLE_BUILD: 'Hunting rifle build',
  AI_PLATFORM: 'Accuracy International',
  TIKKA_PLATFORM: 'Tikka platform',
  REMINGTON_700: 'Remington 700',
  SAVAGE_PLATFORM: 'Savage platform',
  // Handgun
  '1911_WORK': '1911 work',
  GLOCK_WORK: 'Glock work',
  SIG_WORK: 'SIG work',
  CZ_WORK: 'CZ work',
  REVOLVER_WORK: 'Revolver work',
  TRIGGER_JOBS_PISTOL: 'Trigger jobs (pistol)',
  BARREL_FITTING_PISTOL: 'Barrel fitting (pistol)',
  SLIDE_MILLING: 'Slide milling',
  FRAME_WORK: 'Frame work',
  STIPPLING: 'Stippling',
  SIGHT_INSTALLATION: 'Sight installation',
  CERAKOTE_PISTOL: 'Cerakote (pistol)',
  COMPENSATOR_INSTALL: 'Compensator install',
  COMPETITION_PISTOL: 'Competition pistol',
  CARRY_PISTOL_BUILD: 'Carry pistol build',
  // Shotgun
  SHOTGUN_WORK: 'Shotgun work',
  CHOKE_WORK: 'Choke work',
  SHOTGUN_STOCK: 'Shotgun stock',
  SHOTGUN_TRIGGER: 'Shotgun trigger',
  SHOTGUN_BUILD: 'Shotgun build',
  // NFA
  SUPPRESSOR_SERVICE: 'Suppressor service',
  SUPPRESSOR_BUILD: 'Suppressor build',
  SBR_CONVERSION: 'SBR conversion',
  SBS_CONVERSION: 'SBS conversion',
  MG_SERVICE: 'Machine gun service',
  FORM_1_BUILDS: 'Form 1 builds',
  NFA_TRANSFERS: 'NFA transfers',
  // General
  CLEANING_SERVICE: 'Cleaning service',
  GENERAL_REPAIR: 'General repair',
  REFINISHING: 'Refinishing',
  ENGRAVING: 'Engraving',
  WOOD_STOCK_WORK: 'Wood stock work',
  LASER_ENGRAVING: 'Laser engraving',
  APPRAISALS: 'Appraisals',
  CONSIGNMENT: 'Consignment',
  TRANSFERS: 'FFL transfers',
  AMMO_RELOADING: 'Ammo reloading',
}

export const SPECIALTIES_BY_CATEGORY = {
  rifle: [
    'ACTION_TRUING', 'BARREL_WORK', 'CHASSIS_FITTING', 'BEDDING', 'CERAKOTE_RIFLE',
    'PRECISION_BUILD', 'REMINGTON_700', 'SCOPE_MOUNTING', 'AR_BUILDS', 'AR_TRIGGER',
  ],
  handgun: [
    '1911_WORK', 'GLOCK_WORK', 'SLIDE_MILLING', 'COMPETITION_PISTOL', 'CERAKOTE_PISTOL',
    'TRIGGER_JOBS_PISTOL', 'CZ_WORK', 'SIGHT_INSTALLATION',
  ],
  nfa: ['SUPPRESSOR_SERVICE', 'SBR_CONVERSION', 'NFA_TRANSFERS', 'SUPPRESSOR_HOST_WORK'],
  general: ['GENERAL_REPAIR', 'TRANSFERS', 'CLEANING_SERVICE', 'REFINISHING'],
}

/** Full taxonomy for edit form — all specialties grouped by category */
export const ALL_SPECIALTIES_BY_CATEGORY = {
  rifle: [
    'BARREL_WORK', 'BARREL_CONTOUR', 'CHAMBERING', 'ACTION_TRUING', 'CHASSIS_FITTING',
    'BEDDING', 'BOLT_WORK', 'TRIGGER_JOBS_RIFLE', 'MUZZLE_DEVICES', 'SUPPRESSOR_HOST_WORK',
    'SCOPE_MOUNTING', 'CERAKOTE_RIFLE', 'STOCK_WORK_RIFLE', 'REBARREL', 'RESTOCK',
    'AR_BUILDS', 'AR_TRIGGER', 'AR_BARREL', 'PRECISION_BUILD', 'HUNTING_RIFLE_BUILD',
    'AI_PLATFORM', 'TIKKA_PLATFORM', 'REMINGTON_700', 'SAVAGE_PLATFORM',
  ],
  handgun: [
    '1911_WORK', 'GLOCK_WORK', 'SIG_WORK', 'CZ_WORK', 'REVOLVER_WORK', 'TRIGGER_JOBS_PISTOL',
    'BARREL_FITTING_PISTOL', 'SLIDE_MILLING', 'FRAME_WORK', 'STIPPLING', 'SIGHT_INSTALLATION',
    'CERAKOTE_PISTOL', 'COMPENSATOR_INSTALL', 'COMPETITION_PISTOL', 'CARRY_PISTOL_BUILD',
  ],
  shotgun: [
    'SHOTGUN_WORK', 'CHOKE_WORK', 'SHOTGUN_STOCK', 'SHOTGUN_TRIGGER', 'SHOTGUN_BUILD',
  ],
  nfa: [
    'SUPPRESSOR_SERVICE', 'SUPPRESSOR_BUILD', 'SBR_CONVERSION', 'SBS_CONVERSION',
    'MG_SERVICE', 'FORM_1_BUILDS', 'NFA_TRANSFERS',
  ],
  general: [
    'CLEANING_SERVICE', 'GENERAL_REPAIR', 'REFINISHING', 'ENGRAVING', 'WOOD_STOCK_WORK',
    'LASER_ENGRAVING', 'APPRAISALS', 'CONSIGNMENT', 'TRANSFERS', 'AMMO_RELOADING',
  ],
}

export const FFL_LICENSE_OPTIONS = [
  { value: 'TYPE_01', label: 'Type 01 — Dealer' },
  { value: 'TYPE_02', label: 'Type 02 — Pawnbroker' },
  { value: 'TYPE_06', label: 'Type 06 — Ammo manufacturer' },
  { value: 'TYPE_07', label: 'Type 07 — Firearms manufacturer' },
  { value: 'TYPE_08', label: 'Type 08 — Importer' },
  { value: 'TYPE_09', label: 'Type 09 — Destructive devices dealer' },
  { value: 'TYPE_10', label: 'Type 10 — Destructive devices manufacturer' },
  { value: 'TYPE_11', label: 'Type 11 — Destructive devices importer' },
  { value: 'SOT_02', label: 'SOT Class 2 — NFA manufacturer' },
  { value: 'SOT_03', label: 'SOT Class 3 — NFA dealer' },
]

export const FOCUS_LABELS = {
  RIFLE: 'Rifle',
  HANDGUN: 'Handgun',
  GENERAL: 'General',
  SHOTGUN: 'Shotgun',
  NFA: 'NFA',
}
