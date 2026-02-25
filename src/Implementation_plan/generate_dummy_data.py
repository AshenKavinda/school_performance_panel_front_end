"""
Generates dummy_data.sql for the school performance panel database.
Run: python generate_dummy_data.py
"""
import uuid, random, os

random.seed(42)  # reproducible

# ─── EXISTING IDs ────────────────────────────────────────────────────────────
OPERATOR_ID = 'ebf1fc8b-b843-4a1c-988a-08de475af062'
ADMIN_ID    = '58a6f197-3657-4452-4d6f-08de45e500bd'
APP_ADMIN_ID= '2ab26fec-5161-4e30-b704-08de454cea07'

PRIMARY_CL = '48962d03-cd7a-4a66-bc2d-95bc9bb52240'
JUNIOR_CL  = 'ccb40ede-26ae-4cf6-9d45-d2ca00213ae4'
SENIOR_CL  = '5a822b61-755b-4097-a658-d5dd03c3b61d'

SEC_G6  = 'b1b7587b-e843-495e-ac79-9896d0bb11a2'
SEC_G7  = '56865a6e-03a3-4c07-bb76-e54ffa203ef3'
SEC_G8  = 'd18fcdae-d131-4a54-927f-6f9d2642db1c'
SEC_G9  = '86e3d238-9f94-415c-a5ab-603ba4c14c5c'
SEC_G10 = '33916f02-1e9f-4362-9c6c-8f477bdbbb0e'
SEC_G11 = '2c9d55a7-3d89-4387-a635-23a13c9b0a86'

CLS_7A = '1ba35f89-b4fc-49e4-efaa-08de4b75a119'
CLS_8A = '60f92e22-018f-4e65-3cbe-08de4dcf38ef'
CLS_9A = 'ce3145cb-a274-4576-fc5e-08de72b23d6c'

# Subjects
S_SINHALA = '3de624b1-2ff4-4a44-00d8-08de4c2f581f'
S_MATH    = '296d539c-1edf-45c1-a0e9-3c62f558dc30'
S_SCIENCE = 'd29ea662-3442-4993-9151-775457b8ca7d'
S_HISTORY = '5de0aee7-8ec4-4d80-8c2d-c4d6bc0bad31'
S_ENGLISH = 'c6d01707-e178-462c-85cd-fda126ad18af'
S_ICT     = 'ea4c63e5-e61b-4e4f-f8ea-08de4b797c98'
S_PHYSICS = '128116a9-49aa-4388-8385-0a3b4e0eeea3'
S_GEO     = '269d0412-bee4-4a1f-ab39-2f2fd61a753f'
S_CHEM    = 'b2938657-64af-49e9-95e3-412a22147672'
S_BIO     = 'f2608406-97ea-45a5-9b13-6f2f10f21ee2'
S_MUSIC   = 'ea6ac5cc-3cc5-4ac4-8555-e9a4116d34d0'

PWD = '$2a$11$ZAfSYe7LETO/i4roORvkquVl7IIMku6r9vutOK6.TmeAi3LD0y2Y.'

# Existing teacher IDs (11 teachers)
EXISTING_TEACHERS = [
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
]

