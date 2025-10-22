// topics_ffi.mjs
// JavaScript FFI module for loading JSON topic files

/**
 * Converts a plain JavaScript object to Gleam's Dynamic type
 * The object is already in the correct format for Gleam decoders
 */
export function parseJsonString(jsonString) {
  try {
    return { ok: JSON.parse(jsonString) };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Load a topic from a JSON string
 * Returns a Result with either the parsed data or an error
 */
export function loadTopicFromJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    // Validate required fields
    if (!data.name || !data.emoji || !data.words) {
      return { error: "Missing required fields in topic JSON" };
    }

    // Validate words array
    if (!Array.isArray(data.words)) {
      return { error: "Words must be an array" };
    }

    for (const word of data.words) {
      if (!word.catalan || !word.english) {
        return { error: "Each word must have 'catalan' and 'english' fields" };
      }
    }

    return { ok: data };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Load topics index from JSON string
 */
export function loadTopicsIndexFromJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!data.topics || !Array.isArray(data.topics)) {
      return { error: "Topics index must have a 'topics' array" };
    }

    return { ok: data };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * If you're bundling JSON files with your build tool (Vite, webpack, etc.),
 * you can import them directly:
 */

// Example with static imports (uncomment and adjust paths when ready):
/*
import animalsJson from "../priv/topics/animals.json";
import weatherJson from "../priv/topics/weather.json";
import foodJson from "../priv/topics/food.json";
import homeJson from "../priv/topics/home.json";
import natureJson from "../priv/topics/nature.json";
import schoolJson from "../priv/topics/school.json";

export function loadBundledTopics() {
  return [
    animalsJson,
    weatherJson,
    foodJson,
    homeJson,
    natureJson,
    schoolJson,
  ];
}
*/

/**
 * For dynamic loading at runtime (requires fetch API):
 */
export async function loadJsonFile(topicFile) {
//export async function fetchTopic(topicFile) {
  try {
    const response = await fetch(`/topics/${topicFile}`);
    if (!response.ok) {
      return { error: `Failed to fetch ${topicFile}: ${response.statusText}` };
    }
    const data = await response.json();
    return { ok: data };
  } catch (error) {
    return { error: error.message };
  }
}

export async function fetchTopicsIndex() {
  try {
    const response = await fetch('/topics/topics.json');
    if (!response.ok) {
      return { error: `Failed to fetch topics index: ${response.statusText}` };
    }
    const data = await response.json();
    return { ok: data };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Fetch all topics listed in the index
 */
//export async function fetchAllTopics() {
export async function loadAllTopicFiles() {
  try {
    // First get the index
    const indexResult = await fetchTopicsIndex();
    if (indexResult.error) {
      return indexResult;
    }

    const index = indexResult.ok;
    const enabledTopics = index.topics.filter(t => t.enabled);

    // Fetch all enabled topics in parallel
    const topicPromises = enabledTopics.map(topicInfo =>
      fetchTopic(topicInfo.file)
    );

    const results = await Promise.all(topicPromises);

    // Check for any errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      return { error: `Failed to load some topics: ${errors.map(e => e.error).join(', ')}` };
    }

    // Extract all successful topics
    const topics = results.map(r => r.ok);
    return { ok: topics };
  } catch (error) {
    return { error: error.message };
  }
}
