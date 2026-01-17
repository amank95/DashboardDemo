import { chromium } from "playwright";
import express from "express";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB configuration
const MONGODB_URI = "mongodb://localhost:27017/";
const DATABASE_NAME = "blinkit_local";
const COLLECTION_NAME = "new_ranking";
const SEARCH_API_COLLECTION_NAME = "search_api_ranking";

// Express app
const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = 5010;

// Store active browser sessions
let activePage = null;
let activeContext = null;

// Initialize MongoDB connection
let mongoClient = null;
let mongoCollection = null;

async function initMongoDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DATABASE_NAME);
    mongoCollection = db.collection(COLLECTION_NAME);

    // Create indexes
    await mongoCollection.createIndex({ product_name: 1, timestamp: -1 });
    await mongoCollection.createIndex({ location: 1, timestamp: -1 });
    await mongoCollection.createIndex({ rank: 1 });
    await mongoCollection.createIndex({ timestamp: -1 });

    console.log(`✅ MongoDB connected - ${COLLECTION_NAME} collection ready`);
  } catch (error) {
    console.error("⚠️ MongoDB connection failed:", error.message);
    console.log("⚠️ Continuing without MongoDB - data will not be saved");
  }
}

// Save product rank to MongoDB
async function saveProductRank(productData, customCollection = null) {
  const targetCollection = customCollection || mongoCollection;
  if (!targetCollection) return false;

  try {
    const productPosition = productData.product_position ?? productData.rank ?? null;
    const document = {
      product_id: productData.product_id || '',
      sku_id: productData.sku_id || '',
      product_name: productData.product_name || '',
      brand: productData.brand || '',
      searched_for: productData.searched_for || '',
      product_position: productPosition,
      rank: productPosition,
      weight: productData.weight || '',
      current_price: productData.current_price || '',
      original_price: productData.original_price || '',
      discount: productData.discount || '',
      delivery_time: productData.delivery_time || '',
      image_url: productData.image_url || '',
      is_ad: productData.is_ad || false,
      location: productData.location || '',
      source_widget: productData.source_widget || '',
      timestamp: new Date(),
      success: productData.success || false
    };

    await targetCollection.insertOne(document);
    console.log(`✅ Saved product rank data: ${productData.product_name} at product_position ${productPosition ?? 'N/A'}`);
    return true;
  } catch (error) {
    console.error(`⚠️ Error saving to MongoDB: ${error.message}`);
    return false;
  }
}

// Save API search data to MongoDB
async function saveSearchAPIRankingData(apiData, searchQuery, location = '') {
  if (!mongoClient) return false;

  try {
    const db = mongoClient.db(DATABASE_NAME);
    const apiCollection = db.collection(SEARCH_API_COLLECTION_NAME);

    const document = {
      search_query: searchQuery,
      location: location || '',
      api_response: apiData,
      timestamp: new Date(),
      fetched_at: new Date().toISOString()
    };

    await apiCollection.insertOne(document);
    console.log(`✅ Saved search API data for query: "${searchQuery}" to ${SEARCH_API_COLLECTION_NAME}`);
    return true;
  } catch (error) {
    console.error(`⚠️ Error saving API data to MongoDB: ${error.message}`);
    return false;
  }
}

function getFirstDefined(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }
    return value;
  }
  return null;
}

function normalizePriceValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (!cleaned) return null;
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object') {
    return normalizePriceValue(getFirstDefined(
      value.price,
      value.value,
      value.amount,
      value.mrp,
      value.final_price,
      value.discounted_price,
      value.selling_price,
      value.default_price,
      value.default_selling_price,
      value.listing_price
    ));
  }
  return null;
}

function formatCurrency(value) {
  const normalized = normalizePriceValue(value);
  if (normalized === null) return '';
  const rounded = Math.round(normalized * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function formatDiscount(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') {
    return `${Math.round(value)}%`;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/%/.test(trimmed)) return trimmed;
    const numeric = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(numeric)) {
      return `${Math.round(numeric)}%`;
    }
    return trimmed;
  }
  if (typeof value === 'object') {
    return formatDiscount(getFirstDefined(value.value, value.percent, value.percentage));
  }
  return '';
}

function sanitizeRankValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = parseInt(trimmed.replace(/[^0-9.-]/g, ''), 10);
    return Number.isFinite(numeric) ? numeric : null;
  }
  if (typeof value === 'object') {
    return sanitizeRankValue(getFirstDefined(
      value.position,
      value.rank,
      value.value
    ));
  }
  return null;
}

function findNestedProductPosition(node, maxDepth = 8) {
  if (!node || typeof node !== 'object') return null;
  const seen = new WeakSet();
  const queue = [{ value: node, depth: 0 }];

  while (queue.length) {
    const { value, depth } = queue.shift();
    if (!value || typeof value !== 'object') continue;
    if (seen.has(value)) continue;
    seen.add(value);

    if (Object.prototype.hasOwnProperty.call(value, 'product_position')) {
      return value.product_position;
    }
    if (Object.prototype.hasOwnProperty.call(value, 'productPosition')) {
      return value.productPosition;
    }

    if (depth >= maxDepth) continue;

    for (const key of Object.keys(value)) {
      const child = value[key];
      if (child && typeof child === 'object') {
        queue.push({ value: child, depth: depth + 1 });
      }
    }
  }

  return null;
}

function extractProductPosition(product) {
  return getFirstDefined(
    product?.product_position,
    product?.productPosition,
    product?.product?.product_position,
    product?.product?.productPosition,
    product?.data?.product_position,
    product?.data?.productPosition,
    product?.data?.product?.product_position,
    product?.data?.product?.productPosition,
    product?.data?.common_attributes?.product_position,
    product?.data?.common_attributes?.productPosition,
    product?.data?.item?.product_position,
    product?.data?.item?.productPosition,
    product?.attributes?.product_position,
    product?.item?.product_position,
    product?.meta?.product_position,
    product?.meta?.productPosition,
    product?.common_attributes?.product_position,
    product?.common_attributes?.productPosition,
    product?.tracking?.product_position,
    product?.tracking?.productPosition,
    product?.click_map?.product_position,
    product?.click_map?.productPosition,
    product?.impression_map?.product_position,
    product?.impression_map?.productPosition,
    product?.entry_source_map?.entry_source_position,
    product?.entry_source_map?.entrySourcePosition,
    product?.identity?.product_position,
    product?.identity?.productPosition,
    findNestedProductPosition(product)
  );
}

function determineRank(product) {
  const rawRank = extractProductPosition(product);
  return sanitizeRankValue(rawRank);
}

function normalizeId(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return normalizeId(getFirstDefined(value.id, value.value));
}

function findProductPositionInApiData(apiData, productId, productName) {
  const targetId = normalizeId(productId);
  const targetName = typeof productName === 'string' ? productName.trim().toLowerCase() : null;
  if (!apiData) return null;

  const visited = new WeakSet();
  const queue = [apiData];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;
    if (visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    const candidateId = normalizeId(getFirstDefined(
      current.product_id,
      current.id,
      current.common_attributes?.product_id,
      current.data?.product_id,
      current.entry_source_id,
      current.entry_source_map?.entry_source_id
    ));

    const candidateName = getFirstDefined(
      current.product_name,
      current.name,
      current.title,
      current.common_attributes?.product_name,
      current.common_attributes?.name,
      current.common_attributes?.title,
      current.data?.product_name,
      current.data?.name,
      current.data?.title
    );

    const productPosition = getFirstDefined(
      current.product_position,
      current.productPosition,
      current.common_attributes?.product_position,
      current.common_attributes?.productPosition,
      current.data?.product_position,
      current.data?.productPosition
    );

    if (productPosition !== undefined && productPosition !== null) {
      if (targetId && candidateId === targetId) {
        return sanitizeRankValue(productPosition);
      }
      if (!targetId && targetName && typeof candidateName === 'string' && candidateName.trim().toLowerCase() === targetName) {
        return sanitizeRankValue(productPosition);
      }
    }

    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return null;
}

function extractDeliveryText(product, fallback = '') {
  const text = getFirstDefined(
    product?.delivery_time,
    product?.delivery?.time,
    product?.delivery?.timeline,
    product?.delivery?.text,
    product?.delivery?.promise,
    product?.promise?.primary_text,
    product?.promise?.text,
    product?.promise?.delivery_text,
    product?.sla?.delivery_time,
    product?.sla?.delivery_text,
    product?.sla?.details?.primary_text,
    product?.sla?.text,
    product?.shipping_info?.delivery_text,
    product?.shipment?.promise,
    product?.eta_text,
    fallback
  );
  return typeof text === 'string' ? text : '';
}

function extractWeight(product) {
  const value = getFirstDefined(
    product?.weight,
    product?.pack_size,
    product?.packsize,
    product?.packSize,
    product?.display_weight,
    product?.displayWeight,
    product?.net_weight,
    product?.netWeight,
    product?.meta?.display_weight,
    product?.meta?.pack_size,
    product?.meta?.weight,
    product?.quantity,
    product?.size,
    product?.variant,
    product?.volume
  );
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return getFirstDefined(value.text, value.label, value.value, value.display) || '';
  }
  return '';
}

