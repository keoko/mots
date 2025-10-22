import gleam/int
import gleam/list
import gleam/string
import lustre
import lustre/attribute.{attribute, class}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

// TYPES

pub type WordPair {
  WordPair(catalan: String, english: String)
}

pub type Topic {
  Topic(name: String, emoji: String, words: List(WordPair))
}

pub type GameState {
  TopicSelection
  Playing
  Won
  Lost
  Complete
}

pub type Model {
  Model(
    topics: List(Topic),
    selected_topic: Result(Topic, Nil),
    current_index: Int,
    guessed_letters: List(String),
    attempts_left: Int,
    max_attempts: Int,
    total_won: Int,
    total_lost: Int,
  )
}

pub type Msg {
  SelectTopic(String)
  GuessLetter(String)
  NextWord
  RestartGame
  BackToTopics
}

// CONSTANTS

const alphabet = [
  "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g",
  "h", "j", "k", "l", "z", "x", "c", "v", "b", "n", "m",
]

// WORD COLLECTIONS BY TOPIC

fn get_topics() -> List(Topic) {
  [
    Topic(
      name: "Animals",
      emoji: "🐾",
      words: [
        WordPair(catalan: "gat", english: "cat"),
        WordPair(catalan: "gos", english: "dog"),
        WordPair(catalan: "cavall", english: "horse"),
        WordPair(catalan: "ocell", english: "bird"),
        WordPair(catalan: "peix", english: "fish"),
        WordPair(catalan: "conill", english: "rabbit"),
        WordPair(catalan: "elefant", english: "elephant"),
      ],
    ),
    Topic(
      name: "Weather",
      emoji: "🌤️",
      words: [
        WordPair(catalan: "sol", english: "sunny"),
        WordPair(catalan: "núvol", english: "cloudy"),
        WordPair(catalan: "pluja", english: "rainy"),
        WordPair(catalan: "vent", english: "windy"),
        WordPair(catalan: "neu", english: "snowy"),
        WordPair(catalan: "tempesta", english: "stormy"),
        WordPair(catalan: "boira", english: "foggy"),
      ],
    ),
    Topic(
      name: "Food",
      emoji: "🍽️",
      words: [
        WordPair(catalan: "pa", english: "bread"),
        WordPair(catalan: "aigua", english: "water"),
        WordPair(catalan: "fruita", english: "fruit"),
        WordPair(catalan: "carn", english: "meat"),
        WordPair(catalan: "peix", english: "fish"),
        WordPair(catalan: "verdura", english: "vegetable"),
        WordPair(catalan: "formatge", english: "cheese"),
      ],
    ),
    Topic(
      name: "Home",
      emoji: "🏠",
      words: [
        WordPair(catalan: "casa", english: "house"),
        WordPair(catalan: "porta", english: "door"),
        WordPair(catalan: "finestra", english: "window"),
        WordPair(catalan: "taula", english: "table"),
        WordPair(catalan: "cadira", english: "chair"),
        WordPair(catalan: "llit", english: "bed"),
        WordPair(catalan: "cuina", english: "kitchen"),
      ],
    ),
    Topic(
      name: "Nature",
      emoji: "🌳",
      words: [
        WordPair(catalan: "arbre", english: "tree"),
        WordPair(catalan: "flor", english: "flower"),
        WordPair(catalan: "muntanya", english: "mountain"),
        WordPair(catalan: "riu", english: "river"),
        WordPair(catalan: "mar", english: "sea"),
        WordPair(catalan: "bosc", english: "forest"),
        WordPair(catalan: "pedra", english: "stone"),
      ],
    ),
    Topic(
      name: "School",
      emoji: "📚",
      words: [
        WordPair(catalan: "escola", english: "school"),
        WordPair(catalan: "llibre", english: "book"),
        WordPair(catalan: "llapis", english: "pencil"),
        WordPair(catalan: "paper", english: "paper"),
        WordPair(catalan: "taula", english: "desk"),
        WordPair(catalan: "mestre", english: "teacher"),
        WordPair(catalan: "alumne", english: "student"),
      ],
    ),
  ]
}

// INITIALIZATION

pub fn init(_flags) -> Model {
  Model(
    topics: get_topics(),
    selected_topic: Error(Nil),
    current_index: 0,
    guessed_letters: [],
    attempts_left: 6,
    max_attempts: 6,
    total_won: 0,
    total_lost: 0,
  )
}

// HELPERS

fn get_at(items: List(a), index: Int) -> Result(a, Nil) {
  case items {
    [] -> Error(Nil)
    [first, ..rest] ->
      case index {
        0 -> Ok(first)
        _ -> get_at(rest, index - 1)
      }
  }
}

