<tr>
    <td style="font-family: 'Inter', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #32333A; padding-bottom: 20px;">
        @if($slot->isNotEmpty())
            {{ $slot }}
        @else
            Email Notification
        @endif
    </td>
</tr>