function resolveImageCandidate(candidate) {
  if (!candidate) return '';
  if (typeof candidate === 'string') return candidate;
  if (typeof candidate === 'object') {
    return getFirstDefined(candidate.url, candidate.image_url, candidate.src, candidate.image);
  }
  return '';
}

function extractImageUrl(product) {
  const direct = resolveImageCandidate(getFirstDefined(
    product?.image_url,
    product?.image,
    product?.product_image,
    product?.listing_image,
    product?.thumbnail,
    product?.default_image
  ));
  if (direct) return direct;

  const arrays = [
    product?.image_urls,
    product?.imageUrls,
    product?.images,
    product?.media,
  ];

  for (const collection of arrays) {
    if (!collection) continue;
    if (Array.isArray(collection)) {
      for (const item of collection) {
        const resolved = resolveImageCandidate(item?.url ? item.url : item);
        if (resolved) return resolved;
      }
    } else {
      const resolved = resolveImageCandidate(collection);
      if (resolved) return resolved;
    }
  }
  return '';
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeSingleProduct(node) {
  if (!isPlainObject(node)) {
    return false;
  }
  const productId = getFirstDefined(
    node.product_id,
    node.productId,
    node.id,
    node.common_attributes?.product_id,
    node.common_attributes?.id,
    node.data?.product_id,
    node.data?.id
  );
  const productName = getFirstDefined(
    node.product_name,
    node.name,
    node.title,
    node.display_name,
    node.common_attributes?.product_name,
    node.common_attributes?.name,
    node.common_attributes?.title,
    node.data?.product_name,
    node.data?.name,
    node.data?.title
  );
  return Boolean(productId && productName);
}

function detectAd(product, context = {}) {
  const adFlags = [
    product?.is_ad,
    product?.isAd,
    product?.is_advertisement,
    product?.isAdvertisement,
    product?.isSponsored,
    product?.is_sponsored,
    product?.sponsored,
    product?.isSponsoredAd,
    product?.ad_badge,
  ];
  if (adFlags.some(Boolean)) {
    return true;
  }
  const possibleTags = [
    ...(Array.isArray(product?.badges) ? product.badges : []),
    ...(Array.isArray(product?.tags) ? product.tags : []),
    ...(Array.isArray(product?.labels) ? product.labels : []),
    ...(Array.isArray(product?.ribbons) ? product.ribbons : []),
  ];
  if (possibleTags.some(tag => {
    if (!tag) return false;
    const text = typeof tag === 'string' ? tag : (tag.text || tag.label || tag.title);
    return typeof text === 'string' && /ad/i.test(text);
  })) {
    return true;
  }
  if (context?.isAd) return true;
  return false;
}

function isLikelyProduct(node) {
  if (!node || typeof node !== 'object') return false;
  const nameCandidate = getFirstDefined(
    node.product_name,
    node.name,
    node.title,
    node.display_name,
    node.item_name
  );
  if (!nameCandidate || typeof nameCandidate !== 'string' || !nameCandidate.trim()) {
    return false;
  }
  const idCandidate = getFirstDefined(
    node.product_id,
    node.id,
    node.sku_id,
    node.listing_id,
    node.productId,
    node.item_id
  );
  const priceCandidate = normalizePriceValue(getFirstDefined(
    node.final_price,
    node.price,
    node.price?.final_price,
    node.price?.value,
    node.price?.amount,
    node.mrp,
    node.price_info?.selling_price
  ));
  return Boolean(idCandidate || priceCandidate);
}

function mergeProductCandidate(snippet, productNode) {
  if (!isPlainObject(productNode)) return null;
  const snippetData = isPlainObject(snippet?.data) ? snippet.data : {};
  const snippetCommon = isPlainObject(snippetData.common_attributes) ? snippetData.common_attributes : {};
  const nodeData = isPlainObject(productNode.data) ? productNode.data : {};
  const nodeCommon = isPlainObject(productNode.common_attributes) ? productNode.common_attributes : {};

  const combinedCommon = { ...snippetCommon, ...nodeCommon };
  const candidate = {
    ...snippetCommon,
    ...productNode,
    ...nodeData,
    common_attributes: combinedCommon
  };

  candidate.product_id = getFirstDefined(
    productNode.product_id,
    nodeData.product_id,
    combinedCommon.product_id,
    combinedCommon.id,
    snippet?.tracking?.entry_source_map?.entry_source_id,
    snippet?.tracking?.entry_source_map?.entry_source_title
  );

  candidate.product_name = getFirstDefined(
    productNode.product_name,
    productNode.name,
    productNode.title,
    nodeData.product_name,
    nodeData.name,
    nodeData.title,
    combinedCommon.product_name,
    combinedCommon.name,
    combinedCommon.title,
    combinedCommon.display_name,
    snippetData.name,
    snippetData.title
  );

  candidate.product_position = getFirstDefined(
    productNode.product_position,
    productNode.productPosition,
    nodeData.product_position,
    nodeData.productPosition,
    combinedCommon.product_position,
    combinedCommon.productPosition
  );

  candidate.price = getFirstDefined(
    productNode.price,
    nodeData.price,
    combinedCommon.price,
    combinedCommon.normal_price,
    combinedCommon.normal_price?.text,
    snippetData.price
  );

  candidate.final_price = getFirstDefined(
    productNode.final_price,
    nodeData.final_price,
    combinedCommon.final_price,
    combinedCommon.normal_price,
    combinedCommon.normal_price?.text,
    candidate.price
  );

  candidate.mrp = getFirstDefined(
    productNode.mrp,
    nodeData.mrp,
    combinedCommon.mrp,
    combinedCommon.mrp?.text,
    snippetData.mrp
  );

  candidate.discount = getFirstDefined(
    productNode.discount,
    nodeData.discount,
    combinedCommon.discount,
    combinedCommon.discount?.text,
    combinedCommon.offer_tag?.title?.text,
    snippetData.discount
  );

  candidate.weight = getFirstDefined(
    productNode.weight,
    nodeData.weight,
    combinedCommon.weight,
    combinedCommon.variant,
    productNode.variant,
    nodeData.variant
  );

  candidate.image_url = getFirstDefined(
    productNode.image_url,
    nodeData.image_url,
    combinedCommon.image_url,
    snippetData.image_url,
    productNode.image?.url,
    nodeData.image?.url,
    combinedCommon.image?.url,
    snippetData.image?.url
  );

  if (!candidate.product_id || !candidate.product_name) {
    return null;
  }

  return candidate;
}

function collectProductsFromSnippets(apiData, pushRecordFn) {
  const snippets = apiData?.response?.snippets;
  if (!Array.isArray(snippets)) return;

  for (const snippet of snippets) {
    const context = {
      widgetType: snippet?.widget_type || snippet?.type || snippet?.data?.widget_type || ''
    };
    const snippetData = snippet?.data;
    const candidates = [];

    if (Array.isArray(snippetData?.products)) {
      candidates.push(...snippetData.products.map(node => mergeProductCandidate(snippet, node)));
    }

    if (Array.isArray(snippetData?.items)) {
      snippetData.items.forEach(item => {
        const candidate = mergeProductCandidate(snippet, item);
        if (candidate) candidates.push(candidate);
        if (isPlainObject(item?.data)) {
          const nestedCandidate = mergeProductCandidate(snippet, item.data);
          if (nestedCandidate) candidates.push(nestedCandidate);
        }
      });
    }

    if (isPlainObject(snippetData?.product)) {
      const candidate = mergeProductCandidate(snippet, snippetData.product);
      if (candidate) candidates.push(candidate);
    }

    if (looksLikeSingleProduct(snippetData)) {
      const candidate = mergeProductCandidate(snippet, snippetData);
      if (candidate) candidates.push(candidate);
    }

    if (looksLikeSingleProduct(snippet)) {
      const candidate = mergeProductCandidate(snippet, snippet);
      if (candidate) candidates.push(candidate);
    }

    candidates
      .filter(Boolean)
      .forEach(candidate => {
        const rank = determineRank(candidate);
        pushRecordFn(candidate, rank, context);
      });
  }
}

function extractProductRecordsFromApiData(apiData, externalDedupeSet) {
  const dedupeSet = externalDedupeSet || new Set();
  const localSeen = new Set();
  const results = [];
  const visitedObjects = new WeakSet();

  // Helper function to extract brand from product data
  function extractBrand(product) {
    if (!product || typeof product !== 'object') return '';

    // Try multiple possible locations for brand in order of preference
    const brandPaths = [
      product.brand,
      product.atc_action?.add_to_cart?.cart_item?.brand,
      product.rfc_action?.remove_from_cart?.cart_item?.brand,
      product.cart_item?.brand,
      product.meta?.brand,
      product.display_name ? (product.display_name.match(/^([A-Z][a-zA-Z\s&'-]+?)\s/)?.[1] || "") : "",
    ];

    for (const brand of brandPaths) {
      if (brand && typeof brand === 'string' && brand.trim().length > 0) {
        return brand.trim();
      }
    }

    // If no brand found in nested structures, try to extract from product_name
    // Common pattern: "Brand Name Product Name" or "Brand Name - Product Name"
    const productName = product.product_name || product.name || product.title || product.display_name || '';
    if (productName && typeof productName === 'string') {
      const name = productName.trim();

      // Pattern 2: "Brand Name - Product Name" (split by dash) - check this first
      const dashIndex = name.indexOf(' - ');
      if (dashIndex > 0) {
        const beforeDash = name.substring(0, dashIndex).trim();
        if (beforeDash.length > 0 && beforeDash.length < 50) {
          return beforeDash;
        }
      }

      // Pattern 1: "Brand Name Product Name" (first 1-3 words if capitalized)
      const words = name.split(/\s+/);
      if (words.length > 1) {
        // Check if first word looks like a brand (capitalized)
        const firstWord = words[0];
        if (firstWord.length > 1 && /^[A-Z]/.test(firstWord)) {
          const commonProductWords = ['pack', 'box', 'piece', 'kg', 'g', 'ml', 'l'];
          const commonBrandIndicators = ['real', 'amul', 'britannia', 'nestle', 'cadbury', 'pepsi', 'coca', 'lays', 'kurkure'];

          // Check if first word alone is a common brand (single-word brand)
          const firstWordLower = firstWord.toLowerCase();
          if (commonBrandIndicators.includes(firstWordLower)) {
            return firstWord; // Return single-word brand immediately
          }

          // Try 1-3 words as brand name
          // For single-word brands, prefer the first word if it's capitalized and not a product word
          let bestBrand = "";
          let singleWordBrand = "";

          for (let i = 1; i <= Math.min(3, words.length - 1); i++) {
            const potentialBrand = words.slice(0, i).join(' ');
            const lastWord = words[i - 1].toLowerCase();

            // Store single-word brand if valid
            if (i === 1 && !commonProductWords.includes(lastWord) && firstWord.length > 1) {
              singleWordBrand = firstWord;
            }

            // Valid brand if: reasonable length, capitalized, not ending with common product words
            if (potentialBrand.length < 40 &&
              !commonProductWords.includes(lastWord) &&
              potentialBrand.length > 2) {
              bestBrand = potentialBrand; // Keep longest valid brand
            } else {
              // If we hit an invalid word, break and use what we have
              break;
            }
          }

          // Prefer single-word brand if it exists and the multi-word brand is just adding generic words
          // (e.g., "Real" over "Real Fruit Power" when "Fruit Power" is generic)
          if (singleWordBrand && bestBrand) {
            const additionalWords = bestBrand.substring(singleWordBrand.length + 1).toLowerCase();
            const genericWords = ['fruit', 'power', 'activ', 'juice', 'drink', 'food', 'snack'];
            const isGeneric = additionalWords.split(' ').every(word => genericWords.includes(word));

            // If additional words are generic, prefer single-word brand
            if (isGeneric) {
              return singleWordBrand;
            }
          }

          // Return best brand found (or single-word if no multi-word found)
          return bestBrand || singleWordBrand || "";
        }
      }
    }

    return '';
  }

  collectProductsFromSnippets(apiData, (product, rank, context) => {
    pushRecord(product, rank, context);
  });

  function pushRecord(product, rank, context = {}) {
    if (!product || typeof product !== 'object') return;
    const nameCandidate = getFirstDefined(
      product.product_name,
      product.name,
      product.title,
      product.display_name,
      product.item_name
    );
    if (!nameCandidate || typeof nameCandidate !== 'string') return;
    const productName = nameCandidate.trim();
    if (!productName) return;

    const productId = getFirstDefined(
      product.product_id,
      product.id,
      product.sku_id,
      product.listing_id,
      product.productId,
      product.item_id
    );
    const skuId = getFirstDefined(
      product.sku_id,
      product.default_sku_id,
      product.variant_id,
      product.variantId
    );

    const weightValue = extractWeight(product);
    const baseKey = (productId && String(productId)) ||
      (skuId && `sku:${skuId}`) ||
      `${productName.toLowerCase()}|${(weightValue || '').toLowerCase()}`;
    if (!baseKey) return;

    if (localSeen.has(baseKey) || dedupeSet.has(baseKey)) {
      return;
    }

    const normalizedRank = typeof rank === 'number' && rank > 0 ? rank : null;

    // Extract brand from product data
    const extractedBrand = extractBrand(product);

    const record = {
      product_id: productId || '',
      sku_id: skuId || '',
      product_name: productName,
      brand: extractedBrand || '',
      rank: normalizedRank,
      product_position: normalizedRank,
      weight: weightValue,
      current_price: formatCurrency(getFirstDefined(
        product.final_price,
        product.price?.final_price,
        product.price?.value,
        product.price?.amount,
        product.price,
        product.selling_price,
        product.price_info?.selling_price
      )),
      original_price: formatCurrency(getFirstDefined(
        product.mrp,
        product.price?.mrp,
        product.price_info?.mrp,
        product.original_price,
        product.price_before_discount
      )),
      discount: formatDiscount(getFirstDefined(
        product.discount,
        product.discount_percentage,
        product.discount_percent,
        product.price?.discount_percentage,
        product.price_info?.discount_percentage
      )),
      delivery_time: extractDeliveryText(product, context.deliveryText),
      image_url: extractImageUrl(product),
      is_ad: detectAd(product, context),
      source_widget: context.widgetType || '',
    };

    if (!record.discount && record.current_price && record.original_price) {
      const current = normalizePriceValue(record.current_price);
      const original = normalizePriceValue(record.original_price);
      if (current !== null && original !== null && original > 0 && original > current) {
        const percent = Math.round(((original - current) / original) * 100);
        if (Number.isFinite(percent) && percent > 0) {
          record.discount = `${percent}%`;
        }
      }
    }

    localSeen.add(baseKey);
    dedupeSet.add(baseKey);
    results.push(record);
  }

  const processSnippetProduct = (snippet, productNode) => {
    if (!isPlainObject(productNode)) return;
    const snippetData = isPlainObject(snippet?.data) ? snippet.data : {};
    const snippetCommon = isPlainObject(snippetData.common_attributes) ? snippetData.common_attributes : {};
    const nodeData = isPlainObject(productNode.data) ? productNode.data : {};
    const nodeCommon = isPlainObject(productNode.common_attributes) ? productNode.common_attributes : {};

    const mergedCommon = { ...snippetCommon, ...nodeCommon };
    const flattenedProduct = {
      ...snippetCommon,
      ...nodeCommon,
      ...productNode,
      ...nodeData,
      common_attributes: mergedCommon
    };

    if (!flattenedProduct.product_id) {
      flattenedProduct.product_id = getFirstDefined(
        productNode.product_id,
        nodeData.product_id,
        mergedCommon.product_id,
        mergedCommon.id,
        snippet?.tracking?.entry_source_map?.entry_source_id
      );
    }

    if (!flattenedProduct.product_name) {
      flattenedProduct.product_name = getFirstDefined(
        productNode.product_name,
        productNode.name,
        nodeData.product_name,
        nodeData.name,
        mergedCommon.name?.text,
        mergedCommon.name?.label,
        mergedCommon.name
      );
    }

    if (!flattenedProduct.variant) {
      flattenedProduct.variant = getFirstDefined(
        productNode.variant,
        nodeData.variant,
        mergedCommon.variant,
        snippetData.variant
      );
    }

    flattenedProduct.product_position = getFirstDefined(
      productNode.product_position,
      productNode.productPosition,
      nodeData.product_position,
      nodeData.productPosition,
      mergedCommon.product_position,
      mergedCommon.productPosition,
      snippet?.tracking?.entry_source_map?.entry_source_position,
      snippet?.tracking?.entry_source_map?.entrySourcePosition
    );

    const context = {
      widgetType: snippet?.widget_type || snippet?.type || snippetData?.widget_type || ''
    };

    const rank = determineRank(flattenedProduct);
    pushRecord(flattenedProduct, rank, context);
  };

  const responseSnippets = apiData?.response?.snippets;
  if (Array.isArray(responseSnippets)) {
    for (const snippet of responseSnippets) {
      const snippetData = snippet?.data;

      if (Array.isArray(snippetData?.products)) {
        snippetData.products.forEach(productNode => processSnippetProduct(snippet, productNode));
      }

      if (Array.isArray(snippetData?.items)) {
        snippetData.items.forEach(productNode => {
          if (looksLikeSingleProduct(productNode) || looksLikeSingleProduct(productNode?.data || {})) {
            processSnippetProduct(snippet, productNode);
          }
        });
      }

      if (isPlainObject(snippetData?.product)) {
        processSnippetProduct(snippet, snippetData.product);
      }

      if (looksLikeSingleProduct(snippetData)) {
        processSnippetProduct(snippet, snippetData);
      }
    }
  }

  const processArray = (arrayNode, context = {}) => {
    if (!Array.isArray(arrayNode)) return;
    arrayNode.forEach((item, index) => {
      if (!item || typeof item !== 'object') return;
      const nextContext = { ...context };
      nextContext.rankBase = (context.rankBase || 0) + index;
      if (typeof item?.widget_type === 'string') {
        nextContext.widgetType = item.widget_type;
      } else if (typeof item?.type === 'string') {
        nextContext.widgetType = item.type;
      }
      if (isLikelyProduct(item)) {
        const rank = determineRank(item);
        pushRecord(item, rank, nextContext);
      }
      processNode(item, nextContext);
      if (item && typeof item === 'object' && Array.isArray(item.products)) {
        processArray(item.products, nextContext);
      }
      if (item && typeof item === 'object' && Array.isArray(item.data?.products)) {
        processArray(item.data.products, nextContext);
      }
      if (item && typeof item === 'object' && item.data?.product && typeof item.data.product === 'object') {
        processNode(item.data.product, nextContext);
      }
    });
  };

  const processNode = (node, context = {}) => {
    if (!node || typeof node !== 'object') return;
    if (visitedObjects.has(node)) return;
    visitedObjects.add(node);

    if (Array.isArray(node)) {
      processArray(node, context);
      return;
    }

    const nodeWidgetType = typeof node.widget_type === 'string'
      ? node.widget_type
      : (typeof node.type === 'string' ? node.type : context.widgetType || '');
    const baseContext = { ...context, widgetType: nodeWidgetType };

    if (node.products && Array.isArray(node.products)) {
      const nextContext = { ...baseContext };
      if (typeof node.start_rank === 'number') {
        nextContext.rankBase = node.start_rank - 1;
      } else if (typeof node.startIndex === 'number') {
        nextContext.rankBase = node.startIndex;
      }
      if (typeof nodeWidgetType === 'string' && (/ad/.test(nodeWidgetType.toLowerCase()) || /sponsor/.test(nodeWidgetType.toLowerCase()))) {
        nextContext.isAd = true;
      }
      processArray(node.products, nextContext);
    }

    if (node.data) {
      const dataNode = node.data;
      if (Array.isArray(dataNode.products)) {
        const nextContext = { ...baseContext };
        if (typeof dataNode.start_rank === 'number') {
          nextContext.rankBase = dataNode.start_rank - 1;
        } else if (typeof dataNode.startIndex === 'number') {
          nextContext.rankBase = dataNode.startIndex;
        }
        processArray(dataNode.products, nextContext);
      }
      if (Array.isArray(dataNode.items)) {
        processArray(dataNode.items, baseContext);
      }
      if (dataNode.product && typeof dataNode.product === 'object') {
        processNode(dataNode.product, baseContext);
      }
      if (Array.isArray(dataNode.widgets)) {
        processArray(dataNode.widgets, baseContext);
      }
    }

    const arrayKeys = ['items', 'data', 'cards', 'list', 'results', 'widgets'];
    for (const key of arrayKeys) {
      if (Array.isArray(node[key])) {
        const keyLower = key.toLowerCase();
        const nextContext = { ...baseContext };
        if (keyLower.includes('ad') || keyLower.includes('sponsor')) {
          nextContext.isAd = true;
        }
        processArray(node[key], nextContext);
      }
    }

    if (isLikelyProduct(node)) {
      const rank = determineRank(node);
      pushRecord(node, rank, baseContext);
    }

    for (const [key, value] of Object.entries(node)) {
      if (!value || typeof value !== 'object') continue;
      const childContext = { ...baseContext };
      if (/ad/.test(key.toLowerCase()) || /sponsor/.test(key.toLowerCase())) {
        childContext.isAd = true;
      }
      if (key === 'common_attributes' || key === 'tracking' || key === 'impression_map' || key === 'click_map') {
        continue;
      }
      if (Array.isArray(value) && key !== 'products' && key !== 'items' && key !== 'widgets') {
        processArray(value, childContext);
      } else {
        processNode(value, childContext);
      }
    }
  };

  processNode(apiData);
  return results;
}

async function filterAndStoreProductRanks(apiData, searchQuery, location = '', dedupeSet, customCollection = null) {
  if (!apiData) {
    return { records: [], saved: 0 };
  }
  const records = extractProductRecordsFromApiData(apiData, dedupeSet);
  if (!records.length) {
    console.log("⚠️ No product records extracted from search API response");
    return { records: [], saved: 0 };
  }

  let saved = 0;
  for (const record of records) {
    record.searched_for = searchQuery;
    record.location = location || '';
    record.success = true;
    if ((record.rank === null || record.rank === undefined) || (record.product_position === null || record.product_position === undefined)) {
      const lookedUp = findProductPositionInApiData(apiData, record.product_id, record.product_name);
      if (lookedUp !== null) {
        record.rank = lookedUp;
        record.product_position = lookedUp;
      }
    }
    record.product_position = record.rank;
    const saveResult = await saveProductRank({
      ...record,
      searched_for: searchQuery,
      location: location || '',
      success: true
    }, customCollection);
    if (saveResult) {
      saved++;
    }
  }

  const collectionName = customCollection ? customCollection.collectionName : COLLECTION_NAME;
  console.log(`✅ Filtered ${records.length} products from API response, saved ${saved} record(s) to ${collectionName}`);
  return { records, saved };
}

// Fetch search API data by intercepting network requests
async function fetchSearchAPI(page, productName, location = '', interceptedData = null, interceptedUrl = null) {
  try {
    console.log("\n🔗 Processing search API data...");
    const dedupeSet = new Set();

    // If we already intercepted the API data, use it
    if (interceptedData) {
      console.log(`✅ Using intercepted API data`);
      await saveSearchAPIRankingData(interceptedData, productName, location);
      await filterAndStoreProductRanks(interceptedData, productName, location, dedupeSet);
      return interceptedData;
    }

    // If we have the URL but not the data, try to fetch it
    if (interceptedUrl) {
      console.log(`📡 Using intercepted API URL: ${interceptedUrl}`);

      try {
        // Use page.evaluate to make request in browser context (has all cookies)
        const data = await page.evaluate(async (url) => {
          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              mode: 'cors'
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
          } catch (error) {
            throw new Error(`Fetch failed: ${error.message}`);
          }
        }, interceptedUrl);

        if (data) {
          console.log(`✅ API fetch successful using intercepted URL`);
          await saveSearchAPIRankingData(data, productName, location);
          await filterAndStoreProductRanks(data, productName, location, dedupeSet);
          return data;
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch using intercepted URL: ${error.message}`);
      }
    }

    // Wait a bit more and try to intercept if not already captured
    console.log("📡 Waiting for API call to be intercepted...");
    await page.waitForTimeout(3000);

    // If still no data, try constructing URL and fetching
    console.log("📡 Trying to construct and fetch API URL...");
    const searchQuery = encodeURIComponent(productName);
    const apiUrl = `https://blinkit.com/v1/layout/search?offset=0&limit=100&q=${searchQuery}&search_method=basic&search_type=type_to_search`;

    try {
      // Use page.evaluate to make request in browser context (has all cookies)
      const data = await page.evaluate(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            mode: 'cors'
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        } catch (error) {
          throw new Error(`Fetch failed: ${error.message}`);
        }
      }, apiUrl);

      if (data) {
        console.log(`✅ API fetch successful`);
        await saveSearchAPIRankingData(data, productName, location);
        await filterAndStoreProductRanks(data, productName, location, dedupeSet);
        return data;
      }
    } catch (error) {
      console.error(`⚠️ Failed to fetch API: ${error.message}`);
    }

    return null;
  } catch (error) {
    console.error(`⚠️ Error fetching search API: ${error.message}`);
    return null;
  }
}

// Initialize browser
async function initBrowser() {
  if (activePage) {
    return activePage;
  }

  try {
    console.log("🌐 Launching browser in INCOGNITO mode...");

    // Launch browser in incognito mode (no persistent context)
    const browser = await chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ]
    });

    // Create new incognito context
    activeContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'en-US',
    });

    // Create new page
    activePage = await activeContext.newPage();

    // Hide webdriver property
    await activePage.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    `);

    console.log("✅ Browser initialized (INCOGNITO mode - no cookies/cache)");
    return activePage;
  } catch (error) {
    console.error("❌ Error initializing browser:", error.message);
    throw error;
  }
}

// Scroll until "Showing related products" is visible
async function scrollToRelatedProducts(page) {
  try {
    console.log("\n📜 Scrolling to 'Showing related products' section...");
    const relatedHeader = page
      .locator("div.tw-text-400.tw-font-bold.tw-line-clamp-2")
      .filter({ hasText: /Showing related products/i })
      .first();

    // Try multiple selectors for "Showing related products"
    const alternativeSelectors = [
      page.locator("div").filter({ hasText: /Showing related products/i }).first(),
      page.locator("*").filter({ hasText: /Showing related products/i }).first(),
    ];

    // Check if already visible
    const checkIfVisible = async () => {
      if (await relatedHeader.isVisible({ timeout: 500 }).catch(() => false)) {
        return true;
      }
      // Try alternative selectors
      for (const selector of alternativeSelectors) {
        if (await selector.isVisible({ timeout: 300 }).catch(() => false)) {
          return true;
        }
      }
      return false;
    };

    if (await checkIfVisible()) {
      await relatedHeader.scrollIntoViewIfNeeded().catch(() => { });
      console.log("✅ 'Showing related products' is already visible");
      return true;
    }

    // Keep scrolling until we find the section
    let scrollAttempts = 0;
    const maxAttempts = 200; // Increased max attempts
    let consecutiveNoScroll = 0;

    while (scrollAttempts < maxAttempts) {
      // Get page dimensions to check if we're really at bottom
      const pageInfo = await page.evaluate(() => {
        return {
          scrollY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
          isAtBottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50
        };
      });

      // Scroll down - use larger scroll amount
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(500); // Wait longer for lazy loading
      scrollAttempts++;

      // Check if we've really reached the bottom
      const newPageInfo = await page.evaluate(() => {
        return {
          scrollY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          isAtBottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50
        };
      });

      // If scroll position didn't change and we're at bottom, we've reached the end
      if (pageInfo.scrollY === newPageInfo.scrollY && newPageInfo.isAtBottom) {
        consecutiveNoScroll++;
        if (consecutiveNoScroll >= 3) {
          // Try scrolling to absolute bottom one more time
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForTimeout(1000);

          // Final check before giving up
          if (await checkIfVisible()) {
            await relatedHeader.scrollIntoViewIfNeeded().catch(() => { });
            console.log(`✅ Found 'Showing related products' at bottom after ${scrollAttempts} scroll attempts`);
            return true;
          }

          console.log("⚠️ Reached absolute bottom of page, 'Showing related products' not found");
          break;
        }
      } else {
        consecutiveNoScroll = 0;
      }

      // Check if the section is now visible
      if (await checkIfVisible()) {
        await relatedHeader.scrollIntoViewIfNeeded().catch(() => { });
        console.log(`✅ Reached 'Showing related products' after ${scrollAttempts} scroll attempts`);
        return true;
      }

      // Log progress every 10 scrolls
      if (scrollAttempts % 10 === 0) {
        console.log(`📜 Scrolled ${scrollAttempts} times (at ${Math.round(newPageInfo.scrollY / 1000)}k pixels), still searching...`);
      }
    }

    // Final attempt - scroll to absolute bottom and check one more time
    console.log("📜 Making final scroll to absolute bottom...");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(2000);

    if (await checkIfVisible()) {
      await relatedHeader.scrollIntoViewIfNeeded().catch(() => { });
      console.log(`✅ Found 'Showing related products' at bottom!`);
      return true;
    }

    console.log(`⚠️ Could not find 'Showing related products' after ${scrollAttempts} scroll attempts`);
    return false;
  } catch (e) {
    console.log(`⚠️ Error while scrolling to related products: ${e.message}`);
    return false;
  }
}

// Set delivery location
async function setDeliveryLocation(page, location) {
  try {
    console.log(`\n📍 Starting location setup: "${location}"`);

    // Clean location string
    const searchLocation = location.replace(/:\s*/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`📍 Cleaned location: "${searchLocation}"`);

    // Wait for page to be ready
    await page.waitForTimeout(2000);

    // STEP 1: Click location button to open modal
    console.log(`🔍 STEP 1: Looking for location button to click...`);
    let modalOpened = false;

    // Method 1: Try change location button (most common)
    try {
      const changeBtn = page.locator("button[data-testid='change-location']").first();
      if (await changeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`✅ Found change-location button, clicking...`);
        await changeBtn.click({ force: true });
        await page.waitForTimeout(2000);
        modalOpened = true;
        console.log(`✅ Clicked change-location button`);
      } else {
        console.log(`⚠️ Change-location button not visible`);
      }
    } catch (e) {
      console.log(`⚠️ Change button error: ${e.message}`);
    }

    // Method 2: Try clicking header location area
    if (!modalOpened) {
      try {
        console.log(`🔍 Trying header location area...`);
        const headerLoc = page.locator("header").locator("button, div").filter({ hasText: /deliver|location|change/i }).first();
        if (await headerLoc.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`✅ Found header location element, clicking...`);
          await headerLoc.click({ force: true });
          await page.waitForTimeout(2000);
          modalOpened = true;
          console.log(`✅ Clicked header location`);
        }
      } catch (e) {
        console.log(`⚠️ Header location not found`);
      }
    }

    // Method 3: Try clicking any location-related element
    if (!modalOpened) {
      try {
        console.log(`🔍 Trying general location selectors...`);
        const locButton = page.locator("button:has-text('Deliver to'), button:has-text('Change'), [aria-label*='location' i]").first();
        if (await locButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`✅ Found location button, clicking...`);
          await locButton.click({ force: true });
          await page.waitForTimeout(2000);
          modalOpened = true;
          console.log(`✅ Clicked location button`);
        }
      } catch (e) {
        console.log(`⚠️ Could not find location button`);
      }
    }

    if (!modalOpened) {
      console.log(`⚠️ Could not open location modal, but will try to find input anyway...`);
    }

    // Clear localStorage
    try {
      await page.evaluate("window.localStorage.clear();");
      await page.waitForTimeout(500);
    } catch { }

    // STEP 2: Wait for location modal container to appear
    console.log(`\n🔍 STEP 2: Waiting for location modal container to appear...`);
    try {
      await page.locator("div.LocationSelectorDesktopV1__LocationBodyContainer-sc-19zschz-3, div.LocationSelectorDesktopV1__LoginContainer-sc-19zschz-1").first().waitFor({ state: "visible", timeout: 10000 });
      console.log(`✅ Location modal container found`);
    } catch (e) {
      console.log(`⚠️ Modal container not found, but continuing...`);
    }
    await page.waitForTimeout(1500);

    // STEP 3: Find location input field
    console.log(`\n🔍 STEP 3: Looking for location input field...`);
    let locationInput = null;

    const inputSelectors = [
      "input[name='select-locality']",  // Most specific - matches the HTML you provided
      "input.LocationSearchBox__InputSelect-sc-1k8u6a6-0",  // Class selector
      "div.modal-right__input-wrapper input",  // Wrapper + input
      "input[placeholder*='search delivery location' i]",  // Placeholder match
      "input[placeholder*='delivery location' i]",
      "input[type='text']"
    ];

    for (const selector of inputSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log(`✅ Found input with selector: ${selector}`);
          locationInput = input;
          break;
        }
      } catch (e) {
        console.log(`⚠️ Input not found with selector: ${selector}`);
      }
    }

    if (!locationInput) {
      console.log(`❌ Could not find location input field`);
      // Try to take a screenshot for debugging
      try {
        await page.screenshot({ path: 'location-debug.png' });
        console.log(`📸 Screenshot saved to location-debug.png for debugging`);
      } catch { }
      return false;
    }

    // Wait for input to be ready and visible
    await locationInput.waitFor({ state: "visible", timeout: 10000 });
    console.log(`✅ Input field is visible and ready`);

    // STEP 4: Click the input field to focus
    console.log(`\n🖱️ STEP 4: Clicking input field to focus...`);
    await locationInput.click({ force: true });
    await page.waitForTimeout(1000);
    console.log(`✅ Input field clicked and focused`);

    // STEP 5: Clear the input
    console.log(`\n⌨️ STEP 5: Clearing input field...`);
    await locationInput.fill("");
    await page.waitForTimeout(500);
    console.log(`✅ Input cleared`);

    // STEP 6: Type the location character by character
    console.log(`\n⌨️ STEP 6: Typing location: "${searchLocation}"`);
    await locationInput.type(searchLocation, { delay: 150 });
    console.log(`✅ Finished typing location`);
    await page.waitForTimeout(2000);

    // STEP 7: Wait for suggestions to appear and click the first one
    console.log(`\n⏳ STEP 7: Waiting for location suggestions to appear...`);
    try {
      // Wait for the first location suggestion to appear
      const firstSuggestion = page.locator("div.LocationSearchList__LocationLabel-sc-93rfr7-2").first();
      await firstSuggestion.waitFor({ state: "visible", timeout: 8000 });
      console.log(`✅ Suggestions appeared`);

      // Get the text of the first suggestion for logging
      const suggestionText = await firstSuggestion.innerText().catch(() => '');
      console.log(`📍 First suggestion found: "${suggestionText}"`);

      // Click the first suggestion
      console.log(`🖱️ Clicking first location suggestion...`);
      await firstSuggestion.click({ force: true });
      // Wait for selection to apply and page to reflect location
      await Promise.race([
        page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { }),
        page.waitForTimeout(4000)
      ]);
      // Also wait for the modal/input to disappear if possible
      try {
        await page.locator("input[name='select-locality']").first().waitFor({ state: 'hidden', timeout: 5000 });
      } catch { }
      console.log(`✅ Clicked first location suggestion`);

    } catch (e) {
      console.log(`⚠️ Suggestions did not appear or could not be clicked: ${e.message}`);
      // Fallback: Try pressing Enter if clicking didn't work
      console.log(`⚠️ Trying fallback: Pressing Enter...`);
      try {
        await locationInput.press("Enter");
        await page.waitForTimeout(3000);
        console.log(`✅ Pressed Enter as fallback`);
      } catch (enterError) {
        console.log(`❌ Enter fallback also failed: ${enterError.message}`);
      }
    }

    // Verify location was set
    console.log(`🔍 Verifying location was set...`);
    try {
      // Check if input is no longer visible (modal closed)
      const inputVisible = await locationInput.isVisible({ timeout: 2000 }).catch(() => false);
      if (!inputVisible) {
        console.log(`✅ Location set successfully (modal closed)`);
        return true;
      }

      // Check if location appears in header
      const header = page.locator("header").first();
      const locationParts = searchLocation.split(' ');
      for (const part of locationParts) {
        if (part.length > 2) {
          const hasLocation = await header.filter({ hasText: part }).isVisible({ timeout: 2000 }).catch(() => false);
          if (hasLocation) {
            console.log(`✅ Location set successfully (found "${part}" in header)`);
            return true;
          }
        }
      }

      console.log(`⚠️ Location may have been set, but couldn't verify`);
      return true; // Assume success if we got this far
    } catch (e) {
      console.log(`⚠️ Could not verify location was set: ${e.message}`);
      return true; // Assume success
    }

  } catch (error) {
    console.error(`❌ Error setting location: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Search for product and get rank
// customCollection: if provided, save to this collection instead of creating a new one (batch mode)
// skipLocationSetup: if true, skip location setup (already done in batch mode)
async function getProductRank(productName, location = null, brandFilter = null, customCollection = null, skipLocationSetup = false, existingPage = null) {
  let page;

  try {
    // Initialize browser if needed, or use existing page
    page = existingPage || await initBrowser();

    console.log(`🔍 Searching for product: "${productName}"`);

    // Only navigate to homepage and set location if NOT in batch mode
    // In batch mode, this is done once before the loop
    if (!skipLocationSetup) {
      // Go to Blinkit homepage with more lenient wait strategy
      try {
        await page.goto("https://blinkit.com", { waitUntil: "domcontentloaded", timeout: 30000 });
        console.log("✅ Page loaded");
      } catch (error) {
        console.log("⚠️ Page load timeout, but continuing...");
        // Continue anyway - page might still be usable
      }
      await page.waitForTimeout(3000);

      // Set location if provided
      if (location) {
        const maxAttempts = 3;
        let locationSet = false;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          console.log(`📍 Attempt ${attempt + 1} to set location...`);
          if (await setDeliveryLocation(page, location)) {
            locationSet = true;
            console.log("✅ Location set successfully");
            // Give the site a moment to reload offers/content for the selected location
            await Promise.race([
              page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { }),
              page.waitForTimeout(2000)
            ]);
            break;
          }
          await page.waitForTimeout(1000);
        }

        if (!locationSet) {
          console.log(`⚠️ Could not set location, continuing anyway...`);
        }
      }
    } else {
      console.log(`⏭️  Skipping location setup (batch mode - already set)`);
    }

    // Set up network interception to catch ALL search API calls
    const interceptedSearchResponses = [];

    const apiResponseHandler = async (response) => {
      const url = response.url();
      if (url.includes('/v1/layout/search') && url.includes('q=')) {
        const status = response.status();
        console.log(`📡 Intercepted API call [${status}]: ${url}`);

        try {
          let data = null;
          if (response.ok()) {
            data = await response.json();
          }
          interceptedSearchResponses.push({
            url,
            status,
            data,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.log(`⚠️ Error reading intercepted API response: ${error.message}`);
          interceptedSearchResponses.push({
            url,
            status,
            data: null,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Start listening for API responses
    page.on('response', apiResponseHandler);

    // Search for the product
    const searchUrl = `https://blinkit.com/s/?q=${encodeURIComponent(productName)}`;
    console.log(`🔗 Navigating to: ${searchUrl}`);
    try {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      console.log("✅ Search page loaded");
    } catch (error) {
      console.log("⚠️ Search page load timeout, but continuing...");
      // Continue anyway
    }
    await page.waitForTimeout(3000);

    // Wait for product containers
    try {
      console.log("🔍 Looking for product containers...");
      await page.locator("[id='product_container']").first().waitFor({ state: "visible", timeout: 20000 });
      console.log("✅ Product containers found");
    } catch (error) {
      console.log("❌ No product containers found");
      return {
        success: false,
        error: 'No products found on the search page',
        product_name: productName,
        rank: null
      };
    }

    // Scroll until "Showing related products" is found
    console.log("📜 Scrolling until 'Showing related products' section is found...");
    const foundRelatedProducts = await scrollToRelatedProducts(page);

    const relatedProductsFound = foundRelatedProducts;

    if (!relatedProductsFound) {
      console.log("⚠️ 'Showing related products' section not found, continuing with captured API responses");
    } else {
      console.log("✅ 'Showing related products' section found!");
    }

    // Wait a bit more for any API calls that might happen during/after scrolling
    await page.waitForTimeout(2500);

    // Stop listening further to avoid memory leaks
    page.off('response', apiResponseHandler);

    // Persist ALL intercepted search API responses (dedupe by URL)
    const seenUrls = new Set();
    const uniqueEvents = interceptedSearchResponses.filter(evt => {
      if (seenUrls.has(evt.url)) return false;
      seenUrls.add(evt.url);
      return true;
    });

    const successfulEvents = uniqueEvents.filter(evt => evt.status === 200 && evt.data);
    const dedupeSet = new Set();
    let aggregatedRecords = [];

    // Use customCollection if provided (batch mode), otherwise create unique collection
    let searchCollection = customCollection;
    let uniqueCollectionName = customCollection ? customCollection.collectionName : null;

    if (!customCollection) {
      // Create unique collection name for this search (single-product mode)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const cleanProductName = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const cleanLocation = (location || 'no_location').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      uniqueCollectionName = `${cleanProductName}_${cleanLocation}_${timestamp}`;
    }

    if (successfulEvents.length > 0 && mongoClient) {
      try {
        const db = mongoClient.db(DATABASE_NAME);
        const apiCollection = db.collection(SEARCH_API_COLLECTION_NAME);
        const docs = successfulEvents.map(evt => ({
          search_query: productName,
          location: location || '',
          api_url: evt.url,
          status: evt.status,
          api_response: evt.data,
          timestamp: new Date(),
          fetched_at: evt.timestamp
        }));
        await apiCollection.insertMany(docs);
        console.log(`✅ Saved ${docs.length} search API response(s) to MongoDB collection ${SEARCH_API_COLLECTION_NAME}`);

        // Create collection if not using customCollection
        if (!customCollection) {
          searchCollection = db.collection(uniqueCollectionName);
          console.log(`📁 Created unique collection: ${uniqueCollectionName}`);
        } else {
          console.log(`📁 Using provided collection: ${uniqueCollectionName}`);
        }
      } catch (e) {
        console.log(`⚠️ Failed saving intercepted API responses: ${e.message}`);
      }
    } else {
      console.log(`⚠️ No successful search API responses captured`);
    }

    if (successfulEvents.length > 0) {
      for (const evt of successfulEvents) {
        const { records } = await filterAndStoreProductRanks(evt.data, productName, location || '', dedupeSet, searchCollection);
        if (records.length) {
          aggregatedRecords = aggregatedRecords.concat(records);
        }
      }
    }

    if (aggregatedRecords.length > 1) {
      aggregatedRecords.sort((a, b) => {
        if (a.rank === null && b.rank === null) return 0;
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return a.rank - b.rank;
      });
    }

    const primaryProduct = aggregatedRecords.find(record => !record.is_ad) || aggregatedRecords[0] || null;
    const filteredProductsCount = aggregatedRecords.length;
    const successFlag = filteredProductsCount > 0 || relatedProductsFound;
    const responsePayload = {
      success: successFlag,
      message: relatedProductsFound
        ? 'Scrolled to "Showing related products" and captured search API responses'
        : 'Could not find "Showing related products"; processed captured search API responses',
      product_name: primaryProduct?.product_name || productName,
      rank: primaryProduct?.rank ?? null,
      product_position: primaryProduct?.product_position ?? null,
      weight: primaryProduct?.weight || '',
      current_price: primaryProduct?.current_price || '',
      original_price: primaryProduct?.original_price || '',
      discount: primaryProduct?.discount || '',
      delivery_time: primaryProduct?.delivery_time || '',
      is_ad: primaryProduct?.is_ad || false,
      location: location || '',
      api_responses_captured: successfulEvents.length,
      filtered_products_count: filteredProductsCount,
      related_products_found: relatedProductsFound
    };

    if (filteredProductsCount > 0) {
      responsePayload.filtered_products = aggregatedRecords.slice(0, 25);
    }

    return responsePayload;

  } catch (error) {
    console.error(`❌ Error during product search: ${error.message}`);
    return {
      success: false,
      error: error.message,
      product_name: productName,
      rank: null
    };
  } finally {
    // Close the page if it was created by this function and not passed in
    if (page && !existingPage) {
      try {
        await page.close();
      } catch (e) {
        console.error(`⚠️ Error closing page: ${e.message}`);
      }
    }
  }
}