fn find_topic(topics: List(Topic), name: String) -> Result(Topic, Nil) {
  case topics {
    [] -> Error(Nil)
    [topic, ..rest] ->
      case topic.name == name {
        True -> Ok(topic)
        False -> find_topic(rest, name)
      }
  }
}

fn current_word(model: Model) -> Result(WordPair, Nil) {
  case model.selected_topic {
    Error(_) -> Error(Nil)
    Ok(topic) -> get_at(topic.words, model.current_index)
  }
}

fn display_word(word: String, guessed: List(String)) -> String {
  word
  |> string.to_graphemes
  |> list.map(fn(letter) {
    let lower = string.lowercase(letter)
    case list.contains(guessed, lower) {
      True -> letter
      False -> "_"
    }
  })
  |> string.join(" ")
}

fn is_letter_in_word(letter: String, word: String) -> Bool {
  word
  |> string.lowercase
  |> string.contains(string.lowercase(letter))
}

fn is_word_complete(word: String, guessed: List(String)) -> Bool {
  word
  |> string.to_graphemes
  |> list.all(fn(letter) {
    list.contains(guessed, string.lowercase(letter))
  })
}

fn game_state(model: Model) -> GameState {
  case model.selected_topic {
    Error(_) -> TopicSelection
    Ok(topic) ->
      case current_word(model) {
        Error(_) -> Complete
        Ok(word_pair) ->
          case is_word_complete(word_pair.english, model.guessed_letters) {
            True -> Won
            False ->
              case model.attempts_left <= 0 {
                True -> Lost
                False -> Playing
              }
          }
      }
  }
}

// UPDATE

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    SelectTopic(name) -> handle_topic_selection(model, name)
    GuessLetter(letter) -> handle_guess(model, letter)
    NextWord -> handle_next_word(model)
    RestartGame -> init(Nil)
    BackToTopics ->
      Model(
        ..model,
        selected_topic: Error(Nil),
        current_index: 0,
        guessed_letters: [],
        attempts_left: model.max_attempts,
      )
  }
}

fn handle_topic_selection(model: Model, name: String) -> Model {
  case find_topic(model.topics, name) {
    Ok(topic) ->
      Model(
        ..model,
        selected_topic: Ok(topic),
        current_index: 0,
        guessed_letters: [],
        attempts_left: model.max_attempts,
        total_won: 0,
        total_lost: 0,
      )
    Error(_) -> model
  }
}

fn handle_guess(model: Model, letter: String) -> Model {
  let lower = string.lowercase(letter)
  let already_guessed = list.contains(model.guessed_letters, lower)
  let state = game_state(model)

  case already_guessed, state {
    True, _ -> model
    _, Won -> model
    _, Lost -> model
    _, Complete -> model
    _, TopicSelection -> model
    False, Playing ->
      case current_word(model) {
        Error(_) -> model
        Ok(word_pair) -> {
          let new_guessed = [lower, ..model.guessed_letters]
          let is_correct = is_letter_in_word(lower, word_pair.english)

          case is_correct {
            True -> Model(..model, guessed_letters: new_guessed)
            False ->
              Model(
                ..model,
                guessed_letters: new_guessed,
                attempts_left: model.attempts_left - 1,
              )
          }
        }
      }
  }
}

fn handle_next_word(model: Model) -> Model {
  let state = game_state(model)
  let new_won = case state {
    Won -> model.total_won + 1
    _ -> model.total_won
  }
  let new_lost = case state {
    Lost -> model.total_lost + 1
    _ -> model.total_lost
  }

  Model(
    ..model,
    current_index: model.current_index + 1,
    guessed_letters: [],
    attempts_left: model.max_attempts,
    total_won: new_won,
    total_lost: new_lost,
  )
}

// VIEW

pub fn view(model: Model) -> Element(Msg) {
  html.div(
    [
      class("container"),
      attribute("role", "main"),
    ],
    [
      view_header(),
      case game_state(model) {
        TopicSelection -> view_topic_selection(model)
        _ -> view_game_with_score(model)
      },
    ],
  )
}

fn view_header() -> Element(Msg) {
  html.header([class("header")], [
    html.h1([attribute("id", "game-title")], [element.text("🎮 Mots")]),
    html.p([class("subtitle")], [
      element.text("Learn English words from Catalan"),
    ]),
  ])
}

