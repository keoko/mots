import gleam/io
import gleam/list
import gleam/string

// A word pair: Catalan word and its English translation
pub type WordPair {
  WordPair(catalan: String, english: String)
}

// Game state for a single word
pub type GameState {
  GameState(
    word_pair: WordPair,
    guessed_letters: List(String),
    attempts_left: Int,
    max_attempts: Int,
  )
}

// Create a new game state for a word pair
pub fn new_game(word_pair: WordPair, max_attempts: Int) -> GameState {
  GameState(
    word_pair: word_pair,
    guessed_letters: [],
    attempts_left: max_attempts,
    max_attempts: max_attempts,
  )
}

// Display the English word with underscores for unguessed letters
pub fn display_word(english: String, guessed_letters: List(String)) -> String {
  english
  |> string.to_graphemes
  |> list.map(fn(letter) {
    let lowercase = string.lowercase(letter)
    case list.contains(guessed_letters, lowercase) {
      True -> letter
      False -> "_"
    }
  })
  |> string.join("")
}

// Check if a letter is in the word
pub fn is_letter_in_word(letter: String, word: String) -> Bool {
  word
  |> string.lowercase
  |> string.contains(string.lowercase(letter))
}

// Check if the word is completely guessed
pub fn is_word_complete(english: String, guessed_letters: List(String)) -> Bool {
  let displayed = display_word(english, guessed_letters)
  !string.contains(displayed, "_")
}

// Make a guess and update the game state
pub fn make_guess(state: GameState, letter: String) -> GameState {
  let lowercase_letter = string.lowercase(letter)

  // Check if already guessed
  case list.contains(state.guessed_letters, lowercase_letter) {
    True -> state  // Already guessed, no change
    False -> {
      let new_guessed = [lowercase_letter, ..state.guessed_letters]

      // Check if the letter is in the word
      case is_letter_in_word(lowercase_letter, state.word_pair.english) {
        True -> GameState(..state, guessed_letters: new_guessed)
        False -> GameState(
          ..state,
          guessed_letters: new_guessed,
          attempts_left: state.attempts_left - 1,
        )
      }
    }
  }
}

pub fn main() {
  // Let's create some sample word pairs
  let words = [
    WordPair(catalan: "gat", english: "cat"),
    WordPair(catalan: "gos", english: "dog"),
    WordPair(catalan: "casa", english: "house"),
    WordPair(catalan: "aigua", english: "water"),
    WordPair(catalan: "menjar", english: "food"),
  ]

  io.println("Welcome to Mots!")
  io.println("=================\n")

  // Test our game logic with the first word
  case list.first(words) {
    Ok(word_pair) -> {
      io.println("Catalan word: " <> word_pair.catalan)

      // Create a new game
      let game = new_game(word_pair, max_attempts: 6)
      io.println("English word: " <> display_word(word_pair.english, game.guessed_letters))
      io.println("Attempts left: " <> string.inspect(game.attempts_left) <> "\n")

      // Simulate some guesses
      io.println("Guessing 'c'...")
      let game = make_guess(game, "c")
      io.println("English word: " <> display_word(game.word_pair.english, game.guessed_letters))
      io.println("Attempts left: " <> string.inspect(game.attempts_left) <> "\n")

      io.println("Guessing 'a'...")
      let game = make_guess(game, "a")
      io.println("English word: " <> display_word(game.word_pair.english, game.guessed_letters))
      io.println("Attempts left: " <> string.inspect(game.attempts_left) <> "\n")

      io.println("Guessing 'x' (wrong letter)...")
      let game = make_guess(game, "x")
      io.println("English word: " <> display_word(game.word_pair.english, game.guessed_letters))
      io.println("Attempts left: " <> string.inspect(game.attempts_left) <> "\n")

      io.println("Guessing 't'...")
      let game = make_guess(game, "t")
      io.println("English word: " <> display_word(game.word_pair.english, game.guessed_letters))
      io.println("Attempts left: " <> string.inspect(game.attempts_left))

      case is_word_complete(game.word_pair.english, game.guessed_letters) {
        True -> io.println("\n🎉 Word completed!")
        False -> io.println("\n❌ Word not yet complete")
      }
    }
    Error(_) -> io.println("No words found!")
  }
}
