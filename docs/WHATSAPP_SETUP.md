# WhatsApp Cloud API Configuration Guide

To enable WhatsApp notifications, you need to configure the following credentials in your `.env` file:

## Required Environment Variables

```
WHATSAPP_ACCESS_TOKEN=your_永久_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

## How to Get These Credentials

### Step 1: Create a Meta Developer Account
1. Go to https://developers.facebook.com/
2. Sign up or log in with your Facebook account

### Step 2: Create an App
1. Go to "My Apps" → "Create App"
2. Select "Other" → "Business"
3. Give your app a name (e.g., "Moor Hall API")
4. Select "Skip" for now - we'll add products manually

### Step 3: Add WhatsApp Product
1. In your app dashboard, click "Add products to your app"
2. Find "WhatsApp" and click "Set up"
3. You'll see "WhatsApp" in the left sidebar

### Step 4: Get Credentials
In the WhatsApp → API Setup section:

1. **Temporary Access Token** - Shown in the "Quickstart" section
   - This is temporary (24 hours) but can be used for testing
   - For production, you need a permanent token (see below)

2. **Phone Number ID** - Found in "API Setup" → "Phone Numbers"
   - Copy this to `WHATSAPP_PHONE_NUMBER_ID`

3. **WhatsApp Business Account ID** - Also in API Setup
   - Note this for webhook configuration

### Step 5: Get Permanent Access Token (Recommended)
1. Go to Meta Business Manager: https://business.facebook.com/
2. Create or use an existing Business Account
3. In your App, go to "WhatsApp" → "API Setup"
4. Click "Configure" next to the temporary token
5. Follow prompts to generate a permanent token
6. Copy to `WHATSAPP_ACCESS_TOKEN`

### Step 6: Verify Your Phone Number
1. In the WhatsApp API Setup, verify a phone number
2. This phone number will receive the messages

## Testing Your Configuration

After adding credentials:
1. Restart your server
2. Create or update an order
3. Check logs for "WhatsApp notification sent successfully"

## Troubleshooting

- **"Invalid phone number"**: Check `WHATSAPP_DEFAULT_COUNTRY_CODE` (default is 250 for Rwanda)
- **"Phone number not verified"**: Verify the phone number in Meta Developer Portal
- **Token expired**: Regenerate a new permanent access token

## Example .env Values

```
# WhatsApp Cloud API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v21.0
WHATSAPP_ACCESS_TOKEN=EAAGyour_permanent_token_here
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=your_secure_webhook_verify_token
WHATSAPP_DEFAULT_COUNTRY_CODE=250
```

## Important Notes

1. The phone number used must be verified in your Meta App
2. The access token needs appropriate permissions (whatsapp_business_management, whatsapp_business_messaging)
3. For production, use permanent tokens, not temporary ones