fn view_topic_selection(model: Model) -> Element(Msg) {
  html.div([class("topic-selection")], [
    html.h2([class("section-title")], [element.text("Choose a Topic")]),
    html.div(
      [class("topic-grid"), attribute("role", "list")],
      list.map(model.topics, fn(topic) {
        html.button(
          [
            class("topic-card"),
            attribute("role", "listitem"),
            attribute(
              "aria-label",
              "Select topic: " <> topic.name <> ", " <> int.to_string(
                list.length(topic.words),
              ) <> " words",
            ),
            event.on_click(SelectTopic(topic.name)),
          ],
          [
            html.div([class("topic-emoji")], [element.text(topic.emoji)]),
            html.div([class("topic-name")], [element.text(topic.name)]),
            html.div([class("topic-count")], [
              element.text(
                int.to_string(list.length(topic.words)) <> " words",
              ),
            ]),
          ],
        )
      }),
    ),
  ])
}

fn view_game_with_score(model: Model) -> Element(Msg) {
  html.div([], [
    view_topic_header(model),
    view_score(model),
    view_game(model),
  ])
}

fn view_topic_header(model: Model) -> Element(Msg) {
  case model.selected_topic {
    Error(_) -> html.div([], [])
    Ok(topic) ->
      html.div([class("topic-header")], [
        html.button(
          [
            class("back-button"),
            attribute("aria-label", "Back to topic selection"),
            event.on_click(BackToTopics),
          ],
          [element.text("← Topics")],
        ),
        html.div([class("current-topic")], [
          html.span([class("topic-emoji-small")], [element.text(topic.emoji)]),
          html.span([class("topic-name-small")], [element.text(topic.name)]),
        ]),
      ])
  }
}

fn view_score(model: Model) -> Element(Msg) {
  html.div(
    [class("score"), attribute("role", "status"), attribute("aria-live", "polite")],
    [
      html.div([class("score-item")], [
        html.span([class("score-label")], [element.text("Won")]),
        html.span(
          [class("score-value"), attribute("aria-label", "Words won")],
          [element.text(int.to_string(model.total_won))],
        ),
      ]),
      html.div([class("score-item")], [
        html.span([class("score-label")], [element.text("Lost")]),
        html.span(
          [class("score-value"), attribute("aria-label", "Words lost")],
          [element.text(int.to_string(model.total_lost))],
        ),
      ]),
    ],
  )
}

fn view_game(model: Model) -> Element(Msg) {
  case current_word(model) {
    Error(_) -> view_complete(model)
    Ok(word_pair) ->
      case game_state(model) {
        Playing -> view_playing(model, word_pair)
        Won -> view_won(model, word_pair)
        Lost -> view_lost(model, word_pair)
        Complete -> view_complete(model)
        TopicSelection -> html.div([], [])
      }
  }
}

fn view_playing(model: Model, word: WordPair) -> Element(Msg) {
  html.div(
    [class("game"), attribute("aria-labelledby", "game-title")],
    [
      html.div([class("word-section")], [
        html.div([class("catalan-word")], [
          html.span([class("label")], [element.text("Catalan")]),
          html.div([class("word"), attribute("lang", "ca")], [
            element.text(word.catalan),
          ]),
        ]),
        html.div([class("english-word")], [
          html.span([class("label")], [element.text("English")]),
          html.div(
            [
              class("word display-word"),
              attribute("lang", "en"),
              attribute("aria-label", "Word to guess: " <> string.length(
                word.english,
              ) |> int.to_string <> " letters"),
            ],
            [element.text(display_word(word.english, model.guessed_letters))],
          ),
        ]),
      ]),
      view_attempts(model),
      view_keyboard(model, word),
      view_guessed(model),
    ],
  )
}

fn view_attempts(model: Model) -> Element(Msg) {
  let hearts =
    list.range(0, model.max_attempts - 1)
    |> list.map(fn(i) {
      case i < model.attempts_left {
        True -> "❤️"
        False -> "🖤"
      }
    })
    |> string.join("")

  html.div(
    [
      class("attempts"),
      attribute("role", "status"),
      attribute("aria-live", "polite"),
      attribute(
        "aria-label",
        "Attempts remaining: " <> int.to_string(model.attempts_left),
      ),
    ],
    [
      html.div([class("hearts")], [element.text(hearts)]),
      html.div([class("attempts-text")], [
        element.text(int.to_string(model.attempts_left) <> " attempts left"),
      ]),
    ],
  )
}