# Existing modules per section/subject (from backup)
EXISTING_MODULES = {
    # (section_id, subject_id) -> [module_id, ...]
    (SEC_G6, S_MATH):    ['bf97f6c3-db51-43a4-97b1-f77b0098d29a'],
    (SEC_G6, S_ICT):     ['d3be73f6-9373-4c6d-90bd-98bdcd4c07bf'],
    (SEC_G6, S_ENGLISH): ['4cd4fb4d-b60c-4c1c-b08d-399972811d97'],
    (SEC_G6, S_SCIENCE): ['7efb71c3-3170-415f-8107-bc76fbba694c'],
    (SEC_G6, S_SINHALA): ['2aecc0bc-de1b-4d42-b5e5-576b867a6358'],
    (SEC_G6, S_MUSIC):   ['c021f66a-fe98-4fee-9484-19211be4d244'],

    (SEC_G7, S_ICT):     ['9e817c07-66b1-40bc-ab2a-08de4b7bfeec','465ab105-30be-4e50-959e-a54637c97b7f'],
    (SEC_G7, S_MATH):    ['19b2e8dd-3524-4c6a-983d-0da8055a2162'],
    (SEC_G7, S_SCIENCE): ['aaa918fc-c8ff-4814-a8c7-68a8e52ed08e'],
    (SEC_G7, S_ENGLISH): ['b2b12e13-d6d0-45d1-ad98-69513c8a7fca'],
    (SEC_G7, S_SINHALA): ['e61bd22b-5e54-4b35-9f46-b8e91117a2c1'],
    (SEC_G7, S_HISTORY): ['4306fb52-7da1-41a1-9875-dfb6ce035e60'],
    (SEC_G7, S_MUSIC):   ['5ad05bfb-296d-4895-ad4c-c013e12b633f'],

    (SEC_G8, S_MATH):    ['e78da54d-7b24-45ab-b690-989e0a394b5f'],
    (SEC_G8, S_ICT):     ['86d70560-261a-4a9d-bef9-708d2efd1dd8'],
    (SEC_G8, S_GEO):     ['ed8a1454-3b41-4ac6-8518-7d7ceb89dddf'],
    (SEC_G8, S_SCIENCE): ['4122055a-b318-49c6-b2d1-50b5463802bf'],
    (SEC_G8, S_HISTORY): ['d39b33a3-fd4e-49c0-b0fe-aae2e0d5c0f4'],
    (SEC_G8, S_ENGLISH): ['d7c728ca-daa7-4f24-8fe8-e6828372e9c4'],
    (SEC_G8, S_SINHALA): ['4dd5f9ac-0092-447a-8383-c970785268e5'],
    (SEC_G8, S_MUSIC):   ['f3789a33-2536-4d0f-b3da-8bc676c6912b'],

    (SEC_G9, S_MATH):    ['c234c0b5-b83d-4c91-ac8d-6e2f74767a57','1c7885c1-03d6-4bca-9bbc-7e306b33cbfc'],
    (SEC_G9, S_ENGLISH): ['a9e9120c-4d6d-4566-8d3d-0ee13b172666'],
    (SEC_G9, S_SINHALA): ['e27f52ce-e5de-4bc1-8671-7e2189afe0af'],
    (SEC_G9, S_CHEM):    ['b0dec89e-572e-4b3a-aea2-5eca8b3b787d'],
    (SEC_G9, S_BIO):     ['b6e7ab76-8b5e-49e8-aa06-df5b255b3536'],
    (SEC_G9, S_PHYSICS): ['a4ec2661-b339-44fe-be99-f1bdcf0c594a'],
    (SEC_G9, S_HISTORY): ['488177a0-d9b6-4d90-b362-79068085c693'],
    (SEC_G9, S_SCIENCE): ['d5703933-ad22-4c75-9a54-ae1dcdde9a51','bb8ff1e5-9f8c-493b-830f-8a88f6e0037f','d445017e-c4eb-4590-9671-8b208e1d0dbf'],
    (SEC_G9, S_ICT):     ['a6d318f1-7ad8-474b-a0d5-dfa24dee1b7a'],

    (SEC_G10, S_PHYSICS): ['1f952f05-f868-4e93-93c2-2a40eef10dca','4d8deaf5-f623-47ef-9704-b58a0da5f9f1'],
    (SEC_G10, S_CHEM):    ['7b7090ff-40f4-4641-b4c8-3b3f1af4d00d'],
    (SEC_G10, S_MATH):    ['1a4d84cb-5d6a-4a74-a498-3c36ce4d9e53'],
    (SEC_G10, S_GEO):     ['e28a88e8-172e-44c6-a899-21ada07f4796','00e9b178-d13f-4abb-bb47-850fb9f33b41'],
    (SEC_G10, S_HISTORY): ['bcd2ee3a-806e-4101-9a76-b58b87495b3e'],
    (SEC_G10, S_BIO):     ['b384f8d8-0df9-40ce-ae32-f0a06f2075ec'],

    (SEC_G11, S_PHYSICS): ['5a74877b-ed3e-4729-aae3-b8210f4c423a'],
    (SEC_G11, S_CHEM):    ['62992dc8-767d-4bf1-9316-74f001ddeac0','7ddc1ece-ce12-4208-af11-76e00573a928'],
    (SEC_G11, S_MATH):    ['c234c0b5-b83d-4c91-ac8d-6e2f74767a57'],  # shared Advanced Algebra
    (SEC_G11, S_BIO):     ['2e460226-00a9-4e59-b9cc-dac1485d4cc6','05a574cc-13e8-4ca3-87a5-eb49a6f24f89'],
    (SEC_G11, S_GEO):     ['35e86939-bb93-48d6-b8ec-c14f69525694'],
    (SEC_G11, S_ENGLISH): ['c7ff140a-4252-4506-bcd0-81d06f83c8ed'],
    (SEC_G11, S_SINHALA): ['e27f52ce-e5de-4bc1-8671-7e2189afe0af'],
    (SEC_G11, S_MATH):    ['e12f4304-b582-488a-b0bc-f0dd98e0056e'],
}

