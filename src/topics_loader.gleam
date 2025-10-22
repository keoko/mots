// topics_loader.gleam
// Module for loading word collections from JSON files

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result

// Types matching the main module
pub type WordPair {
  WordPair(catalan: String, english: String)
}

pub type Topic {
  Topic(name: String, emoji: String, words: List(WordPair))
}

pub type TopicIndex {
  TopicIndex(id: String, file: String, enabled: Bool)
}

// Decoders

fn word_pair_decoder() {
  use catalan <- decode.field("catalan", decode.string)
  use english <- decode.field("english", decode.string)
  decode.success(WordPair(catalan: catalan, english: english))
}

fn topic_decoder() {
  use name <- decode.field("name", decode.string)
  use emoji <- decode.field("emoji", decode.string)
  use words <- decode.field("words", decode.list(word_pair_decoder()))
  decode.success(Topic(name: name, emoji: emoji, words: words))
}

fn topic_index_decoder() {
  use id <- decode.field("id", decode.string)
  use file <- decode.field("file", decode.string)
  use enabled <- decode.field("enabled", decode.bool)
  decode.success(TopicIndex(id: id, file: file, enabled: enabled))
}

fn topics_index_list_decoder() {
  use topics <- decode.field("topics", decode.list(topic_index_decoder()))
  decode.success(topics)
}

// Parse JSON strings

pub fn parse_topic(json_string: String) -> Result(Topic, json.DecodeError) {
  json.parse(json_string, topic_decoder())
}

pub fn parse_topics_index(
  json_string: String,
) -> Result(List(TopicIndex), json.DecodeError) {
  json.parse(json_string, topics_index_list_decoder())
}

// FFI to load JSON files (JavaScript side handles file reading)

@external(javascript, "../topics_ffi.mjs", "loadJsonFile")
pub fn load_json_file(filepath: String) -> Result(String, String)

@external(javascript, "../topics_ffi.mjs", "loadAllTopicFiles")
pub fn load_all_topic_files() -> List(String)

// High-level functions

pub fn load_topic_from_file(filepath: String) -> Result(Topic, String) {
  case load_json_file(filepath) {
    Ok(json_string) ->
      parse_topic(json_string)
      |> result.map_error(fn(err) {
        echo err
        "Failed to parse topic"
        // "Failed to parse topic: " <> json.describe_decode_error(err)
      })
    Error(msg) -> Error(msg)
  }
}

pub fn load_all_topics() -> List(Topic) {
  load_all_topic_files()
  |> list.filter_map(parse_topic)
}
