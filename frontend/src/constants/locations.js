/**
* Canonical campus location presets.
*
* Single source of truth shared by the lodge-grievance form (SubmissionForm)
* and the Public Ledger filter (PublicFeed) so both always offer the exact
* same hostel / location options.
*/
// Official campus academic/administrative buildings.
export const CAMPUS_BUILDINGS = [
    'Aryabhatta Block',
    'Ramanujan Block',
    'Bhabha Block',
    'Raman Block',
    'Vishwakarma Block',
    'Business Block',
];
// Official hostel bhavans.
export const HOSTELS = [
    'Vivekanand Bhavan',
    'Dayanand Bhavan',
    'Chanakya Bhavan',
    'Aurobindo Bhavan',
    'Ramakrishna Bhavan',
    'FR Building',
    'Kasturba Bhavan',
    'Sarojini Bhavan',
];
// Sentinel value that switches the form to the free-text custom location input.
export const OTHER_LOCATION = 'Others / Custom Location';
// Every official preset, in form order. Used by the Public Ledger location
// filter so it mirrors the lodge-grievance dropdown exactly. The custom
// location sentinel is intentionally omitted here — submitted grievances store
// the typed custom text, so the sentinel would never match a real record.
export const OFFICIAL_LOCATIONS = [
    ...CAMPUS_BUILDINGS,
    ...HOSTELS,
];