# ─── HELPERS ─────────────────────────────────────────────────────────────────
def g(): return str(uuid.uuid4())

def insert_user(uid, username, email, phone, role):
    return (f"INSERT INTO [dbo].[Users] ([Id],[Username],[Email],[PhoneNumber],[Password],[Otp],[RefreshToken],[ValidUntil],[IsActive],[Role],[CreatedAt],[IsDeleted],[IsVerified]) "
            f"VALUES (N'{uid}',N'{username}',N'{email}',N'{phone}',N'{PWD}',NULL,NULL,NULL,1,N'{role}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2),0,1)")

FIRST_NAMES = ['Kasun','Nuwan','Dilshan','Ruwan','Tharindu','Isuru','Chathura',
               'Yoshani','Sandali','Dilini','Thilini','Hasini','Sachini','Oshadi',
               'Kavindra','Pasindu','Darshana','Malintha','Supun','Priyantha',
               'Gihan','Saman','Nimal','Sunil','Amal','Kumara','Jayantha','Prasad',
               'Lahiru','Shehan','Buddhika','Madushani','Nadeeka','Chamari','Iresha']
LAST_NAMES  = ['Perera','Silva','Fernando','Dissanayake','Jayasinghe','Rajapaksha',
               'Wijesinghe','Gunasekara','Senanayake','Bandara','Wickramasinghe',
               'Rathnayake','Liyanage','Kumara','Herath','Amarasekara','Weerasinghe',
               'Gunawardena','Pathirana','Ekanayake']

def rname(): return random.choice(FIRST_NAMES)+' '+random.choice(LAST_NAMES)
def rmark(lo=40, hi=98): return random.randint(lo, hi)

lines = []
W = lines.append

W('USE [haak_]')
W('GO')
W('')
W('-- ====================================================================')
W('-- DUMMY DATA SEED SCRIPT')
W('-- Generated: 2026-02-25')
W('-- Do NOT run twice (no IF NOT EXISTS guards - data will duplicate)')
W('-- ====================================================================')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1 – NEW GRADE 12 SECTION
# ═══════════════════════════════════════════════════════════════════════════
SEC_G12 = g()
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 1. NEW SECTION – Grade 12')
W('-- ────────────────────────────────────────────────────────────────────')
W(f"INSERT INTO [dbo].[Sections] ([Id],[Name],[ClusterId],[CreatedBy]) VALUES (N'{SEC_G12}',N'Grade 12',N'{SENIOR_CL}',N'{OPERATOR_ID}')")
W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 2 – ADDITIONAL MODULES (3 per subject per section for module-based)
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 2. ADDITIONAL MODULES (ensure >=3 per subject per module-based section)')
W('-- ────────────────────────────────────────────────────────────────────')

# module-based sections: G6, G7
# We need at least 3 modules per subject per section
# For each (section, subject) combo the students will need, top-up to 3
ALL_SECTIONS = [SEC_G6, SEC_G7]
# the 5 common subjects differ per section (see below); but for modules, add for
# all subjects that will be enrolled per section

# common/elective subjects needed per section (for module-based)
SECTION_COMMON = {
    SEC_G6: [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH],
    SEC_G7: [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ICT],
}
ELECTIVE_POOL = [S_PHYSICS, S_GEO, S_CHEM, S_BIO, S_MUSIC]
# For grade 6 & 7 (junior), realistic electives: Geography, Music only for junior
SECTION_ELECTIVE_POOL = {
    SEC_G6: [S_GEO, S_MUSIC, S_ICT],     # junior-friendly electives
    SEC_G7: [S_GEO, S_MUSIC, S_PHYSICS], # slightly more advanced
}

ALL_MODULE_SUBJECTS = {}  # (section, subject) -> list of module IDs (final, >=3)

