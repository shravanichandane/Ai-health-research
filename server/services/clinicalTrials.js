/**
 * ClinicalTrials.gov API v2 Service
 * Fetches clinical trials data
 * https://clinicaltrials.gov/data-api/api
 */
import axios from "axios";

const BASE_URL = "https://clinicaltrials.gov/api/v2";

/**
 * Search for clinical trials matching disease + query
 */
export async function searchTrials(disease, query, maxResults = 50) {
  try {
    const searchTerms = [disease, query].filter(Boolean).join(" ");

    const response = await axios.get(`${BASE_URL}/studies`, {
      params: {
        "query.cond": disease,
        "query.term": query,
        pageSize: Math.min(maxResults, 100),
        sort: "LastUpdatePostDate:desc",
        fields:
          "NCTId,BriefTitle,OverallStatus,BriefSummary,Phase,Condition,InterventionName,EligibilityCriteria,LocationCity,LocationState,LocationCountry,LocationFacility,CentralContactName,CentralContactPhone,CentralContactEMail,StartDate,StudyType,EnrollmentCount",
      },
      timeout: 15000,
    });

    const studies = response.data?.studies || [];
    return studies.map(normalizeTrialV2);
  } catch (err) {
    console.error("ClinicalTrials.gov search failed:", err.message);
    // Fallback: try the older query format
    try {
      return await searchTrialsFallback(disease, query, maxResults);
    } catch {
      return [];
    }
  }
}

/**
 * Fallback search using simpler query parameters
 */
async function searchTrialsFallback(disease, query, maxResults) {
  const response = await axios.get(`${BASE_URL}/studies`, {
    params: {
      "query.term": `${disease} ${query}`,
      pageSize: maxResults,
    },
    timeout: 15000,
  });
  return (response.data?.studies || []).map(normalizeTrialV2);
}

/**
 * Normalize ClinicalTrials.gov v2 response to unified schema
 */
function normalizeTrialV2(study) {
  const proto = study.protocolSection || {};
  const idModule = proto.identificationModule || {};
  const statusModule = proto.statusModule || {};
  const descModule = proto.descriptionModule || {};
  const designModule = proto.designModule || {};
  const eligModule = proto.eligibilityModule || {};
  const contactModule = proto.contactsLocationsModule || {};
  const armsModule = proto.armsInterventionsModule || {};

  // Extract locations
  const locations = (contactModule.locations || []).slice(0, 5).map((loc) => ({
    facility: loc.facility || "Unknown Facility",
    city: loc.city || "",
    state: loc.state || "",
    country: loc.country || "",
  }));

  // Extract contacts
  const contacts = (contactModule.centralContacts || []).map((c) => ({
    name: c.name || "",
    phone: c.phone || "",
    email: c.email || "",
  }));

  // Extract interventions
  const interventions = (armsModule.interventions || []).map(
    (i) => i.name || i.type || ""
  );

  return {
    id: idModule.nctId || "Unknown",
    nctId: idModule.nctId,
    title: idModule.briefTitle || idModule.officialTitle || "Untitled Trial",
    status: statusModule.overallStatus || "Unknown",
    summary: descModule.briefSummary || "",
    phase: (designModule.phases || []).join(", ") || "Not Specified",
    conditions: (proto.conditionsModule?.conditions || []),
    eligibility: eligModule.eligibilityCriteria || "",
    eligibilityGender: eligModule.sex || "All",
    eligibilityAge: `${eligModule.minimumAge || "N/A"} — ${eligModule.maximumAge || "N/A"}`,
    enrollment: designModule.enrollmentInfo?.count || null,
    studyType: designModule.studyType || "",
    interventions,
    locations,
    contacts,
    startDate: statusModule.startDateStruct?.date || "",
    url: `https://clinicaltrials.gov/study/${idModule.nctId}`,
    source: "ClinicalTrials.gov",
  };
}

export default { searchTrials };
