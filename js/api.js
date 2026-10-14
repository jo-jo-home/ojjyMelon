/* ==========================================================================
   ojjyMelon — StudentVUE API client
   Protocol verified live against md-mcps-psv.edupoint.com (Synergy 2026-MD):
   - JSON mobile API: POST /api/v1/mobile/PXPWebServices/<Method>
     Basic auth at AttemptLogin -> Bearer token for the rest.
     Every call needs the edupointkeyversion header (32-byte base64 constant).
   - SOAP fallback: POST /Service/PXPCommunication.asmx with
     ProcessWebServiceRequestMultiWeb + credentials in envelope + key in Cookie.
   - The server sends no CORS headers, so browser requests go through a
     proxy chain (direct -> user worker -> public proxies).
   ========================================================================== */

const APP_VERSION = '2.0.16';
const USER_AGENT = 'ksoap';
const APP_NAME_HEADER = `StudentVUE|Android|${APP_VERSION}`;

/* ---------- edupointkeyversion ---------- */
const KEY_ENDPOINTS = [
  'https://axum-svue.fly.dev/akey',
  'https://api.allorigins.win/raw?url=https%3A%2F%2Faxum-svue.fly.dev%2Fakey',
];
const KEY_TTL_MS = 12 * 60 * 60 * 1000; // refresh at most twice a day
const LAST_KNOWN_KEY = 'Fws7lq+y7btySqYP52MXIZEjQbNo1EUhdAdwCvic8Ptlsf65icaE//ZYiHvvw8hh';

let keyPromise = null;

function cachedKey() {
  try {
    const raw = localStorage.getItem('ojjymelon.key');
    if (!raw) return null;
    const { value, at, manual } = JSON.parse(raw);
    if (manual) return value; // user-pasted key never expires
    if (value && Date.now() - at < KEY_TTL_MS) return value;
  } catch { /* ignore */ }
  return null;
}

function saveKey(value, manual = false) {
  try { localStorage.setItem('ojjymelon.key', JSON.stringify({ value, at: Date.now(), manual })); } catch { /* ignore */ }
}

export function getStoredKeyInfo() {
  try {
    const raw = localStorage.getItem('ojjymelon.key');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function setManualKey(value) {
  if (!value || value.length < 16) throw new Error('That key looks too short.');
  saveKey(value.trim(), true);
  keyPromise = null;
}

export function clearManualKey() {
  try { localStorage.removeItem('ojjymelon.key'); } catch { /* ignore */ }
  keyPromise = null;
}

async function fetchKeyFromEndpoints() {
  for (const url of KEY_ENDPOINTS) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const text = (await res.text()).trim();
      // sanity: base64-ish, 40-64 chars
      if (/^[A-Za-z0-9+/=]{40,64}$/.test(text)) return text;
    } catch { /* try next */ }
  }
  throw new Error('Could not fetch the edupoint access key. Try again, or paste one in Settings.');
}

export async function getVersionKey() {
  const cached = cachedKey();
  if (cached) return cached;
  if (keyPromise) return keyPromise;
  keyPromise = fetchKeyFromEndpoints().then((k) => { saveKey(k); keyPromise = null; return k; })
    .catch((e) => { keyPromise = null; throw e; });
  try {
    return await keyPromise;
  } catch (e) {
    // last resort: a stale cached value is better than nothing
    try {
      const raw = JSON.parse(localStorage.getItem('ojjymelon.key') || 'null');
      if (raw?.value) return raw.value;
    } catch { /* ignore */ }
    // final fallback: bundled last-known value
    if (LAST_KNOWN_KEY) return LAST_KNOWN_KEY;
    throw e;
  }
}

/* ---------- Proxy chain ---------- */
/* Each proxy is a function (url, init) -> fetch-like call. */
function userWorkerProxy(workerUrl) {
  // Worker contract: GET  <worker>/ping          -> "ok"
  //                  POST <worker>/relay?url=..  -> forwards method/headers/body
  const base = workerUrl.replace(/\/+$/, '');
  return {
    name: 'worker',
    fetch: async (url, init) => {
      const res = await fetch(`${base}/relay?url=${encodeURIComponent(url)}`, {
        method: init.method || 'GET',
        headers: init.headers,
        body: init.body,
      });
      if (res.status === 404 || res.status === 502) throw new ProxyError('worker');
      return res;
    },
  };
}