// Check if product is sponsored ad
async function checkIfSponsoredAd(item) {
  try {
    // Check for ad images
    const adImageSelectors = [
      "img[src*='ad_without_bg.png']",
      "img[src*='ad.png']",
      "img[src*='advertisement']"
    ];

    for (const selector of adImageSelectors) {
      const adImage = item.locator(selector).first();
      if (await adImage.count() > 0) {
        return true;
      }
    }

    // Check for ad text
    const adTextSelectors = [
      "div[class*='Ad']",
      "span[class*='Ad']",
      "div[class*='ad']",
      "span[class*='ad']"
    ];

    for (const selector of adTextSelectors) {
      const adElement = item.locator(selector).first();
      if (await adElement.count() > 0) {
        const adText = (await adElement.innerText()).toLowerCase().trim();
        if (adText === 'ad' || adText === 'ads') {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Blinkit Product Rank Search</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 {
                color: #333;
                margin-bottom: 10px;
                font-size: 28px;
            }
            .subtitle {
                color: #666;
                margin-bottom: 30px;
                font-size: 14px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 500;
                font-size: 14px;
            }
            input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                font-size: 16px;
                transition: all 0.3s;
            }
            input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            button {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                margin-top: 10px;
            }
            button:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            }
            button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .result {
                margin-top: 30px;
                padding: 20px;
                border-radius: 10px;
                display: none;
            }
            .result.success {
                background: #d4edda;
                border: 2px solid #28a745;
                display: block;
            }
            .result.error {
                background: #f8d7da;
                border: 2px solid #dc3545;
                display: block;
            }
            .result.loading {
                background: #d1ecf1;
                border: 2px solid #17a2b8;
                display: block;
                text-align: center;
            }
            .result h3 {
                margin-bottom: 15px;
                color: #333;
            }
            .result p {
                margin: 8px 0;
                color: #555;
            }
            .result strong {
                color: #333;
            }
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .note {
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 12px;
                border-radius: 8px;
                margin-top: 20px;
                font-size: 13px;
                color: #856404;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 Blinkit Product Rank Search</h1>
            <p class="subtitle">Search for any product and get its rank on Blinkit</p>
            
            <form id="searchForm">
                <div class="form-group">
                    <label for="productName">Product Name *</label>
                    <input 
                        type="text" 
                        id="productName" 
                        name="productName" 
                        placeholder="e.g., amul milk"
                        required
                        autocomplete="off"
                    />
                </div>
                
                <div class="form-group">
                    <label for="location">Location (Optional)</label>
                    <input 
                        type="text" 
                        id="location" 
                        name="location" 
                        placeholder="e.g., Delhi: 110001"
                        autocomplete="off"
                    />
                </div>
                
                <button type="submit" id="searchBtn">
                    🔍 Search Product
                </button>
            </form>
            
            <div id="result" class="result"></div>
            
            <div class="note">
                <strong>ℹ️ Note:</strong> The browser will open visibly and search for your product. 
                The browser will stay open for 10 seconds so you can see the results. 
                Product rank data is automatically saved to MongoDB (${COLLECTION_NAME} collection).
            </div>
        </div>
        
        <script>
            const form = document.getElementById('searchForm');
            const resultDiv = document.getElementById('result');
            const searchBtn = document.getElementById('searchBtn');
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const productName = document.getElementById('productName').value.trim();
                const location = document.getElementById('location').value.trim() || null;
                
                if (!productName) {
                    alert('Please enter a product name');
                    return;
                }
                
                // Show loading
                resultDiv.className = 'result loading';
                resultDiv.innerHTML = '<div class="spinner"></div><p style="margin-top: 10px;">Searching for product... This may take a moment.</p>';
                searchBtn.disabled = true;
                
                try {
                    const response = await fetch('/api/search-product', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            product_name: productName,
                            location: location
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success && data.result.success) {
                        const r = data.result;
                        resultDiv.className = 'result success';
                        resultDiv.innerHTML = \`
                            <h3>✅ Product Found!</h3>
                            <p><strong>Product:</strong> \${r.product_name}</p>
                            <p><strong>Rank:</strong> #\${r.rank}</p>
                            <p><strong>Weight:</strong> \${r.weight || 'N/A'}</p>
                            <p><strong>Current Price:</strong> ₹\${r.current_price || 'N/A'}</p>
                            <p><strong>Original Price:</strong> ₹\${r.original_price || 'N/A'}</p>
                            <p><strong>Discount:</strong> \${r.discount || 'N/A'}</p>
                            <p><strong>Delivery Time:</strong> \${r.delivery_time || 'N/A'}</p>
                            <p><strong>Sponsored Ad:</strong> \${r.is_ad ? 'Yes' : 'No'}</p>
                            <p><strong>Location:</strong> \${r.location || 'Not specified'}</p>
                        \`;
                    } else {
                        resultDiv.className = 'result error';
                        resultDiv.innerHTML = \`
                            <h3>❌ Product Not Found</h3>
                            <p><strong>Error:</strong> \${data.result?.error || data.error || 'Unknown error'}</p>
                            <p><strong>Searched for:</strong> \${productName}</p>
                            \${data.result?.searched_products_count ? \`<p><strong>Products checked:</strong> \${data.result.searched_products_count}</p>\` : ''}
                        \`;
                    }
                } catch (error) {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = \`
                        <h3>❌ Error</h3>
                        <p>\${error.message}</p>
                    \`;
                } finally {
                    searchBtn.disabled = false;
                }
            });
        </script>
    </body>
    </html>
  `);
});

// API endpoint to search for product
app.post('/api/search-product', async (req, res) => {
  try {
    const { product_name, location } = req.body;

    if (!product_name) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }

    console.log(`\n📥 Received search request: "${product_name}"${location ? ` in ${location}` : ''}`);

    const result = await getProductRank(product_name, location);

    // Keep browser open for 10 seconds so user can see results
    console.log("⏳ Keeping browser open for 10 seconds...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    res.json({
      success: true,
      result: result,
      message: 'Browser will close in a moment. Check the browser window to see the search results.'
    });

  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoCollection ? 'connected' : 'not connected',
    browser: activeContext ? 'active' : 'not active'
  });
});