# subject name map for readability
SNAME = {
    S_SINHALA:'Sinhala', S_MATH:'Mathematics', S_SCIENCE:'Science',
    S_HISTORY:'History', S_ENGLISH:'English', S_ICT:'ICT',
    S_PHYSICS:'Physics', S_GEO:'Geography', S_CHEM:'Chemistry',
    S_BIO:'Biology', S_MUSIC:'Music',
}
MODULE_TOPICS = {
    S_SINHALA: ['Sinhala Prose','Sinhala Poetry','Sinhala Comprehension','Sinhala Grammar Advanced','Sinhala Creative Writing'],
    S_MATH:    ['Number Theory','Geometry Basics','Statistics Intro','Ratio and Proportion','Problem Solving',],
    S_SCIENCE: ['Biology Basics','Physics Basics','Chemistry Basics','Earth Science','Environmental Science'],
    S_HISTORY: ['Ancient Sri Lanka','Medieval Kingdoms','Colonial Era','Modern History','World Civilizations'],
    S_ENGLISH: ['Grammar Essentials','Spoken English','Writing Skills','Reading Skills','Vocabulary Building'],
    S_ICT:     ['Computer Basics','MS Office','Internet Safety','Coding Intro','Networking Basics'],
    S_PHYSICS: ['Motion and Forces','Energy','Waves and Sound','Light and Optics','Electricity Basics'],
    S_GEO:     ['Map Reading','Climate','Natural Resources','Population','Sri Lanka Geography'],
    S_CHEM:    ['Elements and Compounds','Chemical Reactions','Acids and Bases','Periodic Table','Organic Intro'],
    S_BIO:     ['Cell Structure','Human Body Systems','Photosynthesis','Genetics Intro','Ecology'],
    S_MUSIC:   ['Music Notation','Rhythm and Beat','Classical Music','Traditional Songs','Ensemble Playing'],
}

for sec_id in [SEC_G6, SEC_G7]:
    sec_subjects = list(set(SECTION_COMMON[sec_id] + SECTION_ELECTIVE_POOL[sec_id]))
    for sub_id in sec_subjects:
        key = (sec_id, sub_id)
        existing = EXISTING_MODULES.get(key, [])
        needed = max(0, 3 - len(existing))
        topics = MODULE_TOPICS.get(sub_id, ['Module A','Module B','Module C','Module D','Module E'])
        # pick topic names not yet used (simple index approach)
        used_count = len(existing)
        new_mods = []
        for i in range(needed):
            mod_id = g()
            topic = topics[(used_count + i) % len(topics)]
            W(f"INSERT INTO [dbo].[Modules] ([Id],[Name],[SubjectId],[CreatedBy],[ModuleWeight],[SectionId]) VALUES (N'{mod_id}',N'{topic}',N'{sub_id}',N'{OPERATOR_ID}',30,N'{sec_id}')")
            new_mods.append(mod_id)
        ALL_MODULE_SUBJECTS[key] = existing + new_mods

# Fill ALL_MODULE_SUBJECTS for existing data (sections that already have enough)
for key, mids in EXISTING_MODULES.items():
    if key not in ALL_MODULE_SUBJECTS:
        ALL_MODULE_SUBJECTS[key] = mids

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 3 – SUBJECT → CLUSTER mappings
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 3. SUBJECT ↔ CLUSTER mappings (fill gaps)')
W('-- ────────────────────────────────────────────────────────────────────')
# existing SubjectClusters:
# JUNIOR: Art,Geography,Math,Science,History,Music,English,Sinhala,ICT
# SENIOR: Physics,Math,Chemistry,Biology,History,English
# Missing for JUNIOR: Physics, Chemistry, Biology, ICT (ICT already there actually)
# Missing for SENIOR: Sinhala, Science, Music, ICT, Geography
# Missing for PRIMARY: all subjects
# We need junior to also have Physics,Chem,Bio (for electives that teachers teach)
# We need Senior to also have Sinhala, Science, Music, ICT, Geography

junior_missing = [S_PHYSICS, S_CHEM, S_BIO]
senior_missing = [S_SINHALA, S_SCIENCE, S_MUSIC, S_ICT, S_GEO]
primary_all    = [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH, S_ICT, S_MUSIC]

for sub in junior_missing:
    W(f"INSERT INTO [dbo].[SubjectClusters] ([SubjectId],[ClusterId]) VALUES (N'{sub}',N'{JUNIOR_CL}')")
for sub in senior_missing:
    W(f"INSERT INTO [dbo].[SubjectClusters] ([SubjectId],[ClusterId]) VALUES (N'{sub}',N'{SENIOR_CL}')")
for sub in primary_all:
    W(f"INSERT INTO [dbo].[SubjectClusters] ([SubjectId],[ClusterId]) VALUES (N'{sub}',N'{PRIMARY_CL}')")

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 4 – CLASSES
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 4. NEW CLASSES (3 per section)')
W('-- ────────────────────────────────────────────────────────────────────')

