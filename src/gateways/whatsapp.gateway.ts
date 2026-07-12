import axios, { AxiosError, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * WhatsApp Gateway - Integration with Meta WhatsApp Cloud API
 * 
 * This gateway handles communication with the WhatsApp Cloud API provider.
 * It is designed to be provider-agnostic, but currently configured for Meta's API.
 */

export interface WhatsAppMessagePayload {
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

export interface WhatsAppResponse {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
}

export interface WhatsAppApiResponse {
  messaging_product: string;
  to: string;
  type: string;
  message_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: WhatsAppApiResponse;
}

/**
 * WhatsApp Gateway class for sending messages via Meta WhatsApp Cloud API
 */
export class WhatsAppGateway {
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly defaultCountryCode: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.defaultCountryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '250';

    if (!this.accessToken) {
      console.warn('WhatsApp Gateway: WHATSAPP_ACCESS_TOKEN not configured');
    }
    if (!this.phoneNumberId) {
      console.warn('WhatsApp Gateway: WHATSAPP_PHONE_NUMBER_ID not configured');
    }
  }

  /**
   * Format phone number to E.164 format
   * @param phone - Phone number in various formats
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If already starts with country code
    if (digits.startsWith('250')) {
      return `+${digits}`;
    }

    // If starts with 0, remove it and add country code
    if (digits.startsWith('0')) {
      return `+${this.defaultCountryCode}${digits.substring(1)}`;
    }

    // If it's just the local number without 0
    if (digits.length === 8) {
      return `+${this.defaultCountryCode}${digits}`;
    }

    // If already has country code without +
    if (digits.length > 8) {
      return `+${digits}`;
    }

    // Default fallback
    return `+${this.defaultCountryCode}${digits}`;
  }

  /**
   * Send a text message via WhatsApp API
   * @param to - Recipient phone number
   * @param message - Message text
   */
  async sendTextMessage(to: string, message: string): Promise<WhatsAppSendResult> {
    if (!this.accessToken || !this.phoneNumberId) {
      return {
        success: false,
        error: 'WhatsApp provider not configured',
      };
    }

    const formattedPhone = this.formatPhoneNumber(to);

    const payload: WhatsAppMessagePayload = {
      to: formattedPhone,
      type: 'text',
      text: {
        body: message,
      },
    };

    try {
      const response: AxiosResponse<WhatsAppApiResponse> = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.message_id) {
        return {
          success: true,
          messageId: response.data.message_id,
          rawResponse: response.data,
        };
      }

      return {
        success: false,
        error: 'No message ID returned from provider',
        rawResponse: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError<WhatsAppApiResponse>;
      
      if (axiosError.response?.data?.error) {
        const providerError = axiosError.response.data.error;
        return {
          success: false,
          error: providerError.message,
          rawResponse: axiosError.response.data,
        };
      }

      return {
        success: false,
        error: axiosError.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Send a template message via WhatsApp API
   * @param to - Recipient phone number
   * @param templateName - Template name
   * @param parameters - Template parameters
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: string[] = []
  ): Promise<WhatsAppSendResult> {
    if (!this.accessToken || !this.phoneNumberId) {
      return {
        success: false,
        error: 'WhatsApp provider not configured',
      };
    }

    const formattedPhone = this.formatPhoneNumber(to);

    const components = parameters.length > 0 ? [
      {
        type: 'body',
        parameters: parameters.map(param => ({
          type: 'text' as const,
          text: param,
        })),
      },
    ] : undefined;

    const payload: WhatsAppMessagePayload = {
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en_US',
        },
        components,
      },
    };

    try {
      const response: AxiosResponse<WhatsAppApiResponse> = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.message_id) {
        return {
          success: true,
          messageId: response.data.message_id,
          rawResponse: response.data,
        };
      }

      return {
        success: false,
        error: 'No message ID returned from provider',
        rawResponse: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError<WhatsAppApiResponse>;
      
      if (axiosError.response?.data?.error) {
        const providerError = axiosError.response.data.error;
        return {
          success: false,
          error: providerError.message,
          rawResponse: axiosError.response.data,
        };
      }

      return {
        success: false,
        error: axiosError.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Verify webhook token from Meta
   * @param mode - Webhook mode
   * @param token - Verify token
   * @param challenge - Challenge string
   */
  verifyWebhook(mode: string, token: string, challenge?: string): string | null {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge || uuidv4();
    }
    
    return null;
  }

  /**
   * Check if WhatsApp is properly configured
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
  }
}

// Export singleton instance
export default new WhatsAppGateway();
