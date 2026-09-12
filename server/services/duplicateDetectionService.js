import VulnerabilityReport from '../models/VulnerabilityReport.js';

/**
 * Tokenizes text into a set of lowercased alphanumeric words, removing common stopwords.
 */
const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'with', 'to', 'for', 'of', 'by', 'from',
  'that', 'this', 'it', 'as', 'be', 'are', 'was', 'were', 'not', 'can', 'has', 'have', 'had', 'http', 'https',
]);

const tokenize = (text) => {
  if (!text || typeof text !== 'string') return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9_/-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
};

/**
 * Computes Jaccard similarity between two token sets.
 * Returns value between 0.0 and 1.0.
 */
const jaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 || setB.size === 0) return 0.0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize === 0 ? 0.0 : intersectionCount / unionSize;
};

/**
 * Normalizes an affected asset string (URL or hostname/path) for comparison.
 */
const normalizeAsset = (asset) => {
  if (!asset) return '';
  return asset
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
};

/**
 * Compares two asset targets.
 */
const assetSimilarity = (assetA, assetB) => {
  const normA = normalizeAsset(assetA);
  const normB = normalizeAsset(assetB);
  if (!normA || !normB) return 0.0;
  if (normA === normB) return 1.0;
  if (normA.includes(normB) || normB.includes(normA)) return 0.75;

  // Compare domain prefix
  const hostA = normA.split('/')[0];
  const hostB = normB.split('/')[0];
  if (hostA === hostB && hostA.length > 0) return 0.5;

  return 0.0;
};

/**
 * Checks similarity between a new or existing report and candidate reports.
 *
 * @param {Object} reportData - Fields: { title, affectedAsset, category, description, reproductionSteps, programId, _id }
 * @param {number} [threshold=40] - Minimum similarity percentage to return as a match
 * @returns {Promise<Object>} { highestSimilarity, recommendation, matches }
 */
export const checkReportDuplicates = async (reportData, threshold = 40) => {
  if (!reportData) {
    return { highestSimilarity: 0, recommendation: 'unique', matches: [] };
  }

  const query = {
    programId: reportData.programId,
  };

  // Exclude current report if updating
  if (reportData._id) {
    query._id = { $ne: reportData._id };
  }

  // Optimize candidate query: fetch reports from the same program
  // (or with matching category or asset)
  const candidates = await VulnerabilityReport.find(query)
    .select('_id title affectedAsset category description reproductionSteps status createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (!candidates || candidates.length === 0) {
    return {
      highestSimilarity: 0,
      recommendation: 'unique',
      matches: [],
    };
  }

  const newTitleTokens = tokenize(reportData.title);
  const newContentTokens = tokenize(`${reportData.description || ''} ${reportData.reproductionSteps || ''}`);

  const matches = [];

  for (const cand of candidates) {
    const candTitleTokens = tokenize(cand.title);
    const candContentTokens = tokenize(`${cand.description || ''} ${cand.reproductionSteps || ''}`);

    const simTitle = jaccardSimilarity(newTitleTokens, candTitleTokens);
    const simAsset = assetSimilarity(reportData.affectedAsset, cand.affectedAsset);
    const simCategory = reportData.category === cand.category ? 1.0 : 0.0;
    const simContent = jaccardSimilarity(newContentTokens, candContentTokens);

    // Weighted composite score (0 to 100)
    // Title: 25%, Asset: 25%, Category: 15%, Content: 35%
    const compositeScore = Math.round(
      (simTitle * 0.25 + simAsset * 0.25 + simCategory * 0.15 + simContent * 0.35) * 100
    );

    const matchedFields = [];
    if (simAsset >= 0.75) matchedFields.push('asset');
    if (simCategory === 1.0) matchedFields.push('category');
    if (simTitle >= 0.4) matchedFields.push('title');
    if (simContent >= 0.4) matchedFields.push('content');

    if (compositeScore >= threshold) {
      matches.push({
        reportId: cand._id,
        title: cand.title,
        status: cand.status,
        affectedAsset: cand.affectedAsset,
        category: cand.category,
        similarityScore: compositeScore,
        matchedFields,
        createdAt: cand.createdAt,
      });
    }
  }

  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  const highestSimilarity = matches.length > 0 ? matches[0].similarityScore : 0;

  let recommendation = 'unique';
  if (highestSimilarity >= 70) {
    recommendation = 'likely_duplicate';
  } else if (highestSimilarity >= 45) {
    recommendation = 'possible_similarity';
  }

  return {
    highestSimilarity,
    recommendation,
    matches: matches.slice(0, 5), // Return top 5 matches
  };
};
