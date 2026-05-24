<x-email.layout title="Verify Your New Email Address" footer-action-text="a new email verification">
  
  <!-- Heading -->
  <x-email.contents.header>
    <x-email.contents.subject>Verify Your New Email Address</x-email.contents.subject>
    <x-email.contents.greeting />
    <x-email.contents.description>
      Tap the button below to verify your new email address. This verification link will expire in {{ $expiration }} minutes.<br>
    </x-email.contents.description>
  </x-email.contents.header>

  <!-- Bulletproof & Rounded Button (Pure Hybrid Approach) -->
  <x-email.contents.url-button :action-url="$actionUrl">Verify New Email</x-email.contents.url-button>

  <!-- Alternative Link -->
  <x-email.contents.alternative-link :action-url="$actionUrl">
    <x-email.contents.salutation />
  </x-email.contents.alternative-link>

</x-email.layout>