class_defs = [
    (SEC_G6,  '6A', 1),(SEC_G6,  '6B', 1),(SEC_G6,  '6C', 1),
    (SEC_G7,  '7B', 1),(SEC_G7,  '7C', 1),
    (SEC_G8,  '8B', 0),(SEC_G8,  '8C', 0),
    (SEC_G9,  '9B', 0),(SEC_G9,  '9C', 0),
    (SEC_G10,'10A', 0),(SEC_G10,'10B', 0),(SEC_G10,'10C', 0),
    (SEC_G11,'11A', 0),(SEC_G11,'11B', 0),(SEC_G11,'11C', 0),
    (SEC_G12,'12A', 0),(SEC_G12,'12B', 0),(SEC_G12,'12C', 0),
]
class_ids = {}
for (sid, cname, ctype) in class_defs:
    cid = g()
    class_ids[(sid, cname)] = cid
    W(f"INSERT INTO [dbo].[Classes] ([Id],[Name],[SectionId],[AcademicYear],[CreatedBy],[CreatedAt],[IsDeleted],[ClassType]) "
      f"VALUES (N'{cid}',N'{cname}',N'{sid}',N'2026',N'{OPERATOR_ID}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2),0,{ctype})")

W('GO')
W('')

# All classes (new only – existing 7A/8A/9A have no new students to add)
# structure: (section_id, class_name, class_id, class_type)
ALL_NEW_CLASSES = [
    (SEC_G6,  '6A', class_ids[(SEC_G6,  '6A')], 1),
    (SEC_G6,  '6B', class_ids[(SEC_G6,  '6B')], 1),
    (SEC_G6,  '6C', class_ids[(SEC_G6,  '6C')], 1),
    (SEC_G7,  '7B', class_ids[(SEC_G7,  '7B')], 1),
    (SEC_G7,  '7C', class_ids[(SEC_G7,  '7C')], 1),
    (SEC_G8,  '8B', class_ids[(SEC_G8,  '8B')], 0),
    (SEC_G8,  '8C', class_ids[(SEC_G8,  '8C')], 0),
    (SEC_G9,  '9B', class_ids[(SEC_G9,  '9B')], 0),
    (SEC_G9,  '9C', class_ids[(SEC_G9,  '9C')], 0),
    (SEC_G10,'10A', class_ids[(SEC_G10,'10A')],  0),
    (SEC_G10,'10B', class_ids[(SEC_G10,'10B')],  0),
    (SEC_G10,'10C', class_ids[(SEC_G10,'10C')],  0),
    (SEC_G11,'11A', class_ids[(SEC_G11,'11A')],  0),
    (SEC_G11,'11B', class_ids[(SEC_G11,'11B')],  0),
    (SEC_G11,'11C', class_ids[(SEC_G11,'11C')],  0),
    (SEC_G12,'12A', class_ids[(SEC_G12,'12A')],  0),
    (SEC_G12,'12B', class_ids[(SEC_G12,'12B')],  0),
    (SEC_G12,'12C', class_ids[(SEC_G12,'12C')],  0),
]

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 5 – NEW TEACHERS (12 additional, for total ~23)
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 5. NEW TEACHERS')
W('-- ────────────────────────────────────────────────────────────────────')

new_teacher_user_ids = []
new_teacher_ids = []
TEACHERS_START_NUM = 12  # existing go up to Teacher11

for i in range(12):
    num = TEACHERS_START_NUM + i + 1
    usr_id = g()
    tch_id = g()
    new_teacher_user_ids.append(usr_id)
    new_teacher_ids.append(tch_id)
    uname  = f"Teacher{num}"
    email  = f"teacher{num}@example.com"
    tcode  = f"TCH-2026-{num:04d}"
    W(insert_user(usr_id, uname, email, '+94712345678', 'TEACHER'))
    W(f"INSERT INTO [dbo].[Teachers] ([Id],[UserId],[Nic],[TeacherId],[CreatedBy],[CreatedAt],[IsDeleted]) "
      f"VALUES (N'{tch_id}',N'{usr_id}',NULL,N'{tcode}',N'{OPERATOR_ID}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2),0)")

ALL_TEACHER_IDS = EXISTING_TEACHERS + new_teacher_ids  # 23 total

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 6 – TEACHER → SUBJECT assignments
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 6. TEACHER ↔ SUBJECT assignments')
W('-- ────────────────────────────────────────────────────────────────────')

