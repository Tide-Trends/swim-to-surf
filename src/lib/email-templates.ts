export function getPrepEmailContent(swimmerName: string, instructorName: string, scheduleText: string, specificDays: string, bookingId: string, origin: string = "https://swimtosurf.com") {
  const parkingImage = `${origin}/images/parking-map.png`;
  const manageUrl = `${origin}/manage/${bookingId}`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1D1D1F; max-width: 560px; margin: 0 auto; line-height: 1.6;">
      
      <p style="font-size: 16px;">Here is everything you need to know before your first lesson!</p>
      
      <div style="margin: 24px 0; padding: 20px; background: #F5F5F7; border-radius: 12px; border: 1px solid #E8E8ED;">
        <p style="margin: 0 0 4px; font-size: 14px; color: #86868B; font-weight: 600; text-transform: uppercase;">Location & Address</p>
        <p style="margin: 0; font-size: 18px; color: #1D1D1F; font-weight: 500;">1299 N 500 W</p>
        <p style="margin: 0; font-size: 16px; color: #86868B;">American Fork, Utah 84003</p>
      </div>

      <h3 style="margin: 32px 0 16px; color: #1D1D1F; font-size: 18px; border-bottom: 2px solid #0077B6; padding-bottom: 8px; display: inline-block;">🚗 Parking Instructions (CRITICAL)</h3>
      
      <p style="font-size: 15px;">Please review the parking map below carefully. To keep our neighbors happy, we have strict rules regarding parking.</p>
      
      <div style="margin: 20px 0; border-radius: 12px; overflow: hidden; border: 2px solid #E8E8ED;">
        <img src="${parkingImage}" alt="Parking Map" style="width: 100%; height: auto; display: block;" />
      </div>

      <ul style="padding-left: 20px; font-size: 15px; margin: 0 0 24px;">
        <li style="margin-bottom: 8px;"><strong>Park ONLY in the pink rectangle</strong> (along the white fence).</li>
        <li style="margin-bottom: 8px; color: #EF476F;"><strong>Do NOT, under any circumstance, park in front of houses or mailboxes.</strong></li>
        <li style="margin-bottom: 8px;">Follow the white line on the map: Walk along the side of the house, down the hill, and straight to the pool.</li>
      </ul>

      <h3 style="margin: 32px 0 16px; color: #1D1D1F; font-size: 18px; border-bottom: 2px solid #0077B6; padding-bottom: 8px; display: inline-block;">🏠 Facility Rules</h3>
      <ul style="padding-left: 20px; font-size: 15px; margin: 0 0 24px;">
        <li style="margin-bottom: 8px;">Please be respectful of the property.</li>
        <li style="margin-bottom: 8px;"><strong>Please do not eat the strawberries!</strong> 🍓</li>
        <li style="margin-bottom: 8px;">Parents/Guardians are 100% responsible for watching their children while on the playground or trampoline. The instructor is only responsible for the child currently in the pool.</li>
      </ul>

      <h3 style="margin: 32px 0 16px; color: #1D1D1F; font-size: 18px; border-bottom: 2px solid #0077B6; padding-bottom: 8px; display: inline-block;">⏰ Schedule & Cancellation</h3>
      <p style="font-size: 15px; margin-bottom: 8px;">Your lessons are scheduled for:</p>
      <div style="margin: 16px 0; padding: 16px; background: #E8F4FD; border-radius: 8px; border: 1px solid #B8DFF0; font-size: 15px; color: #1D3557; font-weight: 500;">
        ${specificDays} @ ${scheduleText}
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <p style="font-size: 14px; color: #86868B; margin-bottom: 12px;">Need to cancel or reschedule?</p>
        <a href="${manageUrl}" style="display: inline-block; background: #F5F5F7; color: #1D1D1F; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 600; border: 1px solid #E8E8ED;">Manage Your Booking</a>
      </div>
      
      <p style="font-size: 16px; margin-top: 32px;">See you in the water! 🌊</p>
    </div>
  `;
}
