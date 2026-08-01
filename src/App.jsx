import React, { useState, useEffect, useMemo, useRef } from "react";
import { enablePushNotifications, getPushSubscriptionStatus, sendPushNotification } from "./pushNotifications.js";
import {
  Plus, Trash2, Users, Clock, JapaneseYen, AlertTriangle, RotateCcw,
  ChevronDown, ChevronUp, Moon, Copy, Check, TrendingUp, Loader2, X,
  Settings, UserCircle, MessageSquare, CalendarDays, CalendarOff, RefreshCw, Pencil, Megaphone, Phone, Briefcase,
} from "lucide-react";

const EMPLOYMENT_TYPES = ["正社員", "準社員", "パート", "アルバイト", "学生"];
const TYPE_DEFAULT_HOURS = { "正社員": 40, "準社員": 33, "パート": 30, "アルバイト": 28, "学生": 20 };
const GIG_ATTRIBUTES = ["社員", "準社員", "パート", "アルバイト"];
const TYPE_COLORS = {
  "正社員": "#1B2A4A",
  "社員": "#1B2A4A",
  "準社員": "#3A5BA0",
  "パート": "#12756B",
  "アルバイト": "#B5562B",
  "学生": "#6B4C8A",
};
const TYPE_COLOR_FALLBACK = "#8A8776";
const TYPE_GROUP_ORDER = ["正社員", "社員", "準社員", "パート", "アルバイト", "学生"];
const typeColor = (type) => TYPE_COLORS[type] || TYPE_COLOR_FALLBACK;
const CONTRACT_PRESETS = [40, 33];
const SHIFT_BANDS = ["朝勤", "日勤", "夕勤", "準夜勤", "夜勤"];
const POSTING_BANDS = [
  { label: "朝勤・日勤", start: "06:00" },
  { label: "夕勤", start: "17:00" },
  { label: "準夜勤", start: "21:00" },
  { label: "夜勤", start: "00:00" },
];
const HALF_HOUR_TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});
const STAFF_COLORS = ["#12756B", "#B5562B", "#3A5BA0", "#8A6D1F", "#6B4C8A", "#2F7D4F", "#A03E5C"];
const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"];
const WEEKDAY_ORDER_JA = ["月", "火", "水", "木", "金", "土", "日"];
const WEEKDAY_JS_MAP = [1, 2, 3, 4, 5, 6, 0]; // index i (月火水木金土日) -> JS Date.getDay()

const DEFAULT_SLOTS_BY_STORE = {
  "アーケード": [
    { id: "ar1", label: "7:00-13:00", start: "07:00", end: "13:00", required: 2 },
    { id: "ar2", label: "13:00-17:00", start: "13:00", end: "17:00", required: 2 },
    { id: "ar3", label: "17:00-21:00", start: "17:00", end: "21:00", required: 2 },
    { id: "ar4", label: "21:00-7:00", start: "21:00", end: "07:00", required: 2 },
  ],
  "インター": [
    { id: "in1", label: "7:15-14:30", start: "07:15", end: "14:30", required: 2 },
    { id: "in2", label: "8:30-17:00", start: "08:30", end: "17:00", required: 2 },
    { id: "in3", label: "14:00-21:00", start: "14:00", end: "21:00", required: 2 },
    { id: "in4", label: "14:00-23:00", start: "14:00", end: "23:00", required: 2 },
    { id: "in5", label: "17:00-21:00", start: "17:00", end: "21:00", required: 2 },
    { id: "in6", label: "21:00-7:00", start: "21:00", end: "07:00", required: 2 },
    { id: "in7", label: "23:00-8:00", start: "23:00", end: "08:00", required: 2 },
    { id: "in8", label: "21:00-1:00", start: "21:00", end: "01:00", required: 2 },
  ],
  "開成": [
    { id: "ka1a", label: "6:00-13:00", start: "06:00", end: "13:00", required: 2 },
    { id: "ka1b", label: "6:00-15:00", start: "06:00", end: "15:00", required: 2 },
    { id: "ka2a", label: "8:30-13:00", start: "08:30", end: "13:00", required: 2 },
    { id: "ka2b", label: "9:00-13:00", start: "09:00", end: "13:00", required: 2 },
    { id: "ka3", label: "13:00-17:00", start: "13:00", end: "17:00", required: 2 },
    { id: "ka4", label: "15:00-23:00", start: "15:00", end: "23:00", required: 2 },
    { id: "ka5", label: "17:00-21:00", start: "17:00", end: "21:00", required: 2 },
    { id: "ka6", label: "21:00-23:00", start: "21:00", end: "23:00", required: 2 },
    { id: "ka7", label: "21:00-2:00", start: "21:00", end: "02:00", required: 2 },
    { id: "ka8a", label: "2:00-8:30", start: "02:00", end: "08:30", required: 2 },
    { id: "ka8b", label: "2:00-9:00", start: "02:00", end: "09:00", required: 2 },
    { id: "ka9", label: "21:00-8:00", start: "21:00", end: "08:00", required: 2 },
    { id: "ka10", label: "0:00-9:00", start: "00:00", end: "09:00", required: 2 },
  ],
  "名倉": [
    { id: "na1", label: "7:00-13:00", start: "07:00", end: "13:00", required: 2 },
    { id: "na2", label: "7:00-15:00", start: "07:00", end: "15:00", required: 2 },
    { id: "na3", label: "8:00-17:00", start: "08:00", end: "17:00", required: 2 },
    { id: "na4", label: "12:00-21:00", start: "12:00", end: "21:00", required: 2 },
    { id: "na5", label: "15:00-21:00", start: "15:00", end: "21:00", required: 2 },
    { id: "na6", label: "17:00-21:00", start: "17:00", end: "21:00", required: 2 },
    { id: "na7", label: "21:00-0:00", start: "21:00", end: "24:00", required: 2 },
    { id: "na8", label: "21:00-7:00", start: "21:00", end: "07:00", required: 2 },
    { id: "na9", label: "0:00-7:30", start: "00:00", end: "07:30", required: 2 },
    { id: "na10", label: "0:00-9:00", start: "00:00", end: "09:00", required: 2 },
  ],
  "鶴見坦": [
    { id: "tu1", label: "8:30-17:00", start: "08:30", end: "17:00", required: 2 },
    { id: "tu2", label: "9:00-13:00", start: "09:00", end: "13:00", required: 2 },
    { id: "tu3", label: "9:00-17:00", start: "09:00", end: "17:00", required: 2 },
    { id: "tu4", label: "12:00-21:00", start: "12:00", end: "21:00", required: 2 },
    { id: "tu5", label: "12:00-17:00", start: "12:00", end: "17:00", required: 2 },
    { id: "tu6", label: "17:00-21:00", start: "17:00", end: "21:00", required: 2 },
    { id: "tu7", label: "21:00-0:00", start: "21:00", end: "24:00", required: 2 },
    { id: "tu8", label: "21:00-2:00", start: "21:00", end: "02:00", required: 2 },
    { id: "tu9", label: "0:00-7:30", start: "00:00", end: "07:30", required: 2 },
    { id: "tu10", label: "0:00-9:00", start: "00:00", end: "09:00", required: 2 },
    { id: "tu11", label: "2:00-7:30", start: "02:00", end: "07:30", required: 2 },
    { id: "tu12", label: "2:00-9:00", start: "02:00", end: "09:00", required: 2 },
    { id: "tu13", label: "7:00-9:00", start: "07:00", end: "09:00", required: 2 },
    { id: "tu14", label: "7:00-12:00", start: "07:00", end: "12:00", required: 2 },
  ],
  "八山田": [], // 未定：後ほど手入力
};

const DEFAULT_STAFF = []; // 新規導入時は空。管理者がスタッフを登録してください。

let uid = 100;
const nextId = (prefix) => `${prefix}${uid++}_${Math.random().toString(36).slice(2, 6)}`;

const parseHour = (str) => {
  const [h, m] = (str || "0:0").split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
};
const isNightSlot = (geom) => geom.startHour < 5 || geom.startHour + geom.hours > 22;

// Whether a person is OK with night shifts is derived from their usual/fixed working hours,
// rather than a separate manual checkbox: if their normal shift overlaps the night window
// (22:00-5:00), they're treated as night-shift capable.
const personNightOk = (p) => {
  if (!p.usualStart || !p.usualEnd) return false;
  const s = parseHour(p.usualStart);
  let e = parseHour(p.usualEnd);
  if (e <= s) e += 24;
  return isNightSlot({ startHour: s, hours: e - s });
};

const getShiftBand = (startHour) => {
  if (startHour >= 21) return "準夜勤";
  if (startHour >= 17) return "夕勤";
  if (startHour >= 6) return "朝勤・日勤";
  return "夜勤";
};

const isUnderSixMonths = (hireDate, todayISO) => {
  if (!hireDate) return false;
  const hire = new Date(hireDate + "T00:00:00");
  const sixMonthsLater = new Date(hire);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const today = new Date(todayISO + "T00:00:00");
  return today < sixMonthsLater;
};

