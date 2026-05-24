<x-email.layout title="Reset Your Password" footer-action-text="a password reset">
  
  <!-- Heading -->
  <x-email.contents.header>
    <x-email.contents.subject>Reset Your Password</x-email.contents.subject>
    <x-email.contents.greeting />
    <x-email.contents.description>
      Tap the button below to reset your account password. This password reset link will expire in {{ $expiration }} minutes.<br>
    </x-email.contents.description>
  </x-email.contents.header>

  <!-- Bulletproof & Rounded Button (Pure Hybrid Approach) -->
  <x-email.contents.url-button :action-url="$actionUrl">Reset Password</x-email.contents.url-button>

  <!-- Alternative Link -->
  <x-email.contents.alternative-link :action-url="$actionUrl">
    <x-email.contents.salutation />
  </x-email.contents.alternative-link>

</x-email.layout>