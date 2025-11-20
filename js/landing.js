// landing.js - Landing page for first-time visitors

const LANDING_SEEN_KEY = 'mots_landing_seen';

// Check if user has seen the landing page
export function hasSeenLanding() {
  try {
    return localStorage.getItem(LANDING_SEEN_KEY) === 'true';
  } catch (error) {
    console.error('Error checking landing status:', error);
    return true; // Default to not showing landing if storage fails
  }
}

// Mark landing page as seen
export function markLandingAsSeen() {
  try {
    localStorage.setItem(LANDING_SEEN_KEY, 'true');
  } catch (error) {
    console.error('Error saving landing status:', error);
  }
}

// Render landing page
export function renderLanding() {
  return `
    <div class="landing-page">
      <!-- Hero Section -->
      <div class="landing-hero">
        <div class="landing-logo">🎓</div>
        <h1 class="landing-title">Welcome to Mots</h1>
        <p class="landing-subtitle">Master FAR Vocabulary Through Interactive Learning</p>
      </div>

      <!-- What is FAR Section -->
      <div class="landing-section">
        <h2 class="landing-section-title">What is FAR?</h2>
        <p class="landing-text">
          FAR (Fonètica, Alfabet i Ritme) is a comprehensive approach to language learning
          that emphasizes proper pronunciation, alphabet familiarity, and natural rhythm.
          Mots helps you build a strong vocabulary foundation through interactive exercises.
        </p>
      </div>

      <!-- Features Section -->
      <div class="landing-section">
        <h2 class="landing-section-title">How It Works</h2>
        <div class="landing-features">
          <div class="landing-feature">
            <div class="landing-feature-icon">📚</div>
            <h3 class="landing-feature-title">Study Mode</h3>
            <p class="landing-feature-text">
              Review vocabulary at your own pace with flashcards.
              Perfect for learning new words and reinforcing memory.
            </p>
          </div>

          <div class="landing-feature">
            <div class="landing-feature-icon">🎮</div>
            <h3 class="landing-feature-title">Play Mode</h3>
            <p class="landing-feature-text">
              Test your knowledge with timed challenges.
              Earn points and build streaks as you improve.
            </p>
          </div>

          <div class="landing-feature">
            <div class="landing-feature-icon">📊</div>
            <h3 class="landing-feature-title">Track Progress</h3>
            <p class="landing-feature-text">
              Monitor your learning journey with detailed statistics.
              Focus on words that need more practice.
            </p>
          </div>
        </div>
      </div>

      <!-- Learning Path Section -->
      <div class="landing-section">
        <h2 class="landing-section-title">Your Learning Path</h2>
        <div class="landing-steps">
          <div class="landing-step">
            <div class="landing-step-number">1</div>
            <p class="landing-step-text">Choose a topic that interests you</p>
          </div>
          <div class="landing-step-arrow">→</div>
          <div class="landing-step">
            <div class="landing-step-number">2</div>
            <p class="landing-step-text">Select study or play mode</p>
          </div>
          <div class="landing-step-arrow">→</div>
          <div class="landing-step">
            <div class="landing-step-number">3</div>
            <p class="landing-step-text">Learn and track your progress</p>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="landing-cta">
        <button class="landing-button" id="landing-get-started">
          Get Started
        </button>
      </div>
    </div>
  `;
}

// Setup landing page event listeners
export function setupLandingListeners(onGetStarted) {
  const button = document.getElementById('landing-get-started');
  if (button) {
    button.addEventListener('click', () => {
      markLandingAsSeen();
      onGetStarted();
    });
  }
}