const fmtISO = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return fmtISO(d);
};
const dispShort = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY_JA[d.getDay()]})`;
};
const daysInMonth = (year, monthIdx) => new Date(year, monthIdx + 1, 0).getDate();
const monthDates = (year, monthIdx) => {
  const n = daysInMonth(year, monthIdx);
  return Array.from({ length: n }, (_, i) => fmtISO(new Date(year, monthIdx, i + 1)));
};
const addMonths = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return fmtISO(d);
};

const STATUTORY_GRANT_DAYS = [10, 11, 12, 14, 16, 18, 20];
const statutoryGrant = (hireISO, todayISO) => {
  if (!hireISO) return null;
  const hire = new Date(hireISO + "T00:00:00");
  const today = new Date(todayISO + "T00:00:00");
  let grantDate = new Date(hire);
  grantDate.setMonth(grantDate.getMonth() + 6);
  if (grantDate > today) return null; // hasn't reached the first grant yet
  let n = 0;
  let last = new Date(grantDate);
  while (true) {
    const next = new Date(last);
    next.setFullYear(next.getFullYear() + 1);
    if (next > today) break;
    last = next;
    n++;
  }
  const days = STATUTORY_GRANT_DAYS[Math.min(n, STATUTORY_GRANT_DAYS.length - 1)];
  return { grantDate: fmtISO(last), annualGrantedDays: days };
};

const currentLeavePeriod = (grantDateISO, todayISO) => {
  if (!grantDateISO) return null;
  let start = new Date(grantDateISO + "T00:00:00");
  const today = new Date(todayISO + "T00:00:00");
  if (start > today) {
    const end = new Date(start); end.setFullYear(end.getFullYear() + 1);
    return { start: fmtISO(start), end: fmtISO(end) };
  }
  while (true) {
    const end = new Date(start); end.setFullYear(end.getFullYear() + 1);
    if (end > today) return { start: fmtISO(start), end: fmtISO(end) };
    start = end;
  }
};

const mondayOfWeek = (dateISO) => {
  const d = new Date(dateISO + "T00:00:00");
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return fmtISO(d);
};

const nextMonday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 1 ? 0 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + (day === 1 ? 0 : diff));
  d.setHours(0, 0, 0, 0);
  return fmtISO(d);
};

const availabilityConflict = (win, geom) => {
  if (!win || !win.available) return "出勤不可日";
  const s = parseHour(win.start), e = parseHour(win.end);
  if (e <= s) return "出勤不可日";
  const EPS = 0.001;
  if (geom.startHour < s - EPS || geom.startHour + geom.hours > e + EPS) return "時間帯外";
  return null;
};

// Looser check used only by auto-assign: eligible if the person's submitted/override window
// overlaps the slot AT ALL (not necessarily covering it fully). Auto-assign then uses just the
// overlapping portion as their actual worked time via clipToSlot, so someone available 9-13 can
// be placed into a broader 7-17:30 band and correctly worked only their own 9-13.
const hasOverlapAvailability = (win, geom) => {
  if (!win || !win.available) return false;
  let s = parseHour(win.start);
  let e = parseHour(win.end);
  if (e <= s) e += 24;
  const gs = geom.startHour;
  const ge = geom.startHour + geom.hours;
  return gs < e && s < ge;
};

const longestConsecutive = (daySet) => {
  let max = 0, cur = 0;
  for (let i = 0; i < 7; i++) { if (daySet.has(i)) { cur++; max = Math.max(max, cur); } else cur = 0; }
  return max;
};

async function loadJSON(key, fallback, shared) {
  try {
    const res = await window.storage.get(key, shared);
    return res?.value ? JSON.parse(res.value) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function saveJSON(key, value, shared) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
    return true;
  } catch (e) {
    return false;
  }
}

const DAY_W = 100 / 7;
const AXIS_START_HOUR = 7; // Gantt time axes start at 7:00 instead of midnight
const toAxisHour = (realHour) => (realHour - AXIS_START_HOUR + 24) % 24;
const AUTH_SESSION_MS = 10 * 60 * 1000; // 10 minutes before re-entering admin passwords

export default function ShiftApp() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("staff");

  const [storeName, setStoreName] = useState("アーケード");
  const [storeList, setStoreList] = useState(["アーケード", "インター", "開成", "名倉", "鶴見坦", "八山田"]);
  const [commuteFare, setCommuteFare] = useState(300);
  const [operatorPassword, setOperatorPassword] = useState("");
  const [weekStart, setWeekStart] = useState(nextMonday());
  const [weeklySales, setWeeklySales] = useState(1800000);
  const [targetRatio, setTargetRatio] = useState(28);
  const [laborBudget, setLaborBudget] = useState(500000);
  const [staff, setStaff] = useState(DEFAULT_STAFF);
  const [slotsByStore, setSlotsByStore] = useState(DEFAULT_SLOTS_BY_STORE);
  const [assignments, setAssignments] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [requiredOverrides, setRequiredOverrides] = useState({});
  const [assignmentTimeOverrides, setAssignmentTimeOverrides] = useState({}); // key: `${weekStart}__${dayIdx}__${slotId}__${staffId}` -> {start,end}
  const [postings, setPostings] = useState({});
  const [taskItems, setTaskItems] = useState(["👑 リーダー", "🧽 トイレ清掃", "🧹 床清掃", "🍟 フライヤー清掃", "☕ カフェマシン清掃"]);
  const [taskAssignments, setTaskAssignments] = useState({}); // `${weekStart}__${dayIdx}__${slotId}__${staffId}` -> [taskLabel,...]
  const [sideJobDeclarations, setSideJobDeclarations] = useState([]);
  const [storePasswords, setStorePasswords] = useState({}); // { [storeName]: password }, created by 運営
  const [deadlineOverrideMonths, setDeadlineOverrideMonths] = useState([]); // ["2026-08", ...] months where the 25th deadline is lifted
  const [myStaffId, setMyStaffId] = useState("");
  const [myGigId, setMyGigId] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [newApplicationAlert, setNewApplicationAlert] = useState(null); // { count } or null
  const [newPostingAlert, setNewPostingAlert] = useState(null); // { count } or null
  const seenApplicantKeys = useRef(null); // null until first postings load, to avoid alerting on initial data
  const seenPostingKeys = useRef(null);
  const audioUnlocked = useRef(false);

  useEffect(() => {
    // Many browsers block audio until the user has interacted with the page at least once.
    const unlock = () => { audioUnlocked.current = true; window.removeEventListener("click", unlock); window.removeEventListener("touchstart", unlock); };
    window.addEventListener("click", unlock);
    window.addEventListener("touchstart", unlock);
    return () => { window.removeEventListener("click", unlock); window.removeEventListener("touchstart", unlock); };
  }, []);

  const playNotificationSound = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [880, 1108].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        const startAt = ctx.currentTime + i * 0.16;
        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.22);
        osc.start(startAt);
        osc.stop(startAt + 0.25);
      });
    } catch (e) { /* audio not available in this environment; ignore */ }
  };

  useEffect(() => {
    const currentPostingKeys = new Set();
    const currentApplicantKeys = new Set();
    Object.entries(postings).forEach(([pk, posting]) => {
      if (posting?.open) currentPostingKeys.add(pk);
      Object.entries(posting?.applicants || {}).forEach(([appKey, a]) => {
        if (a.status === "pending") currentApplicantKeys.add(`${pk}__${appKey}`);
      });
    });

    if (seenPostingKeys.current === null) {
      seenPostingKeys.current = currentPostingKeys;
      seenApplicantKeys.current = currentApplicantKeys;
      return;
    }

    // New posting created -> broadcast to everyone with the app open, regardless of role.
    const newPostingKeys = [...currentPostingKeys].filter((k) => !seenPostingKeys.current.has(k));
    if (newPostingKeys.length > 0) {
      playNotificationSound();
      setNewPostingAlert({ count: newPostingKeys.length });
      setTimeout(() => setNewPostingAlert(null), 6000);
    }
    seenPostingKeys.current = currentPostingKeys;

    // New application submitted -> notify admin and all staff (not scoped to the posting's
    // creator, since that scoping relies on personal storage which isn't reliable when
    // multiple people share one Claude login).
    const newApplicantKeys = [...currentApplicantKeys].filter((k) => !seenApplicantKeys.current.has(k));
    if (newApplicantKeys.length > 0 && (mode === "admin" || mode === "staff")) {
      playNotificationSound();
      setNewApplicationAlert({ count: newApplicantKeys.length });
      setTimeout(() => setNewApplicationAlert(null), 6000);
    }
    seenApplicantKeys.current = currentApplicantKeys;
  }, [postings, mode, myStaffId]);

  useEffect(() => {
    (async () => {
      const cfg = await loadJSON("weekConfig", null, true);
      const resolvedWeekStart = cfg?.weekStart ?? nextMonday();
      if (cfg) {
        setStoreList(cfg.storeList ?? ["アーケード"]);
        setCommuteFare(cfg.commuteFare ?? 300);
        setOperatorPassword(cfg.operatorPassword ?? "");
        setStorePasswords(cfg.storePasswords ?? {});
        setDeadlineOverrideMonths(cfg.deadlineOverrideMonths ?? []);
        setWeekStart(resolvedWeekStart);
        setWeeklySales(cfg.weeklySales ?? 1800000);
        setTargetRatio(cfg.targetRatio ?? 28);
        setLaborBudget(cfg.laborBudget ?? 500000);
      }
      const rosterData = await loadJSON("roster", null, true);
      if (rosterData) setStaff(rosterData);
      else await saveJSON("roster", DEFAULT_STAFF, true);
      const slotsData = await loadJSON("slotsByStore", null, true);
      if (slotsData) setSlotsByStore(slotsData);
      else await saveJSON("slotsByStore", DEFAULT_SLOTS_BY_STORE, true);
      const asg = await loadJSON("assignments", {}, true);
      setAssignments(asg);
      const subs = await loadJSON("submissions", [], true);
      setSubmissions(subs);
      const ov = await loadJSON("overrides", {}, true);
      setOverrides(ov);
      const rov = await loadJSON("requiredOverrides", {}, true);
      setRequiredOverrides(rov);
      const ato = await loadJSON("assignmentTimeOverrides", {}, true);
      setAssignmentTimeOverrides(ato);
      const pst = await loadJSON("postings", {}, true);
      setPostings(pst);
      const ti = await loadJSON("taskItems", null, true);
      if (ti) setTaskItems(ti);
      else await saveJSON("taskItems", ["👑 リーダー", "🧽 トイレ清掃", "🧹 床清掃", "🍟 フライヤー清掃", "☕ カフェマシン清掃"], true);
      const ta = await loadJSON("taskAssignments", {}, true);
      setTaskAssignments(ta);
      const sjd = await loadJSON("sideJobDeclarations", [], true);
      setSideJobDeclarations(sjd);
      const my = await loadJSON("myStaffId", "", false);
      setMyStaffId(my);
      const myGig = await loadJSON("myGigId", "", false);
      setMyGigId(myGig);
      const myStore = await loadJSON("myActiveStore", "", false);
      if (myStore) setStoreName(myStore);
      setLoading(false);
    })();
  }, []);

  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [pushStatus, setPushStatus] = useState("not-subscribed");
  const [toastPush, setToastPush] = useState("");

  useEffect(() => {
    getPushSubscriptionStatus().then(setPushStatus).catch(() => {});
  }, []);

  const refreshSharedData = async () => {
    try {
      const cfg = await loadJSON("weekConfig", null, true);
      if (cfg) {
        setStoreList(cfg.storeList ?? ["アーケード"]);
        setCommuteFare(cfg.commuteFare ?? 300);
        setOperatorPassword(cfg.operatorPassword ?? "");
        setStorePasswords(cfg.storePasswords ?? {});
        setDeadlineOverrideMonths(cfg.deadlineOverrideMonths ?? []);
        setWeekStart(cfg.weekStart ?? nextMonday());
        setWeeklySales(cfg.weeklySales ?? 1800000);
        setTargetRatio(cfg.targetRatio ?? 28);
        setLaborBudget(cfg.laborBudget ?? 500000);
      }
      const rosterData = await loadJSON("roster", null, true);
      if (rosterData) setStaff(rosterData);
      const slotsData = await loadJSON("slotsByStore", null, true);
      if (slotsData) setSlotsByStore(slotsData);
      setAssignments(await loadJSON("assignments", {}, true));
      setSubmissions(await loadJSON("submissions", [], true));
      setOverrides(await loadJSON("overrides", {}, true));
      setRequiredOverrides(await loadJSON("requiredOverrides", {}, true));
      setAssignmentTimeOverrides(await loadJSON("assignmentTimeOverrides", {}, true));
      setPostings(await loadJSON("postings", {}, true));
      const tiRefresh = await loadJSON("taskItems", null, true);
      if (tiRefresh) setTaskItems(tiRefresh);
      setTaskAssignments(await loadJSON("taskAssignments", {}, true));
      setSideJobDeclarations(await loadJSON("sideJobDeclarations", [], true));
      setLastRefreshed(new Date());
    } catch (e) { /* transient network issue; try again next interval */ }
  };

  // Periodically re-fetch shared data so changes made from other devices/sessions show up
  // here without needing a manual page reload. Personal data (myStaffId etc.) isn't refreshed
  // since that's specific to this session/device.
  useEffect(() => {
    const interval = setInterval(refreshSharedData, 30000);
    return () => clearInterval(interval);
  }, []);

  const weekDates = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i)), [weekStart]);

  const setActiveStore = (next) => {
    setStoreName(next);
    saveJSON("myActiveStore", next, false);
  };

  const persistWeekConfig = async (next) => {
    const merged = { storeList, commuteFare, operatorPassword, storePasswords, weekStart, weeklySales, targetRatio, laborBudget, deadlineOverrideMonths, ...next };
    setStoreList(merged.storeList); setCommuteFare(merged.commuteFare);
    setOperatorPassword(merged.operatorPassword);
    setStorePasswords(merged.storePasswords);
    setWeekStart(merged.weekStart);
    setWeeklySales(merged.weeklySales); setTargetRatio(merged.targetRatio); setLaborBudget(merged.laborBudget);
    setDeadlineOverrideMonths(merged.deadlineOverrideMonths);
    const ok = await saveJSON("weekConfig", merged, true);
    if (!ok) setSaveError(true);
  };
  const persistRoster = async (next) => {
    setStaff(next);
    const ok = await saveJSON("roster", next, true);
    if (!ok) setSaveError(true);
  };
  const persistSlotsByStore = async (next) => {
    setSlotsByStore(next);
    const ok = await saveJSON("slotsByStore", next, true);
    if (!ok) setSaveError(true);
  };
  const currentSlots = slotsByStore[storeName] || [];
  const persistCurrentStoreSlots = (next) => persistSlotsByStore({ ...slotsByStore, [storeName]: next });
  const allSlots = useMemo(() => Object.values(slotsByStore).flat(), [slotsByStore]);
  const persistAssignments = async (next) => {
    setAssignments(next);
    const ok = await saveJSON("assignments", next, true);
    if (!ok) setSaveError(true);
  };
  const persistSubmissions = async (next) => {
    setSubmissions(next);
    const ok = await saveJSON("submissions", next, true);
    if (!ok) setSaveError(true);
  };
  const persistOverrides = async (next) => {
    setOverrides(next);
    const ok = await saveJSON("overrides", next, true);
    if (!ok) setSaveError(true);
  };
  const persistRequiredOverrides = async (next) => {
    setRequiredOverrides(next);
    const ok = await saveJSON("requiredOverrides", next, true);
    if (!ok) setSaveError(true);
  };
  const persistAssignmentTimeOverrides = async (next) => {
    setAssignmentTimeOverrides(next);
    const ok = await saveJSON("assignmentTimeOverrides", next, true);
    if (!ok) setSaveError(true);
  };
  const persistPostings = async (next) => {
    setPostings(next);
    const ok = await saveJSON("postings", next, true);
    if (!ok) setSaveError(true);
  };
  const persistTaskItems = async (next) => {
    setTaskItems(next);
    const ok = await saveJSON("taskItems", next, true);
    if (!ok) setSaveError(true);
  };
  const persistTaskAssignments = async (next) => {
    setTaskAssignments(next);
    const ok = await saveJSON("taskAssignments", next, true);
    if (!ok) setSaveError(true);
  };
  const persistSideJobDeclarations = async (next) => {
    setSideJobDeclarations(next);
    const ok = await saveJSON("sideJobDeclarations", next, true);
    if (!ok) setSaveError(true);
  };

  const staffColor = (id) => {
    const idx = staff.findIndex((p) => p.id === id);
    return STAFF_COLORS[idx % STAFF_COLORS.length];
  };

  const effectiveWindow = (staffId, date) => {
    const ov = overrides[`${staffId}__${date}`];
    if (ov) return { ...ov, source: "override" };
    const subsForDay = submissions.filter((s) => s.staffId === staffId && s.date === date);
    if (subsForDay.length) {
      const sub = subsForDay[subsForDay.length - 1];
      return { available: sub.available, start: sub.start, end: sub.end, note: sub.note, leave: sub.leave || null, manual: sub.manual !== undefined ? sub.manual : true, source: "submission" };
    }
    return { available: true, start: "00:00", end: "24:00", source: "unknown" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F4F0" }}>
        <Loader2 className="animate-spin" size={22} style={{ color: "#1B2A4A" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FBF6EE 0%, #F5EFE4 40%, #F2ECEA 100%)", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap');
        .mono { font-family: 'Space Mono', monospace; }
        .perforated { background-image: radial-gradient(circle, #F5F4F0 3px, transparent 3.5px); background-size: 14px 14px; background-position: -4px -4px; height: 10px; }
        .slot-cell { transition: background 0.12s ease; cursor: pointer; }
        .slot-cell:hover { background: rgba(27,42,74,0.05); }

        .daychip { transition: all 0.12s ease; }
        .daychip:active { transform: scale(0.94); }
        .modebtn { transition: all 0.2s ease; }
        .icon-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; flex-shrink: 0; }
        .app-header { background: linear-gradient(120deg, #1B2A4A 0%, #24406B 55%, #12756B 100%); }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* App header */}
        <div className="app-header rounded-2xl px-5 py-4 mb-5 flex items-center gap-3 shadow-sm">
          <span style={{ fontSize: 26 }}>🏪</span>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">シフト管理</h1>
            <p className="text-[11px]" style={{ color: "#BFD4CE" }}>店舗のシフトをまとめて管理</p>
          </div>
        </div>

        {/* Mode switch */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex rounded-full p-1 gap-1" style={{ background: "#E8E6DF" }}>
            <button
              onClick={() => setMode("staff")}
              className="modebtn flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
              style={mode === "staff" ? { background: "linear-gradient(135deg, #1B2A4A, #2E4A7A)", color: "white" } : { color: "#6B6A63" }}
            >
              <UserCircle size={14} /> スタッフ
            </button>
            <button
              onClick={() => setMode("gig")}
              className="modebtn flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
              style={mode === "gig" ? { background: "linear-gradient(135deg, #B5562B, #D9822B)", color: "white" } : { color: "#6B6A63" }}
            >
              <Megaphone size={14} /> スキマワーク（スキワク）
            </button>
            <button
              onClick={() => setMode("admin")}
              className="modebtn flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
              style={mode === "admin" ? { background: "linear-gradient(135deg, #12756B, #1B9C8E)", color: "white" } : { color: "#6B6A63" }}
            >
              <Settings size={14} /> 管理者
            </button>
          </div>
          {saveError && <span className="text-xs" style={{ color: "#C4453B" }}>保存エラーが発生しました。通信環境をご確認ください。</span>}
          <button
            onClick={async () => {
              const ok = await enablePushNotifications();
              if (ok) { setPushStatus("subscribed"); setToastPush("通知を有効にしました"); setTimeout(() => setToastPush(""), 2500); }
            }}
            disabled={pushStatus === "subscribed"}
            className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ color: pushStatus === "subscribed" ? "#2F7D4F" : "#8A8776" }}
          >
            <Megaphone size={12} />
            {pushStatus === "subscribed" ? "通知 有効" : "通知を有効にする"}
          </button>
          <button onClick={refreshSharedData} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ color: "#8A8776" }}>
            <RefreshCw size={12} />
            {lastRefreshed ? `最終更新 ${lastRefreshed.getHours()}:${String(lastRefreshed.getMinutes()).padStart(2, "0")}` : "今すぐ更新"}
          </button>
        </div>
        {toastPush && (
          <div className="mb-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: "#2F7D4F15", color: "#2F7D4F" }}>{toastPush}</div>
        )}

        {newPostingAlert && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ background: "#8A6D1F15" }}>
            <Megaphone size={16} style={{ color: "#8A6D1F" }} />
            <span className="text-sm font-medium" style={{ color: "#8A6D1F" }}>新しい募集が{newPostingAlert.count}件公開されました。「スキマワーク（スキワク）」からご確認ください。</span>
          </div>
        )}

        {newApplicationAlert && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ background: "#12756B15" }}>
            <Megaphone size={16} style={{ color: "#12756B" }} />
            <span className="text-sm font-medium" style={{ color: "#12756B" }}>新しい応募が{newApplicationAlert.count}件届きました。「管理者」の不足シフト欄をご確認ください。</span>
          </div>
        )}

        {mode === "admin" ? (
          <AdminView
            storeName={storeName} setStoreName={setActiveStore} storeList={storeList} commuteFare={commuteFare} operatorPassword={operatorPassword} storePasswords={storePasswords} persistStorePasswords={(next) => persistWeekConfig({ storePasswords: next })} weekStart={weekStart} weeklySales={weeklySales} targetRatio={targetRatio} laborBudget={laborBudget}
            persistWeekConfig={persistWeekConfig} deadlineOverrideMonths={deadlineOverrideMonths}
            staff={staff} persistRoster={persistRoster}
            slots={currentSlots} persistSlots={persistCurrentStoreSlots} allSlots={allSlots} slotsByStore={slotsByStore}
            assignments={assignments} persistAssignments={persistAssignments}
            overrides={overrides} persistOverrides={persistOverrides}
            requiredOverrides={requiredOverrides} persistRequiredOverrides={persistRequiredOverrides}
            assignmentTimeOverrides={assignmentTimeOverrides} persistAssignmentTimeOverrides={persistAssignmentTimeOverrides}
            submissions={submissions} persistSubmissions={persistSubmissions}
            postings={postings} persistPostings={persistPostings}
            taskItems={taskItems} persistTaskItems={persistTaskItems} taskAssignments={taskAssignments} persistTaskAssignments={persistTaskAssignments}
            sideJobDeclarations={sideJobDeclarations}
            weekDates={weekDates} staffColor={staffColor} effectiveWindow={effectiveWindow}
          />
        ) : mode === "staff" ? (
          <StaffView
            staff={staff} persistRoster={persistRoster} weekDates={weekDates} weekStart={weekStart} storeName={storeName} storeList={storeList} slotsByStore={slotsByStore} persistSlotsByStore={persistSlotsByStore}
            postings={postings} persistPostings={persistPostings}
            assignments={assignments} requiredOverrides={requiredOverrides} commuteFare={commuteFare}
            submissions={submissions} persistSubmissions={persistSubmissions}
            sideJobDeclarations={sideJobDeclarations} persistSideJobDeclarations={persistSideJobDeclarations}
            deadlineOverrideMonths={deadlineOverrideMonths} persistWeekConfig={persistWeekConfig}
            myStaffId={myStaffId} setMyStaffId={(id) => { setMyStaffId(id); saveJSON("myStaffId", id, false); }}
          />
        ) : (
          <GigApplyView
            storeName={storeName} storeList={storeList} commuteFare={commuteFare} weekDates={weekDates} weekStart={weekStart}
            staff={staff} persistRoster={persistRoster}
            slots={allSlots} assignments={assignments} persistAssignments={persistAssignments}
            postings={postings} persistPostings={persistPostings}
            myGigId={myGigId} setMyGigId={(id) => { setMyGigId(id); saveJSON("myGigId", id, false); }}
          />
        )}
      </div>
    </div>
  );
}

// ======================= ADMIN VIEW =======================
function AdminView({
  storeName, setStoreName, storeList, commuteFare, operatorPassword, storePasswords, persistStorePasswords, weekStart, weeklySales, targetRatio, laborBudget, persistWeekConfig, deadlineOverrideMonths,
  staff, persistRoster, slots, persistSlots, allSlots, slotsByStore, assignments, persistAssignments,
  overrides, persistOverrides, requiredOverrides, persistRequiredOverrides, assignmentTimeOverrides, persistAssignmentTimeOverrides, submissions, persistSubmissions, postings, persistPostings, taskItems, persistTaskItems, taskAssignments, persistTaskAssignments, sideJobDeclarations,
  weekDates, staffColor, effectiveWindow,
}) {
  const [showSlotEditor, setShowSlotEditor] = useState(false);
  const [deadlineOverrideMonth, setDeadlineOverrideMonth] = useState("");
  const [leaveWarningDismissed, setLeaveWarningDismissed] = useState(false);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [leaderCountMonthOffset, setLeaderCountMonthOffset] = useState(0);
  const [showGroupStores, setShowGroupStores] = useState(false);
  const [showLaborSummary, setShowLaborSummary] = useState(false);
  const [showFixedScheduleList, setShowFixedScheduleList] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(false);
  const [showStaffSection, setShowStaffSection] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffWage, setNewStaffWage] = useState(1033);
  const [newStaffContractType, setNewStaffContractType] = useState("fixed"); // 'fixed' | 'custom'
  const [newStaffContractHours, setNewStaffContractHours] = useState(CONTRACT_PRESETS[0]);
  const [newStaffType, setNewStaffType] = useState(EMPLOYMENT_TYPES[2]); // アルバイト default
  const [newStaffHireDate, setNewStaffHireDate] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("");
  const [newStaffUsualStart, setNewStaffUsualStart] = useState(slots[0]?.start || "09:00");
  const [newStaffUsualEnd, setNewStaffUsualEnd] = useState(slots[0]?.end || "17:00");
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingCell, setEditingCell] = useState(null); // `${staffId}__${date}`
  const [adminRole, setAdminRole] = useState("operator"); // 'operator' (運営) | 'store' (店舗管理者)
  const [unlockedPostings, setUnlockedPostings] = useState({}); // pk -> true, session-only, not persisted
  const [pwDrafts, setPwDrafts] = useState({}); // pk -> password being typed (for setting or unlocking)
  const [deadlineDrafts, setDeadlineDrafts] = useState({}); // pk -> { date, time }
  const [recruitCountDrafts, setRecruitCountDrafts] = useState({}); // pk -> number of people to recruit for this posting
  const [operatorUnlocked, setOperatorUnlocked] = useState(false);
  const [operatorPwDraft, setOperatorPwDraft] = useState("");
  const [newStorePw, setNewStorePw] = useState("");
  const [storeRoleUnlocked, setStoreRoleUnlocked] = useState(false);
  const [lockedStore, setLockedStore] = useState(""); // store this session is authenticated for, once store-role unlocked
  const [loginStoreChoice, setLoginStoreChoice] = useState(storeList.filter(Boolean)[0] || storeName);
  const [loginStep, setLoginStep] = useState("choose"); // 'choose' | 'password'
  const [storeGatePwDraft, setStoreGatePwDraft] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [editingPostingPk, setEditingPostingPk] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  useEffect(() => {
    (async () => {
      const session = await loadJSON("adminAuthSession", null, false);
      if (session && Date.now() - new Date(session.unlockedAt).getTime() < AUTH_SESSION_MS) {
        if (session.role === "operator") {
          setAdminRole("operator");
          setOperatorUnlocked(true);
        } else if (session.role === "store" && session.store) {
          setAdminRole("store");
          setStoreRoleUnlocked(true);
          setLockedStore(session.store);
          setStoreName(session.store);
        }
      }
      setAuthChecked(true);
    })();
  }, []);

  const saveAuthSession = (role, store) => {
    saveJSON("adminAuthSession", { role, store: store || null, unlockedAt: new Date().toISOString() }, false);
  };

  const canManagePosting = (pk, posting) => (adminRole === "operator" && operatorUnlocked) || !posting?.password || unlockedPostings[pk];
  const [editingRequiredKey, setEditingRequiredKey] = useState(null);
  const slotDayCounts = (slot) => slot.daysRequired || (slot.days ? slot.days.map((d) => (d ? slot.required : 0)) : Array(7).fill(slot.required));
  const getRequired = (dayIdx, slot) => {
    const rk = `${weekStart}__${dayIdx}__${slot.id}`;
    if (requiredOverrides[rk] !== undefined) return requiredOverrides[rk]; // 3. specific-date exception (highest priority)
    return slotDayCounts(slot)[dayIdx]; // 2. weekday pattern, falls back to 1. slot base if not set
  };
  const setRequiredFor = (dayIdx, slot, value) => {
    const rk = `${weekStart}__${dayIdx}__${slot.id}`;
    persistRequiredOverrides({ ...requiredOverrides, [rk]: value });
  };
  const resetRequiredFor = (dayIdx, slot) => {
    const rk = `${weekStart}__${dayIdx}__${slot.id}`;
    const next = { ...requiredOverrides };
    delete next[rk];
    persistRequiredOverrides(next);
  };

  const [editingTimeKey, setEditingTimeKey] = useState(null);
  const [assignPickerKey, setAssignPickerKey] = useState(null); // `${dayIdx}__${slotId}`
  const [timeDraft, setTimeDraft] = useState({ start: "", end: "" });
  const atKey = (dayIdx, slotId, staffId) => `${weekStart}__${dayIdx}__${slotId}__${staffId}`;
  const getAssignmentTime = (dayIdx, slot, staffId) => {
    const ov = assignmentTimeOverrides[atKey(dayIdx, slot.id, staffId)];
    if (ov) {
      const s = parseHour(ov.start);
      let e = parseHour(ov.end);
      if (e <= s) e += 24;
      return { start: ov.start, end: ov.end, startHour: s, hours: e - s, isOverride: true };
    }
    const geom = slotGeom[slot.id];
    return { start: slot.start, end: slot.end, startHour: geom.startHour, hours: geom.hours, isOverride: false };
  };
  const saveAssignmentTime = (dayIdx, slotId, staffId) => {
    const k = atKey(dayIdx, slotId, staffId);
    persistAssignmentTimeOverrides({ ...assignmentTimeOverrides, [k]: { start: timeDraft.start, end: timeDraft.end } });
    setEditingTimeKey(null);
  };
  const resetAssignmentTime = (dayIdx, slotId, staffId) => {
    const k = atKey(dayIdx, slotId, staffId);
    const next = { ...assignmentTimeOverrides };
    delete next[k];
    persistAssignmentTimeOverrides(next);
    setEditingTimeKey(null);
  };

  const storeStaff = staff.filter((p) => !p.isGig && (p.homeStore || storeList.filter(Boolean)[0] || storeName) === storeName);
  useEffect(() => {
    if (!storeStaff.some((p) => p.id === selectedStaffId)) {
      setSelectedStaffId(storeStaff[0]?.id || "");
    }
  }, [storeName, storeStaff.length]);
  const storeSlotIds = new Set(slots.map((s) => s.id));
  const ganttStaff = [
    ...storeStaff,
    ...staff.filter((p) => p.isGig && Object.entries(assignments).some(([k, ids]) => ids.includes(p.id) && storeSlotIds.has(k.split("__")[2]))),
  ];
  const unlockPosting = (pk, posting) => {
    if ((pwDrafts[pk] || "") === posting.password) {
      setUnlockedPostings((prev) => ({ ...prev, [pk]: true }));
    } else {
      alert("パスワードが違います");
    }
  };

  const key = (dayIdx, slotId) => `${weekStart}__${dayIdx}__${slotId}`;

  const slotGeom = useMemo(() => {
    const g = {};
    slots.forEach((s) => {
      const start = parseHour(s.start);
      let end = parseHour(s.end);
      if (end <= start) end += 24;
      g[s.id] = { startHour: start, hours: end - start };
    });
    return g;
  }, [slots]);

  const [lastToggle, setLastToggle] = useState(null); // { dayIdx, slotId, staffId, wasAssigned, name }
  const [actionPanelKey, setActionPanelKey] = useState(null); // `${weekStart}__${dayIdx}__${slotId}__${staffId}`
  const toggleAssign = (dayIdx, slotId, staffId) => {
    const k = key(dayIdx, slotId);
    const cur = assignments[k] || [];
    const wasAssigned = cur.includes(staffId);
    if (!wasAssigned) {
      const slot = slots.find((s) => s.id === slotId);
      const req = slot ? getRequired(dayIdx, slot) : 0;
      if (cur.length >= req) {
        alert(`この時間帯はすでに必要人数（${req}名）に達しています。追加する場合は、先に必要人数を増やすか、他の人を外してください。`);
        return;
      }
    }
    const next = wasAssigned ? cur.filter((x) => x !== staffId) : [...cur, staffId];
    persistAssignments({ ...assignments, [k]: next });
    const tKey = atKey(dayIdx, slotId, staffId);
    if (!wasAssigned) {
      const slot = slots.find((s) => s.id === slotId);
      if (slot?.defaultTasks?.length) {
        persistTaskAssignments({ ...taskAssignments, [tKey]: slot.defaultTasks });
      }
    } else if (taskAssignments[tKey]) {
      const nextTasks = { ...taskAssignments };
      delete nextTasks[tKey];
      persistTaskAssignments(nextTasks);
    }
    const p = staff.find((x) => x.id === staffId);
    setLastToggle({ dayIdx, slotId, staffId, wasAssigned, name: p?.name || "" });
    setTimeout(() => setLastToggle((cur2) => (cur2 && cur2.staffId === staffId && cur2.dayIdx === dayIdx && cur2.slotId === slotId ? null : cur2)), 6000);
  };
  const undoLastToggle = () => {
    if (!lastToggle) return;
    toggleAssign(lastToggle.dayIdx, lastToggle.slotId, lastToggle.staffId);
    setLastToggle(null);
  };

  const addStaff = () => {
    if (!newStaffName.trim()) return;
    const parsedWage = parseInt(newStaffWage, 10);
    const wage = Number.isNaN(parsedWage) ? 1033 : parsedWage;
    const contractHours = Number(newStaffContractHours) || 28;
    persistRoster([...staff, {
      id: nextId("p"), name: newStaffName.trim(), wage, type: newStaffType,
      maxHours: contractHours, nightOk: false, maxConsecutive: 5,
      hireDate: newStaffHireDate, grantDate: "", annualGrantedDays: 0,
      contractType: newStaffContractType, contractHours,
      usualStart: newStaffUsualStart, usualEnd: newStaffUsualEnd, pin: newStaffPin.replace(/\D/g, "").slice(0, 3), note: "",
      homeStore: storeName,
    }]);
    setNewStaffName(""); setNewStaffWage(1033); setNewStaffContractType("fixed"); setNewStaffContractHours(CONTRACT_PRESETS[0]);
    setNewStaffType(EMPLOYMENT_TYPES[2]); setNewStaffHireDate(""); setNewStaffUsualStart(slots[0]?.start || "09:00"); setNewStaffUsualEnd(slots[0]?.end || "17:00"); setNewStaffPin("");
    setShowAddStaffForm(false);
  };
  const removeStaff = (id) => {
    persistRoster(staff.filter((p) => p.id !== id));
    const nextA = {};
    Object.entries(assignments).forEach(([k, arr]) => (nextA[k] = arr.filter((x) => x !== id)));
    persistAssignments(nextA);
  };
  const updateStaffField = (id, field, value) => {
    persistRoster(staff.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const updateSlotField = (id, field, value) => {
    persistSlots(slots.map((s) => (s.id === id ? { ...s, [field]: field === "required" ? Number(value) : value } : s)));
  };
  const updateSlotDayCount = (id, dayIdx, value) => {
    persistSlots(slots.map((s) => {
      if (s.id !== id) return s;
      const daysRequired = slotDayCounts(s);
      daysRequired[dayIdx] = Math.max(0, Number(value) || 0);
      return { ...s, daysRequired };
    }));
  };
  const toggleSlotDefaultTask = (id, task) => {
    persistSlots(slots.map((s) => {
      if (s.id !== id) return s;
      const current = s.defaultTasks || [];
      const next = current.includes(task) ? current.filter((t) => t !== task) : [...current, task];
      return { ...s, defaultTasks: next };
    }));
  };
  const addSlot = () => persistSlots([...slots, { id: nextId("s"), label: "新規", start: "00:00", end: "04:00", required: 2, daysRequired: Array(7).fill(2) }]);
  const removeSlot = (id) => {
    persistSlots(slots.filter((s) => s.id !== id));
    const nextA = {};
    Object.entries(assignments).forEach(([k, v]) => { if (!k.endsWith(`__${id}`)) nextA[k] = v; });
    persistAssignments(nextA);
  };

  const [mergeProposal, setMergeProposal] = useState(null); // array of merged slot proposals, or null if not computed/shown

  const formatHM = (totalMinutes) => {
    const m = ((totalMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, "0")}`;
  };

  const computeMergeProposal = () => {
    // Represent every slot's time range in minutes-from-midnight, extending overnight slots
    // past 1440 so a simple linear sweep can merge overlapping ranges correctly.
    const intervals = slots.map((s) => {
      const startMin = Math.round(parseHour(s.start) * 60);
      let endMin = Math.round(parseHour(s.end) * 60);
      if (endMin <= startMin) endMin += 1440;
      return { startMin, endMin, daysRequired: slotDayCounts(s) };
    });
    intervals.sort((a, b) => a.startMin - b.startMin);

    const merged = [];
    intervals.forEach((iv) => {
      const last = merged[merged.length - 1];
      if (last && iv.startMin < last.endMin) {
        // overlapping or touching an existing merged band — extend it and union the active weekdays
        last.endMin = Math.max(last.endMin, iv.endMin);
        last.daysActive = last.daysActive.map((active, d) => active || iv.daysRequired[d] > 0);
      } else {
        merged.push({ startMin: iv.startMin, endMin: iv.endMin, daysActive: iv.daysRequired.map((v) => v > 0) });
      }
    });

    const proposal = merged.map((m, i) => ({
      id: nextId("s"),
      label: `${formatHM(m.startMin)}-${formatHM(m.endMin)}`,
      start: formatHM(m.startMin),
      end: formatHM(m.endMin),
      required: 2,
      daysRequired: m.daysActive.map((active) => (active ? 2 : 0)),
    }));
    setMergeProposal(proposal);
  };

  const adoptMergeProposal = () => {
    if (!mergeProposal) return;
    if (!confirm("今の時間帯設定を、提案した重ならない時間帯に置き換えます。よろしいですか？（今週以降のシフトの割り当ては、時間帯のIDが変わるため一度リセットが必要になる場合があります）")) return;
    persistSlots(mergeProposal);
    setMergeProposal(null);
  };

  const applySubmission = (staffId, date) => {
    const subsForDay = submissions.filter((s) => s.staffId === staffId && s.date === date);
    if (!subsForDay.length) return;
    const sub = subsForDay[subsForDay.length - 1];
    persistOverrides({ ...overrides, [`${staffId}__${date}`]: { available: sub.available, start: sub.start, end: sub.end } });
  };
  const setOverride = (staffId, date, patch) => {
    const k = `${staffId}__${date}`;
    const cur = overrides[k] || effectiveWindow(staffId, date);
    persistOverrides({ ...overrides, [k]: { available: cur.available, start: cur.start, end: cur.end, ...patch } });
  };
  const clearOverride = (staffId, date) => {
    const k = `${staffId}__${date}`;
    const next = { ...overrides };
    delete next[k];
    persistOverrides(next);
  };

  const perStaffStats = useMemo(() => {
    const stats = {};
    staff.forEach((p) => (stats[p.id] = { hours: 0, cost: 0, days: new Set() }));
    weekDates.forEach((date, dayIdx) => {
      slots.forEach((slot) => {
        const ids = assignments[key(dayIdx, slot.id)] || [];
        const geom = slotGeom[slot.id];
        if (!geom) return;
        ids.forEach((id) => {
          if (!stats[id]) return;
          const hrs = getAssignmentTime(dayIdx, slot, id).hours;
          stats[id].hours += hrs;
          stats[id].days.add(dayIdx);
          const p = staff.find((x) => x.id === id);
          if (p) stats[id].cost += hrs * p.wage;
        });
      });
    });
    return stats;
  }, [assignments, slotGeom, staff, weekDates, slots, assignmentTimeOverrides]);

  const totalCost = Object.values(perStaffStats).reduce((s, x) => s + x.cost, 0);
  const totalHours = Object.values(perStaffStats).reduce((s, x) => s + x.hours, 0);

  const [laborMonthOffset, setLaborMonthOffset] = useState(0); // shared by operator's cross-store view and store's own view
  const [operatorDetailStore, setOperatorDetailStore] = useState("");

  // This store's staff, broken down by MONTH (not just the currently-viewed week).
  const monthlyPerStaffStats = useMemo(() => {
    const base = new Date();
    const target = new Date(base.getFullYear(), base.getMonth() + laborMonthOffset, 1);
    const monthPrefix = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
    const stats = {};
    staff.forEach((p) => (stats[p.id] = { hours: 0, cost: 0 }));
    Object.entries(assignments).forEach(([k, ids]) => {
      if (!ids?.length) return;
      const parts = k.split("__");
      const ws = parts[0];
      const dayIdx = Number(parts[1]);
      const slotId = parts.slice(2).join("__");
      const date = addDays(ws, dayIdx);
      if (!date.startsWith(monthPrefix)) return;
      const slot = slots.find((s) => s.id === slotId); // current store's slots only
      if (!slot) return;
      const s0 = parseHour(slot.start);
      let e0 = parseHour(slot.end);
      if (e0 <= s0) e0 += 24;
      const baseHours = e0 - s0;
      ids.forEach((id) => {
        if (!stats[id]) return;
        const p = staff.find((x) => x.id === id);
        if (!p) return;
        const ov = assignmentTimeOverrides[`${ws}__${dayIdx}__${slotId}__${id}`];
        let hrs = baseHours;
        if (ov) {
          const os = parseHour(ov.start);
          let oe = parseHour(ov.end);
          if (oe <= os) oe += 24;
          hrs = oe - os;
        }
        stats[id].hours += hrs;
        stats[id].cost += hrs * p.wage;
      });
    });
    return stats;
  }, [assignments, slots, staff, assignmentTimeOverrides, laborMonthOffset]);
  const monthlyTotalCost = Object.values(monthlyPerStaffStats).reduce((s, x) => s + x.cost, 0);
  const monthlyTotalHours = Object.values(monthlyPerStaffStats).reduce((s, x) => s + x.hours, 0);
  const monthlyLaborRatio = weeklySales > 0 ? (monthlyTotalCost / weeklySales) * 100 : 0;

  // Aggregated by calendar MONTH (scans every stored week, not just the one on screen) and broken
  // down per store — used by the operator's company-wide summary and by each store's own summary.
  const monthlyLaborSummary = useMemo(() => {
    const base = new Date();
    const target = new Date(base.getFullYear(), base.getMonth() + laborMonthOffset, 1);
    const monthLabel = `${target.getFullYear()}年${target.getMonth() + 1}月`;
    const monthPrefix = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
    // slotId -> { store, slot } lookup, since assignment keys only carry the slotId
    const slotOwner = {};
    Object.entries(slotsByStore).forEach(([storeN, storeSlots]) => {
      (storeSlots || []).forEach((slot) => { slotOwner[slot.id] = { storeN, slot }; });
    });
    let cost = 0, hours = 0;
    const perStoreCost = {};
    Object.entries(assignments).forEach(([k, ids]) => {
      if (!ids?.length) return;
      const parts = k.split("__");
      const ws = parts[0];
      const dayIdx = Number(parts[1]);
      const slotId = parts.slice(2).join("__");
      const date = addDays(ws, dayIdx);
      if (!date.startsWith(monthPrefix)) return;
      const owner = slotOwner[slotId];
      if (!owner) return;
      const { storeN, slot } = owner;
      const s0 = parseHour(slot.start);
      let e0 = parseHour(slot.end);
      if (e0 <= s0) e0 += 24;
      const baseHours = e0 - s0;
      ids.forEach((id) => {
        const p = staff.find((x) => x.id === id);
        if (!p) return;
        const ov = assignmentTimeOverrides[`${ws}__${dayIdx}__${slotId}__${id}`];
        let hrs = baseHours;
        if (ov) {
          const os = parseHour(ov.start);
          let oe = parseHour(ov.end);
          if (oe <= os) oe += 24;
          hrs = oe - os;
        }
        if (!perStoreCost[storeN]) perStoreCost[storeN] = { cost: 0, hours: 0 };
        perStoreCost[storeN].hours += hrs;
        perStoreCost[storeN].cost += hrs * p.wage;
        hours += hrs;
        cost += hrs * p.wage;
      });
    });
    return { cost, hours, perStoreCost, monthLabel };
  }, [assignments, slotsByStore, staff, assignmentTimeOverrides, laborMonthOffset]);

  // Per-staff monthly breakdown for whichever store the operator selects to drill into.
  const operatorDetailStats = useMemo(() => {
    if (!operatorDetailStore) return null;
    const base = new Date();
    const target = new Date(base.getFullYear(), base.getMonth() + laborMonthOffset, 1);
    const monthPrefix = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
    const storeSlots = slotsByStore[operatorDetailStore] || [];
    const storeStaffList = staff.filter((p) => (p.homeStore || operatorDetailStore) === operatorDetailStore);
    const stats = {};
    storeStaffList.forEach((p) => (stats[p.id] = { hours: 0, cost: 0 }));
    Object.entries(assignments).forEach(([k, ids]) => {
      if (!ids?.length) return;
      const parts = k.split("__");
      const ws = parts[0];
      const dayIdx = Number(parts[1]);
      const slotId = parts.slice(2).join("__");
      const date = addDays(ws, dayIdx);
      if (!date.startsWith(monthPrefix)) return;
      const slot = storeSlots.find((s) => s.id === slotId);
      if (!slot) return;
      const s0 = parseHour(slot.start);
      let e0 = parseHour(slot.end);
      if (e0 <= s0) e0 += 24;
      const baseHours = e0 - s0;
      ids.forEach((id) => {
        if (!stats[id]) return;
        const p = staff.find((x) => x.id === id);
        if (!p) return;
        const ov = assignmentTimeOverrides[`${ws}__${dayIdx}__${slotId}__${id}`];
        let hrs = baseHours;
        if (ov) {
          const os = parseHour(ov.start);
          let oe = parseHour(ov.end);
          if (oe <= os) oe += 24;
          hrs = oe - os;
        }
        stats[id].hours += hrs;
        stats[id].cost += hrs * p.wage;
      });
    });
    return { storeStaffList, stats };
  }, [assignments, slotsByStore, staff, assignmentTimeOverrides, laborMonthOffset, operatorDetailStore]);

  const laborRatio = weeklySales > 0 ? (totalCost / weeklySales) * 100 : 0;
  const ratioOver = laborRatio > targetRatio;

  const conflictCount = useMemo(() => {
    let n = 0;
    weekDates.forEach((date, dayIdx) => {
      slots.forEach((slot) => {
        const geom = slotGeom[slot.id];
        if (!geom) return;
        const ids = assignments[key(dayIdx, slot.id)] || [];
        ids.forEach((id) => {
          const p = staff.find((x) => x.id === id);
          if (!p) return;
          const win = effectiveWindow(id, date);
          if (availabilityConflict(win, geom)) n++;
          else if (!personNightOk(p) && isNightSlot(geom)) n++;
          else if (isUnderSixMonths(p.hireDate, fmtISO(new Date()))) n++;
        });
      });
    });
    staff.forEach((p) => {
      if ((perStaffStats[p.id]?.hours || 0) > (p.maxHours || 9999)) n++;
      if (longestConsecutive(perStaffStats[p.id]?.days || new Set()) > p.maxConsecutive) n++;
    });
    return n;
  }, [assignments, slotGeom, staff, weekDates, slots, perStaffStats, effectiveWindow]);

  // Checks, minute by minute within each slot's own time span, whether the ACTUAL number of
  // people covering that moment (using each person's real clipped hours, not just "assigned to
  // this slot") ever falls below the required headcount — catching cases where the slot's total
  // headcount looks fine on paper but the timing doesn't actually overlap enough.
  const coverageGapsList = useMemo(() => {
    const gaps = [];
    weekDates.forEach((date, dayIdx) => {
      slots.forEach((slot) => {
        const ids = assignments[key(dayIdx, slot.id)] || [];
        if (ids.length === 0) return; // handled separately by the "不足" empty-slot indicator
        const req = getRequired(dayIdx, slot);
        if (req <= 0) return;
        const slotStart = parseHour(slot.start);
        let slotEnd = parseHour(slot.end);
        if (slotEnd <= slotStart) slotEnd += 24;
        const events = [];
        ids.forEach((staffId) => {
          const t = getAssignmentTime(dayIdx, slot, staffId);
          let s = t.startHour;
          let e = s + t.hours;
          while (e < slotStart) { s += 24; e += 24; }
          while (s > slotEnd) { s -= 24; e -= 24; }
          events.push([s, 1]);
          events.push([e, -1]);
        });
        events.sort((a, b) => a[0] - b[0]);
        let count = 0;
        let prevTime = slotStart;
        const rawGaps = [];
        events.forEach(([t, delta]) => {
          const clampedT = Math.max(slotStart, Math.min(slotEnd, t));
          if (clampedT > prevTime + 0.001 && count < req) rawGaps.push([prevTime, clampedT, count]);
          prevTime = clampedT;
          count += delta;
        });
        if (prevTime < slotEnd - 0.001 && count < req) rawGaps.push([prevTime, slotEnd, count]);
        const merged = [];
        rawGaps.forEach(([s, e, c]) => {
          const last = merged[merged.length - 1];
          if (last && last[2] === c && Math.abs(last[1] - s) < 0.001) last[1] = e;
          else merged.push([s, e, c]);
        });
        if (merged.length > 0) {
          gaps.push({
            dayIdx, date, slot, req,
            segments: merged.map(([s, e, c]) => ({ start: formatHM(Math.round(s * 60)), end: formatHM(Math.round(e * 60)), count: c })),
          });
        }
      });
    });
    return gaps;
  }, [assignments, slots, weekDates, assignmentTimeOverrides, requiredOverrides]);

  const violationsList = useMemo(() => {
    const list = [];
    weekDates.forEach((date, dayIdx) => {
      slots.forEach((slot) => {
        const geom = slotGeom[slot.id];
        if (!geom) return;
        const ids = assignments[key(dayIdx, slot.id)] || [];
        ids.forEach((id) => {
          const p = staff.find((x) => x.id === id);
          if (!p) return;
          const win = effectiveWindow(id, date);
          const availReason = availabilityConflict(win, geom);
          const nightConflict = !personNightOk(p) && isNightSlot(geom);
          const tenureConflict = isUnderSixMonths(p.hireDate, fmtISO(new Date()));
          const reasons = [availReason, nightConflict && "深夜不可", tenureConflict && "入社6ヶ月未満"].filter(Boolean);
          if (reasons.length) list.push({ type: "condition", date, slotLabel: slot.label, name: p.name, staffId: p.id, detail: reasons.join("・") });
        });
      });
    });
    storeStaff.forEach((p) => {
      const hours = perStaffStats[p.id]?.hours || 0;
      if (hours > (p.maxHours || 9999)) list.push({ type: "over", name: p.name, staffId: p.id, detail: `週の勤務時間 ${hours}h（上限${p.maxHours}h）` });
      const run = longestConsecutive(perStaffStats[p.id]?.days || new Set());
      if (run > p.maxConsecutive) list.push({ type: "consecutive", name: p.name, staffId: p.id, detail: `連続${run}日勤務（上限${p.maxConsecutive}日）` });
      if ((perStaffStats[p.id]?.days.size || 0) >= 7) list.push({ type: "rest", name: p.name, staffId: p.id, detail: "法定休日なし（週7日勤務）" });
    });
    return list;
  }, [assignments, slotGeom, staff, storeStaff, weekDates, slots, perStaffStats, effectiveWindow]);

  const leaderCountMonth = useMemo(() => {
    const base = new Date();
    const target = new Date(base.getFullYear(), base.getMonth() + leaderCountMonthOffset, 1);
    const ty = target.getFullYear();
    const tm = target.getMonth();
    const monthLabel = `${ty}年${tm + 1}月`;
    const counts = {}; // staffId -> count
    Object.entries(assignments).forEach(([k, ids]) => {
      const parts = k.split("__");
      const ws = parts[0];
      const dayIdx = Number(parts[1]);
      const slotId = parts.slice(2).join("__");
      const date = addDays(ws, dayIdx);
      const d = new Date(date + "T00:00:00");
      if (d.getFullYear() !== ty || d.getMonth() !== tm) return;
      (ids || []).forEach((staffId) => {
        const p = staff.find((x) => x.id === staffId);
        if (!p || p.homeStore !== storeName) return;
        const isLeaderShift = p.isLeader || (taskAssignments[`${ws}__${dayIdx}__${slotId}__${staffId}`] || []).includes("👑 リーダー");
        if (isLeaderShift) counts[staffId] = (counts[staffId] || 0) + 1;
      });
    });
    const rows = Object.entries(counts)
      .map(([staffId, count]) => ({ staffId, count, name: staff.find((p) => p.id === staffId)?.name || "?" }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));
    return { monthLabel, rows };
  }, [assignments, taskAssignments, staff, storeName, leaderCountMonthOffset]);

  const [gigWage, setGigWage] = useState(0);
  const [copiedGapId, setCopiedGapId] = useState("");
  const [copiedAllGaps, setCopiedAllGaps] = useState(false);

  const gapShifts = useMemo(() => {
    const gaps = [];
    weekDates.forEach((date, dayIdx) => {
      slots.forEach((slot) => {
        const ids = assignments[key(dayIdx, slot.id)] || [];
        const req = getRequired(dayIdx, slot);
        if (ids.length < req) {
          gaps.push({ id: `${date}__${slot.id}`, date, dayIdx, slot, have: ids.length, need: req, short: req - ids.length });
        }
      });
    });
    return gaps;
  }, [weekDates, slots, assignments]);

  const [autoAssignResult, setAutoAssignResult] = useState(null);

  const effectiveWindowFrom = (overridesMap, subsList, staffId, date) => {
    const ov = overridesMap[`${staffId}__${date}`];
    if (ov) return { ...ov, source: "override" };
    const subsForDay = subsList.filter((s) => s.staffId === staffId && s.date === date);
    if (subsForDay.length) {
      const sub = subsForDay[subsForDay.length - 1];
      return { available: sub.available, start: sub.start, end: sub.end, note: sub.note, leave: sub.leave || null, manual: sub.manual !== undefined ? sub.manual : true, source: "submission" };
    }
    return { available: true, start: "00:00", end: "24:00", source: "unknown" };
  };

  // Pure fill function: takes explicit assignments/submissions/staff instead of reading from
  // component state, so it can be reused both by the live "自動割り当て" button (using current
  // state) and by the demo-fill flow (using freshly-seeded local data that hasn't hit state yet).
  // Given a slot's full time span and a person's own preferred/submitted window, returns a
  // narrower {start, end} to use as their actual worked time if their preference doesn't cover
  // the whole slot — or null if their preference already covers the full slot (no override needed).
  const clipToSlot = (slotStart, slotEnd, winStart, winEnd) => {
    if (!winStart || !winEnd) return null;
    const s0 = parseHour(slotStart);
    let e0 = parseHour(slotEnd);
    if (e0 <= s0) e0 += 24;
    let ws = parseHour(winStart);
    let we = parseHour(winEnd);
    if (we <= ws) we += 24;
    // Align the submitted window into the same 24h cycle as the slot, trying the closest match.
    while (ws < s0 - 24) { ws += 24; we += 24; }
    while (ws > s0 + 24) { ws -= 24; we -= 24; }
    const clippedStart = Math.max(s0, ws);
    const clippedEnd = Math.min(e0, we);
    if (clippedStart <= s0 + 0.001 && clippedEnd >= e0 - 0.001) return null; // covers the full slot already
    if (clippedEnd - clippedStart < 0.25) return null; // degenerate/near-zero overlap — leave as full slot
    return { start: formatHM(Math.round(clippedStart * 60)), end: formatHM(Math.round(clippedEnd * 60)) };
  };

  const autoFillFrom = (baseAssignments, subsList, staffList, weekDatesList, slotsList, overridesMap, baseTaskAssignments, baseTimeOverrides) => {
    const nextAssignments = { ...baseAssignments };
    const nextTaskAssignments = { ...(baseTaskAssignments || {}) };
    const nextTimeOverrides = { ...(baseTimeOverrides || {}) };
    const runningHours = {};
    const usedSlotsToday = {};
    staffList.forEach((p) => { runningHours[p.id] = 0; usedSlotsToday[p.id] = []; });

    weekDatesList.forEach((date, dayIdx) => {
      slotsList.forEach((slot) => {
        const ids = nextAssignments[key(dayIdx, slot.id)] || [];
        const geom = slotGeom[slot.id];
        if (!geom) return;
        ids.forEach((id) => {
          if (runningHours[id] === undefined) return;
          runningHours[id] += geom.hours;
          usedSlotsToday[id].push({ dayIdx, startHour: geom.startHour, hours: geom.hours });
        });
      });
    });

    // Seed task-mark counts from this month's existing assignments, so marks stay balanced
    // over time rather than resetting to zero on every auto-assign run.
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const taskCounts = {}; // taskLabel -> staffId -> count
    const lastTaskAssignee = {}; // `${slotId}__${task}` -> staffId who had it the last time this slot was staffed
    Object.entries(nextTaskAssignments).forEach(([tk, tasks]) => {
      const tparts = tk.split("__");
      const tws = tparts[0];
      const tDayIdx = Number(tparts[1]);
      const tStaffId = tparts[tparts.length - 1];
      const tSlotId = tparts.slice(2, tparts.length - 1).join("__");
      const tDate = addDays(tws, tDayIdx);
      if (!tDate.startsWith(monthPrefix)) return;
      (tasks || []).forEach((task) => {
        if (!taskCounts[task]) taskCounts[task] = {};
        taskCounts[task][tStaffId] = (taskCounts[task][tStaffId] || 0) + 1;
      });
    });

    let filledCount = 0;
    weekDatesList.forEach((date, dayIdx) => {
      slotsList.forEach((slot) => {
        const k = key(dayIdx, slot.id);
        let ids = nextAssignments[k] || [];
        const req = getRequired(dayIdx, slot);
        const geom = slotGeom[slot.id];
        if (!geom) return;
        while (ids.length < req) {
          const candidates = staffList.filter((p) => {
            if (ids.includes(p.id)) return false;
            const win = effectiveWindowFrom(overridesMap, subsList, p.id, date);
            if (win.source !== "submission" && win.source !== "override") return false;
            if (!hasOverlapAvailability(win, geom)) return false;
            if (!personNightOk(p) && isNightSlot(geom)) return false;
            if (runningHours[p.id] + geom.hours > (p.maxHours || 9999)) return false;
            const overlaps = usedSlotsToday[p.id].some((u) => u.dayIdx === dayIdx && geom.startHour < u.startHour + u.hours && u.startHour < geom.startHour + geom.hours);
            if (overlaps) return false;
            if (isUnderSixMonths(p.hireDate, fmtISO(new Date()))) {
              const alreadyHasNewHire = ids.some((id) => {
                const other = staffList.find((s) => s.id === id);
                return other && isUnderSixMonths(other.hireDate, fmtISO(new Date()));
              });
              if (alreadyHasNewHire) return false;
            }
            return true;
          });
          if (candidates.length === 0) break;
          candidates.sort((a, b) => runningHours[a.id] - runningHours[b.id] || a.name.localeCompare(b.name, "ja"));
          const chosen = candidates[0];
          const chosenWin = effectiveWindowFrom(overridesMap, subsList, chosen.id, date);
          const clipped = clipToSlot(slot.start, slot.end, chosenWin.start, chosenWin.end);
          let actualHours = geom.hours;
          let actualStartHour = geom.startHour;
          if (clipped) {
            const tk = atKey(dayIdx, slot.id, chosen.id);
            nextTimeOverrides[tk] = clipped;
            let cs = parseHour(clipped.start);
            let ce = parseHour(clipped.end);
            if (ce <= cs) ce += 24;
            actualHours = ce - cs;
            actualStartHour = cs;
          }
          ids = [...ids, chosen.id];
          nextAssignments[k] = ids;
          runningHours[chosen.id] += actualHours;
          usedSlotsToday[chosen.id].push({ dayIdx, startHour: actualStartHour, hours: actualHours });
          filledCount++;
        }
        // Distribute this slot's default task marks (cleaning duties etc.) across whoever ended up
        // assigned today — spread across different people rather than piling on one, and avoid
        // repeating the same person on the same task from the last day this slot was staffed.
        // "👑 リーダー" is excluded: leadership is either a standing qualification (auto-shown) or
        // manually set per-shift, so it doesn't need rotation and can freely stack with other marks.
        const rotatingTasks = (slot.defaultTasks || []).filter((t) => t !== "👑 リーダー");
        if (rotatingTasks.length > 0 && ids.length > 0) {
          rotatingTasks.forEach((task) => {
            const lastKey = `${slot.id}__${task}`;
            const lastPerson = lastTaskAssignee[lastKey];
            const busyToday = (id) => (nextTaskAssignments[atKey(dayIdx, slot.id, id)] || []).length > 0;
            let pool = ids.filter((id) => id !== lastPerson && !busyToday(id));
            if (pool.length === 0) pool = ids.filter((id) => !busyToday(id));
            if (pool.length === 0) pool = ids.filter((id) => id !== lastPerson);
            if (pool.length === 0) pool = ids;
            pool.sort((a, b) => (taskCounts[task]?.[a] || 0) - (taskCounts[task]?.[b] || 0));
            const chosenId = pool[0];
            const tk2 = atKey(dayIdx, slot.id, chosenId);
            nextTaskAssignments[tk2] = [...(nextTaskAssignments[tk2] || []), task];
            taskCounts[task] = taskCounts[task] || {};
            taskCounts[task][chosenId] = (taskCounts[task][chosenId] || 0) + 1;
            lastTaskAssignee[lastKey] = chosenId;
          });
        }
      });
    });

    return { nextAssignments, nextTaskAssignments, nextTimeOverrides, filledCount };
  };

  const autoAssignBase = () => {
    const { nextAssignments, nextTaskAssignments, nextTimeOverrides, filledCount } = autoFillFrom(assignments, submissions, storeStaff, weekDates, slots, overrides, taskAssignments, assignmentTimeOverrides);
    persistAssignments(nextAssignments);
    persistTaskAssignments(nextTaskAssignments);
    persistAssignmentTimeOverrides(nextTimeOverrides);
    setAutoAssignResult(filledCount);
    setTimeout(() => setAutoAssignResult(null), 4000);
  };

  const swapPostings = useMemo(() => {
    const list = [];
    Object.entries(postings).forEach(([pk, posting]) => {
      if (!posting?.open || !posting.replacingStaffId) return;
      const parts = pk.split("__");
      if (parts.length < 3) return;
      const [weekStartPart, date, slotId] = parts;
      const slot = allSlots.find((s) => s.id === slotId);
      if (!slot) return;
      const dayIdx = Math.round((new Date(date + "T00:00:00") - new Date(weekStartPart + "T00:00:00")) / 86400000);
      const replacingPerson = staff.find((p) => p.id === posting.replacingStaffId);
      list.push({ pk, weekStartPart, date, dayIdx, slot, posting, replacingPerson });
    });
    return list.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [postings, allSlots, staff]);

  // 募集成立（承認された応募が1件以上ある募集）の月別・店舗別件数
  const fulfillmentHistory = useMemo(() => {
    const byStoreMonth = {}; // store -> month -> count
    Object.entries(postings).forEach(([pk, posting]) => {
      const applicants = posting?.applicants || {};
      const approvedCount = Object.values(applicants).filter((a) => a.status === "approved").length;
      if (approvedCount === 0) return;
      const parts = pk.split("__");
      if (parts.length < 3) return;
      const date = parts[1];
      const month = date.slice(0, 7);
      const store = posting.helpStore || "—";
      if (!byStoreMonth[store]) byStoreMonth[store] = {};
      byStoreMonth[store][month] = (byStoreMonth[store][month] || 0) + 1;
    });
    return byStoreMonth;
  }, [postings]);

  const effectiveGigWage = gigWage || Math.max(...staff.map((p) => p.wage), 1100) + 100;

  const buildGapText = (gap) =>
    [
      `【スキマバイト募集】${storeName}`,
      `日時：${dispShort(gap.date)} ${gap.slot.start}〜${gap.slot.end}`,
      `募集人数：${gap.short}名`,
      `時給：¥${effectiveGigWage}`,
      `業務内容：レジ・品出し・接客など（${gap.slot.label}）`,
      `持ち物：動きやすい服装`,
      `集合場所：（店舗住所を記入してください）`,
    ].join("\n");

  const copyGap = (gap) => {
    navigator.clipboard?.writeText(buildGapText(gap)).then(() => {
      setCopiedGapId(gap.id);
      setTimeout(() => setCopiedGapId(""), 2000);
    });
  };

  const copyAllGaps = () => {
    const text = gapShifts.map((g) => buildGapText(g)).join("\n\n---\n\n");
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedAllGaps(true);
      setTimeout(() => setCopiedAllGaps(false), 2000);
    });
  };

  const copyAsText = () => {
    const lines = [`■ ${storeName}　シフト表　${dispShort(weekDates[0])}〜${dispShort(weekDates[6])}`, ""];
    weekDates.forEach((date, dayIdx) => {
      const parts = [];
      slots.forEach((slot) => {
        const ids = assignments[key(dayIdx, slot.id)] || [];
        if (!ids.length) return;
        const names = ids.map((id) => staff.find((p) => p.id === id)?.name || "?").join("・");
        parts.push(`${slot.label}(${slot.start}-${slot.end}) ${names}`);
      });
      lines.push(`【${dispShort(date)}】 ${parts.length ? parts.join(" / ") : "—"}`);
    });
    lines.push("", `週合計: ${totalHours}h　人件費: ¥${totalCost.toLocaleString()}${weeklySales ? `　人件費率: ${laborRatio.toFixed(1)}%` : ""}`);
    if (conflictCount > 0) lines.push(`⚠ 条件違反 ${conflictCount}件あり（要確認）`);
    navigator.clipboard?.writeText(lines.join("\n")).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const CHART_MIN_WIDTH = 1300, ROW_H = 60;

  const leaveRecommendations = useMemo(() => {
    const today = fmtISO(new Date());
    const windowStart = addMonths(today, -6);
    return staff
      .filter((p) => (p.annualGrantedDays || 0) >= 10)
      .map((p) => {
        const taken = submissions
          .filter((s) => s.staffId === p.id && s.leave && s.date >= windowStart && s.date < today)
          .reduce((sum, s) => sum + (s.leave === "half_am" || s.leave === "half_pm" ? 0.5 : 1), 0);
        return { ...p, taken, windowStart, windowEnd: today };
      })
      .filter((p) => p.taken < 3);
  }, [staff, submissions]);

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium" style={{ color: "#6B6A63" }}>権限</span>
        <div className="flex rounded-full p-1 gap-1" style={{ background: "#E8E6DF" }}>
          <button
            onClick={() => setAdminRole("operator")}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={adminRole === "operator" ? { background: "#1B2A4A", color: "white" } : { color: "#6B6A63" }}
          >
            運営
          </button>
          <button
            onClick={() => setAdminRole("store")}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={adminRole === "store" ? { background: "#1B2A4A", color: "white" } : { color: "#6B6A63" }}
          >
            店舗管理者
          </button>
        </div>
        {adminRole === "store" && (
          <span className="text-[11px]" style={{ color: "#8A8776" }}>自分が出した募集はパスワードで管理します</span>
        )}
      </div>

      {!authChecked ? (
        <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto" size={20} style={{ color: "#1B2A4A" }} /></div>
      ) : adminRole === "operator" && !operatorUnlocked ? (
        <div className="bg-white rounded-lg border px-5 py-6 max-w-sm mx-auto text-center" style={{ borderColor: "#DCD9D0" }}>
          <Settings size={20} style={{ color: "#1B2A4A" }} className="mx-auto mb-2" />
          {!operatorPassword ? (
            <>
              <p className="text-sm font-semibold mb-1" style={{ color: "#1B2A4A" }}>運営パスワードを設定</p>
              <p className="text-xs mb-3" style={{ color: "#8A8776" }}>まだ運営用のパスワードが設定されていません。ここで1つだけ設定してください（以後、運営モードに入る全員が共通で使います）。</p>
              <input
                type="password"
                value={operatorPwDraft}
                onChange={(e) => setOperatorPwDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!operatorPwDraft.trim()) { alert("パスワードを入力してください"); return; }
                    persistWeekConfig({ operatorPassword: operatorPwDraft.trim() });
                    setOperatorUnlocked(true);
                    saveAuthSession("operator", null);
                  }
                }}
                placeholder="運営パスワードを設定"
                autoComplete="new-password"
                className="w-full text-sm border rounded px-3 py-2 outline-none mb-2"
                style={{ borderColor: "#DCD9D0" }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!operatorPwDraft.trim()) { alert("パスワードを入力してください"); return; }
                  persistWeekConfig({ operatorPassword: operatorPwDraft.trim() });
                  setOperatorUnlocked(true);
                  saveAuthSession("operator", null);
                }}
                className="w-full text-sm py-2 rounded font-medium text-white"
                style={{ background: "#1B2A4A" }}
              >
                設定して入る
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold mb-1" style={{ color: "#1B2A4A" }}>運営パスワードを入力</p>
              <p className="text-xs mb-3" style={{ color: "#8A8776" }}>全店舗のデータを閲覧・訂正・削除できるモードです。</p>
              <input
                type="password"
                value={operatorPwDraft}
                onChange={(e) => setOperatorPwDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (operatorPwDraft === operatorPassword) { setOperatorUnlocked(true); saveAuthSession("operator", null); }
                    else alert("パスワードが違います");
                  }
                }}
                placeholder="運営パスワード"
                autoComplete="current-password"
                className="w-full text-sm border rounded px-3 py-2 outline-none mb-2"
                style={{ borderColor: "#DCD9D0" }}
              />
              <button
                type="button"
                onClick={() => {
                  if (operatorPwDraft === operatorPassword) { setOperatorUnlocked(true); saveAuthSession("operator", null); }
                  else alert("パスワードが違います");
                }}
                className="w-full text-sm py-2 rounded font-medium text-white"
                style={{ background: "#1B2A4A" }}
              >
                🔓 運営モードに入る
              </button>
            </>
          )}
        </div>
      ) : adminRole === "store" && !storeRoleUnlocked ? (
        <div className="bg-white rounded-lg border px-5 py-6 max-w-sm mx-auto text-center" style={{ borderColor: "#DCD9D0" }}>
          <Users size={20} style={{ color: "#1B2A4A" }} className="mx-auto mb-2" />
          {loginStep === "choose" ? (
            <>
              <p className="text-sm font-semibold mb-1" style={{ color: "#1B2A4A" }}>店舗を選択</p>
              <p className="text-xs mb-3" style={{ color: "#8A8776" }}>ご自身の店舗を選んでください。</p>
              <select
                value={loginStoreChoice}
                onChange={(e) => setLoginStoreChoice(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 outline-none mb-2"
                style={{ borderColor: "#DCD9D0" }}
              >
                {(storeList.filter(Boolean).length ? storeList.filter(Boolean) : [storeName]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => setLoginStep("password")}
                className="w-full text-sm py-2 rounded font-medium text-white"
                style={{ background: "#1B2A4A" }}
              >
                次へ
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold mb-1" style={{ color: "#1B2A4A" }}>{loginStoreChoice} にログイン</p>
              <p className="text-xs mb-3" style={{ color: storePasswords[loginStoreChoice] ? "#8A8776" : "#B5562B" }}>
                {storePasswords[loginStoreChoice]
                  ? "店舗管理者パスワードを入力してください。"
                  : "この店舗はまだパスワードが発行されていません。運営に発行を依頼し、発行されたら入力してください。"}
              </p>
              <input
                type="password"
                value={storeGatePwDraft}
                onChange={(e) => setStoreGatePwDraft(e.target.value)}
                placeholder="店舗管理者パスワード"
                className="w-full text-sm border rounded px-3 py-2 outline-none mb-2"
                style={{ borderColor: "#DCD9D0" }}
              />
              <button
                onClick={() => {
                  if (storePasswords[loginStoreChoice] && storeGatePwDraft === storePasswords[loginStoreChoice]) {
                    setStoreRoleUnlocked(true);
                    setLockedStore(loginStoreChoice);
                    setStoreName(loginStoreChoice);
                    saveAuthSession("store", loginStoreChoice);
                  } else {
                    alert("パスワードが違います");
                  }
                }}
                className="w-full text-sm py-2 rounded font-medium text-white mb-2"
                style={{ background: "#1B2A4A" }}
              >
                🔓 {loginStoreChoice} の店舗管理者としてログイン
              </button>
              <button onClick={() => setLoginStep("choose")} className="text-xs" style={{ color: "#8A8776" }}>‹ 店舗を選び直す</button>
            </>
          )}
        </div>
      ) : (
      <>
        {adminRole === "operator" && operatorUnlocked && (
          <div className="bg-white rounded-lg border px-4 py-3 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <span className="text-xs font-semibold block mb-1.5" style={{ color: "#1B2A4A" }}>店舗パスワードの発行（運営のみ）</span>
            <div className="flex flex-wrap gap-2">
              {(storeList.filter(Boolean).length ? storeList.filter(Boolean) : [storeName]).map((s) => (
                <div key={s} className="flex items-center gap-1.5 px-2 py-1 rounded border" style={{ borderColor: "#DCD9D0", background: "#FAFAF8" }}>
                  <span className="text-xs font-medium" style={{ color: "#1B2A4A" }}>{s}</span>
                  <input
                    type="text"
                    value={storePasswords[s] || ""}
                    onChange={(e) => persistStorePasswords({ ...storePasswords, [s]: e.target.value })}
                    placeholder="未発行"
                    className="text-xs border rounded px-1.5 py-0.5 w-24 outline-none mono"
                    style={{ borderColor: "#DCD9D0" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {adminRole === "operator" && operatorUnlocked && (
          <div className="bg-white rounded-lg border px-4 py-3 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <span className="text-xs font-semibold block mb-1.5" style={{ color: "#1B2A4A" }}>店舗一覧管理（運営のみ）</span>
            <div className="flex flex-wrap gap-1.5">
              {storeList.map((s, i) => (
                <div key={i} className="flex items-center gap-1 pl-2 pr-1 py-1 rounded border" style={{ borderColor: "#DCD9D0", background: "#FAFAF8" }}>
                  <input
                    value={s}
                    onChange={(e) => {
                      const next = [...storeList];
                      next[i] = e.target.value;
                      persistWeekConfig({ storeList: next });
                    }}
                    placeholder={`店舗${i + 1}`}
                    className="text-xs outline-none bg-transparent"
                    style={{ color: "#1B2A4A", width: 90 }}
                  />
                  <button
                    onClick={() => persistWeekConfig({ storeList: storeList.filter((_, idx) => idx !== i) })}
                    className="opacity-40 hover:opacity-80"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => persistWeekConfig({ storeList: [...storeList, ""] })}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border font-medium"
                style={{ borderColor: "#DCD9D0", color: "#1B2A4A" }}
              >
                <Plus size={12} /> 店舗を追加
              </button>
            </div>
          </div>
        )}
        {adminRole === "operator" && operatorUnlocked && (
          <div className="bg-white rounded-lg border px-4 py-3 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <JapaneseYen size={14} style={{ color: "#12756B" }} />
              <span className="text-xs font-semibold" style={{ color: "#1B2A4A" }}>月間人件費サマリー（{monthlyLaborSummary.monthLabel}・店舗別）</span>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => setLaborMonthOffset((v) => v - 1)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>‹ 前月</button>
                {laborMonthOffset !== 0 && (
                  <button onClick={() => setLaborMonthOffset(0)} className="text-xs px-2 py-1 rounded font-medium" style={{ color: "#8A8776" }}>今月</button>
                )}
                <button onClick={() => setLaborMonthOffset((v) => v + 1)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>翌月 ›</button>
              </div>
            </div>
            <div className="space-y-1.5 mb-2">
              {Object.entries(monthlyLaborSummary.perStoreCost).filter(([, v]) => v.hours > 0).map(([storeN, v]) => (
                <div key={storeN}>
                  <button
                    onClick={() => setOperatorDetailStore(operatorDetailStore === storeN ? "" : storeN)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border"
                    style={{ borderColor: operatorDetailStore === storeN ? "#1B2A4A" : "#EFEDE7", background: "#FAFAF8" }}
                  >
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1B2A4A" }}>
                      {operatorDetailStore === storeN ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {storeN}
                    </span>
                    <span>
                      <span className="mono text-xs" style={{ color: "#12756B" }}>¥{v.cost.toLocaleString()}</span>
                      <span className="text-[10px] ml-1" style={{ color: "#8A8776" }}>（{v.hours}h）</span>
                    </span>
                  </button>
                  {operatorDetailStore === storeN && operatorDetailStats && (
                    <div className="mt-1.5 mb-1 grid grid-cols-2 sm:grid-cols-3 gap-2 px-1">
                      {operatorDetailStats.storeStaffList.length === 0 ? (
                        <p className="text-xs col-span-full" style={{ color: "#D8D6CE" }}>この店舗にはスタッフが登録されていません。</p>
                      ) : operatorDetailStats.storeStaffList.map((p) => {
                        const st = operatorDetailStats.stats[p.id] || { hours: 0, cost: 0 };
                        return (
                          <div key={p.id} className="rounded p-2" style={{ background: "#1B2A4A08" }}>
                            <div className="text-xs font-semibold" style={{ color: "#1B2A4A" }}>{p.name}</div>
                            <div className="mono text-sm font-bold" style={{ color: "#1B2A4A" }}>{st.hours}h</div>
                            <div className="mono text-[11px]" style={{ color: "#8A8776" }}>¥{st.cost.toLocaleString()}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              {Object.values(monthlyLaborSummary.perStoreCost).every((v) => v.hours === 0) && (
                <p className="text-xs" style={{ color: "#D8D6CE" }}>この月のシフトが組まれている店舗がありません。</p>
              )}
            </div>
            <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: "#EFEDE7" }}>
              <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>全店舗合計（{monthlyLaborSummary.hours}h）</span>
              <span className="mono text-lg font-bold" style={{ color: "#12756B" }}>¥{monthlyLaborSummary.cost.toLocaleString()}</span>
            </div>
          </div>
        )}
        {adminRole === "operator" && operatorUnlocked && leaveRecommendations.length > 0 && (
          <div className="rounded-lg border px-4 py-3 mb-4 flex items-start gap-2" style={{ borderColor: "#D98E04", background: "#D98E040D" }}>
            <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "#B5562B" }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#8A6D1F" }}>有給取得推奨スタッフ（全店舗・直近6ヶ月で3日未満）</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B6A63" }}>年5日取得のペースに対して遅れています。各店舗のシフト作成時に有給取得を優先的に案内してください。</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {leaveRecommendations.map((p) => (
                  <span key={p.id} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#8A6D1F15", color: "#8A6D1F" }}>
                    {p.name}（{p.homeStore}・直近6ヶ月 {p.taken}日取得）
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {adminRole === "store" && storeRoleUnlocked && (
        <>
        {adminRole === "store" && storeRoleUnlocked && (
          <div className="bg-white rounded-lg border px-4 py-3 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Users size={14} style={{ color: "#1B2A4A" }} />
              <span className="text-xs font-semibold" style={{ color: "#1B2A4A" }}>{lockedStore} のパスワードを変更</span>
            </div>
            <p className="text-[11px] mb-1.5" style={{ color: "#8A8776" }}>退職者が出た場合など、必要に応じてここで変更できます。変更後は、引き続き使う人にだけ新しいパスワードを伝えてください。</p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={newStorePw}
                onChange={(e) => setNewStorePw(e.target.value)}
                placeholder="新しいパスワード"
                className="text-xs border rounded px-2 py-1.5 outline-none flex-1"
                style={{ borderColor: "#DCD9D0" }}
              />
              <button
                onClick={() => {
                  if (!newStorePw.trim()) { alert("新しいパスワードを入力してください"); return; }
                  persistStorePasswords({ ...storePasswords, [lockedStore]: newStorePw.trim() });
                  setNewStorePw("");
                  alert("パスワードを変更しました。以後は新しいパスワードでログインしてください。");
                }}
                className="text-xs px-3 py-1.5 rounded font-medium text-white shrink-0"
                style={{ background: "#C4453B" }}
              >
                変更する
              </button>
            </div>
          </div>
        )}
        {adminRole === "store" && storeRoleUnlocked && (
          <div className="bg-white rounded-lg border px-4 py-3 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <CalendarDays size={14} style={{ color: "#1B2A4A" }} />
              <span className="text-xs font-semibold" style={{ color: "#1B2A4A" }}>希望シフト提出締切の特例</span>
            </div>
            <p className="text-[11px] mb-1.5" style={{ color: "#8A8776" }}>通常は前月25日が締切ですが、今回に限り特定の月だけ締切後も提出できるようにできます。</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="month"
                value={deadlineOverrideMonth}
                onChange={(e) => setDeadlineOverrideMonth(e.target.value)}
                className="text-xs border rounded px-2 py-1.5 outline-none"
                style={{ borderColor: "#DCD9D0" }}
              />
              {deadlineOverrideMonth && (deadlineOverrideMonths || []).includes(deadlineOverrideMonth) ? (
                <button
                  onClick={() => persistWeekConfig({ deadlineOverrideMonths: (deadlineOverrideMonths || []).filter((m) => m !== deadlineOverrideMonth) })}
                  className="text-xs px-3 py-1.5 rounded font-medium text-white"
                  style={{ background: "#B5562B" }}
                >
                  この月の締切解除をやめる
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!deadlineOverrideMonth) { alert("月を選択してください"); return; }
                    persistWeekConfig({ deadlineOverrideMonths: [...(deadlineOverrideMonths || []), deadlineOverrideMonth] });
                  }}
                  className="text-xs px-3 py-1.5 rounded font-medium text-white"
                  style={{ background: "#12756B" }}
                >
                  この月だけ締切を解除する
                </button>
              )}
            </div>
            {(deadlineOverrideMonths || []).length > 0 && (
              <p className="text-[11px] mt-1.5" style={{ color: "#12756B" }}>現在、締切解除中の月：{(deadlineOverrideMonths || []).join("・")}</p>
            )}
          </div>
        )}
      {leaveRecommendations.length > 0 && !leaveWarningDismissed && (
        <div className="rounded-lg border px-4 py-3 mb-4 flex items-start gap-2" style={{ borderColor: "#D98E04", background: "#D98E040D" }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "#B5562B" }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#8A6D1F" }}>有給取得推奨スタッフ（直近6ヶ月で3日未満）</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B6A63" }}>年5日取得のペースに対して遅れています。今月のシフト作成時に有給取得を優先的に案内してください。</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {leaveRecommendations.map((p) => (
                <span key={p.id} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#8A6D1F15", color: "#8A6D1F" }}>
                  {p.name}（直近6ヶ月 {p.taken}日取得）
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setLeaveWarningDismissed(true)} className="opacity-50 hover:opacity-90 shrink-0" title="閉じる">
            <X size={16} />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="bg-white rounded-t-sm shadow-sm border border-b-0" style={{ borderColor: "#DCD9D0" }}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {adminRole === "store" && storeRoleUnlocked ? (
              <span className="text-xl font-bold" style={{ color: "#1B2A4A" }}>{lockedStore}</span>
            ) : (
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="text-xl font-bold bg-transparent outline-none border-b border-transparent focus:border-gray-300"
                style={{ color: "#1B2A4A" }}
              >
                {(storeList.filter(Boolean).length ? storeList.filter(Boolean) : [storeName]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            <span className="text-xs px-2 py-1 rounded-full mono" style={{ background: "#12756B15", color: "#12756B" }}>SHIFT GANTT</span>
          </div>
          {!(adminRole === "store" && storeRoleUnlocked) && (
            <p className="text-xs mt-1" style={{ color: "#8A8776" }}>↑ 今どの店舗のシフトを操作しているかを切り替えます（時間帯・スタッフのシフト表はこの店舗のものが表示されます）</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <CalendarDays size={14} style={{ color: "#8A8776" }} />
            <span className="text-xs" style={{ color: "#6B6A63" }}>週の開始日（月曜）</span>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => persistWeekConfig({ weekStart: e.target.value })}
              className="mono text-xs border rounded px-2 py-1 outline-none"
              style={{ borderColor: "#DCD9D0" }}
            />
            <span className="mono text-xs" style={{ color: "#8A8776" }}>{dispShort(weekDates[0])}〜{dispShort(weekDates[6])}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <button onClick={() => persistWeekConfig({ weekStart: addDays(weekStart, -28) })} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>≪ 前月</button>
            <button onClick={() => persistWeekConfig({ weekStart: addDays(weekStart, -7) })} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>‹ 前週</button>
            <button onClick={() => persistWeekConfig({ weekStart: nextMonday() })} className="text-xs px-2 py-1 rounded font-medium" style={{ color: "#8A8776" }}>今週</button>
            <button onClick={() => persistWeekConfig({ weekStart: addDays(weekStart, 7) })} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>翌週 ›</button>
            <button onClick={() => persistWeekConfig({ weekStart: addDays(weekStart, 28) })} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>翌月 ≫</button>
          </div>
          <div className="mt-2">
            <button onClick={() => setShowSlotEditor((v) => !v)} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1B2A4A" }}>
              {showSlotEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}時間帯を編集（{slots.length}件）
            </button>
            {showSlotEditor && (
              <div className="mt-2 space-y-2">
                {slots.map((slot) => {
                  const dayCounts = slotDayCounts(slot);
                  const uniform = dayCounts.every((c) => c === dayCounts[0]);
                  return (
                    <div key={slot.id} className="px-2.5 py-2 rounded border text-xs" style={{ borderColor: "#DCD9D0", background: "#FAFAF8" }}>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <input value={slot.label} onChange={(e) => updateSlotField(slot.id, "label", e.target.value)} className="w-12 bg-transparent outline-none font-medium" style={{ color: "#1B2A4A" }} />
                        <input value={slot.start} onChange={(e) => updateSlotField(slot.id, "start", e.target.value)} className="w-11 bg-transparent outline-none mono" style={{ color: "#8A8776" }} />〜
                        <input value={slot.end} onChange={(e) => updateSlotField(slot.id, "end", e.target.value)} className="w-11 bg-transparent outline-none mono" style={{ color: "#8A8776" }} />
                        <span className="mono" style={{ color: "#8A8776" }}>基本</span>
                        <input type="number" min={0} value={slot.required} onChange={(e) => updateSlotField(slot.id, "required", e.target.value)} className="w-6 bg-transparent outline-none mono border-b" style={{ borderColor: "#DCD9D0" }} />
                        <button onClick={() => removeSlot(slot.id)} className="ml-auto opacity-40 hover:opacity-80"><Trash2 size={12} /></button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] shrink-0" style={{ color: uniform ? "#8A8776" : "#B5562B" }}>曜日別人数</span>
                        {WEEKDAY_ORDER_JA.map((label, i) => (
                          <label key={i} className="flex flex-col items-center shrink-0" style={{ width: 26 }}>
                            <span className="text-[9px]" style={{ color: "#8A8776" }}>{label}</span>
                            <input
                              type="number" min={0}
                              value={dayCounts[i]}
                              onChange={(e) => updateSlotDayCount(slot.id, i, e.target.value)}
                              className="w-full text-center rounded border text-[11px] outline-none mono"
                              style={{ borderColor: dayCounts[i] === 0 ? "#DCD9D0" : "#1B2A4A", background: dayCounts[i] === 0 ? "#EFEDE7" : "white", color: dayCounts[i] === 0 ? "#B8B5AA" : "#1B2A4A", padding: "1px 0" }}
                            />
                          </label>
                        ))}
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: "#8A8776" }}>0にするとその曜日は枠自体が不要になります。特定の日付だけ変えたい場合は、シフト表の枠をタップして個別に変更できます。</p>
                      {taskItems.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: "#EFEDE7" }}>
                          <span className="text-[10px] block mb-1" style={{ color: "#8A8776" }}>この時間帯の初期担当マーク（割り当て時に自動で付きます）</span>
                          <div className="flex flex-wrap gap-1">
                            {taskItems.map((task) => {
                              const on = (slot.defaultTasks || []).includes(task);
                              return (
                                <button
                                  key={task}
                                  onClick={() => toggleSlotDefaultTask(slot.id, task)}
                                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                  style={on ? { background: "#12756B", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                                >
                                  {task}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={addSlot} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border font-medium" style={{ borderColor: "#DCD9D0", color: "#1B2A4A" }}><Plus size={12} /> 追加</button>
                <div className="mt-2 pt-2 border-t" style={{ borderColor: "#EFEDE7" }}>
                  <button onClick={computeMergeProposal} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded font-medium" style={{ background: "#D98E0415", color: "#8A6D1F" }}>
                    <RefreshCw size={12} /> 重なりを解消して提案する
                  </button>
                  <p className="text-[10px] mt-1" style={{ color: "#8A8776" }}>時間帯同士が重なっていると、その重なった時間だけ必要人数が足し算されてしまいます。今の時間帯を分析して、重ならない形（各枠2人）に組み直す提案を作ります。</p>
                  {mergeProposal && (
                    <div className="mt-2 p-2 rounded border" style={{ borderColor: "#D98E04", background: "#FAFAF8" }}>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: "#1B2A4A" }}>提案する時間帯（{mergeProposal.length}件・すべて2人）</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {mergeProposal.map((p) => (
                          <span key={p.id} className="text-[11px] px-2 py-1 rounded-full font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>{p.label}</span>
                        ))}
                      </div>
                      <p className="text-[10px] mb-2" style={{ color: "#8A8776" }}>採用すると、今の時間帯の一覧がこの内容に置き換わります（今の割り当て済みシフトは、対応する時間帯がなくなるため見えなくなる場合があります）。</p>
                      <div className="flex gap-1.5">
                        <button onClick={adoptMergeProposal} className="text-xs px-3 py-1.5 rounded font-medium text-white" style={{ background: "#12756B" }}>この内容で置き換える</button>
                        <button onClick={() => setMergeProposal(null)} className="text-xs px-3 py-1.5 rounded font-medium" style={{ background: "#EFEDE7", color: "#6B6A63" }}>キャンセル</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="mt-2">
            <button onClick={() => setShowTaskEditor((v) => !v)} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1B2A4A" }}>
              {showTaskEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}作業項目を編集（{taskItems.length}件）
            </button>
            {showTaskEditor && (
              <div className="mt-2">
                <p className="text-[11px] mb-1.5" style={{ color: "#8A8776" }}>トイレ清掃・床清掃などの担当マークを作成できます。絵文字を含めて自由に入力してください（例：🧽 トイレ清掃）。</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {taskItems.map((task, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 rounded border" style={{ borderColor: "#DCD9D0", background: "#FAFAF8" }}>
                      <input
                        value={task}
                        onChange={(e) => {
                          const next = [...taskItems];
                          next[i] = e.target.value;
                          persistTaskItems(next);
                        }}
                        className="text-xs bg-transparent outline-none"
                        style={{ color: "#1B2A4A", width: 130 }}
                      />
                      <button onClick={() => persistTaskItems(taskItems.filter((_, idx) => idx !== i))} className="opacity-40 hover:opacity-80"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => persistTaskItems([...taskItems, "🆕 新しい項目"])} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border font-medium" style={{ borderColor: "#DCD9D0", color: "#1B2A4A" }}><Plus size={12} /> 項目を追加</button>
              </div>
            )}
          </div>
          <div className="mt-2">
            <button onClick={() => setShowGroupStores((v) => !v)} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1B2A4A" }}>
              {showGroupStores ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <Briefcase size={14} style={{ color: "#8A8776" }} />
              グループ参加店舗（スポット募集のヘルプ先選択に使用・{storeList.filter(Boolean).length}件）
            </button>
            {showGroupStores && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {storeList.map((s, i) => (
                  <div key={i} className="flex items-center gap-1 pl-2 pr-1 py-1 rounded border" style={{ borderColor: "#DCD9D0", background: "#FAFAF8" }}>
                    <input
                      value={s}
                      onChange={(e) => {
                        const next = [...storeList];
                        next[i] = e.target.value;
                        persistWeekConfig({ storeList: next });
                      }}
                      placeholder={`店舗${i + 1}`}
                      className="text-xs outline-none bg-transparent"
                      style={{ color: "#1B2A4A", width: 90 }}
                    />
                    <button
                      onClick={() => persistWeekConfig({ storeList: storeList.filter((_, idx) => idx !== i) })}
                      className="opacity-40 hover:opacity-80"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => persistWeekConfig({ storeList: [...storeList, ""] })}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border font-medium"
                  style={{ borderColor: "#DCD9D0", color: "#1B2A4A" }}
                >
                  <Plus size={12} /> 店舗を追加
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs" style={{ color: "#6B6A63" }}>スポット勤務の交通費（一律）</span>
            <input
              type="number"
              value={commuteFare}
              onChange={(e) => persistWeekConfig({ commuteFare: Number(e.target.value) })}
              className="mono text-xs border rounded px-2 py-1 w-20 outline-none"
              style={{ borderColor: "#DCD9D0" }}
            />
            <span className="text-xs" style={{ color: "#8A8776" }}>円</span>
          </div>
        </div>
      </div>
      <div className="perforated bg-white" />

      {/* Staff manager */}
      <div className="bg-white border" style={{ borderColor: "#DCD9D0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#EFEDE7" }}>
          <button onClick={() => setShowStaffSection((v) => !v)} className="flex items-center justify-between mb-1 w-full">
            <div className="flex items-center gap-2"><span className="icon-badge" style={{ background: "#1B2A4A15" }}><Users size={15} style={{ color: "#1B2A4A" }} /></span><h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>スタッフ／雇用条件</h2></div>
            {showStaffSection ? <ChevronUp size={16} style={{ color: "#1B2A4A" }} /> : <ChevronDown size={16} style={{ color: "#1B2A4A" }} />}
          </button>
          <p className="text-xs mb-3" style={{ color: "#8A8776" }}>{storeName} のスタッフ（{storeStaff.length}名）。他店のスタッフは表示されません。</p>
          {showStaffSection && (
          <>

          {storeStaff.length === 0 ? (
            <p className="text-xs mb-3" style={{ color: "#B5562B" }}>この店舗にはまだスタッフが登録されていません。</p>
          ) : (
            <label className="flex items-center gap-2 mb-3">
              <span className="text-xs" style={{ color: "#6B6A63" }}>スタッフを選択</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="flex-1 text-sm border rounded px-2 py-1.5 outline-none"
                style={{ borderColor: "#DCD9D0" }}
              >
                {storeStaff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}

          <div className="space-y-2 mb-3">
            {storeStaff.filter((p) => p.id === selectedStaffId).map((p) => {
              const st = { hours: 0, days: new Set() };
              weekDates.forEach((date, dayIdx) => {
                slots.forEach((slot) => {
                  const ids = assignments[key(dayIdx, slot.id)] || [];
                  if (ids.includes(p.id)) { st.hours += getAssignmentTime(dayIdx, slot, p.id).hours; st.days.add(dayIdx); }
                });
              });
              const over = st.hours > (p.maxHours || 9999);
              const run = longestConsecutive(st.days);
              const runOver = run > p.maxConsecutive;
              const noRestDay = st.days.size >= 7; // labor law requires at least 1 rest day per week (or 4 per 4 weeks)
              return (
                <div key={p.id} className="rounded border px-3 py-2" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: staffColor(p.id) }} />
                    <span className="font-medium text-sm" style={{ color: "#1B2A4A" }}>{isUnderSixMonths(p.hireDate, fmtISO(new Date())) && "🔰"}{p.name}</span>
                    <span className="mono text-xs opacity-70">¥{p.wage}/h</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>{p.type}</span>
                    {!personNightOk(p) && <span className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#8A6D1F15", color: "#8A6D1F" }}><Moon size={10} /> 深夜不可</span>}
                    {isUnderSixMonths(p.hireDate, fmtISO(new Date())) && <span className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#C4453B15", color: "#C4453B" }}><AlertTriangle size={10} /> 入社6ヶ月未満</span>}
                    {p.note && <span className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#8A6D1F15", color: "#8A6D1F" }}><MessageSquare size={10} /> 備考あり</span>}
                    {p.isLeader && <span className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#D98E0415", color: "#8A6D1F" }}>👑 リーダー資格</span>}
                    {noRestDay && <span className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#C4453B15", color: "#C4453B" }}><AlertTriangle size={10} /> 法定休日なし（週7日勤務）</span>}
                    <span className="mono text-xs" style={{ color: over ? "#C4453B" : "#8A8776" }}>{st.hours}h/上限{p.maxHours}h{over && " ⚠"}</span>
                    <span className="mono text-xs" style={{ color: runOver ? "#C4453B" : "#8A8776" }}>連続{run}日{runOver && " ⚠"}</span>
                    <button onClick={() => setShowStaffDetail((v) => !v)} className="ml-auto flex items-center gap-1 text-xs font-medium" style={{ color: "#1B2A4A" }}>
                      {showStaffDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}条件詳細
                    </button>
                    <button onClick={() => removeStaff(p.id)} className="opacity-40 hover:opacity-80"><Trash2 size={13} /></button>
                  </div>

                  {showStaffDetail && (
                    <div className="mt-2 pt-2 border-t space-y-2.5" style={{ borderColor: "#EFEDE7" }}>
                      <div className="flex flex-wrap items-center gap-2 text-xs px-2 py-1.5 rounded" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>
                        <Clock size={12} />固定勤務時間：{p.usualStart && p.usualEnd ? `${p.usualStart}〜${p.usualEnd}` : "未登録"}{personNightOk(p) && <span className="ml-1">🌙 深夜勤務あり（時間帯から自動判定）</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>雇用区分
                          <select value={p.type} onChange={(e) => updateStaffField(p.id, "type", e.target.value)} className="text-xs border rounded px-1 py-0.5 outline-none" style={{ borderColor: "#DCD9D0" }}>
                            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>週上限
                          <input type="number" min={0} value={p.maxHours} onChange={(e) => updateStaffField(p.id, "maxHours", Number(e.target.value))} className="mono text-xs border rounded px-1 py-0.5 w-14 outline-none" style={{ borderColor: "#DCD9D0" }} />h
                        </label>
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>連続勤務上限
                          <input type="number" min={1} value={p.maxConsecutive} onChange={(e) => updateStaffField(p.id, "maxConsecutive", Number(e.target.value))} className="mono text-xs border rounded px-1 py-0.5 w-12 outline-none" style={{ borderColor: "#DCD9D0" }} />日
                        </label>
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>所属店舗
                          <select value={p.homeStore || storeName} onChange={(e) => updateStaffField(p.id, "homeStore", e.target.value)} className="text-xs border rounded px-1 py-0.5 outline-none" style={{ borderColor: "#DCD9D0" }}>
                            {(storeList.filter(Boolean).length ? storeList.filter(Boolean) : [storeName]).map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>本人用PIN（3桁）
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={3}
                            value={p.pin || ""}
                            onChange={(e) => updateStaffField(p.id, "pin", e.target.value.replace(/\D/g, "").slice(0, 3))}
                            placeholder="未設定"
                            className="mono text-xs border rounded px-1.5 py-0.5 w-14 outline-none"
                            style={{ borderColor: "#DCD9D0" }}
                          />
                        </label>
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>
                          <input type="checkbox" checked={!!p.isLeader} onChange={(e) => updateStaffField(p.id, "isLeader", e.target.checked)} />👑 リーダー資格
                        </label>
                      </div>

                      <div>
                        <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>備考（管理者用メモ）</span>
                        <textarea
                          value={p.note || ""}
                          onChange={(e) => updateStaffField(p.id, "note", e.target.value)}
                          placeholder="例：腰痛のため重い物NG、送迎の都合で17時まで、など"
                          rows={2}
                          className="w-full text-xs border rounded px-2 py-1.5 outline-none resize-none"
                          style={{ borderColor: "#DCD9D0" }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs" style={{ color: "#6B6A63" }}>契約上の勤務時間</span>
                        <div className="flex rounded-full p-0.5 gap-0.5" style={{ background: "#EFEDE7" }}>
                          <button
                            onClick={() => updateStaffField(p.id, "contractType", "fixed")}
                            className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                            style={(p.contractType || "fixed") === "fixed" ? { background: "#1B2A4A", color: "white" } : { color: "#6B6A63" }}
                          >固定</button>
                          <button
                            onClick={() => updateStaffField(p.id, "contractType", "custom")}
                            className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                            style={p.contractType === "custom" ? { background: "#1B2A4A", color: "white" } : { color: "#6B6A63" }}
                          >手入力</button>
                        </div>
                        {(p.contractType || "fixed") === "fixed" ? (
                          <select
                            value={p.contractHours || CONTRACT_PRESETS[0]}
                            onChange={(e) => { const h = Number(e.target.value); updateStaffField(p.id, "contractHours", h); }}
                            className="text-xs border rounded px-1.5 py-0.5 outline-none mono"
                            style={{ borderColor: "#DCD9D0" }}
                          >
                            {CONTRACT_PRESETS.map((h) => <option key={h} value={h}>週{h}時間</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={p.contractHours || 0}
                              onChange={(e) => updateStaffField(p.id, "contractHours", Number(e.target.value))}
                              className="text-xs border rounded px-1.5 py-0.5 w-16 outline-none mono"
                              style={{ borderColor: "#DCD9D0" }}
                            />
                            <span className="text-[11px]" style={{ color: "#8A8776" }}>時間/週</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>入社日
                          <input type="date" value={p.hireDate || ""} onChange={(e) => updateStaffField(p.id, "hireDate", e.target.value)} className="mono text-xs border rounded px-1 py-0.5 outline-none" style={{ borderColor: "#DCD9D0" }} />
                        </label>
                        <button
                          onClick={() => {
                            const result = statutoryGrant(p.hireDate, fmtISO(new Date()));
                            if (!result) { alert("入社日から6ヶ月経過していないため、まだ初回付与はありません。"); return; }
                            persistRoster(staff.map((x) => (x.id === p.id ? { ...x, grantDate: result.grantDate, annualGrantedDays: result.annualGrantedDays } : x)));
                          }}
                          disabled={!p.hireDate}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded font-medium disabled:opacity-30"
                          style={{ background: "#12756B15", color: "#12756B" }}
                        >
                          <RefreshCw size={11} /> 入社日から自動計算
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>有給基準日
                          <input type="date" value={p.grantDate || ""} onChange={(e) => updateStaffField(p.id, "grantDate", e.target.value)} className="mono text-xs border rounded px-1 py-0.5 outline-none" style={{ borderColor: "#DCD9D0" }} />
                        </label>
                        <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>年間付与日数
                          <input type="number" min={0} value={p.annualGrantedDays || 0} onChange={(e) => updateStaffField(p.id, "annualGrantedDays", Number(e.target.value))} className="mono text-xs border rounded px-1 py-0.5 w-12 outline-none" style={{ borderColor: "#DCD9D0" }} />日
                        </label>
                        {p.grantDate && p.annualGrantedDays >= 10 && (() => {
                          const period = currentLeavePeriod(p.grantDate, fmtISO(new Date()));
                          const taken = submissions
                            .filter((s) => s.staffId === p.id && s.leave && s.date >= period.start && s.date < period.end)
                            .reduce((sum, s) => sum + (s.leave === "half_am" || s.leave === "half_pm" ? 0.5 : 1), 0);
                          const short = taken < 5;
                          return (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: short ? "#C4453B15" : "#12756B15", color: short ? "#C4453B" : "#12756B" }}>
                              {short && <AlertTriangle size={11} />}有給消化 {taken}/5日（{dispShort(period.start)}〜{dispShort(addDays(period.end, -1))}）
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-[11px]" style={{ color: "#B8B5AA" }}>※自動計算はフルタイム・出勤率8割以上を前提とした簡易計算です。パート等の比例付与や、会社独自の統一基準日を使っている場合は基準日・付与日数を手動で調整してください。</p>

                      <div>
                        <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>今週の出勤可能時間（本人からの提出をもとに表示・タップで手動修正も可）</span>
                        <div className="flex flex-wrap gap-1.5">
                          {weekDates.map((date, dayIdx) => {
                            const eff = effectiveWindow(p.id, date);
                            const isEditing = editingCell === `${p.id}__${date}`;
                            const hasSubmission = submissions.some((s) => s.staffId === p.id && s.date === date);
                            return (
                              <div key={date} className="flex flex-col gap-0.5 px-1.5 py-1 rounded border" style={{
                                borderColor: eff.available ? staffColor(p.id) + "55" : "#EFEDE7",
                                background: eff.source === "unknown" ? "#F2F0EA" : eff.available ? staffColor(p.id) + "0D" : "#F2F0EA",
                                minWidth: 78,
                              }}>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] mono" style={{ color: "#8A8776" }}>{dispShort(date)}</span>
                                  {eff.source === "unknown" && <span className="text-[9px]" style={{ color: "#B5562B" }}>未回答</span>}
                                  {eff.source === "submission" && (
                                    <span className="text-[9px]" style={{ color: "#12756B" }}>
                                      本人希望{eff.manual ? "・個別入力" : "・一括登録"}
                                    </span>
                                  )}
                                  {eff.source === "override" && <span className="text-[9px]" style={{ color: "#8A6D1F" }}>管理者修正</span>}
                                </div>
                                {isEditing ? (
                                  <div className="flex flex-col gap-1">
                                    <label className="flex items-center gap-1 text-[10px]">
                                      <input type="checkbox" checked={eff.available} onChange={(e) => setOverride(p.id, date, { available: e.target.checked })} />可
                                    </label>
                                    {eff.available && (
                                      <div className="flex items-center gap-0.5 text-[10px] mono">
                                        <input value={eff.start} onChange={(e) => setOverride(p.id, date, { start: e.target.value })} className="w-10 border-b bg-transparent outline-none" style={{ borderColor: "#DCD9D0" }} />
                                        〜
                                        <input value={eff.end} onChange={(e) => setOverride(p.id, date, { end: e.target.value })} className="w-10 border-b bg-transparent outline-none" style={{ borderColor: "#DCD9D0" }} />
                                      </div>
                                    )}
                                    <div className="flex gap-1">
                                      <button onClick={() => setEditingCell(null)} className="text-[9px] px-1.5 py-0.5 rounded text-white" style={{ background: "#1B2A4A" }}>閉じる</button>
                                      {overrides[`${p.id}__${date}`] && (
                                        <button onClick={() => clearOverride(p.id, date)} className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: "#C4453B" }}>本人希望に戻す</button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setEditingCell(`${p.id}__${date}`)} className="text-[11px] mono text-left" style={{ color: eff.available ? "#1B2A4A" : "#B8B5AA" }}>
                                    {eff.leave ? `有給（${eff.leave === "full" ? "全休" : eff.leave === "half_am" ? "半休・午前" : "半休・午後"}）` : eff.available ? `${eff.start}-${eff.end}` : "休み希望"}
                                  </button>
                                )}
                                {eff.note && (
                                  <div className="flex items-start gap-0.5 text-[10px] mt-0.5" style={{ color: "#6B6A63" }}>
                                    <MessageSquare size={10} className="shrink-0 mt-0.5" />
                                    <span className="break-words">{eff.note}</span>
                                  </div>
                                )}
                                {hasSubmission && eff.source !== "submission" && (
                                  <button onClick={() => applySubmission(p.id, date)} className="flex items-center gap-0.5 text-[9px] mt-0.5" style={{ color: "#12756B" }}>
                                    <RefreshCw size={9} /> 本人希望を反映
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showAddStaffForm ? (
            <button
              onClick={() => setShowAddStaffForm(true)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg text-white font-medium"
              style={{ background: "#1B2A4A" }}
            >
              <Plus size={15} /> 新規スタッフを追加
            </button>
          ) : (
            <div className="rounded border px-3 py-3 space-y-2.5" style={{ borderColor: "#DCD9D0", background: "#FAFAF8" }}>
              <div className="flex flex-wrap gap-2 items-center">
                <input placeholder="名前" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="text-sm px-3 py-1.5 rounded border outline-none" style={{ borderColor: "#DCD9D0", width: 110 }} />
                <select
                  value={newStaffType}
                  onChange={(e) => {
                    const t = e.target.value;
                    setNewStaffType(t);
                    if (TYPE_DEFAULT_HOURS[t]) setNewStaffContractHours(TYPE_DEFAULT_HOURS[t]);
                    setNewStaffWage(t === "正社員" ? 0 : 1033);
                  }}
                  className="text-sm border rounded px-2 py-1.5 outline-none"
                  style={{ borderColor: "#DCD9D0" }}
                >
                  {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>時給（区分に応じて自動計算）</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewStaffWage(0)}
                    className="text-xs px-3 py-1.5 rounded font-medium"
                    style={Number(newStaffWage) === 0 ? { background: "#1B2A4A", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                  >
                    正社員（¥0計算）
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaffWage(1033)}
                    className="text-xs px-3 py-1.5 rounded font-medium"
                    style={Number(newStaffWage) === 1033 ? { background: "#1B2A4A", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                  >
                    それ以外（¥1033）
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs" style={{ color: "#6B6A63" }}>
                入社日
                <input type="date" value={newStaffHireDate} onChange={(e) => setNewStaffHireDate(e.target.value)} className="text-sm border rounded px-2 py-1.5 outline-none mono" style={{ borderColor: "#DCD9D0" }} />
              </label>
              <label className="flex items-center gap-2 text-xs" style={{ color: "#6B6A63" }}>
                本人用PIN（3桁・任意）
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="未設定でもOK"
                  className="text-sm border rounded px-2 py-1.5 outline-none mono w-28"
                  style={{ borderColor: "#DCD9D0" }}
                />
              </label>
              <div>
                <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>通常の勤務時間</span>
                {slots.length ? (
                  <select
                    value={`${newStaffUsualStart}-${newStaffUsualEnd}`}
                    onChange={(e) => {
                      const [s, en] = e.target.value.split("-");
                      setNewStaffUsualStart(s);
                      setNewStaffUsualEnd(en);
                    }}
                    className="w-full text-sm border rounded px-2 py-1.5 outline-none mono"
                    style={{ borderColor: "#DCD9D0" }}
                  >
                    {slots.map((slot) => (
                      <option key={slot.id} value={`${slot.start}-${slot.end}`}>{slot.label}（{slot.start}〜{slot.end}）</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs" style={{ color: "#B5562B" }}>この店舗の時間帯が未登録です</span>
                )}
              </div>
              <div>
                <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>契約上の勤務時間（週）　※区分選択で自動入力、手動でも調整できます</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex rounded-full p-0.5 gap-0.5" style={{ background: "#EFEDE7" }}>
                    <button
                      onClick={() => setNewStaffContractType("fixed")}
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={newStaffContractType === "fixed" ? { background: "#1B2A4A", color: "white" } : { color: "#6B6A63" }}
                    >固定</button>
                    <button
                      onClick={() => setNewStaffContractType("custom")}
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={newStaffContractType === "custom" ? { background: "#1B2A4A", color: "white" } : { color: "#6B6A63" }}
                    >手入力</button>
                  </div>
                  {newStaffContractType === "fixed" ? (
                    <select
                      value={newStaffContractHours}
                      onChange={(e) => setNewStaffContractHours(Number(e.target.value))}
                      className="text-sm border rounded px-2 py-1.5 outline-none mono"
                      style={{ borderColor: "#DCD9D0" }}
                    >
                      {CONTRACT_PRESETS.map((h) => <option key={h} value={h}>週{h}時間</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={newStaffContractHours}
                        onChange={(e) => setNewStaffContractHours(Number(e.target.value))}
                        className="text-sm border rounded px-2 py-1.5 w-20 outline-none mono"
                        style={{ borderColor: "#DCD9D0" }}
                      />
                      <span className="text-xs" style={{ color: "#8A8776" }}>時間/週</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addStaff} className="flex items-center gap-1 text-sm px-4 py-1.5 rounded text-white font-medium" style={{ background: "#12756B" }}><Plus size={14} /> 追加する</button>
                <button onClick={() => setShowAddStaffForm(false)} className="text-sm px-4 py-1.5 rounded font-medium" style={{ background: "#EFEDE7", color: "#6B6A63" }}>キャンセル</button>
              </div>
            </div>
          )}
          </>
          )}
        </div>

      </div>

      {/* Unsubmitted-staff summary — who hasn't submitted shift preferences before the 25th deadline */}
      {(() => {
        const now = new Date();
        const day = now.getDate();
        const monthsAhead = day <= 25 ? 1 : 2;
        const targetDate = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);
        const ty = targetDate.getFullYear();
        const tm = targetDate.getMonth();
        const deadline = new Date(ty, tm - 1, 25);
        const deadlineLabel = `${deadline.getMonth() + 1}月${deadline.getDate()}日`;
        const daysUntilDeadline = Math.ceil((deadline - now) / 86400000);
        const monthPrefix = `${ty}-${String(tm + 1).padStart(2, "0")}`;
        const submittedIds = new Set(submissions.filter((s) => s.date.startsWith(monthPrefix)).map((s) => s.staffId));
        const notSubmitted = storeStaff.filter((p) => !submittedIds.has(p.id));
        if (notSubmitted.length === 0) return null;
        const urgent = daysUntilDeadline <= 3;
        return (
          <>
            <div className="perforated bg-white" />
            <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="icon-badge" style={{ background: urgent ? "#C4453B15" : "#8A6D1F15" }}><AlertTriangle size={15} style={{ color: urgent ? "#C4453B" : "#8A6D1F" }} /></span>
                <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>{ty}年{tm + 1}月分・希望シフト未提出者</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: urgent ? "#C4453B15" : "#8A6D1F15", color: urgent ? "#C4453B" : "#8A6D1F" }}>{notSubmitted.length}名</span>
              </div>
              <p className="text-xs mb-2" style={{ color: urgent ? "#C4453B" : "#8A8776" }}>
                締切：{deadlineLabel}（あと{daysUntilDeadline >= 0 ? `${daysUntilDeadline}日` : "締切済み"}）
              </p>
              <div className="flex flex-wrap gap-2">
                {notSubmitted.map((p) => (
                  <span key={p.id} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-medium" style={{ background: urgent ? "#C4453B15" : "#8A6D1F15", color: urgent ? "#C4453B" : "#8A6D1F" }}>
                    {isUnderSixMonths(p.hireDate, fmtISO(new Date())) && "🔰"}{p.name}
                  </span>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* Requested days-off summary — lets admin see who wants off before assigning */}
      {(() => {
        const offByDate = weekDates.map((date, dayIdx) => {
          const names = ganttStaff
            .filter((p) => {
              const sub = submissions.filter((s) => s.staffId === p.id && s.date === date);
              if (!sub.length) return false;
              const latest = sub[sub.length - 1];
              return latest.mode === "off" || (latest.available === false && !latest.leave);
            })
            .map((p) => p.name);
          return { date, dayIdx, names };
        }).filter((d) => d.names.length > 0);
        if (offByDate.length === 0) return null;
        return (
          <>
            <div className="perforated bg-white" />
            <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="icon-badge" style={{ background: "#C4453B15" }}><CalendarOff size={15} style={{ color: "#C4453B" }} /></span>
                <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>スタッフ希望休日一覧</h2>
              </div>
              <p className="text-xs mb-2" style={{ color: "#8A8776" }}>この週に「休み希望」が出ている日と、その人です。シフトを組む前にご確認ください。</p>
              <div className="flex flex-wrap gap-2">
                {offByDate.map(({ date, names }) => (
                  <div key={date} className="text-xs px-2.5 py-1.5 rounded" style={{ background: "#C4453B0D" }}>
                    <span className="font-semibold mono" style={{ color: "#C4453B" }}>{dispShort(date)}</span>
                    <span style={{ color: "#6B6A63" }}>：{names.join("・")}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* Staff notes summary — shown above shift creation so cautions are visible before assigning */}
      {(() => {
        const staffWithNotes = ganttStaff.map((p) => {
          const subNotes = submissions
            .filter((s) => s.staffId === p.id && weekDates.includes(s.date) && s.note && s.note.trim())
            .map((s) => ({ date: s.date, note: s.note.trim() }));
          return { p, subNotes };
        }).filter(({ p, subNotes }) => p.note || subNotes.length > 0);
        if (staffWithNotes.length === 0) return null;
        return (
          <>
            <div className="perforated bg-white" />
            <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="icon-badge" style={{ background: "#8A6D1F15" }}><MessageSquare size={15} style={{ color: "#8A6D1F" }} /></span>
                <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>備考のあるスタッフ</h2>
              </div>
              <div className="space-y-1.5">
                {staffWithNotes.map(({ p, subNotes }) => (
                  <div key={p.id} className="px-2.5 py-1.5 rounded" style={{ background: "#8A6D1F0D" }}>
                    <span className="font-semibold text-xs" style={{ color: staffColor(p.id) }}>{isUnderSixMonths(p.hireDate, fmtISO(new Date())) && "🔰"}{p.name}</span>
                    {p.note && (
                      <div className="flex items-start gap-1.5 text-xs mt-0.5">
                        <span className="text-[10px] px-1 py-0.5 rounded shrink-0" style={{ background: "#1B2A4A15", color: "#1B2A4A" }}>登録時</span>
                        <span style={{ color: "#6B6A63" }}>{p.note}</span>
                      </div>
                    )}
                    {subNotes.map((sn, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs mt-0.5">
                        <span className="text-[10px] px-1 py-0.5 rounded shrink-0" style={{ background: "#12756B15", color: "#12756B" }}>{dispShort(sn.date)}の希望</span>
                        <span style={{ color: "#6B6A63" }}>{sn.note}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* Coverage-gap check — verifies real headcount minute-by-minute within each slot, not just the total */}
      {coverageGapsList.length > 0 && (
        <>
          <div className="perforated bg-white" />
          <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="icon-badge" style={{ background: "#B5562B15" }}><AlertTriangle size={15} style={{ color: "#B5562B" }} /></span>
              <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>時間帯カバレッジのチェック</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#B5562B15", color: "#B5562B" }}>{coverageGapsList.length}件</span>
            </div>
            <p className="text-xs mb-2" style={{ color: "#8A8776" }}>枠全体では人数が揃っていても、時間帯の中に「実際にはその人数がいない時間」があると、ここに表示されます。</p>
            <div className="space-y-2">
              {coverageGapsList.map((g, i) => (
                <div key={i} className="px-3 py-2 rounded" style={{ background: "#B5562B0D", border: "1px solid #B5562B30" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "#1B2A4A" }}>{dispShort(g.date)} {g.slot.label}（必要{g.req}人）</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.segments.map((seg, j) => (
                      <span key={j} className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#B5562B15", color: "#B5562B" }}>
                        {seg.start}〜{seg.end}：{seg.count}人しかいません
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Violations list — every condition/hours/rest-day violation in one place */}
      {violationsList.length > 0 && (
        <>
          <div className="perforated bg-white" />
          <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="icon-badge" style={{ background: "#C4453B15" }}><AlertTriangle size={15} style={{ color: "#C4453B" }} /></span>
              <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>違反一覧</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#C4453B15", color: "#C4453B" }}>{violationsList.length}件</span>
            </div>
            <p className="text-xs mb-2" style={{ color: "#8A8776" }}>条件違反・週の勤務時間超過・法定休日なしなど、今の割り当てで見つかっている問題です。</p>
            <div className="space-y-1.5">
              {violationsList.map((v, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedStaffId(v.staffId); setShowStaffDetail(true); }}
                  className="w-full flex items-start gap-2 text-xs px-2.5 py-1.5 rounded text-left"
                  style={{ background: "#C4453B0D" }}
                >
                  <AlertTriangle size={12} color="#C4453B" className="mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold" style={{ color: "#1B2A4A" }}>{v.name}</span>
                    {v.date && <span className="mono" style={{ color: "#8A8776" }}> ・{dispShort(v.date)} {v.slotLabel}</span>}
                    <span style={{ color: "#C4453B" }}> ：{v.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Fixed-schedule list — everyone's usual hours + this week's assigned hours at a glance */}
      {storeStaff.length > 0 && (
        <>
          <div className="perforated bg-white" />
          <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
            <button onClick={() => setShowFixedScheduleList((v) => !v)} className="flex items-center gap-2 mb-2 w-full">
              <span className="icon-badge" style={{ background: "#3A5BA015" }}><Clock size={15} style={{ color: "#3A5BA0" }} /></span>
              <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>固定勤務一覧（全員）</h2>
              {showFixedScheduleList ? <ChevronUp size={14} className="ml-auto" style={{ color: "#1B2A4A" }} /> : <ChevronDown size={14} className="ml-auto" style={{ color: "#1B2A4A" }} />}
            </button>
            {showFixedScheduleList && (
              <>
            <p className="text-xs mb-2" style={{ color: "#8A8776" }}>普段の勤務時間と、この週すでに割り当てられている時間（上限に対して過不足がないか）です。行をタップするとその人の詳細に切り替わります。</p>
            <div className="rounded border overflow-hidden" style={{ borderColor: "#EFEDE7" }}>
              {(() => {
                const groups = {};
                storeStaff.forEach((p) => {
                  const key = p.usualStart && p.usualEnd ? `${p.usualStart}〜${p.usualEnd}` : "未登録";
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(p);
                });
                const sortedKeys = Object.keys(groups).sort((a, b) => (a === "未登録" ? 1 : b === "未登録" ? -1 : a.localeCompare(b)));
                return sortedKeys.map((timeKey, gi) => (
                  <div key={timeKey} style={{ borderTop: gi === 0 ? "none" : "1px solid #EFEDE7" }}>
                    <div className="px-2.5 py-1 text-[11px] font-semibold mono" style={{ background: "#1B2A4A0D", color: timeKey === "未登録" ? "#B5562B" : "#1B2A4A" }}>
                      {timeKey}（{groups[timeKey].length}名）
                    </div>
                    {groups[timeKey].map((p, i) => {
                      const hours = perStaffStats[p.id]?.hours || 0;
                      const over = hours > (p.maxHours || 9999);
                      const under = hours === 0;
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedStaffId(p.id); setShowStaffDetail(true); }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left flex-wrap"
                          style={{ background: i % 2 === 0 ? "#FAFAF8" : "white", borderTop: i === 0 ? "none" : "1px solid #F2F0EA" }}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: staffColor(p.id) }} />
                          <span className="font-medium shrink-0" style={{ color: "#1B2A4A", minWidth: 64 }}>{isUnderSixMonths(p.hireDate, fmtISO(new Date())) && "🔰"}{p.name}</span>
                          <span className="text-[11px] shrink-0 px-1.5 py-0.5 rounded" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>{p.type}</span>
                          <span className="mono ml-auto flex items-center gap-1" style={{ color: over ? "#C4453B" : under ? "#B5562B" : "#8A8776" }}>
                            {over && <AlertTriangle size={11} />}
                            {hours}h / 上限{p.maxHours}h
                            {over && " 超過"}
                            {under && " 未割当"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Interactive shift table: rows=date, columns=24h time axis, names on bars */}
      <div className="perforated bg-white" />
      <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <div className="flex items-center gap-2"><span className="icon-badge" style={{ background: "#1B2A4A15" }}><Clock size={15} style={{ color: "#1B2A4A" }} /></span><h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>シフト表（{storeName}）</h2></div>
          {conflictCount > 0 && <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#C4453B15", color: "#C4453B" }}><AlertTriangle size={12} /> 条件違反 {conflictCount}件</span>}
          <div className="ml-auto flex items-center gap-2">
            {(() => {
              const weekOverrideCount = Object.keys(requiredOverrides).filter((k) => k.startsWith(`${weekStart}__`)).length;
              if (weekOverrideCount === 0) return null;
              return (
                <button
                  onClick={() => {
                    if (!confirm(`この週には、特定の日だけ必要人数を変更している枠が${weekOverrideCount}件あります。すべて通常の人数に戻しますか？`)) return;
                    const next = { ...requiredOverrides };
                    Object.keys(next).forEach((k) => { if (k.startsWith(`${weekStart}__`)) delete next[k]; });
                    persistRequiredOverrides(next);
                  }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium"
                  style={{ background: "#D98E0415", color: "#8A6D1F" }}
                >
                  <AlertTriangle size={12} /> この週の人数特例（{weekOverrideCount}件）を確認
                </button>
              );
            })()}
            <button onClick={autoAssignBase} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium" style={{ background: "#12756B15", color: "#12756B" }}><RefreshCw size={12} /> 自動割り当て</button>
            <button onClick={() => persistAssignments({})} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ color: "#B5562B" }}><RotateCcw size={12} /> 全クリア</button>
            <button onClick={() => window.print()} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded font-medium" style={{ background: "#1B2A4A", color: "white" }}>
              <Copy size={12} />印刷する
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="mono text-xs mr-1" style={{ color: "#8A8776" }}>{dispShort(weekDates[0])}〜{dispShort(weekDates[6])}</span>
          <button onClick={() => persistWeekConfig({ weekStart: addDays(weekStart, -28) })} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>≪ 前月</button>
          <button onClick={() => persistWeekConfig({ weekStart: addDays(weekStart, -7) })} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>‹ 前週</button>
          {weekStart !== nextMonday() && (
            <button onClick={() => persistWeekConfig({ weekStart: nextMonday() })} className="text-xs px-2 py-1 rounded font-medium" style={{ color: "#8A8776" }}>今週</button>
          )}
          <button onClick={() => persistWeekConfig({ weekStart: addDays(weekStart, 7) })} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>翌週 ›</button>
          <button onClick={() => persistWeekConfig({ weekStart: addDays(weekStart, 28) })} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>翌月 ≫</button>
        </div>
        {autoAssignResult !== null && (
          <p className="text-xs mb-2 px-2 py-1.5 rounded" style={{ background: autoAssignResult > 0 ? "#12756B15" : "#D98E0415", color: autoAssignResult > 0 ? "#12756B" : "#8A6D1F" }}>
            {autoAssignResult > 0 ? `本人希望をもとに ${autoAssignResult} 枠を自動で割り当てました。残りの空き枠は手動で調整してください。` : "自動で割り当てられる枠はありませんでした（希望が未提出、または条件に合う人がいません）。"}
          </p>
        )}
        {lastToggle && (
          <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded" style={{ background: "#1B2A4A0D" }}>
            <span className="text-xs" style={{ color: "#1B2A4A" }}>
              {lastToggle.name} さんを{lastToggle.wasAssigned ? "解除" : "割り当て"}しました。
            </span>
            <button onClick={undoLastToggle} className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium text-white" style={{ background: "#1B2A4A" }}>
              <RotateCcw size={11} />元に戻す
            </button>
          </div>
        )}
        <p className="text-xs mb-3" style={{ color: "#8A8776" }}>名前付きのバーをタップすると、条件違反の理由・備考とあわせて「修正」「削除」ボタンが出ます（タップしただけで消えることはありません）。人が入っていない時間帯をタップすると割り当てられます（下の「過不足」欄に−1・−2として不足人数が表示されます）。縦＝日付、横＝24時制（朝7時始まり）の時間軸です。</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {TYPE_GROUP_ORDER.filter((t) => ganttStaff.some((p) => p.type === t)).map((t) => (
            <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${typeColor(t)}15`, color: typeColor(t) }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: typeColor(t) }} />{t}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto rounded border" style={{ borderColor: "#EFEDE7" }}>
          <div style={{ minWidth: 1440 }}>
            {/* hour header */}
            <div className="flex border-b" style={{ borderColor: "#EFEDE7" }}>
              <div style={{ width: 90 }} className="shrink-0 sticky left-0 bg-white z-10 border-r" />
              <div className="relative flex-1" style={{ height: 24 }}>
                {Array.from({ length: 25 }, (_, i) => i).map((axisH) => (
                  <div key={axisH} className="absolute top-0 h-full text-[10px] mono flex items-center" style={{ left: `${(axisH / 24) * 100}%`, color: "#8A8776", transform: axisH === 24 ? "translateX(-100%)" : "none" }}>{(AXIS_START_HOUR + axisH) % 24}:00</div>
                ))}
              </div>
            </div>
            {weekDates.length === 0 && (
              <div className="px-3 py-6 text-center text-sm" style={{ color: "#8A8776" }}>週の日付がありません。</div>
            )}
            {weekDates.map((date, dayIdx) => {
              // gather all (slot, staff) bars for this date; shortfall is tracked separately as an hourly strip
              const rawBars = [];
              const hourlyRequired = Array(24).fill(0); // index = axis-hour bucket (0 = AXIS_START_HOUR); max required across overlapping slots
              const hourlyAssigned = Array.from({ length: 24 }, () => new Set()); // distinct staff actually working that hour
              slots.forEach((slot) => {
                const ids = assignments[key(dayIdx, slot.id)] || [];
                const geom = slotGeom[slot.id];
                const req = getRequired(dayIdx, slot);
                ids.forEach((staffId) => {
                  const p = ganttStaff.find((x) => x.id === staffId) || staff.find((x) => x.id === staffId);
                  if (!p) return;
                  const effTime = getAssignmentTime(dayIdx, slot, staffId);
                  const eff = effectiveWindow(staffId, date);
                  const availReason = availabilityConflict(eff, geom);
                  const nightConflict = !personNightOk(p) && isNightSlot(geom);
                  const tenureConflict = isUnderSixMonths(p.hireDate, fmtISO(new Date()));
                  const conflict = availReason || nightConflict || tenureConflict;
                  const assignedTasks = taskAssignments[atKey(dayIdx, slot.id, staffId)] || [];
                  const displayTasks = p.isLeader ? [...new Set(["👑 リーダー", ...assignedTasks])] : assignedTasks;
                  rawBars.push({ isEmpty: false, staffId, name: p.name, isNewHire: tenureConflict, color: typeColor(p.type), startHour: toAxisHour(effTime.startHour), hours: effTime.hours, slot, effTime, conflict, conflictReasons: [availReason, nightConflict && "深夜不可", tenureConflict && "入社6ヶ月未満"].filter(Boolean), note: eff.note, assignedTasks: displayTasks, overCapacity: ids.length > req });
                });
                const bStart = toAxisHour(geom.startHour);
                for (let i = 0; i < geom.hours; i++) {
                  const h = Math.floor(bStart + i) % 24;
                  hourlyRequired[h] = Math.max(hourlyRequired[h], req);
                  ids.forEach((id) => hourlyAssigned[h].add(id));
                }
                const deficit = req - ids.length;
                if (deficit > 0) {
                  // still register an (invisible) tappable bar so staff can be assigned into the gap
                  rawBars.push({ isEmpty: true, slot, startHour: toAxisHour(geom.startHour), hours: geom.hours, have: ids.length, req });
                }
              });
              const hourlyDeficit = hourlyRequired.map((req, h) => Math.max(0, req - hourlyAssigned[h].size));
              // assign lanes to avoid overlap
              rawBars.sort((a, b) => a.startHour - b.startHour);
              const laneEnds = [];
              const bars = rawBars.map((bar) => {
                let lane = laneEnds.findIndex((end) => end <= bar.startHour + 0.001);
                if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
                laneEnds[lane] = bar.startHour + bar.hours;
                return { ...bar, lane };
              });
              const laneCount = Math.max(laneEnds.length, 1);
              const rowH = laneCount * 26 + 10;
              const dayPickerOpen = assignPickerKey && assignPickerKey.startsWith(`${weekStart}__${dayIdx}__`);
              const dayTimeEditOpen = editingTimeKey && editingTimeKey.split("__")[1] === String(dayIdx);
              return (
                <React.Fragment key={date}>
                  <div className="flex border-b" style={{ borderColor: "#F2F0EA", height: rowH }}>
                    <div style={{ width: 90 }} className="shrink-0 sticky left-0 bg-white z-10 border-r flex flex-col justify-center px-2">
                      <span className="text-xs font-semibold mono" style={{ color: "#1B2A4A" }}>{dispShort(date)}</span>
                    </div>
                    <div className="relative flex-1">
                      {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                        <div key={h} className="absolute top-0 h-full border-r" style={{ left: `${(h / 24) * 100}%`, borderColor: "#F7F6F2" }} />
                      ))}
                      {bars.length === 0 ? (
                        <span className="absolute inset-0 flex items-center text-[11px] px-2" style={{ color: "#D8D6CE" }}>—</span>
                      ) : (
                        bars.map((bar, i) => {
                          const left = (bar.startHour / 24) * 100;
                          const visibleHours = Math.min(bar.hours, 24 - bar.startHour);
                          const width = (visibleHours / 24) * 100;
                          const crosses = bar.hours > visibleHours + 0.001;
                          if (bar.isEmpty) {
                            const rk = `${weekStart}__${dayIdx}__${bar.slot.id}`;
                            return (
                              <button
                                key={`empty-${bar.slot.id}-${i}`}
                                onClick={() => setAssignPickerKey(assignPickerKey === rk ? null : rk)}
                                className="absolute rounded"
                                style={{ left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)`, top: bar.lane * 26 + 5, height: 22, background: "transparent" }}
                                title={`${dispShort(date)} ${bar.slot.label} タップして割り当て（不足${bar.req - bar.have}名）`}
                              />
                            );
                          }
                          const tKey = atKey(dayIdx, bar.slot.id, bar.staffId);
                          return (
                            <button
                              key={`${bar.staffId}-${bar.slot.id}-${i}`}
                              onClick={() => setActionPanelKey(actionPanelKey === tKey ? null : tKey)}
                              className="absolute rounded flex items-center justify-center overflow-hidden"
                              style={{
                                left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)`,
                                top: bar.lane * 26 + 5, height: 22,
                                background: bar.color,
                                border: bar.conflict ? "2px solid #C4453B" : bar.overCapacity ? "2px solid #D98E04" : bar.effTime.isOverride ? "2px dashed white" : "none",
                              }}
                              title={`${dispShort(date)} ${bar.slot.label} ${bar.effTime.start}-${bar.effTime.end} ${bar.name}${bar.effTime.isOverride ? "（手動調整済み）" : ""}${bar.conflict ? ` ⚠ ${bar.conflictReasons.join("・")}` : ""}${bar.overCapacity ? " ⚠ 必要人数を超えて割り当てられています" : ""}${bar.note ? ` 備考:${bar.note}` : ""}`}
                            >
                              <span className="mono text-[10px] text-white px-1 truncate font-medium flex items-center gap-0.5">
                                {bar.conflict && <AlertTriangle size={9} />}{!bar.conflict && bar.overCapacity && <AlertTriangle size={9} color="#D98E04" />}{bar.isNewHire && "🔰"}{bar.assignedTasks?.map((t) => t.match(/^\S+/)?.[0]).join("")}{bar.name}{crosses && " →"}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="flex border-b" style={{ borderColor: "#F2F0EA", height: 18 }}>
                    <div style={{ width: 90 }} className="shrink-0 sticky left-0 bg-white z-10 border-r flex items-center px-2">
                      <span className="text-[9px]" style={{ color: "#8A8776" }}>過不足</span>
                    </div>
                    <div className="relative flex-1">
                      {hourlyDeficit.map((d, hIdx) => (
                        <div
                          key={hIdx}
                          className="absolute top-0 h-full border-r flex items-center justify-center text-[9px] font-bold"
                          style={{
                            left: `${(hIdx / 24) * 100}%`, width: `${(1 / 24) * 100}%`,
                            borderColor: "#F7F6F2",
                            background: d > 0 ? "#C4453B15" : "transparent",
                            color: "#C4453B",
                          }}
                        >
                          {d > 0 ? `-${d}` : ""}
                        </div>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    if (!actionPanelKey || !actionPanelKey.startsWith(`${weekStart}__${dayIdx}__`)) return null;
                    const parts = actionPanelKey.split("__");
                    const slotId = parts[2];
                    const staffId = parts.slice(3).join("__");
                    const slot = slots.find((s) => s.id === slotId);
                    const p = ganttStaff.find((x) => x.id === staffId) || staff.find((x) => x.id === staffId);
                    if (!slot || !p) return null;
                    const effTime = getAssignmentTime(dayIdx, slot, staffId);
                    const eff = effectiveWindow(staffId, date);
                    const geom = slotGeom[slot.id];
                    const availReason = availabilityConflict(eff, geom);
                    const nightConflict = !personNightOk(p) && isNightSlot(geom);
                    const tenureConflict = isUnderSixMonths(p.hireDate, fmtISO(new Date()));
                    const reasons = [availReason, nightConflict && "深夜不可", tenureConflict && "入社6ヶ月未満"].filter(Boolean);
                    return (
                      <div className="px-2.5 py-2 border-b" style={{ borderColor: "#EFEDE7", background: reasons.length ? "#C4453B0D" : "#FAFAF8" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: "#1B2A4A" }}>{isUnderSixMonths(p.hireDate, fmtISO(new Date())) && "🔰"}{p.name}さん・{dispShort(date)} {slot.label}（{effTime.start}〜{effTime.end}）</span>
                          <button onClick={() => setActionPanelKey(null)} className="text-xs px-2 py-0.5 rounded" style={{ background: "#1B2A4A", color: "white" }}>閉じる</button>
                        </div>
                        {reasons.length > 0 && (
                          <div className="flex items-start gap-1.5 mb-2 text-xs" style={{ color: "#C4453B" }}>
                            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                            <span>条件違反：{reasons.join("・")}</span>
                          </div>
                        )}
                        {p.note && (
                          <div className="flex items-start gap-1.5 mb-2 text-xs" style={{ color: "#8A6D1F" }}>
                            <MessageSquare size={13} className="mt-0.5 shrink-0" />
                            <span>備考：{p.note}</span>
                          </div>
                        )}
                        {taskItems.length > 0 && (() => {
                          const tKey2 = atKey(dayIdx, slotId, staffId);
                          const assignedTasks = taskAssignments[tKey2] || [];
                          return (
                            <div className="mb-2">
                              <span className="text-[11px] block mb-1" style={{ color: "#6B6A63" }}>担当作業（タップで割り当て/解除）</span>
                              <div className="flex flex-wrap gap-1.5">
                                {taskItems.map((task) => {
                                  const on = assignedTasks.includes(task);
                                  return (
                                    <button
                                      key={task}
                                      onClick={() => {
                                        const next = on ? assignedTasks.filter((t) => t !== task) : [...assignedTasks, task];
                                        persistTaskAssignments({ ...taskAssignments, [tKey2]: next });
                                      }}
                                      className="text-xs px-2 py-1 rounded-full font-medium"
                                      style={on ? { background: "#12756B", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                                    >
                                      {task}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setTimeDraft({ start: effTime.start, end: effTime.end });
                              setEditingTimeKey(atKey(dayIdx, slotId, staffId));
                              setActionPanelKey(null);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded font-medium"
                            style={{ background: "#1B2A4A15", color: "#1B2A4A" }}
                          >
                            <Pencil size={12} />修正（時間を変更）
                          </button>
                          <button
                            onClick={() => {
                              toggleAssign(dayIdx, slotId, staffId);
                              setActionPanelKey(null);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded font-medium"
                            style={{ background: "#C4453B15", color: "#C4453B" }}
                          >
                            <Trash2 size={12} />削除（割り当て解除）
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {dayPickerOpen && (() => {
                    const parts = assignPickerKey.split("__");
                    const slotId = parts[2];
                    const slot = slots.find((s) => s.id === slotId);
                    if (!slot) return null;
                    const already = assignments[key(dayIdx, slotId)] || [];
                    const req = getRequired(dayIdx, slot);
                    const rk = `${weekStart}__${dayIdx}__${slotId}`;
                    const hasOverride = requiredOverrides[rk] !== undefined;
                    const defaultReq = slotDayCounts(slot)[dayIdx];
                    const candidates = ganttStaff.filter((p) => !already.includes(p.id));
                    return (
                      <div className="px-2 py-2 border-b" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                          <span className="text-xs" style={{ color: "#6B6A63" }}>{dispShort(date)} {slot.label}（{slot.start}〜{slot.end}）に割り当て　必要人数：
                            <input
                              type="number" min={0} value={req}
                              onChange={(e) => setRequiredFor(dayIdx, slot, Number(e.target.value))}
                              className="mono text-xs border rounded px-1.5 py-0.5 w-12 outline-none mx-1"
                              style={{ borderColor: hasOverride ? "#D98E04" : "#DCD9D0" }}
                            />人
                            {hasOverride && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#D98E0415", color: "#8A6D1F" }}>
                                この日だけ変更中（通常は{defaultReq}人）
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {hasOverride && (
                              <button onClick={() => resetRequiredFor(dayIdx, slot)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#8A6D1F15", color: "#8A6D1F" }}>
                                通常人数に戻す
                              </button>
                            )}
                            <button onClick={() => setAssignPickerKey(null)} className="text-xs px-2 py-1 rounded" style={{ background: "#1B2A4A", color: "white" }}>閉じる</button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {candidates.length === 0 ? (
                            <span className="text-xs" style={{ color: "#8A8776" }}>割り当て可能なスタッフがいません。</span>
                          ) : candidates.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => { toggleAssign(dayIdx, slotId, p.id); }}
                              className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{ background: `${staffColor(p.id)}15`, color: staffColor(p.id) }}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {dayTimeEditOpen && (() => {
                    const parts = editingTimeKey.split("__");
                    const slotId = parts[2];
                    const staffId = parts.slice(3).join("__");
                    const slot = slots.find((s) => s.id === slotId);
                    const p = ganttStaff.find((x) => x.id === staffId) || staff.find((x) => x.id === staffId);
                    if (!slot || !p) return null;
                    return (
                      <div className="flex items-center gap-2 px-2 py-1.5 border-b flex-wrap" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                        <span className="text-xs" style={{ color: "#6B6A63" }}>{p.name}・{dispShort(date)} {slot.label} の時間を手入力</span>
                        <input value={timeDraft.start} onChange={(e) => setTimeDraft({ ...timeDraft, start: e.target.value })} className="mono text-xs border rounded px-1.5 py-1 w-16 outline-none text-center" style={{ borderColor: "#DCD9D0" }} />
                        <span style={{ color: "#8A8776" }}>〜</span>
                        <input value={timeDraft.end} onChange={(e) => setTimeDraft({ ...timeDraft, end: e.target.value })} className="mono text-xs border rounded px-1.5 py-1 w-16 outline-none text-center" style={{ borderColor: "#DCD9D0" }} />
                        <button onClick={() => saveAssignmentTime(dayIdx, slotId, staffId)} className="text-xs px-2.5 py-1 rounded font-medium" style={{ background: "#12756B", color: "white" }}>保存</button>
                        {assignmentTimeOverrides[editingTimeKey] && (
                          <button onClick={() => resetAssignmentTime(dayIdx, slotId, staffId)} className="text-xs" style={{ color: "#C4453B" }}>時間帯の基本値に戻す</button>
                        )}
                        <button onClick={() => setEditingTimeKey(null)} className="ml-auto text-xs px-2 py-1 rounded" style={{ background: "#1B2A4A", color: "white" }}>閉じる</button>
                      </div>
                    );
                  })()}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[11px]" style={{ color: "#8A8776" }}>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm" style={{ border: "1px dashed #D98E04", background: "#D98E0415" }} />不足あり（タップで割り当て）</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm" style={{ border: "2px solid #C4453B" }} />条件違反（タップで理由を表示）</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm" style={{ border: "2px dashed #1B2A4A" }} />時間を手動調整済み</span>
        </div>

      </div>

      {/* Staff-created shift-swap requests (代わりを募集) */}
      {swapPostings.length > 0 && (
        <>
          <div className="perforated bg-white" />
          <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Megaphone size={16} style={{ color: "#8A6D1F" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>スタッフからの「代わり募集」</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#8A6D1F15", color: "#8A6D1F" }}>{swapPostings.length}件</span>
            </div>
            <p className="text-xs mb-3" style={{ color: "#8A8776" }}>スタッフが自分の確定シフトの代わりを探している募集です。承認すると自動で本人と入れ替わります。</p>
            <div className="space-y-2">
              {swapPostings.map((sp) => {
                const applicants = sp.posting.applicants || {};
                const pendingApps = Object.entries(applicants).filter(([, a]) => a.status === "pending");
                return (
                  <div key={sp.pk} className="rounded border px-3 py-2" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                    <div className="text-xs mono mb-1" style={{ color: "#1B2A4A" }}>
                      {dispShort(sp.date)} {sp.slot.label}({sp.slot.start}-{sp.slot.end})　
                      <span style={{ color: "#8A6D1F" }}>{sp.replacingPerson?.name || "?"} さんの代わり</span>
                      {sp.posting.note && <span style={{ color: "#8A8776" }}>　「{sp.posting.note}」</span>}
                    </div>
                    {pendingApps.length === 0 ? (
                      <p className="text-xs" style={{ color: "#8A8776" }}>まだ応募はありません。</p>
                    ) : (
                      <div className="space-y-1.5">
                        {pendingApps.map(([appKey, a]) => (
                          <div key={appKey} className="flex items-center justify-between gap-2 text-xs flex-wrap">
                            <div>
                              <span style={{ color: "#1B2A4A" }}>{a.name}（{a.homeStore}・{a.attribute || "—"}）</span>
                              {a.experienceBands?.length > 0 && <div className="text-[10px] mt-0.5" style={{ color: "#8A8776" }}>経験：{a.experienceBands.join("・")}</div>}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={async () => {
                                  let existingPerson = staff.find((p) => p.isGig && p.name === a.name && p.homeStore === a.homeStore);
                                  let newId = existingPerson?.id;
                                  if (!existingPerson) {
                                    const newEntry = { id: nextId("g"), name: a.name, wage: sp.replacingPerson?.wage || effectiveGigWage, type: a.attribute || "スキマ", maxHours: 999, nightOk: true, maxConsecutive: 99, isGig: true, phone: a.phone || "", homeStore: a.homeStore, experienceBands: a.experienceBands || [] };
                                    await persistRoster([...staff, newEntry]);
                                    newId = newEntry.id;
                                  }
                                  const asgKey = `${sp.weekStartPart}__${sp.dayIdx}__${sp.slot.id}`;
                                  const current = assignments[asgKey] || [];
                                  const next = current.filter((id) => id !== sp.posting.replacingStaffId);
                                  if (!next.includes(newId)) next.push(newId);
                                  await persistAssignments({ ...assignments, [asgKey]: next });
                                  const nextApplicants = { ...applicants, [appKey]: { ...a, status: "approved" } };
                                  await persistPostings({ ...postings, [sp.pk]: { ...sp.posting, applicants: nextApplicants, open: false } });
                                }}
                                className="px-2 py-0.5 rounded font-medium" style={{ background: "#2F7D4F", color: "white" }}
                              >✓ 承認（入れ替え）</button>
                              <button
                                onClick={() => persistPostings({ ...postings, [sp.pk]: { ...sp.posting, applicants: { ...applicants, [appKey]: { ...a, status: "rejected" } } } })}
                                className="px-2 py-0.5 rounded font-medium" style={{ background: "#EFEDE7", color: "#6B6A63" }}
                              >見送り</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Gap shifts / gig recruiting */}
      {gapShifts.length > 0 && (
        <>
          <div className="perforated bg-white" />
          <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <AlertTriangle size={16} style={{ color: "#B5562B" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>不足シフト（スポット募集・承認制）</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#D98E0415", color: "#B5562B" }}>{gapShifts.length}件</span>
            </div>
            <p className="text-xs mb-3" style={{ color: "#8A8776" }}>
              「募集をかける」と「募集に応募」画面に公開されます。応募は即反映せず、ここで承認するとシフト表に反映されます。外部アプリ用の文面コピーも引き続き使えます。
            </p>
            <label className="flex items-center gap-2 mb-3 text-xs" style={{ color: "#6B6A63" }}>
              スキマバイト提示時給（未入力なら自動で最高時給+100円）
              <input type="number" value={gigWage || ""} onChange={(e) => setGigWage(Number(e.target.value))} placeholder={String(effectiveGigWage)} className="mono text-xs border rounded px-1.5 py-0.5 w-20 outline-none" style={{ borderColor: "#DCD9D0" }} />円
            </label>
            <div className="space-y-2 mb-3">
              {gapShifts.map((gap) => {
                const pk = `${weekStart}__${gap.id}`;
                const posting = postings[pk];
                const isOpen = posting?.open;
                const applicants = posting?.applicants || {};
                const pendingApps = Object.entries(applicants).filter(([, a]) => a.status === "pending");
                const night = isNightSlot(slotGeom[gap.slot.id]);
                const locked = adminRole === "store" && posting?.password && !unlockedPostings[pk];
                const neverCreated = !posting;
                const draft = deadlineDrafts[pk] || { date: gap.date, time: "17:00" };

                return (
                  <div key={gap.id} className="rounded border px-3 py-2" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs mono" style={{ color: "#1B2A4A" }}>
                        {dispShort(gap.date)} {gap.slot.label}({gap.slot.start}-{gap.slot.end})　
                        <span style={{ color: "#B5562B" }}>
                          {posting?.recruitCount !== undefined
                            ? `あと${Math.max(posting.recruitCount - Object.values(applicants).filter((a) => a.status === "approved").length, 0)}名（募集人数${posting.recruitCount}名）`
                            : `あと${gap.short}名（${gap.have}/${gap.need}）`}
                        </span>
                        {isOpen && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#12756B15", color: "#12756B" }}>募集中</span>}
                        {posting?.password && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>🔒パスワード管理</span>}
                        {posting?.deadline && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#B5562B15", color: "#B5562B" }}>締切 {dispShort(posting.deadline.split("T")[0])} {posting.deadline.split("T")[1]}</span>}
                        {night && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#2b2f4a15", color: "#3a3d6b" }}>🌙深夜手当</span>}
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#2f7d4f15", color: "#2f7d4f" }}>🚃¥{commuteFare}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => copyGap(gap)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium" style={{ background: copiedGapId === gap.id ? "#2F7D4F" : "#1B2A4A", color: "white" }}>
                          {copiedGapId === gap.id ? <Check size={12} /> : <Copy size={12} />}{copiedGapId === gap.id ? "コピー済" : "外部用文面"}
                        </button>
                      </div>
                    </div>

                    {neverCreated ? (
                      <div className="mt-2 pt-2 border-t space-y-1.5" style={{ borderColor: "#EFEDE7" }}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px]" style={{ color: "#6B6A63" }}>募集人数</span>
                          <input
                            type="number"
                            min={1}
                            value={recruitCountDrafts[pk] !== undefined ? recruitCountDrafts[pk] : gap.short}
                            onChange={(e) => setRecruitCountDrafts({ ...recruitCountDrafts, [pk]: Math.max(1, Number(e.target.value)) })}
                            className="text-xs border rounded px-1.5 py-1 w-14 outline-none mono"
                            style={{ borderColor: "#DCD9D0" }}
                          />
                          <span className="text-[11px]" style={{ color: "#8A8776" }}>名（不足{gap.short}名。1件の募集でまとめて何名でも受け付けられます）</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px]" style={{ color: "#6B6A63" }}>応募締切</span>
                          <input
                            type="date"
                            value={draft.date}
                            onChange={(e) => setDeadlineDrafts({ ...deadlineDrafts, [pk]: { ...draft, date: e.target.value } })}
                            className="text-xs border rounded px-1.5 py-1 outline-none"
                            style={{ borderColor: "#DCD9D0" }}
                          />
                          <select
                            value={draft.time}
                            onChange={(e) => setDeadlineDrafts({ ...deadlineDrafts, [pk]: { ...draft, time: e.target.value } })}
                            className="text-xs border rounded px-1.5 py-1 outline-none mono"
                            style={{ borderColor: "#DCD9D0" }}
                          >
                            {HALF_HOUR_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        {adminRole === "store" && (
                          <input
                            type="password"
                            placeholder="この募集の管理パスワードを設定"
                            value={pwDrafts[pk] || ""}
                            onChange={(e) => setPwDrafts({ ...pwDrafts, [pk]: e.target.value })}
                            className="text-xs border rounded px-2 py-1 outline-none w-full"
                            style={{ borderColor: "#DCD9D0" }}
                          />
                        )}
                        <button
                          onClick={() => {
                            if (adminRole === "store" && !(pwDrafts[pk] || "").trim()) { alert("パスワードを入力してください"); return; }
                            const deadline = `${draft.date}T${draft.time}`;
                            const recruitCount = recruitCountDrafts[pk] !== undefined ? recruitCountDrafts[pk] : gap.short;
                            const payload = { open: true, wage: effectiveGigWage, note: gap.slot.label, helpStore: storeName, applicants: {}, deadline, recruitCount };
                            if (adminRole === "store") payload.password = pwDrafts[pk].trim();
                            persistPostings({ ...postings, [pk]: payload });
                            sendPushNotification("新しい募集があります", `${storeName}：${gap.slot.label}（スキマワーク）`);
                            if (adminRole === "store") setUnlockedPostings((prev) => ({ ...prev, [pk]: true }));
                          }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium"
                          style={{ background: "#12756B", color: "white" }}
                        >
                          <Megaphone size={12} />募集をかける
                        </button>
                      </div>
                    ) : locked ? (
                      <div className="mt-2 pt-2 border-t flex items-center gap-1.5" style={{ borderColor: "#EFEDE7" }}>
                        <input
                          type="password"
                          placeholder="パスワードを入力してロック解除"
                          value={pwDrafts[pk] || ""}
                          onChange={(e) => setPwDrafts({ ...pwDrafts, [pk]: e.target.value })}
                          className="text-xs border rounded px-2 py-1 outline-none flex-1"
                          style={{ borderColor: "#DCD9D0" }}
                        />
                        <button
                          onClick={() => unlockPosting(pk, posting)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium"
                          style={{ background: "#1B2A4A", color: "white" }}
                        >
                          🔓 ロック解除
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: "#EFEDE7" }}>
                        {editingPostingPk === pk ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px]" style={{ color: "#6B6A63" }}>時給</span>
                              <input type="number" value={editDraft.wage} onChange={(e) => setEditDraft({ ...editDraft, wage: Number(e.target.value) })} className="mono text-xs border rounded px-1.5 py-1 w-20 outline-none" style={{ borderColor: "#DCD9D0" }} />
                              <span className="text-[11px]" style={{ color: "#6B6A63" }}>募集人数</span>
                              <input type="number" min={1} value={editDraft.recruitCount} onChange={(e) => setEditDraft({ ...editDraft, recruitCount: Math.max(1, Number(e.target.value)) })} className="mono text-xs border rounded px-1.5 py-1 w-14 outline-none" style={{ borderColor: "#DCD9D0" }} />名
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px]" style={{ color: "#6B6A63" }}>メモ</span>
                              <input value={editDraft.note} onChange={(e) => setEditDraft({ ...editDraft, note: e.target.value })} className="text-xs border rounded px-1.5 py-1 flex-1 outline-none" style={{ borderColor: "#DCD9D0" }} />
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px]" style={{ color: "#6B6A63" }}>締切</span>
                              <input type="date" value={editDraft.date} onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })} className="text-xs border rounded px-1.5 py-1 outline-none" style={{ borderColor: "#DCD9D0" }} />
                              <select value={editDraft.time} onChange={(e) => setEditDraft({ ...editDraft, time: e.target.value })} className="text-xs border rounded px-1.5 py-1 outline-none mono" style={{ borderColor: "#DCD9D0" }}>
                                {HALF_HOUR_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  persistPostings({ ...postings, [pk]: { ...posting, wage: editDraft.wage, recruitCount: editDraft.recruitCount, note: editDraft.note, deadline: editDraft.date ? `${editDraft.date}T${editDraft.time}` : null } });
                                  setEditingPostingPk(null);
                                }}
                                className="text-xs px-2.5 py-1 rounded font-medium" style={{ background: "#12756B", color: "white" }}
                              >保存</button>
                              <button onClick={() => setEditingPostingPk(null)} className="text-xs px-2.5 py-1 rounded font-medium" style={{ background: "#EFEDE7", color: "#6B6A63" }}>キャンセル</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => persistPostings({ ...postings, [pk]: { ...posting, open: !isOpen } })}
                              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium"
                              style={isOpen ? { background: "#C4453B15", color: "#C4453B" } : { background: "#12756B", color: "white" }}
                            >
                              <Megaphone size={12} />{isOpen ? "募集を止める" : "募集を再開する"}
                            </button>
                            <button
                              onClick={() => {
                                const [d, t] = (posting.deadline || `${gap.date}T17:00`).split("T");
                                setEditDraft({ wage: posting.wage || effectiveGigWage, recruitCount: posting.recruitCount !== undefined ? posting.recruitCount : gap.short, note: posting.note || "", date: d, time: t });
                                setEditingPostingPk(pk);
                              }}
                              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium"
                              style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}
                            >
                              <Pencil size={12} />訂正
                            </button>
                            <button
                              onClick={() => {
                                if (!confirm("この募集を削除しますか？（応募履歴も含めて削除されます）")) return;
                                const next = { ...postings };
                                delete next[pk];
                                persistPostings(next);
                              }}
                              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded font-medium"
                              style={{ background: "#C4453B15", color: "#C4453B" }}
                            >
                              <Trash2 size={12} />削除
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!locked && !neverCreated && pendingApps.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1.5" style={{ borderColor: "#EFEDE7" }}>
                        <span className="text-[10px] font-medium" style={{ color: "#8A6D1F" }}>承認待ちの応募</span>
                        {pendingApps.map(([appKey, a]) => (
                          <div key={appKey} className="flex items-center justify-between gap-2 text-xs flex-wrap">
                            <div>
                              <span style={{ color: "#1B2A4A" }}>{a.name}（{a.homeStore}・{a.attribute || "—"}）</span>
                              {a.experienceBands?.length > 0 && (
                                <div className="text-[10px] mt-0.5" style={{ color: "#8A8776" }}>経験：{a.experienceBands.join("・")}</div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={async () => {
                                  let existing = staff.find((p) => p.isGig && p.name === a.name && p.homeStore === a.homeStore);
                                  let gigId = existing?.id;
                                  if (!existing) {
                                    const newEntry = { id: nextId("g"), name: a.name, wage: posting.wage || effectiveGigWage, type: a.attribute || "スキマ", maxHours: 999, nightOk: true, maxConsecutive: 99, isGig: true, phone: a.phone || "", homeStore: a.homeStore, experienceBands: a.experienceBands || [] };
                                    await persistRoster([...staff, newEntry]);
                                    gigId = newEntry.id;
                                  }
                                  const asgKey = key(gap.dayIdx, gap.slot.id);
                                  const nextIds = [...(assignments[asgKey] || []), gigId];
                                  await persistAssignments({ ...assignments, [asgKey]: nextIds });
                                  const nextApplicants = { ...applicants, [appKey]: { ...a, status: "approved" } };
                                  const approvedCount = Object.values(nextApplicants).filter((x) => x.status === "approved").length;
                                  const targetCount = posting.recruitCount !== undefined ? posting.recruitCount : getRequired(gap.dayIdx, gap.slot);
                                  await persistPostings({ ...postings, [pk]: { ...posting, applicants: nextApplicants, open: approvedCount < targetCount } });
                                }}
                                className="px-2 py-0.5 rounded font-medium" style={{ background: "#2F7D4F", color: "white" }}
                              >✓ 承認</button>
                              <button
                                onClick={() => persistPostings({ ...postings, [pk]: { ...posting, applicants: { ...applicants, [appKey]: { ...a, status: "rejected" } } } })}
                                className="px-2 py-0.5 rounded font-medium" style={{ background: "#EFEDE7", color: "#6B6A63" }}
                              >見送り</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={copyAllGaps} className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded font-medium" style={{ background: copiedAllGaps ? "#2F7D4F15" : "#1B2A4A0D", color: copiedAllGaps ? "#2F7D4F" : "#1B2A4A" }}>
              {copiedAllGaps ? <Check size={13} /> : <Copy size={13} />}{copiedAllGaps ? "コピーしました" : `全${gapShifts.length}件をまとめてコピー`}
            </button>
          </div>
        </>
      )}

      {/* Spot report: cross-store help summary */}
      {staff.some((p) => p.isGig) && (
        <>
          <div className="perforated bg-white" />
          <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-3"><Briefcase size={16} style={{ color: "#1B2A4A" }} /><h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>スポット実績レポート（所属店舗別・当店負担）</h2></div>
            {(() => {
              const gigStaff = staff.filter((p) => p.isGig);
              const rows = [];
              gigStaff.forEach((p) => {
                let hours = 0, count = 0;
                Object.entries(assignments).forEach(([k, ids]) => {
                  if (!ids.includes(p.id)) return;
                  const parts = k.split("__");
                  const slotId = parts[2];
                  const slot = allSlots.find((s) => s.id === slotId);
                  if (!slot) return;
                  const s = parseHour(slot.start);
                  let e = parseHour(slot.end);
                  if (e <= s) e += 24;
                  hours += e - s;
                  count += 1;
                });
                if (count > 0) rows.push({ name: p.name, homeStore: p.homeStore || "—", hours, count, fare: count * commuteFare });
              });
              if (!rows.length) return <p className="text-xs" style={{ color: "#8A8776" }}>まだヘルプ実績はありません。</p>;
              const totalFare = rows.reduce((s, r) => s + r.fare, 0);
              return (
                <>
                  <div className="space-y-1.5 mb-3">
                    {rows.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ background: "#FAFAF8" }}>
                        <span style={{ color: "#1B2A4A" }}>{r.name}（{r.homeStore}）</span>
                        <span className="mono" style={{ color: "#6B6A63" }}>{r.count}回／{r.hours}h／交通費¥{r.fare.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold border-t pt-2" style={{ borderColor: "#EFEDE7", color: "#1B2A4A" }}>
                    <span>{storeName} の負担合計（交通費）</span>
                    <span>¥{totalFare.toLocaleString()}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}


      {/* Monthly posting fulfillment history */}
      {Object.keys(fulfillmentHistory).length > 0 && (
        <>
          <div className="perforated bg-white" />
          <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} style={{ color: "#1B2A4A" }} /><h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>募集成立の実績（月別）</h2></div>
            <p className="text-xs mb-3" style={{ color: "#8A8776" }}>
              {adminRole === "operator" ? "全店舗の、応募が承認されて成立した募集の件数です。" : `${storeName} で応募が承認されて成立した募集の件数です。`}
            </p>
            <div className="space-y-3">
              {Object.entries(fulfillmentHistory)
                .filter(([store]) => adminRole === "operator" || store === storeName)
                .sort(([a], [b]) => a.localeCompare(b, "ja"))
                .map(([store, months]) => (
                  <div key={store}>
                    <div className="text-xs font-semibold mb-1" style={{ color: "#1B2A4A" }}>{store}</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(months)
                        .sort(([a], [b]) => (a < b ? 1 : -1))
                        .map(([month, count]) => (
                          <span key={month} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#12756B15", color: "#12756B" }}>
                            {month.replace("-", "年")}月：{count}件
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              {adminRole !== "operator" && !fulfillmentHistory[storeName] && (
                <p className="text-xs" style={{ color: "#8A8776" }}>まだ成立した募集はありません。</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Application history grouped by help store (for payment tracking) */}
      {Object.keys(postings).length > 0 && (
        <>
          <div className="perforated bg-white" />
          <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-1"><Briefcase size={16} style={{ color: "#1B2A4A" }} /><h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>応募履歴（募集をかけた店舗別）</h2></div>
            <p className="text-xs mb-3" style={{ color: "#8A8776" }}>
              支払いは募集をかけた店舗から応援者へ行うため、店舗ごとにまとめて表示しています。
              {adminRole === "operator" && operatorUnlocked && "運営モードでは全件の訂正・削除ができます。"}
            </p>
            {(() => {
              const byMonth = {};
              Object.entries(postings).forEach(([pk, posting]) => {
                const parts = pk.split("__");
                const date = parts[1];
                const slotId = parts[2];
                const slot = allSlots.find((s) => s.id === slotId);
                const helpStore = posting.helpStore || storeName;
                const monthKey = date ? date.slice(0, 7) : "不明";
                Object.entries(posting.applicants || {}).forEach(([appKey, a]) => {
                  if (!byMonth[monthKey]) byMonth[monthKey] = {};
                  if (!byMonth[monthKey][helpStore]) byMonth[monthKey][helpStore] = [];
                  byMonth[monthKey][helpStore].push({ pk, appKey, posting, date, slot, a });
                });
              });
              const monthKeys = Object.keys(byMonth).sort().reverse();
              if (!monthKeys.length) return <p className="text-xs" style={{ color: "#8A8776" }}>まだ応募履歴はありません。</p>;
              return monthKeys.map((monthKey) => {
                const byStore = byMonth[monthKey];
                const storeNames = Object.keys(byStore);
                const staffCounts = {};
                storeNames.forEach((s) => byStore[s].forEach(({ a }) => {
                  staffCounts[a.name] = (staffCounts[a.name] || 0) + 1;
                }));
                const staffCountRows = Object.entries(staffCounts).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "ja"));
                const monthLabel = monthKey === "不明" ? "日付不明" : `${monthKey.slice(0, 4)}年${Number(monthKey.slice(5, 7))}月`;
                return (
                  <div key={monthKey} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays size={13} style={{ color: "#1B2A4A" }} />
                      <span className="text-sm font-bold" style={{ color: "#1B2A4A" }}>{monthLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {staffCountRows.map(([name, count]) => (
                        <div key={name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "#1B2A4A0D" }}>
                          <span className="text-xs font-medium" style={{ color: "#1B2A4A" }}>{name}</span>
                          <span className="mono text-xs font-bold" style={{ color: "#12756B" }}>{count}回</span>
                        </div>
                      ))}
                    </div>
                    {storeNames.map((store) => (
                <div key={store} className="mb-4">
                  <div className="text-xs font-semibold mb-1.5" style={{ color: "#1B2A4A" }}>{store}</div>
                  <div className="space-y-1.5">
                    {byStore[store].sort((x, y) => (x.date < y.date ? -1 : 1)).map(({ pk, appKey, posting, date, slot, a }) => {
                      const editKey = `${pk}__${appKey}`;
                      const editing = editingPostingPk === editKey;
                      const canOperate = adminRole === "operator" && operatorUnlocked;
                      return (
                        <div key={editKey} className="px-2.5 py-2 rounded" style={{ background: "#FAFAF8", border: "1px solid #EFEDE7" }}>
                          {editing ? (
                            <div className="space-y-1.5">
                              <div className="flex gap-1.5 flex-wrap">
                                <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} placeholder="名前" className="text-xs border rounded px-1.5 py-1 outline-none" style={{ borderColor: "#DCD9D0", width: 90 }} />
                                <select value={editDraft.homeStore} onChange={(e) => setEditDraft({ ...editDraft, homeStore: e.target.value })} className="text-xs border rounded px-1.5 py-1 outline-none" style={{ borderColor: "#DCD9D0" }}>
                                  {storeList.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select value={editDraft.attribute} onChange={(e) => setEditDraft({ ...editDraft, attribute: e.target.value })} className="text-xs border rounded px-1.5 py-1 outline-none" style={{ borderColor: "#DCD9D0" }}>
                                  {GIG_ATTRIBUTES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    const nextApplicants = { ...(posting.applicants || {}), [appKey]: { ...a, name: editDraft.name, homeStore: editDraft.homeStore, attribute: editDraft.attribute } };
                                    persistPostings({ ...postings, [pk]: { ...posting, applicants: nextApplicants } });
                                    setEditingPostingPk(null);
                                  }}
                                  className="text-xs px-2.5 py-1 rounded font-medium" style={{ background: "#12756B", color: "white" }}
                                >保存</button>
                                <button onClick={() => setEditingPostingPk(null)} className="text-xs px-2.5 py-1 rounded font-medium" style={{ background: "#EFEDE7", color: "#6B6A63" }}>キャンセル</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                              <div>
                                <span style={{ color: "#1B2A4A" }}>{dispShort(date)} {slot ? slot.label : posting.note}　{a.name}（{a.homeStore}・{a.attribute || "—"}）</span>
                                {a.experienceBands?.length > 0 && <div className="text-[10px] mt-0.5" style={{ color: "#8A8776" }}>経験：{a.experienceBands.join("・")}</div>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={
                                    a.status === "approved" ? { background: "#2F7D4F15", color: "#2F7D4F" }
                                    : a.status === "rejected" ? { background: "#C4453B15", color: "#C4453B" }
                                    : { background: "#D98E0415", color: "#8A6D1F" }
                                  }
                                >
                                  {a.status === "approved" ? "承認" : a.status === "rejected" ? "見送り" : "承認待ち"}
                                </span>
                                {canOperate && (
                                  <>
                                    <button
                                      onClick={() => { setEditDraft({ name: a.name, homeStore: a.homeStore, attribute: a.attribute || GIG_ATTRIBUTES[0] }); setEditingPostingPk(editKey); }}
                                      className="opacity-50 hover:opacity-90"
                                    ><Pencil size={12} /></button>
                                    <button
                                      onClick={() => {
                                        if (!confirm("この応募記録を削除しますか？")) return;
                                        const nextApplicants = { ...(posting.applicants || {}) };
                                        delete nextApplicants[appKey];
                                        persistPostings({ ...postings, [pk]: { ...posting, applicants: nextApplicants } });
                                      }}
                                      className="opacity-50 hover:opacity-90"
                                      style={{ color: "#C4453B" }}
                                    ><Trash2 size={12} /></button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        </>
      )}

      {/* Monthly leader-count table */}
      <div className="perforated bg-white" />
      <div className="bg-white border px-6 py-4" style={{ borderColor: "#DCD9D0" }}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="icon-badge" style={{ background: "#D98E0415", fontSize: 15 }}>👑</span>
          <h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>リーダー出勤回数（{leaderCountMonth.monthLabel}）</h2>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setLeaderCountMonthOffset((v) => v - 1)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>‹ 前月</button>
            {leaderCountMonthOffset !== 0 && (
              <button onClick={() => setLeaderCountMonthOffset(0)} className="text-xs px-2 py-1 rounded font-medium" style={{ color: "#8A8776" }}>今月</button>
            )}
            <button onClick={() => setLeaderCountMonthOffset((v) => v + 1)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>翌月 ›</button>
          </div>
        </div>
        <p className="text-xs mb-2" style={{ color: "#8A8776" }}>👑リーダー資格を持つ人、またはその日だけリーダーマークを割り当てた人が、何回シフトに入っているかの回数です。</p>
        {leaderCountMonth.rows.length === 0 ? (
          <p className="text-xs" style={{ color: "#D8D6CE" }}>この月にリーダーとして割り当てられたシフトはまだありません。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {leaderCountMonth.rows.map((row) => (
              <div key={row.staffId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#D98E0415" }}>
                <span className="text-xs font-semibold" style={{ color: "#1B2A4A" }}>{row.name}</span>
                <span className="mono text-xs font-bold" style={{ color: "#8A6D1F" }}>{row.count}回</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="perforated bg-white" />
      <div className="bg-white rounded-b-sm border border-t-0 shadow-sm px-6 py-5" style={{ borderColor: "#DCD9D0" }}>
        <button onClick={() => setShowLaborSummary((v) => !v)} className="flex items-center justify-between mb-1 flex-wrap gap-2 w-full">
          <div className="flex items-center gap-2"><span className="icon-badge" style={{ background: "#12756B15" }}><JapaneseYen size={15} style={{ color: "#12756B" }} /></span><h2 className="font-semibold text-sm" style={{ color: "#1B2A4A" }}>月間人件費サマリー（{monthlyLaborSummary.monthLabel}）</h2></div>
          {showLaborSummary ? <ChevronUp size={16} style={{ color: "#1B2A4A" }} /> : <ChevronDown size={16} style={{ color: "#1B2A4A" }} />}
        </button>
        {showLaborSummary && (
          <>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setLaborMonthOffset((v) => v - 1)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>‹ 前月</button>
            {laborMonthOffset !== 0 && (
              <button onClick={() => setLaborMonthOffset(0)} className="text-xs px-2 py-1 rounded font-medium" style={{ color: "#8A8776" }}>今月</button>
            )}
            <button onClick={() => setLaborMonthOffset((v) => v + 1)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>翌月 ›</button>
          </div>
          <button onClick={copyAsText} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-medium text-white" style={{ background: copied ? "#2F7D4F" : "#1B2A4A" }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "コピーしました" : "LINE用にコピー"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {staff.map((p) => {
            const st = monthlyPerStaffStats[p.id] || { hours: 0, cost: 0 };
            const over = st.hours > (p.maxHours || 9999) * 4.3; // rough monthly guideline (weekly cap × ~4.3 weeks)
            return (
              <div key={p.id} className="rounded p-3" style={{ background: `${staffColor(p.id)}0D` }}>
                <div className="text-xs font-semibold flex items-center gap-1" style={{ color: staffColor(p.id) }}>{p.name}{over && <AlertTriangle size={11} color="#C4453B" />}</div>
                <div className="mono text-lg font-bold" style={{ color: over ? "#C4453B" : "#1B2A4A" }}>{st.hours}h</div>
                <div className="mono text-xs" style={{ color: "#8A8776" }}>¥{st.cost.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded p-3 mb-3 flex flex-wrap items-center gap-3" style={{ background: "#1B2A4A08" }}>
          <TrendingUp size={15} style={{ color: "#1B2A4A" }} />
          <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>想定売上（月）
            <input type="number" value={weeklySales} onChange={(e) => persistWeekConfig({ weeklySales: Number(e.target.value) })} className="mono text-xs border rounded px-1.5 py-0.5 w-24 outline-none" style={{ borderColor: "#DCD9D0" }} />円
          </label>
          <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>目標人件費率
            <input type="number" value={targetRatio} onChange={(e) => persistWeekConfig({ targetRatio: Number(e.target.value) })} className="mono text-xs border rounded px-1.5 py-0.5 w-14 outline-none" style={{ borderColor: "#DCD9D0" }} />%
          </label>
          <span className="mono text-sm font-bold ml-auto" style={{ color: monthlyLaborRatio > targetRatio ? "#C4453B" : "#12756B" }}>実績 {monthlyLaborRatio.toFixed(1)}% {monthlyLaborRatio > targetRatio && "⚠ 目標超過"}</span>
        </div>

        <div className="rounded p-3 mb-3 flex flex-wrap items-center gap-3" style={{ background: "#12756B08" }}>
          <JapaneseYen size={15} style={{ color: "#12756B" }} />
          <label className="flex items-center gap-1 text-xs" style={{ color: "#6B6A63" }}>人件費予算（月）
            <input type="number" value={laborBudget} onChange={(e) => persistWeekConfig({ laborBudget: Number(e.target.value) })} className="mono text-xs border rounded px-1.5 py-0.5 w-28 outline-none" style={{ borderColor: "#DCD9D0" }} />円
          </label>
          <span className="mono text-sm font-bold ml-auto" style={{ color: monthlyTotalCost > laborBudget ? "#C4453B" : "#12756B" }}>
            {monthlyTotalCost > laborBudget ? `⚠ 予算超過 ¥${(monthlyTotalCost - laborBudget).toLocaleString()}` : `残り予算 ¥${(laborBudget - monthlyTotalCost).toLocaleString()}`}
          </span>
        </div>

        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "#EFEDE7" }}>
          <span className="text-sm font-medium" style={{ color: "#1B2A4A" }}>月合計 ({monthlyTotalHours}h)</span>
          <span className="mono text-xl font-bold" style={{ color: "#12756B" }}>¥{monthlyTotalCost.toLocaleString()}</span>
        </div>
          </>
        )}
      </div>
        </>
        )}
      </>
      )}
    </>
  );
}

// ======================= STAFF VIEW =======================
function StaffView({ staff, persistRoster, weekDates, weekStart, storeName, storeList, slotsByStore, persistSlotsByStore, postings, persistPostings, assignments, requiredOverrides, commuteFare, submissions, persistSubmissions, sideJobDeclarations, persistSideJobDeclarations, deadlineOverrideMonths, persistWeekConfig, myStaffId, setMyStaffId }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [formDays, setFormDays] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState("");
  const [sideJobStatus, setSideJobStatus] = useState(null); // 'new' | 'changed' | 'ended'
  const [sideJobNote, setSideJobNote] = useState("");
  const [submittingSideJob, setSubmittingSideJob] = useState(false);
  const availableStores = storeList.filter(Boolean).length ? storeList.filter(Boolean) : [storeName];
  const [selectedStore, setSelectedStore] = useState(availableStores[0]);
  const storeSlots = slotsByStore[selectedStore] || [];
  const storeStaffOptions = staff.filter((p) => !p.isGig && (p.homeStore || availableStores[0]) === selectedStore);

  // ---- Staff-created recruiting: find a replacement for MY OWN confirmed shift ----
  const asgKeyFor = (dayIdx, slotId) => `${weekStart}__${dayIdx}__${slotId}`;
  const myOwnShifts = useMemo(() => {
    if (!myStaffId) return [];
    const list = [];
    weekDates.forEach((date, dayIdx) => {
      storeSlots.forEach((slot) => {
        const ids = assignments?.[asgKeyFor(dayIdx, slot.id)] || [];
        if (ids.includes(myStaffId)) {
          const startHour = parseHour(slot.start);
          list.push({ pk: `${weekStart}__${date}__${slot.id}`, date, dayIdx, slot, band: getShiftBand(startHour) });
        }
      });
    });
    return list;
  }, [weekDates, storeSlots, assignments, weekStart, myStaffId]);

  const [openCreatePk, setOpenCreatePk] = useState(null);
  const [createNote, setCreateNote] = useState("");
  const [creatingPosting, setCreatingPosting] = useState(false);

  const openCreateForm = (gap) => {
    setOpenCreatePk(gap.pk);
    setCreateNote(`${gap.slot.end}時までなら可能です`);
  };

  const submitCreatePosting = async (gap) => {
    setCreatingPosting(true);
    try {
      const existing = postings?.[gap.pk] || {};
      await persistPostings({
        ...(postings || {}),
        [gap.pk]: {
          ...existing,
          open: true,
          note: createNote.trim(),
          helpStore: selectedStore,
          band: gap.band,
          createdBy: myStaffId,
          replacingStaffId: myStaffId,
          applicants: existing.applicants || {},
        },
      });
      setOpenCreatePk(null);
      setToast("代わりの募集を作成しました");
    } catch (e) {
      setToast("作成に失敗しました。もう一度お試しください");
    } finally {
      setCreatingPosting(false);
      setTimeout(() => setToast(""), 2200);
    }
  };

  const anchor = new Date(weekDates[0] + "T00:00:00");
  const targetMonth = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset, 1);
  const year = targetMonth.getFullYear();
  const monthIdx = targetMonth.getMonth();
  const dates = useMemo(() => monthDates(year, monthIdx), [year, monthIdx]);
  const monthKeyStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  // Submissions for a given month close at 23:59 on the 25th of the PREVIOUS month,
  // unless the admin has temporarily lifted the deadline for this specific month.
  const submissionDeadline = new Date(year, monthIdx - 1, 25, 23, 59, 59);
  const deadlineOverridden = (deadlineOverrideMonths || []).includes(monthKeyStr);
  const deadlinePassed = !deadlineOverridden && new Date() > submissionDeadline;
  const deadlineLabel = `${submissionDeadline.getMonth() + 1}月${submissionDeadline.getDate()}日`;

  const myDeclarationsThisMonth = useMemo(
    () => sideJobDeclarations.filter((d) => d.staffId === myStaffId && d.month === monthKeyStr),
    [sideJobDeclarations, myStaffId, monthKeyStr]
  );
  const myLatestDeclaration = myDeclarationsThisMonth[myDeclarationsThisMonth.length - 1] || null;
  const hasDeclaredThisMonth = !!myLatestDeclaration;

  useEffect(() => {
    setSideJobStatus(myLatestDeclaration?.status || null);
    setSideJobNote(myLatestDeclaration?.note || "");
  }, [monthKeyStr, myStaffId, myLatestDeclaration?.id]);

  useEffect(() => {
    if (myStaffId && !storeStaffOptions.some((p) => p.id === myStaffId)) {
      setMyStaffId("");
    }
  }, [selectedStore]);

  const submitSideJob = async (status) => {
    setSideJobStatus(status);
    setSubmittingSideJob(true);
    const entry = {
      id: `${myStaffId}-${monthKeyStr}-${Date.now()}`,
      staffId: myStaffId,
      month: monthKeyStr,
      status,
      note: status === "none" ? "" : sideJobNote.trim(),
      submittedAt: new Date().toISOString(),
    };
    await persistSideJobDeclarations([...sideJobDeclarations, entry]);
    setSubmittingSideJob(false);
    setToast("副業・兼業の確認を提出しました");
    setTimeout(() => setToast(""), 2200);
  };


  useEffect(() => {
    if (!myStaffId) return;
    const init = {};
    dates.forEach((date) => {
      const subsForDay = submissions.filter((s) => s.staffId === myStaffId && s.date === date);
      if (subsForDay.length) {
        const sub = subsForDay[subsForDay.length - 1];
        const mode = sub.mode || (sub.leave ? "leave" : sub.available ? (sub.start === "00:00" && sub.end === "24:00" ? "ok" : "time") : "off");
        init[date] = { mode, start: sub.start || "09:00", end: sub.end || "17:00", note: sub.note || "", leaveUnit: sub.leave || "full", manual: sub.manual !== undefined ? sub.manual : true };
      } else {
        init[date] = { mode: null, start: "09:00", end: "17:00", note: "", leaveUnit: "full", manual: true };
      }
    });
    setFormDays(init);
    setHasUnsavedChanges(false);
  }, [myStaffId, dates.join(","), submissions.length]);

  const me = staff.find((p) => p.id === myStaffId);
  const [staffUnlocked, setStaffUnlocked] = useState(false);
  const [staffScheduleWeekOffset, setStaffScheduleWeekOffset] = useState(0);
  const [pinDraft, setPinDraft] = useState("");
  const [pinChecked, setPinChecked] = useState(false);

  useEffect(() => {
    setStaffUnlocked(false);
    setPinDraft("");
    setPinChecked(false);
    if (!myStaffId) return;
    (async () => {
      const session = await loadJSON(`staffPinSession_${myStaffId}`, null, false);
      if (session && Date.now() - new Date(session.unlockedAt).getTime() < AUTH_SESSION_MS) {
        setStaffUnlocked(true);
      }
      setPinChecked(true);
    })();
  }, [myStaffId]);

  const verifyPin = async () => {
    if (!me) return;
    if (!me.pin) {
      // first time: whatever is entered now becomes the PIN going forward
      await persistRoster(staff.map((p) => (p.id === myStaffId ? { ...p, pin: pinDraft } : p)));
      setStaffUnlocked(true);
      saveJSON(`staffPinSession_${myStaffId}`, { unlockedAt: new Date().toISOString() }, false);
      setToast("PINを設定しました。次回からはこのPINで認証してください。");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    if (pinDraft === me.pin) {
      setStaffUnlocked(true);
      saveJSON(`staffPinSession_${myStaffId}`, { unlockedAt: new Date().toISOString() }, false);
    } else {
      alert("PINが違います");
    }
  };

  const [fixedBandSlotId, setFixedBandSlotId] = useState(storeSlots[0]?.id || "");
  const [bulkWeekdays, setBulkWeekdays] = useState([true, true, true, true, true, true, true]); // 月火水木金土日 (all days default on)
  const [showSecondBand, setShowSecondBand] = useState(false);
  const [fixedBandSlotId2, setFixedBandSlotId2] = useState(storeSlots[1]?.id || storeSlots[0]?.id || "");
  const [bulkWeekdays2, setBulkWeekdays2] = useState([false, false, false, false, false, false, false]);
  const [showOffSection, setShowOffSection] = useState(false);
  const [offMode, setOffMode] = useState("weekday"); // 'weekday' | 'date'
  const [offWeekdays, setOffWeekdays] = useState([false, false, false, false, false, false, false]);
  const [offDates, setOffDates] = useState([]);
  const [showLeaveSection, setShowLeaveSection] = useState(false);
  const [leaveMode, setLeaveMode] = useState("weekday"); // 'weekday' | 'date'
  const [leaveWeekdays, setLeaveWeekdays] = useState([false, false, false, false, false, false, false]);
  const [leaveDates, setLeaveDates] = useState([]);

  useEffect(() => {
    if (!storeSlots.some((s) => s.id === fixedBandSlotId)) {
      setFixedBandSlotId(storeSlots[0]?.id || "");
    }
    if (!storeSlots.some((s) => s.id === fixedBandSlotId2)) {
      setFixedBandSlotId2(storeSlots[1]?.id || storeSlots[0]?.id || "");
    }
  }, [selectedStore]);

  const setDay = (date, patch) => { setFormDays((prev) => ({ ...prev, [date]: { ...prev[date], ...patch, manual: true } })); setHasUnsavedChanges(true); };

  const toggleBulkWeekday = (i) => setBulkWeekdays((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const toggleBulkWeekday2 = (i) => setBulkWeekdays2((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const toggleOffWeekday = (i) => setOffWeekdays((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const toggleLeaveWeekday = (i) => setLeaveWeekdays((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const toggleOffDate = (date) => setOffDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]));
  const toggleLeaveDate = (date) => setLeaveDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]));

  const applyOneSection = (weekdays, dateList, useDateMode, applyFn) => {
    const targets = useDateMode ? dateList : dates.filter((date) => {
      const jsDay = new Date(date + "T00:00:00").getDay();
      const idx = WEEKDAY_JS_MAP.indexOf(jsDay);
      return weekdays[idx];
    });
    if (targets.length === 0) {
      setToast("曜日または日付が選ばれていないため、何も変更されませんでした");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    setFormDays((prev) => {
      const next = { ...prev };
      targets.forEach((date) => applyFn(next, date));
      return next;
    });
    setToast(`${targets.length}日分に反映しました`);
    setTimeout(() => setToast(""), 2500);
  };

  const applyBand1Only = () => {
    const band = storeSlots.find((s) => s.id === fixedBandSlotId);
    if (!band) { alert("固定時間帯を選んでください"); return; }
    applyOneSection(bulkWeekdays, [], false, (next, date) => { next[date] = { ...next[date], mode: "ok", start: band.start, end: band.end, manual: false }; });
  };
  const applyBand2Only = () => {
    const band2 = storeSlots.find((s) => s.id === fixedBandSlotId2);
    if (!band2) { alert("固定時間帯を選んでください"); return; }
    applyOneSection(bulkWeekdays2, [], false, (next, date) => { next[date] = { ...next[date], mode: "ok", start: band2.start, end: band2.end, manual: false }; });
  };
  const applyOffOnly = () => {
    applyOneSection(offWeekdays, offDates, offMode === "date", (next, date) => { next[date] = { ...next[date], mode: "off", manual: false }; });
  };
  const applyLeaveOnly = () => {
    applyOneSection(leaveWeekdays, leaveDates, leaveMode === "date", (next, date) => { next[date] = { ...next[date], mode: "leave", leaveUnit: "full", manual: false }; });
  };

  const applyBulkByWeekday = () => {
    const fixedBand = storeSlots.find((s) => s.id === fixedBandSlotId);
    const fixedBand2 = storeSlots.find((s) => s.id === fixedBandSlotId2);
    if (bulkWeekdays.some(Boolean) && !fixedBand) { alert("固定時間帯を選んでください"); return; }

    const noneSelected = !bulkWeekdays.some(Boolean) && !(showSecondBand && bulkWeekdays2.some(Boolean))
      && !(showOffSection && (offMode === "weekday" ? offWeekdays.some(Boolean) : offDates.length > 0))
      && !(showLeaveSection && (leaveMode === "weekday" ? leaveWeekdays.some(Boolean) : leaveDates.length > 0));
    if (noneSelected) {
      setToast("曜日または日付が選ばれていないため、何も変更されませんでした");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    const touched = new Set();
    const next = { ...formDays };
    const applyMode = (weekdays, apply) => {
      dates.forEach((date) => {
        const jsDay = new Date(date + "T00:00:00").getDay();
        const idx = WEEKDAY_JS_MAP.indexOf(jsDay);
        if (!weekdays[idx]) return;
        apply(date);
        touched.add(date);
      });
    };
    // apply in order: work band(s) first, then day-off, then paid leave — later ones win on overlap
    if (fixedBand) applyMode(bulkWeekdays, (date) => { next[date] = { ...next[date], mode: "ok", start: fixedBand.start, end: fixedBand.end, manual: false }; });
    if (showSecondBand && fixedBand2) applyMode(bulkWeekdays2, (date) => { next[date] = { ...next[date], mode: "ok", start: fixedBand2.start, end: fixedBand2.end, manual: false }; });
    if (showOffSection) {
      if (offMode === "weekday") applyMode(offWeekdays, (date) => { next[date] = { ...next[date], mode: "off", manual: false }; });
      else offDates.forEach((date) => { next[date] = { ...next[date], mode: "off", manual: false }; touched.add(date); });
    }
    if (showLeaveSection) {
      if (leaveMode === "weekday") applyMode(leaveWeekdays, (date) => { next[date] = { ...next[date], mode: "leave", leaveUnit: "full", manual: false }; });
      else leaveDates.forEach((date) => { next[date] = { ...next[date], mode: "leave", leaveUnit: "full", manual: false }; touched.add(date); });
    }
    setFormDays(next);
    setHasUnsavedChanges(touched.size > 0);
    setToast(`${touched.size}日分の入力欄に反映しました。まだ保存されていません。下の一覧で内容を確認し、必ず「月分を一括送信」を押してください。`);
    setTimeout(() => setToast(""), 3000);
  };

  const submitAll = async () => {
    setSubmitting(true);
    let next = submissions.filter((s) => !(s.staffId === myStaffId && dates.includes(s.date)));
    dates.forEach((date) => {
      const d = formDays[date];
      if (!d || !d.mode) return;
      next.push({
        id: `${myStaffId}-${date}-${Date.now()}`,
        staffId: myStaffId,
        date,
        mode: d.mode,
        available: d.mode !== "off" && d.mode !== "leave",
        start: d.mode === "time" || d.mode === "ok" ? d.start : "00:00",
        end: d.mode === "time" || d.mode === "ok" ? d.end : "24:00",
        leave: d.mode === "leave" ? (d.leaveUnit || "full") : null,
        note: d.note?.trim() || "",
        manual: !!d.manual,
        submittedAt: new Date().toISOString(),
      });
    });
    await persistSubmissions(next);
    setSubmitting(false);
    setHasUnsavedChanges(false);
    setToast(`${year}年${monthIdx + 1}月分を送信しました`);
    setTimeout(() => setToast(""), 2500);
  };

  const clearDay = async (date) => {
    setDay(date, { mode: null });
    const next = submissions.filter((s) => !(s.staffId === myStaffId && s.date === date));
    await persistSubmissions(next);
    setHasUnsavedChanges(false);
  };

  const clearAllMonth = async () => {
    setFormDays((prev) => {
      const next = { ...prev };
      dates.forEach((date) => { next[date] = { ...next[date], mode: null, manual: false }; });
      return next;
    });
    const next = submissions.filter((s) => !(s.staffId === myStaffId && dates.includes(s.date)));
    await persistSubmissions(next);
    setHasUnsavedChanges(false);
  };

  const filledCount = dates.filter((d) => formDays[d]?.mode).length;

  const myHistory = useMemo(
    () => submissions.filter((s) => s.staffId === myStaffId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [submissions, myStaffId]
  );

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg border px-4 py-3 mb-4" style={{ borderColor: "#DCD9D0" }}>
        <div className="flex items-center gap-2 mb-1"><UserCircle size={18} style={{ color: "#1B2A4A" }} /><span className="font-bold text-sm" style={{ color: "#1B2A4A" }}>希望シフト入力</span></div>
        <label className="flex items-center gap-2 mt-2">
          <span className="text-xs" style={{ color: "#6B6A63" }}>店舗</span>
          <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="flex-1 text-sm border rounded px-2 py-1.5 outline-none" style={{ borderColor: "#DCD9D0" }}>
            {availableStores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 mt-2">
          <span className="text-xs" style={{ color: "#6B6A63" }}>あなたの名前</span>
          <select value={myStaffId} onChange={(e) => setMyStaffId(e.target.value)} className="flex-1 text-sm border rounded px-2 py-1.5 outline-none" style={{ borderColor: "#DCD9D0" }}>
            <option value="">選択してください</option>
            {storeStaffOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        {!storeStaffOptions.length && <p className="text-xs mt-2" style={{ color: "#B5562B" }}>この店舗にはまだスタッフが登録されていません。管理者に登録を依頼してください。</p>}
        {me && (
          <div className="flex items-center gap-1.5 mt-2 text-xs px-2 py-1.5 rounded" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>
            <Clock size={12} />固定勤務時間：{me.usualStart && me.usualEnd ? `${me.usualStart}〜${me.usualEnd}` : "未登録（管理者にご確認ください）"}
          </div>
        )}
      </div>

      {me && !staffUnlocked && (
        <div className="bg-white rounded-lg border px-4 py-5 mb-4 text-center" style={{ borderColor: "#DCD9D0" }}>
          <UserCircle size={20} style={{ color: "#1B2A4A" }} className="mx-auto mb-2" />
          {!me.pin ? (
            <>
              <p className="text-sm font-semibold mb-1" style={{ color: "#1B2A4A" }}>{me.name} さん、はじめまして</p>
              <p className="text-xs mb-3" style={{ color: "#8A8776" }}>今回だけ、今後お使いになる3桁のPINを決めて入力してください。次回からはこのPINで本人確認します。</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={3}
                value={pinDraft}
                onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="新しいPIN（3桁）"
                className="w-full text-center text-lg tracking-[0.5em] border rounded px-3 py-2 outline-none mb-3 mono"
                style={{ borderColor: "#DCD9D0" }}
              />
              <button
                onClick={verifyPin}
                disabled={pinDraft.length !== 3}
                className="w-full text-sm py-2 rounded font-medium text-white disabled:opacity-40"
                style={{ background: "#1B2A4A" }}
              >
                このPINで設定する
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold mb-1" style={{ color: "#1B2A4A" }}>{me.name} さん、本人確認</p>
              <p className="text-xs mb-3" style={{ color: "#8A8776" }}>最初に設定した3桁のPINを入力してください。</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={3}
                value={pinDraft}
                onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="PIN（3桁）"
                className="w-full text-center text-lg tracking-[0.5em] border rounded px-3 py-2 outline-none mb-3 mono"
                style={{ borderColor: "#DCD9D0" }}
              />
              <button
                onClick={verifyPin}
                disabled={pinDraft.length !== 3}
                className="w-full text-sm py-2 rounded font-medium text-white disabled:opacity-40"
                style={{ background: "#1B2A4A" }}
              >
                進む
              </button>
            </>
          )}
        </div>
      )}

      {me && staffUnlocked && (
        <>
          <div className="bg-white rounded-lg border px-4 py-4 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} style={{ color: "#1B2A4A" }} />
                <h2 className="text-sm font-bold" style={{ color: "#1B2A4A" }}>確定シフト（{storeName}）</h2>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setStaffScheduleWeekOffset((v) => v - 1)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>‹ 前週</button>
                {staffScheduleWeekOffset !== 0 && (
                  <button onClick={() => setStaffScheduleWeekOffset(0)} className="text-xs px-2 py-1 rounded font-medium" style={{ color: "#8A8776" }}>今週</button>
                )}
                <button onClick={() => setStaffScheduleWeekOffset((v) => v + 1)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: "#1B2A4A0D", color: "#1B2A4A" }}>翌週 ›</button>
              </div>
            </div>
            <p className="text-xs mb-2" style={{ color: "#8A8776" }}>管理者が組んだシフトです。ご自身の名前の行は色付きで強調されています。</p>
            {(() => {
              const schedWeekStart = addDays(weekStart, staffScheduleWeekOffset * 7);
              const schedDates = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(schedWeekStart, i));
              const storeSlotsForSched = slotsByStore[storeName] || [];
              const skey = (dayIdx, slotId) => `${schedWeekStart}__${dayIdx}__${slotId}`;
              return (
                <div className="space-y-2">
                  {schedDates.map((date, dayIdx) => {
                    const rows = storeSlotsForSched.map((slot) => {
                      const ids = assignments[skey(dayIdx, slot.id)] || [];
                      const names = ids.map((id) => staff.find((p) => p.id === id)?.name).filter(Boolean);
                      const iAmIn = ids.includes(myStaffId);
                      return { slot, names, iAmIn };
                    }).filter((r) => r.names.length > 0);
                    if (rows.length === 0) return null;
                    return (
                      <div key={date} className="px-2.5 py-2 rounded border" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                        <div className="text-xs font-semibold mono mb-1" style={{ color: "#1B2A4A" }}>{dispShort(date)}</div>
                        <div className="space-y-1">
                          {rows.map(({ slot, names, iAmIn }) => (
                            <div key={slot.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded" style={iAmIn ? { background: "#12756B15" } : {}}>
                              <span className="mono shrink-0" style={{ color: "#8A8776", width: 96 }}>{slot.label}</span>
                              <span style={{ color: iAmIn ? "#12756B" : "#1B2A4A", fontWeight: iAmIn ? 700 : 400 }}>{names.join("・")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {schedDates.every((date, dayIdx) => storeSlotsForSched.every((slot) => (assignments[skey(dayIdx, slot.id)] || []).length === 0)) && (
                    <p className="text-xs text-center py-3" style={{ color: "#D8D6CE" }}>この週はまだシフトが組まれていません。</p>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="bg-white rounded-lg border px-4 py-4 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={16} style={{ color: "#1B2A4A" }} />
              <h2 className="text-sm font-bold" style={{ color: "#1B2A4A" }}>副業・兼業の確認（{year}年{monthIdx + 1}月）</h2>
            </div>
            <p className="text-xs mb-2 px-2 py-1.5 rounded" style={{ background: "#D98E0415", color: "#8A6D1F" }}>
              申請は済んでいますか？「変更なし」以外の方は、別途申請フォームの提出をお願いします。
            </p>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[["new", "新規"], ["changed", "変更"], ["ended", "終了"], ["none", "変更なし"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => submitSideJob(val)}
                  disabled={submittingSideJob}
                  className="text-xs py-2 rounded font-medium disabled:opacity-50"
                  style={
                    myLatestDeclaration?.status === val
                      ? { background: val === "none" ? "#2F7D4F" : "#1B2A4A", color: "white" }
                      : { background: "#EFEDE7", color: "#6B6A63" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {hasDeclaredThisMonth && (
              <p className="text-[11px] mt-2" style={{ color: "#8A8776" }}>
                今月提出済み：{myLatestDeclaration.status === "new" ? "新規" : myLatestDeclaration.status === "changed" ? "変更" : myLatestDeclaration.status === "ended" ? "終了" : "変更なし"}
                {myLatestDeclaration.note && `（${myLatestDeclaration.note}）`}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg border px-4 py-4 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-1">
              <Megaphone size={16} style={{ color: "#1B2A4A" }} />
              <h2 className="text-sm font-bold" style={{ color: "#1B2A4A" }}>自分のシフトの代わりを募集</h2>
            </div>
            <p className="text-xs mb-3" style={{ color: "#8A8776" }}>確定済みのシフトを休みたい時や、急に出勤できなくなった時に、代わりに入ってくれる人を募集できます。勤務区分は時間帯から自動で判定されます。</p>
            {myOwnShifts.length === 0 ? (
              <p className="text-xs" style={{ color: "#8A8776" }}>今週、あなたが入っているシフトはありません。</p>
            ) : (
              <div className="space-y-2">
                {myOwnShifts.map((gap) => {
                  const posting = postings?.[gap.pk];
                  const alreadyOpen = posting?.open;
                  const isFormOpen = openCreatePk === gap.pk;
                  return (
                    <div key={gap.pk} className="rounded border px-3 py-2.5" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <span className="mono text-xs font-semibold" style={{ color: "#1B2A4A" }}>{dispShort(gap.date)} {gap.slot.label}（{gap.slot.start}〜{gap.slot.end}）</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#2b2f4a15", color: "#3a3d6b" }}>{gap.band}</span>
                      </div>
                      {alreadyOpen ? (
                        <span className="text-xs px-2 py-1 rounded font-medium inline-block" style={{ background: "#12756B15", color: "#12756B" }}>すでに代わりを募集中です</span>
                      ) : !isFormOpen ? (
                        <button onClick={() => openCreateForm(gap)} className="w-full text-sm py-1.5 rounded font-medium text-white" style={{ background: "#12756B" }}>この日の代わりを募集する</button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px]" style={{ color: "#8A8776" }}>時給は入力不要です。応募してくれた方ご本人の時給がそのまま適用されます。</p>
                          <div>
                            <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>伝えたいこと（備考・自由に編集/削除できます）</span>
                            <input
                              value={createNote}
                              onChange={(e) => setCreateNote(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 rounded border outline-none"
                              style={{ borderColor: "#DCD9D0", color: "#ABA79C" }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setOpenCreatePk(null)} className="flex-1 text-xs py-1.5 rounded font-medium" style={{ background: "#EFEDE7", color: "#6B6A63" }}>キャンセル</button>
                            <button
                              onClick={() => submitCreatePosting(gap)}
                              disabled={creatingPosting}
                              className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded font-medium text-white disabled:opacity-50"
                              style={{ background: "#12756B" }}
                            >
                              {creatingPosting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                              募集を作成する
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border px-4 py-4 mb-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center justify-between mb-1">
              <button onClick={() => setMonthOffset((v) => v - 1)} className="text-xs px-2 py-1 rounded" style={{ color: "#1B2A4A", background: "#EFEDE7" }}>‹ 前月</button>
              <h2 className="text-sm font-bold" style={{ color: "#1B2A4A" }}>{year}年{monthIdx + 1}月 の希望（1ヶ月分）</h2>
              <button onClick={() => setMonthOffset((v) => v + 1)} className="text-xs px-2 py-1 rounded" style={{ color: "#1B2A4A", background: "#EFEDE7" }}>翌月 ›</button>
            </div>
            <p className="text-xs mb-3 text-center" style={{ color: "#8A8776" }}>{dates.length}日中 {filledCount}日 入力済み</p>
            <p className="text-xs mb-3 text-center" style={{ color: deadlinePassed ? "#C4453B" : "#8A8776" }}>
              提出期限：{deadlineLabel}まで
              {deadlineOverridden && <span style={{ color: "#12756B" }}>（今回に限り、締切後も提出可能です）</span>}
            </p>

            {deadlinePassed ? (
              <div className="rounded border px-3 py-4 text-center" style={{ borderColor: "#C4453B33", background: "#C4453B0D" }}>
                <AlertTriangle size={20} color="#C4453B" className="mx-auto mb-2" />
                <p className="text-sm font-semibold mb-1" style={{ color: "#C4453B" }}>この月の提出期限（{deadlineLabel}）を過ぎています</p>
                <p className="text-xs" style={{ color: "#6B6A63" }}>ここからは提出できません。シフトの変更・相談は直接店長へご連絡ください。</p>
              </div>
            ) : (
              <>
            <div className="rounded border px-3 py-3 mb-3" style={{ borderColor: "#DCD9D0", background: "#FAFAF8" }}>
              <div className="mb-2">
                <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>固定時間帯（あなたの普段の勤務時間）</span>
                {storeSlots.length ? (
                  <select
                    value={fixedBandSlotId}
                    onChange={(e) => setFixedBandSlotId(e.target.value)}
                    className="w-full text-sm border rounded px-2 py-1.5 outline-none mono"
                    style={{ borderColor: "#DCD9D0" }}
                  >
                    {storeSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>{slot.label}（{slot.start}〜{slot.end}）</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs" style={{ color: "#B5562B" }}>この店舗の時間帯が未登録です</span>
                )}
              </div>

              <div className="mb-2">
                <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>勤務する曜日</span>
                <div className="flex gap-1 mb-2">
                  {WEEKDAY_ORDER_JA.map((label, i) => (
                    <button
                      key={label}
                      onClick={() => toggleBulkWeekday(i)}
                      className="flex-1 text-xs py-1.5 rounded-full font-medium"
                      style={bulkWeekdays[i] ? { background: "#1B2A4A", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {!showSecondBand ? (
                <button onClick={() => setShowSecondBand(true)} className="text-xs mb-3" style={{ color: "#12756B" }}>+ 曜日ごとに別の固定時間帯も設定する</button>
              ) : (
                <div className="mb-3 rounded border px-2.5 py-2.5" style={{ borderColor: "#DCD9D0", background: "#FFFFFF" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "#6B6A63" }}>2つ目の固定時間帯</span>
                    <button onClick={() => setShowSecondBand(false)} className="text-xs" style={{ color: "#C4453B" }}>削除</button>
                  </div>
                  {storeSlots.length ? (
                    <select
                      value={fixedBandSlotId2}
                      onChange={(e) => setFixedBandSlotId2(e.target.value)}
                      className="w-full text-sm border rounded px-2 py-1.5 outline-none mono mb-2"
                      style={{ borderColor: "#DCD9D0" }}
                    >
                      {storeSlots.map((slot) => (
                        <option key={slot.id} value={slot.id}>{slot.label}（{slot.start}〜{slot.end}）</option>
                      ))}
                    </select>
                  ) : null}
                  <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>この時間帯を適用する曜日</span>
                  <div className="flex gap-1">
                    {WEEKDAY_ORDER_JA.map((label, i) => (
                      <button
                        key={label}
                        onClick={() => toggleBulkWeekday2(i)}
                        className="flex-1 text-xs py-1.5 rounded-full font-medium"
                        style={bulkWeekdays2[i] ? { background: "#3A5BA0", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "#8A8776" }}>「登録内容」が終日OKの場合のみ、この時間帯が使われます。上と同じ曜日を選ぶと、こちらの時間帯が優先されます。</p>
                </div>
              )}

              <div className="mb-3">
                {!showOffSection ? (
                  <button onClick={() => setShowOffSection(true)} className="text-xs mb-2 block" style={{ color: "#C4453B" }}>+ 休み希望を設定する</button>
                ) : (
                  <div className="mb-2 rounded border px-2.5 py-2.5" style={{ borderColor: "#DCD9D0", background: "#FFFFFF" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: "#C4453B" }}>休み希望</span>
                      <button onClick={() => { setShowOffSection(false); setOffWeekdays([false, false, false, false, false, false, false]); setOffDates([]); }} className="text-xs" style={{ color: "#8A8776" }}>削除</button>
                    </div>
                    <div className="flex rounded-full p-0.5 gap-0.5 mb-2 w-fit" style={{ background: "#EFEDE7" }}>
                      <button onClick={() => setOffMode("weekday")} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={offMode === "weekday" ? { background: "#C4453B", color: "white" } : { color: "#6B6A63" }}>曜日で指定</button>
                      <button onClick={() => setOffMode("date")} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={offMode === "date" ? { background: "#C4453B", color: "white" } : { color: "#6B6A63" }}>日付で指定</button>
                    </div>
                    {offMode === "weekday" ? (
                      <div className="flex gap-1">
                        {WEEKDAY_ORDER_JA.map((label, i) => (
                          <button
                            key={label}
                            onClick={() => toggleOffWeekday(i)}
                            className="flex-1 text-xs py-1.5 rounded-full font-medium"
                            style={offWeekdays[i] ? { background: "#C4453B", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-1">
                        {dates.map((date) => {
                          const dayNum = Number(date.slice(-2));
                          const on = offDates.includes(date);
                          return (
                            <button
                              key={date}
                              onClick={() => toggleOffDate(date)}
                              className="text-[11px] py-1 rounded font-medium mono"
                              style={on ? { background: "#C4453B", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!showLeaveSection ? (
                  <button onClick={() => setShowLeaveSection(true)} className="text-xs block" style={{ color: "#8A6D1F" }}>+ 有給を設定する</button>
                ) : (
                  <div className="rounded border px-2.5 py-2.5" style={{ borderColor: "#DCD9D0", background: "#FFFFFF" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: "#8A6D1F" }}>有給</span>
                      <button onClick={() => { setShowLeaveSection(false); setLeaveWeekdays([false, false, false, false, false, false, false]); setLeaveDates([]); }} className="text-xs" style={{ color: "#8A8776" }}>削除</button>
                    </div>
                    <div className="flex rounded-full p-0.5 gap-0.5 mb-2 w-fit" style={{ background: "#EFEDE7" }}>
                      <button onClick={() => setLeaveMode("weekday")} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={leaveMode === "weekday" ? { background: "#8A6D1F", color: "white" } : { color: "#6B6A63" }}>曜日で指定</button>
                      <button onClick={() => setLeaveMode("date")} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={leaveMode === "date" ? { background: "#8A6D1F", color: "white" } : { color: "#6B6A63" }}>日付で指定</button>
                    </div>
                    {leaveMode === "weekday" ? (
                      <div className="flex gap-1">
                        {WEEKDAY_ORDER_JA.map((label, i) => (
                          <button
                            key={label}
                            onClick={() => toggleLeaveWeekday(i)}
                            className="flex-1 text-xs py-1.5 rounded-full font-medium"
                            style={leaveWeekdays[i] ? { background: "#8A6D1F", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-1">
                        {dates.map((date) => {
                          const dayNum = Number(date.slice(-2));
                          const on = leaveDates.includes(date);
                          return (
                            <button
                              key={date}
                              onClick={() => toggleLeaveDate(date)}
                              className="text-[11px] py-1 rounded font-medium mono"
                              style={on ? { background: "#8A6D1F", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={applyBulkByWeekday} className="flex-1 text-sm py-1.5 rounded font-medium text-white" style={{ background: "#12756B" }}>一括設定</button>
                <button onClick={clearAllMonth} className="flex-1 text-xs py-1.5 rounded font-medium" style={{ background: "#C4453B0D", color: "#C4453B" }}>この月をすべてクリア</button>
              </div>
            </div>
            <p className="text-xs mb-3" style={{ color: "#8A8776" }}>勤務する曜日・休み希望の曜日・有給の曜日をそれぞれ選んで「一括設定」を押すと、全部まとめてこの月に反映されます（同じ曜日を複数箇所で選んだ場合は、休み希望・有給が優先されます）。個別に変えたい日だけ、下で直接変更できます。</p>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {dates.map((date) => {
                const d = formDays[date] || { mode: null, start: "09:00", end: "17:00", note: "" };
                const dObj = new Date(date + "T00:00:00");
                const isMonday = dObj.getDay() === 1;
                return (
                  <div key={date}>
                    {isMonday && date !== dates[0] && <div className="border-t my-2" style={{ borderColor: "#EFEDE7" }} />}
                    <div className="rounded border px-3 py-2.5" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="mono text-sm font-semibold" style={{ color: "#1B2A4A" }}>{dispShort(date)}</span>
                        {d.mode && <button onClick={() => clearDay(date)} className="text-[11px]" style={{ color: "#C4453B" }}>クリア</button>}
                      </div>
                      <div className="flex gap-1.5 mb-2">
                        {[["ok", "終日OK"], ["time", "時間指定"], ["leave", "有給"], ["off", "休み希望"]].map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => {
                              if (val === "ok") {
                                const band = storeSlots.find((s) => s.id === fixedBandSlotId);
                                setDay(date, band ? { mode: val, start: band.start, end: band.end } : { mode: val });
                              } else {
                                setDay(date, { mode: val });
                              }
                            }}
                            className="flex-1 text-xs py-1.5 rounded font-medium"
                            style={d.mode === val ? { background: val === "off" ? "#C4453B" : val === "leave" ? "#8A6D1F" : "#1B2A4A", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {d.mode === "ok" && (
                        <p className="text-xs mono mb-2" style={{ color: "#12756B" }}>登録される時間：{d.start}〜{d.end}</p>
                      )}
                      {d.mode === "time" && (
                        <div className="flex items-center gap-1.5 mb-2 mono text-sm">
                          <input value={d.start} onChange={(e) => setDay(date, { start: e.target.value })} className="w-16 border rounded px-1.5 py-1 outline-none text-center" style={{ borderColor: "#DCD9D0" }} />
                          <span style={{ color: "#8A8776" }}>〜</span>
                          <input value={d.end} onChange={(e) => setDay(date, { end: e.target.value })} className="w-16 border rounded px-1.5 py-1 outline-none text-center" style={{ borderColor: "#DCD9D0" }} />
                        </div>
                      )}
                      {d.mode === "leave" && (
                        <div className="flex gap-1.5 mb-2">
                          {[["full", "全休（1日）"], ["half_am", "半休（午前）"], ["half_pm", "半休（午後）"]].map(([val, label]) => (
                            <button key={val} onClick={() => setDay(date, { leaveUnit: val })} className="flex-1 text-[11px] py-1 rounded font-medium"
                              style={(d.leaveUnit || "full") === val ? { background: "#8A6D1F", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                      {d.mode && (
                        <input value={d.note} onChange={(e) => setDay(date, { note: e.target.value })} placeholder="備考（任意）例：通院のため午前休み" className="w-full text-xs px-2.5 py-1.5 rounded border outline-none" style={{ borderColor: "#DCD9D0" }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {hasUnsavedChanges && (
              <p className="mt-3 text-xs px-2.5 py-2 rounded" style={{ background: "#D98E0415", color: "#8A6D1F" }}>
                ⚠ 未送信の変更があります。下の「一括送信」を押すまで保存されません。
              </p>
            )}
            <button onClick={submitAll} disabled={submitting} className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40" style={{ background: "#12756B" }}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={15} />}{year}年{monthIdx + 1}月分を一括送信
            </button>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg border px-4 py-4" style={{ borderColor: "#DCD9D0" }}>
            <div className="flex items-center gap-2 mb-3"><Clock size={15} style={{ color: "#1B2A4A" }} /><h2 className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>あなたの提出履歴</h2></div>
            {myHistory.length === 0 ? (
              <p className="text-xs" style={{ color: "#8A8776" }}>まだ提出はありません。</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {myHistory.map((r) => (
                  <div key={r.id} className="px-3 py-2 rounded" style={{ background: "#FAFAF8", border: "1px solid #EFEDE7" }}>
                    <div className="flex items-center justify-between">
                      <span className="mono text-sm font-medium" style={{ color: "#1B2A4A" }}>{dispShort(r.date)}</span>
                      <span className="text-xs mono" style={{ color: r.leave ? "#8A6D1F" : r.available ? "#12756B" : "#C4453B" }}>
                        {r.leave ? `有給（${r.leave === "full" ? "全休" : r.leave === "half_am" ? "半休・午前" : "半休・午後"}）` : r.available ? `${r.start}-${r.end}` : "休み希望"}
                      </span>
                    </div>
                    {r.note && <div className="text-[11px] mt-0.5" style={{ color: "#8A8776" }}>{r.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg" style={{ background: "#1B2A4A" }}>
          <Check size={14} />{toast}
        </div>
      )}
    </div>
  );
}

// ======================= GIG APPLY VIEW =======================
function GigApplyView({ storeName, storeList, commuteFare, staff, persistRoster, slots, assignments, persistAssignments, postings, persistPostings, myGigId, setMyGigId }) {
  const [profile, setProfile] = useState({ name: "", homeStore: storeList.filter(Boolean)[0] || storeName, phone: "", attribute: GIG_ATTRIBUTES[0], experienceBands: [] });
  const [openFormPk, setOpenFormPk] = useState(null);
  const [draft, setDraft] = useState(null);
  const [toast, setToast] = useState("");
  const [applyingId, setApplyingId] = useState("");

  useEffect(() => {
    (async () => {
      const prof = await loadJSON("myGigProfile", null, false);
      if (prof) setProfile((p) => ({ ...p, ...prof }));
    })();
  }, []);

  const slotGeomFor = (slot) => {
    const start = parseHour(slot.start);
    let end = parseHour(slot.end);
    if (end <= start) end += 24;
    return { startHour: start, hours: end - start };
  };

  const nowISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const allPostings = useMemo(() => {
    const list = [];
    Object.entries(postings).forEach(([pk, posting]) => {
      if (!posting?.open) return;
      const parts = pk.split("__");
      if (parts.length < 3) return;
      const [weekStartPart, date, slotId] = parts;
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return;
      const dayIdx = Math.round((new Date(date + "T00:00:00") - new Date(weekStartPart + "T00:00:00")) / 86400000);
      const asgKey = `${weekStartPart}__${dayIdx}__${slotId}`;
      const assignedIds = assignments[asgKey] || [];
      const isSwap = !!posting.replacingStaffId;
      const approvedCount = Object.values(posting.applicants || {}).filter((a) => a.status === "approved").length;
      const remaining = isSwap
        ? 1
        : posting.recruitCount !== undefined
          ? Math.max(posting.recruitCount - approvedCount, 0)
          : slot.required - assignedIds.length;
      if (!isSwap && remaining <= 0) return;
      const applicants = posting.applicants || {};
      const deadlinePassed = posting.deadline && posting.deadline < nowISO();
      const replacingPerson = isSwap ? staff.find((p) => p.id === posting.replacingStaffId) : null;
      const wage = isSwap ? (replacingPerson?.wage ?? null) : posting.wage;
      list.push({ pk, weekStartPart, date, slot, asgKey, assignedIds, remaining, wage, note: posting.note, helpStore: posting.helpStore || storeName, applicants, night: isNightSlot(slotGeomFor(slot)), deadline: posting.deadline, deadlinePassed, isSwap, band: posting.band });
    });
    return list.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [postings, slots, assignments, staff]);

  const myApplicationStatus = (item) => {
    if (!profile.name.trim()) return null;
    const mine = Object.values(item.applicants).find((a) => a.name === profile.name.trim() && a.homeStore === profile.homeStore);
    return mine?.status || null;
  };

  const myClaims = useMemo(() => {
    if (!myGigId) return [];
    const claims = [];
    Object.entries(assignments).forEach(([k, ids]) => {
      if (!ids.includes(myGigId)) return;
      const parts = k.split("__");
      if (parts.length < 3) return;
      const [weekStartPart, dayIdxStr, slotId] = parts;
      const slot = slots.find((s) => s.id === slotId);
      const date = addDays(weekStartPart, Number(dayIdxStr));
      claims.push({ date, slot, status: "approved" });
    });
    return claims.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [assignments, myGigId, slots]);

  const openApplyForm = (item) => {
    setOpenFormPk(item.pk);
    setDraft({ ...profile });
  };

  const toggleBand = (band) => {
    setDraft((d) => ({
      ...d,
      experienceBands: d.experienceBands.includes(band) ? d.experienceBands.filter((b) => b !== band) : [...d.experienceBands, band],
    }));
  };

  const submitApply = async (item) => {
    if (!draft.name.trim()) { alert("お名前を入力してください"); return; }
    setApplyingId(item.pk);
    try {
      const appKey = `app_${nextId("a")}`;
      const applicantRecord = {
        name: draft.name.trim(), homeStore: draft.homeStore, phone: draft.phone.trim(),
        attribute: draft.attribute, experienceBands: draft.experienceBands,
        status: "pending", appliedAt: new Date().toISOString(),
      };
      const nextApplicants = { ...item.applicants, [appKey]: applicantRecord };
      await persistPostings({ ...postings, [item.pk]: { ...postings[item.pk], applicants: nextApplicants } });
      sendPushNotification("新しい応募がありました", `${draft.name.trim()}さんが「${item.note || item.helpStore}」に応募しました`);
      await saveJSON("myGigProfile", draft, false);
      setProfile(draft);
      setOpenFormPk(null);
      setToast("応募しました。店舗の承認をお待ちください");
    } catch (e) {
      setToast("送信に失敗しました。もう一度お試しください");
    } finally {
      setApplyingId("");
      setTimeout(() => setToast(""), 2500);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg border px-4 py-3 mb-4" style={{ borderColor: "#DCD9D0" }}>
        <div className="flex items-center gap-2 mb-1"><Megaphone size={18} style={{ color: "#1B2A4A" }} /><span className="font-bold text-sm" style={{ color: "#1B2A4A" }}>スポット募集に応募</span></div>
        <p className="text-xs" style={{ color: "#8A8776" }}>まずは募集中のシフトをご覧ください。応募したい枠が見つかったら「応募する」から必要事項を入力してください。</p>
      </div>

      <div className="bg-white rounded-lg border px-4 py-4 mb-4" style={{ borderColor: "#DCD9D0" }}>
        <div className="flex items-center gap-2 mb-3"><Briefcase size={15} style={{ color: "#1B2A4A" }} /><h2 className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>募集中のシフト</h2></div>
        {allPostings.length === 0 ? (
          <p className="text-xs" style={{ color: "#8A8776" }}>現在募集中のシフトはありません。</p>
        ) : (
          <div className="space-y-2">
            {allPostings.map((item) => {
              const status = myApplicationStatus(item);
              const formOpen = openFormPk === item.pk;
              return (
                <div key={item.pk} className="rounded border px-3 py-2.5" style={{ borderColor: "#EFEDE7", background: "#FAFAF8" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="mono text-sm font-semibold" style={{ color: "#1B2A4A" }}>{dispShort(item.date)} {item.slot.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: item.isSwap ? "#8A6D1F15" : "#D98E0415", color: item.isSwap ? "#8A6D1F" : "#B5562B" }}>{item.isSwap ? "代わり募集" : `あと${item.remaining}名`}</span>
                  </div>
                  <div className="mono text-xs mb-1.5" style={{ color: "#6B6A63" }}>
                    {item.helpStore}　{item.slot.start}〜{item.slot.end}　
                    {item.isSwap ? (item.wage ? `参考時給¥${item.wage}（ご自身の時給が適用されます）` : "時給はご自身の時給が適用されます") : `時給¥${item.wage}`}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {item.band && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#2b2f4a15", color: "#3a3d6b" }}>{item.band}</span>}
                    {item.night && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#2b2f4a15", color: "#3a3d6b" }}>🌙深夜手当あり</span>}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#2f7d4f15", color: "#2f7d4f" }}>🚃交通費¥{commuteFare}</span>
                    {item.deadline && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: item.deadlinePassed ? "#C4453B15" : "#B5562B15", color: item.deadlinePassed ? "#C4453B" : "#B5562B" }}>
                        締切 {dispShort(item.deadline.split("T")[0])} {item.deadline.split("T")[1]}
                      </span>
                    )}
                  </div>

                  {status === "approved" ? (
                    <button disabled className="w-full flex items-center justify-center gap-1.5 text-sm py-1.5 rounded font-medium text-white" style={{ background: "#2F7D4F" }}><Check size={14} />確定済み</button>
                  ) : status === "pending" ? (
                    <button disabled className="w-full flex items-center justify-center gap-1.5 text-sm py-1.5 rounded font-medium" style={{ background: "#D98E0415", color: "#8A6D1F" }}>⏳ 応募済み — 承認待ち</button>
                  ) : status === "rejected" ? (
                    <button disabled className="w-full flex items-center justify-center gap-1.5 text-sm py-1.5 rounded font-medium" style={{ background: "#C4453B15", color: "#C4453B" }}>今回は見送りとなりました</button>
                  ) : item.deadlinePassed ? (
                    <button disabled className="w-full flex items-center justify-center gap-1.5 text-sm py-1.5 rounded font-medium" style={{ background: "#EFEDE7", color: "#8A8776" }}>応募を締め切りました</button>
                  ) : !formOpen ? (
                    <button
                      onClick={() => openApplyForm(item)}
                      className="w-full flex items-center justify-center gap-1.5 text-sm py-1.5 rounded font-medium text-white"
                      style={{ background: "#12756B" }}
                    >
                      <Megaphone size={14} />応募する
                    </button>
                  ) : (
                    <div className="mt-1 pt-2 border-t space-y-2" style={{ borderColor: "#EFEDE7" }}>
                      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="お名前" className="w-full text-sm px-3 py-2 rounded border outline-none" style={{ borderColor: "#DCD9D0" }} />
                      <select value={draft.homeStore} onChange={(e) => setDraft({ ...draft, homeStore: e.target.value })} className="w-full text-sm px-3 py-2 rounded border outline-none" style={{ borderColor: "#DCD9D0" }}>
                        {(storeList.filter(Boolean).length ? storeList.filter(Boolean) : [storeName]).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={draft.attribute} onChange={(e) => setDraft({ ...draft, attribute: e.target.value })} className="w-full text-sm px-3 py-2 rounded border outline-none" style={{ borderColor: "#DCD9D0" }}>
                        {GIG_ATTRIBUTES.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <div>
                        <span className="text-xs block mb-1" style={{ color: "#6B6A63" }}>経験のある時間帯（複数選択可）</span>
                        <div className="flex flex-wrap gap-1.5">
                          {SHIFT_BANDS.map((band) => (
                            <button
                              key={band}
                              onClick={() => toggleBand(band)}
                              className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={draft.experienceBands.includes(band) ? { background: "#1B2A4A", color: "white" } : { background: "#EFEDE7", color: "#6B6A63" }}
                            >
                              {band}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} style={{ color: "#8A8776" }} />
                        <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="電話番号（任意）" className="flex-1 text-sm px-3 py-2 rounded border outline-none" style={{ borderColor: "#DCD9D0" }} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setOpenFormPk(null)} className="flex-1 text-sm py-2 rounded font-medium" style={{ background: "#EFEDE7", color: "#6B6A63" }}>キャンセル</button>
                        <button
                          onClick={() => submitApply(item)}
                          disabled={applyingId === item.pk}
                          className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded font-medium text-white disabled:opacity-50"
                          style={{ background: "#12756B" }}
                        >
                          {applyingId === item.pk ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          応募を送信
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[11px] mt-3" style={{ color: "#B8B5AA" }}>※他のお仕事や予定と時間が重ならないか、応募前にご自身でご確認ください。</p>
      </div>

      {myClaims.length > 0 && (
        <div className="bg-white rounded-lg border px-4 py-4" style={{ borderColor: "#DCD9D0" }}>
          <div className="flex items-center gap-2 mb-3"><Clock size={15} style={{ color: "#1B2A4A" }} /><h2 className="text-sm font-semibold" style={{ color: "#1B2A4A" }}>確定したあなたのシフト</h2></div>
          <div className="space-y-2">
            {myClaims.map((c, i) => (
              <div key={i} className="px-3 py-2 rounded flex items-center justify-between" style={{ background: "#FAFAF8", border: "1px solid #EFEDE7" }}>
                <span className="mono text-sm font-medium" style={{ color: "#1B2A4A" }}>{dispShort(c.date)}</span>
                <span className="text-xs mono" style={{ color: "#12756B" }}>{c.slot ? `${c.slot.label} ${c.slot.start}-${c.slot.end}` : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg" style={{ background: "#1B2A4A" }}>
          <Check size={14} />{toast}
        </div>
      )}
    </div>
  );
}
