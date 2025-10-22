/**
 * Layercode CLI Tunnel Endpoint for Batch Webhook
 *
 * The Layercode CLI expects webhooks at /api/agent by default.
 * For batch testing, we use /api/batch-agent to route to batch-webhook.
 *
 * Usage: Set webhook URL in Layercode dashboard to /api/batch-agent
 */

export { POST } from '../layercode/batch-webhook/route'
export { dynamic } from '../layercode/batch-webhook/route'
