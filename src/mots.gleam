import gleam/int
import gleam/list
import gleam/string
import lustre
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

// Import types from mots module
pub type WordPair {
  WordPair(catalan: String, english: String)
}

pub type GameResult {
  Won
  Lost
  InProgress
}

// Model for the web app
pub type Model {
  Model(
    words: List(WordPair),
    current_index: Int,
    guessed_letters: List(String),
    attempts_left: Int,
    max_attempts: Int,
    total_won: Int,
    total_lost: Int,
  )
}

// Messages
pub type Msg {
  GuessLetter(String)
  NextWord
  RestartGame
}

// Initialize the app
pub fn init(_flags) -> Model {
  let words = [
    WordPair(catalan: "gat", english: "cat"),
    WordPair(catalan: "gos", english: "dog"),
    WordPair(catalan: "casa", english: "house"),
    WordPair(catalan: "aigua", english: "water"),
    WordPair(catalan: "menjar", english: "food"),
  ]

  Model(
    words: words,
    current_index: 0,
    guessed_letters: [],
    attempts_left: 6,
    max_attempts: 6,
    total_won: 0,
    total_lost: 0,
  )
}

/// Returns the element at the given index in the list,
/// or `Error(Nil)` if the index is out of bounds.
pub fn at(list: List(a), index: Int) -> Result(a, Nil) {
  case list {
    [] -> Error(Nil)
    [x, ..xs] ->
      case index {
        0 -> Ok(x)
        _ -> at(xs, index - 1)
      }
  }
}

// Get current word pair
fn current_word(model: Model) -> Result(WordPair, Nil) {
  at(model.words, model.current_index)
}

// Display word with underscores
fn display_word(english: String, guessed_letters: List(String)) -> String {
  english
  |> string.to_graphemes
  |> list.map(fn(letter) {
    let lowercase = string.lowercase(letter)
    case list.contains(guessed_letters, lowercase) {
      True -> letter
      False -> "_"
    }
  })
  |> string.join(" ")
}

// Check if letter is in word
fn is_letter_in_word(letter: String, word: String) -> Bool {
  word
  |> string.lowercase
  |> string.contains(string.lowercase(letter))
}

// Check if word is complete
fn is_word_complete(english: String, guessed_letters: List(String)) -> Bool {
  let displayed = display_word(english, guessed_letters)
  !string.contains(displayed, "_")
}

// Get game result
fn game_result(model: Model) -> GameResult {
  case current_word(model) {
    Ok(word_pair) -> {
      case is_word_complete(word_pair.english, model.guessed_letters) {
        True -> Won
        False ->
          case model.attempts_left <= 0 {
            True -> Lost
            False -> InProgress
          }
      }
    }
    Error(_) -> InProgress
  }
}

