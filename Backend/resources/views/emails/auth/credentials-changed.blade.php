<x-email.layout-without-footbar title="Your Credentials Have Been Changed">
  
  <!-- Heading -->
  <x-email.contents.header>
    <x-email.contents.subject>Your Credentials Have Been Changed</x-email.contents.subject>
    <x-email.contents.greeting />
    <x-email.contents.description>
      @if (!empty($field))
        Your account credentials have been changed, especially your {{ $field }}.
      @else
        Your account credentials have been changed.
      @endif
      <br>
      If you really did this change, no further action is required.
    </x-email.contents.description>
  <x-email.contents.salutation />
  </x-email.contents.header>

</x-email.layout-without-footbar>