const publicProxies = [
  {
    name: 'corsproxy.io',
    fetch: async (url, init) => {
      const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`, {
        method: init.method || 'GET',
        headers: init.headers,
        body: init.body,
      });
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) throw new ProxyError('corsproxy.io challenge/error');
      return res;
    },
  },
  {
    name: 'allorigins',
    fetch: async (url, init) => {
      if ((init.method || 'GET') !== 'GET') {
        throw new ProxyError('allorigins supports GET only');
      }
      return fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, init);
    },
  },
];

class ProxyError extends Error {
  constructor(name) { super(`proxy ${name} failed`); this.name = 'ProxyError'; }
}

function getConfiguredWorkerUrl() {
  try { return localStorage.getItem('ojjymelon.worker') || ''; } catch { return ''; }
}
export function setConfiguredWorkerUrl(url) {
  try {
    if (url) localStorage.setItem('ojjymelon.worker', url.replace(/\/+$/, ''));
    else localStorage.removeItem('ojjymelon.worker');
  } catch { /* ignore */ }
}
export function getConfiguredWorker() { return getConfiguredWorkerUrl(); }

let workingProxy = null; // remember what worked to avoid re-probing every call

async function proxiedFetch(url, init = {}) {
  const attempts = [];
  // 1. direct — works for districts that allow CORS (MCPS does not)
  attempts.push({ name: 'direct', fetch: (u, i) => fetch(u, i) });
  // 2. user-configured worker
  const workerUrl = getConfiguredWorkerUrl();
  if (workerUrl) attempts.push(userWorkerProxy(workerUrl));
  // 3. public proxies
  attempts.push(...publicProxies);

  // try the last known-good proxy first
  if (workingProxy) {
    const idx = attempts.findIndex((a) => a.name === workingProxy);
    if (idx > 0) attempts.unshift(...attempts.splice(idx, 1));
  }

  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const res = await attempt.fetch(url, init);
      workingProxy = attempt.name;
      return res;
    } catch (e) {
      if (e instanceof TypeError && attempt.name === 'direct') {
        lastErr = new Error('The district server blocked the direct browser request (CORS) — retrying through a proxy…');
        continue;
      }
      lastErr = e;
    }
  }
  if (workingProxy) workingProxy = null;
  throw lastErr || new Error('No proxy could reach the StudentVUE server.');
}

/* ---------- Client ---------- */
export class StudentVue {
  constructor(districtURL) {
    this.district = (districtURL || 'https://md-mcps-psv.edupoint.com').replace(/\/+$/, '');
    this.token = null;
    this.refresh = null;
    this.username = null;
    this.password = null;
    this.soapMode = false; // set when JSON API unavailable
    // per-session caches (mirrors GradeMelon's client.loaded*)
    this.loadedAttendance = null;
    this.loadedSchedule = new Map();
    this.loadedDocuments = null;
    this.loadedStudentInfo = null;
  }

  /* -- JSON API -- */

  async #json(method, request, auth) {
    const key = await getVersionKey();
    const url = `${this.district}/api/v1/mobile/PXPWebServices/${method}`;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'AppNameOSAndVersion': APP_NAME_HEADER,
      edupointkeyversion: key,
    };
    if (auth === 'basic' && this.username) {
      headers.Authorization = 'Basic ' + btoa(`${this.username}:${this.password}`);
    } else if (this.token) {
      headers.Authorization = 'Bearer ' + this.token;
    }
    const body = method === 'RefreshToken' ? '{}' : JSON.stringify({ arguments: { request: JSON.stringify(request || {}) } });
    const res = await proxiedFetch(url, { method: 'POST', headers, body });
    if (res.status === 401) throw new UnauthorizedError();
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch {
      // Some proxies return HTML error pages as 200 — surface a readable error
      throw new Error('The server/proxy returned an invalid response. Check your district URL or proxy.');
    }
    if (data && data.error) {
      throw new ApiError(data.error.message || 'Unknown API error', data.error.code);
    }
    return data;
  }

  async login(username, password) {
    this.username = String(username).trim();
    this.password = String(password);
    const data = await this.#json('AttemptLogin', { userID: null, password: null, userType: 'Student' }, 'basic');
    if (!data || !data.access_token) throw new Error('Login failed — no token returned.');
    this.token = data.access_token;
    this.refresh = data.refresh_token || null;
    return this;
  }

  async #refreshToken() {
    if (!this.refresh) throw new UnauthorizedError();
    const key = await getVersionKey();
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'AppNameOSAndVersion': APP_NAME_HEADER,
      edupointkeyversion: key,
      Authorization: 'Bearer ' + this.refresh,
    };
    const res = await proxiedFetch(`${this.district}/api/v1/mobile/PXPWebServices/RefreshToken`, {
      method: 'POST', headers, body: '{}',
    });
    if (res.status === 401) throw new UnauthorizedError();
    const data = await res.json();
    if (data?.access_token) {
      this.token = data.access_token;
      this.refresh = data.refresh_token || this.refresh;
      return true;
    }
    throw new UnauthorizedError();
  }

  /* Unified dispatch: JSON first (with token refresh), SOAP fallback on 2100/400.
     Returns the FULL JSON envelope, or the converted SOAP payload (callers unwrap). */
  async #tryJson(method, request, soapFallback) {
    if (this.soapMode) return soapFallback();
    try {
      return await this.#json(method, request);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        try {
          await this.#refreshToken();
          return await this.#json(method, request);
        } catch {
          throw new UnauthorizedError();
        }
      }
      // JSON API not enabled at this district? switch to SOAP mode permanently.
      if (e instanceof ApiError && (e.code === '2100' || e.code === '400')) {
        this.soapMode = true;
        return soapFallback();
      }
      throw e;
    }
  }

  /* -- Public data methods (JSON-shaped results, whether via JSON or SOAP) -- */

  async gradebook(reportPeriod) {
    const req = {
      reportPeriod: reportPeriod != null ? String(reportPeriod) : '',
      concurrentSchOrgYearGU: '',
      childIntID: 0,
      languageCode: 'en',
    };
    const data = await this.#tryJson('Gradebook', req, () => this.#soapGradebook(reportPeriod));
    return this.soapMode ? (data || null) : (data?.data?.traditionalGradebook || null);
  }

  async schedule(termIndex) {
    if (this.loadedSchedule.has(termIndex)) return this.loadedSchedule.get(termIndex);
    const req = {
      childIntID: 0, loadAllTerms: true,
      conSchOrgYearGU: '', conSchTermIndex: '-1', termIndex: termIndex != null ? String(termIndex) : '-1',
    };
    const data = await this.#tryJson('StudentClassList', req, () => this.#soapSchedule(termIndex));
    const schedule = this.soapMode
      ? data
      : (data?.data?.studentClassScheduleForAllTerms || data?.data?.studentClassSchedule || null);
    this.loadedSchedule.set(termIndex, schedule);
    this.loadedSchedule.set(null, schedule);
    return schedule;
  }

  async attendance() {
    if (this.loadedAttendance) return this.loadedAttendance;
    const data = await this.#tryJson('GetStudentAttendanceList', { childIntID: 0 }, () => this.#soapAttendance());
    const att = this.soapMode ? data : (data?.data?.periodAttendance || null);
    this.loadedAttendance = att;
    return att;
  }

  async documents() {
    if (this.loadedDocuments) return this.loadedDocuments;
    const data = await this.#tryJson('GetStudentDocuments', { childIntID: 0, languageCode: 'en' }, () => this.#soapDocuments());
    const docs = this.soapMode ? data : (data?.data?.studentDocuments?.studentDocumentDatas || []);
    this.loadedDocuments = docs;
    return docs;
  }

  async documentContent(documentGU) {
    const data = await this.#tryJson('GetStudentDocumentContent', { childIntID: 0, documentGU }, () => this.#soapDocumentContent(documentGU));
    if (this.soapMode) return data;
    const docDatas = data?.data?.studentAttachedDocumentData?.documentDatas || [];
    return docDatas[0] || null;
  }

  async studentInfo() {
    if (this.loadedStudentInfo) return this.loadedStudentInfo;
    const data = await this.#tryJson('GetStudentInfoData', { childIntID: 0 }, () => this.#soapStudentInfo());
    const raw = this.soapMode ? data : (data?.data?.studentInfoXML || data?.data?.studentInfoDetailXML || null);
    const info = normalizeStudentInfo(raw);
    this.loadedStudentInfo = info;
    return info;
  }

  /* -- SOAP MultiWeb fallback (verified live) -- */

  async #soapRequest(method, paramStr) {
    const key = await getVersionKey();
    const xml = `<?xml version="1.0" encoding="utf-8"?>` +
      `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
      `<soap:Body><ProcessWebServiceRequestMultiWeb xmlns="http://edupoint.com/webservices/">` +
      `<userID>${escapeXml(this.username)}</userID><password>${escapeXml(this.password)}</password>` +
      `<skipLoginLog>1</skipLoginLog><parent>0</parent><webDBName></webDBName>` +
      `<webServiceHandleName>PXPWebServices</webServiceHandleName>` +
      `<methodName>${method}</methodName><paramStr>${escapeXml(paramStr || '<Parms></Parms>')}</paramStr>` +
      `</ProcessWebServiceRequestMultiWeb></soap:Body></soap:Envelope>`;
    const res = await proxiedFetch(`${this.district}/Service/PXPCommunication.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        // Browsers strip Cookie on fetch(); our worker adds it from x-ojjy-key.
        Cookie: `AppSupportsSession=1; edupointkey=1; edupointkeyversion=${key}`,
        'x-ojjy-key': key,
      },
      body: xml,
    });
    if (res.status === 401) throw new UnauthorizedError();
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const errNode = doc.querySelector('soap\\:Body > soap\\:Fault');
    if (errNode) throw new Error('SOAP fault from district server.');
    const resultNode = doc.getElementsByTagName('ProcessWebServiceRequestMultiWebResult')[0];
    if (!resultNode) throw new Error('Unexpected SOAP response (no result node).');
    const inner = new DOMParser().parseFromString(resultNode.textContent, 'text/xml');
    const rtError = inner.getElementsByTagName('RT_ERROR')[0];
    if (rtError) {
      const msg = rtError.getAttribute('ERROR_MESSAGE') || 'Unknown error';
      if (/Invalid user/i.test(msg)) throw new UnauthorizedError();
      throw new Error(msg);
    }
    return inner;
  }

  async #soapGradebook(reportPeriod) {
    const parms = reportPeriod != null
      ? `<Parms><ChildIntID>0</ChildIntID><ReportPeriod>${Number(reportPeriod)}</ReportPeriod></Parms>`
      : '<Parms><ChildIntID>0</ChildIntID></Parms>';
    const inner = await this.#soapRequest('Gradebook', parms);
    return soapXmlToGradebook(inner);
  }

  async #soapSchedule(termIndex) {
    const parms = termIndex != null
      ? `<Parms><ChildIntID>0</ChildIntID><TermIndex>${Number(termIndex)}</TermIndex></Parms>`
      : '<Parms><ChildIntID>0</ChildIntID></Parms>';
    const inner = await this.#soapRequest('StudentClassList', parms);
    return soapXmlToSchedule(inner);
  }

  async #soapAttendance() {
    const inner = await this.#soapRequest('Attendance', '<Parms><ChildIntID>0</ChildIntID></Parms>');
    return soapXmlToAttendance(inner);
  }

  async #soapDocuments() {
    const inner = await this.#soapRequest('GetStudentDocumentInitialData', '<Parms><ChildIntID>0</ChildIntID></Parms>');
    return [...inner.getElementsByTagName('StudentDocumentData')].map((n) => ({
      documentGU: attr(n, 'DocumentGU'),
      documentFileName: attr(n, 'DocumentFileName'),
      documentDate: attr(n, 'DocumentDate'),
      documentType: attr(n, 'DocumentType'),
      documentComment: attr(n, 'DocumentComment'),
    }));
  }

  async #soapDocumentContent(documentGU) {
    const inner = await this.#soapRequest('GetContentOfAttachedDoc', `<Parms><DocumentGU>${escapeXml(documentGU)}</DocumentGU></Parms>`);
    const dd = inner.getElementsByTagName('DocumentData')[0];
    if (!dd) return null;
    return {
      fileName: attr(dd, 'FileName'),
      docType: attr(dd, 'DocType'),
      base64Code: (inner.getElementsByTagName('Base64Code')[0]?.textContent || '').trim(),
    };
  }

  async #soapStudentInfo() {
    const inner = await this.#soapRequest('StudentInfo', '<Parms><ChildIntID>0</ChildIntID></Parms>');
    const obj = {};
    for (const tag of ['FormattedName', 'PermID', 'Grade', 'BirthDate', 'EMail', 'CurrentSchool', 'HomeRoom', 'HomeRoomTch', 'CounselorName', 'Track', 'Gender', 'Address']) {
      const el = inner.getElementsByTagName(tag)[0];
      if (el) obj[tag] = el.textContent.trim();
    }
    return obj;
  }
}

/* ---------- SOAP XML -> JSON-ish converters ---------- */

function attr(el, name) { return el?.getAttribute?.(name) || ''; }
function escapeXml(s) {
  const AMP = String.fromCharCode(38); // "&"
  return String(s).replace(/[&<>"]/g, (c) => ({
    '&': AMP + 'amp;',
    '<': AMP + 'lt;',
    '>': AMP + 'gt;',
    '"': AMP + 'quot;',
  }[c]));
}

function soapXmlToGradebook(inner) {
  const periods = [...inner.getElementsByTagName('ReportPeriod')].map((p) => ({
    index: attr(p, 'Index'), gradePeriod: attr(p, 'GradePeriod'),
    startDate: attr(p, 'StartDate'), endDate: attr(p, 'EndDate'),
  }));
  const current = inner.getElementsByTagName('ReportingPeriod')[0];
  const courses = [...inner.getElementsByTagName('Course')].map((c) => {
    const markEl = c.getElementsByTagName('Mark')[0];
    const mark = markEl ? {
      markName: attr(markEl, 'MarkName'),
      calculatedScoreString: attr(markEl, 'CalculatedScoreString'),
      calculatedScoreRaw: parseFloatOr(attr(markEl, 'CalculatedScoreRaw'), null),
      gradeCalculationSummary: [...markEl.getElementsByTagName('AssignmentGradeCalc')].map((g) => ({
        type: attr(g, 'Type'), weight: attr(g, 'Weight'),
        points: attr(g, 'Points'), pointsPossible: attr(g, 'PointsPossible'),
        weightedPct: attr(g, 'WeightedPct'), calculatedMark: attr(g, 'CalculatedMark'),
      })),
      assignments: [...markEl.getElementsByTagName('Assignment')].map((a) => ({
        gradebookID: Number(attr(a, 'GradebookID')) || attr(a, 'GradebookID'),
        measure: attr(a, 'Measure'),
        type: attr(a, 'Type'),
        date: attr(a, 'Date'), dueDate: attr(a, 'DueDate'),
        score: attr(a, 'Score'), displayScore: attr(a, 'DisplayScore'),
        scoreCalValue: attr(a, 'ScoreCalValue') || null,
        scoreMaxValue: attr(a, 'ScoreMaxValue') || null,
        scoreType: attr(a, 'ScoreType'),
        points: attr(a, 'Points'),
        point: attr(a, 'Point') || null,
        pointPossible: attr(a, 'PointPossible') || null,
        notes: attr(a, 'Notes'),
        measureDescription: attr(a, 'MeasureDescription'),
      })),
    } : null;
    return {
      period: attr(c, 'Period'), title: attr(c, 'Title'),
      courseName: attr(c, 'CourseName'), courseID: attr(c, 'CourseID'),
      room: attr(c, 'Room'), staff: attr(c, 'Staff'), staffEMail: attr(c, 'StaffEMail'),
      imageType: attr(c, 'ImageType'),
      marks: mark ? [mark] : [],
    };
  });
  return {
    reportingPeriods: periods,
    reportingPeriod: current ? {
      index: attr(current, 'Index') || periods.find((p) => !p.gradePeriod.includes('Interim'))?.index || '0',
      gradePeriod: attr(current, 'GradePeriod'),
      startDate: attr(current, 'StartDate'), endDate: attr(current, 'EndDate'),
    } : null,
    courses,
  };
}

function soapXmlToSchedule(inner) {
  const terms = [...inner.getElementsByTagName('TermListing')].map((t) => ({
    termIndex: Number(attr(t, 'TermIndex')) || 0,
    termName: attr(t, 'TermName'),
    beginDate: attr(t, 'BeginDate'), endDate: attr(t, 'EndDate'),
    termDefCodes: [...t.getElementsByTagName('TermDefCode')].map((d) => attr(d, 'TermDefName')),
  }));
  const classes = [...inner.getElementsByTagName('ClassListing')].map((c) => ({
    period: attr(c, 'Period'), courseTitle: attr(c, 'CourseTitle'),
    roomName: attr(c, 'RoomName'), teacher: attr(c, 'Teacher'), teacherEmail: attr(c, 'TeacherEmail'),
  }));
  return { termIndex: terms[0]?.termIndex ?? 0, termIndexName: terms[0]?.termName ?? '', termLists: terms, classLists: classes };
}

function soapXmlToAttendance(inner) {
  // Build the same shape as GetStudentAttendanceList.periodAttendance:
  // { periodInfos: [{period, name, total}], absences: [{date, periods: [{period, name}]}] }
  const periodInfos = [];
  const absences = [];
  const totals = {
    TotalExcused: 'Excused Absence', TotalUnexcused: 'Unexcused Absence',
    TotalTardies: 'Tardy', TotalUnexcusedTardies: 'Unexcused Tardy',
    TotalActivities: 'Activity', TotalSupervision: 'Supervision',
  };
  for (const [tag, label] of Object.entries(totals)) {
    const block = inner.getElementsByTagName(tag)[0];
    if (!block) continue;
    for (const pt of block.getElementsByTagName('PeriodTotal')) {
      const num = Number(attr(pt, 'Number'));
      const total = Number(attr(pt, 'Total'));
      if (!total) continue;
      periodInfos.push({ period: num, name: label, total: {} , _total: total, _label: label });
    }
  }
  for (const abs of inner.getElementsByTagName('Absence')) {
    const date = attr(abs, 'AbsenceDate');
    const periods = [...abs.getElementsByTagName('Period')].map((p) => ({
      period: Number(attr(p, 'Number')),
      name: attr(p, 'Name'),
    })).filter((p) => p.name);
    if (periods.length) absences.push({ date, periods });
  }
  return { periodInfos, absences };
}

function parseFloatOr(s, fallback) {
  const n = parseFloat(s);
  return isNaN(n) ? fallback : n;
}

/* Normalize student info across JSON (lowerCamelCase) and SOAP (PascalCase) shapes. */
function normalizeStudentInfo(raw) {
  if (!raw || typeof raw !== 'object') return raw || {};
  const get = (...keys) => {
    for (const k of keys) {
      const v = raw[k] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
      if (v != null && v !== '') return v;
    }
    return '';
  };
  const photo = String(get('photo', 'Photo') || '');
  const photoMime = photo.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
  return {
    FormattedName: get('formattedName', 'FormattedName'),
    PermID: get('permID', 'PermID'),
    Grade: get('grade', 'Grade'),
    Gender: get('gender', 'Gender'),
    BirthDate: get('birthDate', 'BirthDate'),
    EMail: get('eMail', 'EMail'),
    CurrentSchool: get('currentSchool', 'CurrentSchool'),
    HomeRoom: get('homeRoom', 'HomeRoom'),
    HomeRoomTch: get('homeRoomTch', 'HomeRoomTch'),
    CounselorName: get('counselorName', 'CounselorName'),
    Photo: photo ? `${photoMime};base64,${photo.replace(/^data:image\/\w+;base64,/, '')}` : '',
  };
}

/* ---------- Errors ---------- */
export class ApiError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}
export class UnauthorizedError extends Error {
  constructor() { super('Your session expired or the credentials were rejected. Please sign in again.'); }
}

export function isAuthError(e) {
  return e instanceof UnauthorizedError || /Invalid user|password/i.test(e?.message || '');
}

export function districtFromZipList(zip, districts) {
  return districts.filter((d) => d.address.endsWith(zip));
}
