/**
 * Layercode CLI Tunnel Webhook Endpoint
 *
 * The Layercode CLI expects webhooks at /api/agent
 * This route re-exports the main webhook handler
 */

export { POST } from '../layercode/webhook/route'
export { dynamic } from '../layercode/webhook/route'