fn view_keyboard(model: Model, word: WordPair) -> Element(Msg) {
  html.div(
    [class("keyboard"), attribute("role", "group"), attribute("aria-label", "Letter keyboard")],
    list.map(alphabet, fn(letter) {
      let is_guessed = list.contains(model.guessed_letters, letter)
      let is_correct = is_letter_in_word(letter, word.english) && is_guessed
      let is_wrong = !is_letter_in_word(letter, word.english) && is_guessed

      let key_class = case is_correct, is_wrong {
        True, _ -> "key key-correct"
        _, True -> "key key-wrong"
        _, _ -> "key"
      }

      let aria_label = case is_correct, is_wrong {
        True, _ -> "Letter " <> string.uppercase(letter) <> " - correct"
        _, True -> "Letter " <> string.uppercase(letter) <> " - incorrect"
        _, _ -> "Letter " <> string.uppercase(letter)
      }

      html.button(
        [
          class(key_class),
          attribute.disabled(is_guessed),
          attribute("aria-label", aria_label),
          attribute("aria-pressed", case is_guessed {
            True -> "true"
            False -> "false"
          }),
          event.on_click(GuessLetter(letter)),
        ],
        [element.text(string.uppercase(letter))],
      )
    }),
  )
}

fn view_guessed(model: Model) -> Element(Msg) {
  let guessed_text = case model.guessed_letters {
    [] -> "No letters guessed yet"
    letters -> string.join(list.reverse(letters), ", ")
  }

  html.div(
    [
      class("guessed"),
      attribute("role", "status"),
      attribute("aria-live", "polite"),
    ],
    [
      html.span([class("label")], [element.text("Guessed: ")]),
      html.span([], [element.text(guessed_text)]),
    ],
  )
}

fn view_won(model: Model, word: WordPair) -> Element(Msg) {
  html.div(
    [
      class("game result result-won"),
      attribute("role", "alert"),
      attribute("aria-live", "assertive"),
    ],
    [
      html.div([class("result-icon")], [element.text("🎉")]),
      html.h2([class("result-title")], [element.text("Correct!")]),
      html.p([class("result-word")], [
        element.text("The word is: "),
        html.strong([], [element.text(word.english)]),
      ]),
      view_next_button(model),
    ],
  )
}

fn view_lost(model: Model, word: WordPair) -> Element(Msg) {
  html.div(
    [
      class("game result result-lost"),
      attribute("role", "alert"),
      attribute("aria-live", "assertive"),
    ],
    [
      html.div([class("result-icon")], [element.text("💔")]),
      html.h2([class("result-title")], [element.text("Out of attempts!")]),
      html.p([class("result-word")], [
        element.text("The word was: "),
        html.strong([], [element.text(word.english)]),
      ]),
      view_next_button(model),
    ],
  )
}

fn view_next_button(model: Model) -> Element(Msg) {
  case model.selected_topic {
    Error(_) -> html.div([], [])
    Ok(topic) -> {
      let has_more = model.current_index + 1 < list.length(topic.words)
      let button_text = case has_more {
        True -> "Next Word →"
        False -> "See Results →"
      }

      html.button(
        [
          class("btn btn-primary"),
          attribute("aria-label", button_text),
          event.on_click(NextWord),
        ],
        [element.text(button_text)],
      )
    }
  }
}

fn view_complete(model: Model) -> Element(Msg) {
  let total = model.total_won + model.total_lost
  let percentage = case total > 0 {
    True -> model.total_won * 100 / total
    False -> 0
  }

  html.div(
    [
      class("game game-complete"),
      attribute("role", "alert"),
      attribute("aria-live", "assertive"),
    ],
    [
      html.div([class("result-icon")], [element.text("🏁")]),
      html.h2([class("result-title")], [element.text("Topic Complete!")]),
      html.div([class("final-score")], [
        html.div([class("stat")], [
          html.div([class("stat-value")], [
            element.text(int.to_string(model.total_won)),
          ]),
          html.div([class("stat-label")], [element.text("Words Won")]),
        ]),
        html.div([class("stat")], [
          html.div([class("stat-value")], [
            element.text(int.to_string(model.total_lost)),
          ]),
          html.div([class("stat-label")], [element.text("Words Lost")]),
        ]),
        html.div([class("stat stat-highlight")], [
          html.div([class("stat-value")], [
            element.text(int.to_string(percentage) <> "%"),
          ]),
          html.div([class("stat-label")], [element.text("Success Rate")]),
        ]),
      ]),
      html.div([class("complete-buttons")], [
        html.button(
          [
            class("btn btn-secondary"),
            attribute("aria-label", "Choose another topic"),
            event.on_click(BackToTopics),
          ],
          [element.text("← Choose Topic")],
        ),
        html.button(
          [
            class("btn btn-primary"),
            attribute("aria-label", "Play this topic again"),
            event.on_click(RestartGame),
          ],
          [element.text("🔄 Play Again")],
        ),
      ]),
    ],
  )
}

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
