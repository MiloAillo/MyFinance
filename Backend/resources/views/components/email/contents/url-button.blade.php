@props(['actionUrl' => '#'])
<!-- Bulletproof & Rounded Button (Pure Hybrid Approach) -->
<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding-bottom: 40px;">
      <div>
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" href="{{ $actionUrl }}" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="10%" stroke="f" fillcolor="#625EBD">
          <w:anchorlock/>
          <center style="color:#FFFFFF;font-family:'Inter', Arial, sans-serif;font-size:14px;font-weight:700;">
            @if($slot->isNotEmpty())
              {{ $slot }}
            @else
              Click Here
            @endif
          </center>
        </v:roundrect>
        <![endif]-->
        
        <!--[if !mso]><!-->
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" bgcolor="#625EBD" style="border-radius: 4px;">
              <a href="{{ $actionUrl }}" target="_blank" rel="noopener noreferrer" style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 4px; display: inline-block;">
                @if($slot->isNotEmpty())
                  {{ $slot }}
                @else
                  Click Here
                @endif
              </a>
            </td>
          </tr>
        </table>
        <!--<![endif]-->
      </div>
    </td>
  </tr>
</table>