ALL_SUBJECTS = [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH, S_ICT,
                S_PHYSICS, S_GEO, S_CHEM, S_BIO, S_MUSIC]
# Assign 1-2 subjects per teacher deterministically
teacher_subject_map = {}  # teacher_id -> [subject_ids]
for idx, tid in enumerate(ALL_TEACHER_IDS):
    s1 = ALL_SUBJECTS[idx % len(ALL_SUBJECTS)]
    s2 = ALL_SUBJECTS[(idx + 1) % len(ALL_SUBJECTS)]
    teacher_subject_map[tid] = [s1, s2]

# Existing TeacherSubjects may exist for existing teachers, skip those
EXISTING_TEACHER_SUBJECT_PAIRS = set()  # we don't know exact existing ones, so add ALL for new teachers only
for tid in new_teacher_ids:
    for sub in teacher_subject_map[tid]:
        W(f"INSERT INTO [dbo].[TeacherSubjects] ([TeacherId],[SubjectId],[AssignedAt]) "
          f"VALUES (N'{tid}',N'{sub}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2))")

# Also assign existing teachers that may be missing subjects (safe: use IF NOT EXISTS pattern)
for tid in EXISTING_TEACHERS:
    for sub in teacher_subject_map[tid]:
        W(f"IF NOT EXISTS (SELECT 1 FROM [dbo].[TeacherSubjects] WHERE [TeacherId]=N'{tid}' AND [SubjectId]=N'{sub}') "
          f"INSERT INTO [dbo].[TeacherSubjects] ([TeacherId],[SubjectId],[AssignedAt]) VALUES (N'{tid}',N'{sub}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2))")

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 7 – TEACHER → SECTION assignments (at least 3 sections each)
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 7. TEACHER ↔ SECTION assignments (>=3 per teacher)')
W('-- ────────────────────────────────────────────────────────────────────')

ALL_SECTIONS_LIST = [SEC_G6, SEC_G7, SEC_G8, SEC_G9, SEC_G10, SEC_G11, SEC_G12]
teacher_section_map = {}
for idx, tid in enumerate(ALL_TEACHER_IDS):
    # assign 3 sections rotating
    secs = [
        ALL_SECTIONS_LIST[idx % len(ALL_SECTIONS_LIST)],
        ALL_SECTIONS_LIST[(idx+1) % len(ALL_SECTIONS_LIST)],
        ALL_SECTIONS_LIST[(idx+2) % len(ALL_SECTIONS_LIST)],
    ]
    teacher_section_map[tid] = secs

for tid in new_teacher_ids:
    for sec in teacher_section_map[tid]:
        W(f"INSERT INTO [dbo].[TeacherSections] ([TeacherId],[SectionId],[AssignedAt]) "
          f"VALUES (N'{tid}',N'{sec}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2))")

for tid in EXISTING_TEACHERS:
    for sec in teacher_section_map[tid]:
        W(f"IF NOT EXISTS (SELECT 1 FROM [dbo].[TeacherSections] WHERE [TeacherId]=N'{tid}' AND [SectionId]=N'{sec}') "
          f"INSERT INTO [dbo].[TeacherSections] ([TeacherId],[SectionId],[AssignedAt]) VALUES (N'{tid}',N'{sec}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2))")

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 8 – TIMETABLE entries
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 8. TIMETABLE entries')
W('-- ────────────────────────────────────────────────────────────────────')

# TimeSlots existing:
TIMESLOTS = [
    '9ac720ba-99a9-4c3c-9422-635fc2365e05',  # 07:40-08:30
    '6069e530-3b45-4945-aef8-3164d8ec2d70',  # 08:30-09:20
    '74ec400a-2c9a-403e-a8bb-ce412e734957',  # 09:20-10:10
    '8cb469a3-0022-4ef4-b49b-d34955f900a3',  # 10:30-11:20
    '9390e44a-b84d-4f9f-85c0-83d0ea631511',  # 11:20-12:10
    '163af7c7-599d-45c2-a672-b81d977f20e2',  # 12:20-13:10
    '26ac7fb8-61e2-46a7-80df-1a884e9875d7',  # 13:10-14:00
]
DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']

