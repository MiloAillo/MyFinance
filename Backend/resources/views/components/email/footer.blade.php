@props(['action' => 'this action'])

<!-- Footer (outside white box) -->
<tr>
  <td align="center" class="mobile-pad" style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #949CA5; line-height: 16px; padding: 20px 40px;">
    You received this email because we received a request for {{ $action }} for your account. If you didn't request {{ $action }} you can safely delete this email.
  </td>
</tr>