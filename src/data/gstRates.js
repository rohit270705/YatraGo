/**
 * YatraGo — GST Rates Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * This module mirrors the `gst_rates` Supabase table as a frontend constant so
 * GST calculations work in the demo / offline mode without a DB round-trip.
 *
 * ⚠️  VERIFY ALL RATES BEFORE PRODUCTION USE.
 *    These values are reference points based on CBIC notifications as of 2024.
 *    Rates can be updated here OR in the `gst_rates` Supabase table without
 *    touching component logic.
 *
 * Government references used:
 *  - Rail AC classes (5%):  CBIC Notification 11/2017-CT(Rate) Sl.No.52A (amended)
 *  - Domestic air (5%/12%): CBIC Notification 8/2017-IT(Rate)
 *  - Exemptions:            CBIC Notification 12/2017-CT(Rate)
 *
 * YatraGo registered state: Maharashtra (state code 27)
 *   → if customer GSTIN state code === '27': show CGST 50% + SGST 50%
 *   → otherwise: show IGST 100%
 * ⚠️  Update YATRAGO_GST_STATE and YATRAGO_GSTIN before going live.
 */

// ─── YatraGo GST Identity (PLACEHOLDERS — update before production) ──────────
export const YATRAGO_GST_STATE = '27';          // '27' = Maharashtra
export const YATRAGO_GSTIN     = '27AXXXX1234X1ZX'; // placeholder GSTIN

// ─── Senior Citizen Concession ────────────────────────────────────────────────
// Indian Railways suspended senior citizen fare concession in 2020.
// As of knowledge cutoff 2024, it had NOT been fully restored.
// Berth preference (Lower berth) still applies — no fare discount.
// ⚠️  UPDATE this value if IR restores the concession; setting it here avoids
//     a code change — only this constant needs updating.
export const SENIOR_CITIZEN_CONCESSION_PERCENT = 0; // 0 = no discount; set to e.g. 40 if restored
export const SENIOR_CITIZEN_MIN_AGE_FEMALE = 58;
export const SENIOR_CITIZEN_MIN_AGE_MALE   = 60;

// ─── PWD (Persons with Disability) Concession ────────────────────────────────
// ⚠️  Indian Railways PWD concession percentages vary by class and disability
//     category. Verify current circular (Ministry of Railways) before applying.
//     Default: 0 — show no automatic discount; let agent/operator apply manually.
export const PWD_CONCESSION_PERCENT = 0;        // update with verified current rate

// ─── Tatkal Booking Window ────────────────────────────────────────────────────
// Tatkal opens D-1 (the day before journey date).
// ⚠️  Real IRCTC rules also enforce a time gate (e.g., 10:00 IST for AC,
//     11:00 IST for non-AC). For demo: date-only check (journeyDays === 1).
// TODO: add time-of-day enforcement when going live with real booking.
export const TATKAL_DAYS_BEFORE_JOURNEY = 1;

// Tatkal surcharge: real value is per-km tiered; for demo we use a flat
// percentage of base fare as an approximation. ⚠️  Replace with actual table.
export const TATKAL_SURCHARGE_PERCENT = 30; // approximate only — verify IR circular

// ─── GST Rate Table (mirrors gst_rates DB table) ─────────────────────────────
// Each entry: { gstPercent, isExempt, note }
// Key format: `${mode}::${classCode}` or `${mode}::*` for mode fallback.
const GST_RATE_TABLE = {
  // ── TRAIN ──
  'train::GN': { gstPercent: 0,  isExempt: true,  note: 'General/Unreserved — GST Exempt (non-AC). Ref: CBIC 12/2017-CT(Rate) Sl.8. VERIFY.' },
  'train::SL': { gstPercent: 0,  isExempt: true,  note: 'Sleeper — GST Exempt (non-AC). Ref: same notification. VERIFY.' },
  'train::3A': { gstPercent: 5,  isExempt: false, note: 'AC 3 Tier — 5% GST. Ref: CBIC Notif 11/2017-CT(Rate) Sl.52A. VERIFY.' },
  'train::3E': { gstPercent: 5,  isExempt: false, note: 'AC 3 Economy — 5% GST. Same treatment as 3A. VERIFY.' },
  'train::2A': { gstPercent: 5,  isExempt: false, note: 'AC 2 Tier — 5% GST. Ref: CBIC Notif 11/2017-CT(Rate) Sl.52A. VERIFY.' },
  'train::1A': { gstPercent: 5,  isExempt: false, note: 'AC First Class — 5% GST. Ref: CBIC Notif 11/2017-CT(Rate) Sl.52A. VERIFY.' },
  'train::CC': { gstPercent: 5,  isExempt: false, note: 'AC Chair Car — 5% GST. Same AC treatment. VERIFY.' },
  'train::EC': { gstPercent: 5,  isExempt: false, note: 'Executive Chair Car — 5% GST. Same AC treatment. VERIFY.' },

  // ── FLIGHT ──
  'flight::Economy':         { gstPercent: 5,  isExempt: false, note: 'Domestic Economy — 5% GST. Ref: CBIC Notif 8/2017-IT(Rate). VERIFY.' },
  'flight::Premium Economy': { gstPercent: 12, isExempt: false, note: 'Domestic Premium Economy — 12% GST. Ref: same notification. VERIFY.' },
  'flight::Business':        { gstPercent: 12, isExempt: false, note: 'Domestic Business — 12% GST. Ref: same notification. VERIFY.' },

  // ── FERRY ──
  'ferry::Local Ferry':            { gstPercent: 0, isExempt: true,  note: 'Local ferry — typically exempt (small vessel). VERIFY.' },
  'ferry::River Cruise':           { gstPercent: 0, isExempt: true,  note: 'River cruise — typically exempt. VERIFY.' },
  'ferry::Inter-Island':           { gstPercent: 5, isExempt: false, note: 'Inter-island service — 5% indicative. VERIFY.' },
  'ferry::Luxury Cruise':          { gstPercent: 5, isExempt: false, note: 'Luxury cruise — 5% indicative. VERIFY.' },
  'ferry::Overnight Cruise Ferry': { gstPercent: 5, isExempt: false, note: 'Overnight cruise ferry — 5% indicative. VERIFY.' },

  // ── BUS / ROAD ──
  'bus::Non-AC': { gstPercent: 0, isExempt: true,  note: 'Non-AC contract carriage — typically exempt. VERIFY.' },
  'bus::AC':     { gstPercent: 5, isExempt: false, note: 'AC contract carriage — 5% indicative. VERIFY.' },

  // Fallbacks (mode-level, no class code)
  'train::*':  { gstPercent: 0, isExempt: true,  note: 'Train default — exempt (verify class)' },
  'flight::*': { gstPercent: 5, isExempt: false, note: 'Flight default — 5% (verify class)' },
  'ferry::*':  { gstPercent: 0, isExempt: true,  note: 'Ferry default — exempt (verify class)' },
  'bus::*':    { gstPercent: 0, isExempt: true,  note: 'Bus default — exempt (verify class)' },
};