# Section common subjects
SECTION_COMMON_ALL = {
    SEC_G6:  [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH],
    SEC_G7:  [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ICT],
    SEC_G8:  [S_SINHALA, S_MATH, S_SCIENCE, S_ENGLISH, S_ICT],
    SEC_G9:  [S_SINHALA, S_MATH, S_HISTORY, S_ENGLISH, S_ICT],
    SEC_G10: [S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH, S_ICT],
    SEC_G11: [S_SINHALA, S_MATH, S_SCIENCE, S_ENGLISH, S_ICT],
    SEC_G12: [S_SINHALA, S_MATH, S_HISTORY, S_ENGLISH, S_ICT],
}

# For timetable: one entry per (class, subject, day/slot) using IsOptional=0 for common, 1 for elective
# We create 1 timetable slot per subject per class (one day assignment)
# (TeacherId, TimeSlotId, DayOfWeek) must be unique – manage teacher availability

# track used (teacher, slot, day) combos
used_tts = set()

# get a teacher for a subject
def teacher_for_subject(sub_id, avoid_tts, slot_id, day):
    for tid in ALL_TEACHER_IDS:
        if sub_id in teacher_subject_map.get(tid, []):
            key = (tid, slot_id, day)
            if key not in avoid_tts:
                return tid
    # fallback: any teacher not in avoid_tts for that slot/day
    for tid in ALL_TEACHER_IDS:
        key = (tid, slot_id, day)
        if key not in avoid_tts:
            return tid
    return ALL_TEACHER_IDS[0]

day_idx = 0
slot_idx = 0
for (sec_id, cname, cid, ctype) in ALL_NEW_CLASSES:
    common_subs = SECTION_COMMON_ALL.get(sec_id, [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH])
    for subj in common_subs:
        day = DAYS[day_idx % 5]
        slot = TIMESLOTS[slot_idx % len(TIMESLOTS)]
        tid = teacher_for_subject(subj, used_tts, slot, day)
        used_tts.add((tid, slot, day))
        tt_id = g()
        W(f"INSERT INTO [dbo].[Timetables] ([Id],[ClassId],[SubjectId],[TeacherId],[TimeSlotId],[DayOfWeek],[IsOptional]) "
          f"VALUES (N'{tt_id}',N'{cid}',N'{subj}',N'{tid}',N'{slot}',N'{day}',0)")
        slot_idx += 1
        day_idx += 1

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 9 – STUDENTS  (20 per new class)
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 9. STUDENTS – Users, StudentGlobals, Students (20 per new class)')
W('-- ────────────────────────────────────────────────────────────────────')

# elective sets rotating per student
ELECTIVE_SETS = [
    [S_PHYSICS, S_GEO, S_CHEM],
    [S_PHYSICS, S_CHEM, S_BIO],
    [S_GEO,     S_CHEM, S_MUSIC],
    [S_PHYSICS, S_BIO,  S_MUSIC],
    [S_GEO,     S_BIO,  S_MUSIC],
]
ELECTIVE_SETS_JUNIOR = [
    [S_GEO,     S_MUSIC, S_ICT],
    [S_GEO,     S_MUSIC, S_PHYSICS],
    [S_MUSIC,   S_GEO,   S_ICT],
    [S_PHYSICS, S_MUSIC, S_GEO],
    [S_ICT,     S_GEO,   S_MUSIC],
]

# Collect all students for mark generation
# structure: (student_id, section_id, class_id, class_type, common_subjects, elective_subjects)
all_student_data = []

