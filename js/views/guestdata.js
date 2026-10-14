/* Guest-mode sample data. Raw payloads mirror the real API shapes and are run
   through the same parser so guest mode behaves identically to a real login. */
import * as G from '../grades.js';

const toDate = (mmddyyyy) => {
  const [m, d, y] = mmddyyyy.split('/').map(Number);
  return new Date(y, m - 1, d);
};

function assignment(measure, type, due, earned, possible, opts = {}) {
  return {
    measure,
    type,
    date: due, dueDate: due,
    score: earned != null ? String(earned) : null,
    displayScore: earned != null ? `${earned} out of ${possible}` : 'Not Due',
    scoreCalValue: earned,
    scoreMaxValue: earned != null ? possible : null,
    scoreType: 'Raw Score',
    points: earned != null ? `${earned} / ${possible}` : `${possible} Points Possible`,
    point: earned,
    pointPossible: earned != null ? possible : null,
    notes: opts.notes || '',
    measureDescription: opts.description || '',
    gradebookID: Math.floor(Math.random() * 1e8),
  };
}

function rawGradebook() {
  const cats = (aw, pw) => ([
    { type: 'All Tasks / Assessments', weight: `${aw}%`, points: '0', pointsPossible: '0', weightedPct: '0%', calculatedMark: '' },
    { type: 'Practice / Preparation', weight: `${pw}%`, points: '0', pointsPossible: '0', weightedPct: '0%', calculatedMark: '' },
    { type: 'TOTAL', weight: '100%', points: '0', pointsPossible: '0', weightedPct: '0%', calculatedMark: '' },
  ]);
  const course = (period, title, courseID, staff, email, assignments, mark = 'MP1') => ({
    period, title, courseName: title.replace(/\s*\(.*\)$/, ''), courseID,
    room: 'B' + (100 + period * 7), staff, staffEMail: email, marks: [{
      markName: mark,
      calculatedScoreString: '', calculatedScoreRaw: '0',
      gradeCalculationSummary: cats(90, 10),
      assignments,
    }],
  });

  return {
    reportingPeriods: [
      { index: '0', gradePeriod: 'MP1 Interim', startDate: '8/25/2026', endDate: '10/2/2026' },
      { index: '1', gradePeriod: 'MP1', startDate: '8/25/2026', endDate: '10/30/2026' },
      { index: '2', gradePeriod: 'MP2 Interim', startDate: '10/5/2026', endDate: '12/10/2026' },
      { index: '3', gradePeriod: 'MP2', startDate: '11/4/2026', endDate: '1/22/2027' },
      { index: '4', gradePeriod: 'MP3 Interim', startDate: '12/11/2026', endDate: '2/26/2027' },
      { index: '5', gradePeriod: 'MP3', startDate: '1/26/2027', endDate: '4/16/2027' },
      { index: '6', gradePeriod: 'MP4 Interim', startDate: '3/1/2027', endDate: '5/14/2027' },
      { index: '7', gradePeriod: 'MP4', startDate: '4/19/2027', endDate: '6/18/2027' },
    ],
    reportingPeriod: { index: '1', gradePeriod: 'MP1', startDate: '8/25/2026', endDate: '10/30/2026' },
    courses: [
      course(1, 'Investigations in Life Science (SCI1023)', 'SCI1023', 'Dana Flores', 'Dana_Flores@example.org', [
        assignment('FA: Cell Quiz — Application (R)', 'All Tasks / Assessments', '10/9/2026', 15, 15),
        assignment('FA: Cell Quiz — Vocabulary/Recall (R)', 'All Tasks / Assessments', '10/9/2026', 12, 13),
        assignment('FA: Microscope Lab', 'All Tasks / Assessments', '10/1/2026', 24, 25),
        assignment('HW: Cell Organelles Chart', 'Practice / Preparation', '9/28/2026', 5, 5),
        assignment('FA: Unit 1 Test — Cells (R)', 'All Tasks / Assessments', '10/16/2026', null, 40),
        assignment('HW: Microscope Review', 'Practice / Preparation', '10/15/2026', null, 5),
      ]),
      course(2, 'Historical Inquiry Global Hum 7 (SOC1010)', 'SOC1010', 'Marcus Chen', 'Marcus_Chen@example.org', [
        assignment('FA: Empires Research Project', 'All Tasks / Assessments', '10/6/2026', 48, 50),
        assignment('FA: Map Skills Check', 'All Tasks / Assessments', '9/30/2026', 18, 20),
        assignment('HW: Current Events Log', 'Practice / Preparation', '9/25/2026', 9, 10),
        assignment('FA: Silk Road DBQ (R)', 'All Tasks / Assessments', '10/20/2026', null, 35),
      ]),
      course(3, 'Algebra 1A (MAT2000A)', 'MAT2000A', 'Priya Natarajan', 'Priya_Natarajan@example.org', [
        assignment('FA: Quiz 3 — Solving Equations (R)', 'All Tasks / Assessments', '10/8/2026', 19, 20),
        assignment('FA: Quiz 2 — Variables', 'All Tasks / Assessments', '9/24/2026', 16, 20),
        assignment('HW: Practice Set A1.2.16', 'Practice / Preparation', '10/13/2026', null, 5),
        assignment('HW: Practice Set A1.2.15', 'Practice / Preparation', '10/11/2026', 5, 5),
        assignment('FA: Unit 2 Test — Linear Equations (R)', 'All Tasks / Assessments', '10/22/2026', null, 45),
      ]),
      course(4, 'MS FY Spanish 1B (WLG1005B)', 'WLG1005B', 'Sofia Ramos', 'Sofia_Ramos@example.org', [
        assignment('FA: Vocabulary Quiz — La Familia', 'All Tasks / Assessments', '10/7/2026', 14, 15),
        assignment('FA: Skit Presentation', 'All Tasks / Assessments', '9/29/2026', 26, 30),
        assignment('HW: Duolingo Log', 'Practice / Preparation', '10/10/2026', 10, 10),
      ]),
      course(5, 'Grade 7 Adv English (ENG1012)', 'ENG1012', 'Jordan Ellis', 'Jordan_Ellis@example.org', [
        assignment('FA: Personal Narrative Draft (R)', 'All Tasks / Assessments', '10/2/2026', 42, 45),
        assignment('FA: Reading Comprehension Quiz', 'All Tasks / Assessments', '9/22/2026', 13, 15),
        assignment('HW: Independent Reading Log', 'Practice / Preparation', '10/12/2026', 8, 10),
        assignment('FA: Socratic Seminar (R)', 'All Tasks / Assessments', '10/19/2026', null, 25),
      ]),
      course(6, 'Health Education Gr 7 (HPE1001)', 'HPE1001', 'Alex Kim', 'Alex_Kim@example.org', [
        assignment('FA: Wellness Plan Project', 'All Tasks / Assessments', '10/5/2026', 29, 30),
        assignment('HW: Sleep Journal', 'Practice / Preparation', '9/30/2026', 10, 10),
        assignment('FA: Decision-Making Quiz', 'All Tasks / Assessments', '9/18/2026', 14, 15),
      ]),
      course(7, 'MS Dig Art Photography 2 (ART1019)', 'ART1019', 'Riley Osei', 'Riley_Osei@example.org', [
        assignment('FA: Composition Portfolio', 'All Tasks / Assessments', '10/9/2026', 38, 40),
        assignment('HW: Weekly Photo Challenge', 'Practice / Preparation', '10/13/2026', null, 5),
        assignment('FA: Lighting Study (R)', 'All Tasks / Assessments', '10/17/2026', null, 30),
      ]),
    ],
  };
}