// Update function
pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    GuessLetter(letter) -> {
      let lowercase = string.lowercase(letter)

      // Don't process if already guessed or game is over
      case list.contains(model.guessed_letters, lowercase), game_result(model) {
        True, _ -> model
        _, Won -> model
        _, Lost -> model
        False, InProgress -> {
          case current_word(model) {
            Ok(word_pair) -> {
              let new_guessed = [lowercase, ..model.guessed_letters]
              let is_correct = is_letter_in_word(lowercase, word_pair.english)

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
            Error(_) -> model
          }
        }
      }
    }

    NextWord -> {
      let result = game_result(model)
      let new_won = case result {
        Won -> model.total_won + 1
        _ -> model.total_won
      }
      let new_lost = case result {
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

    RestartGame -> init(Nil)
  }
}

// View function
pub fn view(model: Model) -> Element(Msg) {
  html.div([attribute.class("container")], [
    view_header(),
    view_score(model),
    view_game(model),
  ])
}

fn view_header() -> Element(Msg) {
  html.div([attribute.class("header")], [
    html.h1([], [element.text("🎮 Mots 🎮")]),
    html.p([], [element.text("Learn English words from Catalan")]),
  ])
}

fn view_score(model: Model) -> Element(Msg) {
  html.div([attribute.class("score")], [
    html.span([], [
      element.text("Won: " <> int.to_string(model.total_won)),
    ]),
    html.span([], [
      element.text("Lost: " <> int.to_string(model.total_lost)),
    ]),
  ])
}

fn view_game(model: Model) -> Element(Msg) {
  case current_word(model) {
    Ok(word_pair) -> {
      let result = game_result(model)

      case result {
        InProgress -> view_playing(model, word_pair)
        Won -> view_won(model, word_pair)
        Lost -> view_lost(model, word_pair)
      }
    }
    Error(_) -> view_game_complete(model)
  }
}

fn view_playing(model: Model, word_pair: WordPair) -> Element(Msg) {
  html.div([attribute.class("game")], [
    html.div([attribute.class("catalan-word")], [
      html.h2([], [element.text("Catalan: " <> word_pair.catalan)]),
    ]),
    html.div([attribute.class("english-word")], [
      html.h1([], [
        element.text(display_word(word_pair.english, model.guessed_letters)),
      ]),
    ]),
    html.div([attribute.class("attempts")], [
      html.p([], [
        element.text("Attempts left: " <> int.to_string(model.attempts_left)),
      ]),
    ]),
    view_keyboard(model),
    html.div([attribute.class("guessed")], [
      html.p([], [
        element.text("Guessed: " <> string.join(model.guessed_letters, ", ")),
      ]),
    ]),
  ])
}

fn view_won(model: Model, word_pair: WordPair) -> Element(Msg) {
  html.div([attribute.class("game result-won")], [
    html.h1([], [element.text("🎉")]),
    html.h2([], [element.text("Correct!")]),
    html.p([], [element.text("The word is: " <> word_pair.english)]),
    view_next_button(model),
  ])
}

fn view_lost(model: Model, word_pair: WordPair) -> Element(Msg) {
  html.div([attribute.class("game result-lost")], [
    html.h1([], [element.text("❌")]),
    html.h2([], [element.text("Game Over!")]),
    html.p([], [element.text("The word was: " <> word_pair.english)]),
    view_next_button(model),
  ])
}

fn view_next_button(model: Model) -> Element(Msg) {
  let has_more = model.current_index + 1 < list.length(model.words)

  case has_more {
    True ->
      html.button([attribute.class("next-button"), event.on_click(NextWord)], [
        element.text("Next Word →"),
      ])
    False ->
      html.button([attribute.class("next-button"), event.on_click(NextWord)], [
        element.text("See Results"),
      ])
  }
}

fn view_game_complete(model: Model) -> Element(Msg) {
  let total = model.total_won + model.total_lost
  let percentage = case total > 0 {
    True -> model.total_won * 100 / total
    False -> 0
  }

  html.div([attribute.class("game game-complete")], [
    html.h1([], [element.text("🏁")]),
    html.h2([], [element.text("Game Complete!")]),
    html.div([attribute.class("final-score")], [
      html.p([], [element.text("Words won: " <> int.to_string(model.total_won))]),
      html.p([], [
        element.text("Words lost: " <> int.to_string(model.total_lost)),
      ]),
      html.p([], [
        element.text("Success rate: " <> int.to_string(percentage) <> "%"),
      ]),
    ]),
    html.button(
      [attribute.class("restart-button"), event.on_click(RestartGame)],
      [
        element.text("Play Again"),
      ],
    ),
  ])
}

fn view_keyboard(model: Model) -> Element(Msg) {
  let alphabet = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
  ]

  html.div(
    [attribute.class("keyboard")],
    list.map(alphabet, fn(letter) {
      let is_guessed = list.contains(model.guessed_letters, letter)
      let class_name = case is_guessed {
        True -> "key key-disabled"
        False -> "key"
      }

      html.button(
        [
          attribute.class(class_name),
          attribute.disabled(is_guessed),
          event.on_click(GuessLetter(letter)),
        ],
        [element.text(string.uppercase(letter))],
      )
    }),
  )
}

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
