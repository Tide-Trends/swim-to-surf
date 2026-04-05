const ADDRESS_LINE = "1299 N 500 W, American Fork, UT 84003";

/**
 * Arrival: full street address, parking map image, parking rules, playground / facility notes.
 * Used in the first booking confirmation and in reminder emails.
 */
export function getArrivalDetailsHtml(origin: string = "https://swimtosurf.com"): string {
  const parkingImage = `${origin.replace(/\/$/, "")}/images/parking-map.png`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto; line-height: 1.6;">

      <h2 style="margin: 0 0 12px; color: #1D1D1F; font-size: 20px;">Where to go</h2>
      <div style="margin: 0 0 24px; padding: 20px; background: #E8F4FD; border-radius: 12px; border: 1px solid #B8DFF0;">
        <p style="margin: 0 0 6px; font-size: 14px; color: #005f8a; font-weight: 700; text-transform: uppercase;">Lesson address</p>
        <p style="margin: 0; font-size: 20px; color: #1D3557; font-weight: 600;">1299 N 500 W</p>
        <p style="margin: 6px 0 0; font-size: 16px; color: #1D3557;">American Fork, Utah 84003</p>
      </div>

      <h3 style="margin: 28px 0 12px; color: #1D1D1F; font-size: 18px; border-bottom: 2px solid #0077B6; padding-bottom: 8px; display: inline-block;">Parking (please read)</h3>
      <p style="font-size: 15px;">Use the map below. We share a neighborhood — parking in the wrong spot creates problems for neighbors.</p>
      <div style="margin: 16px 0; border-radius: 12px; overflow: hidden; border: 2px solid #E8E8ED;">
        <img src="${parkingImage}" alt="Parking map — park only in the marked area along the fence" width="560" style="width: 100%; max-width: 560px; height: auto; display: block;" />
      </div>
      <ul style="padding-left: 20px; font-size: 15px; margin: 0 0 24px;">
        <li style="margin-bottom: 8px;"><strong>Park only in the pink rectangle</strong> along the white fence (see map).</li>
        <li style="margin-bottom: 8px; color: #c41e3a;"><strong>Do not park in front of houses, driveways, or mailboxes.</strong></li>
        <li style="margin-bottom: 8px;">Follow the path on the map: along the side of the house, down toward the pool.</li>
      </ul>

      <h3 style="margin: 28px 0 12px; color: #1D1D1F; font-size: 18px; border-bottom: 2px solid #0077B6; padding-bottom: 8px; display: inline-block;">Playground &amp; property</h3>
      <ul style="padding-left: 20px; font-size: 15px; margin: 0 0 24px;">
        <li style="margin-bottom: 8px;">There is a <strong>playground</strong> on site. Parents and guardians must <strong>supervise</strong> children there at all times — the instructor is responsible only for the swimmer in the pool during their lesson.</li>
        <li style="margin-bottom: 8px;">Please be respectful of the home and yard.</li>
        <li style="margin-bottom: 8px;"><strong>Please do not pick the strawberries</strong> in the garden. 🍓</li>
      </ul>
    </div>
  `;
}

/**
 * Schedule recap + manage link. Reminder cron emails can prepend {@link getArrivalDetailsHtml}.
 */
export function getPrepEmailContent(
  swimmerName: string,
  instructorName: string,
  scheduleText: string,
  specificDays: string,
  bookingId: string,
  origin: string = "https://swimtosurf.com"
) {
  const base = origin.replace(/\/$/, "");
  const manageUrl = `${base}/manage/${bookingId}`;

  return `
    ${getArrivalDetailsHtml(base)}
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto; line-height: 1.6;">

      <h3 style="margin: 32px 0 16px; color: #1D1D1F; font-size: 18px; border-bottom: 2px solid #0077B6; padding-bottom: 8px; display: inline-block;">Your schedule</h3>
      <p style="font-size: 15px; margin-bottom: 8px;">Lessons with <strong>${instructorName}</strong>:</p>
      <div style="margin: 16px 0; padding: 16px; background: #E8F4FD; border-radius: 8px; border: 1px solid #B8DFF0; font-size: 15px; color: #1D3557; font-weight: 500;">
        ${specificDays}<br/><span style="font-weight: 600;">${scheduleText}</span>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <p style="font-size: 14px; color: #555; margin-bottom: 12px;">Need to cancel or reschedule?</p>
        <a href="${manageUrl}" style="display: inline-block; background: #0a4a5c; color: #ffffff !important; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-size: 15px; font-weight: 700;">Manage your booking</a>
      </div>

      <p style="font-size: 16px; margin-top: 28px;">See you in the water! 🌊</p>
      <p style="font-size: 13px; color: #555; margin-top: 16px;">${ADDRESS_LINE}</p>
    </div>
  `;
}

/** Single CTA block for confirmation emails (arrival details are separate). */
export function getManageBookingLinkHtml(bookingId: string, origin: string = "https://swimtosurf.com"): string {
  const base = origin.replace(/\/$/, "");
  const manageUrl = `${base}/manage/${bookingId}`;
  return `
    <div style="text-align: center; margin: 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <p style="font-size: 14px; color: #555; margin-bottom: 12px;">Cancel, reschedule, or update your booking anytime:</p>
      <a href="${manageUrl}" style="display: inline-block; background: #0a4a5c; color: #ffffff !important; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-size: 15px; font-weight: 700;">Manage your booking</a>
    </div>
  `;
}
