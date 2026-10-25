
type PasswordResetEmailProps = {
  otp: string;
  logoUrl: string;
};

export function passwordResetEmail({
  otp,
  logoUrl,
}: PasswordResetEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Your Trashure verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#eef6f0;font-family:Arial,Helvetica,sans-serif;color:#17251d;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your Trashure password reset code is ${otp}. It expires in five minutes.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef6f0;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #dce9df;border-radius:20px;overflow:hidden;">

          <tr>
            <td align="center" style="background:#123d2c;padding:30px 20px;">
              <img
                src="${logoUrl}"
                width="64"
                height="64"
                alt="Trashure logo"
                style="display:block;width:64px;height:64px;object-fit:contain;border:0;border-radius:14px;background:#ffffff;"
              />
              <h1 style="margin:14px 0 5px;color:#ffffff;font-size:25px;letter-spacing:3px;">
                TRASHURE
              </h1>
              <p style="margin:0;color:#c9e8d6;font-size:11px;letter-spacing:2px;">
                BY TEAM AURELOOP
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 24px 26px;">
              <p style="margin:0 0 10px;color:#16804b;font-size:11px;font-weight:bold;letter-spacing:2px;">
                ACCOUNT SECURITY
              </p>

              <h2 style="margin:0 0 14px;color:#17251d;font-size:26px;line-height:1.3;">
                Let's get you back in.
              </h2>

              <p style="margin:0 0 14px;color:#53645a;font-size:15px;line-height:1.8;">
                We received a request to reset your Trashure password.
                Use this one-time code to verify your request and continue.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="background:#f0f8f2;border:1px solid #c9e5d0;border-radius:16px;padding:25px 10px;">
                    <p style="margin:0 0 13px;color:#52725d;font-size:11px;font-weight:bold;letter-spacing:2px;">
                      YOUR VERIFICATION CODE
                    </p>

                    <p style="margin:0;color:#087443;font-size:36px;font-weight:bold;letter-spacing:7px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                      ${otp}
                    </p>

                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:15px auto 0;">
                      <tr>
                        <td style="background:#d9f0df;border-radius:20px;padding:7px 12px;color:#166534;font-size:12px;font-weight:bold;">
                          Expires in 5 minutes
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;color:#53645a;font-size:14px;line-height:1.8;">
                Enter this code on the Trashure password reset page.
                For your security, never share it with anyone.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top:1px solid #e5ece6;padding-top:18px;">
                    <p style="margin:0;color:#6b786f;font-size:12px;line-height:1.8;">
                      <strong>Didn't request a reset?</strong><br />
                      You can safely ignore this email. Your password won't
                      change unless the recovery process is completed.
                    </p>
                  </td>
                </tr>
              </table>

              <div style="padding-top:24px;text-align:center;">
                <p style="margin:0 0 5px;color:#234b35;font-size:14px;font-weight:bold;">
                  Team Aureloop
                </p>
                <p style="margin:0;color:#758078;font-size:12px;line-height:1.7;">
                  Building a more sustainable future.
                </p>
              </div>
            </td>
          </tr>
        </table>

        <p style="margin:16px 0 0;color:#829087;font-size:11px;line-height:1.7;text-align:center;">
          Automated account security email from Trashure.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