// Start server
async function startServer() {
  await initMongoDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and visit: http://localhost:${PORT}`);
    console.log(`\n✅ Ready to search for products!\n`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down...');

  if (activeContext) {
    await activeContext.close();
  }

  if (mongoClient) {
    await mongoClient.close();
  }

  process.exit(0);
});

// CLI one-shot mode: run a single search OR batch searches then exit
async function runOnceFromCli() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const idx = args.indexOf(name);
    if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
    return null;
  };
  const once = args.includes('--once');
  if (!once) return false;

  // Redirect console.log to stderr in --once mode to keep stdout clean for JSON output
  const originalLog = console.log;
  console.log = (...args) => console.error(...args);

  // Support both --product (single) and --products (multiple, comma-separated)
  const productArg = getArg('--products') || getArg('--product') || getArg('-p');
  const location = getArg('--location') || getArg('-l');
  const brandFilter = getArg('--brand') || getArg('-b');

  if (!productArg) {
    console.error(JSON.stringify({ success: false, error: 'Missing --product or --products' }));
    process.exit(1);
  }

  // Parse comma-separated products
  const productList = productArg.split(',').map(p => p.trim()).filter(p => p);

  if (productList.length === 0) {
    console.error(JSON.stringify({ success: false, error: 'No valid products provided' }));
    process.exit(1);
  }

  console.log(`🔍 Processing ${productList.length} product(s): ${productList.join(', ')}`);

  if (brandFilter) {
    console.log(`🏷️  Brand filter active: "${brandFilter}"`);
  }

  try {
    await initMongoDB();

    // Create unified collection for batch mode (if multiple products)
    let customCollection = null;
    let collectionName = null;
    let browserPage = null; // Page to be reused in batch mode

    if (productList.length > 1) {
      // Batch mode: create brand_location_timestamp collection
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const cleanBrand = (brandFilter || 'unknown').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const cleanLocation = (location || 'no_location').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      collectionName = `${cleanBrand}_${cleanLocation}_${timestamp}`;

      const db = mongoClient.db(DATABASE_NAME);
      customCollection = db.collection(collectionName);
      console.log(`📁 Created unified collection for batch: ${collectionName}`);
    }

    const results = [];

    // In batch mode: set location ONCE before processing all products
    if (productList.length > 1 && location) {
      console.log(`\n📍 [BATCH MODE] Setting location ONCE for all ${productList.length} products...`);
      browserPage = await initBrowser(); // Initialize browser once for batch

      // Go to homepage
      try {
        await browserPage.goto("https://blinkit.com", { waitUntil: "domcontentloaded", timeout: 30000 });
        console.log("✅ Page loaded");
      } catch (error) {
        console.log("⚠️ Page load timeout, but continuing...");
      }
      await browserPage.waitForTimeout(3000);

      // Set location once
      const maxAttempts = 3;
      let locationSet = false;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`📍 Attempt ${attempt + 1} to set location: "${location}"`);
        if (await setDeliveryLocation(browserPage, location)) {
          locationSet = true;
          console.log("✅ Location set successfully for batch processing");
          await Promise.race([
            browserPage.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { }),
            browserPage.waitForTimeout(2000)
          ]);
          break;
        }
        await browserPage.waitForTimeout(1000);
      }

      if (!locationSet) {
        console.log(`⚠️ Could not set location, continuing anyway...`);
      }

      console.log(`✅ [BATCH MODE] Location setup complete. Now processing ${productList.length} products...\n`);
    }

    // Process all products in a single browser session
    for (let i = 0; i < productList.length; i++) {
      const product = productList[i];
      console.log(`\n🔍 [${i + 1}/${productList.length}] Searching for: "${product}"`);

      // In batch mode (multiple products), skip location setup since we did it once above
      const skipLocationSetupFlag = productList.length > 1;
      const result = await getProductRank(product, location || null, brandFilter || null, customCollection, skipLocationSetupFlag, browserPage);

      // Filter products by brand if specified
      if (brandFilter && result.filtered_products) {
        const brandLower = brandFilter.toLowerCase();
        const originalCount = result.filtered_products.length;
        result.filtered_products = result.filtered_products.filter(p =>
          (p.product_name || '').toLowerCase().includes(brandLower)
        );
        result.filtered_products_count = result.filtered_products.length;
        console.log(`🔍 Brand filter: ${originalCount} → ${result.filtered_products_count} products (filtered for "${brandFilter}")`);
      }

      results.push(result);

      // Don't close browser between searches in batch mode
      console.log(`✅ Completed search ${i + 1}/${productList.length}`);
    }

    // Output results
    const out = {
      success: true,
      batch_mode: productList.length > 1,
      products_processed: productList.length,
      collection_name: collectionName,
      results: results
    };

    // Use original console.log for JSON output to stdout
    originalLog(JSON.stringify(out));

  } catch (e) {
    console.error(JSON.stringify({ success: false, error: e?.message || String(e) }));
    process.exit(1);
  } finally {
    // Close browser and MongoDB after ALL searches are complete
    try { if (activeContext) await activeContext.close(); } catch { }
    try { if (mongoClient) await mongoClient.close(); } catch { }
  }
  process.exit(0);
}

// Start the server unless running in one-shot mode
runOnceFromCli().then((handled) => {
  if (!handled) startServer().catch(console.error);
});
