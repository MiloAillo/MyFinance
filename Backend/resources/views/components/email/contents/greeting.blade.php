<tr>
    <td style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #5C5D61; padding-bottom: 10px;">
        @if($slot)
            {{ $slot }}
        @else
            Hello!
        @endif
    </td>
</tr>