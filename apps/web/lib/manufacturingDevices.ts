/**
 * Extensive list of real manufacturing devices for small shops to large corps.
 * Categories and models used in industry.
 */

export const deviceTypes = [
  { value: '3d_printer_fdm', label: '3D Printer (FDM/FFF)' },
  { value: '3d_printer_resin', label: '3D Printer (SLA/Resin)' },
  { value: '3d_printer_sls', label: '3D Printer (SLS/MJF)' },
  { value: '3d_printer_metal', label: '3D Printer (Metal)' },
  { value: 'cnc_mill', label: 'CNC Milling Machine' },
  { value: 'cnc_lathe', label: 'CNC Lathe' },
  { value: 'cnc_router', label: 'CNC Router' },
  { value: 'cnc_plasma', label: 'Plasma Cutter' },
  { value: 'waterjet', label: 'Waterjet' },
  { value: 'laser_co2', label: 'Laser Cutter (CO2)' },
  { value: 'laser_fiber', label: 'Laser (Fiber)' },
  { value: 'laser_diode', label: 'Laser (Diode/Desktop)' },
  { value: 'injection_molding', label: 'Injection Molding' },
  { value: 'edm', label: 'EDM' },
  { value: 'sheet_metal_brake', label: 'Press Brake' },
  { value: 'sheet_metal_shear', label: 'Shear' },
  { value: 'sheet_metal_punch', label: 'Punch Press' },
  { value: 'welding', label: 'Welding' },
  { value: 'grinder', label: 'Grinder' },
  { value: 'cmm', label: 'CMM / Metrology' },
  { value: 'other', label: 'Other' },
] as const;