std_seq = 100  # starting index number
for cls_idx, (sec_id, cname, cid, ctype) in enumerate(ALL_NEW_CLASSES):
    common_subs = SECTION_COMMON_ALL.get(sec_id, [S_SINHALA, S_MATH, S_SCIENCE, S_HISTORY, S_ENGLISH])
    is_junior = sec_id in [SEC_G6, SEC_G7]

    for s_num in range(20):
        uid   = g()
        sg_id = g()
        st_id = g()
        idx   = std_seq
        std_seq += 1

        first = random.choice(FIRST_NAMES)
        last  = random.choice(LAST_NAMES)
        email = f"student.{idx}@school.lk"
        uname = f"{first.lower()}{idx}"
        gsc   = f"GSC2026{idx:04X}"
        dob   = f"201{(idx%8)+0}-{(idx%12)+1:02d}-{(idx%28)+1:02d}"
        index_no = f"2026-{idx:04d}"
        phone = f"+9477{idx:07d}"

        W(insert_user(uid, uname, email, phone, 'STUDENT'))
        W(f"INSERT INTO [dbo].[StudentGlobals] ([Id],[UserId],[GlobalStudentCode],[FirstName],[LastName],[Email],[Phone],[DateOfBirth],[CreatedAt],[IsDeleted]) "
          f"VALUES (N'{sg_id}',N'{uid}',N'{gsc}',N'{first}',N'{last}',N'{email}',N'{phone}',CAST(N'{dob}T00:00:00.0000000' AS DateTime2),CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2),0)")
        W(f"INSERT INTO [dbo].[Students] ([Id],[StudentGlobalId],[IndexNumber],[Address],[CreatedBy],[CreatedAt],[IsDeleted]) "
          f"VALUES (N'{st_id}',N'{sg_id}',N'{index_no}',N'Colombo',N'{OPERATOR_ID}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2),0)")
        W(f"INSERT INTO [dbo].[StudentClasses] ([StudentId],[ClassId]) VALUES (N'{st_id}',N'{cid}')")

        # elective assignment
        eset = (ELECTIVE_SETS_JUNIOR if is_junior else ELECTIVE_SETS)[s_num % 5]

        # StudentSubjectSections – common
        for sub in common_subs:
            W(f"INSERT INTO [dbo].[StudentSubjectSections] ([StudentId],[SubjectId],[SectionId],[EnrolledAt]) "
              f"VALUES (N'{st_id}',N'{sub}',N'{sec_id}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2))")
        # StudentSubjectSections – elective
        for sub in eset:
            W(f"INSERT INTO [dbo].[StudentSubjectSections] ([StudentId],[SubjectId],[SectionId],[EnrolledAt]) "
              f"VALUES (N'{st_id}',N'{sub}',N'{sec_id}',CAST(N'2026-02-25T00:00:00.0000000' AS DateTime2))")

        all_enrolled = list(common_subs) + list(eset)
        all_student_data.append((st_id, sec_id, cid, ctype, common_subs, eset, all_enrolled))

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 10 – MARKS
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 10. EXAM MARKS')
W('-- ────────────────────────────────────────────────────────────────────')

for (st_id, sec_id, cid, ctype, common_subs, eset, all_enrolled) in all_student_data:
    if ctype == 0:
        # SUBJECT-BASED: 2 terms per subject
        for sub in all_enrolled:
            for term in ['Term1', 'Term2']:
                mark = rmark(38, 98)
                W(f"INSERT INTO [dbo].[SubjectExamMarks] ([StudentId],[ClassId],[SubjectId],[TermTest],[Mark]) "
                  f"VALUES (N'{st_id}',N'{cid}',N'{sub}',N'{term}',{mark})")
    else:
        # MODULE-BASED: 2 modules per subject enrolled
        for sub in all_enrolled:
            key = (sec_id, sub)
            mods = ALL_MODULE_SUBJECTS.get(key, [])
            # pick 2 modules (or however many exist, min 2)
            if len(mods) == 0:
                continue
            pick = mods[:2] if len(mods) >= 2 else mods
            for mod_id in pick:
                mark = rmark(35, 95)
                W(f"INSERT INTO [dbo].[ModuleExamMarks] ([StudentId],[ModuleId],[Mark]) "
                  f"VALUES (N'{st_id}',N'{mod_id}',{mark})")

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 11 – TEACHER ATTENDANCE (sample)
# ═══════════════════════════════════════════════════════════════════════════
W('-- ────────────────────────────────────────────────────────────────────')
W('-- 11. TEACHER ATTENDANCE (sample – last 2 weeks)')
W('-- ────────────────────────────────────────────────────────────────────')

STATUSES = ['Present','Present','Present','Present','Present','Late','Absent']
import datetime
base_date = datetime.date(2026, 2, 9)
for i in range(14):
    d = base_date + datetime.timedelta(days=i)
    if d.weekday() < 5:  # Mon-Fri
        for tid in ALL_TEACHER_IDS:
            att_id = g()
            status = random.choice(STATUSES)
            W(f"INSERT INTO [dbo].[TeacherAttendances] ([Id],[TeacherId],[Date],[Status]) "
              f"VALUES (N'{att_id}',N'{tid}',CAST(N'{d.isoformat()}T07:30:00.0000000' AS DateTime2),N'{status}')")

W('GO')
W('')

# ═══════════════════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════════════════
W('-- ====================================================================')
W('-- END OF DUMMY DATA SEED SCRIPT')
W('-- ====================================================================')

# Write output
out_path = os.path.join(os.path.dirname(__file__), 'dummy_data.sql')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"Written {len(lines)} lines to {out_path}")
total_inserts = sum(1 for l in lines if l.strip().startswith('INSERT'))
print(f"Total INSERT statements: {total_inserts}")
