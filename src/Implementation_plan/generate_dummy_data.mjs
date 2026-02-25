/**
 * Generates dummy_data.sql for the school performance panel database.
 * Run: node generate_dummy_data.mjs
 */
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Seeded random for reproducibility
let seed = 42;
function rand() {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return Math.abs(seed) / 0x7fffffff;
}
function randInt(lo, hi) { return Math.floor(rand() * (hi - lo + 1)) + lo; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
const g = () => randomUUID();

// ─── EXISTING IDs ────────────────────────────────────────────────────────────
const OPERATOR_ID = 'ebf1fc8b-b843-4a1c-988a-08de475af062';
const ADMIN_ID    = '58a6f197-3657-4452-4d6f-08de45e500bd';
const APP_ADMIN   = '2ab26fec-5161-4e30-b704-08de454cea07';

const PRIMARY_CL = '48962d03-cd7a-4a66-bc2d-95bc9bb52240';
const JUNIOR_CL  = 'ccb40ede-26ae-4cf6-9d45-d2ca00213ae4';
const SENIOR_CL  = '5a822b61-755b-4097-a658-d5dd03c3b61d';

const SEC_G6  = 'b1b7587b-e843-495e-ac79-9896d0bb11a2';
const SEC_G7  = '56865a6e-03a3-4c07-bb76-e54ffa203ef3';
const SEC_G8  = 'd18fcdae-d131-4a54-927f-6f9d2642db1c';
const SEC_G9  = '86e3d238-9f94-415c-a5ab-603ba4c14c5c';
const SEC_G10 = '33916f02-1e9f-4362-9c6c-8f477bdbbb0e';
const SEC_G11 = '2c9d55a7-3d89-4387-a635-23a13c9b0a86';

const CLS_7A = '1ba35f89-b4fc-49e4-efaa-08de4b75a119';
const CLS_8A = '60f92e22-018f-4e65-3cbe-08de4dcf38ef';
const CLS_9A = 'ce3145cb-a274-4576-fc5e-08de72b23d6c';

// Subjects
const S_SINHALA = '3de624b1-2ff4-4a44-00d8-08de4c2f581f';
const S_MATH    = '296d539c-1edf-45c1-a0e9-3c62f558dc30';
const S_SCIENCE = 'd29ea662-3442-4993-9151-775457b8ca7d';
const S_HISTORY = '5de0aee7-8ec4-4d80-8c2d-c4d6bc0bad31';
const S_ENGLISH = 'c6d01707-e178-462c-85cd-fda126ad18af';
const S_ICT     = 'ea4c63e5-e61b-4e4f-f8ea-08de4b797c98';
const S_PHYSICS = '128116a9-49aa-4388-8385-0a3b4e0eeea3';
const S_GEO     = '269d0412-bee4-4a1f-ab39-2f2fd61a753f';
const S_CHEM    = 'b2938657-64af-49e9-95e3-412a22147672';
const S_BIO     = 'f2608406-97ea-45a5-9b13-6f2f10f21ee2';
const S_MUSIC   = 'ea6ac5cc-3cc5-4ac4-8555-e9a4116d34d0';

const PWD = '$2a$11$ZAfSYe7LETO/i4roORvkquVl7IIMku6r9vutOK6.TmeAi3LD0y2Y.';
const DT  = `CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2)`;

const EXISTING_TEACHERS = [
  '9b00a1e5-3698-4a9f-60ec-08de4ac6406c',
  '5e3e79ab-47d6-49b0-f9fb-08de4ddd0f03',
  '0f41fa7e-347c-49ba-f9fc-08de4ddd0f03',
  '1f661fda-c314-451d-f9fd-08de4ddd0f03',
  '10808d9e-e642-4ef0-f9fe-08de4ddd0f03',
  '76012c1f-6219-4c48-f9ff-08de4ddd0f03',
  'fd805426-5465-4fde-fa00-08de4ddd0f03',
  'f95b46d6-aed5-4d1a-fa01-08de4ddd0f03',
  'c268b07c-1936-4729-fa02-08de4ddd0f03',
  '9bb27a17-eec1-41c4-fa03-08de4ddd0f03',
  'c0910cf0-1225-4932-0f91-08de72d979d6',
];

// Existing modules (section_id + subject_id -> [module_id...])
const EXISTING_MODULES = {
  [`${SEC_G6}|${S_MATH}`]:    ['bf97f6c3-db51-43a4-97b1-f77b0098d29a'],
  [`${SEC_G6}|${S_ICT}`]:     ['d3be73f6-9373-4c6d-90bd-98bdcd4c07bf'],
  [`${SEC_G6}|${S_ENGLISH}`]: ['4cd4fb4d-b60c-4c1c-b08d-399972811d97'],
  [`${SEC_G6}|${S_SCIENCE}`]: ['7efb71c3-3170-415f-8107-bc76fbba694c'],
  [`${SEC_G6}|${S_SINHALA}`]: ['2aecc0bc-de1b-4d42-b5e5-576b867a6358'],
  [`${SEC_G6}|${S_MUSIC}`]:   ['c021f66a-fe98-4fee-9484-19211be4d244'],

  [`${SEC_G7}|${S_ICT}`]:     ['9e817c07-66b1-40bc-ab2a-08de4b7bfeec','465ab105-30be-4e50-959e-a54637c97b7f'],
  [`${SEC_G7}|${S_MATH}`]:    ['19b2e8dd-3524-4c6a-983d-0da8055a2162'],
  [`${SEC_G7}|${S_SCIENCE}`]: ['aaa918fc-c8ff-4814-a8c7-68a8e52ed08e'],
  [`${SEC_G7}|${S_ENGLISH}`]: ['b2b12e13-d6d0-45d1-ad98-69513c8a7fca'],
  [`${SEC_G7}|${S_SINHALA}`]: ['e61bd22b-5e54-4b35-9f46-b8e91117a2c1'],
  [`${SEC_G7}|${S_HISTORY}`]: ['4306fb52-7da1-41a1-9875-dfb6ce035e60'],
  [`${SEC_G7}|${S_MUSIC}`]:   ['5ad05bfb-296d-4895-ad4c-c013e12b633f'],

  [`${SEC_G8}|${S_MATH}`]:    ['e78da54d-7b24-45ab-b690-989e0a394b5f'],
  [`${SEC_G8}|${S_ICT}`]:     ['86d70560-261a-4a9d-bef9-708d2efd1dd8'],
  [`${SEC_G8}|${S_GEO}`]:     ['ed8a1454-3b41-4ac6-8518-7d7ceb89dddf'],
  [`${SEC_G8}|${S_SCIENCE}`]: ['4122055a-b318-49c6-b2d1-50b5463802bf'],
  [`${SEC_G8}|${S_HISTORY}`]: ['d39b33a3-fd4e-49c0-b0fe-aae2e0d5c0f4'],
  [`${SEC_G8}|${S_ENGLISH}`]: ['d7c728ca-daa7-4f24-8fe8-e6828372e9c4'],
  [`${SEC_G8}|${S_SINHALA}`]: ['4dd5f9ac-0092-447a-8383-c970785268e5'],
  [`${SEC_G8}|${S_MUSIC}`]:   ['f3789a33-2536-4d0f-b3da-8bc676c6912b'],

  [`${SEC_G9}|${S_MATH}`]:    ['c234c0b5-b83d-4c91-ac8d-6e2f74767a57','1c7885c1-03d6-4bca-9bbc-7e306b33cbfc'],
  [`${SEC_G9}|${S_ENGLISH}`]: ['a9e9120c-4d6d-4566-8d3d-0ee13b172666'],
  [`${SEC_G9}|${S_SINHALA}`]: ['e27f52ce-e5de-4bc1-8671-7e2189afe0af'],
  [`${SEC_G9}|${S_CHEM}`]:    ['b0dec89e-572e-4b3a-aea2-5eca8b3b787d'],
  [`${SEC_G9}|${S_BIO}`]:     ['b6e7ab76-8b5e-49e8-aa06-df5b255b3536'],
  [`${SEC_G9}|${S_PHYSICS}`]: ['a4ec2661-b339-44fe-be99-f1bdcf0c594a'],
  [`${SEC_G9}|${S_HISTORY}`]: ['488177a0-d9b6-4d90-b362-79068085c693'],
  [`${SEC_G9}|${S_SCIENCE}`]: ['d5703933-ad22-4c75-9a54-ae1dcdde9a51','bb8ff1e5-9f8c-493b-830f-8a88f6e0037f','d445017e-c4eb-4590-9671-8b208e1d0dbf'],
  [`${SEC_G9}|${S_ICT}`]:     ['a6d318f1-7ad8-474b-a0d5-dfa24dee1b7a'],

  [`${SEC_G10}|${S_PHYSICS}`]:['1f952f05-f868-4e93-93c2-2a40eef10dca','4d8deaf5-f623-47ef-9704-b58a0da5f9f1'],
  [`${SEC_G10}|${S_CHEM}`]:   ['7b7090ff-40f4-4641-b4c8-3b3f1af4d00d'],
  [`${SEC_G10}|${S_MATH}`]:   ['1a4d84cb-5d6a-4a74-a498-3c36ce4d9e53'],
  [`${SEC_G10}|${S_GEO}`]:    ['e28a88e8-172e-44c6-a899-21ada07f4796','00e9b178-d13f-4abb-bb47-850fb9f33b41'],
  [`${SEC_G10}|${S_HISTORY}`]:['bcd2ee3a-806e-4101-9a76-b58b87495b3e'],
  [`${SEC_G10}|${S_BIO}`]:    ['b384f8d8-0df9-40ce-ae32-f0a06f2075ec'],

  [`${SEC_G11}|${S_PHYSICS}`]:['5a74877b-ed3e-4729-aae3-b8210f4c423a'],
  [`${SEC_G11}|${S_CHEM}`]:   ['62992dc8-767d-4bf1-9316-74f001ddeac0','7ddc1ece-ce12-4208-af11-76e00573a928'],
  [`${SEC_G11}|${S_MATH}`]:   ['e12f4304-b582-488a-b0bc-f0dd98e0056e'],
  [`${SEC_G11}|${S_BIO}`]:    ['2e460226-00a9-4e59-b9cc-dac1485d4cc6','05a574cc-13e8-4ca3-87a5-eb49a6f24f89'],
  [`${SEC_G11}|${S_GEO}`]:    ['35e86939-bb93-48d6-b8ec-c14f69525694'],
  [`${SEC_G11}|${S_ENGLISH}`]:['c7ff140a-4252-4506-bcd0-81d06f83c8ed'],
  [`${SEC_G11}|${S_SINHALA}`]:['e27f52ce-e5de-4bc1-8671-7e2189afe0af'],
};

// Module topic pools per subject
const MODULE_TOPICS = {
  [S_SINHALA]: ['Sinhala Prose','Sinhala Poetry','Sinhala Comprehension','Sinhala Grammar Advanced','Sinhala Creative Writing','Sinhala Composition Review'],
  [S_MATH]:    ['Number Theory','Geometry Basics','Statistics Introduction','Ratio and Proportion','Algebraic Expressions','Probability'],
  [S_SCIENCE]: ['Biology Basics','Physics Basics','Chemistry Fundamentals','Earth Science','Environmental Science','Scientific Investigation'],
  [S_HISTORY]: ['Ancient Sri Lanka','Medieval Kingdoms','Colonial Era','Modern History','World Civilizations','Post-Independence Era'],
  [S_ENGLISH]: ['Grammar Essentials','Spoken English','Writing Skills','Reading Comprehension Advanced','Vocabulary in Context','Essay Writing'],
  [S_ICT]:     ['Computer Basics','Spreadsheets and Databases','Internet Safety','Coding Introduction','Networking Fundamentals','Digital Media'],
  [S_PHYSICS]: ['Motion and Forces','Energy Types','Waves and Sound','Light and Optics','Electricity Basics','Magnetism'],
  [S_GEO]:     ['Map Reading','Climate and Weather','Natural Resources','Population Geography','Sri Lanka Geography','Regional Geography'],
  [S_CHEM]:    ['Elements and Compounds','Chemical Reactions','Acids Bases and Salts','Periodic Table Study','Organic Chemistry Intro','Electrochemistry'],
  [S_BIO]:     ['Cell Structure and Function','Human Body Systems','Photosynthesis and Respiration','Genetics Introduction','Ecology and Ecosystems','Microbiology'],
  [S_MUSIC]:   ['Music Notation','Rhythm and Beat','Classical Music Analysis','Traditional Sri Lankan Songs','Ensemble Techniques','Music History'],
};

const lines = [];
const W = (...args) => args.forEach(a => lines.push(a));

W('USE [haak_]', 'GO', '');
W('-- ====================================================================');
W('-- DUMMY DATA SEED SCRIPT');
W('-- Generated: 2026-02-25');
W('-- NOTE: Run only once. Existing rows are not overwritten.');
W('-- ====================================================================', '');

// ══════════════════════════════════════════════════════════════════
// 1. NEW SECTION – Grade 12
// ══════════════════════════════════════════════════════════════════
const SEC_G12 = g();
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 1. NEW SECTION – Grade 12');
W('-- ────────────────────────────────────────────────────────────────────');
W(`INSERT INTO [dbo].[Sections] ([Id],[Name],[ClusterId],[CreatedBy]) VALUES (N'${SEC_G12}',N'Grade 12',N'${SENIOR_CL}',N'${OPERATOR_ID}')`);
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 2. ADDITIONAL MODULES (top-up to >=3 per subject per module-based section)
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 2. ADDITIONAL MODULES (top-up to >=3 per subject per section)');
W('-- ────────────────────────────────────────────────────────────────────');

// Section common + elective subjects used
const SECTION_COMMON = {
  [SEC_G6]:  [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH],
  [SEC_G7]:  [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ICT],
};
const SECTION_ELECTIVE_POOL = {
  [SEC_G6]:  [S_GEO, S_MUSIC, S_ICT],
  [SEC_G7]:  [S_GEO, S_MUSIC, S_PHYSICS],
};

// Build full module map (section|subject -> [ids])
const allModules = { ...EXISTING_MODULES };

for (const [secId, elecPool] of [[SEC_G6, SECTION_ELECTIVE_POOL[SEC_G6]], [SEC_G7, SECTION_ELECTIVE_POOL[SEC_G7]]]) {
  const allSubjectsForSec = [...new Set([...SECTION_COMMON[secId], ...elecPool])];
  for (const subId of allSubjectsForSec) {
    const key = `${secId}|${subId}`;
    const existing = allModules[key] || [];
    const needed = Math.max(0, 3 - existing.length);
    const topics = MODULE_TOPICS[subId] || ['Module A','Module B','Module C'];
    const newMods = [];
    for (let i = 0; i < needed; i++) {
      const modId = g();
      const topic = topics[(existing.length + i) % topics.length];
      W(`INSERT INTO [dbo].[Modules] ([Id],[Name],[SubjectId],[CreatedBy],[ModuleWeight],[SectionId]) VALUES (N'${modId}',N'${topic}',N'${subId}',N'${OPERATOR_ID}',30,N'${secId}')`);
      newMods.push(modId);
    }
    allModules[key] = [...existing, ...newMods];
  }
}

// Also add modules for Grade 12 (module-based sections need modules if any classes are module type)
// Grade 12 will be SUBJECT_BASE so no modules needed there

W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 3. SUBJECT ↔ CLUSTER mappings (fill gaps)
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 3. SUBJECT ↔ CLUSTER mappings (add missing pairs)');
W('-- ────────────────────────────────────────────────────────────────────');

const subjectClusterInserts = [
  // JUNIOR missing: Physics, Chem, Bio (others already in backup)
  [S_PHYSICS, JUNIOR_CL],[S_CHEM, JUNIOR_CL],[S_BIO, JUNIOR_CL],
  // SENIOR missing: Sinhala, Science, Music, ICT, Geography
  [S_SINHALA, SENIOR_CL],[S_SCIENCE, SENIOR_CL],[S_MUSIC, SENIOR_CL],[S_ICT, SENIOR_CL],[S_GEO, SENIOR_CL],
  // PRIMARY: all subjects
  ...[S_SINHALA,S_MATH,S_SCIENCE,S_HISTORY,S_ENGLISH,S_ICT,S_MUSIC,S_GEO].map(s => [s, PRIMARY_CL]),
];

for (const [sub, cl] of subjectClusterInserts) {
  W(`IF NOT EXISTS (SELECT 1 FROM [dbo].[SubjectClusters] WHERE [SubjectId]=N'${sub}' AND [ClusterId]=N'${cl}') `
    + `INSERT INTO [dbo].[SubjectClusters] ([SubjectId],[ClusterId]) VALUES (N'${sub}',N'${cl}')`);
}
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 4. NEW CLASSES (3 per section, 18 new classes total)
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 4. NEW CLASSES');
W('-- ────────────────────────────────────────────────────────────────────');

// ClassType: 0=SUBJECT_BASE, 1=MODULE_BASE
const classDefinitions = [
  [SEC_G6,  '6A', 1],[SEC_G6,  '6B', 1],[SEC_G6,  '6C', 1],
  [SEC_G7,  '7B', 1],[SEC_G7,  '7C', 1],
  [SEC_G8,  '8B', 0],[SEC_G8,  '8C', 0],
  [SEC_G9,  '9B', 0],[SEC_G9,  '9C', 0],
  [SEC_G10,'10A', 0],[SEC_G10,'10B', 0],[SEC_G10,'10C', 0],
  [SEC_G11,'11A', 0],[SEC_G11,'11B', 0],[SEC_G11,'11C', 0],
  [SEC_G12,'12A', 0],[SEC_G12,'12B', 0],[SEC_G12,'12C', 0],
];

const classIds = {};
for (const [sid, cname, ctype] of classDefinitions) {
  const cid = g();
  classIds[`${sid}|${cname}`] = cid;
  W(`INSERT INTO [dbo].[Classes] ([Id],[Name],[SectionId],[AcademicYear],[CreatedBy],[CreatedAt],[IsDeleted],[ClassType]) `
    + `VALUES (N'${cid}',N'${cname}',N'${sid}',N'2026',N'${OPERATOR_ID}',${DT},0,${ctype})`);
}
W('GO', '');

// All new classes as objects
const ALL_NEW_CLASSES = classDefinitions.map(([sid, cname, ctype]) => ({
  sectionId: sid, name: cname, id: classIds[`${sid}|${cname}`], type: ctype,
}));

// ══════════════════════════════════════════════════════════════════
// 5. NEW TEACHERS (12 additional)
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 5. NEW TEACHERS (Teacher12 – Teacher23)');
W('-- ────────────────────────────────────────────────────────────────────');

const newTeacherIds = [];
const newTeacherUserIds = [];
for (let i = 0; i < 12; i++) {
  const num = 12 + i;
  const uid = g(), tid = g();
  newTeacherUserIds.push(uid);
  newTeacherIds.push(tid);
  W(`INSERT INTO [dbo].[Users] ([Id],[Username],[Email],[PhoneNumber],[Password],[Otp],[RefreshToken],[ValidUntil],[IsActive],[Role],[CreatedAt],[IsDeleted],[IsVerified]) `
    + `VALUES (N'${uid}',N'Teacher${num}',N'teacher${num}@example.com',N'+94712345678',N'${PWD}',NULL,NULL,NULL,1,N'TEACHER',${DT},0,1)`);
  W(`INSERT INTO [dbo].[Teachers] ([Id],[UserId],[Nic],[TeacherId],[CreatedBy],[CreatedAt],[IsDeleted]) `
    + `VALUES (N'${tid}',N'${uid}',NULL,N'TCH-2026-${String(num).padStart(4,'0')}',N'${OPERATOR_ID}',${DT},0)`);
}
W('GO', '');

const ALL_TEACHER_IDS = [...EXISTING_TEACHERS, ...newTeacherIds]; // 23 teachers

// ══════════════════════════════════════════════════════════════════
// 6. TEACHER ↔ SUBJECT assignments
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 6. TEACHER ↔ SUBJECT assignments');
W('-- ────────────────────────────────────────────────────────────────────');

const ALL_SUBJECTS = [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH, S_ICT,
                      S_PHYSICS, S_GEO, S_CHEM, S_BIO, S_MUSIC];
const teacherSubjectMap = {};  // teacherId -> [subjectId, subjectId]

for (let idx = 0; idx < ALL_TEACHER_IDS.length; idx++) {
  const tid = ALL_TEACHER_IDS[idx];
  const s1 = ALL_SUBJECTS[idx % ALL_SUBJECTS.length];
  const s2 = ALL_SUBJECTS[(idx + 1) % ALL_SUBJECTS.length];
  teacherSubjectMap[tid] = [s1, s2];
}

// Insert for new teachers (unconditional)
for (const tid of newTeacherIds) {
  for (const sub of teacherSubjectMap[tid]) {
    W(`INSERT INTO [dbo].[TeacherSubjects] ([TeacherId],[SubjectId],[AssignedAt]) `
      + `VALUES (N'${tid}',N'${sub}',${DT})`);
  }
}
// Insert for existing (conditional)
for (const tid of EXISTING_TEACHERS) {
  for (const sub of teacherSubjectMap[tid]) {
    W(`IF NOT EXISTS (SELECT 1 FROM [dbo].[TeacherSubjects] WHERE [TeacherId]=N'${tid}' AND [SubjectId]=N'${sub}') `
      + `INSERT INTO [dbo].[TeacherSubjects] ([TeacherId],[SubjectId],[AssignedAt]) VALUES (N'${tid}',N'${sub}',${DT})`);
  }
}
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 7. TEACHER ↔ SECTION assignments (>=3 per teacher)
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 7. TEACHER ↔ SECTION assignments');
W('-- ────────────────────────────────────────────────────────────────────');

const ALL_SECTIONS_LIST = [SEC_G6, SEC_G7, SEC_G8, SEC_G9, SEC_G10, SEC_G11, SEC_G12];
const teacherSectionMap = {};

for (let idx = 0; idx < ALL_TEACHER_IDS.length; idx++) {
  const tid = ALL_TEACHER_IDS[idx];
  teacherSectionMap[tid] = [
    ALL_SECTIONS_LIST[idx % ALL_SECTIONS_LIST.length],
    ALL_SECTIONS_LIST[(idx + 1) % ALL_SECTIONS_LIST.length],
    ALL_SECTIONS_LIST[(idx + 2) % ALL_SECTIONS_LIST.length],
  ];
}

for (const tid of newTeacherIds) {
  for (const sec of teacherSectionMap[tid]) {
    W(`INSERT INTO [dbo].[TeacherSections] ([TeacherId],[SectionId],[AssignedAt]) `
      + `VALUES (N'${tid}',N'${sec}',${DT})`);
  }
}
for (const tid of EXISTING_TEACHERS) {
  for (const sec of teacherSectionMap[tid]) {
    W(`IF NOT EXISTS (SELECT 1 FROM [dbo].[TeacherSections] WHERE [TeacherId]=N'${tid}' AND [SectionId]=N'${sec}') `
      + `INSERT INTO [dbo].[TeacherSections] ([TeacherId],[SectionId],[AssignedAt]) VALUES (N'${tid}',N'${sec}',${DT})`);
  }
}
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 8. TIMETABLE entries
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 8. TIMETABLE entries (1 slot per subject per class)');
W('-- ────────────────────────────────────────────────────────────────────');

const TIMESLOTS = [
  '9ac720ba-99a9-4c3c-9422-635fc2365e05',
  '6069e530-3b45-4945-aef8-3164d8ec2d70',
  '74ec400a-2c9a-403e-a8bb-ce412e734957',
  '8cb469a3-0022-4ef4-b49b-d34955f900a3',
  '9390e44a-b84d-4f9f-85c0-83d0ea631511',
  '163af7c7-599d-45c2-a672-b81d977f20e2',
  '26ac7fb8-61e2-46a7-80df-1a884e9875d7',
];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

const SECTION_COMMON_ALL = {
  [SEC_G6]:  [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH],
  [SEC_G7]:  [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ICT],
  [SEC_G8]:  [S_SINHALA, S_MATH, S_SCIENCE, S_ENGLISH, S_ICT],
  [SEC_G9]:  [S_SINHALA, S_MATH, S_HISTORY, S_ENGLISH, S_ICT],
  [SEC_G10]: [S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH, S_ICT],
  [SEC_G11]: [S_SINHALA, S_MATH, S_SCIENCE, S_ENGLISH, S_ICT],
  [SEC_G12]: [S_SINHALA, S_MATH, S_HISTORY, S_ENGLISH, S_ICT],
};

// Track (teacherId|slotId|day) to avoid unique constraint violation
const usedTTS = new Set();

function teacherForSubject(subId, slotId, day) {
  // prefer teacher whose subject list includes subId
  for (const tid of ALL_TEACHER_IDS) {
    if (teacherSubjectMap[tid]?.includes(subId)) {
      const key = `${tid}|${slotId}|${day}`;
      if (!usedTTS.has(key)) return tid;
    }
  }
  // fallback: any free teacher
  for (const tid of ALL_TEACHER_IDS) {
    const key = `${tid}|${slotId}|${day}`;
    if (!usedTTS.has(key)) return tid;
  }
  return ALL_TEACHER_IDS[0];
}

let slotIdx = 0, dayIdx = 0;
for (const cls of ALL_NEW_CLASSES) {
  const common = SECTION_COMMON_ALL[cls.sectionId] || [];
  for (const subId of common) {
    const day  = DAYS[dayIdx++ % 5];
    const slot = TIMESLOTS[slotIdx++ % TIMESLOTS.length];
    const tid  = teacherForSubject(subId, slot, day);
    usedTTS.add(`${tid}|${slot}|${day}`);
    W(`INSERT INTO [dbo].[Timetables] ([Id],[ClassId],[SubjectId],[TeacherId],[TimeSlotId],[DayOfWeek],[IsOptional]) `
      + `VALUES (N'${g()}',N'${cls.id}',N'${subId}',N'${tid}',N'${slot}',N'${day}',0)`);
  }
}
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 9. STUDENTS (20 per new class)
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 9. STUDENTS, StudentGlobals, StudentClasses, StudentSubjectSections');
W('-- ────────────────────────────────────────────────────────────────────');

const FIRST_NAMES = ['Kasun','Nuwan','Dilshan','Ruwan','Tharindu','Isuru','Chathura',
  'Yoshani','Sandali','Dilini','Thilini','Hasini','Sachini','Oshadi',
  'Kavindra','Pasindu','Darshana','Malintha','Supun','Priyantha',
  'Gihan','Saman','Nimal','Sunil','Amal','Kumara','Jayantha','Prasad',
  'Lahiru','Shehan','Buddhika','Madushani','Nadeeka','Chamari','Iresha','Namal'];
const LAST_NAMES = ['Perera','Silva','Fernando','Dissanayake','Jayasinghe','Rajapaksha',
  'Wijesinghe','Gunasekara','Senanayake','Bandara','Wickramasinghe',
  'Rathnayake','Liyanage','Kumara','Herath','Amarasekara','Weerasinghe',
  'Gunawardena','Pathirana','Ekanayake'];
const ADDRESSES = ['Colombo','Galle','Kandy','Matara','Jaffna','Negombo','Kurunegala','Ratnapura'];

const ELECTIVE_SETS = [
  [S_PHYSICS, S_GEO,   S_CHEM],
  [S_PHYSICS, S_CHEM,  S_BIO],
  [S_GEO,     S_CHEM,  S_MUSIC],
  [S_PHYSICS, S_BIO,   S_MUSIC],
  [S_GEO,     S_BIO,   S_MUSIC],
];
const ELECTIVE_SETS_JUNIOR = [
  [S_GEO,     S_MUSIC, S_ICT],
  [S_GEO,     S_MUSIC, S_PHYSICS],
  [S_MUSIC,   S_GEO,   S_ICT],
  [S_PHYSICS, S_MUSIC, S_GEO],
  [S_ICT,     S_GEO,   S_MUSIC],
];

// Collect for marks generation
const allStudentData = [];
let stdSeq = 200;

for (const cls of ALL_NEW_CLASSES) {
  const isJunior = [SEC_G6, SEC_G7].includes(cls.sectionId);
  const commonSubs = SECTION_COMMON_ALL[cls.sectionId] || [];
  const electiveSets = isJunior ? ELECTIVE_SETS_JUNIOR : ELECTIVE_SETS;

  for (let s = 0; s < 20; s++) {
    const uid  = g(), sgId = g(), stId = g();
    const idx  = stdSeq++;
    const first = pick(FIRST_NAMES);
    const last  = pick(LAST_NAMES);
    const email = `student.${idx}@school.lk`;
    const uname = `${first.toLowerCase()}${idx}`;
    const gsc   = `GSC2026${idx.toString(16).toUpperCase().padStart(6,'0')}`;
    const dob   = `201${idx % 9}-${((idx % 12) + 1).toString().padStart(2,'0')}-${((idx % 28) + 1).toString().padStart(2,'0')}`;
    const idxNo = `2026-${idx.toString().padStart(4,'0')}`;
    const phone = `+9477${idx.toString().padStart(7,'0')}`;
    const addr  = pick(ADDRESSES);

    W(`INSERT INTO [dbo].[Users] ([Id],[Username],[Email],[PhoneNumber],[Password],[Otp],[RefreshToken],[ValidUntil],[IsActive],[Role],[CreatedAt],[IsDeleted],[IsVerified]) `
      + `VALUES (N'${uid}',N'${uname}',N'${email}',N'${phone}',N'${PWD}',NULL,NULL,NULL,1,N'STUDENT',${DT},0,1)`);
    W(`INSERT INTO [dbo].[StudentGlobals] ([Id],[UserId],[GlobalStudentCode],[FirstName],[LastName],[Email],[Phone],[DateOfBirth],[CreatedAt],[IsDeleted]) `
      + `VALUES (N'${sgId}',N'${uid}',N'${gsc}',N'${first}',N'${last}',N'${email}',N'${phone}',CAST(N'${dob}T00:00:00.0000000' AS DateTime2),${DT},0)`);
    W(`INSERT INTO [dbo].[Students] ([Id],[StudentGlobalId],[IndexNumber],[Address],[CreatedBy],[CreatedAt],[IsDeleted]) `
      + `VALUES (N'${stId}',N'${sgId}',N'${idxNo}',N'${addr}',N'${OPERATOR_ID}',${DT},0)`);
    W(`INSERT INTO [dbo].[StudentClasses] ([StudentId],[ClassId]) VALUES (N'${stId}',N'${cls.id}')`);

    const electives = electiveSets[s % 5];
    // avoid duplicate subject enrollments (ICT may be in both common and elective for junior)
    const allEnrolled = [...new Set([...commonSubs, ...electives])];

    for (const sub of allEnrolled) {
      W(`INSERT INTO [dbo].[StudentSubjectSections] ([StudentId],[SubjectId],[SectionId],[EnrolledAt]) `
        + `VALUES (N'${stId}',N'${sub}',N'${cls.sectionId}',${DT})`);
    }

    allStudentData.push({ stId, sectionId: cls.sectionId, classId: cls.id, classType: cls.type, commonSubs, electives, allEnrolled });
  }
}
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 10. EXAM MARKS
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 10. EXAM MARKS');
W('--     Subject-based: 2 terms per subject enrolled');
W('--     Module-based : 2 module marks per subject enrolled');
W('-- ────────────────────────────────────────────────────────────────────');

for (const { stId, sectionId, classId, classType, allEnrolled } of allStudentData) {
  if (classType === 0) {
    // SUBJECT-BASED
    for (const sub of allEnrolled) {
      for (const term of ['Term1', 'Term2']) {
        const mark = randInt(38, 98);
        W(`INSERT INTO [dbo].[SubjectExamMarks] ([StudentId],[ClassId],[SubjectId],[TermTest],[Mark]) `
          + `VALUES (N'${stId}',N'${classId}',N'${sub}',N'${term}',${mark})`);
      }
    }
  } else {
    // MODULE-BASED
    for (const sub of allEnrolled) {
      const key = `${sectionId}|${sub}`;
      const mods = allModules[key] || [];
      const pick2 = mods.slice(0, 2);
      for (const modId of pick2) {
        const mark = randInt(35, 95);
        W(`INSERT INTO [dbo].[ModuleExamMarks] ([StudentId],[ModuleId],[Mark]) `
          + `VALUES (N'${stId}',N'${modId}',${mark})`);
      }
    }
  }
}
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 11. TEACHER LEAVE SETTINGS
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 11. TEACHER LEAVE SETTINGS');
W('-- ────────────────────────────────────────────────────────────────────');
W(`IF NOT EXISTS (SELECT 1 FROM [dbo].[TeacherLeaveSettings] WHERE [ActiveYear]=2026) `
  + `INSERT INTO [dbo].[TeacherLeaveSettings] ([Id],[ActiveYear],[IsActive],[EmergencyLeaveLimit],[HalfDayLeaveLimit],[FullDayLeaveLimit]) `
  + `VALUES (N'${g()}',2026,1,3,6,14)`);
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// 12. TEACHER ATTENDANCE (sample – 10 working days)
// ══════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────');
W('-- 12. TEACHER ATTENDANCE (sample – last 10 working days)');
W('-- ────────────────────────────────────────────────────────────────────');

const STATUSES = ['Present','Present','Present','Present','Present','Late','Absent'];
const workDays = [];
let d = new Date('2026-02-09');
while (workDays.length < 10) {
  if (d.getDay() >= 1 && d.getDay() <= 5) workDays.push(d.toISOString().slice(0,10));
  d.setDate(d.getDate() + 1);
}

for (const day of workDays) {
  for (const tid of ALL_TEACHER_IDS.slice(0, 11)) { // use first 11 for brevity
    const status = STATUSES[Math.floor(rand() * STATUSES.length)];
    W(`INSERT INTO [dbo].[TeacherAttendances] ([Id],[TeacherId],[Date],[Status]) `
      + `VALUES (N'${g()}',N'${tid}',CAST(N'${day}T07:30:00.0000000' AS DateTime2),N'${status}')`);
  }
}
W('GO', '');

// ══════════════════════════════════════════════════════════════════
// DONE
// ══════════════════════════════════════════════════════════════════
W('-- ====================================================================');
W('-- END OF DUMMY DATA SEED SCRIPT');
W('-- ====================================================================');

// ─── Write file ────────────────────────────────────────────────────────────
const outputPath = path.join(__dirname, 'dummy_data.sql');
writeFileSync(outputPath, lines.join('\n'), 'utf-8');

const inserts = lines.filter(l => l.trim().startsWith('INSERT')).length;
const ifInserts = lines.filter(l => l.trim().startsWith('IF NOT EXISTS')).length;
console.log(`✅  Written: ${outputPath}`);
console.log(`   Lines        : ${lines.length}`);
console.log(`   INSERT stmts : ${inserts}`);
console.log(`   IF NOT EXISTS: ${ifInserts}`);
console.log(`   Total students: ~${(ALL_NEW_CLASSES.length * 20)}`);
console.log(`   Total classes : ${ALL_NEW_CLASSES.length} new + 3 existing = ${ALL_NEW_CLASSES.length + 3}`);