export const commonDevices: Record<string, string[]> = {
  '3d_printer_fdm': [
    'Bambu Lab X1-Carbon', 'Bambu Lab P1S', 'Bambu Lab A1', 'Prusa i3 MK4', 'Prusa MK3S+', 'Prusa XL',
    'Creality Ender 3 V2', 'Creality Ender 3 S1', 'Creality K1', 'Creality CR-10', 'Ultimaker S7', 'Ultimaker S5', 'Ultimaker S3',
    'Raise3D RMF500', 'Raise3D Pro3', 'LulzBot TAZ 6', 'LulzBot Mini 2', 'FlashForge Creator 4', 'FlashForge Adventurer 4',
    'Voron 2.4', 'Voron Trident', 'Rat Rig V-Core 3', 'Creality Ender 5 Plus', 'Anycubic Kobra 2', 'Elegoo Neptune 4', 'Sovol SV06',
    'Artillery Sidewinder', 'Qidi Tech X-Max 3', 'MakerBot Method X', 'MakerBot Sketch', 'BCN3D Epsilon', 'INTAMSYS FunMat Pro 610',
    'Titan Robotics Atlas', '3DGence Industry', 'Zortrax M300 Plus', 'Dremel DigiLab 3D45', 'Other',
  ],
  '3d_printer_resin': [
    'Formlabs Form 4', 'Formlabs Form 3+', 'Formlabs Form 3L', 'Formlabs Form 2', 'Elegoo Saturn 3', 'Elegoo Saturn 2', 'Elegoo Mars 4',
    'Anycubic Photon Mono X', 'Anycubic Photon M3', 'Phrozen Sonic Mega 8K', 'Phrozen Sonic 4K', 'Prusa SL1S', 'Peopoly Phenom', 'Peopoly Forge',
    'Creality HALOT-MAGE', 'Phrozen Sonic Mini', 'EPAX E10', 'Uniz Slash', '3D Systems Figure 4', 'Carbon M3', 'Nexa3D NXE 400',
    'Lithoz CeraFab', 'Boston Micro Fabrication', 'Other',
  ],
  '3d_printer_sls': [
    'Formlabs Fuse 1+', 'Formlabs Fuse 1', 'Sinterit Lisa Pro', 'Sinterit Lisa', 'Sintratec Kit', 'Sintratec S2', 'Sharebot SnowWhite',
    '3D Systems sPro 60', 'EOS Formiga P 110', 'EOS P 396', 'EOS P 770', 'HP Jet Fusion 5200', 'HP Jet Fusion 4200', 'HP Jet Fusion 3200',
    'Stratasys F770', 'Other',
  ],
  '3d_printer_metal': [
    'Desktop Metal Shop System', 'Desktop Metal Production System', 'Markforged Metal X', 'Markforged X7', 'GE Additive Concept Laser M2',
    'GE Additive Arcam EBM', 'EOS M 300', 'EOS M 290', 'EOS M 100', 'Velo3D Sapphire', 'Velo3D Sapphire XC', 'SLM Solutions NXG XII',
    'Renishaw RenAM 500', '3D Systems DMP Factory', 'Trumpf TruPrint', 'Additive Industries MetalFAB1', 'DMG MORI LASERTEC', 'Optomec LENS',
    'Sciaky EBAM', 'Other',
  ],
  'cnc_mill': [
    'HAAS VF-2', 'HAAS VF-3', 'HAAS Mini Mill', 'HAAS TM-1', 'HAAS TM-2', 'HAAS DM-2', 'HAAS DT-1', 'Tormach PCNC 440', 'Tormach 770M', 'Tormach 1100M', 'Tormach 15L Slant-PRO',
    'Datron M8', 'Datron M10', 'Datron Neo', 'Hurco VM10', 'Hurco VMX30', 'DMG MORI CMX 50', 'DMG MORI NLX 2500', 'Mazak Quick Turn', 'Mazak Integrex',
    'Okuma Genos M560', 'Okuma LB3000', 'Doosan DNM 5700', 'Fadal VMC 4020', 'Bridgeport GX 1000', 'Sharp SV-2414', 'Genmitsu PROVerXL', 'Nomad 3', 'Pocket NC V2-50', 'Other',
  ],
  'cnc_lathe': [
    'HAAS ST-10', 'HAAS ST-20', 'HAAS ST-30', 'HAAS ST-40', 'Grizzly G0765', 'Precision Matthews PM-1340GT', 'Tormach 15L Slant-PRO', 'Romi C420',
    'Mazak Quick Turn', 'DMG MORI CTX beta 800', 'Okuma LB3000', 'Monarch Lathe', 'Hardinge Conquest', 'South Bend', 'Emco Maier', 'Other',
  ],
  'cnc_router': [
    'ShopBot Desktop', 'ShopBot Buddy', 'ShopBot PRSalpha', 'Axiom Precision AR8', 'Laguna SmartShop 2', 'Thermwood M40', 'Thermwood C40', 'Thermwood 5-axis',
    'Multicam 3000', 'Camaster', 'Onefinity', 'Avid CNC', 'Sienci', 'Shapeoko', 'X-Carve', 'Longmill', 'PrintNC', 'BobsCNC', 'Other',
  ],
  'cnc_plasma': [
    'Lincoln PowerCut', 'Hypertherm Powermax', 'Hypertherm Synergy', 'ESAB Crossflow', 'Kaliburn', 'Miller Spectrum', 'Thermal Dynamics',
    'Langmuir Systems CrossFire', 'Langmuir MR-1', 'Other',
  ],
  'waterjet': [
    'OMAX 2652', 'OMAX 55100', 'OMAX Maxiem', 'Flow Mach 2', 'Flow Mach 3', 'Flow Mach 4', 'Flow Waterjet', 'Bystronic ByJet', 'Jet Edge', 'Wardjet', 'KMT', 'Resato', 'Sugino', 'Dardi', 'ESAB', 'Other',
  ],
  'laser_co2': [
    'Epilog Fusion Pro', 'Epilog Zing', 'Epilog Mini', 'Trotec Speedy 360', 'Trotec Speedy 400', 'Trotec Speedy 100', 'Boss LS-1630', 'Boss LS-2440',
    'Universal PLS6.150D', 'Universal VLS', 'Glowforge Pro', 'Glowforge Plus', 'Glowforge Basic', 'xTool P2', 'xTool M1', 'OMTech 40W', 'OMTech 60W',
    'Thunder Nova 35', 'Full Spectrum', 'G.Weike', 'Rabbit Laser', 'BODOR', 'Ten-High', 'Aeon', 'Mira', 'Other',
  ],
  'laser_fiber': [
    'Bystronic BySprint Fiber', 'Bystronic ByStar Fiber', 'Mazak Optiplex', 'Amada ENSIS', 'Trumpf TruFiber', 'Coherent', 'IPG', 'nLight', 'JK Lasers', 'Raycus', 'Max Photonics', 'GW Laser', 'Other',
  ],
  'laser_diode': [
    'xTool D1', 'xTool S1', 'Sculpfun S30', 'Ortur Laser Master 3', 'Two Trees TTS-55', 'NEJE', 'LaserPecker', 'Atomstack', 'FoxAlien', 'SCULPFUN', 'Other',
  ],
  'injection_molding': [
    'Arburg Allrounder 370E', 'Arburg Allrounder 470H', 'Arburg Allrounder 520C', 'Engel Victory', 'Engel e-mac', 'Engel insert', 'Husky HyPET', 'Husky Hylectric',
    'Boy Machines 15A', 'Boy Machines 22M', 'Boy Machines 50E', 'KraussMaffei', 'Milacron', 'Haitian', 'Sumitomo', 'Nissei', 'Toshiba', 'Cincinnati', 'Other',
  ],
  'edm': [
    'Makino EDNC64', 'Makino EDGE2', 'GF Machining Solutions', 'Sodick AG60L', 'Sodick AQ325L', 'Charmilles', 'Mitsubishi MV1200', 'ONA', 'FANUC Robocut', 'AccuteX', 'Other',
  ],
  'sheet_metal_brake': [
    'Amada', 'Trumpf', 'Bystronic', 'LVD', 'Durma', 'Baileigh', 'Geka', 'Haco', 'Di-Acro', 'Mate', 'Other',
  ],
  'sheet_metal_shear': [
    'Amada', 'Durma', 'Cincinnati', 'Baileigh', 'Edwards', 'KRRASS', 'Pacific', 'Piranha', 'Grizzly', 'Other',
  ],
  'sheet_metal_punch': [
    'Amada', 'Trumpf', 'Murata', 'Finn-Power', 'Salvagnini', 'LVD', 'Bystronic', 'Other',
  ],
  'welding': [
    'Lincoln TIG 275', 'Miller Dynasty', 'ESAB Rebel', 'Fronius TIG', 'Everlast TIG', 'Hobart', 'Hypertherm', 'Kemppi', 'OTC', 'Panasonic', 'Fronius MIG', 'Miller MIG', 'Other',
  ],
  'grinder': [
    'Haas', 'Okamoto', 'Studer', 'Kellenberger', 'Jones & Shipman', 'Chevalier', 'Kent', 'Doimak', 'Taccella', 'Other',
  ],
  'cmm': [
    'Zeiss Contura', 'Zeiss Prismo', 'Mitutoyo CMM', 'Hexagon', 'Faro Arm', 'Faro ScanArm', 'Romer Arm', 'Creaform', 'GOM', 'Keyence', 'Other',
  ],
  'other': [
    'Vacuum Former', 'Roll Forming', 'Forging', 'Casting', 'Stamping', 'Knitting Machine', 'Embroidery', 'Vinyl Cutter', 'Other',
  ],
};

