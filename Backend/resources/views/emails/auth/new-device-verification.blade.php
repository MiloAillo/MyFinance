<x-email.layout title="New Device Login Verification" footer-action-text="a new device login verification">
  
  <!-- Heading -->
  <x-email.contents.header>
    <x-email.contents.subject>New Device Login Detected</x-email.contents.subject>
    <x-email.contents.greeting>Hello@if (!empty($name)), {{ $name }}@endif!</x-email.contents.greeting>
    <x-email.contents.description>
      Tap the button below to verify your new device, this verification link will expire in {{ $expiration }} minutes.<br>
      If you did not log in from another device, no further action is required or you can safely delete this email.
    </x-email.contents.description>
  </x-email.contents.header>

  <!-- Bulletproof & Rounded Button (Pure Hybrid Approach) -->
  <x-email.contents.url-button :action-url="$actionUrl">Verify New Device Login</x-email.contents.url-button>

  <!-- Alternative Link -->
  <x-email.contents.alternative-link :action-url="$actionUrl">
    <x-email.contents.salutation />
  </x-email.contents.alternative-link>

</x-email.layout>