/**
 * Look up the applicable GST rate for a booking.
 *
 * @param {string} mode      - 'train' | 'flight' | 'ferry' | 'bus'
 * @param {string} classCode - e.g. 'SL', 'Economy', 'Luxury Cruise' ...
 * @returns {{ gstPercent: number, isExempt: boolean, note: string }}
 */
export function getGstRate(mode, classCode) {
  const key  = `${mode}::${classCode}`;
  const fbk  = `${mode}::*`;
  return GST_RATE_TABLE[key] || GST_RATE_TABLE[fbk] || { gstPercent: 0, isExempt: true, note: 'Unknown class — defaulting to exempt. Verify.' };
}

/**
 * Calculate GST amount given a base fare.
 * Returns 0 if exempt.
 *
 * @param {number} baseFare
 * @param {string} mode
 * @param {string} classCode
 * @returns {{ gstAmount: number, gstPercent: number, isExempt: boolean, note: string }}
 */
export function calcGst(baseFare, mode, classCode) {
  const rate = getGstRate(mode, classCode);
  if (rate.isExempt || rate.gstPercent === 0) {
    return { gstAmount: 0, gstPercent: 0, isExempt: true, note: rate.note };
  }
  const gstAmount = Math.round(baseFare * rate.gstPercent / 100);
  return { gstAmount, gstPercent: rate.gstPercent, isExempt: false, note: rate.note };
}

/**
 * Validate GSTIN format (15-character Indian GSTIN).
 * Pattern: 2-digit state code + 10-char PAN + 1-digit entity + 'Z' + 1 check char
 *
 * @param {string} gstin
 * @returns {boolean}
 */
export function isValidGstin(gstin) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
    (gstin || '').toUpperCase().trim()
  );
}

/**
 * Extract the 2-digit state code from a GSTIN.
 * e.g. '29ABCDE1234F1Z5' → '29' (Karnataka)
 *
 * @param {string} gstin
 * @returns {string} 2-digit state code, or '' if invalid
 */
export function gstinStateCode(gstin) {
  const g = (gstin || '').toUpperCase().trim();
  if (!isValidGstin(g)) return '';
  return g.substring(0, 2);
}

/**
 * Determine GST split type based on state comparison.
 * If customer's state === YatraGo's registered state → CGST + SGST (intra-state)
 * Otherwise → IGST (inter-state)
 *
 * @param {string} customerGstin
 * @returns {'CGST_SGST' | 'IGST' | null}  null if GSTIN invalid
 */
export function gstSplitType(customerGstin) {
  const custState = gstinStateCode(customerGstin);
  if (!custState) return null;
  return custState === YATRAGO_GST_STATE ? 'CGST_SGST' : 'IGST';
}

/** Indian state code → state name mapping (used for Place of Supply display) */
export const GST_STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh',      '05': 'Uttarakhand',       '06': 'Haryana',
  '07': 'Delhi',           '08': 'Rajasthan',         '09': 'Uttar Pradesh',
  '10': 'Bihar',           '11': 'Sikkim',            '12': 'Arunachal Pradesh',
  '13': 'Nagaland',        '14': 'Manipur',           '15': 'Mizoram',
  '16': 'Tripura',         '17': 'Meghalaya',         '18': 'Assam',
  '19': 'West Bengal',     '20': 'Jharkhand',         '21': 'Odisha',
  '22': 'Chhattisgarh',   '23': 'Madhya Pradesh',    '24': 'Gujarat',
  '25': 'Daman & Diu',    '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka',          '30': 'Goa',
  '31': 'Lakshadweep',    '32': 'Kerala',             '33': 'Tamil Nadu',
  '34': 'Puducherry',     '35': 'Andaman & Nicobar',  '36': 'Telangana',
  '37': 'Andhra Pradesh (new)', '38': 'Ladakh',
};

/** Generate a YatraGo tax invoice number */
export function generateInvoiceNumber(bookingId) {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const shortId = (bookingId || 'DEMO').slice(-6).toUpperCase();
  return `INV-${dateStr}-${shortId}`;
}
