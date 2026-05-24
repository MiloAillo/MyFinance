@props(['title' => 'Email Notification', 'footerActionText' => 'this action'])

<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>{{ $title }} - {{ config('app.name') }}</title>
  
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->

  <style type="text/css">
    /* Reset & Typography Setup */
    body, table, td, a { 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      /* font-family: 'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif; */
    }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F1F6FF; }
    
    /* Prevent iOS from making links blue */
    a[x-apple-data-detectors] { 
      color: inherit !important; 
      text-decoration: none !important; 
      font-size: inherit !important; 
      font-family: inherit !important; 
      font-weight: inherit !important; 
      line-height: inherit !important; 
    }

    /* Media Query only for Mobile */
    @media screen and (max-width: 600px) {
      .fluid-container { width: 100% !important; max-width: 100% !important; }
      .mobile-pad { padding: 24px 20px !important; } /* Adjusted to be proportional to the top/bottom gradation */
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F6FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Main Wrapper -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #F1F6FF;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        
        <!-- [Outlook Ghost Table] -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->

        <!-- Container Fluid / Hybrid (max width 600px, 100% on mobile) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="fluid-container" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Component: Header / Logo -->
          <x-email.header />

          <!-- Main Content Box -->
          <tr>
            <td style="padding: 0;">
              
              <!-- White Table of Contents Wrapper with Gradient (Bulletproof) -->
              <!-- border-collapse: separate is required for border-radius to work in Apple Mail -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border-radius: 8px; border-collapse: separate !important; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                
                <!-- TOP Gradient Bar -->
                <tr>
                  <td height="6" style="height: 6px; line-height: 6px; font-size: 6px; background-color: #7C3AED; background-image: linear-gradient(to right, #9333EA, #3DD5C1); mso-line-height-rule: exactly;">
                    &nbsp;
                  </td>
                </tr>

                <!-- Content Slot -->
                <tr>
                  <td class="mobile-pad" style="padding: 34px 40px 34px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333; font-size: 16px; line-height: 1.6;">
                    {{ $slot }}
                  </td>
                </tr>

                <!-- BOTTOM Gradient Bar -->
                <tr>
                  <td height="6" style="height: 6px; line-height: 6px; font-size: 6px; background-color: #7C3AED; background-image: linear-gradient(to right, #4F46E5, #9333EA); mso-line-height-rule: exactly;">
                    &nbsp;
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Component: Footer -->
          <x-email.footer :action="$footerActionText" />
          
          <tr>
            <td align="center" class="mobile-pad" style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #949CA5; line-height: 16px; padding: 0 40px 20px;">
              &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </td>
          </tr>

        </table>

        <!-- [Outlook Ghost Table Closing] -->
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>