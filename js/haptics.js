// haptics.js - Vibration API utilities for tactile feedback

// Check if vibration is supported
function isVibrationSupported() {
  return 'vibrate' in navigator;
}

// Success vibration pattern - short, cheerful double tap
export function vibrateSuccess() {
  if (!isVibrationSupported()) return;

  // Pattern: vibrate 50ms, pause 50ms, vibrate 50ms
  navigator.vibrate([50, 50, 50]);
}

// Error vibration pattern - longer, more noticeable buzz
export function vibrateError() {
  if (!isVibrationSupported()) return;

  // Pattern: vibrate 100ms, pause 50ms, vibrate 100ms
  navigator.vibrate([100, 50, 100]);
}

// Complete vibration - celebratory pattern
export function vibrateComplete() {
  if (!isVibrationSupported()) return;

  // Pattern: three short bursts
  navigator.vibrate([50, 50, 50, 50, 50]);
}

// Subtle tap for button press
export function vibrateTap() {
  if (!isVibrationSupported()) return;

  // Very short single vibration
  navigator.vibrate(10);
}

// Letter input feedback
export function vibrateLetterInput() {
  if (!isVibrationSupported()) return;

  // Very subtle, quick tap
  navigator.vibrate(5);
}

// Invalid action (like trying to submit incomplete word)
export function vibrateInvalid() {
  if (!isVibrationSupported()) return;

  // Pattern: three very short buzzes (error indication)
  navigator.vibrate([30, 30, 30, 30, 30]);
}
