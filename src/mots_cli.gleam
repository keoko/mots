import gleam/io
import gleam/list
import gleam/string
import input.{input}


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

// Game result
pub type GameResult {
  Won
  Lost
  InProgress
}

// Create a new game state for a word pair
pub fn new_game(word_pair: WordPair, max_attempts max_attempts: Int) -> GameState {
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

// Get the current game result
pub fn game_result(state: GameState) -> GameResult {
  case is_word_complete(state.word_pair.english, state.guessed_letters) {
    True -> Won
    False ->
      case state.attempts_left <= 0 {
        True -> Lost
        False -> InProgress
      }
  }
}

// Make a guess and update the game state
pub fn make_guess(state: GameState, letter: String) -> GameState {
  let lowercase_letter = string.lowercase(letter)

  // Check if already guessed
  case list.contains(state.guessed_letters, lowercase_letter) {
    True -> state
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

// Play a single word
fn play_word(word_pair: WordPair) -> GameResult {
  let game = new_game(word_pair, max_attempts: 6)
  io.println("\n" <> string.repeat("=", 40))
  io.println("Catalan word: " <> word_pair.catalan)
  io.println(string.repeat("=", 40))

  play_word_loop(game)
}

// Game loop for a single word
fn play_word_loop(state: GameState) -> GameResult {
  // Check game status
  case game_result(state) {
    Won -> {
      io.println("\n🎉 Correct! The word is: " <> state.word_pair.english)
      Won
    }
    Lost -> {
      io.println("\n❌ Game Over! The word was: " <> state.word_pair.english)
      Lost
    }
    InProgress -> {
      // Display current state
      io.println("\nWord: " <> display_word(state.word_pair.english, state.guessed_letters))
      io.println("Attempts left: " <> string.inspect(state.attempts_left))
      io.println("Guessed letters: " <> string.join(state.guessed_letters, ", "))

      // Get user input
      io.print("\nGuess a letter: ")

      case input(prompt: "> ") {
        Ok(line) -> {
          let letter = string.trim(line)

          case string.length(letter) {
            1 -> {
              let new_state = make_guess(state, letter)

              // Give feedback
              case letter == string.lowercase(letter) && is_letter_in_word(letter, state.word_pair.english) {
                True -> io.println("✓ Good guess!")
                False -> case list.contains(state.guessed_letters, string.lowercase(letter)) {
                  True -> io.println("⚠ You already guessed that!")
                  False -> io.println("✗ Wrong letter!")
                }
              }

              play_word_loop(new_state)
            }
            _ -> {
              io.println("Please enter exactly one letter!")
              play_word_loop(state)
            }
          }
        }
        Error(_) -> {
          io.println("Error reading input!")
          Lost
        }
      }
    }
  }
}

pub fn main() {
  let words = [
    WordPair(catalan: "gat", english: "cat"),
    WordPair(catalan: "gos", english: "dog"),
    WordPair(catalan: "casa", english: "house"),
    WordPair(catalan: "aigua", english: "water"),
    WordPair(catalan: "menjar", english: "food"),
  ]

  io.println("\n🎮 Welcome to Mots! 🎮")
  io.println("Learn English words from Catalan")
  io.println("\nHow to play:")
  io.println("- You'll see a Catalan word")
  io.println("- Guess the English translation letter by letter")
  io.println("- You have 6 attempts per word")
  io.println("\nLet's start!\n")

  // Play through all words
  play_all_words(words, 0, 0)
}

fn play_all_words(words: List(WordPair), won: Int, lost: Int) -> Nil {
  case words {
    [] -> {
      // Game over - show final score
      io.println("\n" <> string.repeat("=", 40))
      io.println("🏁 Game Complete!")
      io.println(string.repeat("=", 40))
      io.println("Words won: " <> string.inspect(won))
      io.println("Words lost: " <> string.inspect(lost))
      let total = won + lost
      case total > 0 {
        True -> {
          let percentage = won * 100 / total
          io.println("Success rate: " <> string.inspect(percentage) <> "%")
        }
        False -> Nil
      }
      io.println("\nThanks for playing!")
    }
    [word, ..rest] -> {
      let result = play_word(word)
      case result {
        Won -> play_all_words(rest, won + 1, lost)
        Lost -> play_all_words(rest, won, lost + 1)
        InProgress -> play_all_words(rest, won, lost)
      }
    }
  }
}