export function GUEST_GRADES() { return G.parseGrades(rawGradebook()); }

export function GUEST_ATTENDANCE() {
  return {
    periodInfos: [{ period: 3, name: 'Excused Absence', total: { Excused: 1 } }],
    absences: [
      { date: '9/15/2026', periods: [{ period: 3, name: 'Excused Absence' }] },
      { date: '9/29/2026', periods: [{ period: 5, name: 'Tardy' }] },
      { date: '10/6/2026', periods: [{ period: 2, name: 'Excused Absence' }, { period: 3, name: 'Tardy' }] },
    ],
  };
}

export function GUEST_SCHEDULE() {
  const classes = (period, courseTitle, roomName, teacher, teacherEmail) => ({ period: String(period), courseTitle, roomName, teacher, teacherEmail });
  return {
    termIndex: 0,
    termLists: [
      { termIndex: 0, termName: 'Quarter 1', beginDate: '08/25/2026', endDate: '10/30/2026' },
      { termIndex: 1, termName: 'Quarter 2', beginDate: '11/02/2026', endDate: '01/22/2027' },
      { termIndex: 2, termName: 'Quarter 3', beginDate: '01/26/2027', endDate: '04/16/2027' },
      { termIndex: 3, termName: 'Quarter 4', beginDate: '04/19/2027', endDate: '06/18/2027' },
    ],
    studentClassScheduleForTerms: [
      { thisTermIndex: 0, classLists: [
        classes(0, 'Homeroom', 'B210', 'Sam Avery', 'Sam_Avery@example.org'),
        classes(1, 'Investigations in Life Science', 'B107', 'Dana Flores', 'Dana_Flores@example.org'),
        classes(2, 'Historical Inquiry Global Hum 7', 'B209', 'Marcus Chen', 'Marcus_Chen@example.org'),
        classes(3, 'Algebra 1A', 'C103', 'Priya Natarajan', 'Priya_Natarajan@example.org'),
        classes(4, 'MS FY Spanish 1B', 'D100', 'Sofia Ramos', 'Sofia_Ramos@example.org'),
        classes(5, 'Grade 7 Adv English', 'D216', 'Jordan Ellis', 'Jordan_Ellis@example.org'),
        classes(6, 'Health Education Gr 7', 'D121', 'Alex Kim', 'Alex_Kim@example.org'),
        classes(7, 'MS Dig Art Photography 2', 'A118', 'Riley Osei', 'Riley_Osei@example.org'),
      ] },
      { thisTermIndex: 1, classLists: [
        classes(0, 'Homeroom', 'B210', 'Sam Avery', 'Sam_Avery@example.org'),
        classes(1, 'Investigations in Life Science', 'B107', 'Dana Flores', 'Dana_Flores@example.org'),
        classes(2, 'Historical Inquiry Global Hum 7', 'B209', 'Marcus Chen', 'Marcus_Chen@example.org'),
        classes(3, 'Algebra 1A', 'C103', 'Priya Natarajan', 'Priya_Natarajan@example.org'),
        classes(4, 'MS FY Spanish 1B', 'D100', 'Sofia Ramos', 'Sofia_Ramos@example.org'),
        classes(5, 'Grade 7 Adv English', 'D216', 'Jordan Ellis', 'Jordan_Ellis@example.org'),
        classes(6, 'PE / Health Rotation', 'GYM', 'Alex Kim', 'Alex_Kim@example.org'),
        classes(7, 'MS Dig Art Photography 2', 'A118', 'Riley Osei', 'Riley_Osei@example.org'),
      ] },
      { thisTermIndex: 2, classLists: [
        classes(0, 'Homeroom', 'B210', 'Sam Avery', 'Sam_Avery@example.org'),
        classes(1, 'Investigations in Physical Science', 'B108', 'Dana Flores', 'Dana_Flores@example.org'),
        classes(2, 'Historical Inquiry Global Hum 7', 'B209', 'Marcus Chen', 'Marcus_Chen@example.org'),
        classes(3, 'Algebra 1B', 'C103', 'Priya Natarajan', 'Priya_Natarajan@example.org'),
        classes(4, 'MS FY Spanish 1B', 'D100', 'Sofia Ramos', 'Sofia_Ramos@example.org'),
        classes(5, 'Grade 7 Adv English', 'D216', 'Jordan Ellis', 'Jordan_Ellis@example.org'),
        classes(6, 'Health Education Gr 7', 'D121', 'Alex Kim', 'Alex_Kim@example.org'),
        classes(7, 'MS Dig Art Photography 2', 'A118', 'Riley Osei', 'Riley_Osei@example.org'),
      ] },
      { thisTermIndex: 3, classLists: [
        classes(0, 'Homeroom', 'B210', 'Sam Avery', 'Sam_Avery@example.org'),
        classes(1, 'Investigations in Physical Science', 'B108', 'Dana Flores', 'Dana_Flores@example.org'),
        classes(2, 'Historical Inquiry Global Hum 7', 'B209', 'Marcus Chen', 'Marcus_Chen@example.org'),
        classes(3, 'Algebra 1B', 'C103', 'Priya Natarajan', 'Priya_Natarajan@example.org'),
        classes(4, 'MS FY Spanish 1B', 'D100', 'Sofia Ramos', 'Sofia_Ramos@example.org'),
        classes(5, 'Grade 7 Adv English', 'D216', 'Jordan Ellis', 'Jordan_Ellis@example.org'),
        classes(6, 'PE / Health Rotation', 'GYM', 'Alex Kim', 'Alex_Kim@example.org'),
        classes(7, 'Capstone Art Showcase', 'A118', 'Riley Osei', 'Riley_Osei@example.org'),
      ] },
    ],
  };
}

export function GUEST_DOCUMENTS() {
  return [
    { documentGu: 'sample-1', documentFileName: 'Interim_Progress_Report.pdf', documentDate: '10/02/2026', documentType: 'Interim Progress Report', documentComment: '2026-2027 MP1 Interim' },
    { documentGu: 'sample-2', documentFileName: 'Report_Card.pdf', documentDate: '06/23/2026', documentType: 'Report Card', documentComment: '2025-2026 Semester 2' },
    { documentGu: 'sample-3', documentFileName: 'MCAP_ELA_Assessment.pdf', documentDate: '08/24/2026', documentType: 'MCAP Assessment Report', documentComment: 'English Language Arts' },
  ];
}

export const GUEST_STUDENT_INFO = {
  FormattedName: 'Guest Student',
  PermID: '123456',
  Grade: '7',
  CurrentSchool: 'North Bethesda Middle (sample)',
};
